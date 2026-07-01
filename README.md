# Marine Dashboard 船机监控前端

这是船机监控大屏前端项目，基于 React / Create React App 构建。当前版本已按前后端分离方式整理数据入口：正式联调时，页面业务数据必须从后端 API 获取；本地 mock 只作为离线演示用途。

## 后端联调环境变量

前端通过 `.env` 配置后端地址和数据源模式：

```bash
REACT_APP_API_BASE_URL=/api/v1
REACT_APP_DATA_SOURCE=backend
REACT_APP_VESSEL_ID=MHM-TierIII-Demo
```

| 环境变量 | 示例 | 说明 |
| --- | --- | --- |
| `REACT_APP_API_BASE_URL` | `/api/v1` | 后端 API 基础地址。同域部署时使用 `/api/v1`；前后端分离部署时填写完整后端地址。 |
| `REACT_APP_DATA_SOURCE` | `backend` | 数据源模式。正式联调和生产环境使用 `backend`；离线演示才使用 `mock`。 |
| `REACT_APP_VESSEL_ID` | `MHM-TierIII-Demo` | 当前船舶 ID，前端会用它拼接 `/vessels/{vesselId}/...` 接口。 |

同域部署示例：

```bash
REACT_APP_API_BASE_URL=/api/v1
REACT_APP_DATA_SOURCE=backend
REACT_APP_VESSEL_ID=MHM-TierIII-Demo
```

前后端分离部署示例：

```bash
REACT_APP_API_BASE_URL=http://127.0.0.1:8080/api/v1
REACT_APP_DATA_SOURCE=backend
REACT_APP_VESSEL_ID=MHM-TierIII-Demo
```

离线演示模式：

```bash
REACT_APP_DATA_SOURCE=mock
```

## 数据接口标准

后端联调必须参考以下文档：

- [前后端分离 JSON/API 标准](docs/frontend-backend-json-api-standard.md)
- [UI 参数主表映射清单](docs/page-parameter-master-table-mapping.md)

其中 `UI 参数主表映射清单` 已包含：

- 每个 UI 参数对应的后端接口字段，例如 `data.engines.{engineId}.rpm`。
- 对应的主表 `Signal Content`、`485 Address Code`、单位和换算规则。
- 主表没有的参数说明，例如电功率、电流、功率因数、GPS、风速风向等。
- 推断匹配项说明，例如 `Fuel Delivery Pressure` 暂映射到主表 `Fuel Pressure`。

前端主要数据入口已集中在：

- `src/api/client.js`
- `src/api/contracts.js`
- `src/api/useApiResource.js`
- `src/hooks/useRealTimeData.js`

页面组件不应直接拼接接口 URL，也不应直接写正式业务 mock。

## 主要接口

当前前端会使用以下后端接口：

```http
GET  /api/v1/vessels/{vesselId}/realtime
GET  /api/v1/vessels/{vesselId}/engines
GET  /api/v1/vessels/{vesselId}/navigation
GET  /api/v1/vessels/{vesselId}/alarms?includeHistory=true
POST /api/v1/vessels/{vesselId}/alarms/{alarmId}/acknowledge
GET  /api/v1/vessels/{vesselId}/system-status
GET  /api/v1/vessels/{vesselId}/trend
```

配置页点表接口：

```http
GET  /api/v1/vessels/{vesselId}/devices/{deviceId}/point-table-versions
GET  /api/v1/vessels/{vesselId}/devices/{deviceId}/point-tables/{version}
POST /api/v1/vessels/{vesselId}/devices/{deviceId}/point-tables
POST /api/v1/vessels/{vesselId}/devices/{deviceId}/point-test
POST /api/v1/vessels/{vesselId}/devices/{deviceId}/point-tables/{version}/validate
POST /api/v1/vessels/{vesselId}/devices/{deviceId}/point-tables/{version}/apply
POST /api/v1/vessels/{vesselId}/devices/{deviceId}/point-tables/{version}/rollback
```

