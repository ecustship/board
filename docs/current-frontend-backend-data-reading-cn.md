# 当前前端读取后端数据说明

日期：2026-07-08

## 1. 结论

当前 `marine-dashboard` 前端已经按前后端分离方式读取数据。浏览器页面不直接读取 MODBUS、RS485 或 PostgreSQL，也不直接判断报警阈值；页面只通过后端 HTTP API 获取已经整理好的 JSON 数据。

当前仓库实际使用的主接口前缀是：

```text
/api/v1
```

当前页面级接口是：

```text
GET  /api/v1/vessels/{vesselId}/engines
GET  /api/v1/vessels/{vesselId}/alarms?includeHistory=true
POST /api/v1/vessels/{vesselId}/alarms/{alarmId}/acknowledge
GET  /api/v1/vessels/{vesselId}/trend?start=...&end=...&metrics=...&points=...&engineCode=...
```

你给的《阿里云岸端接收、数据库入库与当前前端复用链路》文档中写的是旧的岸端兼容接口：

```text
/api/ship/latest-samples
/api/latest-samples
/api/v1/ship/health
/api/v1/ship/storage
```

这套岸端兼容接口可以作为数据来源，但当前这个前端页面不会直接调用 `/api/ship/latest-samples`。如果要让当前前端读取岸端 PostgreSQL 数据，推荐让后端再提供一层 `/api/v1/vessels/{vesselId}/...` 页面 API，把岸端接收服务的数据转换成当前前端需要的结构。

## 2. 当前数据链路

当前前端读取后端数据的完整链路如下：

```text
船端采集服务
  -> MQTTs / CoAP / HTTP 上传
  -> 阿里云岸端接收服务
  -> PostgreSQL / TimescaleDB
  -> 后端页面 API
  -> Nginx 或 CRA proxy
  -> 当前 React 前端页面
```

也就是说，前端只关心最后一步的页面 API，不关心底层是 MODBUS、RS485、MQTTs、CoAP 还是数据库表。

## 3. 前端通过环境变量决定后端地址

当前 `.env` 配置为：

```env
REACT_APP_API_BASE_URL=/api/v1
REACT_APP_DATA_SOURCE=backend
REACT_APP_DEMO_FLUCTUATION=false
REACT_APP_AUTH_REQUIRED=true
REACT_APP_VESSEL_ID=MHM-TierIII-Demo
```

含义如下：

| 配置项 | 当前值 | 作用 |
| --- | --- | --- |
| `REACT_APP_API_BASE_URL` | `/api/v1` | 前端请求后端 API 的基础路径 |
| `REACT_APP_DATA_SOURCE` | `backend` | 使用后端数据，不使用本地 mock 模式 |
| `REACT_APP_DEMO_FLUCTUATION` | `false` | 关闭本地虚拟波动 |
| `REACT_APP_AUTH_REQUIRED` | `true` | 正式联调启用登录门禁，业务请求统一携带 JWT |
| `REACT_APP_VESSEL_ID` | `MHM-TierIII-Demo` | 当前船舶 ID，用来拼接接口路径 |

本地开发时，`package.json` 里配置了：

```json
"proxy": "http://127.0.0.1:8080"
```

所以本地 `npm start` 后，浏览器访问前端时，请求路径仍然是：

```text
http://localhost:3000/api/v1/vessels/MHM-TierIII-Demo/engines
```

但 Create React App 会把 `/api/v1/...` 代理到：

```text
http://127.0.0.1:8080/api/v1/...
```

阿里云部署时，前端静态文件由 Nginx 提供，Nginx 需要把 `/api/v1/` 转发到后端服务，例如：

