import Stripe from "stripe";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { prisma } from "../lib/prisma";

const p = prisma as any;

const stripeSecret =
  (env as any).stripeSecretKey || process.env.STRIPE_SECRET_KEY;

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

// Create or retrieve Stripe customer
export async function createOrRetrieveCustomer(email: string, name?: string) {
  try {
    // Try to find existing customer
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0];
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name: name || email,
    });

    return customer;
  } catch (error: any) {
    logger.error("Error creating/retrieving Stripe customer", {
      err: error.message || err,
      email,
    });
    throw error;
  }
}

// Create subscription for customer
export async function createSubscription(
  customerId: string,
  priceId: string,
  paymentMethodId?: string
) {
  try {
    const subscriptionData: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    };

    if (paymentMethodId) {
      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      subscriptionData.default_payment_method = paymentMethodId;
    }

    const subscription = await stripe.subscriptions.create(subscriptionData);

    return subscription;
  } catch (error: any) {
    logger.error("Error creating Stripe subscription", {
      err: error.message || err,
      customerId,
      priceId,
    });
    throw error;
  }
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    return subscription;
  } catch (error: any) {
    logger.error("Error canceling Stripe subscription", {
      err: error.message || err,
      subscriptionId,
    });
    throw error;
  }
}

// Update subscription (change plan)
export async function updateSubscription(
  subscriptionId: string,
  newPriceId: string
) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Update the subscription item with new price
    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: "create_prorations",
      }
    );

    return updatedSubscription;
  } catch (error: any) {
    logger.error("Error updating Stripe subscription", {
      err: error.message || err,
      subscriptionId,
      newPriceId,
    });
    throw error;
  }
}

// Get subscription details
export async function getSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["latest_invoice", "customer"],
    });

    return subscription;
  } catch (error: any) {
    logger.error("Error retrieving Stripe subscription", {
      err: error.message || err,
      subscriptionId,
    });
    throw error;
  }
}

// Create setup intent for saving payment methods
export async function createSetupIntent(customerId: string) {
  try {
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
    });

    return setupIntent;
  } catch (error: any) {
    logger.error("Error creating setup intent", {
      err: error.message || err,
      customerId,
    });
    throw error;
  }
}

// Get customer's payment methods
export async function getCustomerPaymentMethods(customerId: string) {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });

    return paymentMethods;
  } catch (error: any) {
    logger.error("Error retrieving customer payment methods", {
      err: error.message || err,
      customerId,
    });
    throw error;
  }
}

// Detach payment method
export async function detachPaymentMethod(paymentMethodId: string) {
  try {
    const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);
    return paymentMethod;
  } catch (error: any) {
    logger.error("Error detaching payment method", {
      err: error.message || err,
      paymentMethodId,
    });
    throw error;
  }
}

