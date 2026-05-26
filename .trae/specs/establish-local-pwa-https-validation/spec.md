# 建立本地 PWA HTTPS 验证能力 Spec

## Why
当前仓库已经有 `phase05-pwa-delivery-05` 的交付口径和一份执行型 runbook，但“Ubuntu 24 + Nginx + mkcert + Android 真机”的本地私有 HTTPS 方案仍主要依赖手工步骤和临时操作，尚未沉淀成仓库内可长期维护、可重复执行、可验证的本地能力。若不把这套方案工程化固化，后续每次本地真机验收都可能重新踩到证书、反代、环境变量和启动链路漂移的问题。

## What Changes
- 将本地私有 HTTPS + Android 真机 PWA 验证方案收口为仓库内的长期本地验证能力
- 提供受版本控制的本地 Nginx 配置模板、环境变量示例和最小执行脚本入口
- 明确证书文件、私钥和本地根证书的非版本控制边界，避免把敏感本地资产回写进仓库
- 统一 `README.md`、`DEPLOYMENT.md`、`ENVIRONMENT_GUIDE.md` 与 runbook 的本地验证入口，消除“文档能看、仓库不能直接执行”的断层
- 将本地 HTTPS 验证的检查步骤纳入最小可执行验收路径，但不扩展为公网部署或完整 DevOps 平台

## Impact
- Affected specs:
  - `phase05-pwa-delivery-05-private-deployment-and-installation-readiness`
- Affected code:
  - `nginx/` 下的本地 HTTPS 配置模板
  - `scripts/` 下的本地 HTTPS 辅助脚本
  - `.env.example`
  - `README.md`
  - `DEPLOYMENT.md`
  - `ENVIRONMENT_GUIDE.md`
  - `docs/pwa_private_https_android_acceptance_runbook.md`

## ADDED Requirements
### Requirement: 仓库内本地 HTTPS 验证骨架
系统 SHALL 在仓库内提供一套可长期维护的本地私有 HTTPS 验证骨架，使用户不购买域名和公网证书时，仍能在受控局域网完成 Android 真机 PWA 验证。

#### Scenario: 本地 HTTPS 骨架可发现
- **WHEN** 用户按照仓库文档准备本地 PWA 验证环境
- **THEN** 用户可以在仓库中找到明确的 Nginx 配置模板、环境变量入口、脚本入口和证书放置约束

#### Scenario: 本地 HTTPS 骨架可重复执行
- **WHEN** 用户在同一台 Ubuntu 24 主机上重复执行本地 HTTPS 验证流程
- **THEN** 用户无需重新拼接零散命令或临时修改多处文件，即可按同一入口完成启动和验证

### Requirement: 证书与本地资产边界明确
系统 SHALL 明确哪些本地 HTTPS 资产属于运行时私有文件，必须留在宿主机或未纳入版本控制的目录，而不是进入仓库主路径。

#### Scenario: 证书边界清晰
- **WHEN** 用户生成 `mkcert` 证书和私钥
- **THEN** 文档和示例明确说明证书、私钥和本地根证书的存放路径、忽略策略和不可提交约束

### Requirement: 本地环境变量口径统一
系统 SHALL 为本地私有 HTTPS 验证提供统一的环境变量口径，使 `NEXTAUTH_URL`、`ALLOWED_ORIGINS`、PWA 开关与启动入口保持一致。

#### Scenario: 本地私有 HTTPS 来源一致
- **WHEN** 用户选择局域网 IP 或私有主机名作为本地验证入口
- **THEN** 文档与示例明确说明 `NEXTAUTH_URL`、`ALLOWED_ORIGINS` 与反代来源必须收口为同一 HTTPS 来源

### Requirement: 本地验收入口可执行
系统 SHALL 提供一条面向本地真机验收的最小执行路径，使用户能从构建、启动、HTTPS 验证、PWA 资源检查到 Android 真机验收形成闭环。

#### Scenario: 本地验收路径连贯
- **WHEN** 用户按仓库提供的本地执行路径操作
- **THEN** 用户可以依次完成构建、统一启动、反代接入、烟雾检查与 Android 真机安装/更新验证

## MODIFIED Requirements
### Requirement: Phase05-05 本地私有部署说明
`phase05-pwa-delivery-05` 的“私有部署与安装验收准备”不再只停留于说明级 runbook，而应补充一套仓库内可长期维护的本地 HTTPS 验证骨架，用于支撑不购买域名和公网证书时的真实真机验收。

### Requirement: 本地验证不是临时手工方案
Rento 的本地 PWA 验证路径必须具备“可复用、可维护、可解释”的工程化入口，而不是依赖一次性命令、即时口头说明或临时修改系统配置。

## REMOVED Requirements
### Requirement: 仅以手工 runbook 作为本地验证唯一承接
**Reason**: 单纯依赖 runbook 虽能解释流程，但不足以保证仓库内存在稳定、长期可复用的执行骨架，容易在脚本、配置与文档之间重新产生断层。
**Migration**: 继续保留 runbook 作为操作真相源，同时新增仓库内的模板、脚本、示例配置和统一入口承接本地 HTTPS 验证能力。
