/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text, Hr, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'BETKING'
const BRAND_GREEN = '#1fbf5a'
const DARK = '#0c1118'
const SUPPORT_URL = 'https://www.paysafe.com/en/help-support/'

interface Props {
  name?: string
  websiteLink?: string
}

const OnboardingUpdateEmail = ({ name = 'there', websiteLink }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your onboarding update — next steps from the Integrations Team</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>{SITE_NAME}</Text>
        </Section>

        <Heading style={h1}>Your onboarding is moving forward</Heading>

        <Text style={text}>Hi {name},</Text>

        <Text style={text}>
          First, please accept my sincere apologies for the delayed response —
          thank you for your patience while we worked through your submission.
        </Text>

        <Text style={text}>
          I'm pleased to confirm that the details you provided
          {websiteLink ? <>, including the website you shared (<strong>{websiteLink}</strong>),</> : ', including the website link you shared,'}{' '}
          have now been fully reviewed by our onboarding desk and everything
          checks out.
        </Text>

        <Section style={statusBox}>
          <Text style={statusLabel}>STATUS</Text>
          <Text style={statusBig}>Approved — moving to integration</Text>
        </Section>

        <Heading style={h2}>What happens next</Heading>
        <Text style={text}>
          Your account has been handed over to our{' '}
          <strong>Integrations Team</strong>. They will now provision the
          requested <strong>payment gateway credentials</strong> — merchant
          ID, sandbox & live API credentials, and the webhook secrets needed
          to wire everything into your platform.
        </Text>

        <Text style={text}>
          Once the credentials are ready, they will be delivered to you
          directly by email in a secure handover, along with the integration
          guide for your environment.
        </Text>

        <Hr style={hr} />

        <Heading style={h2}>Need anything in the meantime?</Heading>
        <Text style={text}>
          If anything at all comes up, just reply to this email and I'll get
          back to you personally. For quick how-tos, FAQs and self-serve
          articles, you can also visit our help centre:
        </Text>

        <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
          <Button style={button} href={SUPPORT_URL}>
            Visit the Help Centre
          </Button>
        </Section>

        <Text style={textSmall}>
          Or open it directly:{' '}
          <Link href={SUPPORT_URL} style={linkStyle}>{SUPPORT_URL}</Link>
        </Text>

        <Hr style={hr} />

        <Text style={footer}>
          Thanks again for your patience, {name} — we're looking forward to
          getting you live.
        </Text>
        <Text style={signature}>
          Warm regards,<br />
          <strong>Kelly</strong><br />
          Onboarding Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: OnboardingUpdateEmail,
  subject: 'Your onboarding update — next steps',
  displayName: 'Onboarding update (Kelly)',
  previewData: {
    name: 'Keith',
    websiteLink: 'https://example.com',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', margin: 0, padding: 0 }
const container = { maxWidth: '560px', margin: '0 auto', padding: '24px' }
const brandBar = { backgroundColor: DARK, padding: '20px 24px', borderRadius: '8px', textAlign: 'center' as const, marginBottom: '24px' }
const brandText = { color: BRAND_GREEN, fontSize: '24px', fontWeight: 'bold' as const, letterSpacing: '3px', margin: 0, fontFamily: 'Arial Black, Arial, sans-serif' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0c1118', margin: '0 0 16px' }
const h2 = { fontSize: '17px', fontWeight: 'bold' as const, color: '#0c1118', margin: '20px 0 8px' }
const text = { fontSize: '15px', color: '#3a3f4a', lineHeight: '1.6', margin: '0 0 14px' }
const textSmall = { fontSize: '13px', color: '#3a3f4a', lineHeight: '1.6', margin: '8px 0' }
const button = { backgroundColor: BRAND_GREEN, color: '#0c1118', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '8px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const statusBox = { backgroundColor: '#f3faf5', border: `2px solid ${BRAND_GREEN}`, borderRadius: '12px', padding: '18px', textAlign: 'center' as const, margin: '16px 0' }
const statusLabel = { color: '#3a3f4a', fontSize: '11px', fontWeight: 'bold' as const, letterSpacing: '2px', margin: '0 0 6px' }
const statusBig = { color: DARK, fontSize: '20px', fontWeight: 'bold' as const, margin: 0 }
const linkStyle = { color: BRAND_GREEN, textDecoration: 'underline' }
const hr = { borderColor: '#eee', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#555', lineHeight: '1.5', margin: '24px 0 8px' }
const signature = { fontSize: '13px', color: '#333', margin: '8px 0 0', lineHeight: '1.6' }
