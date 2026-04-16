interface JsonLdProps {
  data: Record<string, unknown>;
}

/**
 * JSON-LD 注入组件。
 *
 * 负责把结构化数据以 script 标签形式输出到页面，供搜索引擎消费，
 * 上层页面只需要准备符合 schema.org 约定的数据对象。
 * 该组件不校验 schema 正确性，调用方需要自行保证传入数据已经完成序列化前的业务校验。
 * 之所以保持为极薄封装，是为了让不同前台页面可以复用同一输出方式，而不重复手写 script 标签。
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

