-- Create goals table if it doesn't exist
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_count INTEGER NOT NULL,
  current_count INTEGER DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  category TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Create user_stats table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_workout_date DATE,
  monthly_goals_total INTEGER DEFAULT 0,
  monthly_goals_completed INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for goals table
-- 1. SELECT policy - users can only see their own goals
CREATE POLICY "Users can view their own goals"
ON goals FOR SELECT
USING (auth.uid() = user_id);

-- 2. INSERT policy - users can only insert their own goals
CREATE POLICY "Users can insert their own goals"
ON goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. UPDATE policy - users can only update their own goals
CREATE POLICY "Users can update their own goals"
ON goals FOR UPDATE
USING (auth.uid() = user_id);

-- 4. DELETE policy - users can only delete their own goals
CREATE POLICY "Users can delete their own goals"
ON goals FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for user_stats table
-- 1. SELECT policy - users can only see their own stats
CREATE POLICY "Users can view their own stats"
ON user_stats FOR SELECT
USING (auth.uid() = user_id);

-- 2. INSERT policy - users can only insert their own stats
CREATE POLICY "Users can insert their own stats"
ON user_stats FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. UPDATE policy - users can only update their own stats
CREATE POLICY "Users can update their own stats"
ON user_stats FOR UPDATE
USING (auth.uid() = user_id);

-- Function to update streaks (can be called by a cron job or trigger)
CREATE OR REPLACE FUNCTION update_user_streaks()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  last_workout DATE;
  today DATE := CURRENT_DATE;
BEGIN
  FOR user_record IN SELECT user_id FROM user_stats LOOP
    -- Get the user's most recent completed workout
    SELECT completed_at::date INTO last_workout 
    FROM workouts 
    WHERE user_id = user_record.user_id AND completed = true
    ORDER BY completed_at DESC 
    LIMIT 1;
    
    -- Update streak logic
    IF last_workout = today THEN
      -- Workout today, streak continues or starts
      UPDATE user_stats 
      SET current_streak = CASE
            WHEN last_workout_date = (today - INTERVAL '1 day')::date THEN current_streak + 1
            WHEN last_workout_date = today THEN current_streak -- Already counted today
            ELSE 1 -- New streak starting
          END,
          longest_streak = GREATEST(
            longest_streak, 
            CASE
              WHEN last_workout_date = (today - INTERVAL '1 day')::date THEN current_streak + 1
              WHEN last_workout_date = today THEN current_streak
              ELSE 1
            END
          ),
          last_workout_date = last_workout,
          updated_at = NOW()
      WHERE user_id = user_record.user_id;
    ELSIF last_workout = (today - INTERVAL '1 day')::date AND
          (user_record.last_workout_date IS NULL OR user_record.last_workout_date <> last_workout) THEN
      -- Workout yesterday but not counted yet
      UPDATE user_stats 
      SET current_streak = current_streak + 1,
          longest_streak = GREATEST(longest_streak, current_streak + 1),
          last_workout_date = last_workout,
          updated_at = NOW()
      WHERE user_id = user_record.user_id;
    ELSIF last_workout < (today - INTERVAL '1 day')::date AND
          user_record.last_workout_date <> last_workout THEN
      -- Streak broken - more than a day since last workout
      UPDATE user_stats 
      SET current_streak = 0,
          last_workout_date = last_workout,
          updated_at = NOW()
      WHERE user_id = user_record.user_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update user_stats when a workout is marked as completed
CREATE OR REPLACE FUNCTION handle_new_completed_workout()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run on completed workouts
  IF NEW.completed = TRUE THEN
    -- Insert or update user_stats
    INSERT INTO user_stats (user_id, current_streak, longest_streak, last_workout_date, updated_at)
    VALUES (
      NEW.user_id, 
      1, -- Start with streak of 1
      1, -- Start with longest streak of 1
      NEW.completed_at::date,
      NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      -- Update streak only if this is a new day
      current_streak = CASE
        WHEN user_stats.last_workout_date = NEW.completed_at::date THEN 
          user_stats.current_streak -- Same day, don't increase streak
        WHEN user_stats.last_workout_date = (NEW.completed_at::date - INTERVAL '1 day')::date THEN
          user_stats.current_streak + 1 -- Next day, increase streak
        ELSE 1 -- Gap in days, reset streak
      END,
      longest_streak = GREATEST(
        user_stats.longest_streak,
        CASE
          WHEN user_stats.last_workout_date = NEW.completed_at::date THEN 
            user_stats.current_streak
          WHEN user_stats.last_workout_date = (NEW.completed_at::date - INTERVAL '1 day')::date THEN
            user_stats.current_streak + 1
          ELSE 1
        END
      ),
      last_workout_date = NEW.completed_at::date,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update stats when a workout is completed
CREATE TRIGGER workout_completed_trigger
AFTER INSERT OR UPDATE ON workouts
FOR EACH ROW
EXECUTE FUNCTION handle_new_completed_workout();

-- Comment out the next two lines if you don't want to create test data
-- To create test data, replace YOUR_USER_ID with an actual user ID from your auth.users table
INSERT INTO goals (user_id, title, description, target_count, start_date, end_date, category, completed)
VALUES ('2c0c8720-d3f2-4290-99a9-d7718b903e8f', 'Complete 10 workouts', 'Finish at least 10 workouts this month', 10, date_trunc('month', current_date), (date_trunc('month', current_date) + interval '1 month' - interval '1 day'), 'workout', false);
