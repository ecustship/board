# UI 参数主表映射清单

版本：v1  
日期：2026-06-30  
主表来源：

- `Main Genset RS485 Communication protocolsV3(1).xls`，sheet：`1550KW主发`
- `副本Historical Information.xlsx`，sheet：`CMMS01` 至 `CMMS04`

## 1. 使用原则

1. 页面展示的运行参数必须由后端接口返回，前端页面不直接读取 MODBUS 寄存器。
2. 后端根据主表读取 `485 Address Code`，再输出前端 JSON 字段。
3. JSON 字段采用 UI 标准单位；主表原始单位保留在点表或 `rawValue` 中。
4. 主表没有的 UI 参数必须标为“主表未提供”，不能假装来自主表。
5. 报警由船端/后端判断，前端只展示报警 bit 或报警事件。

## 2. 单位换算口径

| 主表单位 | UI JSON 标准单位 | 换算 |
| --- | --- | --- |
| `1rpm` | `rpm` | 不换算 |
| `1℃` | `degC` / `°C` | 不换算 |
| `1kPa` | `bar` | `bar = kPa / 100` |
| `0.1V` | `V` | `V = raw * 0.1` |
| `1h` / `1min` / `1s` | `h` / `min` / `s` | 不换算 |
| `/` | 由点位语义决定 | 数字报警通常按 bit 处理 |

## 2.1 后端接口字段总表

下面的“后端接口字段”是后端 JSON envelope 中 `data` 下面的字段路径。  
`{engineId}` 表示 `diesel1`、`diesel2`、`aux1`、`aux2` 等发动机/机组编号。

### 2.1.1 主机/发动机接口字段

接口：

```http
GET /api/v1/vessels/{vesselId}/engines
```