## 本地运行

安装依赖后启动开发服务：

```bash
npm start
```

默认访问地址：

```text
http://localhost:3000
```

生产构建：

```bash
npm run build
```

生产部署构建：

```bash
npm run build:deploy
```

`build:deploy` 会先生成生产包，再删除构建产物中未被当前页面引用的旧发动机源模型，保留实际加载的 `main_engine_model/engine-draco.glb` 和 Draco 解码文件，减少上传体积。

测试：

```bash
npm test
```

## 阿里云生产部署建议

公网部署不要直接使用 `npm start`。`npm start` 是开发服务器，静态资源默认 `max-age=0`，模型、视频每次打开都会重新校验或下载，公网访问会明显变慢。

当前公网地址 `http://8.130.14.1:3000` 如果响应头里看到 `X-Powered-By: Express` 和 `Cache-Control: public, max-age=0`，说明线上仍在用开发服务或未配置缓存的静态服务。正式部署后，大模型和视频资源应该由 Nginx 返回长期缓存头。

推荐流程：

```bash
npm ci
npm run build:deploy
sudo mkdir -p /var/www/marine-dashboard/build
sudo rsync -a --delete build/ /var/www/marine-dashboard/build/
```

然后用 Nginx 托管 `build` 目录。参考配置：

[Nginx 部署配置示例](deploy/nginx-marine-dashboard.conf)

如果使用 80 端口：

```bash
sudo cp deploy/nginx-marine-dashboard.conf /etc/nginx/conf.d/marine-dashboard.conf
sudo nginx -t
sudo systemctl reload nginx
```

访问地址改为：

```text
http://8.130.14.1
```

如果必须继续使用 `:3000`：

```bash
sudo lsof -i :3000
sudo systemctl stop marine-dashboard  # 如果项目是用 systemd 启动的，按实际服务名调整
```

然后把 Nginx 配置中的 `listen 80;` 改成 `listen 3000;`，再执行：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

发布后验证：

```bash
curl -I http://8.130.14.1/main_engine_model/engine-draco.glb
curl -I http://8.130.14.1/draco/gltf/draco_decoder.wasm
curl -I http://8.130.14.1/6028721-hd_1920_1080_25fps.mp4
```

正确结果应满足：

1. `engine-draco.glb` 返回模型文件，不应返回 `text/html`。
2. 静态资源返回 `Cache-Control: public, max-age=2592000` 或更长缓存。
3. `index.html` 返回 `no-cache`，方便前端发版后刷新入口文件。

部署重点：

1. `/static`、`.glb`、`.gltf`、`.bin`、`.wasm`、`.mp4`、图片等静态资源必须开启长期缓存。
2. `index.html` 不要长期缓存，方便发版后刷新入口。
3. 前端路由需要 `try_files $uri /index.html`。
4. 开启 `gzip`，JS/CSS/JSON/SVG/GLTF 文本资源会更快。
5. 主机模型已经改为 Draco 压缩模型，`engine.glb` 约 60MB，`engine-draco.glb` 约 2.9MB，线上必须发布新文件。
6. 视频在前端已改为点击后加载，仍建议后续把 4K/1080p 源视频转成更小的 720p/WebM/MP4 版本。

## 联调注意事项

1. 后端返回必须使用统一 JSON envelope，详见 API 标准文档。
2. 实时数据必须包含 `timestamp`、`quality`、`source`。
3. 主表里压力单位多为 `kPa`，UI 标准单位是 `bar`，后端应完成换算后再返回页面字段。
4. 报警判断由船端或后端完成，前端只展示报警事件，不在 UI 端配置阈值。
5. 后端字段路径以映射清单 `2.1 后端接口字段总表` 为准。
6. 主表没有的参数已在映射清单中标注，需要由其他主表、资产接口或后端计算提供。
