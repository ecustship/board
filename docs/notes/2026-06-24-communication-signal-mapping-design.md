# Communication & Signal Mapping UI Design

## Background

The vessel-side signals, including alarm signals, are delivered to the dashboard through data communication. The UI does not generate alarm decisions from local thresholds. The vessel controller, PLC, or genset controller has already completed signal acquisition and alarm judgement. The dashboard only reads the configured MODBUS/RS485 data points, maps them to UI variables, and displays their current values or alarm states.

The reference protocol file is `Main Genset RS485 Communication protocolsV3(1).xls`. The main sheet is `1550KW主发`. It contains an analog signal section and an alarm signal section. Both use MODBUS function code `03`. The protocol metadata in the sheet indicates `Modbus RTU`, baud rate `9600`, `8` data bits, no parity, and `2` stop bits.

## Scope

The configuration page is intended for engineers. It should behave like a signal mapping workstation rather than a simplified operator popup.

The UI supports:

- MODBUS communication parameter setup.
- Signal point mapping from protocol table fields to dashboard variables.
- Vessel-side alarm bit mapping.
- Live communication/debug status.
- Import/export entry points for protocol sheets and system configuration.

The UI does not support:

- UI-side alarm threshold judgement.
- Alarm condition calculation from analog values.
- Alarm delay/recovery delay logic.
- Shutdown or protection logic.
- Replacing vessel-side PLC/controller alarm decisions.

## Page Location

Add a new section under the existing `Configuration` page:

- Chinese label: `通信映射`
- English label: `Signal Mapping`
- Full page title: `通信与信号映射` / `Communication & Signal Mapping`

This section is implemented as a full workspace inside the configuration page instead of a small modal, because engineers need table scanning, batch editing, import/export, and live communication checks.

## Layout

The workspace contains:

- Top action bar.
- Engineering status cards.
- Four tabs.
- Table/detail panels depending on the active tab.

Top actions:

- `导入 Excel` / `Import Excel`
- `导出配置` / `Export`
- `测试通信` / `Test Link`
- `保存并应用` / `Save & Apply`

Status cards:

- Protocol.
- Port.
- Communication frame.
- Signal count.
- Active alarm count.

The status area gives the engineer an immediate overview of whether the current configuration matches the expected protocol.

## Tabs

### 1. Communication Parameters

This tab configures how the dashboard communicates with the vessel-side device.

Fields:

- Protocol: `MODBUS RTU` or `MODBUS TCP`.
- Port: `RS485-1`, `RS485-2`, `/dev/ttyUSB0`, or custom.
- Baud rate: default `9600`.
- Data bits: default `8`.
- Parity: default `None`.
- Stop bits: default `2`.
- Default function code: default `03`.
- Byte order: `ABCD`, `BADC`, `CDAB`, `DCBA`.
- Address base: `1-based` or `0-based`.
- Slave ID.
- Poll interval in milliseconds.
- Timeout in milliseconds.
- Retry count.

The default values should be initialized from the reference protocol sheet:

```text
Format: Modbus RTU
Baud Rate: 9600
Start bit: 1-bit
Data bit: 8-bit
Parity bit: No parity
Stop bit: 2-bit
Function code: 03
```

### 2. Signal Table

This tab maps analog and status signals from the protocol sheet to dashboard variables.

The reference sheet fields map as follows:

- `NO.` -> sequence number.
- `Signal Content` -> English signal name.
- `485 Address Code` -> register address and optional bit index.
- `Range` -> raw/engineering range.
- `Unit` -> scale and engineering unit.
- `Note` -> note.

UI columns:

- Enabled.
- Sequence number.
- Signal name.
- Chinese name.
- Variable key.
- Device group.
- Signal type.
- Function code.
- Register address.
- Bit index.
- Data type.
- Register count.
- Byte order.
- Raw range.
- Unit.
- Scale.
- Offset.
- Decimal places.
- Current value.
- Quality status.
- Page binding.
- Trend recording.
- Note.

Example mapping:

```text
Engine Speed / 40262 / 0-3000 / 1rpm
```

becomes:

```text
name: Engine Speed
zhName: 发动机转速
variableKey: genset.engineSpeed
functionCode: 03
address: 40262
dataType: UInt16
scale: 1
unit: rpm
range: 0-3000
pageBinding: Main Engine / Engine System
trend: enabled
```

Address parsing:

- `40262` is a full register value.
- `40001.8` is register `40001`, bit `8`.

Bit-style addresses should automatically set the data type to Boolean unless manually overridden.

### 3. Alarm Mapping

This tab maps vessel-side alarm bits to dashboard alarm display entries.

Important rule:

The dashboard does not decide whether an alarm exists. The vessel-side controller provides alarm states through MODBUS registers/bits. The UI only maps these bits to names and display behavior.

