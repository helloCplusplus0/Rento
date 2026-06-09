**部署背景**
- 目标项目是新主线 `Rento-miniX`，正式技术栈固定为 `React + Vite + Hono + Prisma + PostgreSQL + Caddy + systemd`，不能与 legacy 的 `Next.js + 容器链` 混用。
- 目标服务器是阿里云香港 ECS，`2核2G`，约束非常真实，因此这次部署结果对后续正式开发和运维都很有参考价值。
- 最终公网入口为 `https://rento2026.top`，并验证了 `HTTPS + PWA + 正式域名` 这条主线。
- 当前线上已按 `v1.0.3` 成功运行，`Rento-miniX` 实测符合预期，暂无明显重大阻碍问题。

**本次确认的正确部署主线**
- 正式部署入口应固定为：`GitHub Release asset -> /opt/rento-minix/releases/<tag> -> /opt/rento-minix/current -> systemd + Caddy`
- 服务器职责应固定为：
  - 拉取正式 release bundle
  - 解压并切换 `current`
  - 加载环境文件
  - 执行数据库迁移
  - 刷新 `systemd` / `Caddy`
  - 执行健康检查
- 服务器`不应该`承担：
  - `npm run build`
  - `vite build`
  - `next build`
  - 源码级排查和持续开发