| UI 参数 | 后端接口字段 | 主表 Signal Content | 地址/Bit | 说明 |
| --- | --- | --- | --- | --- |
| 发动机转速 | `data.engines.{engineId}.rpm` | Engine Speed | `40262` | rpm |
| 冷却水温度 | `data.engines.{engineId}.coolantTemp` | Coolant Temperature | `40263` | °C |
| 滑油温度 | `data.engines.{engineId}.lubeOilTemp` | Oil Temperature | `40264` | °C |
| 滑油压力 | `data.engines.{engineId}.oilPressure` | Oil Pressure | `40267` | 后端 kPa 转 bar |
| 冷却水压力 | `data.engines.{engineId}.coolantPressure` | Coolant Pressure | `40286` | 后端 kPa 转 bar |
| 海水压力 | `data.engines.{engineId}.seaWaterPressure` | Sea Water Pressure | `40269` | 后端 kPa 转 bar |
| 燃油压力 | `data.engines.{engineId}.fuelPressure` | Fuel Pressure | `40287` | 后端 kPa 转 bar |
| 燃油温度 | `data.engines.{engineId}.fuelTemp` | Fuel temperature | `40288` | °C |
| 1缸排气温度 | `data.engines.{engineId}.cylinders[0]` | Exhaust Temp. CylinCMMSr 1 | `40353` | °C |
| 2缸排气温度 | `data.engines.{engineId}.cylinders[1]` | Exhaust Temp. CylinCMMSr 2 | `40354` | °C |
| 3缸排气温度 | `data.engines.{engineId}.cylinders[2]` | Exhaust Temp. CylinCMMSr 3 | `40355` | °C |
| 4缸排气温度 | `data.engines.{engineId}.cylinders[3]` | Exhaust Temp. CylinCMMSr 4 | `40356` | °C |
| 5缸排气温度 | `data.engines.{engineId}.cylinders[4]` | Exhaust Temp. CylinCMMSr 5 | `40357` | °C |
| 6缸排气温度 | `data.engines.{engineId}.cylinders[5]` | Exhaust Temp. CylinCMMSr 6 | `40358` | °C |
| 7缸排气温度 | `data.engines.{engineId}.cylinders[6]` | Exhaust Temp. CylinCMMSr 7 | `40359` | °C |
| 8缸排气温度 | `data.engines.{engineId}.cylinders[7]` | Exhaust Temp. CylinCMMSr 8 | `40360` | °C |
| 9缸排气温度 | `data.engines.{engineId}.cylinders[8]` | Exhaust Temp. CylinCMMSr 9 | `40361` | °C |
| 10缸排气温度 | `data.engines.{engineId}.cylinders[9]` | Exhaust Temp. CylinCMMSr 10 | `40362` | °C |
| 11缸排气温度 | `data.engines.{engineId}.cylinders[10]` | Exhaust Temp. CylinCMMSr 11 | `40363` | °C |
| 12缸排气温度 | `data.engines.{engineId}.cylinders[11]` | Exhaust Temp. CylinCMMSr 12 | `40364` | °C |
| 13缸排气温度 | `data.engines.{engineId}.cylinders[12]` | Exhaust Temp. CylinCMMSr 13 | `40365` | °C |
| 14缸排气温度 | `data.engines.{engineId}.cylinders[13]` | Exhaust Temp. CylinCMMSr 14 | `40366` | °C |
| 15缸排气温度 | `data.engines.{engineId}.cylinders[14]` | Exhaust Temp. CylinCMMSr 15 | `40367` | °C |
| 16缸排气温度 | `data.engines.{engineId}.cylinders[15]` | Exhaust Temp. CylinCMMSr 16 | `40368` | °C |
| 左列排气温度 | `data.engines.{engineId}.exhaustTempLB` | left exhaust temperature | `40328` | °C |
| 右列排气温度 | `data.engines.{engineId}.exhaustTempRB` | right exhaust temperature | `40329` | °C |
| 页面综合排气温度 | `data.engines.{engineId}.exhaustTemp` | 左右排温或16缸排温派生 | `40328/40329/40353-40368` | 后端派生字段，需说明计算规则 |
| 燃油共轨压力 | `data.engines.{engineId}.fuelRailPressure` | Fuel Rail Pressure | `40375` | 后端 kPa 转 bar |
| 燃油供给压力 | `data.engines.{engineId}.fuelDeliveryPressure` | Fuel Pressure | `40287` | 主表无同名点位，暂映射 Fuel Pressure |
| 左列歧管压力 | `data.engines.{engineId}.intakeManifoldPressureLB` | Intake Manifold Pressure LB | `40369` | 后端 kPa 转 bar |
| 右列歧管压力 | `data.engines.{engineId}.intakeManifoldPressureRB` | Intake Manifold Pressure RB | `40370` | 后端 kPa 转 bar |
| 左列前端温度 | `data.engines.{engineId}.intakeManifoldTemperatureLBF` | Intake Manifold Temperature LBF | `40371` | °C |
| 左列后端温度 | `data.engines.{engineId}.intakeManifoldTemperatureLBR` | Intake Manifold Temperature LBR | `40372` | °C |
| 右列前端温度 | `data.engines.{engineId}.intakeManifoldTemperatureRBF` | Intake Manifold Temperature RBF | `40373` | °C |
| 右列后端温度 | `data.engines.{engineId}.intakeManifoldTemperatureRBR` | Intake Manifold Temperature RBR | `40374` | °C |
| 曲轴箱压力 | `data.engines.{engineId}.crankcasePressure` | Crankcase Pressure | `40377` | 单位需确认 |
| 大气压力 | `data.engines.{engineId}.barometricPressure` | 无 | 无 | 主表未提供 |
| 滑油滤器压差 | `data.engines.{engineId}.lubeOilFilterDifferentialPressure` | Lube Oil Filter Diferential Pressure | `40378` | 后端 kPa 转 bar |
| 主控制电源 | `data.engines.{engineId}.mainControlPower` | Main Power Voltage | `40271` | 后端 raw 乘以 0.1 |
| 备用控制电源 | `data.engines.{engineId}.backupControlPower` | Backup Power Voltage | `40272` | 后端 raw 乘以 0.1 |
| 发动机运行 | `data.engines.{engineId}.running` / `data.engines.{engineId}.status` | Genset Running | `40001.14` | 后端可输出 boolean 和状态字符串 |
| 膨胀水箱液位低 | `data.engines.{engineId}.expansionTankLowAlarm` | Coolant Level Low Alarm | `40034.12` | 推断匹配 |
| 低滑油压力停机 <1500 | `data.engines.{engineId}.lowLubOilShutdownBelow1500` | Lube Oil Pressure SD switch alarm(LSR) | `40011.11` | 推断匹配 |
| 低滑油压力停机 >1500 | `data.engines.{engineId}.lowLubOilShutdownAbove1500` | Lube Oil Pressure SD switch alarm（HSR） | `40011.9` | 推断匹配 |
| 高冷却水温停机 | `data.engines.{engineId}.highCoolantTemperatureShutdown` | High Coolant Temperature Shutdown Alarm | `40011.10/40005.0` | 后端合并或说明优先级 |
| 燃油泄漏报警 | `data.engines.{engineId}.fuelLeakageAlarm` | Fuel leakage alarm | `40034.11` |  |
| 超速停机 | `data.engines.{engineId}.overspeedShutdown` | Overspeed Shutdown Alarm | `40002.1` |  |
| 本地急停 | `data.engines.{engineId}.localEmergencyStop` | Local Emergency Shutdown Alarm | `40002.0` |  |
| 远程急停 | `data.engines.{engineId}.remoteEmergencyStop` | Remote Emergency Shutdown Alarm | `40011.8` |  |
| 燃油流量 | `data.engines.{engineId}.fuelRate` | 无 | 无 | 主表未提供 |
| 负载率 | `data.engines.{engineId}.load` | 无 | 无 | 主表未提供，可后端计算 |
| 发电机输出电压 | `data.engines.{engineId}.voltage` | 无 | 无 | 主表未提供 |
| 电流 | `data.engines.{engineId}.current` | 无 | 无 | 主表未提供 |
| 功率因数 | `data.engines.{engineId}.powerFactor` | 无 | 无 | 主表未提供 |
| 电功率 | `data.engines.{engineId}.power` | 无 | 无 | 主表未提供，可后端计算 |
| 发动机时间戳 | `data.timestamp` 或 `data.engines.{engineId}.timestamp` | 无 | 无 | 接口元数据 |

