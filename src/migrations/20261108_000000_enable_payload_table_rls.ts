import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE IF EXISTS public."instructors" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."users" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."courses" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."courses_live_classes" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."modules" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."lessons" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."lessons_quiz_questions" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."enrollments" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."resources" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."affiliates" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."referrals" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."payout_requests" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."payload_locked_documents" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."payload_locked_documents_rels" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."payload_preferences" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."payload_preferences_rels" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."payload_migrations" ENABLE ROW LEVEL SECURITY;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE IF EXISTS public."instructors" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."users" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."courses" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."courses_live_classes" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."modules" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."lessons" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."lessons_quiz_questions" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."enrollments" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."resources" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."affiliates" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."referrals" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."payout_requests" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."payload_locked_documents" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."payload_locked_documents_rels" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."payload_preferences" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."payload_preferences_rels" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."payload_migrations" DISABLE ROW LEVEL SECURITY;
  `)
}
