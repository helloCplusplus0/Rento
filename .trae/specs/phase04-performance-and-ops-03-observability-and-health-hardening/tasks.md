# Tasks
- [x] Task 1: 冻结当前阶段的最小可观察能力边界
  - [x] SubTask 1.1: 盘点 `src/app/api/health/route.ts`、`src/lib/health-checker.ts`、`src/lib/error-tracker.ts`、`src/lib/performance-monitor.ts` 与必要的调用方，识别现有状态语义、日志路径和指标出口
  - [x] SubTask 1.2: 明确当前阶段的唯一主线，包括整体健康状态命名、错误日志主入口、基础性能指标最小集合
  - [x] SubTask 1.3: 标注仍保留但已降级为兼容项或辅助项的实现，避免继续形成双重真相

- [x] Task 2: 收口健康检查、错误日志与基础性能指标的实现口径
  - [x] SubTask 2.1: 统一健康检查的整体状态语义与子检查映射关系
  - [x] SubTask 2.2: 明确错误日志主线与辅助日志边界，必要时补最小注释或最小字段收口
  - [x] SubTask 2.3: 明确基础性能指标的唯一主线、慢请求阈值语义和最小输出集合

- [x] Task 3: 同步运行治理文档与使用说明
  - [x] SubTask 3.1: 按实现结果更新 `README.md`、`DEPLOYMENT.md` 中与健康检查、日志、性能指标相关的说明
  - [x] SubTask 3.2: 确保 API、脚本和文档对运行治理入口的描述一致
  - [x] SubTask 3.3: 明确哪些入口用于问题定位，哪些能力仅为辅助或兼容

- [x] Task 4: 完成验证并确认 DoD
  - [x] SubTask 4.1: 执行 `npm run lint`
  - [x] SubTask 4.2: 执行 `npm run type-check`
  - [x] SubTask 4.3: 补至少一条“问题定位口径更清晰”的验证路径，证明健康检查、错误日志、基础性能指标口径已经一致

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 2
- Task 4 depends on Task 2
- Task 4 should be completed after Task 3

## 验证记录
1. 已执行 `npm run lint`，结果通过。
2. 已执行 `npm run type-check`，结果通过。
3. 已补充可复核验证路径：通过 `src/lib/observability.ts`、`src/app/api/health/route.ts`、`src/lib/api-error-handler.ts`、`src/lib/performance-monitor.ts` 与 `README.md` / `DEPLOYMENT.md` / `scripts/health-check.sh` 的对照阅读，可以直接复核主健康入口、错误日志主线、性能指标出口与文档口径的一致性。