```nginx
location /api/v1/ {
    proxy_pass http://127.0.0.1:8080/api/v1/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 4. 前端代码中如何拼接接口

接口定义集中在：

```text
src/api/contracts.js
```

当前主要定义如下：

```js
engines: "/vessels/{vesselId}/engines",
alarms: "/vessels/{vesselId}/alarms",
acknowledgeAlarm: "/vessels/{vesselId}/alarms/{alarmId}/acknowledge",
trend: "/vessels/{vesselId}/trend",
```

请求封装在：

```text
src/api/client.js
```

核心逻辑是：

1. `buildApiPath()` 把 `{vesselId}` 替换成 `.env` 中的 `REACT_APP_VESSEL_ID`。
2. `buildApiUrl()` 把接口路径拼到 `REACT_APP_API_BASE_URL` 后面。
3. `apiRequest()` 使用 `fetch()` 发送请求。
4. 如果本地保存了 token，会自动加请求头：

```http
Authorization: Bearer <token>
```

5. 后端返回必须是 JSON。如果返回 HTML，例如 Nginx 默认页或代理错误页，前端会报“后端接口没有返回 JSON”。

## 5. 后端返回结构要求

前端支持统一 JSON envelope：

```json
{
  "success": true,
  "code": "OK",
  "message": "",
  "serverTime": "2026-07-08T10:00:00+08:00",
  "data": {},
  "errors": []
}
```

如果后端直接返回裸数据，前端也会临时包一层兼容：

```json
{
  "data": "原始返回内容"
}
```

但正式联调建议后端统一返回 envelope，便于错误码、时间戳和调试信息对齐。

## 6. 当前已经启用真实后端读取的页面

### 6.1 Main Engine 页面

使用 hook：

```text
useEngineData(2000)
useAlarmsData(5000)
```

实际请求：

```http
GET /api/v1/vessels/MHM-TierIII-Demo/engines
GET /api/v1/vessels/MHM-TierIII-Demo/alarms?includeHistory=true
```

刷新周期：

```text
engine: 2 秒
alarms: 5 秒
```

Main Engine 页面从发动机接口读取：

| UI 显示 | 前端内部字段 | 后端 Historical 原字段 |
| --- | --- | --- |
| 燃油压力 | `fuelPressure` / `fuelDeliveryPressure` | `CMMS01_Fuel CMMSlivery Pressure` |
| 滑油温度 | `lubeOilTemp` | `CMMS01_Lubricating Oil Temperature` |
| 冷却水温度 | `coolantTemp` | `CMMS01_Coolant Temperature` |
| 排气温度 | `exhaustTemp` | 左右排温或 16 缸排温派生 |
| 转速 | `rpm` | `CMMS01_Engine Speed` |

报警卡片读取后端报警事件，不在前端判断阈值。

### 6.2 Engine Systems 页面

使用 hook：

```text
useEngineData(2000)
```

实际请求：

```http
GET /api/v1/vessels/MHM-TierIII-Demo/engines
```

Engine Systems 页面读取同一个发动机接口，然后根据当前选择的发动机按钮显示不同机组：

| 前端按钮 | 对应 Historical 前缀 |
| --- | --- |
| `diesel1` | `CMMS01` |
| `diesel2` | `CMMS02` |
| `aux1` | `CMMS03` |
| `aux2` | `CMMS04` |

剖面图、上方六个仪表、四个系统卡片、底部电参数都来自 `useEngineData()` 的归一化结果。

### 6.3 Alarm 页面和全局简易报警

使用 hook：

```text
useAlarmsData(5000)
```

实际请求：

```http
GET /api/v1/vessels/MHM-TierIII-Demo/alarms?includeHistory=true
```

确认报警时：

```http
POST /api/v1/vessels/MHM-TierIII-Demo/alarms/{alarmId}/acknowledge
```

请求体：

```json
{
  "acknowledgedAt": "2026-07-08T10:00:00.000Z"
}
```

前端只展示后端给出的 `active[]` 和 `history[]`，报警 bit 如何变成报警事件由船端或后端负责。

### 6.4 Trend 页面

使用 hook：

```text
useTrendData({ start, end, metrics, points, engineCode })
```

实际请求示例：

```http
GET /api/v1/vessels/MHM-TierIII-Demo/trend?engineCode=CMMS01&start=2026-01-01T00:00:00%2B08:00&end=2026-03-31T23:59:59%2B08:00&metrics=CMMS01_Engine%20Speed,CMMS01_Lube%20Oil%20Press&points=730
```

趋势页当前按页面选择生成参数：

| 页面曲线 | 请求中的 `metrics` |
| --- | --- |
| RPM | `CMMS01_Engine Speed` |
| Lube Oil Pressure / Pressure | `CMMS01_Lube Oil Press` |
| Exhaust Temp | `CMMS01_Exhaust Temp. LB`、`CMMS01_Exhaust Temp. RB ` |
| Coolant Temp | `CMMS01_Coolant Temperature` |
| Lube Oil Temp | `CMMS01_Lubricating Oil Temperature` |
| Fuel Pressure | `CMMS01_Fuel CMMSlivery Pressure` |
| Fuel Temp | `CMMS01_Fuel Temperature` |

趋势点必须带时间字段，前端按时间戳作为曲线节点：

```json
{
  "timestamp": "2026-01-01T00:00:00+08:00",
  "CMMS01_Engine Speed": 850,
  "CMMS01_Lube Oil Press": 4.1
}
```

前端也兼容 `time` 或 `Source_Tag`，但正式建议统一使用 `timestamp`。

## 7. 当前未真正请求后端的页面接口

当前代码里有这些接口定义，但还没有加入“后端已就绪”列表：

```text
GET /api/v1/vessels/{vesselId}/realtime
GET /api/v1/vessels/{vesselId}/navigation
GET /api/v1/vessels/{vesselId}/system-status
```

原因是后端实际路由还未稳定。当前前端在这些接口未接入时会返回：

```text
source = PENDING_BACKEND_ROUTE
backendRouteReady = false
```

页面上会显示“后端接口未接入”或“待接入”，避免误以为已经读到真实数据。

后端补齐这些路由后，需要在 `src/hooks/useRealTimeData.js` 的 `BACKEND_READY_ENDPOINTS` 中启用对应接口，前端才会开始真实请求。

## 8. 发动机字段如何和主表对齐

发动机接口正式字段名要求使用 `副本Historical Information.xlsx` 的原始表头，例如：

```text
CMMS01_Lube Oil Press
CMMS01_Engine Speed
CMMS01_Coolant Temperature
CMMS01_Exhaust Temp. RB（原字段末尾还有一个空格）
CMMS01_Exhaust Temp. CylinCMMSr 1
```

注意：

1. 原表拼写错误也要保留，例如 `CMMSlivery`、`CylinCMMSr`、`Diferential`。
2. 原表尾部空格也要保留，例如 `CMMS01_Exhaust Temp. RB `。
3. 前端适配层会优先读取 Historical 原字段。
4. 为了兼容旧后端，前端也暂时兼容 `rpm`、`oilPressure`、`coolantTemp` 等 camelCase 字段。

推荐后端返回结构：

```json
{
  "success": true,
  "data": {
    "timestamp": "2026-07-08T10:00:00+08:00",
    "quality": "GOOD",
    "source": "DB",
    "engines": {
      "CMMS01": {
        "CMMS01_Engine Speed": 850,
        "CMMS01_Lube Oil Press": 4.1,
        "CMMS01_Coolant Temperature": 73,
        "CMMS01_Lubricating Oil Temperature": 80
      }
    }
  }
}
```

## 9. 与岸端接收文档的关系

你给的岸端文档说明了这条链路：

```text
船端采集服务 8080
  -> CoAP/MQTTs
  -> 岸端接收服务 8090
  -> PostgreSQL ship_ingest.sample_values
  -> 当前前端 3001
