import reconcileSubscriptions from "./subscriptionReconciler";
import { logger } from "../utils/logger";

export async function startJobs() {
  // Start periodic reconciliation every 6 hours by default
  const intervalMs =
    Number(process.env.SUBSCRIPTION_RECONCILE_INTERVAL_MS) ||
    6 * 60 * 60 * 1000;
  logger.info(
    `Starting background jobs: subscription reconciler every ${intervalMs}ms`
  );
  // run first pass immediately
  try {
    await reconcileSubscriptions({ dryRun: false });
  } catch (err: any) {
    logger.error("Initial subscription reconcile failed", {
      err: err.message || err,
    });
  }

  setInterval(async () => {
    try {
      await reconcileSubscriptions({ dryRun: false });
    } catch (err: any) {
      logger.error("Periodic subscription reconcile failed", {
        err: err.message || err,
      });
    }
  }, intervalMs);
}

export { reconcileSubscriptions };
