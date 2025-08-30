"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reconcileSubscriptions = reconcileSubscriptions;
const stripe_1 = __importDefault(require("stripe"));
const prisma_1 = require("../lib/prisma");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const p = prisma_1.prisma;
const stripeSecret = env_1.env.stripeSecret || process.env.STRIPE_SECRET_KEY || "";
const stripe = new stripe_1.default(stripeSecret, { apiVersion: "2022-11-15" });
/**
 * Reconcile local subscription records with Stripe.
 * - For each local subscription with a stripeSubscriptionId, fetch latest Stripe subscription
 *   and update local `isActive`, `endDate`, and link missing invoices.
 * - Optionally run in dry-run mode (doesn't write changes).
 */
async function reconcileSubscriptions(opts) {
    const dryRun = !!opts?.dryRun;
    logger_1.logger.info(`Starting subscription reconciliation (dryRun=${dryRun})`);
    // Use the Prisma client (cast as any) to avoid direct SQL column-name issues
    let subs = [];
    try {
        subs = (await p.subscription.findMany({
            where: { stripeSubscriptionId: { not: null } },
            select: { id: true, stripeSubscriptionId: true, userId: true },
        }));
    }
    catch (err) {
        // Likely the DB schema doesn't have the new column yet. Log and exit gracefully.
        logger_1.logger.error("Failed to query subscriptions for reconciliation", {
            err: err.message || err,
        });
        logger_1.logger.info("Ensure Prisma migrations are applied; aborting reconciliation");
        return;
    }
    logger_1.logger.info(`Found ${subs.length} subscriptions to reconcile`);
    for (const s of subs) {
        try {
            const stripeSubscriptionId = s.stripeSubscriptionId;
            if (!stripeSubscriptionId)
                continue;
            const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
            const isActive = stripeSub.status === "active" || stripeSub.status === "trialing";
            const endDate = stripeSub.current_period_end
                ? new Date(stripeSub.current_period_end * 1000)
                : null;
            logger_1.logger.debug("Reconciling subscription", {
                localId: s.id,
                stripeId: stripeSubscriptionId,
                stripeStatus: stripeSub.status,
            });
            if (!dryRun) {
                await p.subscription.update({
                    where: { id: s.id },
                    data: {
                        isActive,
                        endDate: endDate,
                    },
                });
            }
            // Link any invoices from Stripe to our invoice table if missing
            try {
                const invoices = await stripe.invoices.list({
                    subscription: stripeSubscriptionId,
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
                        logger_1.logger.info(`Linked missing invoice ${inv.id} to subscription ${s.id}`);
                    }
                }
            }
            catch (err) {
                logger_1.logger.debug("Failed to list/link invoices for subscription", {
                    err: err.message || err,
                    subscriptionId: s.id,
                });
            }
        }
        catch (err) {
            logger_1.logger.error("Failed to reconcile subscription", {
                subscriptionId: s.id,
                err: err.message || err,
            });
        }
    }
    logger_1.logger.info("Subscription reconciliation complete");
}
exports.default = reconcileSubscriptions;
//# sourceMappingURL=subscriptionReconciler.js.map