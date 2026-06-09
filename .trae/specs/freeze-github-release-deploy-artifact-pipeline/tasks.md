# Tasks

- [x] 任务 1：冻结 GitHub 正式部署产物链方案
  - [x] 子任务 1.1：确认正式主线保持 `Caddy + systemd + Hono + PostgreSQL`
  - [x] 子任务 1.2：明确 GitHub Actions 需要产出的正式部署包内容清单
  - [x] 子任务 1.3：明确 legacy 容器化镜像与 GHCR 仅保留 rollback-only 职责

- [x] 任务 2：调整 GitHub CI/CD 到 `build:minix` 主线
  - [x] 子任务 2.1：将 `ci.yml` 的构建校验从 `.next` 切换为 `dist/` 与 `build/minix-server/`
  - [x] 子任务 2.2：将发布 workflow 调整为生成正式部署包，而不是只生成 legacy deployment artifact
  - [x] 子任务 2.3：明确正式部署包的发布方式与命名规则

- [x] 任务 3：收口云端拉取正式部署产物的脚本与部署步骤
  - [x] 子任务 3.1：调整或新增脚本，使云服务器从 GitHub 拉取正式部署包
  - [x] 子任务 3.2：明确服务器侧环境文件、部署目录、`systemd`、`Caddy` 刷新步骤
  - [x] 子任务 3.3：确认服务器部署过程不包含 build 操作

- [x] 任务 4：同步正式部署说明与根级真相源
  - [x] 子任务 4.1：更新 `DEPLOYMENT.md` 为 GitHub 正式部署包主路径
  - [x] 子任务 4.2：同步 `README.md`、`AGENTS.md`、`project_rules.md`、`global_skills.md`、`project_skills.md`、`plan.md`、`architecture_map.md`
  - [x] 子任务 4.3：确保文档明确区分正式部署主线与 rollback-only 资产

- [x] 任务 5：完成部署可执行性验收
  - [x] 子任务 5.1：确认部署说明可以支持“云服务器 pull 正式部署包并部署”
  - [x] 子任务 5.2：确认没有残留把 `.next`、legacy deployment artifact 或 GHCR 镜像误写为正式主线路径
  - [x] 子任务 5.3：确认该交付可作为后续真实云服务器部署演练的直接输入

# Task Dependencies
- 任务 2 依赖任务 1
- 任务 3 依赖任务 2
- 任务 4 依赖任务 3
- 任务 5 依赖任务 4
