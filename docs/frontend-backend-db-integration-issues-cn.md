# 前后端与数据库联调问题清单

版本：v1  
日期：2026-07-06  
涉及项目：

- 前端：`/Users/研究生学习/船机/marine-dashboard`
- 后端：`/Users/研究生学习/船机/ecust-main`
- 数据库：PostgreSQL，后端 `telemetry_points`、`tags`、`alarms`、`tag_mappings` 等表

## 1. 当前结论

当前项目不是“完全不能联动”。后端已经具备 PostgreSQL 基础表、测点表、实时数据表、告警表和数据接入接口，也能按 `tagCode` 写入和查询数据。

主要问题在于：

1. 前端定义的页面级 API 与后端当前实际暴露的页面接口不完全一致。
2. 后端返回给前端的字段仍以 `rpm`、`oilPressure` 等 camelCase 为主，尚未完全按 `副本Historical Information.xlsx` 原始字段名输出。
3. 后端数据接入接口当前要求上传规范 `tagCode`，没有把 Excel 原字段名自动映射到数据库测点。
4. 单位换算、趋势查询时间范围、点表配置、Nginx `/api` 代理还没有形成完整联调闭环。

正式联调目标应该是：

```text
船端采集服务 -> 后端 ingest API -> PostgreSQL -> 后端页面 API -> 前端 UI
```

前端页面不直接读 MODBUS/RS485，也不直接访问 PostgreSQL。

## 2. 前端需要修改的问题

### 2.1 关闭本地虚拟波动，启用真实后端数据

当前前端 `.env`：

```env
REACT_APP_API_BASE_URL=/api/v1
REACT_APP_DATA_SOURCE=backend
REACT_APP_DEMO_FLUCTUATION=true
REACT_APP_VESSEL_ID=MHM-TierIII-Demo
```

问题：

- `REACT_APP_DEMO_FLUCTUATION=true` 时，页面仍使用本地虚拟实时波动。
- 即使后端 API 配好了，页面也可能继续显示假数据。

需要修改：

```env
REACT_APP_DEMO_FLUCTUATION=false
```

正式联调环境建议：

```env
REACT_APP_API_BASE_URL=/api/v1
REACT_APP_DATA_SOURCE=backend
REACT_APP_DEMO_FLUCTUATION=false
REACT_APP_VESSEL_ID=MHM-TierIII-Demo
```

如果前后端不同域部署：

```env
REACT_APP_API_BASE_URL=http://后端服务器IP:8080/api/v1
REACT_APP_DATA_SOURCE=backend
REACT_APP_DEMO_FLUCTUATION=false
REACT_APP_VESSEL_ID=MHM-TierIII-Demo
```

### 2.2 前端请求的接口需要与后端实际路由对齐

前端当前定义的页面接口包括：

```http
GET  /api/v1/dashboard/snapshot
GET  /api/v1/vessels/{vesselId}/realtime
GET  /api/v1/vessels/{vesselId}/engines
GET  /api/v1/vessels/{vesselId}/navigation
GET  /api/v1/vessels/{vesselId}/alarms?includeHistory=true
POST /api/v1/vessels/{vesselId}/alarms/{alarmId}/acknowledge
GET  /api/v1/vessels/{vesselId}/system-status
GET  /api/v1/vessels/{vesselId}/trend
```

问题：

- 后端目前只实现了其中一部分页面适配接口。
- `realtime`、`navigation`、`system-status`、`dashboard/snapshot` 请求目前没有对应后端路由。

前端侧需要做：

1. 保留统一接口定义，不再在页面里散写 URL。
2. 等后端补齐接口后，逐页验证接口是否返回真实 `source=DB`。
3. 接口缺失期间，页面需要明确显示“后端接口未接入”或降级，不要误认为数据已联通。

### 2.3 Engine 数据适配层仍需保留 Historical 原字段优先读取

