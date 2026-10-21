# ABS 看板源码评审分支说明

分支：`review/abs-source-20261021`，基于当前远程 `main`。本分支包含看板业务源码、前端接口适配和部署说明，不包含测试文件或构建产物。

纳入范围包括认证会话和闲置超时、细粒度权限、用户及审计管理、系统备份入口、主机与船端状态、实时点位映射、数据轮询和告警/导航页面调整。后端 API 地址和登录配置按部署环境提供，不能把演示模式用于正式联调。

2026-10-21 对本评审分支的实际业务源码做隔离回归：将业务文件按 SHA-256 核对后复制到 `D:/Board/runtime/review-validation-20261021/board`，仅在该隔离目录补入本地测试与 setupTests；设置 `CI=true`，执行 `node node_modules/react-scripts/bin/react-scripts.js test --watchAll=false --runInBand`，9 个测试套件、44 项全部通过，退出码 0。此结果对应当前评审源码；本次提交不新增或修改测试文件，远程 main 已跟踪的测试仍保留。

Windows 构建命令：设置 `INLINE_RUNTIME_CHUNK=false`、`CI=false` 后执行 `node node_modules/react-scripts/bin/react-scripts.js build`。这与 `npm run build` 调用相同的 CRA 构建入口，环境变量由 PowerShell 设置。2026-10-21 在本评审工作树构建退出码 0，结果为 `Compiled with warnings`：依赖包 `@mediapipe/tasks-vision` 缺少 source map，Browserslist 数据提示过期；均未导致构建失败。构建产物位于 `D:/Board/runtime/review-builds/board`，不提交。部署构建需设置真实 API 地址并验证对应后端权限。

PR 为 `https://github.com/ecustship/board/pull/1`，目标为 main。2026-10-21 本地合并树核验无文本冲突；GitHub 公开检查没有已配置的 check-run 或状态上下文，因此本地构建和测试成功不等于远程 CI 已通过。

三个仓库采用同名分支 `review/abs-source-20261021`。后端评审说明位于其 `docs/abs-source-review-20261021.md`，通信端位于其 `docs/ABS_SOURCE_REVIEW_20261021.md`。此交付不代表生产部署或 ABS 项正式签认，原工作区的未提交修改保留，`main` 不推送。
