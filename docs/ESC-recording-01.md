          
**先回应你的 4 点**
- 你说得对，`/home/admin` 下拉整个仓库源码不是部署运行必需品；它当时的用途只有两个：一是读取项目自己的部署文档和脚本，二是作为“管理副本”保留 runbook 与辅助脚本入口，和正式运行目录是分离的
- 我没有把两套栈混用：当前线上实际跑的是新主线 `systemd + Caddy + Node/Hono + PostgreSQL`，不是 legacy 容器栈；机器上现在连 `docker/podman` 都没装，运行服务是 `rento-minix.service`
- `rento2026.top` 已解析到 `47.242.4.103` 这件事对 Caddy 是正向条件，不是负面影响；只要 Caddy 站点配置写成域名而不是 `http://IP`，并且 `80/443` 可达，Caddy 就可以自己接管正式 HTTPS
- 你强调“默认走 HTTPS、启用 PWA、没有精简方案”这一点也对，而我核对后发现，当前真正的问题不只是在服务器配置，而是 `v1.0.0` 这个正式包本身并不满足你的正式要求

**我核到的事实**
- 当前部署确实已经落在项目文档规定的新主线上：[DEPLOY_RUNBOOK.md](file:///home/admin/rento-minix-admin/DEPLOY_RUNBOOK.md#L45-L104) 与 [DEPLOYMENT.md](file:///home/admin/rento-minix-admin/DEPLOYMENT.md#L218-L229)
- 当前 systemd 运行配置也是新主线：[rento-minix.service](file:///etc/systemd/system/rento-minix.service#L1-L23)
- 但当前 Caddy 仍是我上次为了先打通公网验收而临时写成了 IP/HTTP 入口：[Caddyfile](file:///etc/caddy/Caddyfile#L1-L8)
- 更关键的是，仓库文档明确写了“正式 PWA 交付链路”必须是 `npm run build:minix:pwa`，不是普通 `build:minix`：[DEPLOYMENT.md](file:///home/admin/rento-minix-admin/DEPLOYMENT.md#L172-L185)
- 同时，PWA 设计文档也明确说明 `VITE_ENABLE_PWA` 是构建期开关，不能靠改运行时环境变量热切换：[phase15_minix_pwa_and_runtime_parity_architecture_plan.md](file:///home/admin/rento-minix-admin/docs/phase15_minix_pwa_and_runtime_parity_architecture_plan.md#L77-L82)
- 但你当前 release 工作流里，正式包构建步骤仍然是 `npm run build:minix`：[release-deploy-bundle.yml](file:///home/admin/rento-minix-admin/.github/workflows/release-deploy-bundle.yml#L93-L117)

**这意味着什么**
- 当前 `v1.0.0` 线上包虽然带有 `manifest.json`、`sw.js`、离线页这些 PWA 相关文件
- 但它不是“PWA enabled”的正式构建
- 我已经实际跑过项目自带的 PWA smoke：
- `pwa-disabled` profile 通过
- `production-ready` profile 失败，失败点就是首页暴露的 `rento-pwa-enabled` 标志不符合“正式 PWA 启用态”
- 所以现在不能把问题理解成“我只需要把 Caddy 切到域名就万事大吉”
- 正确结论是：`HTTPS` 可以直接修；但 `PWA enabled` 必须先纠正 release 产物链

**关于源码副本**
- ` /home/admin/rento-minix-admin` 不是运行目录，运行目录仍然是 ` /opt/rento-minix/current`
- 这个管理副本的作用主要是：
- 保存部署文档和脚本入口
- 保存我生成的本次部署记录/账号文件
- 方便后续按项目自己的 runbook 升级或回滚
- 如果你不希望服务器保留这份管理副本，等正式 HTTPS + PWA 版本稳定后，可以删；它不影响当前服务运行

**关于域名和测试证书**
- `rento2026.top -> 47.242.4.103` 解析已经生效，这对 Caddy 是好消息
- 你提到“已经部署了测试证书”，这件事本身不会自动影响 Caddy
- 只有两种情况会对 Caddy 有实际影响：
- 你把证书显式写进 Caddy `tls` 配置
- 或者你让其他服务抢占了 `443`
- 当前从现象看，Caddy 还没接管 HTTPS，根因不是“测试证书冲突”，而是当前配置写成了 `http://47.242.4.103` 这种只会走 HTTP 的站点地址

**当前阻塞点**
- 阻塞 1：服务器端我现在没有系统级修改能力了，`admin` 当前不再是免密 `sudo`
- 阻塞 2：仓库正式 release 链当前默认产物不是 PWA enabled 包，所以就算我现在把 HTTPS 切正，也还不满足你“默认启用 PWA”的正式要求
- 阻塞 3：服务器上的 `gh` 也还没登录，因此不能直接在服务器侧替你触发/管理 GitHub Release

**推荐的正确路径**
- 第一步：恢复 `admin` 免密 `sudo`
- 第二步：在仓库侧修正正式发布链，让正式 release bundle 按 PWA 正式口径产出
- 第三步：重新发布一个新的正式 tag/release
- 第四步：我在服务器上把当前版本切到 `https://rento2026.top`，并重新部署新的 PWA-enabled release
- 第五步：我再跑正式的 PWA smoke 与 HTTPS 验收

**你现在需要做的两件事**
- 恢复 `admin` 免密 `sudo`
- 仓库侧准备一个真正的 PWA-enabled 正式包
- 这里有两个可选做法：
- 临时做法：手工按 `npm run build:minix:pwa` 产出新的正式 release bundle
- 正确长期做法：修改 `.github/workflows/release-deploy-bundle.yml`，让正式 release 默认走 `build:minix:pwa`，或至少提供明确的 PWA build 开关

**如果你现在就要我继续**
- 你先把 `admin` 的免密 `sudo` 恢复掉
- 然后告诉我：
- 是让我先帮你改仓库发布工作流方案
- 还是你自己先在 GitHub 侧重新产出一个 PWA-enabled 新 release tag

**最简下一步**
- 恢复免密 `sudo` 后，直接回我一句：
- `sudo 已恢复`
- 然后再补一句：
- `我让你改工作流并准备新 release`
- 或
- `我已经重新发好了新的 PWA release tag: vX.Y.Z`

收到后我就继续把这次部署纠正到你要求的正式态：`https://rento2026.top + PWA enabled + Caddy/systemd 新主线`。