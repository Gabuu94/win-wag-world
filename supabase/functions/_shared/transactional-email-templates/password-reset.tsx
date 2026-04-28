/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'BETKING'

interface PasswordResetEmailProps {
  username?: string
  resetUrl?: string
  expiresInMinutes?: number
}

const PasswordResetEmail = ({
  username,
  resetUrl,
  expiresInMinutes = 30,
}: PasswordResetEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your {SITE_NAME} password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>{SITE_NAME}</Text>
        </Section>

        <Heading style={h1}>Reset your password</Heading>

        <Text style={text}>
          {username ? `Hi ${username},` : 'Hi there,'}
        </Text>

        <Text style={text}>
          We received a request to reset the password on your {SITE_NAME} account.
          Click the button below to choose a new password. This link expires in{' '}
          <strong>{expiresInMinutes} minutes</strong>.
        </Text>

        <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
          <Button style={button} href={resetUrl || '#'}>
            Reset Password
          </Button>
        </Section>

        <Text style={textSmall}>
          If the button doesn't work, copy and paste this link into your browser:
        </Text>
        <Text style={linkText}>{resetUrl}</Text>

        <Text style={footer}>
          If you didn't request a password reset, you can safely ignore this email —
          your password will not change. For security questions, contact
          support@betking.space.
        </Text>

        <Text style={signature}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PasswordResetEmail,
  subject: 'Reset your BETKING password',
  displayName: 'Password reset',
  previewData: {
    username: 'Player123',
    resetUrl: 'https://betking.space/reset-password?token=sample-token',
    expiresInMinutes: 30,
  },
} satisfies TemplateEntry

const BRAND_GREEN = '#1fbf5a'
const DARK = '#0c1118'

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', margin: 0, padding: 0 }
const container = { maxWidth: '560px', margin: '0 auto', padding: '24px' }
const brandBar = { backgroundColor: DARK, padding: '20px 24px', borderRadius: '8px', textAlign: 'center' as const, marginBottom: '24px' }
const brandText = { color: BRAND_GREEN, fontSize: '24px', fontWeight: 'bold' as const, letterSpacing: '3px', margin: 0, fontFamily: 'Arial Black, Arial, sans-serif' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0c1118', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#3a3f4a', lineHeight: '1.6', margin: '0 0 16px' }
const textSmall = { fontSize: '13px', color: '#666', lineHeight: '1.5', margin: '8px 0 4px' }
const linkText = { fontSize: '12px', color: BRAND_GREEN, wordBreak: 'break-all' as const, margin: '0 0 24px' }
const button = { backgroundColor: BRAND_GREEN, color: '#0c1118', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '8px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '12px', color: '#888', lineHeight: '1.5', margin: '32px 0 8px', borderTop: '1px solid #eee', paddingTop: '16px' }
const signature = { fontSize: '13px', color: '#555', margin: '8px 0 0' }
