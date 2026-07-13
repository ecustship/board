# 岸端兼容接口前端读取流程与标准

日期：2026-07-08

依据文档：`CLOUD_SHORE_DB_FRONTEND_CHAIN_CN_2026-07-03.md`

## 1. 这套方案的核心结论

这套方案中，前端仍然是通过 HTTP API 读取数据。

前端不直接连接：

- PostgreSQL / TimescaleDB
- MQTTs
- CoAP
- MODBUS / RS485
- 船端采集程序内部数据

前端只请求一个由静态服务代理出来的接口：

```http
GET /api/ship/latest-samples
```

该请求会被前端静态服务代理到岸端接收服务：

```http
GET http://127.0.0.1:8090/api/latest-samples
```

所以实际链路是：

```text
前端页面
  -> GET /api/ship/latest-samples
  -> 前端静态服务代理
  -> 岸端接收服务 8090
  -> PostgreSQL ship_ingest.sample_values
  -> 返回最新采样点 JSON
  -> 前端显示
```

## 2. 整体数据流程

完整链路如下：

```text
船端采集服务 8080
  -> MQTTs / CoAP 上传
  -> 岸端接收服务 ShoreFrameReceiver 8090
  -> PostgreSQL / TimescaleDB
  -> 岸端兼容 API
  -> 前端静态服务 3001
  -> 浏览器页面
```

各部分职责：

| 模块 | 端口 | 作用 |
| --- | --- | --- |
| 船端采集服务 | `8080` | 从船端设备采集数据，并通过 MQTTs / CoAP 上传 |
| MQTTs Broker | `8883` | 接收船端 MQTTs 上传 |
| CoAP 接收 | `56831/UDP` | 接收船端 CoAP 上传 |
| 岸端接收服务 | `8090` | 解密、解压、重组 payload，写入数据库，并提供兼容 API |
| PostgreSQL / TimescaleDB | `5433` | 保存接收消息和采样点 |
| 前端静态服务 | `3001` | 提供前端页面，并代理 `/api/ship/*` 请求 |

## 3. 前端请求标准

### 3.1 前端固定请求路径

前端页面只需要请求：

```http
GET /api/ship/latest-samples
```

前端不能直接请求：

```text
http://127.0.0.1:8090/api/latest-samples
```

原因：

1. 浏览器直接请求岸端地址会遇到跨域、部署地址变化等问题。
2. 前端页面应保持固定路径，部署时通过代理决定真实后端地址。
3. 将来从本地岸端切换到阿里云岸端时，前端代码不用改。

### 3.2 前端代理目标

前端静态服务通过环境变量决定 `/api/ship/*` 代理到哪里：

```text
SHIP_API_TARGET=http://127.0.0.1:8090/api/
SHORE_API_TARGET=http://127.0.0.1:8090/api/
```

代理关系：

```text
浏览器请求：
/api/ship/latest-samples

静态服务转发到：
http://127.0.0.1:8090/api/latest-samples
```

也就是说，`/api/ship/` 后面的路径会映射到岸端服务的 `/api/`。

### 3.3 前端启动示例

Windows：

```powershell
scripts\run-cloud-board-to-shore.bat
```

Linux / 阿里云 ECS：

```bash
cd board-latest
PORT=3001 \
SHIP_API_TARGET=http://127.0.0.1:8090/api/ \
SHORE_API_TARGET=http://127.0.0.1:8090/api/ \
node local-static-server.js
```

浏览器访问：

```text
http://localhost:3001
```

此时页面看到的是岸端 PostgreSQL 中的最新接收数据。

## 4. 岸端兼容 API 标准

### 4.1 最新采样点接口

前端主接口：

```http
GET /api/ship/latest-samples
```

代理后的真实接口：

```http
GET http://<shore-host>:8090/api/latest-samples
```

标准返回：

```json
{
  "hasData": true,
  "sampleCount": 192,
  "goodCount": 192,
  "badCount": 0,
  "payload": {
    "schema": "latest-sample-store.snapshot.v1",
    "vesselId": "MHM-TierIII-Demo",
    "source": "shore-postgres-ingest",
    "samples": []
  }
}
```

字段说明：

