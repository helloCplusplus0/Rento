# Fix 004 Analysis - 租客信息图片上传展示扩展

## 1. 问题摘要
- 对应问题：`fix_004`
- 问题级别：`P1 / feature-eval`
- 是否阻断修复：否

本问题本质上不是已有主链 bug，而是一个受边界约束的功能扩展评估任务。核心不是“能不能把图片传上去”，而是要先冻结以下四个决策：
- 第一类：扩展范围是否能被严格限制在租客信息相关页面，不扩散到合同、房间、账单等其他模块。
- 第二类：图片能力应该做成最小可维护能力，还是一步到位做成通用文件中心；若走后者，会明显突破当前任务边界。
- 第三类：图片上传前是否要做预处理压缩，以及压缩方案应该自己从零实现还是引入现成工具链。
- 第四类：开发环境的本地目录存储与未来云端对象存储是否能通过统一的 `.env` 配置抽象，避免后续迁移时重写业务层。

## 2. 根因结论
- 根因一：当前项目的租客主链已经具备 `list / new / detail / edit / API CRUD`，但数据模型、查询层、API 层和前端页面都没有任何真实的图片字段、附件表或上传删除接口，因此“图片上传展示删除”目前处于纯需求态，而非半成品缺口。
- 根因二：现有 `Renter` 模型只有文本和日期类字段，没有头像、证件照、合同照或附件数组字段；若直接把多张图片 URL 塞进 `Renter`，会把“多图、分类、删除、未来 OSS”全部压扁成脆弱字段设计，扩展性差。
- 根因三：项目目前没有现成的文件上传链路，没有 `multipart/form-data` 接口、上传中间件、文件元数据表、对象存储 SDK，也没有图片压缩或缩略图生成能力；如果贸然做“通用上传系统”，复杂度会明显超出 `fix_004` 的租客页面边界。
- 根因四：项目已经存在“env 驱动目录配置 + 本地文件写入”的工程模式，但尚未把这一模式扩展到上传存储；这意味着“本地目录开发、未来 OSS 切换”在架构上是可行的，但需要在一开始就抽象存储驱动，而不是把业务代码直接绑定到某个本地路径。
- 根因五：图片预处理如果完全手写 Canvas / EXIF / 压缩质量控制，复杂度与维护风险都偏高；在当前项目没有图片处理基础设施的前提下，优先引入轻量、边界清晰的现成工具链比从零实现更稳妥。

