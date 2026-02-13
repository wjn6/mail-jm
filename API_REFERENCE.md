# GongXi Mail API 完整接入文档

本文档面向**第一次接入**本系统的开发者，覆盖管理后台 API 与外部邮件 API，包含鉴权、参数、返回、错误码与接入示例。

---

## 1. 基础信息

- **服务基地址**：`http://<host>:3000`
- **健康检查**：`GET /health`
- **管理后台 API 前缀**：`/admin`
- **外部邮件 API 前缀**：`/api`
- **响应格式**：
  - 成功：`{ "success": true, "data": ... }`
  - 失败：`{ "success": false, "requestId": "...", "error": { "code": "...", "message": "...", "details"?: [...] } }`

---

## 2. 鉴权与安全

### 2.1 管理后台鉴权（JWT）

管理后台接口（`/admin/**`）需要 JWT（登录后获得）：

- Header：`Authorization: Bearer <token>`
- 或 Cookie：`token=<token>`

### 2.2 外部 API 鉴权（API Key）

外部接口（`/api/**`）需要 API Key，支持三种传法：

1. Header：`x-api-key: <sk_xxx>`
2. Header：`Authorization: Bearer <sk_xxx>`
3. Query：`?api_key=<sk_xxx>`

### 2.3 API Key 限流

- 按 Key 限流，单位：每分钟。
- 超限返回：`429 RATE_LIMIT_EXCEEDED`。

### 2.4 登录失败锁定

- 连续失败达到阈值后，账户会短时锁定。
- 错误码：`ACCOUNT_LOCKED`（HTTP 429）。

### 2.5 生产环境要求

- `JWT_SECRET` 必须至少 32 字符。
- `ENCRYPTION_KEY` 必须**恰好 32 字符**。
- 生产环境禁止使用默认 `ADMIN_PASSWORD=admin123`。
- 必须通过外部环境变量注入密钥，不要写死在代码或镜像里。

---

## 3. 枚举约定（前后端统一）

### 3.1 管理员角色

- `SUPER_ADMIN`
- `ADMIN`

### 3.2 通用状态

- `ACTIVE`
- `DISABLED`

### 3.3 邮箱状态

- `ACTIVE`
- `ERROR`
- `DISABLED`

### 3.4 邮件拉取策略（分组级）

- `GRAPH_FIRST`
- `IMAP_FIRST`
- `GRAPH_ONLY`
- `IMAP_ONLY`

---

## 4. 公共错误码（常见）

- `VALIDATION_ERROR`：参数校验失败
- `UNAUTHORIZED` / `INVALID_TOKEN`：未登录或 Token 无效
- `INVALID_API_KEY` / `API_KEY_DISABLED` / `API_KEY_EXPIRED`
- `FORBIDDEN` / `FORBIDDEN_PERMISSION`
- `NOT_FOUND`
- `RATE_LIMIT_EXCEEDED`
- `INTERNAL_ERROR`

业务模块还会返回更具体错误码，详见各接口说明。

---

## 5. 管理后台 API（`/admin`）

## 5.1 认证模块（`/admin/auth`）

### 5.1.1 登录

- **POST** `/admin/auth/login`
- Body:

```json
{
  "username": "admin",
  "password": "your_password",
  "otp": "123456"
}
```

> `otp` 为可选；当管理员启用 2FA 时必填。

返回：

```json
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "admin": {
      "id": 1,
      "username": "admin",
      "role": "SUPER_ADMIN",
      "twoFactorEnabled": true
    }
  }
}
```

常见错误：

- `INVALID_CREDENTIALS` (401)
- `INVALID_OTP` (401)
- `ACCOUNT_DISABLED` (403)
- `ACCOUNT_LOCKED` (429)

### 5.1.2 登出

- **POST** `/admin/auth/logout`

### 5.1.3 当前登录管理员

- **GET** `/admin/auth/me`（JWT）

### 5.1.4 修改密码

- **POST** `/admin/auth/change-password`（JWT）
- Body:

```json
{
  "oldPassword": "old",
  "newPassword": "new_password_6+"
}
```

### 5.1.5 2FA 状态

- **GET** `/admin/auth/2fa/status`（JWT）
- 返回：

```json
{
  "success": true,
  "data": {
    "enabled": false,
    "pending": false,
    "legacyEnv": false
  }
}
```

### 5.1.6 生成 2FA 绑定信息

- **POST** `/admin/auth/2fa/setup`（JWT）
- 返回：

```json
{
  "success": true,
  "data": {
    "secret": "BASE32_SECRET",
    "otpauthUrl": "otpauth://totp/..."
  }
}
```

