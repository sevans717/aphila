import Stripe from "stripe";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { prisma } from "../lib/prisma";

const p = prisma as any;

const stripeSecret = (env as any).stripeSecret || process.env.STRIPE_SECRET_KEY;

if (!stripeSecret && !env.disablePayments) {
  logger.warn(
    "Stripe secret not set — payments may be disabled or misconfigured"
  );
}

const stripe = new Stripe(stripeSecret || "", { apiVersion: "2022-11-15" });

export async function createStripeCheckoutSession(
  customerEmail: string | undefined,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: customerEmail,
  });

  return session;
}

export function constructEvent(payload: Buffer, sig: string) {
  const webhookSecret =
    (env as any).stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("Stripe webhook secret not configured");
  return stripe.webhooks.constructEvent(payload, sig, webhookSecret);
}

export async function handleStripeEvent(event: Stripe.Event) {
  // Keep this minimal — delegate to subscription logic elsewhere
  logger.info(`Received Stripe event: ${event.type}`);
  // Idempotency: skip events we've already processed
  try {
    const existing = await p.processedWebhookEvent.findUnique({
      where: { eventId: event.id },
    });
    if (existing) {
      logger.info(`Stripe event ${event.id} already processed, skipping`);
      return;
    }
    // Record the event pre-emptively to avoid race conditions
    await p.processedWebhookEvent.create({
      data: { eventId: event.id, payload: event as any },
    });
  } catch (err: any) {
    logger.error("Failed to record processed webhook event", {
      err: err.message || err,
    });
    // proceed — don't block processing, but be cautious
  }
  switch (event.type) {
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      // Try to find subscription by stripeCustomerId or stripeSubscriptionId
      try {
        const stripeSubId = invoice.subscription as string | undefined;
        const customerId = invoice.customer as string | undefined;

        // Update subscription record if we can find it
        if (stripeSubId) {
          await p.subscription.updateMany({
            where: { stripeSubscriptionId: stripeSubId },
            data: { isActive: true, lastInvoiceId: invoice.id },
          });
        } else if (customerId) {
          await p.subscription.updateMany({
            where: { stripeCustomerId: customerId },
            data: { isActive: true, lastInvoiceId: invoice.id },
          });
        }

        // Persist invoice record for auditing/reconciliation
        try {
          // attempt to link by subscription or customer
          const stripeSubId = invoice.subscription as string | undefined;
          const customerId = invoice.customer as string | undefined;
          let userId: string | undefined;
          let subscriptionId: string | undefined;

          if (stripeSubId) {
            const sub = await p.subscription.findFirst({
              where: { stripeSubscriptionId: stripeSubId },
            });
            if (sub) {
              userId = sub.userId;
              subscriptionId = sub.id;
            }
          }
          if (!userId && customerId) {
            const sub = await p.subscription.findFirst({
              where: { stripeCustomerId: customerId },
            });
            if (sub) {
              userId = sub.userId;
              subscriptionId = sub.id;
            }
          }

          await p.invoice.upsert({
            where: { stripeInvoiceId: invoice.id },
            update: {
              amountPaid: invoice.amount_paid ?? undefined,
              currency: invoice.currency ?? undefined,
              status: invoice.status ?? undefined,
              subscriptionId: subscriptionId ?? undefined,
              userId: userId ?? undefined,
            },
            create: {
              stripeInvoiceId: invoice.id,
              amountPaid: invoice.amount_paid ?? undefined,
              currency: invoice.currency ?? undefined,
              status: invoice.status ?? undefined,
              subscriptionId: subscriptionId ?? undefined,
              userId: userId ?? undefined,
            },
          });
          // Persist charge/payment intent if present
          try {
            const chargeId = (invoice.charge as string) || undefined;
            const paymentIntentId =
              (invoice.payment_intent as string) || undefined;
            if (chargeId || paymentIntentId) {
              // Attempt to fetch charge details from Stripe if we have a charge id
              let chargeObj: Stripe.Charge | null = null;
              if (chargeId) {
                try {
                  chargeObj = (await stripe.charges.retrieve(
                    chargeId
                  )) as Stripe.Charge;
                } catch (err: any) {
                  logger.debug("Unable to retrieve charge from Stripe", {
                    err: err.message || err,
                  });
                }
              }

              // Create or upsert a Charge record
              await p.charge.upsert({
                where: {
                  stripeChargeId: (chargeId ??
                    paymentIntentId ??
                    `pi__${invoice.id}`) as string,
                },
                update: {
                  paymentIntentId: paymentIntentId ?? undefined,
                  amount: chargeObj?.amount ?? invoice.amount_paid ?? undefined,
                  currency:
                    chargeObj?.currency ?? invoice.currency ?? undefined,
                  status: chargeObj?.status ?? invoice.status ?? undefined,
                  paymentMethod: chargeObj?.payment_method_details
                    ? JSON.stringify(chargeObj.payment_method_details)
                    : undefined,
                },
                create: {
                  stripeChargeId: (chargeId ??
                    paymentIntentId ??
                    `pi__${invoice.id}`) as string,
                  paymentIntentId: paymentIntentId ?? undefined,
                  amount: chargeObj?.amount ?? invoice.amount_paid ?? undefined,
                  currency:
                    chargeObj?.currency ?? invoice.currency ?? undefined,
                  status: chargeObj?.status ?? invoice.status ?? undefined,
                  paymentMethod: chargeObj?.payment_method_details
                    ? JSON.stringify(chargeObj.payment_method_details)
                    : undefined,
                  invoiceId: (
                    await p.invoice.findUnique({
                      where: { stripeInvoiceId: invoice.id },
                    })
                  )?.id,
                },
              });
            }
          } catch (err: any) {
            logger.debug("Failed to persist charge", {
              err: err.message || err,
            });
          }
        } catch (err: any) {
          logger.error("Failed to persist invoice", {
            err: err.message || err,
          });
        }

        // Create a notification for the user(s)
        // Find subscriptions matching invoice
        const subs = await p.subscription.findMany({
          where: {
            OR: [
              { stripeSubscriptionId: stripeSubId },
              { stripeCustomerId: customerId },
            ],
          },
        });
        for (const s of subs) {
          await p.notification.create({
            data: {
              userId: s.userId,
              type: "billing",
              title: "Payment Received",
              body: `Payment for invoice ${invoice.id} succeeded.`,
              data: { invoiceId: invoice.id, amount: invoice.amount_paid },
            },
          });
        }
      } catch (err: any) {
        logger.error("Error handling invoice.payment_succeeded", {
          err: err.message || err,
        });
      }
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      try {
        const stripeSubId = invoice.subscription as string | undefined;
        const customerId = invoice.customer as string | undefined;

        // Persist invoice and mark subscription inactive
        try {
          const stripeSubId = invoice.subscription as string | undefined;
          const customerId = invoice.customer as string | undefined;
          let userId: string | undefined;
          let subscriptionId: string | undefined;

          if (stripeSubId) {
            const sub = await p.subscription.findFirst({
              where: { stripeSubscriptionId: stripeSubId },
            });
            if (sub) {
              userId = sub.userId;
              subscriptionId = sub.id;
            }
            await p.subscription.updateMany({
              where: { stripeSubscriptionId: stripeSubId },
              data: { isActive: false },
            });
          } else if (customerId) {
            const sub = await p.subscription.findFirst({
              where: { stripeCustomerId: customerId },
            });
            if (sub) {
              userId = sub.userId;
              subscriptionId = sub.id;
            }
            await p.subscription.updateMany({
              where: { stripeCustomerId: customerId },
              data: { isActive: false },
            });
          }

          await p.invoice.upsert({
            where: { stripeInvoiceId: invoice.id },
            update: {
              amountPaid: invoice.amount_paid ?? undefined,
              currency: invoice.currency ?? undefined,
              status: invoice.status ?? undefined,
              subscriptionId: subscriptionId ?? undefined,
              userId: userId ?? undefined,
            },
            create: {
              stripeInvoiceId: invoice.id,
              amountPaid: invoice.amount_paid ?? undefined,
              currency: invoice.currency ?? undefined,
              status: invoice.status ?? undefined,
              subscriptionId: subscriptionId ?? undefined,
              userId: userId ?? undefined,
            },
          });
        } catch (err: any) {
          logger.error("Failed to persist invoice on failed payment", {
            err: err.message || err,
          });
        }

        const subs = await p.subscription.findMany({
          where: {
            OR: [
              { stripeSubscriptionId: stripeSubId },
              { stripeCustomerId: customerId },
            ],
          },
        });
        for (const s of subs) {
          await p.notification.create({
            data: {
              userId: s.userId,
              type: "billing",
              title: "Payment Failed",
              body: `Payment for invoice ${invoice.id} failed. Please update your payment method.`,
              data: { invoiceId: invoice.id },
            },
          });
        }
      } catch (err: any) {
        logger.error("Error handling invoice.payment_failed", {
          err: err.message || err,
        });
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      try {
        // Find local subscription by stripeCustomerId or stripeSubscriptionId
        const stripeSubId = sub.id;
        const customerId = (sub.customer as string) || undefined;

        // Map Stripe status to our isActive/endDate
        const isActive = sub.status === "active" || sub.status === "trialing";
        const endDate = sub.current_period_end
          ? new Date(sub.current_period_end * 1000)
          : null;

        // Update any matching subscription records
        await p.subscription.updateMany({
          where: {
            OR: [
              { stripeSubscriptionId: stripeSubId },
              { stripeCustomerId: customerId },
            ],
          },
          data: {
            isActive,
            endDate: endDate as any,
            stripeSubscriptionId: stripeSubId,
            stripeCustomerId: customerId,
          },
        });
        // Also ensure any matching invoices are linked to this subscription id
        try {
          if (stripeSubId) {
            const subRec = await p.subscription.findFirst({
              where: { stripeSubscriptionId: stripeSubId },
            });
            if (subRec) {
              const potentialInvoices = await p.invoice.findMany({
                select: {
                  id: true,
                  subscriptionId: true,
                  stripeInvoiceId: true,
                },
              });
              const invoicesToLink = potentialInvoices
                .filter((i) => i.stripeInvoiceId && !i.subscriptionId)
                .map((i) => i.id);
              if (invoicesToLink.length > 0) {
                await p.invoice.updateMany({
                  where: { id: { in: invoicesToLink } },
                  data: { subscriptionId: subRec.id },
                });
              }
            }
          }
        } catch (err: any) {
          logger.debug("Failed to link invoices to subscription", {
            err: err.message || err,
          });
        }
      } catch (err: any) {
        logger.error("Error handling customer.subscription.*", {
          err: err.message || err,
        });
      }
      break;
    }
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      try {
        const customerId = session.customer as string | undefined;
        const subscriptionId = session.subscription as string | undefined;
        const customerEmail =
          session.customer_email ||
          (session.customer_details && (session.customer_details as any).email);

        if (customerEmail) {
          // Attempt to find a user by email and attach stripe ids to their subscription
          const user = await p.user.findUnique({
            where: { email: customerEmail },
          });
          if (user) {
            await p.subscription.updateMany({
              where: { userId: user.id },
              data: {
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                isActive: true,
              } as any,
            });
          }
        }
      } catch (err: any) {
        logger.error("Error handling checkout.session.completed", {
          err: err.message || err,
        });
      }
      break;
    }
    default:
      logger.info(`Unhandled stripe event: ${event.type}`);
  }
}

export default stripe;
