# 后端权限系统完整改造清单

本文档用于转发给后端开发。目标是把当前 9 个粗粒度权限升级为适合船舶管理平台的细粒度权限体系，并保证前端用户管理、角色管理、页面菜单、按钮级操作可以真正按权限控制。

## 1. 当前现状

当前后端 `GET /api/v1/permissions` 只返回 9 个权限点：

```text
engine:read
trend:read
alarm:read
alarm:write
quality:read
ingest:write
report:write
user:read
user:write
```

这 9 个权限不够细，存在以下问题：

| 问题 | 说明 |
| --- | --- |
| 页面无法细分 | `engine:read` 同时控制主机、机舱系统、导航、海图，不能按专业岗位分配 |
| 报警操作过粗 | `alarm:write` 同时代表确认、复位、报警规则维护，风险不同 |
| 点表配置过粗 | `ingest:write` 同时代表数据接入、点表导入、点表应用、回滚 |
| 用户管理过粗 | `user:write` 同时代表创建用户、编辑用户、停用用户、重置密码、角色维护 |
| 缺少数据范围 | 现在只控制“能做什么”，不能控制“能看哪条船、哪台机、哪个系统” |
| 审计粒度不足 | 高风险操作需要记录操作前后差异、操作者、IP、traceId |

前端已经完成兼容适配：

1. 前端内置完整细粒度权限目录。
2. 角色编辑页会显示完整权限点。
3. 后端尚未返回的新权限会显示为“待后端上线”，暂时不能勾选保存。
4. 前端仍兼容旧权限，后端未改完时现有账号还能使用。

后端需要完成本文件以下改造后，前端角色管理页才能真正勾选和保存细权限。

## 2. 总体改造目标

后端需要实现：

1. `permissions` 表新增完整细粒度权限点。
2. 登录接口和 `/auth/me` 返回完整权限数组。
3. 角色创建/编辑允许保存新权限点。
4. 所有业务接口按新权限做后端鉴权。
5. 用户或角色增加数据范围 Scope。
6. 高风险操作写审计日志。
7. 保留旧权限一段时间，避免前后端发版不同步造成系统不可用。

## 3. 权限命名规范

建议统一使用：

```text
模块:对象:动作
```

动作枚举：

| 动作 | 含义 |
| --- | --- |
| `read` | 查看 |
| `create` | 新建 |
| `update` | 修改 |
| `delete` | 删除 |
| `import` | 导入 |
| `export` | 导出 |
| `ack` | 报警确认 |
| `reset` | 报警复位 |
| `validate` | 校验 |
| `apply` | 应用配置 |
| `rollback` | 回滚配置 |
| `approve` | 审批 |
| `operate` | 远程操作 |

## 4. 后端需要新增的权限点

### 4.1 监控页面权限

| 权限点 | 中文名称 | 用途 |
| --- | --- | --- |
| `engine:main:read` | 主机页面查看 | Main Engine 页面、主机模型、主机实时参数 |
| `engine:system:read` | 机舱系统页面查看 | Engine Systems 页面、剖面图、系统卡片 |
| `navigation:read` | 导航页面查看 | Navigation 页面、经纬度、航向、姿态、风速风向 |
| `chart:read` | 海图页面查看 | Nautical Charts 页面 |

### 4.2 报警权限

| 权限点 | 中文名称 | 用途 |
| --- | --- | --- |
| `alarm:event:read` | 报警事件查看 | 报警列表、全局报警条、页面报警卡片 |
| `alarm:event:ack` | 报警确认 | ACK 操作 |
| `alarm:event:reset` | 报警复位 | Reset/恢复操作 |
| `alarm:rule:read` | 报警规则查看 | 查看后端报警规则 |
| `alarm:rule:update` | 报警规则维护 | 新增、修改、启停报警规则 |

说明：当前产品方案是报警由船端或后端产生，前端不配置阈值、不判断报警。若后端保留报警规则引擎，规则维护必须独立于报警确认权限。

### 4.3 趋势、数据质量、数据接入权限

| 权限点 | 中文名称 | 用途 |
| --- | --- | --- |
| `trend:read` | 趋势查询 | 趋势标签和趋势曲线查询 |
| `trend:export` | 趋势导出 | 趋势数据 CSV/Excel 导出 |
| `quality:read` | 数据质量查看 | 数据质量摘要、异常点状态 |
| `ingest:telemetry:write` | 遥测数据接入 | 船端采集服务或模拟器上传遥测数据 |
| `ingest:batch:read` | 接入批次查看 | 查看接入批次、失败批次、错误详情 |