### 2.1.2 船舶实时接口字段

接口：

```http
GET /api/v1/vessels/{vesselId}/realtime
```

| UI 参数 | 后端接口字段 | 主表状态 | 说明 |
| --- | --- | --- | --- |
| 船首角/航向 | `data.heading` | 非主机主表参数 | 导航/罗经/GPS |
| GPS 纬度 | `data.position.lat` | 非主机主表参数 | GPS/NMEA |
| GPS 经度 | `data.position.lon` | 非主机主表参数 | GPS/NMEA |
| 风速 | `data.wind.speed` | 非主机主表参数 | 气象站/NMEA |
| 风向 | `data.wind.direction` | 非主机主表参数 | 气象站/NMEA |
| Pitch | `data.pitch` | 非主机主表参数 | 姿态/惯导 |
| Roll | `data.roll` | 非主机主表参数 | 姿态/惯导 |
| Trim | `data.trim` | 非主机主表参数 | 姿态/船舶状态 |
| SOG | `data.sog` | 非主机主表参数 | GPS/NMEA |
| COG | `data.cog` | 非主机主表参数 | GPS/NMEA |
| 艏吃水 | `data.draft.fore` | 非主机主表参数 | 船舶状态接口 |
| 艉吃水 | `data.draft.aft` | 非主机主表参数 | 船舶状态接口 |
| 船舶时间戳 | `data.timestamp` | 接口元数据 | ISO 8601 |

### 2.1.3 报警接口字段

接口：

```http
GET  /api/v1/vessels/{vesselId}/alarms?includeHistory=true
POST /api/v1/vessels/{vesselId}/alarms/{alarmId}/acknowledge
```

| UI 参数 | 后端接口字段 | 主表状态 | 说明 |
| --- | --- | --- | --- |
| 活动报警列表 | `data.active[]` | ALARM 区 bit 点位派生 | 后端把 bit 转成报警事件 |
| 历史报警列表 | `data.history[]` | ALARM 区 bit 点位派生 |  |
| 报警 ID | `data.active[].id` | 后端事件字段 |  |
| 报警时间 | `data.active[].time` 或 `data.active[].timestamp` | 后端事件字段 |  |
| 报警来源 | `data.active[].source` | 后端映射 |  |
| 主表点位编码 | `data.active[].pointCode` | 点表字段 | 例如 `GENSET_COMMON_ALARM` |
| 报警类型 | `data.active[].type` | 后端派生 | `info/warning/alarm` |
| 优先级 | `data.active[].priority` | 后端配置 | 主表不提供 priority |
| 报警内容 | `data.active[].message` | Signal Content/显示名 | 后端可返回中英文显示名 |
| 确认状态 | `data.active[].acknowledged` | 后端事件状态 | 不来自 MODBUS 原始 bit |
| 确认动作 | `POST acknowledge` 请求体 `acknowledgedAt` | 后端事件动作 | 前端不直接改船端 bit |

### 2.1.4 系统状态接口字段

接口：

```http
GET /api/v1/vessels/{vesselId}/system-status
```

| UI 参数 | 后端接口字段 | 主表状态 | 说明 |
| --- | --- | --- | --- |
| 系统健康度 | `data.systemHealth` | 后端计算 |  |
| CPU 负载 | `data.cpuLoad` | 后端/设备状态 |  |
| 内存使用率 | `data.memoryUsage` | 后端/设备状态 |  |
| 网络延迟 | `data.networkLatency` | 后端/设备状态 |  |
| 传感器状态 | `data.sensors` | 后端/设备状态 | GPS、gyro、radar 等 |
| 系统状态时间戳 | `data.timestamp` | 接口元数据 | ISO 8601 |

### 2.1.5 趋势接口字段

接口：

```http
GET /api/v1/vessels/{vesselId}/trend?start=...&end=...&metrics=...
GET /api/v1/vessels/{vesselId}/trend?hours=8760&points=730
```

