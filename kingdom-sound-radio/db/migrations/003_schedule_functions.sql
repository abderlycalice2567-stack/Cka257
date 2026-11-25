-- Schedule expansion. Recurring rules are written in the station's local time;
-- Postgres converts each local slot to UTC (DST-aware) via AT TIME ZONE.

-- Returns the concrete UTC slots for a rule within [p_from, p_from + p_days).
CREATE FUNCTION schedule_slots(
  p_weekdays smallint[], p_start time, p_duration integer, p_tz text,
  p_from date, p_days integer, p_valid_from date DEFAULT NULL, p_valid_until date DEFAULT NULL
) RETURNS TABLE (starts_at timestamptz, ends_at timestamptz)
LANGUAGE sql STABLE AS $$
  SELECT (d::date + p_start) AT TIME ZONE p_tz,
         ((d::date + p_start) AT TIME ZONE p_tz) + make_interval(mins => p_duration)
  FROM generate_series(p_from, p_from + (p_days - 1), interval '1 day') AS d
  WHERE extract(dow FROM d)::smallint = ANY (p_weekdays)
    AND (p_valid_from IS NULL OR d::date >= p_valid_from)
    AND (p_valid_until IS NULL OR d::date <= p_valid_until)
$$;

-- Re-materializes upcoming occurrences for one schedule (or all when NULL).
-- Occurrences an editor changed by hand (manually_edited) are preserved.
CREATE FUNCTION materialize_occurrences(p_schedule uuid DEFAULT NULL, p_days integer DEFAULT 21)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  tz text;
  today date;
  inserted integer := 0;
  n integer;
  s record;
BEGIN
  SELECT timezone INTO tz FROM stations ORDER BY created_at LIMIT 1;
  tz := coalesce(tz, 'America/New_York');
  today := (now() AT TIME ZONE tz)::date - 1;

  FOR s IN SELECT * FROM broadcast_schedules WHERE p_schedule IS NULL OR id = p_schedule LOOP
    DELETE FROM broadcast_occurrences o
     WHERE o.schedule_id = s.id AND o.starts_at >= now() AND NOT o.manually_edited;

    IF s.active THEN
      INSERT INTO broadcast_occurrences (schedule_id, program_id, starts_at, ends_at, is_rebroadcast)
      SELECT s.id, s.program_id, sl.starts_at, sl.ends_at, s.is_rebroadcast
        FROM schedule_slots(s.weekdays, s.start_time, s.duration_minutes, tz, today, p_days + 1,
                            s.valid_from, s.valid_until) sl
       WHERE sl.ends_at > now() - interval '1 day'
      ON CONFLICT (schedule_id, starts_at) DO NOTHING;
      GET DIAGNOSTICS n = ROW_COUNT;
      inserted := inserted + n;
    END IF;
  END LOOP;
  RETURN inserted;
END $$;
