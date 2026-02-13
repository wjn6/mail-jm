# 部署说明（项目本身）

本文件描述当前仓库的部署与访问方式。  
`API_REFERENCE.md` 仅用于上游 **GongXi API** 参考，不是本项目部署说明。

## 1. 推荐方式：Docker Compose

```bash
docker compose up -d --build
```

说明：
- 后端容器启动时会自动执行 `prisma migrate deploy` 和 `seed`。
- 不需要再手动执行 `docker exec ... migrate/seed`。

## 2. 访问地址（统一入口）

- 前端：`http://localhost`
- Swagger：`http://localhost/api-docs`
- Health：`http://localhost/health`

说明：
- 前端 Nginx 统一反向代理后端接口。
- 后端容器内部端口为 `3001`，默认不直接暴露到宿主机。

## 3. 端口说明

- `80`：前端入口（对外）
- `3001`：后端服务（容器内）
- `5432`：PostgreSQL（当前 compose 对外暴露）
- `6379`：Redis（当前 compose 对外暴露）

如果你希望更安全，可以把 `5432/6379` 也改为仅容器内访问。

## 4. 关键环境变量

- `JWT_SECRET` / `JWT_ADMIN_SECRET`：生产环境必须替换成安全值
- `CORS_ORIGIN`：默认 `http://localhost`
- `SWAGGER_ENABLED`：控制是否启用 Swagger（默认 `true`）

## 5. 常见排查

- `http://localhost` 打不开：先看 `docker compose ps`
- Swagger 404：确认 `SWAGGER_ENABLED=true`
- 后端未就绪：看 `email-platform-backend` 日志中 migrate/seed 是否失败