```

文档中的岸端兼容接口是：

```http
GET http://<shore-host>:8090/api/latest-samples
```

返回结构类似：

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

这个接口说明岸端已经能从 PostgreSQL 取到最新采样点，但它不是当前前端页面正在直接调用的接口。

要接入当前前端，有两种方式。

### 方式 A：推荐，后端提供当前前端标准页面 API

后端读取 `ship_ingest.sample_values` 后，转换为：

```text
/api/v1/vessels/{vesselId}/engines
/api/v1/vessels/{vesselId}/alarms
/api/v1/vessels/{vesselId}/trend
```

这种方式对前端改动最少，也最符合当前“纯粹前后端分离”的目标。

### 方式 B：前端新增岸端兼容适配器

前端直接请求：

```text
/api/ship/latest-samples
```

然后在前端把 `payload.samples[]` 转换成 `engines`、`alarms`、`trend` 页面需要的数据结构。

这种方式能快速演示，但会让前端知道岸端接收服务的内部数据格式，不利于正式系统维护。

## 10. 当前联调时如何确认是否读到真实后端

### 10.1 浏览器 Network 检查

打开浏览器开发者工具，确认是否有这些请求：

```text
/api/v1/vessels/MHM-TierIII-Demo/engines
/api/v1/vessels/MHM-TierIII-Demo/alarms?includeHistory=true
/api/v1/vessels/MHM-TierIII-Demo/trend?...
```

如果看到请求打到了 `/static/` 或返回 HTML，则说明 Nginx 代理没有配好。

### 10.2 curl 检查

在服务器上执行：

```bash
curl -i http://127.0.0.1:8080/api/v1/vessels/MHM-TierIII-Demo/engines
```

应返回：

```text
HTTP/1.1 200 OK
Content-Type: application/json
```

再从公网入口检查：

```bash
curl -i http://8.130.14.1/api/v1/vessels/MHM-TierIII-Demo/engines
```

如果公网返回 Nginx welcome page 或 `index.html`，说明 `/api/v1/` 没有正确转发到后端。

### 10.3 页面状态检查

如果导航页面显示：

```text
后端接口未接入
```

这不是前端报错，而是说明对应后端路由还没启用。

如果 Main Engine、Engine Systems、Alarm、Trend 页面没有数据，则优先检查 `/engines`、`/alarms`、`/trend` 三类接口。

## 11. 给后端的最低对接要求

为了让当前前端完整读取真实数据，后端至少需要提供：

| 优先级 | 接口 | 作用 |
| --- | --- | --- |
| P0 | `GET /api/v1/vessels/{vesselId}/engines` | 主机、Engine Systems、部分导航实时卡片 |
| P0 | `GET /api/v1/vessels/{vesselId}/alarms?includeHistory=true` | Alarm 页面和全局报警 |
| P0 | `GET /api/v1/vessels/{vesselId}/trend` | 趋势页面 |
| P1 | `POST /api/v1/vessels/{vesselId}/alarms/{alarmId}/acknowledge` | 报警确认 |
| P1 | `GET /api/v1/vessels/{vesselId}/realtime` | GPS、风速风向、姿态、船舶实时信息 |
| P1 | `GET /api/v1/vessels/{vesselId}/system-status` | 导航页系统状态 |
| P2 | `GET /api/v1/vessels/{vesselId}/navigation` | 航线、AIS、航海信息 |

## 12. 当前登录和 token 状态

前端已经有 token 逻辑：

```text
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

登录成功后，token 保存在浏览器 localStorage：

```text
marine_dashboard_auth
```

后续请求会自动携带：

```http
Authorization: Bearer <token>
```

但当前 `.env` 中：

```env
REACT_APP_AUTH_REQUIRED=true
```

所以登录界面暂时隐藏。等后端 token 接口稳定后，把它改成：

```env
REACT_APP_AUTH_REQUIRED=true
```

即可启用登录页。

## 13. 一句话给三人分工

通信采集负责人把船端点位上传到岸端或本地后端；数据库和 API 负责人把采样点转换成 `/api/v1/vessels/{vesselId}/...` 页面 API；前端负责人只调用这些页面 API，并按 `副本Historical Information.xlsx` 原始字段名优先展示数据。
