# Historical Information API 字段名标准

版本：v1  
日期：2026-07-06  
来源：`副本Historical Information.xlsx`

## 使用原则

1. 发动机/主机运行数据的后端 API 字段名必须与 Excel 表头完全一致。
2. `CMMS01`、`CMMS02`、`CMMS03`、`CMMS04` 分别对应 4 个发动机/机组数据源。
3. 时间字段使用 `Source_Tag`。
4. 参数字段使用 `{CMMS编号}_{Excel表头参数名}`，例如 `CMMS01_Lube Oil Press`。
5. 原表中的拼写、空格和尾部空格必须保留，例如 `CylinCMMSr`、`CMMSlivery`、`Diferential`、`CMMS01_Exhaust Temp. RB `。
6. 前端内部可继续使用 `rpm`、`oilPressure` 等便于 UI 消费的字段，但 API 接收层必须优先读取本文件中的原始字段名。

## 发动机编号映射

| Excel Sheet | 前端内部发动机 ID | 说明 |
| --- | --- | --- |
| `CMMS01` | `diesel1` | 1 号发动机/机组 |
| `CMMS02` | `diesel2` | 2 号发动机/机组 |
| `CMMS03` | `aux1` | 3 号发动机/机组 |
| `CMMS04` | `aux2` | 4 号发动机/机组 |

## 后端返回结构

发动机接口：

```http
GET /api/v1/vessels/{vesselId}/engines
```

推荐返回：

