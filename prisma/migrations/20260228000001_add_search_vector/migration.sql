-- 1. 添加 search_vector 列
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- 2. 创建 GIN 索引
CREATE INDEX IF NOT EXISTS "Post_search_vector_idx" ON "Post" USING GIN ("search_vector");

-- 3. 创建触发器函数：INSERT/UPDATE 时自动更新 search_vector
CREATE OR REPLACE FUNCTION post_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.content, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 创建触发器
DROP TRIGGER IF EXISTS post_search_vector_trigger ON "Post";
CREATE TRIGGER post_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, content ON "Post"
  FOR EACH ROW EXECUTE FUNCTION post_search_vector_update();

-- 5. 回填已有数据
UPDATE "Post" SET "search_vector" =
  setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(content, '')), 'B');