### 5.1.7 启用 2FA

- **POST** `/admin/auth/2fa/enable`（JWT）
- Body:

```json
{ "otp": "123456" }
```

### 5.1.8 禁用 2FA

- **POST** `/admin/auth/2fa/disable`（JWT）
- Body:

```json
{
  "password": "current_password",
  "otp": "123456"
}
```

---

## 5.2 管理员管理（`/admin/admins`，仅 SUPER_ADMIN）

### 5.2.1 列表

- **GET** `/admin/admins?page=1&pageSize=10&keyword=xxx`

### 5.2.2 详情

- **GET** `/admin/admins/:id`

### 5.2.3 创建

- **POST** `/admin/admins`
- Body:

```json
{
  "username": "operator1",
  "password": "123456",
  "email": "op@example.com",
  "role": "ADMIN"
}
```

### 5.2.4 更新

- **PUT** `/admin/admins/:id`
- Body（可选字段）：

```json
{
  "username": "new_name",
  "password": "new_password",
  "email": "new@example.com",
  "role": "SUPER_ADMIN",
  "status": "ACTIVE",
  "twoFactorEnabled": false
}
```

### 5.2.5 删除

- **DELETE** `/admin/admins/:id`

---

## 5.3 API Key 管理（`/admin/api-keys`）

### 5.3.1 列表

- **GET** `/admin/api-keys?page=1&pageSize=10&status=ACTIVE&keyword=xxx`

### 5.3.2 创建

- **POST** `/admin/api-keys`
- Body:

```json
{
  "name": "third-party-A",
  "rateLimit": 120,
  "expiresAt": "2026-12-31T23:59:59.000Z",
  "permissions": {
    "get_email": true,
    "mail_new": true
  },
  "allowedGroupIds": [1, 2],
  "allowedEmailIds": [101, 102]
}
```

说明：

- `permissions` 留空表示不做动作级限制（默认可访问全部动作）。
- `allowedGroupIds` / `allowedEmailIds`：
  - 未传：不改限制（创建时即不限）。
  - 传空数组：清空限制（恢复不限）。

