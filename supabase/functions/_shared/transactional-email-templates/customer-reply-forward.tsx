import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'BETKING'

interface Props {
  fromName?: string
  fromEmail?: string
  subject?: string
  body?: string
  replyId?: string
}

const CustomerReplyForward = ({ fromName, fromEmail, subject, body, replyId }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New customer reply: {subject || '(no subject)'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New customer reply</Heading>
        <Text style={meta}><strong>From:</strong> {fromName || fromEmail || 'Unknown'} {fromEmail ? `<${fromEmail}>` : ''}</Text>
        <Text style={meta}><strong>Subject:</strong> {subject || '(no subject)'}</Text>
        <Hr style={hr} />
        <Section>
          <Text style={bodyText}>{body || '(empty message)'}</Text>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          Open the {SITE_NAME} admin inbox to reply. Reply ID: {replyId || '—'}
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CustomerReplyForward,
  subject: (d: Record<string, any>) => `[Reply] ${d.subject || '(no subject)'}`,
  displayName: 'Customer reply forward',
  previewData: {
    fromName: 'Jane Player',
    fromEmail: 'jane@example.com',
    subject: 'Re: Your withdrawal',
    body: 'Hi, I have not received my withdrawal yet.',
    replyId: 'sample-id',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '20px', fontWeight: 'bold', color: '#0a0a0a', margin: '0 0 16px' }
const meta = { fontSize: '14px', color: '#333', margin: '4px 0' }
const bodyText = { fontSize: '14px', color: '#222', lineHeight: '1.6', whiteSpace: 'pre-wrap' as const }
const hr = { borderColor: '#e5e5e5', margin: '20px 0' }
const footer = { fontSize: '12px', color: '#888', margin: '20px 0 0' }
