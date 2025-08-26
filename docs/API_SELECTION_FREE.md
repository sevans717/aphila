# API choices for Dating App — Free & Cheapest Options

This note lists recommended APIs for a dating app (by category) and a concise comparison matrix focused on "cheapest / most free / completely free" choices suitable for MVPs or low-budget projects.

Checklist
- Quick winner recommendations by category
- Short notes for MVP vs. production
- Comparison matrix showing free-tier limits and best free/open-source alternatives

Summary winners (fast picks)
- Auth: Firebase Auth (free tier) or Keycloak (self-hosted, free)
- Realtime chat: Socket.IO (self-hosted) or Matrix / Element for fully free/self-hosted; Pusher/Ably have limited free tiers
- Storage & media: MinIO (self-hosted S3-compatible) or Cloudinary (free tier) for transformations
- Push: Firebase Cloud Messaging (FCM) — free
- SMS / Phone verification: Twilio Verify — not free (pay-per-message). For development use free test credentials or services like Nexmo trial credits
- Payments: Stripe — no monthly fee (per-transaction pricing); not free but low barrier
- Search & recommendations: Elasticsearch / OpenSearch (self-hosted, free) or Algolia free tier (limited)
- Video/RTC: Jitsi (self-hosted, free) or Daily/Jitsi hosted; Agora/Twilio have free trial credits
- Moderation: self-hosted/model based or limited free tiers (Sightengine/Google Vision free quotas)

MVP guidance
- Prefer managed free tiers for fastest iteration: Firebase Auth + FCM + Cloudinary (free) + Stripe for payments.
- For zero-cost hosting/infra, choose OSS/self-hosted alternatives: Keycloak + Matrix/Socket.IO + MinIO + OpenSearch + Jitsi. Expect ops overhead.

## Comparison matrix — cheapest / most free / completely free (by category)

Notes on columns:
- Free tier: is there a usable free tier for prototyping? (Yes/No)
- Limit notes: short summary of limits you should watch for
- MVP fit: Good = quick to integrate for mobile MVP; Ops = good but requires self-hosting and ops work

| Category | Service (cheapest / free) | Free tier? | Limit notes / developer caveats | MVP fit |
|---|---:|:---:|---|---|
| Authentication | Firebase Authentication | Yes (free) | Free for basic email/password & social providers; costs if using phone auth heavily | Good (fast mobile SDKs)
| Authentication (OSS) | Keycloak (self-hosted) | Completely free | Requires infra & ops; full-featured (OIDC, SSO, MFA) | Ops (self-hosted)
| Realtime chat | Socket.IO (self-hosted) | Completely free | Needs server and scaling; can use Redis adapter for scaling | Ops (flexible)
| Realtime (managed) | Pusher / Ably | Limited free tier | Connection and message caps on free plan; easy to integrate | Good for prototyping
| Push notifications | Firebase Cloud Messaging (FCM) | Completely free | Unlimited for Android/iOS via FCM/APNs; integrate with Expo for RN | Great (free)
| Storage (media) | MinIO (self-hosted) | Completely free | S3-compatible, requires infra/backup/ops | Ops
| Media CDN & transforms | Cloudinary | Yes (free tier) | Free account with quotas (storage/transformations) — generous for MVPs | Good (fast dev)
| SMS / Phone verification | Twilio (pay as you go) | Not free (trial credits) | Pay-per-message; EU/intl cost varies. No permanent free tier | Not free
| Payments | Stripe | No monthly fee; pay per transaction | No free tier but no setup costs; transaction fees apply | Good (production-ready)
| Search | OpenSearch / Elasticsearch (self-hosted) | Completely free (OSS) | Requires infra, but free software; Algolia has small free tier | Ops / Good for search UX
| Vector / ML match | Pinecone (managed) / Milvus (OSS) | Pinecone limited free tier; Milvus self-hosted free | Vector DB free tiers are small; self-hosted requires ops | Use only if doing ML matching
| Video / RTC | Jitsi (self-hosted) | Completely free | Self-hosted Jitsi is free; hosted options cost | Ops (good free option)
| Moderation (images) | Google Vision / AWS Rekognition (free quotas) | Free quota | Free quota small; pay as you scale. Sightengine offers limited free credits | Prototype with free quotas
| CDN | Cloudflare (free plan) | Yes (free) | Free CDN + basic WAF features; great for static assets | Excellent

## Completely free / open-source alternatives (no managed cost)
- Auth: Keycloak — OAuth2/OIDC, SSO, MFA support. Run on a small VM or container. Good for privacy-focused apps.
- Realtime: Matrix server (Synapse) or Socket.IO server (Node) with Redis for scaling. Use Element for UI if you want a ready client.
- Storage: MinIO for S3-compatible object storage.
- Search: OpenSearch or Elasticsearch (OSS) self-hosted.
- Video: Jitsi Meet (self-hosted) for audio/video calls with decent quality.
- Push: FCM (free) — still relies on Google infra but free to use.

## Budget pick (fastest to ship with minimal costs)
- Firebase Auth + Firebase Cloud Messaging + Cloudinary (free tier) + Stripe (no monthly fee) + Algolia or Elastic (start algolia free tier or use Firestore search for MVP).
- This combination minimizes ops work and gives excellent mobile SDKs.

## When "free" is not an option
- SMS verification and payments will almost always cost money. Use test/trial credits during development. For phone verification at scale expect per-SMS costs from Twilio or local SMPP providers.

## Short action plan for you
1. Pick whether you want Managed-free (fast) or OSS-free (ops) path.  
2. I can scaffold a tiny example for your chosen stack (auth + realtime + image upload) using Firebase or Keycloak + Socket.IO + MinIO.  
3. If you want cost estimates, tell me expected monthly MAU and message volume and I'll produce rough cost numbers for managed options.

---

If you want this saved elsewhere or a different filename, say where and I'll move it.
