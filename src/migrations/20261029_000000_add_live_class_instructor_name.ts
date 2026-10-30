import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "courses_live_classes"
      ADD COLUMN IF NOT EXISTS "instructor_name" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "courses_live_classes"
      DROP COLUMN IF EXISTS "instructor_name";
  `)
}
