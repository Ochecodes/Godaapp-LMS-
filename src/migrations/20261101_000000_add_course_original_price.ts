import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "courses"
      ADD COLUMN IF NOT EXISTS "original_price_u_s_d" numeric;

    UPDATE "courses"
    SET "original_price_u_s_d" = "price_u_s_d" * 2
    WHERE "price_u_s_d" > 0
      AND "original_price_u_s_d" IS NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "courses"
      DROP COLUMN IF EXISTS "original_price_u_s_d";
  `)
}
