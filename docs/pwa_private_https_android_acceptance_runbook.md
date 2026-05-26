# 私有 HTTPS 与 Android 真机 PWA 验证 Runbook

## 1. 文档定位

本文档用于补齐 `phase05-pwa-delivery-05` 的执行层说明，回答以下问题：

- 不购买域名、不购买公网证书的前提下，如何在私有局域网内建立 HTTPS 验证环境
- 如何在 `Ubuntu 24 + Nginx + mkcert + Android 真机` 组合下验证 Rento 的 PWA 落地效果
- 如何在保持当前正式支持矩阵不扩张的前提下，完成最小可执行的真机验收

本文档不替代：

- [DEPLOYMENT.md](file:///home/dell/Projects/Rento/DEPLOYMENT.md) 的部署口径
- [ENVIRONMENT_GUIDE.md](file:///home/dell/Projects/Rento/ENVIRONMENT_GUIDE.md) 的环境变量口径
- [phase05_pwa_delivery_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase05_pwa_delivery_dev_plan.md) 的阶段规划职责

仓库内与本地 HTTPS 验证直接相关的长期资产固定为：

- [docker-compose.local-https.yml](file:///home/dell/Projects/Rento/docker-compose.local-https.yml)
- [rento-local-https.conf.template](file:///home/dell/Projects/Rento/nginx/templates/rento-local-https.conf.template)
- [rento-local-https.env.example](file:///home/dell/Projects/Rento/nginx/templates/rento-local-https.env.example)
- [pwa-local-https-helper.sh](file:///home/dell/Projects/Rento/scripts/pwa-local-https-helper.sh)

## 2. 适用边界

- 当前方案只服务于受控私有网络内的技术验证与真机验收
- 当前正式支持矩阵不变：`Android + Chrome + HTTPS + NODE_ENV=production + NEXT_PUBLIC_ENABLE_PWA=1`
- 当前方案不扩展为公网发布、域名购买、商业 CA 证书申请或应用商店分发
- 当前方案不改变“普通 Web 仍是主线，PWA 属于渐进增强”的原则

## 3. 推荐拓扑

```text
Android 真机 Chrome/Edge
        ->
  HTTPS://局域网 IP 或私有主机名
        ->
     Nginx 443
        ->
  http://127.0.0.1:3001
        ->
  Rento production server
```

建议优先使用以下两种访问方式之一：

- `https://192.168.31.84`
- `https://rento.internal`

其中：

- 若只是快速打通链路，优先使用局域网 IP
- 若准备长期保留真机验收环境，优先使用私有主机名

## 4. 前置条件

- Ubuntu 24 作为宿主机
- 项目可通过 `npm run build` 成功构建
- 项目可通过统一入口 `npm run start` 成功启动
- Android 真机已连接同一局域网
- 当前最小门禁已可用，管理员账号密码已配置
- `.env` 保持为宿主机私有配置；若历史上曾被 Git 追踪，先执行 `git rm --cached .env`，仅移除索引中的追踪状态，不删除本地文件
- `certs/`、`nginx/ssl/` 与各类证书私钥文件只允许留在宿主机私有路径；若仓库历史上曾追踪过这些路径，先执行 `git rm --cached -r certs nginx/ssl` 清理索引

## 5. mkcert 与本地 CA

### 5.1 安装 mkcert

```bash
sudo apt update
sudo apt install -y mkcert libnss3-tools
mkcert -install
```

说明：

- `mkcert -install` 会在本机安装本地根证书
- 这不是公网可信证书，只对你自己的受控验证环境有效

### 5.2 生成局域网证书

```bash
mkdir -p ~/rento-local-certs
cd ~/rento-local-certs
mkcert 192.168.31.84 localhost 127.0.0.1 rento.internal
```

生成结果通常类似：

- `192.168.31.84+3.pem`
- `192.168.31.84+3-key.pem`

要求：

- 证书与私钥不得提交到仓库
- 证书文件应保留在宿主机私有目录或未纳入版本控制的部署目录
- 推荐保持在类似 `~/rento-local-certs/` 这类宿主机私有路径，并通过模板变量引用，不要复制进 `nginx/`、`docs/` 或其他仓库主路径
- 若当前仓库历史上已经跟踪过 `certs/`，先执行 `git rm --cached -r certs`，仅移除版本控制索引中的追踪状态，不删除宿主机私有文件

## 6. Nginx HTTPS 反向代理

### 6.1 最小配置目标

- Nginx 监听 `443`
- 使用 `mkcert` 生成的证书
- 将 HTTPS 请求转发到 `http://127.0.0.1:3001`
- 保留 `Host`、`X-Forwarded-Proto` 等关键头

### 6.2 参考配置

推荐先复制模板变量示例到宿主机私有路径：

```bash
cp ./nginx/templates/rento-local-https.env.example ~/rento-local-https.env
```

然后按真实 IP / 私有主机名 / 证书路径修改以下字段：

- `PWA_LOCAL_HTTPS_SERVER_NAMES`
- `PWA_LOCAL_HTTPS_CERT_PATH`
- `PWA_LOCAL_HTTPS_KEY_PATH`
- `PWA_LOCAL_HTTPS_UPSTREAM_URL`

再渲染仓库内模板：

```bash
bash ./scripts/pwa-local-https-helper.sh render --nginx-env ~/rento-local-https.env --output ./nginx/runtime/rento-local-https.conf
```

渲染结果默认供 compose 托管的 `local-https-nginx` 服务直接挂载；它不会改写 system nginx，也不会影响现有生产 `nginx` 路径。

模板展开后会得到如下结构：

```nginx
server {
    listen 443 ssl http2;
    server_name 192.168.31.84 rento.internal;

    ssl_certificate     /home/dell/rento-local-certs/192.168.31.84+3.pem;
    ssl_certificate_key /home/dell/rento-local-certs/192.168.31.84+3-key.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

可选的 HTTP 跳转：

```nginx
server {
    listen 80;
    server_name 192.168.31.84 rento.internal;
    return 301 https://$host$request_uri;
}
```

## 7. 应用环境变量

至少确保以下口径一致：

```bash
NODE_ENV=production
NEXT_PUBLIC_ENABLE_PWA=1
NEXTAUTH_URL=https://192.168.31.84
ALLOWED_ORIGINS=https://192.168.31.84
```

如果使用私有主机名，则改为：

```bash
NEXTAUTH_URL=https://rento.internal
ALLOWED_ORIGINS=https://rento.internal
```

同时确认：

- `AUTH_SESSION_SECRET` 已配置
- `ADMIN_USERNAME` 已配置
- `ADMIN_PASSWORD_HASH` 已配置

推荐在启动前执行：

```bash
bash ./scripts/pwa-local-https-helper.sh validate --env-file ./.env --nginx-env ~/rento-local-https.env
```

该检查会确认：

- `NEXTAUTH_URL` 为 HTTPS
- `ALLOWED_ORIGINS` 已包含与 `NEXTAUTH_URL` 相同的来源
- `NEXT_PUBLIC_ENABLE_PWA=1`
- 当前 `server_name`、证书路径和 `.next` 生产构建产物是否基本齐备

## 8. 应用启动

当前项目使用 `output: 'standalone'`，生产启动只能走统一入口：

```bash
npm run build
NEXT_PUBLIC_ENABLE_PWA=1 npm run start
```

说明：

- 不要直接执行裸 `next start`
- 统一入口会自动校验 `.next` 产物，并处理 `standalone` 运行目录

## 9. Android 真机准备

### 9.1 安装本地根证书

需要把 `mkcert` 的本地根证书导入 Android 真机，并安装为受信任证书。

常见步骤：

- 从宿主机导出本地根证书
- 传输到 Android 手机
- 在手机设置中执行“从存储安装证书”

注意：

- 不同厂商系统菜单路径不同，常见位置是“安全 / 凭据 / 安装证书”
- 若真机未信任该根证书，HTTPS 访问会失败或被浏览器标记为不安全

### 9.2 浏览器要求

- 正式验收优先使用 Android Chrome
- Android Edge 可作为次级兼容验证
- 若某浏览器不显示统一安装提示，不自动判定为 PWA 实现失败，应先确认 HTTPS、SW 和 manifest 是否成立

## 10. 验证顺序

建议严格按以下顺序执行，避免把“能打开网页”误判成“PWA 已完成交付”。

若需要查看仓库统一定义的连续步骤，可运行：

```bash
bash ./scripts/pwa-local-https-helper.sh checklist --env-file ./.env --nginx-env ~/rento-local-https.env
```

该命令现在会先执行前置校验：

- `NEXTAUTH_URL` 不是 HTTPS 时直接失败，避免把 HTTP 环境带入私有 HTTPS 验收链路
- `NEXT_PUBLIC_ENABLE_PWA!=1` 时明确警告，提醒你先修正开关并重新构建
- 当仓库根目录 `.env` 仍被 Git 跟踪时明确警告，提醒先移除版本控制追踪再继续验收

### 10.1 基础 HTTPS

- 使用手机访问 `https://192.168.31.84` 或 `https://rento.internal`
- 页面不再出现明显证书阻断
- 未登录时能进入 `/login`
- 登录与退出链路正常

### 10.2 PWA 资源可达

至少检查：

- `/manifest.json`
- `/sw.js`
- `/offline`
- `/api/health`

### 10.3 最小烟雾检查

若宿主机 `curl` 尚未信任 mkcert 根证书，可临时把 `CURL_CA_BUNDLE=/home/dell/.local/share/mkcert/rootCA.pem` 加到命令前。


```bash
bash ./scripts/pwa-smoke-check.sh --base-url https://192.168.31.84
```

或：

```bash
bash ./scripts/pwa-smoke-check.sh --base-url https://rento.internal
```

### 10.4 真机安装与更新

- 首次访问登录页
- 登录成功
- 首页、房源、合同、账单可访问
- 安装入口可见，或浏览器菜单存在“安装应用”
- 安装后以独立窗口打开
- 发布新版本后可出现更新提示
- 点击更新后可切换到新版本
- 断网后新导航请求进入 `/offline`
- 清除站点缓存或移除图标后，可重新安装并再次完成上述路径

## 11. 常见问题

### 11.1 PC Edge 可以安装，手机没有安装提示

优先排查：

- 当前访问是否为 HTTPS
- 手机是否已信任本地根证书
- 当前浏览器是否为正式支持浏览器
- `NEXT_PUBLIC_ENABLE_PWA=1` 是否已在 production 构建中生效

不要直接把“某个浏览器没有安装提示”等价为“PWA 源码失败”。

### 11.2 手机能访问网页，但无法进入安装态

先确认：

- `manifest.json` 可访问
- `sw.js` 可访问
- 浏览器 Application / Service Worker 中已成功注册
- 当前环境满足安全上下文

### 11.3 更换了代码，但真机看起来还是旧页面

依次排查：

- 是否重新执行了 `npm run build`
- 是否重新走统一入口 `npm run start`
- 是否仍保留旧的 service worker
- 是否需要清空站点缓存并重新打开页面

### 11.4 如何更换 IP 或主机名

按以下顺序更新，避免只改一半：

1. 更新 `.env` 中的 `NEXTAUTH_URL` 与 `ALLOWED_ORIGINS`
2. 更新 `~/rento-local-https.env` 中的 `PWA_LOCAL_HTTPS_SERVER_NAMES`
3. 若证书 SAN 不再覆盖新地址，重新执行 `mkcert ...`
4. 重新渲染 `./nginx/runtime/rento-local-https.conf`，在同一 shell 执行 `set -a && source ./.env && source ~/rento-local-https.env && set +a` 后，再执行 `docker compose -f docker-compose.local-https.yml up -d local-https-nginx`
5. 重新执行 `bash ./scripts/pwa-local-https-helper.sh validate --env-file ./.env --nginx-env ~/rento-local-https.env`
6. 再执行 `bash ./scripts/pwa-smoke-check.sh --base-url https://your-new-origin`

### 11.5 如何最小回退到普通 Web

若不再验证 PWA，只想保留普通 Web：

1. 把 `.env` 中的 `NEXT_PUBLIC_ENABLE_PWA` 改为 `0`
2. 重新执行 `npm run build`
3. 重新执行 `npm run start`
4. 保留现有 Nginx HTTPS 反代也可以；用户重新访问后会注销 Rento 的 service worker
5. 如需彻底停止本地 HTTPS 验证，再移除宿主机 Nginx 站点配置与 mkcert 本地证书

## 12. 最小回退

若只想撤回 PWA 能力，而不影响普通 Web 主线：

```bash
NEXT_PUBLIC_ENABLE_PWA=0
```

然后重新构建并发布：

```bash
npm run build
npm run start
```

用户重新访问后，前端会注销 Rento 的 service worker，并退回普通响应式 Web。

## 13. 执行结论

对当前项目而言，`Ubuntu 24 + Nginx + mkcert + Android 真机` 是：

- 合理的私有 HTTPS 技术验证方案
- 不引入公网域名与商业证书成本的最小落地路径
- 与 `phase05` 当前支持矩阵和部署口径一致的执行补充

它是 `phase05-pwa-delivery-05` 的落地 runbook，不是新的 phase 子任务。
