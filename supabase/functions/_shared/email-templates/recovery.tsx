/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your {siteName} password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>BETKING</Text>
        </Section>
        <Heading style={h1}>Reset your password</Heading>
        <Text style={text}>
          We received a request to reset your password for {siteName}. Click
          the button below to choose a new password.
        </Text>
        <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
          <Button style={button} href={confirmationUrl}>
            Reset Password
          </Button>
        </Section>
        <Text style={footer}>
          If you didn't request a password reset, you can safely ignore this
          email — your password will not be changed.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const BRAND_GREEN = '#1fbf5a'
const DARK = '#0c1118'

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '24px' }
const brandBar = { backgroundColor: DARK, padding: '20px 24px', borderRadius: '8px', textAlign: 'center' as const, marginBottom: '24px' }
const brandText = { color: BRAND_GREEN, fontSize: '24px', fontWeight: 'bold' as const, letterSpacing: '3px', margin: 0 }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0c1118', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#3a3f4a', lineHeight: '1.6', margin: '0 0 16px' }
const button = { backgroundColor: BRAND_GREEN, color: '#0c1118', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '8px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '12px', color: '#888', lineHeight: '1.5', margin: '32px 0 0', borderTop: '1px solid #eee', paddingTop: '16px' }
