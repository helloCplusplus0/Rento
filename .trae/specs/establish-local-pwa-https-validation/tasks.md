# Tasks
- [x] Task 1: 冻结“永久本地 PWA 验证方案”的工程边界
  - [x] SubTask 1.1: 审核 `docs/pwa_private_https_android_acceptance_runbook.md`、`README.md`、`DEPLOYMENT.md`、`ENVIRONMENT_GUIDE.md` 中与本地 HTTPS 验证相关的口径，确认哪些内容已经存在、哪些仍停留在手工说明
  - [x] SubTask 1.2: 明确本任务只解决“受控本地私有 HTTPS + Android 真机验证”的长期工程化能力，不扩展为公网部署、域名购买、商业证书申请或完整 DevOps 平台
  - [x] SubTask 1.3: 冻结仓库内需要新增或调整的长期资产类型，如本地 Nginx 模板、辅助脚本、环境示例和文档入口

- [x] Task 2: 建立仓库内的本地 HTTPS 配置骨架
  - [x] SubTask 2.1: 提供可长期维护的本地 Nginx HTTPS 配置模板，支持局域网 IP 与私有主机名两种入口
  - [x] SubTask 2.2: 明确证书、私钥和本地根证书的宿主机存放位置与忽略边界，确保仓库只保留模板和示例，不保留真实敏感资产
  - [x] SubTask 2.3: 明确本地反代与 `next.config.ts` `output: 'standalone'` 运行链的衔接方式，避免再次出现静态资源断裂或错误启动入口

- [x] Task 3: 建立本地验证的统一脚本与环境变量入口
  - [x] SubTask 3.1: 为本地 HTTPS 验证设计最小脚本入口，覆盖构建、统一启动、配置提示或验证辅助
  - [x] SubTask 3.2: 收口 `.env.example` 与相关文档中的本地 HTTPS 变量示例，确保 `NEXTAUTH_URL`、`ALLOWED_ORIGINS`、`NEXT_PUBLIC_ENABLE_PWA` 与反代来源一致
  - [x] SubTask 3.3: 明确脚本与文档的职责边界，避免脚本和文档各自维护第二套真相

- [x] Task 4: 收口长期文档入口与 Android 真机验收路径
  - [x] SubTask 4.1: 更新 `README.md`、`DEPLOYMENT.md`、`ENVIRONMENT_GUIDE.md` 与 runbook，使“永久本地验证方案”的入口清晰且不重复展开
  - [x] SubTask 4.2: 把 Android 真机的安装、更新、离线与失败退化验证路径收口为一条连续的本地验收链路
  - [x] SubTask 4.3: 确保文档能回答“如何重建环境”“如何更换 IP/主机名”“如何最小回退”这三类长期维护问题

- [x] Task 5: 完成工程与文档级验收
  - [x] SubTask 5.1: 运行 `npm run lint`
  - [x] SubTask 5.2: 运行 `npm run type-check`
  - [x] SubTask 5.3: 复核新增方案未越界为公网分发、完整 DevOps 平台或与 PWA 无关的环境重构
  - [x] SubTask 5.4: 复核仓库内不存在真实证书、私钥或其他本地敏感资产（已通过；`.env`、`certs/`、`nginx/ssl/` 及常见证书/私钥后缀均已脱离版本控制主路径）

- [x] Task 6: 修复本地敏感资产与验收入口的剩余治理缺口
  - [x] SubTask 6.1: 将 `.env` 从版本控制主路径中移除并保留本地私有配置迁移说明，确保仓库不再追踪真实本地敏感配置
  - [x] SubTask 6.2: 强化 `scripts/pwa-local-https-helper.sh checklist` 的前置校验，在 `NEXTAUTH_URL` 非 HTTPS 或 `NEXT_PUBLIC_ENABLE_PWA!=1` 时给出明确失败或警告
  - [x] SubTask 6.3: 同步 `README.md`、`DEPLOYMENT.md`、`ENVIRONMENT_GUIDE.md` 与 runbook，说明 `.env` 迁移和本地 HTTPS 验收前置条件

- [x] Task 7: 清理历史追踪的本地证书资产
  - [x] SubTask 7.1: 将 `certs/` 下已被 Git 历史追踪的证书与私钥从版本控制主路径中安全移除，同时保留宿主机私有文件使用边界
  - [x] SubTask 7.2: 同步文档与辅助脚本提示，明确 `certs/` 仅能作为宿主机私有路径示例或迁移对象，不再作为仓库内长期资产
  - [x] SubTask 7.3: 重新完成敏感资产复核，并在确认 `.env`、证书、私钥均已脱离版本控制后关闭 Task 5

- [x] Task 8: 激活当前宿主机的本地 HTTPS 验收口径
  - [x] SubTask 8.1: 将当前宿主机 `.env` 收口为本地 HTTPS + PWA 验收口径，确保 `NEXTAUTH_URL`、`ALLOWED_ORIGINS` 与 `NEXT_PUBLIC_ENABLE_PWA` 满足 helper 前置校验
  - [x] SubTask 8.2: 在宿主机私有路径创建并收口 `rento-local-https.env`，使 Nginx 模板可直接渲染为当前机器的本地 HTTPS 配置
  - [x] SubTask 8.3: 使用 helper 对当前宿主机环境重新执行 `validate` 与 `checklist`，并在通过后确认本地验收链路已真实可执行

- [x] Task 9: 为当前宿主机落地私有 HTTPS 证书资产
  - [x] SubTask 9.1: 检查并准备 `mkcert` 本地 CA 工具链，确保当前 Ubuntu 24 宿主机可以生成受控私有证书
  - [x] SubTask 9.2: 在宿主机私有路径生成 `192.168.31.84`、`rento.internal`、`localhost`、`127.0.0.1` 的本地 HTTPS 证书与私钥
  - [x] SubTask 9.3: 让 `rento-local-https.env` 指向真实存在的证书资产，并重新通过 helper 与文件存在性复核

- [x] Task 10: 打通当前宿主机的本地 HTTPS 运行态
  - [x] SubTask 10.1: 改为使用 compose-managed `local-https-nginx` 与独立的 `docker-compose.local-https.yml`，不再依赖 system nginx，且保持现有生产 `nginx` 路径不变
  - [x] SubTask 10.2: 收口 helper / 文档 / 渲染配置到宿主机 `3001` 统一启动入口，并确认 `/api/health` 不再因本地运行目录缺失返回 `503`
  - [x] SubTask 10.3: 已完成 compose 配置校验，并在 rootless Podman 高位端口回退（`18443`）下通过 `pwa-smoke-check.sh`；默认 `80/443` 仍需具备特权端口能力后再直接复用

# Task Dependencies
- `Task 2` depends on `Task 1`
- `Task 3` depends on `Task 1`, `Task 2`
- `Task 4` depends on `Task 1`, `Task 2`, `Task 3`
- `Task 5` depends on `Task 2`, `Task 3`, `Task 4`
- `Task 6` depends on `Task 5`
- `Task 7` depends on `Task 6`
- `Task 8` depends on `Task 7`
- `Task 9` depends on `Task 8`
- `Task 10` depends on `Task 9`
