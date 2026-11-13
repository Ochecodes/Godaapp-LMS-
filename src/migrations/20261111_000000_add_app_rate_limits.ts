import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS public.app_rate_limits (
      key_hash text PRIMARY KEY CHECK (key_hash ~ '^[a-f0-9]{64}$'),
      window_started_at timestamptz NOT NULL,
      request_count integer NOT NULL CHECK (request_count > 0),
      expires_at timestamptz NOT NULL
    );

    CREATE INDEX IF NOT EXISTS app_rate_limits_expires_at_idx
      ON public.app_rate_limits (expires_at);

    ALTER TABLE public.app_rate_limits ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON TABLE public.app_rate_limits FROM PUBLIC, anon, authenticated;
    GRANT ALL ON TABLE public.app_rate_limits TO service_role;

    CREATE OR REPLACE FUNCTION public.consume_app_rate_limits(
      p_key_hashes text[],
      p_limits integer[],
      p_window_seconds integer[]
    )
    RETURNS TABLE (allowed boolean, retry_after_seconds integer)
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = ''
    AS $function$
    DECLARE
      v_index integer;
      v_expires_at timestamptz;
      v_request_count integer;
      v_retry_after integer := 0;
      v_now timestamptz := clock_timestamp();
    BEGIN
      IF p_key_hashes IS NULL
        OR p_limits IS NULL
        OR p_window_seconds IS NULL
        OR cardinality(p_key_hashes) < 1
        OR cardinality(p_key_hashes) > 4
        OR cardinality(p_key_hashes) <> cardinality(p_limits)
        OR cardinality(p_key_hashes) <> cardinality(p_window_seconds)
      THEN
        RAISE EXCEPTION 'Invalid rate-limit request.';
      END IF;

      FOR v_index IN 1..cardinality(p_key_hashes) LOOP
        IF p_key_hashes[v_index] !~ '^[a-f0-9]{64}$'
          OR p_limits[v_index] < 1
          OR p_limits[v_index] > 10000
          OR p_window_seconds[v_index] < 1
          OR p_window_seconds[v_index] > 604800
        THEN
          RAISE EXCEPTION 'Invalid rate-limit rule.';
        END IF;

        INSERT INTO public.app_rate_limits AS current_limit (
          key_hash,
          window_started_at,
          request_count,
          expires_at
        )
        VALUES (
          p_key_hashes[v_index],
          v_now,
          1,
          v_now + make_interval(secs => p_window_seconds[v_index])
        )
        ON CONFLICT (key_hash) DO UPDATE
        SET
          window_started_at = CASE
            WHEN current_limit.window_started_at
              + make_interval(secs => p_window_seconds[v_index]) <= v_now
            THEN v_now
            ELSE current_limit.window_started_at
          END,
          request_count = CASE
            WHEN current_limit.window_started_at
              + make_interval(secs => p_window_seconds[v_index]) <= v_now
            THEN 1
            ELSE current_limit.request_count + 1
          END,
          expires_at = CASE
            WHEN current_limit.window_started_at
              + make_interval(secs => p_window_seconds[v_index]) <= v_now
            THEN v_now + make_interval(secs => p_window_seconds[v_index])
            ELSE current_limit.expires_at
          END
        RETURNING
          current_limit.request_count,
          current_limit.expires_at
        INTO v_request_count, v_expires_at;

        IF v_request_count > p_limits[v_index] THEN
          v_retry_after := greatest(
            v_retry_after,
            ceil(extract(epoch FROM (v_expires_at - v_now))::numeric)::integer
          );
        END IF;
      END LOOP;

      IF random() < 0.01 THEN
        WITH expired AS (
          SELECT key_hash
          FROM public.app_rate_limits
          WHERE expires_at < v_now
          ORDER BY expires_at
          LIMIT 500
        )
        DELETE FROM public.app_rate_limits AS rate_limit
        USING expired
        WHERE rate_limit.key_hash = expired.key_hash;
      END IF;

      RETURN QUERY SELECT v_retry_after = 0, v_retry_after;
    END;
    $function$;

    REVOKE ALL ON FUNCTION public.consume_app_rate_limits(text[], integer[], integer[])
      FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.consume_app_rate_limits(text[], integer[], integer[])
      TO service_role;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP FUNCTION IF EXISTS public.consume_app_rate_limits(text[], integer[], integer[]);
    DROP TABLE IF EXISTS public.app_rate_limits;
  `);
}
