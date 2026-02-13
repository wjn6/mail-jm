# 邮箱接码平台 - 后端

基于 NestJS + Prisma + PostgreSQL + Redis 的邮箱接码平台后端服务。

## 技术栈

- **框架**: NestJS 10 + TypeScript
- **ORM**: Prisma
- **数据库**: PostgreSQL
- **缓存**: Redis (ioredis)
- **认证**: JWT + bcrypt
- **实时通信**: Socket.IO
- **文档**: Swagger

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

复制 `.env` 文件并修改配置：

```bash
cp .env .env.local
```

### 3. 初始化数据库

```bash
# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev --name init

# 填充初始数据
npx ts-node prisma/seed.ts
```

### 4. 启动服务

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run build
npm run start:prod
```

### 5. 访问

- API 地址: `http://localhost:3001`
- Swagger 文档: `http://localhost:3001/api-docs`

## API 概览

### 用户端
- `POST /auth/register` - 注册
- `POST /auth/login` - 登录
- `GET /user/dashboard` - 工作台数据
- `POST /user/task/get-email` - 获取邮箱
- `POST /user/task/get-code` - 获取验证码
- `GET /user/projects` - 项目列表

### Gateway (API Key 鉴权)
- `GET /gateway/get-email` - 获取邮箱
- `GET /gateway/get-code` - 获取验证码
- `POST /gateway/release` - 释放邮箱

### 管理端
- `POST /admin/auth/login` - 管理员登录
- `GET /admin/dashboard/stats` - 仪表盘统计
- `GET /admin/users` - 用户管理
- `GET /admin/orders` - 订单管理
