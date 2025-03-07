-- Add completed status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'workouts' AND column_name = 'completed') THEN
        ALTER TABLE workouts ADD COLUMN completed BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add completed_at timestamp column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'workouts' AND column_name = 'completed_at') THEN
        ALTER TABLE workouts ADD COLUMN completed_at TIMESTAMPTZ;
    END IF;
END $$;

-- Add completed_exercises array column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'workouts' AND column_name = 'completed_exercises') THEN
        ALTER TABLE workouts ADD COLUMN completed_exercises TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Comment on columns
COMMENT ON COLUMN workouts.completed IS 'Whether the workout has been fully completed';
COMMENT ON COLUMN workouts.completed_at IS 'Timestamp when the workout was completed';
COMMENT ON COLUMN workouts.completed_exercises IS 'Array of completed exercise names';
