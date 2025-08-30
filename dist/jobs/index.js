"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reconcileSubscriptions = void 0;
exports.startJobs = startJobs;
const subscriptionReconciler_1 = __importDefault(require("./subscriptionReconciler"));
exports.reconcileSubscriptions = subscriptionReconciler_1.default;
const logger_1 = require("../utils/logger");
async function startJobs() {
    // Start periodic reconciliation every 6 hours by default
    const intervalMs = Number(process.env.SUBSCRIPTION_RECONCILE_INTERVAL_MS) ||
        6 * 60 * 60 * 1000;
    logger_1.logger.info(`Starting background jobs: subscription reconciler every ${intervalMs}ms`);
    // run first pass immediately
    try {
        await (0, subscriptionReconciler_1.default)({ dryRun: false });
    }
    catch (err) {
        logger_1.logger.error("Initial subscription reconcile failed", {
            err: err.message || err,
        });
    }
    setInterval(async () => {
        try {
            await (0, subscriptionReconciler_1.default)({ dryRun: false });
        }
        catch (err) {
            logger_1.logger.error("Periodic subscription reconcile failed", {
                err: err.message || err,
            });
        }
    }, intervalMs);
}
//# sourceMappingURL=index.js.map