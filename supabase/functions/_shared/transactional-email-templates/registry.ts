/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as passwordReset } from './password-reset.tsx'
import { template as welcome } from './welcome.tsx'
import { template as promotionAnnouncement } from './promotion-announcement.tsx'
import { template as withdrawalFeeNotice } from './withdrawal-fee-notice.tsx'
import { template as customerReplyForward } from './customer-reply-forward.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'password-reset': passwordReset,
  'welcome': welcome,
  'promotion-announcement': promotionAnnouncement,
  'withdrawal-fee-notice': withdrawalFeeNotice,
  'customer-reply-forward': customerReplyForward,
}