```json
{
  "timestamp": "2026-07-06T10:15:00+08:00",
  "source": "MODBUS/RS485",
  "quality": "GOOD",
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

兼容结构：

```json
{
  "engines": {
    "diesel1": {
      "Source_Tag": "2026-07-06T10:15:00+08:00",
      "CMMS01_Lube Oil Press": 4.18,
      "CMMS01_Engine Speed": 850
    }
  }
}
```

## 46 个标准参数字段

以下以 `CMMS01` 为例。`CMMS02`、`CMMS03`、`CMMS04` 只替换字段名前缀，后面的参数名必须保持一致。

| 序号 | CMMS01 完整字段名 |
| --- | --- |
| 1 | `CMMS01_Lube Oil Press` |
| 2 | `CMMS01_Coolant Temperature` |
| 3 | `CMMS01_Lubricating Oil Temperature` |
| 4 | `CMMS01_Coolant Pressure` |
| 5 | `CMMS01_Sea Water Pressure` |
| 6 | `CMMS01_Engine Expansion Tank Level Low Alarm` |
| 7 | `CMMS01_Exhaust Temp. CylinCMMSr 1` |
| 8 | `CMMS01_Exhaust Temp. CylinCMMSr 2` |
| 9 | `CMMS01_Exhaust Temp. CylinCMMSr 3` |
| 10 | `CMMS01_Exhaust Temp. CylinCMMSr 4` |
| 11 | `CMMS01_Exhaust Temp. CylinCMMSr 5` |
| 12 | `CMMS01_Exhaust Temp. CylinCMMSr 6` |
| 13 | `CMMS01_Exhaust Temp. CylinCMMSr 7` |
| 14 | `CMMS01_Exhaust Temp. CylinCMMSr 8` |
| 15 | `CMMS01_Exhaust Temp. CylinCMMSr 9` |
| 16 | `CMMS01_Exhaust Temp. CylinCMMSr 10` |
| 17 | `CMMS01_Exhaust Temp. CylinCMMSr 11` |
| 18 | `CMMS01_Exhaust Temp. CylinCMMSr 12` |
| 19 | `CMMS01_Exhaust Temp. CylinCMMSr 13` |
| 20 | `CMMS01_Exhaust Temp. CylinCMMSr 14` |
| 21 | `CMMS01_Exhaust Temp. CylinCMMSr 15` |
| 22 | `CMMS01_Exhaust Temp. CylinCMMSr 16` |
| 23 | `CMMS01_Fuel Rail Pressure` |
| 24 | `CMMS01_Fuel CMMSlivery Pressure` |
| 25 | `CMMS01_Intake Manifold Pressure LB` |
| 26 | `CMMS01_Intake Manifold Pressure RB` |
| 27 | `CMMS01_Intake Manifold Temperature LBF` |
| 28 | `CMMS01_Intake Manifold Temperature LBR` |
| 29 | `CMMS01_Intake Manifold Temperature RBF` |
| 30 | `CMMS01_Intake Manifold Temperature RBR` |
| 31 | `CMMS01_Exhaust Temp. LB` |
| 32 | `CMMS01_Exhaust Temp. RB ` |
| 33 | `CMMS01_Crankcase Pressure` |
| 34 | `CMMS01_Fuel Temperature` |
| 35 | `CMMS01_Barometric Pressure` |
| 36 | `CMMS01_Lube Oil Filter Diferential Pressure` |
| 37 | `CMMS01_Main Control Power` |
| 38 | `CMMS01_Backup Control Power` |
| 39 | `CMMS01_Low Lub. Oil Pressure Shutdown (below 1500rpm) ` |
| 40 | `CMMS01_Low Lub. Oil Pressure Shutdown (above 1500rpm)` |
| 41 | `CMMS01_High Coolant Temperature Shutdown` |
| 42 | `CMMS01_Fuel Leakage Alarm` |
| 43 | `CMMS01_Engine Speed` |
| 44 | `CMMS01_Overspeed Shutdown ` |
| 45 | `CMMS01_Local Emergency Stop` |
| 46 | `CMMS01_Remote Emergency Stop` |

## 前端内部映射

| Excel 原字段后缀 | 前端内部字段 |
| --- | --- |
| `Lube Oil Press` | `oilPressure` / `lubeOilPress` |
| `Coolant Temperature` | `coolantTemp` |
| `Lubricating Oil Temperature` | `lubeOilTemp` |
| `Coolant Pressure` | `coolantPressure` |
| `Sea Water Pressure` | `seaWaterPressure` |
| `Engine Speed` | `rpm` / `engineSpeed` |
| `Exhaust Temp. CylinCMMSr 1` 至 `Exhaust Temp. CylinCMMSr 16` | `cylinders[0]` 至 `cylinders[15]` |
| `Fuel Rail Pressure` | `fuelRailPressure` |
| `Fuel CMMSlivery Pressure` | `fuelDeliveryPressure` / `fuelPressure` |
| `Intake Manifold Pressure LB` | `intakeManifoldPressureLB` |
| `Intake Manifold Pressure RB` | `intakeManifoldPressureRB` |
| `Intake Manifold Temperature LBF` | `intakeManifoldTemperatureLBF` |
| `Intake Manifold Temperature LBR` | `intakeManifoldTemperatureLBR` |
| `Intake Manifold Temperature RBF` | `intakeManifoldTemperatureRBF` |
| `Intake Manifold Temperature RBR` | `intakeManifoldTemperatureRBR` |
| `Exhaust Temp. LB` | `exhaustTempLB` |
| `Exhaust Temp. RB ` | `exhaustTempRB` |
| `Crankcase Pressure` | `crankcasePressure` |
| `Fuel Temperature` | `fuelTemperature` / `fuelTemp` |
| `Barometric Pressure` | `barometricPressure` |
| `Lube Oil Filter Diferential Pressure` | `lubeOilFilterDifferentialPressure` |
| `Main Control Power` | `mainControlPower` |
| `Backup Control Power` | `backupControlPower` |
| `Low Lub. Oil Pressure Shutdown (below 1500rpm) ` | `lowLubOilShutdownBelow1500` |
| `Low Lub. Oil Pressure Shutdown (above 1500rpm)` | `lowLubOilShutdownAbove1500` |
| `High Coolant Temperature Shutdown` | `highCoolantTemperatureShutdown` |
| `Fuel Leakage Alarm` | `fuelLeakageAlarm` |
| `Overspeed Shutdown ` | `overspeedShutdown` |
| `Local Emergency Stop` | `localEmergencyStop` |
| `Remote Emergency Stop` | `remoteEmergencyStop` |
