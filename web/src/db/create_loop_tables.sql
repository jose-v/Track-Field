-- Create Loop Posts Table
CREATE TABLE IF NOT EXISTS "loop_posts" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "content" TEXT,
  "media_urls" TEXT[] DEFAULT '{}',
  "post_type" TEXT NOT NULL DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'video')),
  "likes" INTEGER DEFAULT 0,
  "comments_count" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Loop Comments Table
CREATE TABLE IF NOT EXISTS "loop_comments" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "post_id" UUID NOT NULL REFERENCES loop_posts(id) ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Loop Likes Table
CREATE TABLE IF NOT EXISTS "loop_likes" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "post_id" UUID NOT NULL REFERENCES loop_posts(id) ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Create Loop Bookmarks Table
CREATE TABLE IF NOT EXISTS "loop_bookmarks" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "post_id" UUID NOT NULL REFERENCES loop_posts(id) ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_loop_posts_updated_at
BEFORE UPDATE ON loop_posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loop_comments_updated_at
BEFORE UPDATE ON loop_comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Set up RLS (Row Level Security) policies

-- Enable Row Level Security
ALTER TABLE loop_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loop_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE loop_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE loop_bookmarks ENABLE ROW LEVEL SECURITY;

-- Create policies for posts
-- Users can read all posts
CREATE POLICY "Anyone can read posts"
ON loop_posts FOR SELECT
USING (true);

-- Users can insert their own posts
CREATE POLICY "Users can create their own posts"
ON loop_posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update their own posts"
ON loop_posts FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete their own posts"
ON loop_posts FOR DELETE
USING (auth.uid() = user_id);

-- Create policies for comments
-- Users can read all comments
CREATE POLICY "Anyone can read comments"
ON loop_comments FOR SELECT
USING (true);

-- Users can insert their own comments
CREATE POLICY "Users can create their own comments"
ON loop_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
ON loop_comments FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
ON loop_comments FOR DELETE
USING (auth.uid() = user_id);

-- Create policies for likes
-- Users can read all likes
CREATE POLICY "Anyone can read likes"
ON loop_likes FOR SELECT
USING (true);

-- Users can insert their own likes
CREATE POLICY "Users can create their own likes"
ON loop_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete their own likes"
ON loop_likes FOR DELETE
USING (auth.uid() = user_id);

-- Create policies for bookmarks
-- Users can read their own bookmarks
CREATE POLICY "Users can read their own bookmarks"
ON loop_bookmarks FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own bookmarks
CREATE POLICY "Users can create their own bookmarks"
ON loop_bookmarks FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own bookmarks
CREATE POLICY "Users can delete their own bookmarks"
ON loop_bookmarks FOR DELETE
USING (auth.uid() = user_id);

-- Create a storage bucket for Loop media
INSERT INTO storage.buckets (id, name, public)
VALUES ('loop_media', 'loop_media', true);

-- Set up RLS for storage
CREATE POLICY "Anyone can read Loop media"
ON storage.objects FOR SELECT
USING (bucket_id = 'loop_media');

CREATE POLICY "Authenticated users can upload Loop media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'loop_media' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own Loop media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'loop_media'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own Loop media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'loop_media'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
); 