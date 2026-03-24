ALTER TABLE public.barbers
ADD COLUMN IF NOT EXISTS work_start time without time zone,
ADD COLUMN IF NOT EXISTS work_end time without time zone;
