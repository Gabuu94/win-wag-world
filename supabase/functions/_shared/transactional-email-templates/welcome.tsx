/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'BETKING'

interface WelcomeEmailProps {
  username?: string
  ctaUrl?: string
}

const WelcomeEmail = ({ username, ctaUrl }: WelcomeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to {SITE_NAME} — claim your 50% first-deposit bonus</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>{SITE_NAME}</Text>
        </Section>

        <Heading style={h1}>
          {username ? `Welcome aboard, ${username}!` : 'Welcome aboard!'}
        </Heading>

        <Text style={text}>
          Your account is ready. You're now part of the {SITE_NAME} community —
          home of live odds, instant payouts, and big wins.
        </Text>

        <Section style={bonusBox}>
          <Text style={bonusLabel}>NEW PLAYER OFFER</Text>
          <Text style={bonusBig}>50% Bonus</Text>
          <Text style={bonusSub}>on your first deposit</Text>
          <Text style={bonusFine}>
            Make your first deposit and we'll automatically credit a 50%
            bonus straight to your wallet — instantly playable on sports or
            virtual games. No promo code required.
          </Text>
        </Section>

        <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
          <Button style={button} href={ctaUrl || 'https://betking.space'}>
            Make Your First Deposit
          </Button>
        </Section>

        <Hr style={hr} />

        <Text style={textSmall}>
          <strong>What you can do now:</strong>
        </Text>
        <Text style={textSmall}>
          • Place pre-match and live bets across football, basketball, tennis and more<br />
          • Spin up the virtual games — Aviator, Crash, Mines, Plinko<br />
          • Climb the VIP tiers for cashback and bonuses<br />
          • Cash out instantly via M-Pesa or crypto
        </Text>

        <Text style={footer}>
          Need help? Reply to this email or message support@betking.space.
        </Text>

        <Text style={signature}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeEmail,
  subject: 'Welcome to BETKING — your 50% bonus is waiting 🎁',
  displayName: 'Welcome',
  previewData: {
    username: 'Player123',
    ctaUrl: 'https://betking.space',
  },
} satisfies TemplateEntry

const BRAND_GREEN = '#1fbf5a'
const DARK = '#0c1118'

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', margin: 0, padding: 0 }
const container = { maxWidth: '560px', margin: '0 auto', padding: '24px' }
const brandBar = { backgroundColor: DARK, padding: '20px 24px', borderRadius: '8px', textAlign: 'center' as const, marginBottom: '24px' }
const brandText = { color: BRAND_GREEN, fontSize: '24px', fontWeight: 'bold' as const, letterSpacing: '3px', margin: 0, fontFamily: 'Arial Black, Arial, sans-serif' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0c1118', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#3a3f4a', lineHeight: '1.6', margin: '0 0 16px' }
const textSmall = { fontSize: '13px', color: '#3a3f4a', lineHeight: '1.7', margin: '4px 0' }
const button = { backgroundColor: BRAND_GREEN, color: '#0c1118', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '8px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const bonusBox = { backgroundColor: DARK, borderRadius: '12px', padding: '24px', textAlign: 'center' as const, margin: '20px 0', border: `2px solid ${BRAND_GREEN}` }
const bonusLabel = { color: BRAND_GREEN, fontSize: '11px', fontWeight: 'bold' as const, letterSpacing: '2px', margin: '0 0 8px' }
const bonusBig = { color: '#ffffff', fontSize: '38px', fontWeight: 'bold' as const, margin: '0', lineHeight: '1.1' }
const bonusSub = { color: BRAND_GREEN, fontSize: '14px', fontWeight: 'bold' as const, margin: '4px 0 12px', letterSpacing: '1px' }
const bonusFine = { color: '#cfd2d8', fontSize: '12px', lineHeight: '1.5', margin: 0 }
const hr = { borderColor: '#eee', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#888', lineHeight: '1.5', margin: '24px 0 8px' }
const signature = { fontSize: '13px', color: '#555', margin: '8px 0 0' }