### 4.4 采集配置 / MODBUS 点表权限

| 权限点 | 中文名称 | 用途 |
| --- | --- | --- |
| `config:point-table:read` | 点表查看 | 点表版本、点位明细、通信参数查看 |
| `config:point-table:update` | 点表编辑 | 新增、修改、删除点位，修改通信参数 |
| `config:point-table:import` | 点表导入 | 从 Excel/CSV/JSON 导入点表草稿 |
| `config:point-table:export` | 点表导出 | 导出运行点表 |
| `config:point-table:validate` | 点表校验 | 单点测试、整表校验 |
| `config:point-table:apply` | 点表应用 | 保存并应用运行版本，高风险 |
| `config:point-table:rollback` | 点表回滚 | 回滚到历史版本，高风险 |

### 4.5 用户、角色、权限管理

| 权限点 | 中文名称 | 用途 |
| --- | --- | --- |
| `user:read` | 用户查看 | 用户列表、用户详情 |
| `user:create` | 用户创建 | 创建账号 |
| `user:update` | 用户编辑 | 修改显示名、角色等普通字段 |
| `user:disable` | 用户停用 | 启用或停用账号 |
| `user:password-reset` | 重置用户密码 | 管理员重置其他用户密码 |
| `role:read` | 角色查看 | 角色列表、权限列表 |
| `role:create` | 角色创建 | 新建角色 |
| `role:update` | 角色编辑 | 修改角色名称和权限 |
| `role:delete` | 角色删除 | 删除自定义角色 |

### 4.6 报告与审计

| 权限点 | 中文名称 | 用途 |
| --- | --- | --- |
| `report:read` | 报告查看 | 查询报告任务、历史报告 |
| `report:create` | 报告创建 | 创建报告任务 |
| `report:export` | 报告导出 | 下载报告文件 |
| `audit:read` | 审计日志查看 | 查询审计日志 |
| `audit:export` | 审计日志导出 | 导出审计日志 |

## 5. 数据库需要修改的内容

### 5.1 `permissions` 表新增数据

后端需要把第 4 章全部权限点写入 `permissions` 表。建议新建迁移：

```text
migrations/000010_fine_grained_permissions.up.sql
migrations/000010_fine_grained_permissions.down.sql
```

示例 SQL：

```sql
INSERT INTO permissions (perm_code, perm_name) VALUES
('engine:main:read', '主机页面查看'),
('engine:system:read', '机舱系统页面查看'),
('navigation:read', '导航页面查看'),
('chart:read', '海图页面查看'),
('alarm:event:read', '报警事件查看'),
('alarm:event:ack', '报警确认'),
('alarm:event:reset', '报警复位'),
('alarm:rule:read', '报警规则查看'),
('alarm:rule:update', '报警规则维护'),
('trend:read', '趋势查询'),
('trend:export', '趋势导出'),
('quality:read', '数据质量查看'),
('ingest:telemetry:write', '遥测数据接入'),
('ingest:batch:read', '接入批次查看'),
('config:point-table:read', '点表查看'),
('config:point-table:update', '点表编辑'),
('config:point-table:import', '点表导入'),
('config:point-table:export', '点表导出'),
('config:point-table:validate', '点表校验'),
('config:point-table:apply', '点表应用'),
('config:point-table:rollback', '点表回滚'),
('user:read', '用户查看'),
('user:create', '用户创建'),
('user:update', '用户编辑'),
('user:disable', '用户停用'),
('user:password-reset', '重置用户密码'),
('role:read', '角色查看'),
('role:create', '角色创建'),
('role:update', '角色编辑'),
('role:delete', '角色删除'),
('report:read', '报告查看'),
('report:create', '报告创建'),
('report:export', '报告导出'),
('audit:read', '审计日志查看'),
('audit:export', '审计日志导出')
ON CONFLICT (perm_code) DO UPDATE SET perm_name = EXCLUDED.perm_name;
```

### 5.2 内置角色权限迁移

需要更新 `role_permissions`。建议保留旧权限，同时给内置角色补齐新权限。

`ADMIN`：

```text
全部新权限 + 旧权限
```

