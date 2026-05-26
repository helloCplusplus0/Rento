# Tasks
- [x] Task 1: 冻结私有部署与正式支持环境前提
  - [x] SubTask 1.1: 明确正式支持环境所需的 HTTPS、受控网络、登录门禁与浏览器前提
  - [x] SubTask 1.2: 明确非正式支持环境只能按普通 Web 使用，不作为 PWA 验收通过条件
  - [x] SubTask 1.3: 同步 `phase05` 阶段文档与顶层口径，避免“已支持安装”与“仅受控环境支持”并存

- [x] Task 2: 收口安装、更新、失败退化与最小回滚说明
  - [x] SubTask 2.1: 在 `README.md`、`DEPLOYMENT.md`、`ENVIRONMENT_GUIDE.md` 中明确安装步骤
  - [x] SubTask 2.2: 明确更新提示、刷新生效、缓存异常与最小回滚路径
  - [x] SubTask 2.3: 明确安装失败、`service worker` 失效或缓存被清理时如何退化为普通 Web

- [x] Task 3: 冻结真机验收清单与发布前门禁
  - [x] SubTask 3.1: 产出最小真机验收清单，覆盖安装、启动、登录、关键页面、更新、离线兜底与移除重装
  - [x] SubTask 3.2: 为每一项验收定义明确的通过/不通过标准
  - [x] SubTask 3.3: 明确哪些验证必须在 `Android + Chrome + HTTPS` 环境中完成

- [x] Task 4: 补最小验证辅助说明
  - [x] SubTask 4.1: 若有必要，补最小脚本或步骤说明帮助验证安装与更新
  - [x] SubTask 4.2: 确保这些辅助说明不扩展为完整 DevOps 平台或公网分发方案

- [x] Task 5: 完成文档级验收
  - [x] SubTask 5.1: 运行 `npm run lint`
  - [x] SubTask 5.2: 运行 `npm run type-check`
  - [x] SubTask 5.3: 复核本子任务未越界到 PWA 业务缓存扩张、安全体系重构或公网 App 分发

# Task Dependencies
- `Task 2` depends on `Task 1`
- `Task 3` depends on `Task 1`
- `Task 4` depends on `Task 2`
- `Task 5` depends on `Task 2`, `Task 3`, `Task 4`
