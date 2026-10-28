import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_lessons_quiz_questions_correct_option" AS ENUM('A', 'B', 'C');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "lessons_quiz_questions" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "question" varchar NOT NULL,
      "option_a" varchar NOT NULL,
      "option_b" varchar NOT NULL,
      "option_c" varchar NOT NULL,
      "correct_option" "enum_lessons_quiz_questions_correct_option" NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "lessons_quiz_questions"
        ADD CONSTRAINT "lessons_quiz_questions_parent_id_lessons_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."lessons"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "lessons_quiz_questions_order_idx"
      ON "lessons_quiz_questions" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "lessons_quiz_questions_parent_id_idx"
      ON "lessons_quiz_questions" USING btree ("_parent_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "lessons_quiz_questions" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_lessons_quiz_questions_correct_option";
  `)
}
