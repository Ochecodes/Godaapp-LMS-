import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import {
  defaultColors,
  FixedToolbarFeature,
  lexicalEditor,
  TextStateFeature,
} from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'

import { Affiliates } from './collections/Affiliates.ts'
import { AffiliateApplications } from './collections/AffiliateApplications.ts'
import { AffiliateDisputes } from './collections/AffiliateDisputes.ts'
import { AffiliateKyc } from './collections/AffiliateKyc.ts'
import { AffiliateLedgerAdjustments } from './collections/AffiliateLedgerAdjustments.ts'
import { Courses } from './collections/Courses.ts'
import { Enrollments } from './collections/Enrollments.ts'
import { Instructors } from './collections/Instructors.ts'
import { Lessons } from './collections/Lessons.ts'
import { Modules } from './collections/Modules.ts'
import { PayoutRequests } from './collections/PayoutRequests.ts'
import { Referrals } from './collections/Referrals.ts'
import { Resources } from './collections/Resources.ts'
import { Users } from './collections/Users.ts'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const databaseURL = process.env.DATABASE_URI ? new URL(process.env.DATABASE_URI) : null
const payloadSecret = process.env.PAYLOAD_SECRET

if (databaseURL && !['localhost', '127.0.0.1'].includes(databaseURL.hostname)) {
  if (!databaseURL.searchParams.get('sslmode')) {
    databaseURL.searchParams.set('sslmode', 'require')
  }
  if (databaseURL.searchParams.get('sslmode') === 'require') {
    databaseURL.searchParams.set('uselibpqcompat', 'true')
  }
}

if (process.env.NODE_ENV === 'production' && (!payloadSecret || payloadSecret.length < 32)) {
  throw new Error('PAYLOAD_SECRET must be configured with at least 32 characters in production.')
}

export default buildConfig({
  secret: payloadSecret || 'development-only-payload-secret',
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      FixedToolbarFeature(),
      TextStateFeature({
        state: {
          color: defaultColors.text,
          fontFamily: {
            sans: { label: 'Sans serif', css: { 'font-family': 'Arial, sans-serif' } },
            serif: { label: 'Serif', css: { 'font-family': 'Georgia, serif' } },
            mono: { label: 'Monospace', css: { 'font-family': 'monospace' } },
          },
          fontSize: {
            small: { label: 'Small', css: { 'font-size': '0.875rem' } },
            normal: { label: 'Normal', css: { 'font-size': '1rem' } },
            large: { label: 'Large', css: { 'font-size': '1.25rem' } },
            xlarge: { label: 'Extra large', css: { 'font-size': '1.5rem' } },
          },
        },
      }),
    ],
  }),
  admin: {
    user: Instructors.slug,
    components: {
      beforeDashboard: [
        '../../../components/PayloadAdminBrand.tsx#PayloadDashboardWelcome',
      ],
      beforeNavLinks: [
        '../../../components/PayloadAdminBrand.tsx#PayloadNavBrand',
      ],
      actions: [
        '../../../components/PayloadAdminBrand.tsx#PayloadThemeToggle',
      ],
      graphics: {
        Icon: '../../../components/PayloadAdminBrand.tsx#PayloadGraphic',
        Logo: '../../../components/PayloadAdminBrand.tsx#PayloadGraphic',
      },
      views: {
        Login: {
          Component: '../../../components/InstructorAdminLogin.tsx#InstructorAdminLogin',
          path: '/login',
          exact: true,
        },
        analytics: {
          Component: '../../../components/PayloadAnalyticsView.tsx#PayloadAnalyticsView',
          path: '/analytics',
          exact: true,
        },
      },
    },
    importMap: {
      baseDir: path.resolve(dirname, './app/(instructor)/instructor-panel'),
      importMapFile: path.resolve(dirname, './app/(instructor)/instructor-panel/importMap.js'),
    },
  },
  routes: {
    admin: '/instructor-panel',
    api: '/payload-api',
  },
  db: postgresAdapter({
    pool: {
      connectionString: databaseURL?.toString(),
    },
    push: false,
  }),
  collections: [Instructors, Users, Courses, Modules, Lessons, Enrollments, Resources, Affiliates, AffiliateApplications, AffiliateDisputes, AffiliateKyc, AffiliateLedgerAdjustments, Referrals, PayoutRequests],
})
