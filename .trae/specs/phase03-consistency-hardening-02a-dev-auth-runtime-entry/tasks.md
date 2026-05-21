# Tasks

- [x] Task 1: 冻结开发态运行入口方案
  - [x] SubTask 1.1: 明确开发态统一启动入口的命名、调用方式和边界
  - [x] SubTask 1.2: 明确哪些认证、数据库、缓存环境变量必须校验，哪些仅保留文档说明
  - [x] SubTask 1.3: 明确不得绕过 `middleware`、不得取消最小门禁、不得引入第二套认证路径

- [x] Task 2: 实现统一开发态启动入口
  - [x] SubTask 2.1: 在 `scripts/` 下新增或更新用户手动执行的开发启动脚本
  - [x] SubTask 2.2: 为关键环境变量缺失提供清晰失败提示
  - [x] SubTask 2.3: 必要时补充 `package.json` 的轻量启动别名

- [x] Task 3: 同步文档与模板
  - [x] SubTask 3.1: 更新 `README.md` 中的推荐开发启动方式
  - [x] SubTask 3.2: 更新 `ENVIRONMENT_GUIDE.md` 中开发态认证 / 数据库运行上下文说明
  - [x] SubTask 3.3: 若有必要，更新 `.env.example` 中与开发态启动直接相关的模板变量说明

- [x] Task 4: 验证运行上下文一致性
  - [x] SubTask 4.1: 执行 `npm run lint`
  - [x] SubTask 4.2: 执行 `npm run type-check`
  - [x] SubTask 4.3: 提供至少一条可执行验证路径，证明浏览器验证与脚本验证共享同一认证 / 数据库上下文假设

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 2
- Task 4 depends on Task 2
