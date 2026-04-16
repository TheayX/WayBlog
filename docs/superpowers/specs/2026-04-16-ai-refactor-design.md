# WayBlog AI 模块轻量主流化重构设计

## 背景

项目近期已将 AI 主路径从本地部署的开源模型切换到阿里百炼 API 模型。现有 AI 能力可用，但随着多 provider 支持、提示词多轮迭代以及后台编辑页交互逐步增加，`src/lib/ai` 与 `src/components/admin/PostForm.tsx` 的职责边界开始变得模糊：

- AI 入口文件同时承担 prompt 组织、provider 选择、结果归一化等多种职责
- `prompts.ts` 集中承载系统提示词、整篇优化提示词、单字段提示词，后续继续扩展会变重
- `client.ts` 的命名与真实职责不一致，实际承担的是结果清洗/归一化
- API route 已较薄，但错误语义和 provider 细节仍可进一步收口
- 后台表单中 AI 请求、结果应用、分类/标签匹配、错误提示等逻辑逐渐膨胀

本次重构目标不是将项目做成 AI 平台，而是在保持项目体量和现有功能范围的前提下，采用更符合中小型 Next.js 项目的主流组织方式，重点清理 AI 模块结构，并顺手整理与 AI 强相关的前后端边界。

## 目标

1. 保留多 provider 能力，继续支持阿里百炼与 Ollama 切换
2. 保持现有 AI 功能范围不变：整篇优化、单字段优化、分类建议、标签建议
3. 将 AI 模块拆分为清晰分层：配置、任务、提示词、provider、结果归一化、服务入口
4. 简化提示词，去掉明显冗余的约束和重复说明，改为“短而准、按任务组织”
5. 保持 API 路径不变，但让 route handler 更薄、更稳定
6. 适度减轻 `PostForm.tsx` 中 AI 相关逻辑的职责，保留现有交互体验
7. 统一 AI 模块目录和文件命名，使名称能准确表达职责

## 非目标

本次不做以下事项：

- 不重构整个 `src/app` 目录结构
- 不大规模移动全局 `components` / `lib` / `app` 的目录层次
- 不调整 Prisma schema 或数据库结构
- 不改变博客前台页面组织方式
- 不缩减或扩展 AI 功能范围
- 不引入复杂的模型能力编排、提示词版本系统、多轮会话框架
- 不为了未来可能接入很多模型而做过度抽象

## 设计原则

### 1. 轻量多 provider，而不是平台化抽象

业务层只需要知道“执行什么 AI 任务”和“拿回什么标准结果”，不需要知道底层是阿里百炼还是 Ollama。provider 层保留，但只承担平台通信职责，不承载业务语义。

### 2. 按任务组织，而不是按历史文件堆积

整篇优化和单字段优化是当前真实存在的任务边界，因此提示词、结果归一化和部分服务编排应围绕这两个任务组织，而不是继续堆进一个大文件。

### 3. 主路径围绕阿里百炼优化，备用路径保留 Ollama

虽然项目保留多 provider 能力，但当前产品目标已明确转向“更聪明的在线模型优先”。因此文案、错误提示和调用体验应围绕阿里百炼为主路径来设计，同时保留 Ollama 作为本地调试或备用路径。

### 4. 目录和文件命名要服务于理解成本

文件命名优先体现职责，不使用含糊命名。目录使用小写英文、kebab-case 或常见复数命名。减少像 `index.ts`、`client.ts` 这类在当前上下文中不够自解释的名字作为核心实现入口。

## 建议结构

### AI 模块结构

建议将 `src/lib/ai` 重构为如下形式：

```text
src/lib/ai/
  config.ts
  types.ts
  service.ts
  tasks/
    optimize-post.ts
    optimize-field.ts
  prompts/
    shared.ts
    optimize-post.ts
    optimize-field.ts
  providers/
    types.ts
    registry.ts
    aliyun-bailian.ts
    ollama.ts
  normalizers/
    shared.ts
    optimize-post.ts
    optimize-field.ts
```

### 各层职责

#### `config.ts`

负责读取并规范化 AI 相关环境变量：provider、timeout、百炼配置、Ollama 配置。该层只输出干净配置，不混入任务逻辑。

#### `types.ts`

保留 AI 领域的输入输出类型，继续承载：

- `AiOptimizeInput`
- `AiFieldInput`
- `AiOptimizeResult`
- `AiFieldResult`
- 分类/标签建议类型

必要时可补充少量 provider 层共享类型，但避免把所有 provider 内部结构暴露到业务层。

#### `service.ts`

作为 AI 业务统一入口，对外提供稳定方法：