前端已经支持读取 Historical 原字段名，例如：

```text
CMMS01_Lube Oil Press
CMMS01_Engine Speed
CMMS01_Fuel CMMSlivery Pressure
CMMS01_Exhaust Temp. RB 
```

需要继续保持：

1. 优先读取 Excel 原字段名。
2. 兼容后端旧字段 `rpm`、`oilPressure`、`coolantTemp` 等。
3. 等后端完全改成 Historical 原字段后，再逐步减少旧字段依赖。

注意：

- 原表中的错误拼写必须保留，例如 `CMMSlivery`、`CylinCMMSr`、`Diferential`。
- 原表中的尾部空格必须保留，例如 `CMMS01_Exhaust Temp. RB `、`CMMS01_Overspeed Shutdown `。

### 2.4 趋势页面需要改为真正按日期和参数请求后端

当前趋势页面主要按：

```http
GET /api/v1/vessels/{vesselId}/trend?hours=8760&points=730
```

问题：

- 页面上的“起始日期”“显示长度”需求还没有完全转换为后端查询参数。
- 后端也尚未支持 `start/end/metrics/points`。
- 如果后端 seed 数据时间不在页面选择范围内，趋势图会显示空白。

前端需要修改为：

```http
GET /api/v1/vessels/{vesselId}/trend?start=2026-01-01T00:00:00+08:00&end=2026-03-31T23:59:59+08:00&metrics=CMMS01_Engine Speed,CMMS01_Lube Oil Press&points=730
```

页面逻辑需要：

1. 日期选择器输出 `start/end`。
2. 参数配置按钮输出 `metrics`。
3. 图表按后端返回的 `timestamp` 对齐节点。
4. 多曲线重叠时以同一个时间戳作为 x 轴。
5. 如果无数据，明确提示“该时间范围无数据”。

### 2.5 配置页面目前还没有真实后端闭环

配置页面当前支持导入、导出、本地校验和本地状态变化，但真实后端接口还没有接通。

需要接入的接口：

```http
GET  /api/v1/vessels/{vesselId}/devices/{deviceId}/point-table-versions
GET  /api/v1/vessels/{vesselId}/devices/{deviceId}/point-tables/{version}
POST /api/v1/vessels/{vesselId}/devices/{deviceId}/point-tables
POST /api/v1/vessels/{vesselId}/devices/{deviceId}/point-test
POST /api/v1/vessels/{vesselId}/devices/{deviceId}/point-tables/{version}/validate
POST /api/v1/vessels/{vesselId}/devices/{deviceId}/point-tables/{version}/apply
POST /api/v1/vessels/{vesselId}/devices/{deviceId}/point-tables/{version}/rollback
```

前端需要修改：

1. “保存草稿”调用后端保存点表。
2. “校验”调用后端校验接口，不再只用本地 `setTimeout`。
3. “应用版本”调用后端 apply 接口，并显示后端返回结果。
4. “回滚”调用后端 rollback 接口。
5. “点位测试”调用后端实时测试接口，显示真实 `lastValue/quality/error`。

### 2.6 前端部署 Nginx 需要增加 `/api` 代理

当前前端部署配置主要服务静态文件，没有把 `/api/v1` 转发到后端。

如果前端访问地址是：

```text
http://8.130.14.1
```

且后端运行在同一台服务器的 `8080` 端口，则 Nginx 需要增加：

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8080/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

否则前端请求 `/api/v1/...` 会打到静态站点本身，无法到达 Go 后端。

## 3. 后端需要修改的问题

### 3.1 补齐前端页面级 API 路由

后端当前页面适配接口已有：

```http
GET  /api/v1/vessels/{vesselId}/engines
GET  /api/v1/vessels/{vesselId}/alarms
POST /api/v1/vessels/{vesselId}/alarms/{alarmId}/acknowledge
GET  /api/v1/vessels/{vesselId}/trend
```

还需要补齐：

