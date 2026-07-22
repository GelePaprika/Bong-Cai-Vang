
CREATE TABLE public.recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  name_vi TEXT,
  cuisine TEXT,
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  instructions TEXT,
  shopping_list JSONB NOT NULL DEFAULT '[]'::jsonb,
  preparation_time INTEGER,
  cooking_time INTEGER,
  servings INTEGER,
  difficulty TEXT,
  nutrition JSONB NOT NULL DEFAULT '{}'::jsonb,
  image_url TEXT,
  language TEXT,
  ai_model TEXT,
  recipe_source TEXT NOT NULL DEFAULT 'AI',
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX recipes_created_at_idx ON public.recipes (created_at DESC);
CREATE INDEX recipes_tags_idx ON public.recipes USING GIN (tags);
CREATE INDEX recipes_cuisine_idx ON public.recipes (cuisine);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipes TO authenticated;
GRANT ALL ON public.recipes TO service_role;

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read recipes"
  ON public.recipes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own recipes"
  ON public.recipes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own recipes"
  ON public.recipes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes"
  ON public.recipes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
