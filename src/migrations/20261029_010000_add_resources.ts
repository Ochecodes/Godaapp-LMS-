import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_resources_status" AS ENUM('published', 'draft');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "resources" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "category" varchar NOT NULL,
      "description" varchar NOT NULL,
      "external_url" varchar NOT NULL,
      "format" varchar NOT NULL,
      "status" "enum_resources_status" DEFAULT 'published' NOT NULL,
      "sort_order" numeric DEFAULT 0 NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "resources_title_idx" ON "resources" USING btree ("title");
    CREATE INDEX IF NOT EXISTS "resources_status_idx" ON "resources" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "resources_sort_order_idx" ON "resources" USING btree ("sort_order");
    CREATE INDEX IF NOT EXISTS "resources_created_at_idx" ON "resources" USING btree ("created_at");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "resources" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_resources_status";
  `)
}
