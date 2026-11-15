import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_payout_requests_payout_method"
        AS ENUM('bank_transfer', 'usdt_trc20');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_affiliate_disputes_category"
        AS ENUM('referral', 'payout', 'account', 'other');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_affiliate_disputes_status"
        AS ENUM('submitted', 'under_review', 'resolved', 'closed');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_affiliate_kyc_identity_type"
        AS ENUM('passport', 'national_id', 'drivers_license');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_affiliate_kyc_status"
        AS ENUM('submitted', 'under_review', 'verified', 'needs_information', 'rejected');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_affiliate_ledger_adjustments_reason"
        AS ENUM('refund', 'chargeback', 'manual_correction');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_affiliate_ledger_adjustments_status"
        AS ENUM('unapplied', 'reserved', 'applied');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_affiliate_applications_approval_notification_status"
        AS ENUM('not_sent', 'sent', 'failed');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "affiliates"
      ADD COLUMN IF NOT EXISTS "referral_link_active" boolean DEFAULT true NOT NULL;

    ALTER TABLE "enrollments"
      ADD COLUMN IF NOT EXISTS "provider_checkout_id" varchar;

    ALTER TABLE "affiliate_applications"
      ADD COLUMN IF NOT EXISTS "decision_history" jsonb DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS "approval_notification_status"
        "enum_affiliate_applications_approval_notification_status" DEFAULT 'not_sent' NOT NULL,
      ADD COLUMN IF NOT EXISTS "last_approval_notification_at" timestamp(3) with time zone;

    ALTER TABLE "referrals"
      ADD COLUMN IF NOT EXISTS "sale_amount" numeric,
      ADD COLUMN IF NOT EXISTS "commission_rate" numeric,
      ADD COLUMN IF NOT EXISTS "provider_checkout_id" varchar,
      ADD COLUMN IF NOT EXISTS "is_reversed" boolean DEFAULT false NOT NULL,
      ADD COLUMN IF NOT EXISTS "payout_request_id" integer,
      ADD COLUMN IF NOT EXISTS "payout_history" jsonb DEFAULT '[]'::jsonb;

    ALTER TABLE "payout_requests"
      ADD COLUMN IF NOT EXISTS "prior_payout_offset" numeric DEFAULT 0 NOT NULL,
      ADD COLUMN IF NOT EXISTS "adjustment_offset" numeric DEFAULT 0 NOT NULL,
      ADD COLUMN IF NOT EXISTS "payout_method" "enum_payout_requests_payout_method",
      ADD COLUMN IF NOT EXISTS "country" varchar,
      ADD COLUMN IF NOT EXISTS "account_name" varchar,
      ADD COLUMN IF NOT EXISTS "bank_name" varchar,
      ADD COLUMN IF NOT EXISTS "account_number" varchar,
      ADD COLUMN IF NOT EXISTS "wallet_address" varchar,
      ADD COLUMN IF NOT EXISTS "network" varchar DEFAULT 'TRC-20',
      ADD COLUMN IF NOT EXISTS "transaction_reference" varchar,
      ADD COLUMN IF NOT EXISTS "paid_at" timestamp(3) with time zone,
      ADD COLUMN IF NOT EXISTS "rejection_reason" varchar;

    CREATE TABLE IF NOT EXISTS "affiliate_disputes" (
      "id" serial PRIMARY KEY NOT NULL,
      "affiliate_id" integer NOT NULL,
      "subject" varchar NOT NULL,
      "category" "enum_affiliate_disputes_category" NOT NULL,
      "details" varchar NOT NULL,
      "status" "enum_affiliate_disputes_status" DEFAULT 'submitted' NOT NULL,
      "admin_response" varchar,
      "resolved_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "affiliate_kyc" (
      "id" serial PRIMARY KEY NOT NULL,
      "affiliate_id" integer NOT NULL,
      "legal_name" varchar NOT NULL,
      "date_of_birth" timestamp(3) with time zone NOT NULL,
      "country" varchar NOT NULL,
      "residential_address" varchar NOT NULL,
      "identity_type" "enum_affiliate_kyc_identity_type" NOT NULL,
      "identity_last_four" varchar NOT NULL,
      "status" "enum_affiliate_kyc_status" DEFAULT 'submitted' NOT NULL,
      "review_notes" varchar,
      "submitted_at" timestamp(3) with time zone,
      "reviewed_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "affiliate_ledger_adjustments" (
      "id" serial PRIMARY KEY NOT NULL,
      "affiliate_id" integer NOT NULL,
      "referral_id" integer NOT NULL,
      "amount" numeric NOT NULL,
      "reason" "enum_affiliate_ledger_adjustments_reason" NOT NULL,
      "reference" varchar,
      "provider_event_id" varchar,
      "status" "enum_affiliate_ledger_adjustments_status" DEFAULT 'unapplied' NOT NULL,
      "payout_request_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "affiliate_disputes_id" integer,
      ADD COLUMN IF NOT EXISTS "affiliate_kyc_id" integer,
      ADD COLUMN IF NOT EXISTS "affiliate_ledger_adjustments_id" integer;

    DO $$ BEGIN
      ALTER TABLE "referrals"
        ADD CONSTRAINT "referrals_payout_request_id_payout_requests_id_fk"
        FOREIGN KEY ("payout_request_id") REFERENCES "public"."payout_requests"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "affiliate_disputes"
        ADD CONSTRAINT "affiliate_disputes_affiliate_id_affiliates_id_fk"
        FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "affiliate_kyc"
        ADD CONSTRAINT "affiliate_kyc_affiliate_id_affiliates_id_fk"
        FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "affiliate_ledger_adjustments"
        ADD CONSTRAINT "affiliate_ledger_adjustments_affiliate_id_affiliates_id_fk"
        FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "affiliate_ledger_adjustments"
        ADD CONSTRAINT "affiliate_ledger_adjustments_referral_id_referrals_id_fk"
        FOREIGN KEY ("referral_id") REFERENCES "public"."referrals"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "affiliate_ledger_adjustments"
        ADD CONSTRAINT "affiliate_ledger_adjustments_payout_request_id_payout_requests_id_fk"
        FOREIGN KEY ("payout_request_id") REFERENCES "public"."payout_requests"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_affiliate_disputes_fk"
        FOREIGN KEY ("affiliate_disputes_id")
        REFERENCES "public"."affiliate_disputes"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_affiliate_ledger_adjustments_fk"
        FOREIGN KEY ("affiliate_ledger_adjustments_id")
        REFERENCES "public"."affiliate_ledger_adjustments"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_affiliate_kyc_fk"
        FOREIGN KEY ("affiliate_kyc_id")
        REFERENCES "public"."affiliate_kyc"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS "referrals_provider_checkout_id_idx"
      ON "referrals" USING btree ("provider_checkout_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "enrollments_provider_checkout_id_idx"
      ON "enrollments" USING btree ("provider_checkout_id");
    CREATE INDEX IF NOT EXISTS "referrals_payout_request_idx"
      ON "referrals" USING btree ("payout_request_id");
    CREATE INDEX IF NOT EXISTS "affiliate_disputes_affiliate_idx"
      ON "affiliate_disputes" USING btree ("affiliate_id");
    CREATE INDEX IF NOT EXISTS "affiliate_disputes_status_idx"
      ON "affiliate_disputes" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "affiliate_disputes_created_at_idx"
      ON "affiliate_disputes" USING btree ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "affiliate_kyc_affiliate_idx"
      ON "affiliate_kyc" USING btree ("affiliate_id");
    CREATE INDEX IF NOT EXISTS "affiliate_kyc_status_idx"
      ON "affiliate_kyc" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "affiliate_kyc_created_at_idx"
      ON "affiliate_kyc" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "affiliate_ledger_adjustments_affiliate_idx"
      ON "affiliate_ledger_adjustments" USING btree ("affiliate_id");
    CREATE INDEX IF NOT EXISTS "affiliate_ledger_adjustments_referral_idx"
      ON "affiliate_ledger_adjustments" USING btree ("referral_id");
    CREATE INDEX IF NOT EXISTS "affiliate_ledger_adjustments_status_idx"
      ON "affiliate_ledger_adjustments" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "affiliate_ledger_adjustments_payout_request_idx"
      ON "affiliate_ledger_adjustments" USING btree ("payout_request_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "affiliate_ledger_adjustments_provider_event_id_idx"
      ON "affiliate_ledger_adjustments" USING btree ("provider_event_id");
    CREATE INDEX IF NOT EXISTS "affiliate_ledger_adjustments_created_at_idx"
      ON "affiliate_ledger_adjustments" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_affiliate_disputes_id_idx"
      ON "payload_locked_documents_rels" USING btree ("affiliate_disputes_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_affiliate_kyc_id_idx"
      ON "payload_locked_documents_rels" USING btree ("affiliate_kyc_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_affiliate_ledger_adjustments_id_idx"
      ON "payload_locked_documents_rels" USING btree ("affiliate_ledger_adjustments_id");

    ALTER TABLE public."affiliate_disputes" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public."affiliate_kyc" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public."affiliate_ledger_adjustments" ENABLE ROW LEVEL SECURITY;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_affiliate_disputes_fk",
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_affiliate_kyc_fk",
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_affiliate_ledger_adjustments_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_affiliate_disputes_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_affiliate_kyc_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_affiliate_ledger_adjustments_id_idx";
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "affiliate_disputes_id",
      DROP COLUMN IF EXISTS "affiliate_kyc_id",
      DROP COLUMN IF EXISTS "affiliate_ledger_adjustments_id";

    DROP TABLE IF EXISTS "affiliate_disputes" CASCADE;
    DROP TABLE IF EXISTS "affiliate_kyc" CASCADE;
    DROP INDEX IF EXISTS "affiliate_ledger_adjustments_provider_event_id_idx";
    DROP TABLE IF EXISTS "affiliate_ledger_adjustments" CASCADE;

    DROP INDEX IF EXISTS "enrollments_provider_checkout_id_idx";
    ALTER TABLE "enrollments"
      DROP COLUMN IF EXISTS "provider_checkout_id";

    ALTER TABLE "referrals"
      DROP CONSTRAINT IF EXISTS "referrals_payout_request_id_payout_requests_id_fk";
    DROP INDEX IF EXISTS "referrals_provider_checkout_id_idx";
    DROP INDEX IF EXISTS "referrals_payout_request_idx";
    ALTER TABLE "referrals"
      DROP COLUMN IF EXISTS "sale_amount",
      DROP COLUMN IF EXISTS "commission_rate",
      DROP COLUMN IF EXISTS "provider_checkout_id",
      DROP COLUMN IF EXISTS "is_reversed",
      DROP COLUMN IF EXISTS "payout_request_id",
      DROP COLUMN IF EXISTS "payout_history";

    ALTER TABLE "payout_requests"
      DROP COLUMN IF EXISTS "prior_payout_offset",
      DROP COLUMN IF EXISTS "adjustment_offset",
      DROP COLUMN IF EXISTS "payout_method",
      DROP COLUMN IF EXISTS "country",
      DROP COLUMN IF EXISTS "account_name",
      DROP COLUMN IF EXISTS "bank_name",
      DROP COLUMN IF EXISTS "account_number",
      DROP COLUMN IF EXISTS "wallet_address",
      DROP COLUMN IF EXISTS "network",
      DROP COLUMN IF EXISTS "transaction_reference",
      DROP COLUMN IF EXISTS "paid_at",
      DROP COLUMN IF EXISTS "rejection_reason";

    ALTER TABLE "affiliate_applications"
      DROP COLUMN IF EXISTS "decision_history",
      DROP COLUMN IF EXISTS "approval_notification_status",
      DROP COLUMN IF EXISTS "last_approval_notification_at";
    ALTER TABLE "affiliates"
      DROP COLUMN IF EXISTS "referral_link_active";

    DROP TYPE IF EXISTS "public"."enum_payout_requests_payout_method";
    DROP TYPE IF EXISTS "public"."enum_affiliate_disputes_category";
    DROP TYPE IF EXISTS "public"."enum_affiliate_disputes_status";
    DROP TYPE IF EXISTS "public"."enum_affiliate_kyc_identity_type";
    DROP TYPE IF EXISTS "public"."enum_affiliate_kyc_status";
    DROP TYPE IF EXISTS "public"."enum_affiliate_ledger_adjustments_reason";
    DROP TYPE IF EXISTS "public"."enum_affiliate_ledger_adjustments_status";
    DROP TYPE IF EXISTS "public"."enum_affiliate_applications_approval_notification_status";
  `);
}
