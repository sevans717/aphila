import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: "./.env" });
import { reconcileSubscriptions } from "../src/jobs/subscriptionReconciler";

const args = process.argv.slice(2);
const dry = args.includes("--dry") || args.includes("-d");

(async () => {
  try {
    await reconcileSubscriptions({ dryRun: dry });
    console.log("Reconciliation finished");
    process.exit(0);
  } catch (err: any) {
    console.error("Reconciliation failed", err);
    process.exit(1);
  }
})();