`OPERATOR` 建议：

```text
engine:main:read
engine:system:read
navigation:read
chart:read
alarm:event:read
alarm:event:ack
alarm:event:reset
trend:read
quality:read
```

`VIEWER` 建议：

```text
engine:main:read
engine:system:read
navigation:read
chart:read
alarm:event:read
trend:read
quality:read
```

如果暂时不希望 viewer 看配置页，不要给 `config:*`。

### 5.3 增加数据范围 Scope

权限只表示“能做什么”，还需要控制“能看哪条船、哪台机、哪个系统”。建议新增角色级 Scope，必要时再加用户级 Scope 覆盖。

推荐表结构：

```sql
CREATE TABLE IF NOT EXISTS role_scopes (
    role_code TEXT NOT NULL REFERENCES roles(role_code) ON DELETE CASCADE,
    scope_type TEXT NOT NULL,
    scope_value TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (role_code, scope_type, scope_value)
);
```

`scope_type` 建议枚举：

```text
vessel
engine
system
data_level
```

示例：

```sql
INSERT INTO role_scopes (role_code, scope_type, scope_value) VALUES
('CHIEF_ENGINEER', 'vessel', 'MHM-TierIII-Demo'),
('CHIEF_ENGINEER', 'engine', 'CMMS01'),
('CHIEF_ENGINEER', 'engine', 'CMMS02'),
('CHIEF_ENGINEER', 'system', 'engine-system');
```

登录和 `/auth/me` 建议返回：

```json
{
  "permissions": ["engine:main:read", "alarm:event:read"],
  "scope": {
    "vessels": ["MHM-TierIII-Demo"],
    "engines": ["CMMS01", "CMMS02"],
    "systems": ["main-engine", "engine-system"],
    "dataLevel": "operation"
  }
}
```

## 6. 后端接口需要修改的内容

### 6.1 登录和当前用户接口

需要修改：

```http
POST /api/v1/auth/login
GET  /api/v1/auth/me
```

要求：

1. 返回完整新权限点。
2. 短期可同时返回旧权限点。
3. 返回 scope。
4. 角色权限变化后，在线用户下一次请求应立即生效。

示例响应：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "accessToken": "jwt",
    "expiresIn": 7200,
    "user": {
      "userId": "user-001",
      "username": "admin",
      "displayName": "系统管理员",
      "roles": ["ADMIN"],
      "permissions": [
        "engine:main:read",
        "engine:system:read",
        "navigation:read",
        "chart:read",
        "alarm:event:read",
        "alarm:event:ack",
        "alarm:event:reset"
      ],
      "scope": {
        "vessels": ["*"],
        "engines": ["*"],
        "systems": ["*"],
        "dataLevel": "security"
      }
    }
  }
}
```

### 6.2 权限列表接口

需要修改：

```http
GET /api/v1/permissions
```

要求：

1. 返回第 4 章全部新权限点。
2. 返回旧权限点用于兼容时，可以加 `deprecated: true`。
3. 建议增加分组字段，方便前端展示。

推荐响应：

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "permCode": "engine:main:read",
      "permName": "主机页面查看",
      "groupCode": "monitoring",
      "groupName": "监控页面",
      "deprecated": false
    }
  ]
}
```

当前前端只强依赖 `permCode` 和 `permName`，新增字段不会破坏前端。

### 6.3 角色接口

需要修改：

```http
GET    /api/v1/roles
POST   /api/v1/roles
PATCH  /api/v1/roles/{roleCode}
DELETE /api/v1/roles/{roleCode}
```

接口鉴权：

| 接口 | 需要权限 |
| --- | --- |
| `GET /roles` | `role:read` |
| `POST /roles` | `role:create` |
| `PATCH /roles/{roleCode}` | `role:update` |
| `DELETE /roles/{roleCode}` | `role:delete` |
| `GET /permissions` | `role:read` |

角色创建/编辑请求可以保持现有结构：

```json
{
  "roleCode": "CHIEF_ENGINEER",
  "roleName": "轮机长",
  "permCodes": ["engine:main:read", "alarm:event:ack"]
}
```

后端需要允许新权限点，否则前端会收到 `unknown permission`。

### 6.4 用户接口

需要修改：

```http
GET   /api/v1/users
POST  /api/v1/users
GET   /api/v1/users/{userId}
PATCH /api/v1/users/{userId}
POST  /api/v1/users/{userId}/reset-password
```

