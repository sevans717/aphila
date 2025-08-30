# Stripe Integration (minimal setup)

- **Env variables**: add these to your `.env` or environment:
  - `STRIPE_SECRET_KEY` — secret API key from Stripe (starts with `sk_...`).
  - `STRIPE_WEBHOOK_SECRET` — webhook signing secret from Stripe dashboard (starts with `whsec_...`).
  - `STRIPE_PUBLIC_KEY` — (optional) public key for frontend (starts with `pk_...`).

- **Webhook endpoint**: The backend exposes `/webhooks/stripe` for Stripe events. Configure the webhook in Stripe to send `invoice.payment_succeeded`, `invoice.payment_failed`, `checkout.session.completed`, and `customer.subscription.*` events.

- **How it works**:
  - `POST /api/v1/subscription/subscribe` will return a `checkoutSessionUrl` for paid plans when payments are enabled and the plan has a `stripePriceId`.
  - The frontend must redirect the user to the Stripe Checkout URL to complete payment.
  - Stripe will send webhook events to `/webhooks/stripe` which the backend verifies and persists basic subscription/invoice state into the DB.

- **Recommendations**:
  - In production, use the webhook secret and ensure the webhook endpoint is reachable over HTTPS.
  - Persist `stripeCustomerId`, `stripeSubscriptionId`, and `lastInvoiceId` on your subscription records (already added to Prisma schema).
  - Use background jobs for reconciliation and retries if webhooks fail.

- **Testing locally**:
  - Use `stripe listen --forward-to localhost:3001/webhooks/stripe` to forward test events to your local server.
  - Use the Stripe CLI to trigger events, e.g. `stripe trigger invoice.payment_succeeded`.

- **Note**: This is a minimal integration to get subscription flow working. For full production readiness implement idempotency keys, reconcile missed events, persist invoices and receipts, handle proration, and apply tax & currency handling where required.
