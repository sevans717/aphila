import Stripe from "stripe";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { logger } from "../utils/logger";

const p = prisma as any;

const stripeSecret =
  (env as any).stripeSecret || process.env.STRIPE_SECRET_KEY || "";
const stripe = new Stripe(stripeSecret, { apiVersion: "2022-11-15" });

/**
 * Reconcile local subscription records with Stripe.
 * - For each local subscription with a stripeSubscriptionId, fetch latest Stripe subscription
 *   and update local `isActive`, `endDate`, and link missing invoices.
 * - Optionally run in dry-run mode (doesn't write changes).
 */
export async function reconcileSubscriptions(opts?: { dryRun?: boolean }) {
  const dryRun = !!opts?.dryRun;
  logger.info(`Starting subscription reconciliation (dryRun=${dryRun})`);

  // Use the Prisma client (cast as any) to avoid direct SQL column-name issues
  let subs: Array<{
    id: string;
    stripeSubscriptionId?: string | null;
    userId?: string | null;
  }> = [];

  try {
    subs = (await p.subscription.findMany({
      where: { stripeSubscriptionId: { not: null } },
      select: { id: true, stripeSubscriptionId: true, userId: true },
    })) as any;
  } catch (err: any) {
    // Likely the DB schema doesn't have the new column yet. Log and exit gracefully.
    logger.error("Failed to query subscriptions for reconciliation", {
      err: err.message || err,
    });
    logger.info(
      "Ensure Prisma migrations are applied; aborting reconciliation"
    );
    return;
  }

  logger.info(`Found ${subs.length} subscriptions to reconcile`);

  for (const s of subs) {
    try {
      const stripeSubscriptionId = (s as any).stripeSubscriptionId as
        | string
        | undefined;
      if (!stripeSubscriptionId) continue;
      const stripeSub = await stripe.subscriptions.retrieve(
        stripeSubscriptionId as string
      );
      const isActive =
        stripeSub.status === "active" || stripeSub.status === "trialing";
      const endDate = stripeSub.current_period_end
        ? new Date(stripeSub.current_period_end * 1000)
        : null;

      logger.debug("Reconciling subscription", {
        localId: s.id,
        stripeId: stripeSubscriptionId,
        stripeStatus: stripeSub.status,
      });

      if (!dryRun) {
        await p.subscription.update({
          where: { id: s.id },
          data: {
            isActive,
            endDate: endDate as any,
          },
        });
      }

      // Link any invoices from Stripe to our invoice table if missing
      try {
        const invoices = await stripe.invoices.list({
          subscription: stripeSubscriptionId as string,
          limit: 100,
        });
        for (const inv of invoices.data) {
          const existing = await p.invoice.findUnique({
            where: { stripeInvoiceId: inv.id },
          });
          if (!existing) {
            if (!dryRun) {
              await p.invoice.create({
                data: {
                  stripeInvoiceId: inv.id,
                  amountPaid: inv.amount_paid ?? undefined,
                  currency: inv.currency ?? undefined,
                  status: inv.status ?? undefined,
                  subscriptionId: s.id,
                  userId: s.userId ?? undefined,
                },
              });
            }
            logger.info(
              `Linked missing invoice ${inv.id} to subscription ${s.id}`
            );
          }
        }
      } catch (err: any) {
        logger.debug("Failed to list/link invoices for subscription", {
          err: err.message || err,
          subscriptionId: s.id,
        });
      }
    } catch (err: any) {
      logger.error("Failed to reconcile subscription", {
        subscriptionId: s.id,
        err: err.message || err,
      });
    }
  }

  logger.info("Subscription reconciliation complete");
}

export default reconcileSubscriptions;
