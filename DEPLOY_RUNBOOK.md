# DEPLOY_RUNBOOK.md

> 面向操作者的正式部署手册。
> 治理边界、正式/legacy 资产分类、发布门禁与回滚基线说明仍以 `DEPLOYMENT.md` 为准；本文件只承接实际操作步骤。

## 1. 适用范围
- 正式部署主线固定为：`GitHub Release asset -> /opt/rento-minix/current -> systemd + Caddy`
- 服务器职责固定为：拉取正式部署包、切换 release、执行迁移、刷新服务、执行健康检查
- 服务器禁止执行：
  - `npm run build`
  - `vite build`
  - `next build`
- legacy `docker-compose` / GHCR 仅保留 `rollback-only`

## 2. 你需要准备什么
- Ubuntu 24 服务器
- 已安装并可用：
  - `node`
  - `gh`
  - `caddy`
  - `systemd`
  - `postgresql`
- 一个可用的公网域名
- 一个可用的正式 release tag，例如 `v1.2.3`
- 服务器能够访问 GitHub Release

补充说明：
- 推送到 `main` 后，仓库会自动生成以 `pre-main-<sha>` 命名的 `prerelease deploy bundle`
- 这些 prerelease 用于快速验证、预演练与待验收环境
- `prerelease` 与 `v*` 正式 release bundle 都默认按 `npm run build:minix:pwa` 构建
- 正式服务器默认仍使用 `v*` 正式 release bundle

如果当前还没有现成正式 release，可以先在仓库侧手工触发正式部署包 workflow：

```bash
gh workflow run release-deploy-bundle.yml --ref main -f release_tag=v1.2.3
```

说明：
- `workflow_dispatch` 现在会直接基于你选定的分支/提交构建正式部署包
- 推送到 `main` 时，仓库也会自动生成新的 `prerelease deploy bundle`
- 若远端还没有同名 tag/release，workflow 会自动创建
- 若远端已有同名 tag/release，workflow 会直接失败并要求改用新的 `release_tag`
- 等 workflow 成功后，再继续服务器部署步骤

## 3. 第一次部署
1. 拉取管理脚本仓库副本

```bash
git clone https://github.com/helloCplusplus0/Rento-miniX.git ~/rento-minix-admin
cd ~/rento-minix-admin
git fetch --tags
```

2. 登录 GitHub CLI

```bash
gh auth login
gh auth status
```

3. 准备服务器目录、运行账户和环境模板

```bash
sudo ./scripts/prepare-release-host.sh --release-tag v1.2.3
```

4. 创建私有环境文件

```bash
sudo cp /etc/rento-minix/rento-minix.env.example /etc/rento-minix/rento-minix.env
sudo editor /etc/rento-minix/rento-minix.env
```

最少确认以下变量已填写：
- `NEXTAUTH_URL=https://你的正式域名`
- `ALLOWED_ORIGINS=https://你的正式域名`
- `AUTH_SESSION_SECRET=<强随机值>`
- `NEXTAUTH_SECRET=<强随机值>`
- `DATABASE_URL=postgresql://...`
- `MINIX_SERVER_PORT=3002`

补充说明：
- 当前 GitHub Release 部署包默认已经按 `npm run build:minix:pwa` 预构建为 PWA enabled
- 修改 `/etc/rento-minix/rento-minix.env` 中的 `VITE_ENABLE_PWA` 不会热切换已下载 release 的 PWA 状态；只有重新构建 `dist/` 才会生效

5. 执行正式部署

```bash
sudo ./scripts/deploy-release-on-server.sh v1.2.3 --domain rento.example.com
```

这个命令会自动完成：
- 从 GitHub Release 下载正式部署包和 sha256
- 解压到 `/opt/rento-minix/releases/<tag>`
- 切换 `/opt/rento-minix/current`
- 安装或刷新 `systemd`/`Caddy` 基线
- 执行数据库迁移
- 重启 `rento-minix`
- 刷新 `caddy`
- 执行健康检查

6. 验证部署结果

```bash
sudo systemctl status rento-minix --no-pager
sudo systemctl status caddy --no-pager
bash /opt/rento-minix/current/scripts/health-check.sh --url https://rento.example.com/api/health
```

## 4. 升级部署
1. 在管理脚本目录获取最新脚本与文档

```bash
cd ~/rento-minix-admin
git fetch --tags
git pull --ff-only
```

2. 执行升级

```bash
sudo ./scripts/deploy-release-on-server.sh v1.2.4
```

默认行为：
- 保留现有 `/etc/caddy/Caddyfile`
- 保留现有 `/etc/systemd/system/rento-minix.service`
- 仅切换 release、执行迁移、刷新服务、执行健康检查

如果这次 release 明确要求刷新系统级配置，再执行：

```bash
sudo ./scripts/deploy-release-on-server.sh v1.2.4 --refresh-system-config --domain rento.example.com
```

## 5. 常用选项
- `--domain <domain>`
  - 首次安装或刷新 Caddy 基线时必填
- `--refresh-system-config`
  - 用当前 release 覆盖 `systemd` 与 `Caddy` 基线
- `--health-url <url>`
  - 显式指定健康检查地址
- `--skip-migrate`
  - 临时跳过迁移
- `--skip-health-check`
  - 临时跳过健康检查

示例：

```bash
sudo ./scripts/deploy-release-on-server.sh v1.2.4 --health-url http://127.0.0.1:3002/api/health
```

## 6. 回滚入口
当前正式部署目录固定为：
- release 目录：`/opt/rento-minix/releases/<tag>`
- 当前软链：`/opt/rento-minix/current`

如果只是回到旧 release，可手动切换软链后刷新服务：

```bash
sudo ln -sfn /opt/rento-minix/releases/v1.2.3 /opt/rento-minix/current
sudo systemctl restart rento-minix
sudo systemctl reload caddy
bash /opt/rento-minix/current/scripts/health-check.sh --url https://rento.example.com/api/health
```

如果需要走 legacy 容器化回滚线，请停止使用本 runbook，改为按 `DEPLOYMENT.md` 中冻结的 `rollback-only` 资产边界执行。

## 7. 故障排查
- GitHub 下载失败：
  - 先执行 `gh auth status`
  - 确认目标 tag 已存在对应 release asset
- 迁移失败：
  - 检查 `/etc/rento-minix/rento-minix.env` 的 `DATABASE_URL`
  - 检查 PostgreSQL 连通性
- 应用启动失败：

```bash
sudo journalctl -u rento-minix -n 200 --no-pager
```

- Caddy 刷新失败：

```bash
sudo journalctl -u caddy -n 200 --no-pager
```

## 8. 记录要求
正式部署演练与 legacy 回滚演练仍需补充审计记录，至少包含：
- 演练时间
- 目标环境
- 执行命令
- 健康检查结果
- 主链 smoke 结果
- 回滚触发条件
- 最终结论

这些记录当前仍需回写到 `phase16` 文档，不在本 runbook 内重复维护第二套真相源。
