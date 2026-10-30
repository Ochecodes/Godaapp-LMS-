import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'

import { Affiliates } from './collections/Affiliates.ts'
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

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || 'replace-this-development-secret-before-production',
  editor: lexicalEditor(),
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
      connectionString: process.env.DATABASE_URI,
    },
  }),
  collections: [Instructors, Users, Courses, Modules, Lessons, Enrollments, Resources, Affiliates, Referrals, PayoutRequests],
})