The reference alarm fields map as follows:

- `NO.` -> sequence number.
- `Signal Content` -> alarm name.
- `485 Address Code` -> register address and bit index.
- `Set value` -> engineering reference only.
- `Alarm state` -> trigger state, usually `1`.
- `Note` -> note.

UI columns:

- Enabled.
- Sequence number.
- Alarm name.
- Chinese name.
- Variable key.
- Register address.
- Bit index.
- Function code.
- Trigger state.
- Current state.
- Sound enabled.
- Display target.
- Note.

Example mapping:

```text
Common Alarm / 40001.0 / Alarm state = 1
```

becomes:

```text
name: Common Alarm
zhName: 综合报警
variableKey: genset.commonAlarm
address: 40001
bit: 0
functionCode: 03
triggerState: 1
display: Global Banner / Alarm Page
sound: enabled
```

The `Set value` column may be shown as reference text but must not be used to create UI-side alarm rules.

### 4. Live Debug

This tab is for field commissioning.

It should show:

- Connection state.
- Last poll time.
- Response time.
- Success rate.
- Timeout count.
- CRC error count.
- Raw TX/RX frames.
- Manual read test.

This tab helps engineers confirm whether a wrong UI value is caused by mapping, byte order, unit conversion, address offset, or communication failure.

## Data Model

The page should eventually persist a JSON-like configuration.

Communication config:

```json
{
  "protocol": "MODBUS RTU",
  "port": "RS485-1",
  "baudRate": 9600,
  "dataBits": 8,
  "parity": "None",
  "stopBits": 2,
  "slaveId": 1,
  "pollInterval": 1000,
  "timeout": 1000,
  "retries": 3,
  "byteOrder": "ABCD",
  "addressBase": "1-based"
}
```

Signal mapping:

```json
{
  "enabled": true,
  "name": "Engine Speed",
  "zhName": "发动机转速",
  "variableKey": "genset.engineSpeed",
  "functionCode": "03",
  "address": 40262,
  "bit": null,
  "dataType": "UInt16",
  "scale": 1,
  "offset": 0,
  "unit": "rpm",
  "decimals": 0,
  "pageBinding": ["Main Engine", "Engine System"],
  "trend": true
}
```

Alarm mapping:

```json
{
  "enabled": true,
  "name": "Common Alarm",
  "zhName": "综合报警",
  "variableKey": "genset.commonAlarm",
  "functionCode": "03",
  "address": 40001,
  "bit": 0,
  "triggerState": 1,
  "sound": true,
  "displayTargets": ["Global Banner", "Alarm Page"]
}
```

## Runtime Data Flow

The runtime flow should be:

```text
Vessel controller / PLC / genset module
  -> MODBUS/RS485 registers and bits
  -> Communication reader
  -> Signal decoder
  -> Signal variable store
  -> Dashboard pages, alarm banner, alarm page, trend page
```

Alarm flow:

```text
Vessel-side alarm bit
  -> MODBUS read
  -> Alarm mapping lookup
  -> UI display and sound behavior
```

There is no UI-side alarm judgement step.

## Engineering Validation Rules

The UI should help detect mapping mistakes:

- Duplicate variable keys.
- Duplicate address and bit combinations.
- Invalid bit index.
- Missing function code.
- Unknown unit.
- Unmapped page binding.
- Inconsistent data type and address format.
- Address base mismatch.
- Possible byte order issue.

These should be warnings, not blockers, because engineers may intentionally keep partial mappings during commissioning.

## Implementation Phases

### Phase 1: UI Prototype

- Add the configuration workspace.
- Add communication parameter fields.
- Add signal table.
- Add alarm mapping table.
- Add live debug placeholder.
- Use static protocol-derived sample rows.

### Phase 2: Local Persistence

- Add a hook such as `useSignalMappingConfig`.
- Store config in `localStorage`.
- Add reset/default config.
- Add save/apply behavior.

### Phase 3: Import/Export

- Support Excel or CSV import.
- Parse analog and alarm sections.
- Preview field mapping before applying.
- Export current config to JSON and Excel.

### Phase 4: Runtime Integration

- Build a signal variable store.
- Bind dashboard pages to `variableKey`.
- Bind alarm banner and alarm page to alarm mapping states.
- Keep focus mode/silent mode as UI behavior only.

### Phase 5: Real MODBUS Integration

- Connect to actual RTU/TCP reader.
- Poll configured registers.
- Decode values.
- Update quality state and debug logs.

## Current Implementation Notes

The current prototype is implemented in `src/ConfigPage.jsx` under the new `signals` section. It is a UI-only prototype using static rows derived from the reference protocol sheet. It does not yet persist edits, import Excel, or connect to real MODBUS communication.