- `optimizePostWithAi`
- `optimizeFieldWithAi`

它负责串起：任务定义、provider 选择、provider 调用、结果归一化。业务层和 route handler 只依赖这一层。

#### `tasks/*`

按任务拆分：

- `optimize-post.ts`
- `optimize-field.ts`

每个任务文件负责本任务的 prompt 构建、执行路径选择以及对应 normalizer 的调用约定。任务层承载的是“我要做什么”，不是“怎么请求百炼”。

#### `prompts/*`

拆分原本集中的 `prompts.ts`：

- `shared.ts`：共享约束与系统级共识
- `optimize-post.ts`：整篇优化任务 prompt
- `optimize-field.ts`：单字段优化任务 prompt

这样能避免一个大文件同时承载所有任务描述，也方便后续针对不同任务单独调整。

#### `providers/*`

provider 层只负责平台通信：

- 读取必要配置
- 发送模型请求
- 返回原始文本
- 抛出可识别的 provider 层错误

不在 provider 层理解“标题优化”“分类建议”等业务概念。

`registry.ts` 负责根据当前配置返回对应 provider，实现 provider 选择逻辑集中化，避免业务入口写散落的 `if/else`。

#### `normalizers/*`

将现有 `client.ts` 的职责重命名并拆分到 `normalizers/`：

- `shared.ts`：共享字符串清洗、代码围栏剥离等逻辑
- `optimize-post.ts`：整篇优化结果归一化
- `optimize-field.ts`：单字段结果归一化

该层是模型不稳定输出与前端稳定数据结构之间的缓冲层。

## 命名规范

### 目录命名

- 使用小写英文
- 使用语义明确的复数目录名，如 `providers`、`prompts`、`normalizers`、`tasks`

### 文件命名

- 优先使用职责驱动命名：`service.ts`、`registry.ts`
- 任务文件按任务名命名：`optimize-post.ts`、`optimize-field.ts`
- 共享工具明确标识为 `shared.ts`

### 现有文件处理建议

- `src/lib/ai/index.ts`：不再作为主要实现承载文件。可删除，或仅作为薄 re-export，核心实现迁移到 `service.ts`
- `src/lib/ai/client.ts`：更名并拆入 `normalizers/`，因为该文件实际职责是结果归一化
- `src/lib/ai/prompts.ts`：拆分为 `prompts/shared.ts`、`prompts/optimize-post.ts`、`prompts/optimize-field.ts`
- `src/lib/ai/providers/aliyun-bailian.ts` 与 `src/lib/ai/providers/ollama.ts`：命名可保留，但接口风格需统一

## Prompt 设计

### 总体策略

提示词采用“尽量简化”的策略，不再为了弥补模型能力持续堆规则。保留真正必要的边界与输出格式约束，其余内容尽量转化为明确目标而非密集控制。

### 共享约束保留项

共享约束建议只保留以下核心内容：

- 保留原意，不编造事实
- 输出必须是合法 JSON
- 正文内容为纯 Markdown
- slug 只允许小写字母、数字、连字符
- 摘要长度要求
- 分类和标签优先从候选项中选择

### 任务级 prompt 原则

#### 整篇优化

聚焦于：

- 在不编造事实的前提下优化表达
- 提升可读性和发布质量
- 产出完整结构化 JSON

对正文结构的要求从“强规则”调整为“偏好提示”，避免写成死板模板。

#### 单字段优化

继续保留按字段生成不同 prompt 的能力，但整体组织方式统一。每个字段只描述本字段目标与约束，避免共享说明和字段说明大量重复。

## Provider 接口设计

### 统一协议

provider 层建议统一为轻量接口：

输入：

- system prompt
- user prompt
- provider 配置 / model / timeout

输出：

- 原始文本响应

由任务层或服务层决定如何进一步解析与归一化。这样可以把 provider 的职责限制在“发送请求并拿回结果”，避免 provider 继续承担 JSON 结构理解等业务责任。

### provider 间差异控制

阿里百炼与 Ollama 在 HTTP 协议、消息格式、错误文本上会不同，但这些差异应只停留在 provider 内部，不继续外溢到 route handler、任务层或前端文案。

## 数据流设计

### 后端调用链路

AI API 的建议调用链如下：

```text
Route Handler
  -> Auth Guard
  -> Zod Validation
  -> AI Service
      -> Task
      -> Provider Registry
      -> Provider Call
      -> Normalizer
  -> Standard Response
```

这意味着：

- route handler 不直接碰 prompt
- route handler 不直接选择 provider
- route handler 不直接处理模型原始输出
- service 作为 AI 业务唯一主入口

### 前端调用链路

