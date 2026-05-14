/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'BETKING'
const BRAND_GREEN = '#1fbf5a'
const DARK = '#0c1118'

interface Props {
  username?: string
  winAmount?: number
  stake?: number
  totalOdds?: number
  currency?: string
  taxRate?: number
  taxAmount?: number
  ctaUrl?: string
  previewLabel?: string
}

const WinningsTaxNoticeEmail = ({
  username,
  winAmount = 0,
  stake,
  totalOdds,
  currency = 'KES',
  taxRate = 15,
  taxAmount,
  ctaUrl = 'https://betking.space/?deposit=1',
  previewLabel,
}: Props) => {
  const computedTax = taxAmount ?? Math.round((winAmount * taxRate) / 100)
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {previewLabel || `Congratulations ${username || 'Champion'} — your ${currency} ${winAmount.toLocaleString()} win is ready`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            <Text style={brandText}>{SITE_NAME}</Text>
          </Section>

          <Heading style={h1}>
            🎉 {username ? `Congratulations, ${username}!` : 'Congratulations, Champion!'}
          </Heading>

          <Text style={text}>
            What a result! Your bet has officially landed and we just want to
            take a moment to say <strong>well done</strong>. Reading the game
            right against those odds is no small feat — this is exactly the
            kind of win we love seeing on {SITE_NAME}.
          </Text>

          <Section style={winBox}>
            <Text style={winLabel}>YOUR WINNINGS</Text>
            <Text style={winBig}>
              {currency} {Number(winAmount).toLocaleString()}
            </Text>
            {(stake || totalOdds) && (
              <Text style={winSub}>
                {stake ? `Stake: ${currency} ${Number(stake).toLocaleString()}` : ''}
                {stake && totalOdds ? '  •  ' : ''}
                {totalOdds ? `Total odds: ${Number(totalOdds).toFixed(2)}` : ''}
              </Text>
            )}
          </Section>

          <Text style={text}>
            Your winnings have been credited to your account and are sitting
            in your <strong>winnings balance</strong>, ready to be withdrawn.
          </Text>

          <Hr style={hr} />

          <Heading style={h2}>One quick step before payout — withholding tax</Heading>
          <Text style={text}>
            Like every licensed sportsbook operating in Kenya, {SITE_NAME} is
            legally required by the Kenya Revenue Authority (KRA) to apply a{' '}
            <strong>{taxRate}% withholding tax on all winnings</strong> before
            funds can be released to your M-Pesa.
          </Text>

          <Section style={taxBox}>
            <Text style={taxLabel}>WITHHOLDING TAX DUE ({taxRate}%)</Text>
            <Text style={taxBig}>
              {currency} {Number(computedTax).toLocaleString()}
            </Text>
          </Section>

          <Text style={text}>
            Important — and this is good news: the tax is <strong>not deducted
            from your {currency} {Number(winAmount).toLocaleString()} winnings</strong>.
            Your full balance stays intact and 100% payable to you. The tax
            is settled separately as a <strong>deposit into your account</strong>,
            which is then remitted directly to KRA on your behalf.
          </Text>

          <Text style={text}>
            Until the tax is cleared, our system has to hold the withdrawal
            in a pending state — that's a regulatory requirement, not a
            choice we can override.
          </Text>

          <Hr style={hr} />

          <Heading style={h2}>How to release your {currency} {Number(winAmount).toLocaleString()} today</Heading>
          <Text style={text}>
            To get you paid out as fast as possible, simply make a deposit
            covering the {taxRate}% withholding tax shown above. The moment
            it reflects, your withdrawal moves straight into processing and
            lands on your M-Pesa.
          </Text>

          <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
            <Button style={button} href={ctaUrl}>
              Deposit & Release My Winnings
            </Button>
          </Section>

          <Text style={textSmall}>
            If you'd like, reply to this email and our payouts team will
            personally walk you through it step-by-step. You can also reach
            us anytime at <strong>support@betking.space</strong>.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            Thank you for trusting {SITE_NAME} with your bets, {username || 'Champion'}.
            Wins like this one are exactly why we do what we do — and we
            can't wait to get these funds into your hands.
          </Text>
          <Text style={signature}>— The {SITE_NAME} Payouts Team</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: WinningsTaxNoticeEmail,
  subject: (data: Record<string, any>) =>
    data?.subjectOverride
      ? String(data.subjectOverride)
      : `🎉 Congrats on your ${data?.currency || 'KES'} ${Number(data?.winAmount || 0).toLocaleString()} win — final step to cash out`,
  displayName: 'Winnings congratulations + tax notice',
  previewData: {
    username: 'Denis',
    winAmount: 94500,
    stake: 2250,
    totalOdds: 42,
    currency: 'KES',
    taxRate: 15,
    ctaUrl: 'https://betking.space/?deposit=1',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', margin: 0, padding: 0 }
const container = { maxWidth: '560px', margin: '0 auto', padding: '24px' }
const brandBar = { backgroundColor: DARK, padding: '20px 24px', borderRadius: '8px', textAlign: 'center' as const, marginBottom: '24px' }
const brandText = { color: BRAND_GREEN, fontSize: '24px', fontWeight: 'bold' as const, letterSpacing: '3px', margin: 0, fontFamily: 'Arial Black, Arial, sans-serif' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0c1118', margin: '0 0 16px' }
const h2 = { fontSize: '17px', fontWeight: 'bold' as const, color: '#0c1118', margin: '20px 0 8px' }
const text = { fontSize: '15px', color: '#3a3f4a', lineHeight: '1.6', margin: '0 0 14px' }
const textSmall = { fontSize: '13px', color: '#3a3f4a', lineHeight: '1.6', margin: '8px 0' }
const button = { backgroundColor: BRAND_GREEN, color: '#0c1118', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '8px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const winBox = { backgroundColor: '#f3faf5', border: `2px solid ${BRAND_GREEN}`, borderRadius: '12px', padding: '20px', textAlign: 'center' as const, margin: '16px 0' }
const winLabel = { color: '#3a3f4a', fontSize: '11px', fontWeight: 'bold' as const, letterSpacing: '2px', margin: '0 0 6px' }
const winBig = { color: DARK, fontSize: '32px', fontWeight: 'bold' as const, margin: 0 }
const winSub = { color: '#3a3f4a', fontSize: '12px', margin: '8px 0 0' }
const taxBox = { backgroundColor: '#fff8e1', border: '1px solid #f0c14b', borderRadius: '10px', padding: '14px', textAlign: 'center' as const, margin: '12px 0' }
const taxLabel = { color: '#7a5a00', fontSize: '11px', fontWeight: 'bold' as const, letterSpacing: '2px', margin: '0 0 6px' }
const taxBig = { color: '#7a5a00', fontSize: '22px', fontWeight: 'bold' as const, margin: 0 }
const ctaBox = { backgroundColor: DARK, borderRadius: '12px', padding: '20px', textAlign: 'center' as const, margin: '12px 0', border: `2px solid ${BRAND_GREEN}` }
const ctaLabel = { color: BRAND_GREEN, fontSize: '11px', fontWeight: 'bold' as const, letterSpacing: '2px', margin: '0 0 6px' }
const ctaBig = { color: '#ffffff', fontSize: '32px', fontWeight: 'bold' as const, margin: 0, lineHeight: '1.1' }
const ctaSub = { color: '#cfd2d8', fontSize: '12px', margin: '8px 0 0' }
const hr = { borderColor: '#eee', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#888', lineHeight: '1.5', margin: '24px 0 8px' }
const signature = { fontSize: '13px', color: '#555', margin: '8px 0 0' }