```http
GET /api/v1/dashboard/snapshot
GET /api/v1/vessels/{vesselId}/realtime
GET /api/v1/vessels/{vesselId}/navigation
GET /api/v1/vessels/{vesselId}/system-status
```

建议后端新增 handler：

1. `PageDashboardSnapshot`
2. `PageRealtime`
3. `PageNavigation`
4. `PageSystemStatus`

其中导航、天气、姿态、船位等不属于主机 46 个参数，可以先返回独立 mock 或空结构，但接口要先稳定。

### 3.2 发动机接口字段名必须对齐 Historical Excel 原字段

当前后端返回类似：

```json
{
  "engines": {
    "diesel1": {
      "rpm": 750,
      "oilPressure": 4.18,
      "coolantTemp": 82.5
    }
  }
}
```

要求改为优先返回：

```json
{
  "engines": {
    "CMMS01": {
      "Source_Tag": "2026-07-06T10:15:00+08:00",
      "CMMS01_Lube Oil Press": 4.18,
      "CMMS01_Coolant Temperature": 73,
      "CMMS01_Lubricating Oil Temperature": 80,
      "CMMS01_Engine Speed": 850
    }
  }
}
```

推荐做法：

1. 保留内部 `tagCode`，例如 `CMMS01_LUBE_OIL_PRESS`。
2. 查询 `tags.source_tag`，例如 `CMMS01_Lube Oil Press`。
3. 页面 API 输出时，把 `source_tag` 作为 JSON 字段名。
4. 同时保留旧字段 `rpm/oilPressure` 一段时间，避免前端兼容逻辑立即失效。

### 3.3 `engines` 的 key 建议改为 CMMS 编号

当前后端使用：

```text
diesel1 -> CMMS01
diesel2 -> CMMS02
aux1    -> CMMS03
aux2    -> CMMS04
```

问题：

- 前端已经兼容，但接口标准希望以 Historical sheet 名作为 key。
- 后续通信、数据库、趋势、报警都以 `CMMS01` 这种编号追踪更清晰。

建议返回：

```json
{
  "engines": {
    "CMMS01": {},
    "CMMS02": {},
    "CMMS03": {},
    "CMMS04": {}
  }
}
```

如需兼容前端旧页面，可额外返回：

```json
{
  "engineAliases": {
    "diesel1": "CMMS01",
    "diesel2": "CMMS02",
    "aux1": "CMMS03",
    "aux2": "CMMS04"
  }
}
```

### 3.4 数据接入接口需要支持 Excel 原字段名映射

当前后端 ingest 接口：

```http
POST /api/v1/ingest/telemetry
```

当前要求 payload：

```json
{
  "source": "REALTIME_ADAPTER",
  "points": [
    {
      "engineCode": "CMMS01",
      "tagCode": "CMMS01_LUBE_OIL_PRESS",
      "sourceField": "Lube Oil Press",
      "timestamp": "2026-07-06T10:15:00+08:00",
      "value": 4.18,
      "quality": "GOOD"
    }
  ]
}
```

问题：

- 通信采集人员可能更自然地上传 `CMMS01_Lube Oil Press`。
- 后端目前不会自动把 `sourceField` 或 `source_tag` 映射到 `tagCode`。
- `tag_mappings` 表已预留，但当前 adapter 还没有使用。

后端需要支持两种方式之一。

方式 A：通信端必须上传规范 `tagCode`。

```json
{
  "engineCode": "CMMS01",
  "tagCode": "CMMS01_LUBE_OIL_PRESS",
  "timestamp": "2026-07-06T10:15:00+08:00",
  "value": 4.18
}
```

方式 B：后端支持 Excel 原字段名自动映射。

```json
{
  "engineCode": "CMMS01",
  "field": "CMMS01_Lube Oil Press",
  "timestamp": "2026-07-06T10:15:00+08:00",
  "value": 4.18
}
```