后台编辑页继续调用：

- `POST /api/ai/optimize`
- `POST /api/ai/field`

接口路径和基本交互不变，但前端内部 AI 请求与结果应用逻辑会适度收口，避免 `PostForm.tsx` 继续膨胀。

## 前端重构边界

### `PostForm.tsx`

当前文件除表单 UI 外，还承担：

- AI payload 构建
- AI 请求发送
- 字段建议应用
- 分类/标签匹配
- 错误提示与提示词交互反馈

本次建议做适度减重：

- 保留表单主组件
- 将 AI 相关逻辑抽为 hook 或辅助模块（如 `use-post-ai-assistant` 或同等语义文件）
- 保持当前用户体验和交互流程不变

这样可以让 `PostForm.tsx` 更聚焦于表单本身，同时不引入过细碎的拆分。

### `AiSuggestionDrawer.tsx`

该组件职责相对清晰，可基本保留，仅按新类型或新结果结构做适配，不做无关重构。

## 错误处理设计

### 内部错误分类

provider 层和服务层内部建议统一收口这些错误类别：

- 配置缺失
- 请求超时
- 上游响应异常
- 空响应
- JSON 解析失败 / 返回格式异常

### 对外错误语义

API 和前端文案只暴露对项目可理解的错误语义，例如：

- AI 服务请求超时
- AI 服务暂时不可用
- AI 返回结果格式异常，请重试
- AI 配置缺失

避免继续将底层 provider 细节泄露给用户。当前前端中与 Ollama 强绑定的报错文案需要一起清理，使其符合“百炼为主路径、Ollama 为备用路径”的新现实。

## 测试策略

本次不引入重型 AI 集成测试体系，而是优先补足项目自身边界的稳定性验证。

### 建议重点测试

1. Prompt builder
   - 不同任务/字段生成的 prompt 是否符合预期

2. Normalizer
   - 去除代码围栏
   - 缺字段兜底
   - slug 清洗
   - 摘要截断
   - 标签去重
   - 短正文 warnings

3. Service / Provider registry
   - 能否按配置正确选择 provider
   - 返回结果能否进入对应 normalizer

### 不建议本次重点投入的测试

- 不做依赖真实第三方模型的重型端到端自动化测试
- 不围绕 provider 内部 HTTP 细节做过多测试设计
- 不为了测试引入明显高于项目体量的 mock 架构

## 涉及文件范围

### 重点修改

- `src/lib/ai/config.ts`
- `src/lib/ai/types.ts`
- `src/lib/ai/index.ts`（删除或改为 re-export）
- `src/lib/ai/prompts.ts`（拆分替代）
- `src/lib/ai/client.ts`（重命名并拆分）
- `src/lib/ai/providers/aliyun-bailian.ts`
- `src/lib/ai/providers/ollama.ts`
- `src/app/api/ai/optimize/route.ts`
- `src/app/api/ai/field/route.ts`
- `src/components/admin/PostForm.tsx`
- `src/components/admin/AiSuggestionDrawer.tsx`

### 可能顺手小调

- `src/lib/validations.ts`
- `src/lib/response.ts`

### 明确不动的主范围

- `src/app` 其他页面结构
- 前台展示模块
- Prisma schema 与数据库结构
- 非 AI 领域的全局目录结构

## 验收标准

### 结构

- AI 目录分层清晰，可一眼看出配置、任务、provider、归一化、服务入口各自职责
- 文件命名准确，不再有核心实现落在不自解释的 `client.ts` 或过重的 `index.ts`

### 功能

以下能力保持可用：

- 整篇优化
- 单字段优化
- 分类建议
- 标签建议
- provider 切换
- 阿里百炼主路径
- Ollama 备用路径

### 代码质量

- route handler 更薄
- provider 不承担业务语义
- normalizer 独立负责结果清洗
- prompt 改为按任务组织
- `PostForm.tsx` 中 AI 逻辑边界更清晰

### 使用体验

- 错误提示更准确
- 切换阿里百炼模型成本更低
- 后续切换百炼内部模型时无需改业务代码

### 基础验证

至少完成：

- lint / 类型检查
- AI 相关关键路径验证
- 后台文章编辑页 AI 主流程验证（如本地环境允许）

## 结论

本次重构采用“全局不大动、AI 模块重点重构”的策略：

- 保留多 provider，但维持轻量设计
- 优先服务当前项目，而非未来假设的 AI 平台化场景
- 简化提示词并按任务拆分
- 统一命名和目录职责
- 保持现有功能范围与主要交互方式

这能在不过度设计的前提下，显著提升 AI 模块的可读性、可维护性和后续换模型的便利性。
