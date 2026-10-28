import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "courses_live_classes" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "meeting_url" varchar NOT NULL,
      "starts_at" timestamptz NOT NULL,
      "ends_at" timestamptz NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "courses_live_classes"
        ADD CONSTRAINT "courses_live_classes_parent_id_courses_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "courses_live_classes_order_idx"
      ON "courses_live_classes" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "courses_live_classes_parent_id_idx"
      ON "courses_live_classes" USING btree ("_parent_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "courses_live_classes" CASCADE;
  `)
}
