/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'BETKING'

interface PromotionAnnouncementProps {
  username?: string
  promoTitle?: string
  promoDescription?: string
  bonusType?: string
  bonusValue?: number
  minDeposit?: number
  endDate?: string | null
  ctaUrl?: string
}

const formatBonus = (type?: string, value?: number) => {
  if (!type || value == null) return ''
  if (type === 'deposit_match') return `${value}% Deposit Bonus`
  if (type === 'free_bet') return `$${value} Free Bet`
  if (type === 'cashback') return `${value}% Cashback`
  return `${value}`
}

const PromotionAnnouncementEmail = ({
  username,
  promoTitle = 'New Promotion',
  promoDescription = '',
  bonusType,
  bonusValue,
  minDeposit,
  endDate,
  ctaUrl,
}: PromotionAnnouncementProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{promoTitle} — new promo just dropped at {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>{SITE_NAME}</Text>
        </Section>

        <Heading style={h1}>
          {username ? `${username}, a new promo just dropped 🎉` : 'A new promo just dropped 🎉'}
        </Heading>

        <Section style={promoBox}>
          <Text style={promoLabel}>LIMITED-TIME OFFER</Text>
          <Text style={promoTitleStyle}>{promoTitle}</Text>
          {bonusType && bonusValue != null && (
            <Text style={bonusBig}>{formatBonus(bonusType, bonusValue)}</Text>
          )}
          {minDeposit != null && minDeposit > 0 && (
            <Text style={promoMeta}>Minimum deposit: ${minDeposit}</Text>
          )}
          {endDate && (
            <Text style={promoMeta}>
              Ends: {new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          )}
        </Section>

        {promoDescription && (
          <Text style={text}>{promoDescription}</Text>
        )}

        <Section style={{ textAlign: 'center' as const, margin: '28px 0' }}>
          <Button style={button} href={ctaUrl || 'https://betking.space/promotions'}>
            Claim Now
          </Button>
        </Section>

        <Text style={footer}>
          Terms and conditions apply. This offer is available for a limited time only.
        </Text>

        <Text style={signature}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PromotionAnnouncementEmail,
  subject: (data: Record<string, any>) =>
    `🎁 New at BETKING: ${data?.promoTitle || 'A new promo just dropped'}`,
  displayName: 'Promotion announcement',
  previewData: {
    username: 'Player123',
    promoTitle: 'Weekend Reload Bonus',
    promoDescription: 'Top up between Friday and Sunday and get an instant boost on every deposit. The more you play, the more you earn.',
    bonusType: 'deposit_match',
    bonusValue: 75,
    minDeposit: 10,
    endDate: '2026-12-31',
    ctaUrl: 'https://betking.space/promotions',
  },
} satisfies TemplateEntry

const BRAND_GREEN = '#1fbf5a'
const DARK = '#0c1118'

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', margin: 0, padding: 0 }
const container = { maxWidth: '560px', margin: '0 auto', padding: '24px' }
const brandBar = { backgroundColor: DARK, padding: '20px 24px', borderRadius: '8px', textAlign: 'center' as const, marginBottom: '24px' }
const brandText = { color: BRAND_GREEN, fontSize: '24px', fontWeight: 'bold' as const, letterSpacing: '3px', margin: 0, fontFamily: 'Arial Black, Arial, sans-serif' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0c1118', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#3a3f4a', lineHeight: '1.6', margin: '0 0 16px' }
const button = { backgroundColor: BRAND_GREEN, color: '#0c1118', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '8px', padding: '14px 32px', textDecoration: 'none', display: 'inline-block' }
const promoBox = { backgroundColor: DARK, borderRadius: '12px', padding: '24px', textAlign: 'center' as const, margin: '8px 0 20px', border: `2px solid ${BRAND_GREEN}` }
const promoLabel = { color: BRAND_GREEN, fontSize: '11px', fontWeight: 'bold' as const, letterSpacing: '2px', margin: '0 0 8px' }
const promoTitleStyle = { color: '#ffffff', fontSize: '20px', fontWeight: 'bold' as const, margin: '0 0 8px' }
const bonusBig = { color: BRAND_GREEN, fontSize: '32px', fontWeight: 'bold' as const, margin: '8px 0', lineHeight: '1.1' }
const promoMeta = { color: '#cfd2d8', fontSize: '12px', margin: '4px 0' }
const footer = { fontSize: '12px', color: '#888', lineHeight: '1.5', margin: '24px 0 8px', borderTop: '1px solid #eee', paddingTop: '16px' }
const signature = { fontSize: '13px', color: '#555', margin: '8px 0 0' }
