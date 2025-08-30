import Stripe from "stripe";
declare const stripe: Stripe;
export declare function createStripeCheckoutSession(customerEmail: string | undefined, priceId: string, successUrl: string, cancelUrl: string): Promise<Stripe.Response<Stripe.Checkout.Session>>;
export declare function constructEvent(payload: Buffer, sig: string): Stripe.Event;
export declare function handleStripeEvent(event: Stripe.Event): Promise<void>;
export default stripe;
//# sourceMappingURL=stripe.service.d.ts.map