| 字段 | 类型 | 前端含义 |
| --- | --- | --- |
| `hasData` | boolean | 是否已经有可显示数据 |
| `sampleCount` | number | 本批采样点总数 |
| `goodCount` | number | 质量为正常的点数 |
| `badCount` | number | 异常或无效点数 |
| `payload.schema` | string | 数据格式版本 |
| `payload.vesselId` | string | 船舶 ID |
| `payload.source` | string | 数据来源 |
| `payload.samples` | array | 最新一批采样点 |

前端判断数据是否来自岸端 PostgreSQL，主要看：

```json
"source": "shore-postgres-ingest"
```

如果返回：

```json
"source": "modbus+nmea"
```

说明前端仍然代理到了船端本地采集服务，而不是岸端数据库。

### 4.2 健康状态接口

前端或调试页面可请求：

```http
GET /api/ship/v1/ship/health
```

代理后的真实接口：

```http
GET http://<shore-host>:8090/api/v1/ship/health
```

标准返回：

```json
{
  "schema": "ship-edge-api.health.v1",
  "available": true,
  "status": "ONLINE",
  "hasData": true,
  "sampleCount": 192,
  "goodCount": 192,
  "badCount": 0,
  "source": "shore-postgres-ingest"
}
```

前端可用它判断：

- 岸端 API 是否在线
- 数据库中是否已有接收数据
- 当前数据源是否为岸端 PostgreSQL

### 4.3 存储状态接口

调试接口：

```http
GET /api/ship/v1/ship/storage
```

代理后的真实接口：

```http
GET http://<shore-host>:8090/api/v1/ship/storage
```

标准返回：

```json
{
  "schema": "ship-edge-api.storage.v1",
  "available": true,
  "totalRecords": 2911158,
  "unsentRecords": 0,
  "sentRecords": 2911158,
  "messageRecords": 17492,
  "failedMessages": 0
}
```

该接口主要用于工程调试，页面正式显示不一定必须依赖。

### 4.4 合约接口

```http
GET /api/ship/v1/ship/contract
```

代理后的真实接口：

```http
GET http://<shore-host>:8090/api/v1/ship/contract
```

作用是确认岸端已经启用前端兼容接口。

## 5. 前端显示数据的基本规则

### 5.1 前端只展示后端给出的数据

前端职责：

1. 定时请求 `/api/ship/latest-samples`。
2. 判断接口是否可用。
3. 判断 `hasData` 是否为 `true`。
4. 读取 `payload.samples[]`。
5. 按已有页面逻辑显示点位值、质量状态、更新时间。

前端不负责：

- 解密 payload
- 解压 payload
- 重组分包
- 写数据库
- 直接查 `ship_ingest.sample_values`
- 判断 MODBUS 报警阈值
- 推断采样点质量

### 5.2 数据质量显示

前端应根据岸端返回的质量统计显示状态：

| 条件 | 前端状态 |
| --- | --- |
| 请求失败 | 离线 / API 不可用 |
| `hasData=false` | 暂无数据 |
| `badCount > 0` | 有异常点 |
| `goodCount = sampleCount` | 数据正常 |
| `payload.source=shore-postgres-ingest` | 已读取岸端数据库 |

### 5.3 刷新频率

前端可以轮询最新采样点，但不建议频率过高。

推荐：

```text
1 秒 - 5 秒请求一次 /api/ship/latest-samples
```

如果船端上传周期较长，前端刷新再快也不会产生新数据，只会增加岸端压力。

## 6. 前端联调验证标准

### 6.1 验证岸端 API 有数据

在岸端机器上执行：

```bash
curl http://127.0.0.1:8090/api/latest-samples
```

期望看到：

```text
sampleCount > 0
source = shore-postgres-ingest
```

### 6.2 验证前端代理正确

在前端机器上执行：

```bash
curl http://127.0.0.1:3001/api/ship/latest-samples
```

期望结果与岸端接口一致：

```text
sampleCount=192
goodCount=192
badCount=0
source=shore-postgres-ingest
```

如果这里失败，说明问题在前端代理或环境变量。

### 6.3 浏览器 Network 检查

打开浏览器开发者工具，检查是否存在请求：