推荐方式 B，因为它更符合“接口字段名与主表完全一致”的要求。

需要实现：

1. 根据 `field/sourceField/source_tag` 查询 `tags.source_tag`。
2. 找到对应 `tag_code`。
3. 写入 `telemetry_points`。
4. 找不到映射时返回明确错误。

### 3.5 单位换算必须确定在后端还是采集端

主表单位与 UI 单位存在换算：

```text
1kPa -> bar，bar = kPa / 100
0.1V -> V，V = raw * 0.1
1rpm -> rpm，不换算
1℃ -> °C，不换算
```

当前后端只是把 `value` 原样写入数据库。

必须明确：

1. 如果通信采集端上传原始 MODBUS 值，后端 ingest 必须根据点表做 `scale/offset` 换算。
2. 如果通信采集端已经换算成 UI 单位，后端不能再次换算。

建议方案：

- 点表中保存 `scale`、`offset`、`rawUnit`、`displayUnit`。
- 通信端上传 `rawValue`。
- 后端 ingest 计算 `value`。
- 数据库同时可选保存 `raw_value` 和 `value`，便于追溯。

### 3.6 趋势接口需要支持日期范围和参数列表

当前后端页面趋势接口只解析 `hours`，并固定取部分 tag。

需要支持：

```http
GET /api/v1/vessels/{vesselId}/trend?engineCode=CMMS01&start=2026-01-01T00:00:00+08:00&end=2026-03-31T23:59:59+08:00&metrics=CMMS01_Engine Speed,CMMS01_Lube Oil Press&points=730
```

后端需要：

1. 解析 `start/end`。
2. 解析 `metrics`，支持 Historical 原字段名。
3. 将 Historical 原字段名映射为 `tag_code`。
4. 查询 `telemetry_points`。
5. 按 `timestamp` 合并多条曲线。
6. 返回字段名仍使用 Historical 原字段名。

推荐返回：

```json
{
  "metrics": [
    "CMMS01_Engine Speed",
    "CMMS01_Lube Oil Press"
  ],
  "points": [
    {
      "timestamp": "2026-07-06T10:15:00+08:00",
      "CMMS01_Engine Speed": 850,
      "CMMS01_Lube Oil Press": 4.18
    }
  ]
}
```

### 3.7 点表配置 API 和数据库表需要补齐

前端配置页面需要后端支持点表版本管理。

后端需要新增或确认这些能力：

1. 点表版本表：保存版本号、设备 ID、船舶 ID、状态、创建时间、应用时间。
2. 点表明细表：保存点名、数据类型、MODBUS 地址、bit、scale、offset、单位、启用状态。
3. 点位测试接口：根据点表配置临时读取或返回最近值。
4. 校验接口：检查地址重复、数据类型错误、bit 越界、必填字段缺失。
5. 应用接口：把版本状态改为 active。
6. 回滚接口：恢复上一版本 active。

建议接口保持：

```http
GET  /api/v1/vessels/{vesselId}/devices/{deviceId}/point-table-versions
GET  /api/v1/vessels/{vesselId}/devices/{deviceId}/point-tables/{version}
POST /api/v1/vessels/{vesselId}/devices/{deviceId}/point-tables
POST /api/v1/vessels/{vesselId}/devices/{deviceId}/point-test
POST /api/v1/vessels/{vesselId}/devices/{deviceId}/point-tables/{version}/validate
POST /api/v1/vessels/{vesselId}/devices/{deviceId}/point-tables/{version}/apply
POST /api/v1/vessels/{vesselId}/devices/{deviceId}/point-tables/{version}/rollback
```

### 3.8 告警逻辑需要确认边界

根据当前方案：

- 船端报警信号通过数据通信上传。
- UI 不做阈值判断。
- 前端只展示报警 bit 或后端生成的报警事件。

后端目前有告警规则引擎，但如果项目当前决定“不在 UI/后端做报警阈值判断”，需要明确：

