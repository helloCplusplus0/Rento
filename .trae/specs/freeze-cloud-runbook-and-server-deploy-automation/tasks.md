# Tasks

- [x] 任务 1：冻结云端部署操作分层
  - [x] 子任务 1.1：明确 `DEPLOYMENT.md` 继续承担治理真相源职责
  - [x] 子任务 1.2：明确新增 `DEPLOY_RUNBOOK.md` 只承接实际操作步骤
  - [x] 子任务 1.3：明确新增服务器准备脚本与部署执行脚本的职责边界

- [x] 任务 2：新增服务器准备脚本
  - [x] 子任务 2.1：创建 `scripts/prepare-release-host.sh`
  - [x] 子任务 2.2：收口运行账户、目录、权限与基础依赖检查
  - [x] 子任务 2.3：给出环境文件与 GitHub 认证的明确提示

- [x] 任务 3：新增正式部署执行脚本
  - [x] 子任务 3.1：创建 `scripts/deploy-release-on-server.sh`
  - [x] 子任务 3.2：串联拉包、切换 current、刷新 systemd/Caddy、迁移与健康检查
  - [x] 子任务 3.3：确保服务器部署过程中不执行 build

- [x] 任务 4：新增简洁部署操作手册
  - [x] 子任务 4.1：创建 `DEPLOY_RUNBOOK.md`
  - [x] 子任务 4.2：写清首次部署、升级部署、健康检查与回滚入口
  - [x] 子任务 4.3：把操作步骤与现有 GitHub Release 部署包链路对齐

- [x] 任务 5：同步部署真相源与根级入口
  - [x] 子任务 5.1：更新 `DEPLOYMENT.md` 指向 `DEPLOY_RUNBOOK.md` 和新脚本
  - [x] 子任务 5.2：同步 `README.md`、`AGENTS.md`、`plan.md`、`architecture_map.md`
  - [x] 子任务 5.3：保持正式主线与 rollback-only 边界不漂移

- [x] 任务 6：完成独立验收
  - [x] 子任务 6.1：验证 runbook 是否足够简洁直观
  - [x] 子任务 6.2：验证新脚本是否与 GitHub 正式部署包路径一致
  - [x] 子任务 6.3：验证没有把 `DEPLOYMENT.md` 继续当成唯一操作手册

# Task Dependencies
- 任务 2 依赖任务 1
- 任务 3 依赖任务 2
- 任务 4 依赖任务 3
- 任务 5 依赖任务 4
- 任务 6 依赖任务 5