## 3. 证据链
- 页面预展示链路：
  - 租客新增页 `/renters/new` 进入 [RenterCreatePage](file:///home/dell/Projects/Rento/src/components/pages/RenterCreatePage.tsx)，再复用 [RenterForm](file:///home/dell/Projects/Rento/src/components/business/RenterForm.tsx)；当前表单只有文本输入、日期和备注区，没有上传控件或图片区。
  - 租客详情页 `/renters/[id]` 进入 [RenterDetailPage](file:///home/dell/Projects/Rento/src/components/pages/RenterDetailPage.tsx)，其“基本信息”由 [RenterBasicInfo](file:///home/dell/Projects/Rento/src/components/business/RenterBasicInfo.tsx) 渲染；当前只展示姓名、手机号、身份证、入住信息和备注，没有图片展示区。
  - 租客编辑页 `/renters/[id]/edit` 进入 [RenterEditPage](file:///home/dell/Projects/Rento/src/components/pages/RenterEditPage.tsx)，同样复用 [RenterForm](file:///home/dell/Projects/Rento/src/components/business/RenterForm.tsx)，当前没有“已有图片删除区”或图片管理区。
  - 租客列表卡片 [RenterCard](file:///home/dell/Projects/Rento/src/components/business/RenterCard.tsx) 里只有姓名首字母圆形占位，不是真实头像或图片能力。
- 服务端实际创建链路：
  - 租客列表和创建 API 为 [route.ts](file:///home/dell/Projects/Rento/src/app/api/renters/route.ts)，当前 `POST /api/renters` 只接收文本型 `JSON` 字段，没有 `formData` 上传流程。
  - 租客详情更新 API 为 [[id]/route.ts](file:///home/dell/Projects/Rento/src/app/api/renters/[id]/route.ts)，当前 `PUT /api/renters/[id]` 也只更新文本字段，没有图片元数据管理。
  - 查询层 [renterQueries](file:///home/dell/Projects/Rento/src/lib/queries.ts#L428-L519) 的 `create/update/findById/findAll` 仅围绕姓名、手机号、备注等文本字段工作。
- 数据模型映射：
  - `Renter` 模型当前只有姓名、性别、手机号、身份证、紧急联系人、职业、入住日期、人数、备注和合同关联，没有任何图片字段，见 [schema.prisma](file:///home/dell/Projects/Rento/prisma/schema.prisma#L95-L127)。
  - 当前整个 Prisma schema 也没有 `Attachment / Media / File / RenterImage` 一类独立附件表，意味着多图能力不能靠现有模型直接落地。
- 现有可复用能力：
  - 项目已有图片展示懒加载组件 [LazyImage](file:///home/dell/Projects/Rento/src/components/ui/LazyImage.tsx) 与 [useLazyImage](file:///home/dell/Projects/Rento/src/hooks/useLazyImage.ts)，可直接复用于详情页和编辑页图片展示。
  - 项目已有 `.env` 驱动的目录配置模式，例如 `LOG_DIR / BACKUP_DIR`，见 [.env.example](file:///home/dell/Projects/Rento/.env.example#L58-L72)；容器编排也已将这些目录映射进容器，见 [docker-compose.yml](file:///home/dell/Projects/Rento/docker-compose.yml#L16-L37)。
  - 项目已有本地目录写入模式，例如 [error-tracker.ts](file:///home/dell/Projects/Rento/src/lib/error-tracker.ts#L31-L78) 会基于 env 目录自动创建路径并写文件，这说明“开发环境落本地目录”在工程上是可复用的。
- 工具链与依赖现状：
  - 当前 `package.json` 没有 `multer`、`busboy`、`@aws-sdk/*`、`ali-oss`、`browser-image-compression`、`sharp` 等显式上传/图片处理依赖，见 [package.json](file:///home/dell/Projects/Rento/package.json#L1-L69)。
  - Context7 文档表明：
    - [browser-image-compression](https://context7.com/donaldcwl/browser-image-compression) 可在浏览器端对图片执行 `maxSizeMB / maxWidthOrHeight / useWebWorker` 级别的压缩，适合前端轻量预处理。
    - [sharp](https://context7.com/lovell/sharp) 可在服务端做转码、缩放、WebP 输出，但它是更重的服务端图片处理依赖，适合后续需要统一缩略图/格式治理时再引入。
- 是否存在历史脏数据：
  - 当前不存在图片历史数据，因为仓库里尚未真正落地租客图片模型或上传链路。
  - 未来需要考虑的是“已有租客数据如何无损升级支持图片”，而不是历史图片修复。

## 4. 影响面分析
- 新创建租客：
  - 会直接受影响。新增页应允许可选上传图片，但不能把图片上传变成必填门禁。
- 编辑租客：
  - 会直接受影响。编辑页需要展示已有图片、追加上传、删除单张图片。
- 租客详情：
  - 会直接受影响。详情页需要新增图片区并展示图片元数据或分类。
- 租客列表：
  - 可以选择轻量受影响。
  - 最小方案下列表页可保持首字母占位不变，避免把 `fix_004` 扩散成列表缩略图性能优化任务。
- 合同 / 房间 / 账单：
  - 不应受影响。
  - 即使租客详情图中包含“合同照片”，本次扩展也只属于“租客资料附件”，不应反向改造合同模块。
- 历史已生成数据：
  - 不涉及账务或抄表事实，不需要类似 `fix_002 / fix_003` 的历史修账策略。
- 统计 / 仪表盘：
  - 不应受影响。
  - 不应顺手扩散为“上传数量统计”或“存储容量看板”。

## 5. 候选方案对比
### 方案 A
- 做法：
  - 在 `Renter` 表直接新增一个或多个图片 URL 字段，例如 `avatarUrl`、`idCardImageUrl`、`contractImageUrl`。
  - 上传接口直接把文件写入本地目录，URL 存回租客表。
  - 不做图片压缩，只做大小和格式校验。
- 优点：
  - 改动量最小，上手最快。
  - 适合只支持 1~3 张固定类型图片的极简场景。
- 风险：
  - 与你的需求不匹配。你描述的是“身份证、合同等图片信息统一纳入管理”，天然更接近多图与分类附件，而不是 2~3 个硬编码字段。
  - 一旦后续增加“正反面 / 多合同图 / 其他补充资料”，字段会迅速失控。
  - 不利于未来切换 OSS，也不利于单图删除、排序和扩展元数据。

### 方案 B
- 做法：
  - 新增独立的“租客图片/附件表”，例如 `RenterImage` 或 `RenterAttachment`，字段至少包含：
    - `id`
    - `renterId`
    - `category`（如 `ID_CARD`、`CONTRACT`、`OTHER`）
    - `storageDriver`（`local` / `oss`）
    - `storageKey`
    - `originalName`
    - `mimeType`
    - `size`
    - `width/height`（可选）
    - `sortOrder`
    - `createdAt`
  - 页面范围只改租客相关：
    - `new`：允许可选上传
    - `detail`：展示图片
    - `edit`：追加上传、删除图片
  - 上传链路采用“最小业务专用上传能力”，不做全局通用文件中心。
  - 存储抽象通过 `.env` 驱动：
    - 开发环境 `local`
    - 未来云端可切换 `oss`
  - 预处理采用“轻量前端压缩 + 服务端校验”：
    - 前端使用现成轻量库做尺寸/体积压缩
    - 服务端负责 MIME、文件大小、数量与路径安全校验
- 优点：
  - 与你的任务边界最匹配：只解决租客资料图片，不扩张为全站文件系统。
  - 多图、分类、删除、未来 OSS 切换都有结构化承载。
  - 复杂度可控，且后续若要扩展到其他模块，也能复用存储抽象层而不是推翻重来。
- 风险：
  - 比直接给 `Renter` 加字段多一层模型和 API，初期改动面更广。
  - 需要谨慎控制边界，避免顺手把它泛化成“全局附件平台”。

## 6. 推荐方案
- 推荐原因：
  - 推荐采用 **方案 B 的“租客专用附件表 + env 驱动存储抽象 + 轻量前端压缩”**。
  - 这条路线能够同时满足你在第 9 节提出的四个关键约束：
    - 任务边界只留在租客页面
    - 复杂度可控，不扩张为全局文件系统
    - 优先选择最佳现成工具链，而不是从零写图片压缩
    - 开发环境本地目录与未来 OSS 可以通过统一 `.env` 切换
- 实施边界：
  - 页面边界：
    - 只改租客 `new / detail / edit` 页面与相关 API
    - 列表页是否显示缩略图可延后，不作为本次必须项
  - 数据边界：
    - 新增租客专用附件表，不把多图硬塞进 `Renter`
    - 图片元数据存数据库，图片实体存文件系统或对象存储
  - 存储边界：
    - 开发环境：项目目录下本地指定目录，例如 `./uploads/renters`
    - 未来云端：通过 `STORAGE_DRIVER=oss` 一类 env 切换到对象存储适配器
    - 所有存储位置与公开访问前缀统一走 `.env`
  - 上传边界：
    - 限定允许格式：`image/jpeg`、`image/png`、`image/webp`
    - 限定单张大小与单租客总张数
    - 限定仅租客资料图片，不接受 PDF、视频或任意文件
  - 预处理边界：
    - 前端使用轻量现成库进行压缩，目标是“减小传输体积”，不是做复杂图像编辑
    - 服务端先不引入重型图片管线，不在本次实现缩略图派生、裁剪工作流或格式统一转码服务
- 工具链判断：
  - **不建议从零实现浏览器压缩**：
    - 自己处理 `Canvas / EXIF / 方向 / 质量 / Web Worker` 会把功能扩展变成图片算法维护任务
  - **建议使用轻量现成工具链**：
    - 前端压缩：优先考虑 `browser-image-compression`
    - 服务端上传：优先使用 Next.js route handler 原生 `request.formData()` + `File/Blob/Buffer`，先不要引入 `multer` 这类传统中间件
  - **暂不建议在第一阶段引入 `sharp`**：
    - `sharp` 很强，但它是原生模块，容器、构建、镜像和跨环境一致性成本更高
    - 在当前“租客图片资料扩展”的阶段，先做“轻量压缩 + 服务端校验 + 原图存储”更符合复杂度控制
    - 若后续明确需要统一生成缩略图、统一转 WebP、自动纠正方向，再单独评估引入 `sharp`
- 复杂度评估：
  - 复杂度存在，但**可控且可接受**，前提是严格冻结边界：
    - 不做全局文件中心
    - 不做合同/房间等模块联动
    - 不做复杂裁剪与服务端图像处理流水线
    - 不做一次性接入 OSS SDK 与本地双栈全实现，可先抽象接口、先落本地驱动
- 明确不在本次修复范围内的内容：
  - 不重构全站通用附件系统
  - 不扩展到合同、房间、账单、抄表模块
  - 不做图片审核、OCR、身份证识别或 AI 提取
  - 不做图片分享、批量下载、批量移动
  - 不做复杂服务端缩略图中心或 CDN 优化

## 7. 数据修复策略
- 是否需要修历史数据：不需要历史修复，但需要结构化升级兼容。
- 若需要，修复范围：
  - 不涉及历史账务、合同、抄表等事实修复。
  - 只需要在数据模型升级后允许历史租客从“无图片”平滑升级到“可上传图片”。
  - 若未来已有本地目录旧图片需要纳管，可额外设计一次导入脚本，但这不属于当前 `fix_004` 必需项。
- 若不需要，原因：
  - 当前系统尚未落地租客图片持久化，不存在旧图片脏数据。

## 8. 验收标准
- 租客新增页允许上传图片，但上传不是必填项。
- 租客编辑页能够展示已有图片，并支持单张删除。
- 租客详情页能够展示租客图片，至少支持按分类或列表方式查看。
- 本次扩展只影响租客相关页面与 API，不应联动改造合同、房间、账单或其他模块。
- 图片元数据采用独立结构化模型，不把多图能力硬塞进 `Renter` 单表字段。
- 开发环境图片能够存放到项目目录下的指定本地目录，且目录位置由 `.env` 控制。
- 未来对象存储切换点已在配置层预留，不需要重写租客业务页面。
- 上传链路必须校验文件类型、单张大小、最大张数与路径安全。
- 图片展示应复用现有图片组件能力，至少具备稳定预览与加载失败降级。
- 若启用图片预处理，预处理实现必须使用轻量现成工具链，不得把 `fix_004` 扩散为复杂图像处理工程。

## 9. 回滚条件
- 若扩展过程中出现以下任一情况，必须立即停止并回滚：
  - 租客新增、编辑、详情等原有文本信息流程被破坏
  - 上传功能扩散到租客模块之外，开始影响合同、房间、账单等无关页面
  - 本地目录写入方案与容器环境不兼容，导致应用无法正常启动或部署
  - 为了图片功能引入过重依赖，明显增加构建、容器或部署复杂度且收益不足
  - 图片预处理导致浏览器卡顿、上传失败率显著升高，或服务端资源占用明显异常
- 若后续验证发现：
  - 本地目录 + `.env` 抽象无法平滑演进到 OSS
  - 多图分类需求实际远超“租客资料附件”边界
  - 需要同时支持 PDF、视频、OCR、审核等复合能力
  则必须终止当前最小方案，升级为单独的附件系统规划，而不应继续以 `fix_004` 的局部扩展方式硬推。
