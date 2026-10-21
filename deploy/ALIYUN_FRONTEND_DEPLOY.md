# 阿里云岸端前端部署

这个目录是 React 生产静态包的配套配置。生产构建使用以下运行参数：

- `REACT_APP_API_BASE_URL=/api/v1`
- `REACT_APP_COLLECTOR_API_BASE_URL=/collector`
- `REACT_APP_DATA_SOURCE=backend`
- `REACT_APP_DEMO_FLUCTUATION=false`
- `REACT_APP_TREND_DEMO_FALLBACK=false`
- `REACT_APP_AUTH_REQUIRED=true`
- `REACT_APP_VESSEL_ID=MHM-TierIII-Demo`

## 上传和解压

将压缩包上传到服务器后执行：

```bash
sudo mkdir -p /var/www/marine-dashboard
sudo unzip -o marine-dashboard-shore.zip -d /var/www/marine-dashboard
sudo chown -R root:root /var/www/marine-dashboard
```

压缩包解开后应存在 `/var/www/marine-dashboard/build/index.html`。

## Nginx

安装并启动 Nginx：

```bash
sudo dnf install -y nginx || sudo yum install -y nginx
sudo cp deploy/nginx-marine-dashboard.conf /etc/nginx/conf.d/marine-dashboard.conf
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx
```

配置会把：

- `/api/*` 转发到 Go 后端 `127.0.0.1:8080`
- `/collector/*` 转发到 Java 采集服务 `127.0.0.1:8081`
- 其余请求作为静态文件从 `build` 目录返回，并支持 React history 路由

先确认后端服务已在服务器本机监听：

```bash
curl -f http://127.0.0.1:8080/health
curl -f http://127.0.0.1:8081/api/v1/ship/health
```

## 阿里云安全组

安全组只需要放行：

- TCP `80`（HTTP）
- TCP `443`（配置 HTTPS 后）
- TCP `22`（SSH，建议限制为办公出口 IP）

不要把 `8080`、`8081` 暴露到公网；Nginx 通过本机回环地址访问它们。

## 验证

```bash
curl -I http://服务器公网IP/
curl -I http://服务器公网IP/main_engine_model/engine-optimized.glb
curl -I http://服务器公网IP/draco/gltf/draco_decoder.wasm
```

浏览器访问 `http://服务器公网IP/`。如果页面能打开但提示后端离线，先看：

```bash
sudo systemctl status nginx
sudo journalctl -u nginx -n 100 --no-pager
ss -lntp | grep -E ':80|:8080|:8081'
```

生产环境建议随后使用阿里云域名和免费 SSL 证书，将 Nginx 的 `listen 80` 改为 HTTPS 配置，并把 HTTP 重定向到 HTTPS。
