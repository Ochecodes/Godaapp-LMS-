import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_affiliate_applications_status"
        AS ENUM('pending', 'approved', 'denied', 'revoked', 'archived');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "affiliates"
      ALTER COLUMN "bank_details_bank_name" DROP NOT NULL,
      ALTER COLUMN "bank_details_account_number" DROP NOT NULL,
      ALTER COLUMN "bank_details_account_name" DROP NOT NULL;

    CREATE TABLE IF NOT EXISTS "affiliate_applications" (
      "id" serial PRIMARY KEY NOT NULL,
      "full_name" varchar NOT NULL,
      "email" varchar NOT NULL,
      "phone" varchar NOT NULL,
      "message" varchar NOT NULL,
      "status" "enum_affiliate_applications_status" DEFAULT 'pending' NOT NULL,
      "review_notes" varchar,
      "terms_accepted_at" timestamp(3) with time zone NOT NULL,
      "affiliate_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "affiliate_applications_id" integer;

    DO $$ BEGIN
      ALTER TABLE "affiliate_applications"
        ADD CONSTRAINT "affiliate_applications_affiliate_id_affiliates_id_fk"
        FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_affiliate_applications_fk"
        FOREIGN KEY ("affiliate_applications_id")
        REFERENCES "public"."affiliate_applications"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS "affiliate_applications_email_idx"
      ON "affiliate_applications" USING btree ("email");
    CREATE UNIQUE INDEX IF NOT EXISTS "affiliate_applications_affiliate_idx"
      ON "affiliate_applications" USING btree ("affiliate_id");
    CREATE INDEX IF NOT EXISTS "affiliate_applications_status_idx"
      ON "affiliate_applications" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "affiliate_applications_created_at_idx"
      ON "affiliate_applications" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_affiliate_applications_id_idx"
      ON "payload_locked_documents_rels" USING btree ("affiliate_applications_id");

    ALTER TABLE public."affiliate_applications" ENABLE ROW LEVEL SECURITY;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_affiliate_applications_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_affiliate_applications_id_idx";
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "affiliate_applications_id";
    DROP TABLE IF EXISTS "affiliate_applications" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_affiliate_applications_status";
  `);
}