| 曲线参数 | 后端接口字段 | 主表 Signal Content | 地址/Bit | 状态 |
| --- | --- | --- | --- | --- |
| 时间戳 | `data.points[].timestamp` | 无 | 无 | 必需 |
| Electric Power | `data.points[].power` | 无 | 无 | 主表未提供 |
| Kilowatts | `data.points[].power` 或 `data.points[].kw` | 无 | 无 | 主表未提供 |
| RPM | `data.points[].rpm` | Engine Speed | `40262` | 已匹配 |
| Exhaust Temp | `data.points[].exhaustTemp` | 左右排温或16缸排温 | `40328/40329/40353-40368` | 派生 |
| Pressure | `data.points[].pressure` | 待定义 | 待定义 | 字段含义需确认 |
| Lube Oil Press | `data.points[].lubeOilPressure` | Oil Pressure | `40267` | 已匹配 |
| Coolant Temp | `data.points[].coolantTemp` | Coolant Temperature | `40263` | 已匹配 |
| Lube Oil Temp | `data.points[].lubeOilTemp` | Oil Temperature | `40264` | 已匹配 |
| Fuel Pressure | `data.points[].fuelPressure` | Fuel Pressure | `40287` | 已匹配 |
| Fuel Temp | `data.points[].fuelTemp` | Fuel temperature | `40288` | 已匹配 |
| Engine Load | `data.points[].load` | 无 | 无 | 主表未提供 |
| Vessel Speed | `data.points[].vesselSpeed` | 无 | 无 | 非主机主表参数 |
| Wind Speed | `data.points[].windSpeed` | 无 | 无 | 非主机主表参数 |

### 2.1.6 航海图/船队接口字段

当前前端代码中航海图仍是静态数据，后端联调时建议新增或统一到航海接口：

```http
GET /api/v1/vessels/{vesselId}/navigation
```

| UI 参数 | 建议后端接口字段 | 主表状态 | 说明 |
| --- | --- | --- | --- |
| 船舶列表 | `data.vessels[]` | 非主机主表参数 | 船队/航海接口 |
| 船名 | `data.vessels[].name` | 非主机主表参数 | 船舶元数据 |
| 船舶状态 | `data.vessels[].status` | 非主机主表参数 | 航行状态 |
| 经纬度 | `data.vessels[].lat` / `data.vessels[].lon` | 非主机主表参数 | GPS |
| SOG | `data.vessels[].sog` | 非主机主表参数 | GPS/NMEA |
| 航线轨迹 | `data.routeTrack[]` | 非主机主表参数 | 历史/计划航线 |

## 3. Engine Systems 剖面图 46 参数映射

本节用于追溯主表点位；后端 JSON 字段路径见 `2.1 后端接口字段总表`。

