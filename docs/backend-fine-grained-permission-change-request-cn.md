# 后端细粒度权限改造需求

本文档用于发给后端，目标是在现有 RBAC 基础上，把当前粗粒度权限升级为适合船舶管理系统的细粒度权限体系。前端已改为优先识别新权限，同时兼容旧权限，因此后端可以分阶段上线。

## 1. 当前问题

现有权限点过粗：

| 旧权限 | 当前含义 | 问题 |
| --- | --- | --- |
| `engine:read` | 机组与测点查询 | 主机、机舱系统、导航、海图无法区分 |
| `alarm:write` | 告警确认/恢复、告警规则维护 | 确认、复位、规则维护混在一起 |
| `ingest:write` | 遥测数据接入 | 数据接入、点表导入、点表应用、点表回滚混在一起 |
| `user:write` | 用户创建/更新/重置密码 | 用户、角色、停用、重置密码无法拆分 |
| `report:write` | 报告任务提交 | 报告创建和导出无法区分 |

前端菜单和按钮已经开始按新权限判断，但后端仍必须做真实鉴权，不能只依赖前端显隐。

## 2. 权限命名规范

建议统一使用：

```text
模块:对象:动作
```

动作建议固定为：

```text
read      查看
create    新建
update    修改
delete    删除
import    导入
export    导出
ack       报警确认
reset     报警复位
validate  校验
apply     应用配置
rollback  回滚配置
approve   审批
operate   远程操作
```

## 3. 建议新增权限点

### 3.1 监控页面

| 权限点 | 中文名称 | 控制范围 |
| --- | --- | --- |
| `engine:main:read` | 主机页面查看 | Main Engine 页面、主机聚合数据 |
| `engine:system:read` | 机舱系统页面查看 | Engine Systems 页面、系统剖面图 |
| `navigation:read` | 导航页面查看 | Navigation 页面、船位、姿态、风速风向 |
| `chart:read` | 海图页面查看 | Nautical Charts 页面 |

### 3.2 报警

| 权限点 | 中文名称 | 控制范围 |
| --- | --- | --- |
| `alarm:event:read` | 报警事件查看 | 报警列表、全局报警条、页面报警卡片 |
| `alarm:event:ack` | 报警确认 | ACK 操作 |
| `alarm:event:reset` | 报警复位 | Reset/恢复操作 |
| `alarm:rule:read` | 报警规则查看 | 报警规则列表 |
| `alarm:rule:update` | 报警规则维护 | 新增/修改/启停报警规则，高风险 |

说明：当前方案中 UI 不负责报警阈值判断；船端报警 bit 或后端报警事件直接进入系统。若后端保留报警规则功能，需要单独权限，不应继续复用 `alarm:write`。

### 3.3 趋势、质量、数据

| 权限点 | 中文名称 | 控制范围 |
| --- | --- | --- |
| `trend:read` | 趋势查询 | 趋势标签和趋势数据查询 |
| `trend:export` | 趋势导出 | 趋势 CSV/Excel 导出 |
| `quality:read` | 数据质量查看 | 数据质量摘要 |
| `ingest:telemetry:write` | 遥测数据接入 | 船端/模拟器写入遥测数据 |
| `ingest:batch:read` | 接入批次查看 | 数据接入批次、错误批次查询 |

### 3.4 采集配置 / MODBUS 点表

| 权限点 | 中文名称 | 控制范围 |
| --- | --- | --- |
| `config:point-table:read` | 点表查看 | 点表版本、点位明细、通信参数查看 |
| `config:point-table:update` | 点表编辑 | 新建/修改点位、修改通信参数 |
| `config:point-table:import` | 点表导入 | 从 Excel/CSV/JSON 导入草稿 |
| `config:point-table:export` | 点表导出 | 导出运行点表 |
| `config:point-table:validate` | 点表校验 | 单点测试、整表校验 |
| `config:point-table:apply` | 点表应用 | 保存并应用运行版本，高风险 |
| `config:point-table:rollback` | 点表回滚 | 回滚到历史版本，高风险 |

### 3.5 用户、角色、权限

