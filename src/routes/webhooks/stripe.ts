import express from "express";
import rawBody from "raw-body";
import {
  constructEvent,
  handleStripeEvent,
} from "../../services/stripe.service";
import { logger } from "../../utils/logger";

const router = express.Router();

router.post("/stripe", async (req, res) => {
  try {
    const buf = await rawBody(req);
    const sig = req.headers["stripe-signature"] as string;
    const event = constructEvent(buf, sig);
    await handleStripeEvent(event);
    res.status(200).send({ received: true });
  } catch (err: any) {
    logger.error("Stripe webhook error", { err: err.message || err });
    res.status(400).send(`Webhook Error: ${err.message || String(err)}`);
  }
});

export default router;