接口鉴权：

| 接口 | 需要权限 |
| --- | --- |
| `GET /users` | `user:read` |
| `GET /users/{userId}` | `user:read` |
| `POST /users` | `user:create` |
| `PATCH /users/{userId}` 修改普通字段 | `user:update` |
| `PATCH /users/{userId}` 修改 enabled | `user:disable` |
| `POST /users/{userId}/reset-password` | `user:password-reset` |

建议 `PATCH /users/{userId}` 根据请求字段做精确鉴权：

```json
{
  "displayName": "轮机长",
  "roles": ["CHIEF_ENGINEER"]
}
```

需要 `user:update`。

```json
{
  "enabled": false
}
```

需要 `user:disable`。

如果一次请求同时修改普通字段和 enabled，需要两个权限都满足。

### 6.5 页面聚合接口

当前前端主要使用页面聚合接口。后端需要按新权限做鉴权。

| 接口 | 需要权限 |
| --- | --- |
| `GET /api/v1/vessels/{vesselId}/engines` | `engine:main:read` 或 `engine:system:read` |
| `GET /api/v1/vessels/{vesselId}/realtime` | 根据返回内容检查 `engine:main:read`、`engine:system:read`、`navigation:read` |
| `GET /api/v1/vessels/{vesselId}/system-status` | `engine:system:read` |
| `GET /api/v1/vessels/{vesselId}/alarms` | `alarm:event:read` |
| `POST /api/v1/vessels/{vesselId}/alarms/{alarmId}/acknowledge` | `alarm:event:ack` |
| `POST /api/v1/alarms/{alarmId}/reset` | `alarm:event:reset` |

所有带 `vesselId` 的接口还要检查 scope：

```text
principal.scope.vessels 包含 vesselId 或 *
```

所有带 `engineCode` 的接口还要检查：

```text
principal.scope.engines 包含 engineCode 或 *
```

### 6.6 趋势接口

需要修改：

```http
GET  /api/v1/trends/tags
POST /api/v1/trends/query
```

鉴权：

```text
trend:read
```

如果后续做导出：

```text
trend:export
```

Scope：

1. `engineCode` 必须在用户可访问范围内。
2. 查询多个 tag 时，tag 所属 engine 也要检查。

### 6.7 点表和 MODBUS 配置接口

当前前端配置页需要后端最终提供以下接口：

| 接口 | 权限 |
| --- | --- |
| `GET /api/v1/vessels/{vesselId}/devices/{deviceId}/point-table-versions` | `config:point-table:read` |
| `GET /api/v1/vessels/{vesselId}/devices/{deviceId}/point-tables/{version}` | `config:point-table:read` |
| `POST /api/v1/vessels/{vesselId}/devices/{deviceId}/point-tables` | `config:point-table:update` 或 `config:point-table:import` |
| `POST /api/v1/vessels/{vesselId}/devices/{deviceId}/point-test` | `config:point-table:validate` |
| `POST /api/v1/vessels/{vesselId}/devices/{deviceId}/point-tables/{version}/validate` | `config:point-table:validate` |
| `POST /api/v1/vessels/{vesselId}/devices/{deviceId}/point-tables/{version}/apply` | `config:point-table:apply` |
| `POST /api/v1/vessels/{vesselId}/devices/{deviceId}/point-tables/{version}/rollback` | `config:point-table:rollback` |

高风险接口：

```text
apply
rollback
```

必须写审计日志，建议后续支持审批。

### 6.8 遥测接入接口

需要修改：

```http
POST /api/v1/ingest/telemetry
```

鉴权：

```text
ingest:telemetry:write
```

如果新增接入批次查询：

```http
GET /api/v1/ingest/batches
GET /api/v1/ingest/batches/{batchId}
```

鉴权：

```text
ingest:batch:read
```

### 6.9 报告与审计接口

报告：

| 接口 | 权限 |
| --- | --- |
| `GET /api/v1/reports/{jobId}` | `report:read` |
| `POST /api/v1/reports` | `report:create` |
| `GET /api/v1/reports/{jobId}/download` | `report:export` |

审计：

| 接口 | 权限 |
| --- | --- |
| `GET /api/v1/audit-logs` | `audit:read` |
| `GET /api/v1/audit-logs/export` | `audit:export` |