| UI 参数 | 前端字段 | 主表 Signal Content | 地址/Bit | 主表单位 | UI 单位 | 状态 | 说明 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 滑油压力 | `engine.oilPressure` / `lubeOilPress` | Oil Pressure | `40267` | `1kPa` | `bar` | 已匹配 | 后端需从 kPa 转 bar |
| 冷却水温度 | `engine.coolantTemp` / `coolantTemperature` | Coolant Temperature | `40263` | `1℃` | `°C` | 已匹配 |  |
| 滑油温度 | `lubricatingOilTemperature` | Oil Temperature | `40264` | `1℃` | `°C` | 已匹配 | 当前前端由冷却水温度 +7 推导，后端接入后应改为主表点位 |
| 冷却水压力 | `coolantPressure` | Coolant Pressure | `40286` | `1kPa` | `bar` | 已匹配 | 后端需从 kPa 转 bar |
| 海水压力 | `seaWaterPressure` | Sea Water Pressure | `40269` | `1kPa` | `bar` | 已匹配 | 后端需从 kPa 转 bar |
| 膨胀水箱液位低 | `expansionTankLowAlarm` | Coolant Level Low Alarm | `40034.12` | digital | boolean | 推断匹配 | 主表名称为冷却液位低报警，和历史表“Expansion Tank Level Low”需由陆工确认 |
| 1缸排气温度 | `cylinders[0]` | Exhaust Temp. CylinCMMSr 1 | `40353` | `1℃` | `°C` | 已匹配 | 主表原文拼写为 CylinCMMSr |
| 2缸排气温度 | `cylinders[1]` | Exhaust Temp. CylinCMMSr 2 | `40354` | `1℃` | `°C` | 已匹配 |  |
| 3缸排气温度 | `cylinders[2]` | Exhaust Temp. CylinCMMSr 3 | `40355` | `1℃` | `°C` | 已匹配 |  |
| 4缸排气温度 | `cylinders[3]` | Exhaust Temp. CylinCMMSr 4 | `40356` | `1℃` | `°C` | 已匹配 |  |
| 5缸排气温度 | `cylinders[4]` | Exhaust Temp. CylinCMMSr 5 | `40357` | `1℃` | `°C` | 已匹配 |  |
| 6缸排气温度 | `cylinders[5]` | Exhaust Temp. CylinCMMSr 6 | `40358` | `1℃` | `°C` | 已匹配 |  |
| 7缸排气温度 | `cylinders[6]` | Exhaust Temp. CylinCMMSr 7 | `40359` | `1℃` | `°C` | 已匹配 |  |
| 8缸排气温度 | `cylinders[7]` | Exhaust Temp. CylinCMMSr 8 | `40360` | `1℃` | `°C` | 已匹配 |  |
| 9缸排气温度 | `cylinders[8]` | Exhaust Temp. CylinCMMSr 9 | `40361` | `1℃` | `°C` | 已匹配 |  |
| 10缸排气温度 | `cylinders[9]` | Exhaust Temp. CylinCMMSr 10 | `40362` | `1℃` | `°C` | 已匹配 |  |
| 11缸排气温度 | `cylinders[10]` | Exhaust Temp. CylinCMMSr 11 | `40363` | `1℃` | `°C` | 已匹配 |  |
| 12缸排气温度 | `cylinders[11]` | Exhaust Temp. CylinCMMSr 12 | `40364` | `1℃` | `°C` | 已匹配 |  |
| 13缸排气温度 | `cylinders[12]` | Exhaust Temp. CylinCMMSr 13 | `40365` | `1℃` | `°C` | 已匹配 |  |
| 14缸排气温度 | `cylinders[13]` | Exhaust Temp. CylinCMMSr 14 | `40366` | `1℃` | `°C` | 已匹配 |  |
| 15缸排气温度 | `cylinders[14]` | Exhaust Temp. CylinCMMSr 15 | `40367` | `1℃` | `°C` | 已匹配 |  |
| 16缸排气温度 | `cylinders[15]` | Exhaust Temp. CylinCMMSr 16 | `40368` | `1℃` | `°C` | 已匹配 |  |
| 燃油共轨压力 | `fuelRailPressure` | Fuel Rail Pressure | `40375` | `1kPa` | `bar` | 已匹配 | 后端需从 kPa 转 bar |
| 燃油供给压力 | `fuelDeliveryPressure` | Fuel Pressure | `40287` | `1kPa` | `bar` | 推断匹配 | 主表没有 Fuel Delivery Pressure，现用 Fuel Pressure 对应，需确认名称 |
| 左列歧管压力 | `intakeManifoldPressureLB` | Intake Manifold Pressure LB | `40369` | `1kPa` | `bar` | 已匹配 |  |
| 右列歧管压力 | `intakeManifoldPressureRB` | Intake Manifold Pressure RB | `40370` | `1kPa` | `bar` | 已匹配 |  |
| 左列前端温度 | `intakeManifoldTemperatureLBF` | Intake Manifold Temperature LBF | `40371` | `1℃` | `°C` | 已匹配 |  |
| 左列后端温度 | `intakeManifoldTemperatureLBR` | Intake Manifold Temperature LBR | `40372` | `1℃` | `°C` | 已匹配 |  |
| 右列前端温度 | `intakeManifoldTemperatureRBF` | Intake Manifold Temperature RBF | `40373` | `1℃` | `°C` | 已匹配 |  |
| 右列后端温度 | `intakeManifoldTemperatureRBR` | Intake Manifold Temperature RBR | `40374` | `1℃` | `°C` | 已匹配 |  |
| 左列排气温度 | `exhaustTempLB` | left exhaust temperature | `40328` | `1℃` | `°C` | 已匹配 |  |
| 右列排气温度 | `exhaustTempRB` | right exhaust temperature | `40329` | `1℃` | `°C` | 已匹配 |  |
| 曲轴箱压力 | `crankcasePressure` | Crankcase Pressure | `40377` | `1kPa` | `bar` 或 `mmH2O` | 单位待确认 | 当前 UI 写死 `mmH2O`，主表是 kPa，需要统一单位 |
| 燃油温度 | `fuelTemperature` | Fuel temperature | `40288` | `1℃` | `°C` | 已匹配 |  |
| 大气压力 | `barometricPressure` | 无 | 无 | 无 | `bar` | 主表未提供 | 需要来自环境/气象/独立传感器或后端常量 |
| 滑油滤器压差 | `lubeOilFilterDifferentialPressure` | Lube Oil Filter Diferential Pressure | `40378` | `1kPa` | `bar` | 已匹配 | 主表原文拼写为 Diferential |
| 主控制电源 | `mainControlPower` | Main Power Voltage | `40271` | `0.1V` | `V` | 已匹配 | 后端需乘以 0.1 |
| 备用控制电源 | `backupControlPower` | Backup Power Voltage | `40272` | `0.1V` | `V` | 已匹配 | 后端需乘以 0.1 |
| 低滑油压力停机 <1500 | `lowLubOilShutdownBelow1500` | Lube Oil Pressure SD switch alarm(LSR) | `40011.11` | bit | boolean | 推断匹配 | below 1500rpm 暂按 LSR，对应关系需确认 |
| 低滑油压力停机 >1500 | `lowLubOilShutdownAbove1500` | Lube Oil Pressure SD switch alarm（HSR） | `40011.9` | bit | boolean | 推断匹配 | above 1500rpm 暂按 HSR，对应关系需确认 |
| 高冷却水温停机 | `highCoolantTemperatureShutdown` | High Coolant Temperature Shutdown Alarm | `40011.10` / `40005.0` | bit | boolean | 已匹配 | 主表给出两个地址，后端需明确优先级或合并逻辑 |
| 燃油泄漏报警 | `fuelLeakageAlarm` | Fuel leakage alarm | `40034.11` | bit | boolean | 已匹配 |  |
| 发动机转速 | `engine.rpm` / `engineSpeed` | Engine Speed | `40262` | `1rpm` | `rpm` | 已匹配 |  |
| 超速停机 | `overspeedShutdown` | Overspeed Shutdown Alarm (main module) | `40002.1` | bit | boolean | 已匹配 | 另有 Overspeed Alarm `40022.0` |
| 本地急停 | `localEmergencyStop` | Local Emergency Shutdown Alarm | `40002.0` | bit | boolean | 已匹配 |  |
| 远程急停 | `remoteEmergencyStop` | Remote Emergency Shutdown Alarm | `40011.8` | bit | boolean | 已匹配 |  |
| 发动机运行 | `engine.status` / `engineRunning` | Genset Running | `40001.14` | bit | boolean | 已匹配 | 不在 46 参数历史表内，但在通信主表内 |

