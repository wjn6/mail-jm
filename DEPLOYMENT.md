# 部署说明（项目本身）

本文件描述当前仓库的部署与访问方式。  
`API_REFERENCE.md` 仅用于上游 **GongXi API** 参考，不是本项目部署说明。

## 1. 推荐方式：Docker Compose

```bash
# 可选：复制模板后按需修改
# cp .env.example .env

docker compose up -d --build
```

说明：
- 后端容器启动时会自动初始化数据库结构（优先 `prisma migrate deploy`，无 migration 时回退 `prisma db push`）并执行 `seed`。
- 不需要再手动执行 `docker exec ... migrate/seed`。

## 2. 访问地址（本地常用）

- 前端：`http://localhost`
- 后端 API：`http://localhost:3001/auth/login`
- Swagger：`http://localhost:3001/api-docs`
- Health：`http://localhost:3001/health`

说明：
- 前端 Nginx 仍可反向代理后端接口。
- 如果你更习惯统一入口，也可使用 `http://localhost/api-docs`、`http://localhost/health`。

## 3. 端口说明

- `80`：前端入口（对外）
- `3001`：后端服务（对外，便于本地直连调试）
- `5432`：PostgreSQL（仅容器内访问，不对外暴露）
- `6379`：Redis（仅容器内访问，不对外暴露）

## 4. 关键环境变量

- `JWT_SECRET` / `JWT_ADMIN_SECRET`：生产环境必须替换成安全值
- `CORS_ORIGIN`：默认 `http://localhost`
- `SWAGGER_ENABLED`：控制是否启用 Swagger（默认 `true`）

## 5. 常见排查

- `http://localhost` 打不开：先看 `docker compose ps`
- Swagger 404：确认 `SWAGGER_ENABLED=true`
- 后端未就绪：看 `email-platform-backend` 日志中 migrate/seed 是否失败
