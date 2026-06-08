* [x] 已确认 `/renters`、`/renters/new`、`/renters/:id`、`/renters/:id/edit`、`/meter-readings/batch`、`/meter-readings/history` 的旧宿主参考源、宿主绑定现状与新宿主承接策略

* [x] 已在 `src/minix` 中为上述 6 个路由建立真实 route module 与页面装配层，不再依赖 legacy document fallback 作为默认访问路径

* [x] 已确认租客列表/详情/新建/编辑页的 loader / pending / error / not-found / 提交后回跳策略进入 route module，而不是继续散落在旧 `src/app/renters/**/page.tsx`

* [x] 已确认批量抄表与抄表历史页的流程性 loading / error / empty / success redirect / 恢复路径进入 route module，而不是继续依赖旧宿主页面协议

* [x] 已确认旧页面中的 `next/navigation`、`notFound()`、页面级数据整形与旧宿主跳转协议已被拆离为新宿主可解释的页面级边界

* [x] 已确认租客与抄表页面在信息结构、组件表达、导航节奏、表单交互与状态反馈上 100% 高保真还原旧 `Rento` UI，未出现重新设计

* [x] 已确认抄表批量页与历史页未放宽多仪表模型、结构化 `recordType`、历史保留、自动出账提示与状态检查/修复语义

* [x] 已确认 `/renters/**` 与 `/meter-readings/**` 已从 `phase13` 当前 legacy document fallback 默认入口中收回，而首页快捷入口与详情联动入口默认进入新宿主真实页面

* [x] 已确认 `/bills/stats`、支持页、治理页与 dev-only 页面未被重新混入 `phase13-04` 正式范围

* [x] 已确认任何新增兼容逻辑都注明存在原因、适用范围与退出条件，且未越界到 retained-legacy API/query、PWA runtime 或 cutover

* [x] 已完成最小工程验证与最小浏览器验收，并通过独立子代理审核验收
  说明：独立子代理最终以 scoped 审查方式，仅针对 `phase13-04` 相关 `renters` / `meter-readings` / `page-closure` 文件给出 `Pass`；并行 `bills/settings/dashboard` 工作树改动已明确不作为本子任务完成判定依据。
