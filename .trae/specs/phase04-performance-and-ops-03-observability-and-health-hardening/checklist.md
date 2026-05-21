- [x] 已明确当前阶段最小可观察能力边界，且未越过 `phase04` 共享基线
- [x] 健康检查的整体状态语义与子检查映射关系已统一
- [x] 错误日志主线、辅助能力与兼容项边界已明确
- [x] 基础性能指标的最小集合、来源与阈值语义已明确
- [x] 代码、脚本与文档对运行治理入口的说明保持一致
- [x] `README.md` / `DEPLOYMENT.md` 中与运行治理相关的表述已按需要同步
- [x] `npm run lint` 与 `npm run type-check` 被纳入本子任务验证路径
- [x] 至少存在一条可执行或可复核的验证路径，用于证明问题定位入口不再依赖隐性知识

## 可复核验证路径
1. 阅读 `src/lib/observability.ts` 与 `src/app/api/health/route.ts`，确认 `/api/health` 是主健康入口，整体状态固定为 `healthy` / `degraded` / `unhealthy`，子检查信号固定为 `pass` / `warn` / `fail`，且主入口同时暴露 `metrics.performance` 与 `observability` 元数据。
2. 阅读 `src/lib/api-error-handler.ts` 与 `src/lib/performance-monitor.ts`，确认 API 主链通过 `withApiErrorHandler` 统一采集请求级性能指标，主要错误通过 `error-logger` 进入主线，`error-tracker` 仅保留为文件型兼容日志。
3. 阅读 `README.md`、`DEPLOYMENT.md` 与 `scripts/health-check.sh`，确认主入口、辅助入口、状态口径、错误日志主线与性能指标出口的说明一致，且 `degraded` 被明确视为“可用但需关注”。
4. 执行 `npm run lint` 与 `npm run type-check`，确认当前实现满足工程校验基线。