## 7. 后端中间件需要修改的内容

建议实现两个层次：

### 7.1 权限鉴权

现有 `requirePermission(authSvc, "xxx")` 可以继续使用，但需要支持：

1. 单权限检查。
2. 多权限任一满足。
3. 多权限全部满足。

建议函数：

```go
requirePermission(authSvc, "role:read")
requireAnyPermission(authSvc, "engine:main:read", "engine:system:read")
requireAllPermissions(authSvc, "user:update", "user:disable")
```

### 7.2 Scope 鉴权

建议新增：

```go
requireVesselScope(authSvc, "vesselId")
requireEngineScope(authSvc, "engineCode")
```

逻辑：

```text
如果 scope 为 *，放行
如果 scope 包含请求中的 vesselId / engineCode，放行
否则返回 40301
```

返回错误建议：

```json
{
  "code": 40301,
  "message": "permission denied",
  "traceId": "req-xxx"
}
```

## 8. 审计日志需要补齐的内容

以下操作必须写审计：

| 操作 | action 建议 |
| --- | --- |
| 创建用户 | `user:create` |
| 修改用户 | `user:update` |
| 停用/启用用户 | `user:disable` |
| 重置密码 | `user:password-reset` |
| 创建角色 | `role:create` |
| 修改角色权限 | `role:update` |
| 删除角色 | `role:delete` |
| 报警确认 | `alarm:event:ack` |
| 报警复位 | `alarm:event:reset` |
| 点表导入 | `config:point-table:import` |
| 点表编辑 | `config:point-table:update` |
| 点表校验 | `config:point-table:validate` |
| 点表应用 | `config:point-table:apply` |
| 点表回滚 | `config:point-table:rollback` |
| 趋势导出 | `trend:export` |
| 报告导出 | `report:export` |
| 审计导出 | `audit:export` |

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

## 9. 兼容策略

为了避免前后端不同步造成权限丢失，建议分两阶段：

### 阶段一：兼容发布

1. 后端新增新权限点。
2. 保留旧权限点。
3. 登录和 `/auth/me` 可同时返回新旧权限。
4. 内置角色同时拥有旧权限和新权限。
5. 前端会优先使用新权限，旧权限仍可兼容。

### 阶段二：清理旧权限

前后端稳定后再考虑：

1. 停止给新角色分配旧权限。
2. 后端保留旧权限识别一段时间。
3. 最后迁移历史角色并移除旧权限。

不建议现在直接删除旧权限。

## 10. 默认角色建议

### 10.1 `ADMIN` 系统超级管理员

权限：

```text
全部权限
```

Scope：

```text
vessels=*
engines=*
systems=*
dataLevel=security
```

### 10.2 `OPERATOR` 操作员

权限：

```text
engine:main:read
engine:system:read
navigation:read
chart:read
alarm:event:read
alarm:event:ack
alarm:event:reset
trend:read
quality:read
```

### 10.3 `VIEWER` 只读用户

权限：

```text
engine:main:read
engine:system:read
navigation:read
chart:read
alarm:event:read
trend:read
quality:read
```

### 10.4 可选专业角色

| 角色编码 | 角色名称 | 权限方向 |
| --- | --- | --- |
| `FLEET_MANAGER` | 船管公司管理员 | 多船查看、用户查看、报告、审计 |
| `SHORE_MONITOR` | 岸端监控中心 | 多船监控、报警确认、趋势查看 |
| `TECH_SUPERVISOR` | 机务主管 | 主机、机舱、趋势、报告、点表审核 |
| `CHIEF_ENGINEER` | 轮机长 | 本船机舱、报警确认/复位、点表校验 |
| `ENGINEER` | 轮机员 | 本船机舱查看、报警确认 |
| `ELECTRICIAN` | 电气员 | 电力系统、趋势查看 |
| `CAPTAIN` | 船长 | 导航、海图、报警总览 |
| `COMM_ENGINEER` | 通信采集工程师 | 点表配置、导入导出、遥测接入 |
| `DATA_ENGINEER` | 数据工程师 | 趋势、质量、接入批次、导出 |
| `AUDITOR` | 审计员 | 用户只读、角色只读、审计只读 |

## 11. 前端对后端的接口要求

前端目前已经按以下逻辑工作：