返回（仅创建时返回完整 Key）：

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "third-party-A",
    "keyPrefix": "sk_abcd",
    "rateLimit": 120,
    "status": "ACTIVE",
    "expiresAt": "2026-12-31T23:59:59.000Z",
    "allowedGroupIds": [1, 2],
    "allowedEmailIds": [101, 102],
    "createdAt": "2026-02-13T00:00:00.000Z",
    "key": "sk_xxxxxxxxxxxxxxxxx"
  }
}
```

### 5.3.3 详情

- **GET** `/admin/api-keys/:id`

### 5.3.4 更新

- **PUT** `/admin/api-keys/:id`
- Body（可选字段）：

```json
{
  "name": "new-name",
  "rateLimit": 60,
  "status": "DISABLED",
  "expiresAt": null,
  "permissions": {
    "all": true
  },
  "allowedGroupIds": [1],
  "allowedEmailIds": []
}
```

### 5.3.5 删除

- **DELETE** `/admin/api-keys/:id`

### 5.3.6 邮箱池统计（注意：此接口名是 usage）

- **GET** `/admin/api-keys/:id/usage?group=<groupName>`
- 返回：

```json
{
  "success": true,
  "data": {
    "total": 100,
    "used": 10,
    "remaining": 90
  }
}
```

### 5.3.7 重置邮箱池

- **POST** `/admin/api-keys/:id/reset-pool`
- Body:

```json
{ "group": "group_name" }
```

### 5.3.8 查询邮箱使用状态列表

- **GET** `/admin/api-keys/:id/pool-emails?groupId=1`

返回示例：

```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "email": "a@outlook.com",
      "used": true,
      "groupId": 1,
      "groupName": "US"
    }
  ]
}
```

### 5.3.9 批量更新邮箱使用状态（事务 + 差量）

- **PUT** `/admin/api-keys/:id/pool-emails`
- Body:

```json
{
  "emailIds": [101, 102, 103],
  "groupId": 1
}
```

返回示例：

```json
{
  "success": true,
  "data": {
    "success": true,
    "count": 3,
    "added": 1,
    "removed": 2
  }
}
```

---

## 5.4 邮箱分组管理（`/admin/email-groups`）

### 5.4.1 列表

- **GET** `/admin/email-groups`

### 5.4.2 详情

- **GET** `/admin/email-groups/:id`

### 5.4.3 创建

- **POST** `/admin/email-groups`
- Body:

```json
{
  "name": "US",
  "description": "US pool",
  "fetchStrategy": "GRAPH_FIRST"
}
```

### 5.4.4 更新

- **PUT** `/admin/email-groups/:id`

### 5.4.5 删除

- **DELETE** `/admin/email-groups/:id`

> 删除分组时，该组下邮箱的 `groupId` 会自动置空。

### 5.4.6 批量分配邮箱到分组

- **POST** `/admin/email-groups/:id/assign`
- Body:

```json
{ "emailIds": [101, 102] }
```

### 5.4.7 批量从分组移除邮箱

- **POST** `/admin/email-groups/:id/remove`
- Body:

```json
{ "emailIds": [101, 102] }
```

---

## 5.5 邮箱管理（`/admin/emails`）

### 5.5.1 列表

- **GET** `/admin/emails?page=1&pageSize=10&status=ACTIVE&keyword=xxx&groupId=1&groupName=US`

### 5.5.2 详情

- **GET** `/admin/emails/:id`
- **GET** `/admin/emails/:id?secrets=true`（返回解密后的 `refreshToken/password`）

### 5.5.3 创建

- **POST** `/admin/emails`
- Body:

```json
{
  "email": "user@outlook.com",
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "refreshToken": "refresh_token",
  "password": "optional_password",
  "groupId": 1
}
```

### 5.5.4 更新

- **PUT** `/admin/emails/:id`
- Body（可选字段）：

```json
{
  "clientId": "new_client_id",
  "refreshToken": "new_refresh_token",
  "password": "new_password",
  "status": "ACTIVE",
  "groupId": null
}
```

### 5.5.5 删除

- **DELETE** `/admin/emails/:id`

### 5.5.6 批量删除

- **POST** `/admin/emails/batch-delete`
- Body:

```json
{ "ids": [1, 2, 3] }
```

### 5.5.7 批量导入

- **POST** `/admin/emails/import`
- Body:

```json
{
  "content": "line1\\nline2",
  "separator": "----",
  "groupId": 1
}
```

支持三种每行格式（分隔符默认 `----`）：

1. `email----password----clientId----refreshToken`
2. `email----clientId----refreshToken`
3. `email----clientId----uuid----info----refreshToken`

返回：

```json
{
  "success": true,
  "data": {
    "success": 10,
    "failed": 2,
    "errors": ["Line \"xxx...\": Invalid format"]
  }
}
```

### 5.5.8 导出

- **GET** `/admin/emails/export?ids=1,2,3&separator=----&groupId=1`
- 返回：

```json
{
  "success": true,
  "data": {
    "content": "email----clientId----refreshToken\\n..."
  }
}
```

### 5.5.9 读取某邮箱邮件（管理端）

- **GET** `/admin/emails/:id/mails?mailbox=INBOX`

### 5.5.10 清空某邮箱邮件（管理端）

- **POST** `/admin/emails/:id/clear`
- Body:

```json
{ "mailbox": "INBOX" }
```

---

## 5.6 仪表盘（`/admin/dashboard`）

### 5.6.1 统计

- **GET** `/admin/dashboard/stats`

### 5.6.2 API 趋势

- **GET** `/admin/dashboard/api-trend?days=7`
- `days` 范围实际会被限制到 `1~90`。

### 5.6.3 操作日志

- **GET** `/admin/dashboard/logs?page=1&pageSize=20&action=mail_new`

返回字段包含：

- `id`
- `action`
- `apiKeyName`
- `email`
- `requestIp`
- `responseCode`
- `responseTimeMs`
- `requestId`
- `createdAt`

---

## 6. 外部邮件 API（`/api`，供第三方系统调用）

> 所有接口统一要求 API Key 鉴权；均会记录 `api_logs`。

## 6.1 动作权限（permissions）

可配置动作键（推荐全部使用下划线命名）：

- `get_email`
- `mail_new`
- `mail_text`
- `mail_all`
- `process_mailbox`
- `list_emails`
- `pool_stats`
- `pool_reset`

通配：

- `*`
- `all`
- `__all__`

---

## 6.2 获取一个未使用邮箱

- **ALL(GET/POST)** `/api/get-email`
- 参数（可选）：`group`（分组名）

返回：

```json
{
  "success": true,
  "data": {
    "email": "user@outlook.com",
    "id": 101
  }
}
```

常见错误：

- `NO_UNUSED_EMAIL`
- `GROUP_NOT_FOUND`
- `GROUP_FORBIDDEN`

---

## 6.3 读取最新邮件

- **ALL** `/api/mail_new`
- 参数：

```json
{
  "email": "user@outlook.com",
  "mailbox": "inbox",
  "socks5": "socks5://127.0.0.1:1080",
  "http": "http://127.0.0.1:7890"
}
```

返回：

```json
{
  "success": true,
  "data": {
    "email": "user@outlook.com",
    "mailbox": "inbox",
    "count": 1,
    "messages": [
      {
        "id": "xxx",
        "from": "sender@example.com",
        "subject": "subject",
        "text": "preview",
        "html": "<html>...</html>",
        "date": "2026-02-13T00:00:00.000Z"
      }
    ],
    "method": "graph_api"
  },
  "email": "user@outlook.com"
}
```

`method` 可能为：

- `graph_api`
- `imap`

---

## 6.4 读取最新邮件纯文本（脚本友好）

- **ALL** `/api/mail_text`
- 参数：

```json
{
  "email": "user@outlook.com",
  "match": "\\\\d{6}"
}
```

行为：

- 成功时返回 `text/plain`（不是 JSON）。
- `match` 为正则，若有捕获组优先返回捕获组。
- 失败时返回 `text/plain`，如 `Error: No match found`。

---

## 6.5 读取全部邮件

- **ALL** `/api/mail_all`
- 参数同 `mail_new`（默认最多 100 封）

---

## 6.6 清空邮箱

- **ALL** `/api/process-mailbox`
- 参数同 `mail_new`

返回示例：

```json
{
  "success": true,
  "data": {
    "email": "user@outlook.com",
    "mailbox": "inbox",
    "message": "Successfully deleted 20 messages",
    "status": "success",
    "deletedCount": 20
  },
  "email": "user@outlook.com"
}
```

说明：

- 当分组策略为 `IMAP_ONLY` 时，不支持清空，返回 `MAILBOX_CLEAR_UNSUPPORTED`。
- 该接口清空通过 Graph API 执行。

---

## 6.7 列出可用邮箱

- **ALL** `/api/list-emails`
- 参数（可选）：`group`

返回：

```json
{
  "success": true,
  "data": {
    "total": 2,
    "emails": [
      { "email": "a@outlook.com", "status": "ACTIVE", "group": "US" },
      { "email": "b@outlook.com", "status": "ACTIVE", "group": null }
    ]
  }
}
```

---

## 6.8 邮箱池统计

- **ALL** `/api/pool-stats`
- 参数（可选）：`group`

返回：

```json
{
  "success": true,
  "data": {
    "total": 100,
    "used": 10,
    "remaining": 90
  }
}
```

---

## 6.9 重置邮箱池

- **ALL** `/api/reset-pool`
- 参数（可选）：`group`

返回：

```json
{
  "success": true,
  "data": {
    "message": "Pool reset successfully for group 'US'"
  }
}
```

---

## 7. API Key 作用域（重点）

系统对 API Key 支持两层资源范围控制：

1. `allowedGroupIds`：只允许访问这些分组
2. `allowedEmailIds`：只允许访问这些邮箱

最终访问权限是两者共同作用的结果（都命中才可访问）。

影响范围：

- `/api/get-email`
- `/api/list-emails`
- `/api/pool-stats`
- `/api/reset-pool`
- `/api/mail_new`
- `/api/mail_text`
- `/api/mail_all`
- `/api/process-mailbox`
- 管理端 `/admin/api-keys/:id/pool-emails` 等池管理接口

---

## 8. 请求追踪（排障）

- 每个请求有 `requestId`。
- 服务端会回传响应头：`x-request-id`。
- 错误响应体也会包含 `requestId`。
- 排障时将前端报错里的 `requestId` 与服务端日志关联即可快速定位。

---

## 9. 快速接入示例（第三方系统）

### 9.1 获取邮箱

```bash
curl -X GET "http://<host>:3000/api/get-email" \
  -H "x-api-key: sk_xxx"
```

### 9.2 读取验证码文本

```bash
curl -X POST "http://<host>:3000/api/mail_text" \
  -H "x-api-key: sk_xxx" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@outlook.com","match":"(\\d{6})"}'
```

### 9.3 清空邮箱

```bash
curl -X POST "http://<host>:3000/api/process-mailbox" \
  -H "x-api-key: sk_xxx" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@outlook.com","mailbox":"inbox"}'
```

---

## 10. 版本说明

- 本文档按当前代码实现整理，包含：
  - `process_mailbox` / `list_emails` 等动作命名
  - `deletedCount` 返回字段
  - `/health` 健康检查
  - `SUPER_ADMIN/ADMIN`、`ACTIVE/DISABLED` 枚举约定
- 若后续接口更新，建议同步更新本文件与前端 API 文档页。

