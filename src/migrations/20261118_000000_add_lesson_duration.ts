import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "lessons"
      ADD COLUMN IF NOT EXISTS "duration_seconds" numeric;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "lessons"
      DROP COLUMN IF EXISTS "duration_seconds";
  `)
}
