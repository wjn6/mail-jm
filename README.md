# 邮箱接码平台

一个完整的付费邮箱接码系统，用户注册充值后可通过网页或 API 获取临时邮箱、接收验证码，按次扣费。

## 系统架构

```
用户/脚本 --> [邮箱接码平台] --> [上游: GongXi Mail API]
                              --> [上游: 其他邮箱源(可扩展)]
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + TypeScript + Vite + Element Plus (art-design-pro 3.0.1) |
| 后端 | NestJS + TypeScript |
| ORM | Prisma |
| 数据库 | PostgreSQL |
| 缓存 | Redis |
| 实时通信 | Socket.IO |
| 容器化 | Docker + Docker Compose |

## 功能概览

### 用户端
- 注册/登录系统
- 获取临时邮箱 + 接收验证码（核心功能）
- 项目管理 + API Key
- 充值中心 + 消费记录
- 任务历史
- 个人设置

### 管理端
- 仪表盘（统计概览 + 趋势图）
- 用户管理（列表/充值/禁用）
- 订单管理
- 上游邮箱源管理
- 财务管理
- 计费规则设置
- 公告管理
- 管理员管理

### Gateway API（对外接口）
- `GET /gateway/get-email` — 获取邮箱
- `GET /gateway/get-code` — 获取验证码
- `GET /gateway/check-mail` — 查看邮件
- `POST /gateway/release` — 释放邮箱
- `GET /gateway/balance` — 查询余额

## 快速开始

文档说明：
- 项目部署与端口说明见 `DEPLOYMENT.md`
- 上游 GongXi API 参考见 `API_REFERENCE.md`

### 方式一：Docker Compose（推荐）

```bash
# 1. 修改 docker-compose.yml 中的环境变量
# 2. 启动所有服务
docker compose up -d --build

# 3. 初始化数据库
# migrate + seed run automatically when backend container starts

# 4. 访问
# 前端: http://localhost
# 后端 API: http://localhost/auth/login
# Swagger 文档: http://localhost/api-docs
# Health: http://localhost/health
```

### 方式二：本地开发

#### 后端

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
npm run start:dev
```

#### 前端

```bash
cd frontend
pnpm install
pnpm dev
```

## 默认账号

- **管理员**: admin / admin123456
- **用户**: 自行注册

## 目录结构

```
├── backend/                # 后端 NestJS
│   ├── prisma/             # 数据库模型 + 迁移 + 种子数据
│   ├── src/
│   │   ├── common/         # 公共模块(Prisma/Redis/过滤器/拦截器/守卫/装饰器)
│   │   ├── modules/        # 业务模块
│   │   │   ├── auth/       # 认证(用户+管理员)
│   │   │   ├── user/       # 用户中心
│   │   │   ├── wallet/     # 钱包/扣费
│   │   │   ├── project/    # 项目管理
│   │   │   ├── api-key/    # API Key
│   │   │   ├── task/       # 接码任务(核心)
│   │   │   ├── upstream/   # 上游邮箱源
│   │   │   ├── admin/      # 管理后台
│   │   │   ├── notification/ # WebSocket通知
│   │   │   └── stats/      # 统计
│   │   └── gateway/        # 对外 API 网关
│   └── package.json
├── frontend/               # 前端 Vue 3 (art-design-pro)
│   ├── src/
│   │   ├── api/            # API 接口
│   │   ├── views/          # 页面
│   │   │   ├── dashboard/  # 工作台
│   │   │   ├── task/       # 接码中心
│   │   │   ├── project/    # 项目管理
│   │   │   ├── wallet/     # 财务中心
│   │   │   ├── settings/   # 个人设置
│   │   │   └── admin-panel/# 管理后台
│   │   ├── router/         # 路由
│   │   ├── store/          # 状态管理
│   │   └── types/          # 类型定义
│   └── package.json
├── docker-compose.yml      # Docker 编排
└── API_REFERENCE.md        # 上游 API 文档
```

## 环境变量

参见 `backend/.env` 文件，主要配置项：

| 变量 | 说明 |
|------|------|
| DATABASE_URL | PostgreSQL 连接字符串 |
| REDIS_HOST/PORT | Redis 地址 |
| JWT_SECRET | 用户 JWT 密钥（≥32字符） |
| JWT_ADMIN_SECRET | 管理员 JWT 密钥 |
| GONGXI_BASE_URL | 上游 GongXi API 地址 |
| GONGXI_API_KEY | 上游 API Key |
| DEFAULT_EMAIL_PRICE | 默认单价 |

## License

MIT