// Create customer portal session
export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session;
  } catch (error: any) {
    logger.error("Error creating customer portal session", {
      err: error.message || err,
      customerId,
    });
    throw error;
  }
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
      // Log successful payment
      logger.info(`Payment succeeded for invoice ${invoice.id}`, {
        amount: invoice.amount_paid,
        currency: invoice.currency,
        customer: invoice.customer,
      });

      try {
        const stripeSubId = invoice.subscription as string | undefined;
        const customerId = invoice.customer as string | undefined;

        // Update subscription record if we can find it
        if (stripeSubId) {
          await p.subscription.updateMany({
            where: { stripeSubscriptionId: stripeSubId },
            data: {
              isActive: true,
              lastInvoiceId: invoice.id,
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Extend by 30 days
            },
          });
        } else if (customerId) {
          await p.subscription.updateMany({
            where: { stripeCustomerId: customerId },
            data: {
              isActive: true,
              lastInvoiceId: invoice.id,
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Extend by 30 days
            },
          });
        }

        // Find user to send notification
        let userId: string | undefined;
        if (stripeSubId) {
          const sub = await p.subscription.findFirst({
            where: { stripeSubscriptionId: stripeSubId },
          });
          userId = sub?.userId;
        } else if (customerId) {
          const sub = await p.subscription.findFirst({
            where: { stripeCustomerId: customerId },
          });
          userId = sub?.userId;
        }

        if (userId) {
          await p.notification.create({
            data: {
              userId,
              type: "billing",
              title: "Payment Successful",
              body: `Your payment of ${(invoice.amount_paid || 0) / 100} ${invoice.currency?.toUpperCase()} has been processed successfully.`,
              data: {
                invoiceId: invoice.id,
                amount: invoice.amount_paid,
                currency: invoice.currency,
                invoiceUrl: invoice.hosted_invoice_url,
              },
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
      logger.warn(`Payment failed for invoice ${invoice.id}`, {
        amount: invoice.amount_due,
        currency: invoice.currency,
        customer: invoice.customer,
        attemptCount: invoice.attempt_count,
      });

      try {
        const stripeSubId = invoice.subscription as string | undefined;
        const customerId = invoice.customer as string | undefined;

        // Find subscription and user
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
        } else if (customerId) {
          const sub = await p.subscription.findFirst({
            where: { stripeCustomerId: customerId },
          });
          if (sub) {
            userId = sub.userId;
            subscriptionId = sub.id;
          }
        }

        // Update subscription status if this is a recurring payment failure
        if (subscriptionId) {
          await p.subscription.update({
            where: { id: subscriptionId },
            data: {
              isActive: false, // Mark as inactive due to payment failure
              lastInvoiceId: invoice.id,
            },
          });
        }

        // Send notification to user
        if (userId) {
          await p.notification.create({
            data: {
              userId,
              type: "billing",
              title: "Payment Failed",
              body: `Your payment of ${(invoice.amount_due || 0) / 100} ${invoice.currency?.toUpperCase()} has failed. Please update your payment method.`,
              data: {
                invoiceId: invoice.id,
                amount: invoice.amount_due,
                currency: invoice.currency,
                invoiceUrl: invoice.hosted_invoice_url,
                attemptCount: invoice.attempt_count,
              },
            },
          });
        }

        // Persist failed invoice
        await p.invoice.upsert({
          where: { stripeInvoiceId: invoice.id },
          update: {
            amountDue: invoice.amount_due ?? undefined,
            currency: invoice.currency ?? undefined,
            status: invoice.status ?? undefined,
            subscriptionId: subscriptionId ?? undefined,
            userId: userId ?? undefined,
          },
          create: {
            stripeInvoiceId: invoice.id,
            amountDue: invoice.amount_due ?? undefined,
            currency: invoice.currency ?? undefined,
            status: invoice.status ?? undefined,
            subscriptionId: subscriptionId ?? undefined,
            userId: userId ?? undefined,
          },
        });
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
    case "customer.subscription.trial_will_end": {
      const sub = event.data.object as Stripe.Subscription;
      logger.info(`Trial ending soon for subscription ${sub.id}`, {
        trialEnd: sub.trial_end,
        customer: sub.customer,
      });

      try {
        const stripeSubId = sub.id;
        const customerId = (sub.customer as string) || undefined;

        // Find user to send notification
        let userId: string | undefined;
        if (stripeSubId) {
          const localSub = await p.subscription.findFirst({
            where: { stripeSubscriptionId: stripeSubId },
          });
          userId = localSub?.userId;
        } else if (customerId) {
          const localSub = await p.subscription.findFirst({
            where: { stripeCustomerId: customerId },
          });
          userId = localSub?.userId;
        }

        if (userId) {
          const trialEndDate = sub.trial_end
            ? new Date(sub.trial_end * 1000)
            : null;
          await p.notification.create({
            data: {
              userId,
              type: "billing",
              title: "Trial Ending Soon",
              body: `Your trial period will end ${trialEndDate ? `on ${trialEndDate.toDateString()}` : "soon"}. Please add a payment method to continue your subscription.`,
              data: {
                subscriptionId: stripeSubId,
                trialEnd: trialEndDate,
                customerId: customerId,
              },
            },
          });
        }
      } catch (err: any) {
        logger.error("Error handling customer.subscription.trial_will_end", {
          err: err.message || err,
        });
      }
      break;
    }

    case "payment_method.attached": {
      const paymentMethod = event.data.object as Stripe.PaymentMethod;
      logger.info(`Payment method attached: ${paymentMethod.id}`, {
        customer: paymentMethod.customer,
        type: paymentMethod.type,
      });

      try {
        const customerId = paymentMethod.customer as string | undefined;
        if (customerId) {
          // Update subscription to reflect that payment method is now available
          await p.subscription.updateMany({
            where: { stripeCustomerId: customerId },
            data: {
              // Could add a field to track payment method status if needed
            },
          });

          // Find user to send notification
          const localSub = await p.subscription.findFirst({
            where: { stripeCustomerId: customerId },
          });
          if (localSub) {
            await p.notification.create({
              data: {
                userId: localSub.userId,
                type: "billing",
                title: "Payment Method Added",
                body: `A new payment method has been added to your account.`,
                data: {
                  paymentMethodId: paymentMethod.id,
                  type: paymentMethod.type,
                },
              },
            });
          }
        }
      } catch (err: any) {
        logger.error("Error handling payment_method.attached", {
          err: err.message || err,
        });
      }
      break;
    }

    case "payment_method.detached": {
      const paymentMethod = event.data.object as Stripe.PaymentMethod;
      logger.info(`Payment method detached: ${paymentMethod.id}`, {
        customer: paymentMethod.customer,
        type: paymentMethod.type,
      });

      try {
        const customerId = paymentMethod.customer as string | undefined;
        if (customerId) {
          // Find user to send notification
          const localSub = await p.subscription.findFirst({
            where: { stripeCustomerId: customerId },
          });
          if (localSub) {
            await p.notification.create({
              data: {
                userId: localSub.userId,
                type: "billing",
                title: "Payment Method Removed",
                body: `A payment method has been removed from your account. Please ensure you have a valid payment method on file.`,
                data: {
                  paymentMethodId: paymentMethod.id,
                  type: paymentMethod.type,
                },
              },
            });
          }
        }
      } catch (err: any) {
        logger.error("Error handling payment_method.detached", {
          err: err.message || err,
        });
      }
      break;
    }
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      logger.info(`Checkout session completed: ${session.id}`, {
        customer: session.customer,
        subscription: session.subscription,
      });

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

            // Send welcome notification
            await p.notification.create({
              data: {
                userId: user.id,
                type: "billing",
                title: "Welcome to Premium!",
                body: "Your subscription has been activated. Enjoy all premium features!",
                data: {
                  subscriptionId: subscriptionId,
                  customerId: customerId,
                },
              },
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
