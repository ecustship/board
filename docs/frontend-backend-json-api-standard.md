# 前后端分离 JSON/API 标准

版本：v1  
日期：2026-06-30  
适用项目：marine-dashboard

## 1. 总原则

前端页面不得再直接依赖本地写死数据作为正式数据源。所有业务数据必须由后端接口返回，前端只负责：

- 调用接口。
- 展示接口返回的数据。
- 根据用户操作提交配置。
- 对接口错误、加载中、离线状态进行 UI 表达。

本地 mock 只允许作为开发兜底或 Story/Demo 数据，不能作为正式联调口径。

## 2. 基础地址

前端统一通过环境变量指定后端地址：

```text
REACT_APP_API_BASE_URL=/api/v1
```

如果前后端同域部署，建议后端或网关暴露 `/api/v1`。如果分离部署，可设置为完整地址，例如：

```text
REACT_APP_API_BASE_URL=http://127.0.0.1:8080/api/v1
```

## 3. 统一响应包

所有接口返回必须使用统一 JSON envelope：

```json
{
  "success": true,
  "code": "OK",
  "message": "",
  "serverTime": "2026-06-30T10:15:00+08:00",
  "data": {},
  "errors": []
}
```

失败示例：

```json
{
  "success": false,
  "code": "POINT_TABLE_VALIDATE_FAILED",
  "message": "Point table validation failed",
  "serverTime": "2026-06-30T10:15:00+08:00",
  "data": null,
  "errors": [
    {
      "field": "points[12].registerAddress",
      "message": "registerAddress is required"
    }
  ]
}
```

## 4. 通用字段规范

时间统一使用 ISO 8601 字符串，并带时区：

```text
2026-06-30T10:15:00+08:00
```

实时数据必须包含：

| 字段 | 说明 |
| --- | --- |
| `timestamp` | 该数据采样时间 |
| `quality` | `GOOD`、`BAD`、`STALE`、`UNKNOWN` |
| `source` | 数据来源，例如 `MODBUS/RS485` |

数值数据建议保留原始单位：

```json
{
  "value": 4.2,
  "unit": "bar",
  "rawValue": 420,
  "quality": "GOOD",
  "timestamp": "2026-06-30T10:15:00+08:00"
}
```

## 5. Dashboard 快照接口

用于一次性获取驾驶舱所有主要数据，减少页面首屏请求数量。

```http
GET /api/v1/dashboard/snapshot?vesselId=MHM-TierIII-Demo
```

返回：

```json
{
  "success": true,
  "code": "OK",
  "message": "",
  "serverTime": "2026-06-30T10:15:00+08:00",
  "data": {
    "vessel": {},
    "engines": {},
    "navigation": {},
    "alarms": {},
    "systemStatus": {}
  },
  "errors": []
}
```

## 6. 船舶实时数据

```http
GET /api/v1/vessels/{vesselId}/realtime
```

```json
{
  "timestamp": "2026-06-30T10:15:00+08:00",
  "source": "MODBUS/RS485",
  "quality": "GOOD",
  "position": {
    "lat": 31.503,
    "lon": 122.105
  },
  "heading": 35,
  "pitch": -0.3,
  "roll": 0.2,
  "cog": 30.3,
  "sog": 10.0,
  "wind": {
    "direction": "NW",
    "speed": 18,
    "unit": "kn"
  },
  "draft": {
    "fore": -0.7,
    "aft": 0
  }
}
```

## 7. 发动机实时数据

```http
GET /api/v1/vessels/{vesselId}/engines
```

```json
{
  "timestamp": "2026-06-30T10:15:00+08:00",
  "source": "MODBUS/RS485",
  "quality": "GOOD",
  "engines": {
    "diesel1": {
      "rpm": 850,
      "power": 12450,
      "load": 88,
      "fuelRate": 285.5,
      "torque": 142.3,
      "exhaustTemp": 412.5,
      "coolantTemp": 78,
      "oilPressure": 4.2,
      "turboSpeed": 18.2,
      "voltage": 400,
      "current": 450,
      "powerFactor": 0.84,
      "cylinders": [438, 425, 418, 432, 420, 408, 445, 416, 422, 410, 430, 428, 415, 420, 422, 418],
      "status": "running",
      "alerts": []
    }
  }
}
```

## 8. 导航数据

```http
GET /api/v1/vessels/{vesselId}/navigation
```

```json
{
  "timestamp": "2026-06-30T10:15:00+08:00",
  "route": {
    "name": "Shanghai - Tokyo",
    "eta": "2026-07-01T14:30:00+08:00",
    "distanceRemaining": 1250,
    "distanceTraveled": 380,
    "waypoints": []
  },
  "ais": [],
  "weather": {
    "wind": {
      "speed": 18,
      "direction": "NW",
      "gust": 22
    },
    "sea": {
      "state": "Moderate",
      "waveHeight": 1.5,
      "swell": 0.8
    },
    "visibility": 10,
    "pressure": 1015
  }
}
```

## 9. 报警数据

报警判断由船端或后端完成，前端不配置阈值、不判断报警，只展示报警 bit 或报警事件。

```http
GET /api/v1/vessels/{vesselId}/alarms?includeHistory=true
```

