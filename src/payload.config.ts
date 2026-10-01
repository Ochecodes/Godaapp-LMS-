import { postgresAdapter } from '@payloadcms/db-postgres'
import { buildConfig } from 'payload'

import { Affiliates } from './collections/Affiliates'
import { Courses } from './collections/Courses'
import { Enrollments } from './collections/Enrollments'
import { Lessons } from './collections/Lessons'
import { Modules } from './collections/Modules'
import { PayoutRequests } from './collections/PayoutRequests'
import { Referrals } from './collections/Referrals'
import { Users } from './collections/Users'

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || 'replace-this-development-secret-before-production',
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
  }),
  collections: [Users, Courses, Modules, Lessons, Enrollments, Affiliates, Referrals, PayoutRequests],
})
