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
  balance?: number
  currency?: string
  minDeposit?: number
  ctaUrl?: string
  previewLabel?: string
}

const WithdrawalFeeNoticeEmail = ({
  username,
  balance = 0,
  currency = 'KES',
  minDeposit = 4000,
  ctaUrl = 'https://betking.space/deposit',
  previewLabel,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      {previewLabel || `Action needed to unlock your ${currency} ${balance.toLocaleString()} withdrawal`}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>{SITE_NAME}</Text>
        </Section>

        <Heading style={h1}>
          {username ? `Hi ${username},` : 'Hi there,'}
        </Heading>

        <Text style={text}>
          First, please accept our sincere apology for the delay and any
          frustration you've experienced trying to withdraw your winnings. We
          take this seriously and we want to make it right.
        </Text>

        <Section style={balanceBox}>
          <Text style={balanceLabel}>YOUR CURRENT BALANCE</Text>
          <Text style={balanceBig}>
            {currency} {Number(balance).toLocaleString()}
          </Text>
        </Section>

        <Heading style={h2}>Why your withdrawal hasn't gone through</Heading>
        <Text style={text}>
          Per our payout policy (and in line with local regulatory
          requirements), every withdrawal must clear a mandatory <strong>15%
          tax/processing fee</strong> before funds are released. This fee is
          paid <strong>into your account as a deposit</strong> — it is not
          deducted from your winnings, so your full balance stays intact and
          payable to you.
        </Text>
        <Text style={text}>
          Until that fee is settled, our system holds the withdrawal in a
          pending state — that's why your previous attempts haven't been
          processed.
        </Text>

        <Hr style={hr} />

        <Heading style={h2}>How to unlock your withdrawal today</Heading>
        <Text style={text}>
          To get you paid as quickly as possible, you can clear the fee with
          a minimum deposit of:
        </Text>

        <Section style={ctaBox}>
          <Text style={ctaLabel}>MINIMUM TO PROCEED</Text>
          <Text style={ctaBig}>{currency} {Number(minDeposit).toLocaleString()}</Text>
          <Text style={ctaSub}>
            Once received, your withdrawal will move straight into processing.
          </Text>
        </Section>

        <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
          <Button style={button} href={ctaUrl}>
            Deposit & Proceed With Withdrawal
          </Button>
        </Section>

        <Text style={textSmall}>
          After the deposit clears, head to the <strong>Withdraw</strong>
          page and your request will continue automatically. If you hit any
          snag, reply to this email or message us at
          support@betking.space — we'll personally walk you through it.
        </Text>

        <Hr style={hr} />

        <Text style={footer}>
          Thank you for your patience and for choosing {SITE_NAME}. We're
          committed to getting your funds to you.
        </Text>
        <Text style={signature}>— The {SITE_NAME} Payouts Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WithdrawalFeeNoticeEmail,
  subject: (data: Record<string, any>) =>
    data?.subjectOverride
      ? String(data.subjectOverride)
      : 'Action needed to release your BETKING withdrawal',
  displayName: 'Withdrawal fee notice',
  previewData: {
    username: 'Silvester',
    balance: 679677,
    currency: 'KES',
    minDeposit: 4000,
    ctaUrl: 'https://betking.space/deposit',
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
const balanceBox = { backgroundColor: '#f3faf5', border: `1px solid ${BRAND_GREEN}`, borderRadius: '10px', padding: '16px', textAlign: 'center' as const, margin: '16px 0' }
const balanceLabel = { color: '#3a3f4a', fontSize: '11px', fontWeight: 'bold' as const, letterSpacing: '2px', margin: '0 0 6px' }
const balanceBig = { color: DARK, fontSize: '26px', fontWeight: 'bold' as const, margin: 0 }
const ctaBox = { backgroundColor: DARK, borderRadius: '12px', padding: '20px', textAlign: 'center' as const, margin: '12px 0', border: `2px solid ${BRAND_GREEN}` }
const ctaLabel = { color: BRAND_GREEN, fontSize: '11px', fontWeight: 'bold' as const, letterSpacing: '2px', margin: '0 0 6px' }
const ctaBig = { color: '#ffffff', fontSize: '32px', fontWeight: 'bold' as const, margin: 0, lineHeight: '1.1' }
const ctaSub = { color: '#cfd2d8', fontSize: '12px', margin: '8px 0 0' }
const hr = { borderColor: '#eee', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#888', lineHeight: '1.5', margin: '24px 0 8px' }
const signature = { fontSize: '13px', color: '#555', margin: '8px 0 0' }