1. 菜单显示按 `permissions` 数组判断。
2. 按钮显示/禁用按 `permissions` 数组判断。
3. 角色编辑页权限列表来自 `GET /permissions`。
4. 如果 `GET /permissions` 没返回某个新权限，前端会显示“待后端上线”，但不能保存。
5. 创建/编辑角色时，前端只会提交后端返回的权限点。

因此后端要让前端真正可配置细权限，必须保证：

```text
GET /api/v1/permissions 返回所有新权限点
POST /api/v1/roles 接受所有新权限点
PATCH /api/v1/roles/{roleCode} 接受所有新权限点
POST /api/v1/auth/login 返回用户的新权限集合
GET /api/v1/auth/me 返回用户的新权限集合
```

## 12. 后端测试用例要求

### 12.1 权限目录测试

1. `GET /permissions` 返回所有新权限点。
2. 至少包含 `engine:main:read`、`config:point-table:apply`、`role:update`。
3. 旧权限仍可存在。

### 12.2 角色管理测试

1. `role:create` 可以创建带新权限的角色。
2. `role:update` 可以更新新权限集合。
3. 不存在的权限返回 `42201`。
4. 没有 `role:create` 的用户创建角色返回 `40301`。
5. 没有 `role:update` 的用户修改角色返回 `40301`。
6. 没有 `role:delete` 的用户删除角色返回 `40301`。

### 12.3 用户管理测试

1. 没有 `user:create` 不能创建用户。
2. 没有 `user:update` 不能修改用户基本信息。
3. 没有 `user:disable` 不能停用用户。
4. 没有 `user:password-reset` 不能重置密码。
5. 最后一个 ADMIN 保护逻辑仍然有效。

### 12.4 页面接口测试

1. 没有 `engine:main:read` 不能访问主机数据。
2. 没有 `engine:system:read` 不能访问机舱系统数据。
3. 没有 `navigation:read` 不能访问导航数据。
4. 没有 `alarm:event:read` 不能访问报警列表。
5. 没有 `alarm:event:ack` 不能确认报警。
6. 没有 `alarm:event:reset` 不能复位报警。

### 12.5 Scope 测试

1. 用户 scope 不包含 `vesselId` 时，访问该船数据返回 `40301`。
2. 用户 scope 不包含 `engineCode` 时，查询该机组趋势返回 `40301`。
3. `*` scope 可以访问全部。

### 12.6 审计测试

1. 修改角色权限写审计。
2. 点表应用写审计。
3. 报警确认/复位写审计。
4. 趋势导出写审计。

## 13. 建议后端开发顺序

建议按以下顺序做，风险最低：

1. 新增权限 seed 和迁移。
2. 更新内置角色权限。
3. 修改 `GET /permissions`，让前端先能看到全部权限点。
4. 修改角色创建/编辑校验，允许保存新权限。
5. 修改登录和 `/auth/me`，返回新权限。
6. 替换接口鉴权点。
7. 增加 Scope。
8. 补齐审计日志。
9. 补测试。

## 14. 验收标准

后端完成后，前端应满足：

1. 用户管理 -> 角色管理中，所有细权限不再显示“待后端上线”。
2. 新建角色可以勾选 `engine:main:read`、`alarm:event:ack`、`config:point-table:apply` 等新权限并保存成功。
3. 用新角色账号登录后，菜单和按钮严格按新权限显示。
4. 没有配置页权限的账号看不到 Configuration。
5. 只有 `alarm:event:ack` 的账号只能确认，不能复位。
6. 只有 `config:point-table:read` 的账号能看点表，不能导入、应用、回滚。
7. 所有被前端隐藏或禁用的操作，直接调用接口也必须返回 `40301`。

## 15. 对前端无破坏的要求

后端返回结构应保持：

```json
{
  "code": 0,
  "message": "success",
  "data": {},
  "traceId": "req-xxx"
}
```

前端强依赖字段：

```text
login.data.accessToken
login.data.user.permissions
me.data.permissions 或 me.data.user.permissions，按现有后端结构保持
permissions[].permCode
permissions[].permName
roles[].permissions[].permCode
roles[].permissions[].permName
```

可以新增字段，但不要删除现有字段。

## 16. 结论

后端当前只返回 9 个权限点，所以前端只能把完整细权限显示为“待后端上线”。后端完成本文件改造后，前端角色管理页会自动解锁全部细权限，无需再次修改前端权限目录。
