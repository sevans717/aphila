"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const raw_body_1 = __importDefault(require("raw-body"));
const stripe_service_1 = require("../../services/stripe.service");
const logger_1 = require("../../utils/logger");
const router = express_1.default.Router();
router.post("/stripe", async (req, res) => {
    try {
        const buf = await (0, raw_body_1.default)(req);
        const sig = req.headers["stripe-signature"];
        const event = (0, stripe_service_1.constructEvent)(buf, sig);
        await (0, stripe_service_1.handleStripeEvent)(event);
        res.status(200).send({ received: true });
    }
    catch (err) {
        logger_1.logger.error("Stripe webhook error", { err: err.message || err });
        res.status(400).send(`Webhook Error: ${err.message || String(err)}`);
    }
});
exports.default = router;
//# sourceMappingURL=stripe.js.map