## 4. Main Engine 页面参数映射

| UI 参数 | 前端字段 | 主表 Signal Content | 地址/Bit | UI 单位 | 状态 | 说明 |
| --- | --- | --- | --- | --- | --- | --- |
| 燃油压力 | `engine.fuelPressure` | Fuel Pressure | `40287` | `bar` | 已匹配 | 当前代码仍写死 `7.6`，后端接入后应改为 `engine.fuelPressure` |
| 滑油温度 | `engine.lubeOilTemp` | Oil Temperature | `40264` | `°C` | 已匹配 | 当前代码由冷却水温度 +8 推导，后端接入后应改为主表点位 |
| 冷却水温度 | `engine.coolantTemp` | Coolant Temperature | `40263` | `°C` | 已匹配 |  |
| 排气温度 | `engine.exhaustTemp` | left/right exhaust temperature 或 16缸排温 | `40328` / `40329` / `40353-40368` | `°C` | 派生计算 | 建议后端返回左右排温平均值或 16缸平均值，并标明计算规则 |
| 转速 | `engine.rpm` | Engine Speed | `40262` | `rpm` | 已匹配 |  |
| 底部发动机转速 | `engine.rpm` | Engine Speed | `40262` | `rpm` | 已匹配 |  |
| 底部燃油流量 | `engine.fuelRate` | 无 | 无 | `L/h` | 主表未提供 | 需要新增燃油流量点位或后端估算 |
| 底部滑油压力 | `engine.oilPressure` | Oil Pressure | `40267` | `bar` | 已匹配 |  |
| 底部冷却水温度 | `engine.coolantTemp` | Coolant Temperature | `40263` | `°C` | 已匹配 |  |
| 负载率 | `engine.load` | 无 | 无 | `%` | 主表未提供 | 可由电功率/额定功率计算；主表未提供电功率 |
| 船名 | `vessel.name` | 无 | 无 | text | 非主机主表参数 | 应来自船舶元数据接口 |
| 船舶照片 | `vessel.photoUrl` | 无 | 无 | image URL | 非主机主表参数 | 应来自静态资源或船舶元数据接口 |
| 产品型号 | `engine.product.model` | 无 | 无 | text | 非主机主表参数 | 应来自设备台账/资产接口 |
| 序列号 | `engine.product.serialNo` | 无 | 无 | text | 非主机主表参数 | 应来自设备台账/资产接口 |
| 生产编号 | `engine.product.productionNo` | 无 | 无 | text | 非主机主表参数 | 应来自设备台账/资产接口 |
| 报警摘要 | `alarms.active[]` | ALARM 区 bit 点位 | 多个 | event | 已匹配接口 | 前端展示后端报警事件，不在 UI 端判断阈值 |

## 5. Engine Systems 右侧/底部卡片映射

| UI 参数 | 前端字段 | 主表 Signal Content | 地址/Bit | UI 单位 | 状态 | 说明 |
| --- | --- | --- | --- | --- | --- | --- |
| 运行状态 | `engine.status` | Genset Running | `40001.14` | boolean/status | 已匹配 | 后端可映射为 `running/standby/fault` |
| 功率输出 | `engine.power` | 无 | 无 | `kW` | 主表未提供 | 需要发电机电功率点位或后端计算 |
| 负载 | `engine.load` | 无 | 无 | `%` | 主表未提供 | 可由功率/额定功率计算 |
| 油温 | `engine.lubeOilTemp` | Oil Temperature | `40264` | `°C` | 已匹配 | 当前 UI 部分仍用 coolantTemp，应调整 |
| 诊断状态 | `engine.status` + `alarms` | ALARM 区 bit 点位 | 多个 | status | 派生计算 | 根据后端状态/报警事件派生 |
| TIMESTAMP NODE | `engines.timestamp` | 无 | 无 | ISO time | 接口元数据 | 后端 envelope/data 必须返回 `timestamp` |
| Voltage | `engine.voltage` | 无 | 无 | `V` | 主表未提供 | 主表只有控制电源电压，不是发电机输出电压 |
| Current | `engine.current` | 无 | 无 | `A` | 主表未提供 | 需要新增电流点位 |
| Power Factor | `engine.powerFactor` | 无 | 无 | ratio | 主表未提供 | 需要新增功率因数点位 |
| Electric Power | `engine.power` | 无 | 无 | `kW` | 主表未提供 | 需要新增电功率点位或后端计算 |