| 权限点 | 中文名称 | 控制范围 |
| --- | --- | --- |
| `user:read` | 用户查看 | 用户列表、用户详情 |
| `user:create` | 用户创建 | 创建账号 |
| `user:update` | 用户编辑 | 修改显示名、角色等 |
| `user:disable` | 用户停用 | 启用/停用账号 |
| `user:password-reset` | 重置用户密码 | 管理员重置其他用户密码 |
| `role:read` | 角色查看 | 角色列表、权限列表 |
| `role:create` | 角色创建 | 新建角色 |
| `role:update` | 角色编辑 | 修改角色名称和权限 |
| `role:delete` | 角色删除 | 删除自定义角色 |

### 3.6 报告与审计

| 权限点 | 中文名称 | 控制范围 |
| --- | --- | --- |
| `report:read` | 报告查看 | 查询报告任务、历史报告 |
| `report:create` | 报告创建 | 创建报告任务 |
| `report:export` | 报告导出 | 下载报告文件 |
| `audit:read` | 审计日志查看 | 查询审计日志 |
| `audit:export` | 审计日志导出 | 导出审计日志 |

## 4. 旧权限兼容关系

后端可以短期保留旧权限，但建议在登录和 `/auth/me` 返回中同时返回新权限。兼容映射如下：

| 旧权限 | 可映射的新权限 |
| --- | --- |
| `engine:read` | `engine:main:read`、`engine:system:read`、`navigation:read`、`chart:read` |
| `alarm:read` | `alarm:event:read` |
| `alarm:write` | `alarm:event:ack`、`alarm:event:reset` |
| `trend:read` | `trend:read` |
| `ingest:write` | `config:point-table:read`、`config:point-table:update`、`config:point-table:import`、`config:point-table:export`、`config:point-table:validate`、`config:point-table:apply`、`config:point-table:rollback`、`ingest:telemetry:write` |
| `user:write` | `user:create`、`user:update`、`user:disable`、`user:password-reset`、`role:create`、`role:update`、`role:delete` |
| `user:read` | `user:read`、`role:read` |
| `report:write` | `report:create`、`report:export` |

## 5. 默认角色建议

| 角色编码 | 角色名称 | 建议权限 |
| --- | --- | --- |
| `ADMIN` | 系统超级管理员 | 全部权限 |
| `FLEET_MANAGER` | 船管公司管理员 | 多船查看、用户查看、部分用户管理、报告、审计 |
| `SHORE_MONITOR` | 岸端监控中心 | 监控页面查看、报警查看、报警确认、趋势查看 |
| `TECH_SUPERVISOR` | 机务主管 | 主机/机舱系统/趋势/报警/报告，点表审核或应用 |
| `CHIEF_ENGINEER` | 轮机长 | 本船主机和机舱系统查看、报警确认/复位、点表查看/校验 |
| `ENGINEER` | 轮机员 | 本船主机和机舱系统查看、报警确认、趋势查看 |
| `ELECTRICIAN` | 电气员 | 机舱系统、电力参数、趋势查看 |
| `CAPTAIN` | 船长 | 导航、海图、报警总览、趋势只读 |
| `DATA_ENGINEER` | 数据工程师 | 趋势、质量、接入批次、导出，不允许报警处置 |
| `COMM_ENGINEER` | 通信采集工程师 | 点表配置、校验、导入导出、遥测接入 |
| `AUDITOR` | 审计员 | 用户只读、角色只读、审计只读、报告只读 |
| `VIEWER` | 访客/船东 | 指定船舶只读 |

## 6. 数据范围 Scope

权限只解决“能做什么”，还需要 Scope 限制“能访问哪些对象”。建议用户或角色增加数据范围：

```json
{
  "scope": {
    "vessels": ["MHM-TierIII-Demo"],
    "engines": ["CMMS01", "CMMS02"],
    "systems": ["main-engine", "engine-system", "navigation"],
    "dataLevel": "operation"
  }
}
```

建议字段：

| 字段 | 含义 |
| --- | --- |
| `vessels` | 可访问船舶 ID，空数组或 `*` 代表全部 |
| `engines` | 可访问机组，例如 `CMMS01` |
| `systems` | 可访问系统，例如 `main-engine`、`alarm` |
| `dataLevel` | 数据等级，例如 `public`、`operation`、`maintenance`、`security` |

后端所有带 `vesselId`、`engineCode`、`system` 的接口都要检查 Scope。

## 7. 接口鉴权要求

