import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "enrollments"
    SET "email" = lower(btrim("email"))
    WHERE "email" IS DISTINCT FROM lower(btrim("email"));

    CREATE INDEX IF NOT EXISTS "enrollments_email_is_active_idx"
      ON "enrollments" USING btree ("email", "is_active");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "enrollments_email_is_active_idx";
  `)
}