```text
/api/ship/latest-samples
```

请求返回必须是 JSON。

如果返回 HTML，常见原因是：

1. 静态服务没有配置 `/api/ship/*` 代理。
2. Nginx 把 API 请求当成前端页面处理了。
3. 岸端 `8090` 没有启动。
4. `SHIP_API_TARGET` 配置错误。

## 7. 阿里云部署时的前端要求

如果前端部署在阿里云 ECS 上，推荐结构：

```text
Nginx 80/443
  -> 前端静态文件
  -> /api/ship/* 反向代理到 127.0.0.1:8090/api/*
```

Nginx 示例：

```nginx
location /api/ship/ {
    proxy_pass http://127.0.0.1:8090/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

注意：

1. `8090` 不建议公网开放，前端服务器本机或内网访问即可。
2. 公网只开放 `80/443` 给用户访问前端。
3. 船端上传需要开放 `8883/TCP`，如果使用 CoAP 还需要开放 `56831/UDP`。
4. PostgreSQL 端口不应公网开放。

## 8. 和当前 `marine-dashboard` 标准 API 的区别

这套岸端兼容方案请求的是：

```text
/api/ship/latest-samples
```

当前 `marine-dashboard` 标准前后端分离方案请求的是：

```text
/api/v1/vessels/{vesselId}/engines
/api/v1/vessels/{vesselId}/alarms
/api/v1/vessels/{vesselId}/trend
```

两者区别：

| 对比项 | 岸端兼容方案 | 当前标准页面 API 方案 |
| --- | --- | --- |
| 前端请求 | `/api/ship/latest-samples` | `/api/v1/vessels/{vesselId}/...` |
| 数据粒度 | 最新一批采样点 | 按页面聚合后的业务数据 |
| 后端角色 | 岸端服务兼容旧前端 | 后端业务服务按页面输出 |
| 前端改动 | 最少 | 更标准、更清晰 |
| 适用场景 | PoC、快速演示、复用旧看板 | 正式前后端联调、长期维护 |

如果当前 `marine-dashboard` 要直接复用这套岸端兼容方案，有两种做法：

### 方案 A：前端新增兼容适配层

前端请求：

```text
/api/ship/latest-samples
```

然后把 `payload.samples[]` 转换成页面需要的：

```text
engines
alarms
trend
navigation
systemStatus
```

优点：可以快速接入他已经做好的岸端接口。

缺点：前端会承担更多数据转换逻辑，不利于长期维护。

### 方案 B：后端把岸端数据转换成标准页面 API

后端读取岸端 PostgreSQL 或 `/api/latest-samples`，再输出：

```text
/api/v1/vessels/{vesselId}/engines
/api/v1/vessels/{vesselId}/alarms
/api/v1/vessels/{vesselId}/trend
```

优点：前端最干净，符合正式前后端分离。

缺点：需要后端多做一层页面 API 适配。

正式项目建议使用方案 B。

## 9. 给前端负责人的实施清单

前端需要确认：

1. 页面请求路径固定为 `/api/ship/latest-samples`。
2. 不在页面里写死 `http://127.0.0.1:8090` 或阿里云 IP。
3. 通过 `SHIP_API_TARGET` 或 Nginx 配置决定真实岸端地址。
4. 请求失败时显示 API 离线。
5. `hasData=false` 时显示暂无数据。
6. `payload.source=shore-postgres-ingest` 时说明已经读取岸端数据库。
7. `sampleCount/goodCount/badCount` 要在调试信息或状态卡片中可见。
8. 所有接口返回必须是 JSON，不能返回 Nginx 默认 HTML 页面。
9. 前端不直接判断报警阈值，只展示后端或船端给出的报警状态。
10. 如果要迁移到当前 `marine-dashboard`，应优先让后端输出 `/api/v1/vessels/...` 页面 API。

## 10. 一句话标准

这套方案的前端标准是：前端只请求 `/api/ship/latest-samples` 这类 HTTP API，通过代理连接岸端 `8090`，读取岸端从 PostgreSQL 整理出的最新采样点；前端不直接接数据库、不接 MQTT/CoAP、不做报警阈值判断。