以下为当前前端直接使用或即将使用的接口鉴权建议：

| 接口 | 权限 |
| --- | --- |
| `GET /api/v1/vessels/{vesselId}/engines` | `engine:main:read` 或 `engine:system:read` |
| `GET /api/v1/vessels/{vesselId}/realtime` | 根据返回内容检查 `engine:main:read`、`engine:system:read`、`navigation:read` |
| `GET /api/v1/vessels/{vesselId}/system-status` | `engine:system:read` |
| `GET /api/v1/vessels/{vesselId}/alarms` | `alarm:event:read` |
| `POST /api/v1/vessels/{vesselId}/alarms/{alarmId}/acknowledge` | `alarm:event:ack` |
| `POST /api/v1/alarms/{alarmId}/reset` | `alarm:event:reset` |
| `GET /api/v1/trends/tags` | `trend:read` |
| `POST /api/v1/trends/query` | `trend:read` |
| 趋势导出接口 | `trend:export` |
| `GET /api/v1/vessels/{vesselId}/devices/{deviceId}/point-tables/...` | `config:point-table:read` |
| `POST /api/v1/vessels/{vesselId}/devices/{deviceId}/point-tables` | `config:point-table:update` 或 `config:point-table:import` |
| `POST /api/v1/.../point-test` | `config:point-table:validate` |
| `POST /api/v1/.../validate` | `config:point-table:validate` |
| `POST /api/v1/.../apply` | `config:point-table:apply` |
| `POST /api/v1/.../rollback` | `config:point-table:rollback` |
| `POST /api/v1/ingest/telemetry` | `ingest:telemetry:write` |
| `GET /api/v1/users`、`GET /api/v1/users/{userId}` | `user:read` |
| `POST /api/v1/users` | `user:create` |
| `PATCH /api/v1/users/{userId}` | 根据字段检查 `user:update` 或 `user:disable` |
| `POST /api/v1/users/{userId}/reset-password` | `user:password-reset` |
| `GET /api/v1/roles`、`GET /api/v1/permissions` | `role:read` |
| `POST /api/v1/roles` | `role:create` |
| `PATCH /api/v1/roles/{roleCode}` | `role:update` |
| `DELETE /api/v1/roles/{roleCode}` | `role:delete` |
| `GET /api/v1/reports/{jobId}` | `report:read` |
| `POST /api/v1/reports` | `report:create` |

## 8. 审计要求

以下操作必须写审计日志：

```text
用户创建、编辑、停用、重置密码
角色创建、编辑、删除
报警确认、报警复位
点表导入、编辑、校验、应用、回滚
趋势/报告/审计导出
遥测接入失败批次
```

审计字段建议：

```json
{
  "actorUserId": "user-001",
  "actorUsername": "admin",
  "action": "config:point-table:apply",
  "targetType": "point_table",
  "targetId": "MHM-TierIII-Demo/MAIN_GENSET_1/v2",
  "vesselId": "MHM-TierIII-Demo",
  "before": {},
  "after": {},
  "ip": "127.0.0.1",
  "traceId": "req-xxx",
  "createdAt": "2026-07-13T16:00:00+08:00"
}
```

## 9. 数据库迁移建议

需要新增或调整：

1. `permissions` 表 seed 新权限点。
2. `role_permissions` 表为内置角色补齐新权限。
3. 用户或角色增加 Scope 存储。可以先放 `role_scopes` 或 `user_scopes`，也可以短期使用 JSONB 字段。
4. 保留旧权限一段时间，登录时可返回新旧并存，等前端和后端都稳定后再移除旧权限。

## 10. 前端已完成的适配

前端已完成：

1. 菜单按细权限显示：主机、机舱系统、导航、海图、报警、趋势、配置分别判断。
2. 报警按钮拆分为 `alarm:event:ack` 和 `alarm:event:reset`。
3. 配置页按钮按点表导入、导出、校验、应用、回滚分别禁用。
4. 用户管理拆分用户创建、编辑、重置密码。
5. 角色管理拆分角色查看、创建、编辑、删除。
6. 前端兼容旧权限，后端未改完时现有 `admin/operator/viewer` 仍可使用。

后端上线新权限后，前端不需要改接口结构，只需要登录和 `/auth/me` 返回新的 `permissions` 数组即可。