```json
{
  "timestamp": "2026-06-30T10:15:00+08:00",
  "active": [
    {
      "id": "ALM-20260630-0001",
      "time": "2026-06-30T10:14:58+08:00",
      "source": "Engine Room",
      "pointCode": "GENSET_COMMON_ALARM",
      "type": "alarm",
      "priority": "high",
      "message": "High bilge water level in engine room",
      "acknowledged": false
    }
  ],
  "history": []
}
```

## 10. 趋势数据

```http
GET /api/v1/vessels/{vesselId}/trend?start=2026-01-01T00:00:00+08:00&end=2026-03-31T23:59:59+08:00&metrics=power,rpm,exhaustTemp
```

```json
{
  "metrics": ["power", "rpm", "exhaustTemp"],
  "points": [
    {
      "timestamp": "2026-01-01T00:00:00+08:00",
      "power": 12450,
      "rpm": 850,
      "exhaustTemp": 412.5,
      "pressure": 4.2,
      "lubeOilPressure": 4.2,
      "coolantTemp": 78,
      "lubeOilTemp": 85,
      "fuelPressure": 7.6,
      "fuelTemp": 38,
      "load": 88,
      "vesselSpeed": 10,
      "windSpeed": 18
    }
  ]
}
```

前端曲线选点必须以 `timestamp` 为准。

## 11. 系统状态

```http
GET /api/v1/vessels/{vesselId}/system-status
```

```json
{
  "timestamp": "2026-06-30T10:15:00+08:00",
  "systemHealth": 95,
  "cpuLoad": 30,
  "memoryUsage": 45,
  "networkLatency": 12,
  "sensors": {
    "gps": true,
    "gyro": true,
    "radar": true,
    "ais": true,
    "depth": true,
    "speed": true
  }
}
```

## 12. 点表配置 JSON

点表配置采用版本化 JSON。后端负责保存草稿、校验、生成版本、下发船端。

```json
{
  "vesselId": "MHM-TierIII-Demo",
  "deviceId": "MAIN_GENSET_1",
  "version": "v2",
  "status": "draft",
  "protocol": "MODBUS_RTU",
  "connection": {
    "transport": "rtu",
    "serialPort": "RS485-1",
    "tcpHost": "",
    "tcpPort": 502,
    "baudRate": 9600,
    "dataBits": 8,
    "parity": "N",
    "stopBits": 2,
    "unitId": 1,
    "timeoutMs": 2000,
    "retryCount": 2,
    "addressMode": "reference",
    "defaultByteOrder": "ABCD",
    "maxRegistersPerRequest": 64,
    "maxAddressGap": 4,
    "pollIntervalMs": 1000
  },
  "points": [
    {
      "enabled": true,
      "sourceNo": "1",
      "pointCode": "GENSET_ENGINE_SPEED",
      "variableKey": "genset.engineSpeed",
      "pointName": "Engine Speed",
      "displayNameZh": "发动机转速",
      "pointType": "ANALOG",
      "functionCode": 3,
      "registerAddress": 40262,
      "bitIndex": null,
      "dataType": "UINT16",
      "registerCount": 1,
      "scale": 0.125,
      "offset": 0,
      "unit": "rpm",
      "byteOrder": "ABCD",
      "rangeText": "0-3000",
      "pagePath": "Main Engine / Engine System",
      "deviceGroup": "MAIN_GENSET_1"
    }
  ]
}
```

运行 CSV 字段顺序必须固定：

```csv
pointCode,pointName,pointType,functionCode,registerAddress,bitIndex,dataType,registerCount,scale,offset,unit,byteOrder
```

## 13. 点表接口

```http
GET  /api/v1/vessels/{vesselId}/devices/{deviceId}/point-table-versions
GET  /api/v1/vessels/{vesselId}/devices/{deviceId}/point-tables/{version}
POST /api/v1/vessels/{vesselId}/devices/{deviceId}/point-tables
POST /api/v1/vessels/{vesselId}/devices/{deviceId}/point-test
POST /api/v1/vessels/{vesselId}/devices/{deviceId}/point-tables/{version}/validate
POST /api/v1/vessels/{vesselId}/devices/{deviceId}/point-tables/{version}/apply
POST /api/v1/vessels/{vesselId}/devices/{deviceId}/point-tables/{version}/rollback
```

## 14. 前端接入要求

前端统一通过 `src/api` 取数：

```js
import { useBackendEngineData } from "./api/dashboardApi";
```

禁止在页面组件中直接拼接接口 URL。  
禁止在页面组件中直接写正式业务 mock。  
如果接口未就绪，只能在 hook 层使用开发兜底数据，并在 UI 上标识 `offline/mock`。

## 15. 联调顺序

1. 后端先实现 `/dashboard/snapshot` 和 `/engines`。
2. 前端将 Main Engine、Engine Systems 的数据源切到后端。
3. 后端实现 `/navigation`、`/alarms`、`/system-status`。
4. 前端将 Navigation、Alarm、全局报警切到后端。
5. 后端实现 `/trend`。
6. 前端趋势页按 `timestamp` 和 `metrics` 请求曲线数据。
7. 后端实现点表配置版本接口。
8. 前端配置页接入导入、导出、保存草稿、校验、应用、回滚。
