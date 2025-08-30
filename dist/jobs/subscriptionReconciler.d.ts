/**
 * Reconcile local subscription records with Stripe.
 * - For each local subscription with a stripeSubscriptionId, fetch latest Stripe subscription
 *   and update local `isActive`, `endDate`, and link missing invoices.
 * - Optionally run in dry-run mode (doesn't write changes).
 */
export declare function reconcileSubscriptions(opts?: {
    dryRun?: boolean;
}): Promise<void>;
export default reconcileSubscriptions;
//# sourceMappingURL=subscriptionReconciler.d.ts.map