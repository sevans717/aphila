# UI Pages & Navigation

This document summarizes pages, device layouts, navigation patterns, components, and UX flows for the product (web + mobile).

## Assumptions

- Cross-platform app (web + mobile) backed by the existing backend.
- Focus on onboarding, core workflows, account/billing, collaboration, and admin.
- Use a consistent component library and responsive layout system.

## Pages / Screens

### Entry & Onboarding

- Landing / Marketing page (web): hero, features, pricing, CTA.
- Sign Up / Sign In (web & mobile): social login, email/password, SSO.
- Email verification / Welcome screen.
- Onboarding wizard: setup steps, initial data import, tutorials.

### Core App Experience

- Dashboard / Home: activity summary, recent items, actionable cards, quick actions.
- Main Workspace / List view: list of user items (projects, messages, records).
- Detail / Item view: full item details, timeline, actions (edit, comment).
- Composer / Create modal: create new item, quick-create floating button.
- Search / Global search results.
- Notifications center: in-app notifications and read/unread states.

### Collaboration & Team

- Team / Workspace settings: members, roles, invites.
- Shared views / folders: access control, manifests.
- Mentions / Comments UI.

### Billing & Account

- Billing Overview: plan, usage, upcoming invoice.
- Payment method & invoices: add card, view invoice PDF.
- Upgrade / Plan chooser modal.
- Account settings: profile, password, API keys.

### Advanced / Admin

- Admin Dashboard: user metrics, active sessions, logs.
- Audit Logs: events, filters, export.
- Integrations: connected apps, webhook config.
- Developer/API dashboard: API keys, usage metrics, webhook testing.

### Help & Legal

- Help center / Knowledge base.
- Contact support / create ticket.
- Terms, privacy policy pages.

## Device Types & Layout Rules

- Desktop (≥1024px)
  - Two/three-column layouts: nav sidebar (left), main content, right side panel (insights).
  - Persistent top navigation for global actions/search.
  - Modals for lightweight tasks; full pages for complex tasks.
- Tablet (≥768px && <1024px)
  - Collapsible sidebar; main content prioritized.
  - Touch-friendly controls, larger touch targets.
- Mobile (<768px)
  - Bottom tab bar for primary destinations (Home, Search, Create, Notifications, Profile).
  - Single-column stack, collapsible sections, floating action button for primary create action.
  - Progressive disclosure for advanced settings.

## Navigation Patterns

- Global nav (desktop): left sidebar with primary destinations; collapsible; includes user menu and status.
- Top nav (mobile): minimal header with hamburger to open full nav, or use bottom tabs.
- Deep linking: every item/detail has a stable URL for sharing.
- Breadcrumbs: in complex nested flows on desktop.
- Back button behavior (mobile): preserve navigation stack; use deep link to restore state.

## Shared UI Components

- App Shell: header, sidebar, content container, notifications banner.
- Lists & tables: virtualized lists, sortable columns, filters.
- Cards: summary + CTA, used on dashboards.
- Modals & drawers: confirm/cancel, compact forms.
- Forms & inputs: consistent validation, async validation messages.
- Toasts & snackbars: ephemeral status messages.
- Data visualization: charts, sparklines, KPI widgets.
- Avatar & presence indicators: team presence.
- Composer (rich text): attachments, mentions, autosave.
- File picker / uploader with progress.
- Permissions UI: role pickers, capability matrix.

## UX Flows & Interactions

- First-time user funnel
  - Sign-up → core activation event (e.g., create first item) → onboarding tips → trial offer.
- Upgrade flow
  - Trigger CTA at moment of need (e.g., hit usage limit) → preview features → sticky modal → one-click upgrade.
- Error & fallback UX
  - Graceful offline support (local cache), clear retry CTA, and user-friendly error messages.
- Rate limits & usage
  - Show usage meter on dashboard; warn before limits; throttle with clear messaging.
- Confirm destructive actions
  - Two-step confirmation for deletes; offer data export before destructive ops.
- Accessibility & internationalization
  - Proper aria attributes, keyboard navigation support, RTL support, and locale formats.

## Navigation Mapping (primary -> accessible from)

- Home / Dashboard: global nav, bottom tab
- Workspace / Items: sidebar entry, dashboard card, search result
- Create modal: FAB (mobile) / button top-right (desktop)
- Billing: profile menu → Billing, pricing page CTA
- Settings: user menu → Settings
- Admin: admin sidebar (permission-gated)

## Performance & UX Considerations

- Lazy-load heavy components and data; skeleton loaders for perceived speed.
- Optimistic UI updates for quick interactions (with rollback on failure).
- Batched network calls and background sync for mobile.
- Use server-side rendering for key public pages / SEO (landing, marketing).

## Analytics & Instrumentation

- Track events: page_view, onboarding_step_completed, conversion_to_paid, feature_used.
- Funnel tracking for activation and upgrade flows.
- Monitor latency and failed requests for user-impacting issues.

## Design Tokens & Theming

- Central token file for colors, spacing, and typography.
- Light/dark theme toggle with preserved user preference.
- Responsive grid tokens for component sizing.

## Developer Notes

- Gate features server-side using the `User.plan`/entitlement model; don't rely on client-only gating.
- Consistent API contracts for pagination, filtering, and error codes.
- Provide a client SDK (optional) for mobile/web to standardize auth and telemetry.

## Deliverables (next options)

- Full page-by-page design spec with component props and API stubs.
- Example React Native + web layout components.
- Jira-ready tickets for implementing pages and components.
- Accessibility checklist and automated testing plan.

---

Saved from workspace assistant output, generated on 2025-08-26.
