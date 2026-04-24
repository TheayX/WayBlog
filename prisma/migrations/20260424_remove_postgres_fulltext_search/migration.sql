-- DropTrigger: 搜索已改为应用层实现，不再维护旧搜索触发器
DROP TRIGGER IF EXISTS post_search_vector_trigger ON "Post";

-- DropFunction: 清理旧搜索触发器函数
DROP FUNCTION IF EXISTS post_search_vector_update();

-- DropIndex: 清理旧搜索索引
DROP INDEX IF EXISTS "Post_search_vector_idx";

-- DropColumn: 移除不再使用的搜索向量字段
ALTER TABLE "Post" DROP COLUMN IF EXISTS "search_vector";