## 6. Navigation 页面参数映射

| UI 参数 | 前端字段 | 主表 Signal Content | 地址/Bit | 状态 | 说明 |
| --- | --- | --- | --- | --- | --- |
| 船首角/航向 | `vessel.heading` | 无 | 无 | 非主机主表参数 | 应来自导航/罗经/GPS 主表 |
| GPS 纬度 | `vessel.position.lat` | 无 | 无 | 非主机主表参数 | 应来自 GPS/NMEA 接口 |
| GPS 经度 | `vessel.position.lon` | 无 | 无 | 非主机主表参数 | 应来自 GPS/NMEA 接口 |
| 风速 | `vessel.wind.speed` | 无 | 无 | 非主机主表参数 | 应来自气象站/NMEA 接口 |
| 风向 | `vessel.wind.direction` | 无 | 无 | 非主机主表参数 | 应来自气象站/NMEA 接口 |
| 船舶姿态 Pitch | `vessel.pitch` | 无 | 无 | 非主机主表参数 | 应来自姿态/惯导接口 |
| 船舶姿态 Roll | `vessel.roll` 或当前 `draft.fore` | 无 | 无 | 非主机主表参数 | 当前 UI 用 `draft.fore` 显示 Roll，字段应改为独立 `roll` |
| Trim | `vessel.trim` 或当前 `draft.aft` | 无 | 无 | 非主机主表参数 | 当前 UI 用 `draft.aft` 显示 Trim，字段应改为独立 `trim` |
| SOG 航速 | `vessel.sog` | 无 | 无 | 非主机主表参数 | 应来自 GPS/NMEA |
| 发动机转速 | `engine.rpm` | Engine Speed | `40262` | 已匹配 | 主机参数，可从主表取 |
| 发动机温度 | `engine.exhaustTemp` | left/right exhaust temperature 或 16缸排温 | `40328` / `40329` / `40353-40368` | 派生计算 | 建议后端明确为排温平均值 |
| 导航报警 | `alarms.active[]` | ALARM 区 bit 点位 + 导航报警表 | 多个 | 部分匹配 | 主机报警来自本主表，导航/消防/舱底水等需其他主表 |
| 时间戳更新节点 | `vessel.timestamp` / `systemStatus.timestamp` | 无 | 无 | 接口元数据 | 后端接口必须返回 |

## 7. Alarm 页面参数映射

| UI 参数 | 前端字段 | 主表 Signal Content | 地址/Bit | 状态 | 说明 |
| --- | --- | --- | --- | --- | --- |
| 活动报警数 | `alarms.active.length` | ALARM 区 bit 点位 | 多个 | 派生统计 | 后端把 bit 映射为事件后，前端统计 |
| 高优先级数量 | `alarms.active[].priority` | ALARM 区 bit 点位 | 多个 | 后端派生 | 主表只有报警 bit/set value，不提供 priority，需后端配置 |
| 待确认数量 | `alarms.active[].acknowledged` | 无 | 无 | 后端事件状态 | 来自报警确认状态，不是 MODBUS 点位 |
| 报警来源 | `alarm.source` | 由点表/设备映射 | 多个 | 后端映射 |  |
| 报警内容 | `alarm.message` | Signal Content 或配置名 | 多个 | 后端映射 | 可用主表 Signal Content 或中文显示名 |
| 报警确认 | `POST /alarms/{alarmId}/acknowledge` | 无 | 无 | 后端事件动作 | 不修改船端 bit，只记录确认状态 |
| 报警声音/专注模式 | `focusMode` | 无 | 无 | UI 本地状态 | 与主表无关 |

## 8. Trend 页面参数映射

| 曲线参数 | 前端字段 | 主表 Signal Content | 地址/Bit | 状态 | 说明 |
| --- | --- | --- | --- | --- | --- |
| Electric Power | `power` | 无 | 无 | 主表未提供 | 需新增电功率点位或后端计算 |
| Kilowatts | `kw` | 无 | 无 | 主表未提供 | 当前与 `power` 同源 |
| RPM | `rpm` | Engine Speed | `40262` | 已匹配 |  |
| Exhaust Temp | `exhaustTemp` / 当前 `temperature` | left/right exhaust temperature 或 16缸排温 | `40328` / `40329` / `40353-40368` | 派生计算 | 当前代码用 `temperature` 字段，建议改名为 `exhaustTemp` |
| Pressure | `pressure` | 无 | 无 | 定义不清 | 需要明确是滑油压力、燃油压力还是其他压力 |
| Lube Oil Press | `lubeOilPressure` | Oil Pressure | `40267` | 已匹配 | kPa 转 bar |
| Coolant Temp | `coolantTemp` | Coolant Temperature | `40263` | 已匹配 |  |
| Lube Oil Temp | `lubeOilTemp` | Oil Temperature | `40264` | 已匹配 |  |
| Fuel Pressure | `fuelPressure` | Fuel Pressure | `40287` | 已匹配 | kPa 转 bar |
| Fuel Temp | `fuelTemp` | Fuel temperature | `40288` | 已匹配 |  |
| Engine Load | `load` | 无 | 无 | 主表未提供 | 可由功率/额定功率计算 |
| Vessel Speed | `vesselSpeed` | 无 | 无 | 非主机主表参数 | 来自 GPS/NMEA |
| Wind Speed | `windSpeed` | 无 | 无 | 非主机主表参数 | 来自气象站/NMEA |

