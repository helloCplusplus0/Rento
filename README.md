# Rento

Rento 是一个面向房东和运营者的私有化租赁管理后台，覆盖房源、租客、合同、账单、仪表与抄表主链。

## 当前定位
- 交付形态固定为受控私有部署，不面向公网匿名访问
- 云服务器最终基线固定为预构建镜像部署，不再保留宿主机源码运行路线
- HTTPS 和 PWA 以 Nginx 反向代理 + 正式证书为标准入口
- 数据库主线固定为 PostgreSQL，缓存固定为 Redis

## 最终部署真相源
- `docker-compose.yml`：唯一容器编排入口
- `.env.example`：唯一共享环境模板
- `nginx/nginx.conf`：唯一 HTTPS 反向代理配置
- `scripts/cloud-deploy.sh`：唯一云服务器部署执行脚本
- `scripts/bootstrap-deploy-assets.sh`：唯一部署资产拉取脚本

这意味着后续在新云服务器上部署时，不需要再走源码构建路径，也不需要手动筛选仓库文件。

## 最短入口
```bash
curl -fsSL https://raw.githubusercontent.com/helloCplusplus0/Rento/main/scripts/bootstrap-deploy-assets.sh | bash -s -- /opt/rento
cd /opt/rento
cp .env.example .env
chmod +x scripts/cloud-deploy.sh
./scripts/cloud-deploy.sh rento.example.com
```

详细步骤、环境变量、更新和回滚统一见 `DEPLOYMENT.md`。