1. 船端上传报警 bit。
2. 后端把 bit 转换为报警事件。
3. 前端展示 `active/history`。
4. 前端确认报警只改后端事件状态，不反写船端控制位。

### 3.9 数据库需要补充原始字段追溯能力

当前数据库核心表：

```text
tags(tag_code, source_tag, ...)
telemetry_points(timestamp, engine_code, tag_code, value, text_value, quality, source)
tag_mappings(source, source_field, engine_code, tag_code)
```

现有结构可以支撑规范测点写入，但建议补充：

1. `telemetry_points.raw_value`：保存原始寄存器值。
2. `telemetry_points.source_field`：保存上传时使用的原字段名。
3. `telemetry_points.received_at`：保存服务器接收时间。
4. `ingest_batches.raw_payload` 或对象存储引用：方便排查通信问题。
5. 点表版本相关表：支撑配置页面。

这些不是首轮必须，但对现场联调排查很有用。

## 4. 建议修改优先级

### P0：不改会阻塞前后端联调

1. 前端关闭 `REACT_APP_DEMO_FLUCTUATION`。
2. 后端补齐 `/vessels/{vesselId}/realtime`、`/navigation`、`/system-status`。
3. 前端部署 Nginx 增加 `/api` 反向代理。
4. 后端明确 ingest 上传格式，通信端按该格式上传。
5. 后端返回 `source=DB`，前端确认页面实际读取后端数据。

### P1：不改会导致字段验收不过

1. 后端发动机接口输出 Historical Excel 原字段名。
2. 后端 `engines` key 改为 `CMMS01/CMMS02/CMMS03/CMMS04` 或同时支持。
3. 后端修正尾部空格字段，例如 `CMMS01_Exhaust Temp. RB `。
4. 后端支持 `source_tag` 到 `tag_code` 的映射。
5. 单位换算责任确认并实现。

### P2：不改会影响完整功能

1. 趋势接口支持 `start/end/metrics/points`。
2. 配置页面接真实点表版本 API。
3. 点位测试接真实后端。
4. 告警 bit 到报警事件的转换规范化。
5. 数据库补充原始值、接收时间、原始字段追溯。

## 5. 三人分工建议

### 通信采集负责人

负责：

1. 从 MODBUS/RS485 读取原始数据。
2. 按统一 JSON 格式上传到后端 ingest。
3. 确认上传的是原始值还是换算后的 UI 值。
4. 报警 bit 随同普通测点一起上传。

必须与后端确认：

```text
上传字段用 tagCode 还是 Historical 原字段名
上传 value 是 rawValue 还是 display value
时间戳使用船端采集时间还是服务器接收时间
```

### 后端与数据库负责人

负责：

1. PostgreSQL 表结构。
2. ingest API。
3. Historical 原字段名映射。
4. 单位换算。
5. 页面 API。
6. 趋势查询。
7. 点表配置 API。

### 前端负责人

负责：

1. 关闭本地假数据。
2. 页面统一调用后端 API。
3. Historical 原字段名适配。
4. 趋势参数配置。
5. 配置页面接真实 API。
6. 联调时显示接口错误和无数据状态。

## 6. 联调验收检查项

正式联调时逐项检查：

1. 浏览器 Network 中页面请求命中 `/api/v1/...`。
2. API 响应顶层 `source` 为 `DB`。
3. `GET /vessels/{vesselId}/engines` 返回 4 台机组。
4. 每台机组包含 46 个 Historical 原字段名。
5. 任意修改数据库最新值后，前端刷新能显示新值。
6. 通信端上传一条新数据后，`telemetry_points` 有记录。
7. 前端实时页面显示新上传数据。
8. 趋势页面能按时间范围查询到数据。
9. 报警 bit 上传后，报警页面出现对应报警事件。
10. 配置页面保存、校验、应用、回滚均调用后端接口。
