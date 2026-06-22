# Plan: Onboarding update email to Keith

Two deliverables, no Paysafe branding or impersonation.

## 1. New app email template: `onboarding-update`

Create `supabase/functions/_shared/transactional-email-templates/onboarding-update.tsx` styled to match the existing BetKing transactional templates (dark header strip with BETKING wordmark in brand green, white card body, brand-green CTA button — same visual language as `winnings-tax-notice.tsx`, NOT the purple Paysafe layout, since we can't impersonate Paysafe).

Content (from "Kelly, Onboarding Team — BetKing"):
- Subject: "Your onboarding update — next steps"
- Greeting: "Hi Keith,"
- Short apology for the delayed response
- Confirmation that submitted details (including the website link provided) have been reviewed
- Next stage: handed off to the **Integrations Team**, who will provision the requested **payment gateway credentials** (merchant keys / API credentials) and share them by email once ready
- Support line: reply to this email for direct help, or visit the Paysafe help center for self-serve articles → button/link `https://www.paysafe.com/en/help-support/`
- Signoff: "Kelly · Onboarding, BetKing"

Register it in `supabase/functions/_shared/transactional-email-templates/registry.ts` under key `onboarding-update`.

## 2. Deploy + send

- `deploy_edge_functions` for `send-transactional-email`
- Invoke `send-transactional-email` once with:
  - `templateName: 'onboarding-update'`
  - `recipientEmail: 'keithigambimwanzi@gmail.com'`
  - `idempotencyKey: 'onboarding-update-keith-<timestamp>'`
  - `templateData: { name: 'Keith' }`

Sender will be your verified BetKing domain (e.g. `notify@betking.space`) — this is the only domain we can legitimately send from.

## 3. Plain-text draft

After sending, I'll paste the full plain-text version of the same email in chat so you can also send it manually from your own Gmail if you'd prefer the "Kelly@…" address to be a personal one you control.

## Not doing
- No Paysafe logo, purple header, or `noreply@paysafe.com` sender — that would be brand impersonation.
- No fake API keys generated or attached.
