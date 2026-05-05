/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface ContactFormNotificationProps {
  name?: string
  email?: string
  phone?: string
  message?: string
}

const ContactFormNotificationEmail = ({
  name,
  email,
  phone,
  message,
}: ContactFormNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New contact inquiry from {name || 'website visitor'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New Contact Inquiry</Heading>
        <Text style={text}>
          A new message was submitted through the SOURCEsculptures contact form.
        </Text>

        <Section style={infoSection}>
          <Text style={label}>Name</Text>
          <Text style={value}>{name || '—'}</Text>

          <Text style={label}>Email</Text>
          <Text style={value}>{email || '—'}</Text>

          {phone ? (
            <>
              <Text style={label}>Phone</Text>
              <Text style={value}>{phone}</Text>
            </>
          ) : null}
        </Section>

        <Hr style={hr} />

        <Text style={label}>Message</Text>
        <Text style={messageStyle}>{message || '—'}</Text>

        <Hr style={hr} />
        <Text style={footer}>
          Reply directly to {email || 'the sender'} to continue the conversation.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactFormNotificationEmail,
  subject: (data: Record<string, any>) =>
    `New inquiry from ${data?.name || 'website visitor'}`,
  displayName: 'Contact form notification',
  previewData: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+1 555 123 4567',
    message: 'Hi — I would love to discuss a sculpture commission for our lobby space.',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
}
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold',
  color: '#000000',
  margin: '0 0 18px',
  letterSpacing: '0.02em',
  textTransform: 'uppercase' as const,
}
const text = {
  fontSize: '14px',
  color: '#55575d',
  lineHeight: '1.6',
  margin: '0 0 24px',
}
const infoSection = { margin: '0 0 8px' }
const label = {
  fontSize: '11px',
  color: '#999999',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  margin: '14px 0 4px',
}
const value = {
  fontSize: '15px',
  color: '#000000',
  margin: '0',
  lineHeight: '1.5',
}
const messageStyle = {
  fontSize: '15px',
  color: '#000000',
  lineHeight: '1.6',
  margin: '0 0 12px',
  whiteSpace: 'pre-wrap' as const,
}
const hr = { borderColor: '#eaeaea', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '12px 0 0' }