- 这条主线在 [DEPLOYMENT.md](file:///opt/rento-minix/current/DEPLOYMENT.md) 和 [DEPLOY_RUNBOOK.md](file:///opt/rento-minix/current/DEPLOY_RUNBOOK.md) 中都已经被明确固化。

**关键目录与真相源**
- 当前活动版本目录：`/opt/rento-minix/current`
- 版本发布目录：`/opt/rento-minix/releases/<tag>`
- 正式环境配置：[/etc/rento-minix/rento-minix.env](file:///etc/rento-minix/rento-minix.env)
- `systemd` 服务文件：[/etc/systemd/system/rento-minix.service](file:///etc/systemd/system/rento-minix.service)
- `Caddy` 配置：[/etc/caddy/Caddyfile](file:///etc/caddy/Caddyfile)
- 正式运行脚本： [start-minix.mjs](file:///opt/rento-minix/current/scripts/start-minix.mjs)
- 部署执行脚本： [deploy-release-on-server.sh](file:///opt/rento-minix/current/scripts/deploy-release-on-server.sh)
- 拉包脚本： [pull-release-deploy-bundle.sh](file:///opt/rento-minix/current/scripts/pull-release-deploy-bundle.sh)
- 健康检查脚本： [health-check.sh](file:///opt/rento-minix/current/scripts/health-check.sh)
- 迁移脚本： [migrate-and-seed.sh](file:///opt/rento-minix/current/scripts/migrate-and-seed.sh)

**本次实测最重要的结论**
- 这台 `2核2G` 服务器`可以正确部署并稳定运行` `Rento-miniX`。
- 在“只部署运行、不做云端构建”的前提下，这台机器对当前项目是`可用的`。
- 线上业务链本身比较轻：
  - `rento-minix` 约 `70MB`
  - `caddy` 约 `26MB`
  - `postgresql` 约 `42MB`
- 真正容易把机器拖重的，不是正式运行链，而是`远程 IDE / TS Server / 源码构建 / 调试会话`。
- 因此这台机器的正确使用方式应是：
  - 本地开发修复
  - GitHub 发 release
  - 云端只部署、运行、验收

**本次踩坑与经验**
- `第一类经验：不要混技术栈`
  - `Rento-miniX` 的正式入口不是 legacy 容器链。
  - 一旦把历史 `Next.js / nginx / docker-compose` 思路带进来，部署判断就会混乱。
- `第二类经验：release 才是正式交付物`
  - 服务器不应基于管理副本源码直接修。
  - 正式真相源是 `release bundle + /etc/rento-minix/rento-minix.env`。
- `第三类经验：白屏不等于服务器配置问题`
  - `v1.0.2` 的白屏根因最终确认是`源码/构建产物把 Prisma 依赖带进浏览器包`。
  - 云服务器只是部署了有问题的前端产物，不是 `Caddy/systemd/PostgreSQL` 基础设施故障。
  - `v1.0.3` 替换 release 后问题消失，验证了这个判断。
- `第四类经验：历史记录文件不等于线上真相`
  - 管理员登录失败最终查明不是数据库问题，而是线上使用 `ADMIN_PASSWORD_HASH` 做鉴权。
  - 旧的 [DEPLOYED_ADMIN_CREDENTIALS.txt](file:///home/admin/rento-minix-admin/DEPLOYED_ADMIN_CREDENTIALS.txt) 只能算历史记录，不能再当当前线上权威来源。
- `第五类经验：2核2G 对“运维模式”很敏感`
  - 跑正式服务可以。
  - 跑远程 IDE、TypeScript 分析、构建、调试就容易把内存顶高。
  - 这也是为什么“服务器只部署运行”必须当成纪律执行。

**本次实践证明可行的标准操作**
- `首次部署`
  - 先运行 [prepare-release-host.sh](file:///opt/rento-minix/current/scripts/prepare-release-host.sh)
  - 再准备 [/etc/rento-minix/rento-minix.env](file:///etc/rento-minix/rento-minix.env)
  - 最后执行 [deploy-release-on-server.sh](file:///opt/rento-minix/current/scripts/deploy-release-on-server.sh)
- `升级部署`
  - 拉取新 release
  - 切换 `/opt/rento-minix/current`
  - 自动执行迁移、重启、健康检查
- `回滚`
  - 手动把 `/opt/rento-minix/current` 指回旧版本目录
  - 重启 `rento-minix`
  - 重新做健康检查
- `健康检查`
  - 主入口固定为 `/api/health`
  - 配套脚本是 [health-check.sh](file:///opt/rento-minix/current/scripts/health-check.sh)
- `系统级配置刷新`
  - 如需同步新 release 中的 `systemd/Caddy` 基线，可通过 [deploy-release-on-server.sh](file:///opt/rento-minix/current/scripts/deploy-release-on-server.sh) 配合 `--refresh-system-config`

**日常维护建议**
- `升级`
  - 只升级正式 tag release，不直接在服务器改源码
- `看服务状态`
  - `sudo systemctl status rento-minix`
  - `sudo systemctl status caddy`
  - `sudo systemctl status postgresql@14-main`
- `看应用日志`
  - `sudo journalctl -u rento-minix -n 200 --no-pager`
- `看反向代理日志`
  - `sudo journalctl -u caddy -n 200 --no-pager`
- `看健康状态`
  - `bash /opt/rento-minix/current/scripts/health-check.sh --url https://rento2026.top/api/health`
- `改运行配置`
  - 统一改 [/etc/rento-minix/rento-minix.env](file:///etc/rento-minix/rento-minix.env)
  - 改完后重启 `rento-minix`
- `改管理员登录密码`
  - 本质是更新 `ADMIN_PASSWORD_HASH`
  - 不是改数据库账号表
- `控制资源占用`
  - 平时尽量断开远程 IDE
  - 不在云端做构建、索引、长时间源码排查

**对 2核2G 的总体评价**
- 如果定位是`轻量正式运行、低到中低并发、以稳定上线为主`，这台服务器是`合适的`。
- 如果定位是`云端持续开发、频繁构建、长期开 IDE、在线调试`，这台服务器是`不合适的`。
- 简化判断就是：
  - `跑服务：可以`
  - `搞开发：不建议`

**一句话总结**
- 这次真实云服务器部署实践已经证明：`Rento-miniX` 在 `2核2G` 的轻量 ECS 上，按“本地开发 + GitHub Release + 云端只部署运行”的模式，可以稳定、正确、可维护地落地；后续应继续坚持这条主线，不再把服务器当开发机使用。

如果你愿意，我下一步可以把这份总结进一步整理成一版`可直接保存到项目中的 markdown 文档`，方便你后续长期复用。