## 9. Nautical Charts 页面参数映射

| UI 参数 | 前端字段 | 主表 Signal Content | 地址/Bit | 状态 | 说明 |
| --- | --- | --- | --- | --- | --- |
| 船舶列表 | `vessels[]` | 无 | 无 | 非主机主表参数 | 应来自船队/航海接口 |
| 船舶名称 | `vessel.name` | 无 | 无 | 非主机主表参数 | 来自船舶元数据 |
| 船舶状态 | `vessel.status` | 无 | 无 | 非主机主表参数 | 来自航行/系统状态接口 |
| 经纬度 | `vessel.lat/lon` | 无 | 无 | 非主机主表参数 | 来自 GPS/NMEA |
| SOG | `vessel.sog` | 无 | 无 | 非主机主表参数 | 来自 GPS/NMEA |
| 航线轨迹 | `routeTrack[]` | 无 | 无 | 非主机主表参数 | 来自航线/历史轨迹接口 |
| 右侧经纬度/风速/船首角 | `vessel/navigation` | 无 | 无 | 非主机主表参数 | 主机通讯主表不包含 |
| Power 曲线 | `power` | 无 | 无 | 主表未提供 | 如果是发电功率，需要新增点位或后端计算 |

## 10. Configuration 页面参数映射

Configuration 页面本身不是运行参数页面，它维护的是“主表/点表配置”。这些字段应该由点表接口保存，不需要再映射到主表地址：

| UI 字段 | JSON 字段 | 来源 | 说明 |
| --- | --- | --- | --- |
| 信号名称 | `pointName` / `displayNameZh` | 点表配置 | 来自主表 Signal Content 或工程师编辑 |
| 数据类型 | `dataType` | 点表配置 | `UINT16`、`BIT` 等 |
| MODBUS 地址 | `registerAddress` / `bitIndex` | 主表 | 如 `40262`、`40001.14` |
| 功能码 | `functionCode` | 主表/协议 | 当前主表为 Function code 03 |
| 缩放 | `scale` | 主表 Unit | 如 `0.1V` 对应 scale `0.1` |
| 单位 | `unit` | 主表 Unit | 运行接口可输出 UI 标准单位 |
| 通信参数 | `connection` | 工程配置 | 波特率、校验位、站号等 |
| 当前值/质量 | `lastValue` / `quality` | 后端点位测试 | 应由 `/point-test` 或运行数据接口返回 |

## 11. 主表未提供参数汇总

| 参数 | 出现页面 | 建议处理 |
| --- | --- | --- |
| 电功率 / Kilowatts / Power Output | Engine Systems、Trend、Navigation 配置项 | 新增电功率点位，或由电压、电流、功率因数在后端计算 |
| 发电机输出电压 | Engine Systems 底部卡片 | 主表只有控制电源电压，需新增输出电压点位 |
| 电流 | Engine Systems 底部卡片 | 需新增点位 |
| 功率因数 | Engine Systems 底部卡片 | 需新增点位 |
| 负载率 | Main Engine、Engine Systems、Trend | 可由功率/额定功率计算，主表未提供 |
| 燃油流量 | Main Engine 底部卡片 | 需新增燃油流量点位或后端估算 |
| 大气压力 | Engine Systems 剖面图 | 需环境/气象点位或后端常量 |
| 船名、照片、设备序列号、生产编号 | Main Engine | 来自资产/船舶元数据接口 |
| 船首角、GPS、风速风向、船舶姿态、SOG、航线轨迹 | Navigation、Nautical Charts | 来自导航/GPS/气象/NMEA 主表，不属于主发 MODBUS 主表 |
| 报警优先级、确认状态、报警声音状态 | Alarm | 后端报警事件/前端 UI 状态，不是 MODBUS 原始点位 |

## 12. 后端返回 JSON 建议

示例：主表 `Oil Pressure = 40267`，原始值 `420 kPa`，前端需要 `bar`：

```json
{
  "oilPressure": 4.2,
  "points": {
    "GENSET_OIL_PRESSURE": {
      "pointName": "Oil Pressure",
      "registerAddress": 40267,
      "rawValue": 420,
      "rawUnit": "kPa",
      "value": 4.2,
      "unit": "bar",
      "quality": "GOOD",
      "timestamp": "2026-06-30T10:15:00+08:00"
    }
  }
}
```

这样页面可以直接显示 `oilPressure`，工程师也能追溯到主表原始点位。
