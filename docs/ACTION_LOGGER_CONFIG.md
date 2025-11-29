# Action Logger 配置指南

## 📋 概述

action-logger 是一个强大的 Server Action 日志系统，支持：
- 自动记录所有 CRUD 操作
- 灵活的输出模式（full/summary/simple）
- 可配置的展开深度（1-5 或完全展开）
- 可选的数据库存储（开/关）
- **智能日志清理**（最大记录数限制）
- **类型过滤**（只记录指定类型的操作）
- 开发环境控制台输出 + 生产环境数据库存储

---

## ⚙️ 环境变量配置

在 `.env.local` 文件中配置：

```bash
# 日志输出模式
ACTION_LOG_MODE=full          # full | summary | simple

# 展开深度（1-5 或留空为完全展开）
ACTION_LOG_DEPTH=2            # 1-5 或 null

# 数据库存储开关
ACTION_LOG_DATABASE=1         # 1=入库（默认） | 0=不入库

# ✨ 最大记录数（超过后自动删除最旧的日志）
ACTION_LOG_MAX=10000          # 数字 = 保留最新 N 条 | 0/留空 = 无限记录

# ✨ 操作类型过滤（只记录指定类型的操作）
ACTION_LOG_TYPE=all           # all | create,delete | create,read,update,delete | 留空=不记录
```

---

## 🎨 MODE 模式详解

### 1. `full` 模式（默认）

**特点**：完全展开数组和对象，深度由 `ACTION_LOG_DEPTH` 控制

**适用场景**：
- 开发调试时需要查看完整数据
- 排查问题时需要详细信息
- 数据量较小的操作

**输出示例**：

```
--------【开始】【Server Action】【user】【query_user】--------
13:45:23.123 【请求参数】: { 
  pageIndex: 1, 
  pageSize: 20, 
  search: 'test' 
}
13:45:23.145 【返回数据】: { 
  success: true, 
  data: [
    { 
      id: 1, 
      name: 'User 1', 
      email: 'user1@example.com',
      profile: { age: 25, city: 'Shanghai' }
    },
    { 
      id: 2, 
      name: 'User 2', 
      email: 'user2@example.com',
      profile: { age: 28, city: 'Beijing' }
    }
  ],
  total: 50 
}
13:45:23.145 【总体耗时】: 22 毫秒
13:45:23.145 【请求时间】: 2025-11-06 13:45:23
--------【结束】【Server Action】【user】【query_user】--------
```

---

### 2. `summary` 模式

**特点**：折叠所有数组为 `Array(N)`，对象正常显示

**适用场景**：
- 数据量大的列表查询
- 只需要知道数组长度，不需要看每一项
- 控制台输出过多时

**输出示例**：

```
--------【开始】【Server Action】【user】【query_user】--------
13:45:23.123 【请求参数】: { pageIndex: 1, pageSize: 20, search: 'test' }
13:45:23.145 【返回数据】: { 
  success: true, 
  data: Array(50),    ← 数组被折叠
  total: 50 
}
13:45:23.145 【总体耗时】: 22 毫秒
13:45:23.145 【请求时间】: 2025-11-06 13:45:23
--------【结束】【Server Action】【user】【query_user】--------
```

---

### 3. `simple` 模式

**特点**：单行极简输出，只显示关键信息

**适用场景**：
- 日常开发，控制台保持简洁
- 只关注操作是否成功和耗时
- 高频操作时避免刷屏

**输出示例**：

```
13:45:23.123 [✓] query_user | params: {pageIndex:1, pageSize:20, search:"test"} | result: {success:true, data:[50], total:50} | 22ms
13:45:25.456 [✓] create_order | params: {userId:"123", items:[3], total:600} | result: {success:true, id:"order-456"} | 85ms
13:45:27.789 [✗] delete_user | params: {id:"999"} | result: User not found | 12ms
```

**格式说明**：
- `[✓]` = 成功，`[✗]` = 失败
- `action_resourceType` = 操作类型_资源类型
- `params` = 最多显示 3 个关键字段
- `result` = 返回数据的关键字段
- 最后是执行耗时（毫秒）

---

## 📏 DEPTH 深度控制

**可选值**：`1`, `2`, `3`, `4`, `5` 或 `null`（完全展开）

**作用**：同时控制对象和数组的嵌套展开深度

### 示例：不同深度的输出

#### 原始数据：

```javascript
{
  user: {
    id: '123',
    profile: {
      name: 'John',
      address: {
        city: 'Shanghai',
        street: 'Nanjing Road'
      }
    }
  }
}
```

#### `DEPTH=1`：

```javascript
{
  user: {2 keys}  // 第一层展开，第二层折叠
}
```

#### `DEPTH=2`：

```javascript
{
  user: {
    id: '123',
    profile: {2 keys}  // 第二层展开，第三层折叠
  }
}
```

#### `DEPTH=3`：

```javascript
{
  user: {
    id: '123',
    profile: {
      name: 'John',
      address: {2 keys}  // 第三层展开，第四层折叠
    }
  }
}
```

#### `DEPTH=null`（默认）：

```javascript
{
  user: {
    id: '123',
    profile: {
      name: 'John',
      address: {
        city: 'Shanghai',
        street: 'Nanjing Road'
      }
    }
  }
}
```

---

## 💾 DATABASE 数据库开关

**可选值**：`1`（入库，默认）或 `0`（不入库）

### `ACTION_LOG_DATABASE=1`（默认）

- 控制台输出（开发环境）
- 写入 `action_logs` 集合（异步，不阻塞主流程）
- 记录完整的请求参数和返回结果
- 可用于后续审计、统计、分析

### `ACTION_LOG_DATABASE=0`

- 只输出到控制台
- 不写入数据库
- 适用于本地开发调试
- 减少数据库压力

**使用场景**：
- 开发环境调试：`ACTION_LOG_DATABASE=0`（不入库，控制台看就够了）
- 生产环境：`ACTION_LOG_DATABASE=1`（入库，用于审计和统计）

---

## 🧹 MAX 最大记录数限制

**可选值**：数字（如 `10000`）或 `0`/留空（无限记录）

### 功能说明

当日志记录数超过 `ACTION_LOG_MAX` 设定值时，系统会自动删除最旧的日志，保持数据库整洁。

### 配置示例

```bash
# 保留最新的 10000 条日志
ACTION_LOG_MAX=10000

# 保留最新的 1000 条日志
ACTION_LOG_MAX=1000

# 无限记录（默认，不删除旧日志）
ACTION_LOG_MAX=0
# 或留空
ACTION_LOG_MAX=
```

### 工作原理

1. 每次写入新日志后，检查总记录数
2. 如果超过 `MAX` 值，计算需要删除的数量
3. 按 `createdAt` 升序排列，删除最旧的 N 条记录
4. 在后台异步执行，不阻塞主流程

### 使用建议

| 环境 | 推荐值 | 说明 |
|------|--------|------|
| 开发环境 | `1000` | 本地测试，保留少量日志即可 |
| 测试环境 | `10000` | 短期运行，保留适量日志 |
| 生产环境（小型） | `50000` | 约保留 1-2 个月的日志 |
| 生产环境（大型） | `100000+` | 高频操作，需要更多历史记录 |

**注意**：
- 清理操作在后台异步执行，不影响性能
- 如需永久保留日志，请定期导出或备份 `action_logs` 集合
- 删除操作无法恢复，请谨慎设置

---

## 🎯 TYPE 操作类型过滤

**可选值**：`all` | `create,delete` | 留空

### 功能说明

**只控制数据库写入**，不影响控制台输出。

- 控制台日志（开发环境）：始终输出所有操作
- 数据库日志：根据 TYPE 配置过滤

这样设计的好处：
- 开发时可以看到所有操作，方便调试
- 数据库只存储关键操作，减少存储成本

### 支持的操作类型

| 类型 | 包含的操作 | 说明 |
|------|-----------|------|
| `read` | `query`, `getList`, `getDetail` | 所有查询/读取操作 |
| `create` | `create` | 创建操作 |
| `update` | `update`, `batchUpdate` | 更新操作（包括批量更新） |
| `delete` | `delete`, `batchDelete` | 删除操作（包括批量删除） |
| `all` | 所有操作 | 记录所有类型 |

### 配置示例

#### 1. 记录所有操作（默认）

```bash
ACTION_LOG_TYPE=all
# 或留空（默认行为）
ACTION_LOG_TYPE=
```

**效果**：
- 控制台：输出所有操作
- 数据库：记录所有操作

---

#### 2. 只记录创建和删除

```bash
ACTION_LOG_TYPE=create,delete
```

**效果**：
- 控制台：输出所有操作（不受影响）
- 数据库：
  - 记录：`create`, `delete`, `batchDelete`
  - ❌ 不记录：`query`, `getList`, `getDetail`, `update`, `batchUpdate`

**使用场景**：审计重要操作，数据库不存储查询和更新日志

---

#### 3. 只记录修改操作（创建、更新、删除）

```bash
ACTION_LOG_TYPE=create,update,delete
```

**效果**：
- 控制台：输出所有操作（不受影响）
- 数据库：
  - 记录：`create`, `update`, `batchUpdate`, `delete`, `batchDelete`
  - ❌ 不记录：`query`, `getList`, `getDetail`

**使用场景**：数据变更审计，数据库不存储查询日志

---

#### 4. 只记录查询操作

```bash
ACTION_LOG_TYPE=read
```

**效果**：
- 控制台：输出所有操作（不受影响）
- 数据库：
  - 记录：`query`, `getList`, `getDetail`
  - ❌ 不记录：`create`, `update`, `delete` 等

**使用场景**：分析查询性能，监控数据访问

---

#### 5. 完全禁用数据库日志

```bash
ACTION_LOG_TYPE=
```

**效果**：
- 控制台：仍然输出（不受影响）
- 数据库：❌ 不记录任何操作

**使用场景**：只需要控制台日志，不需要持久化存储

---

### 类型映射说明

系统自动将操作名称映射到类型：

```javascript
// read 类型
'query' → 'read'
'getList' → 'read'
'getDetail' → 'read'

// create 类型
'create' → 'create'

// update 类型
'update' → 'update'
'batchUpdate' → 'update'

// delete 类型
'delete' → 'delete'
'batchDelete' → 'delete'
```

### 使用建议

| 场景 | 推荐配置 | 说明 |
|------|---------|------|
| 开发调试 | `all` | 查看所有操作，方便调试 |
| 生产环境 | `create,update,delete` | 只记录数据变更，减少日志量 |
| 安全审计 | `create,delete` | 关注重要操作，防止误删 |
| 性能监控 | `read` | 分析查询性能 |
| 完全禁用 | `''`（留空） | 临时关闭日志 |

---

## 📦 自动集成的地方

以下场景会**自动记录日志**，无需手动调用：

### 1. SmartCrudPage 的所有操作

只要使用 `SmartCrudPage` 组件，所有 CRUD 操作都会自动记录：

```javascript
<SmartCrudPage
  fieldsConfig={fieldsConfig}
  actions={crudActions}  // ← 这些 actions 会自动记录日志
  title="User Management"
/>
```

### 2. 使用 crud-helper 创建的 Actions

```javascript
import { createCrudActions } from '@/lib/core/crud-helper';

const crudActions = createCrudActions({
  collectionName: 'users',
  // ... config
});

// 以下方法会自动记录日志
export const getUserList = crudActions.getList;
export const createUser = crudActions.create;
export const updateUser = crudActions.update;
export const deleteUser = crudActions.delete;
```

### 3. 使用 BaseDAO 工厂函数

```javascript
import { createCrudActions } from '@/app/(admin)/actions/dao/base';

const crudActions = createCrudActions({
  collectionName: 'products',
  // ... config
});

// 自动记录日志
export const getProductList = crudActions.getList;
```

### 4. 使用 action-wrapper 包装的 Actions

```javascript
import { wrapAdminAction } from '@/lib/core/action-wrapper';

export const myAction = wrapAdminAction('create', 'user', async (params, context) => {
  // 业务逻辑
  return { success: true };
});
// 自动验证权限 + 自动记录日志
```

---

## 🎯 推荐配置方案

### 开发环境（.env.local）

```bash
# 方案 1：极简模式（日常开发）
ACTION_LOG_MODE=simple
ACTION_LOG_DATABASE=0           # 不入库
ACTION_LOG_TYPE=all             # 记录所有操作
ACTION_LOG_MAX=1000             # 保留最新 1000 条

# 方案 2：调试模式（排查问题时）
ACTION_LOG_MODE=full
ACTION_LOG_DEPTH=3
ACTION_LOG_DATABASE=0           # 不入库
ACTION_LOG_TYPE=all             # 记录所有操作
```

### 生产环境（.env.production）

```bash
# 方案 1：完整审计（记录所有操作）
ACTION_LOG_MODE=summary
ACTION_LOG_DEPTH=2
ACTION_LOG_DATABASE=1           # 入库
ACTION_LOG_TYPE=all             # 记录所有操作
ACTION_LOG_MAX=100000           # 保留最新 10 万条

# 方案 2：关键操作审计（只记录数据变更）
ACTION_LOG_MODE=summary
ACTION_LOG_DEPTH=2
ACTION_LOG_DATABASE=1           # 入库
ACTION_LOG_TYPE=create,update,delete  # 只记录变更操作
ACTION_LOG_MAX=50000            # 保留最新 5 万条

# 方案 3：安全审计（只记录创建和删除）
ACTION_LOG_MODE=summary
ACTION_LOG_DEPTH=1
ACTION_LOG_DATABASE=1           # 入库
ACTION_LOG_TYPE=create,delete   # 只记录创建和删除
ACTION_LOG_MAX=50000            # 保留最新 5 万条
```

### 性能测试环境

```bash
# 不记录日志，避免影响性能测试
ACTION_LOG_TYPE=                # 留空，完全禁用
ACTION_LOG_DATABASE=0
```

---

## 🧪 测试日志输出

### 方法 1：通过 API 测试

启动开发服务器后访问：

```bash
# 默认 full 模式
http://localhost:3000/api/test-logger

# summary 模式
http://localhost:3000/api/test-logger?mode=summary

# simple 模式
http://localhost:3000/api/test-logger?mode=simple

# full 模式 + depth=2
http://localhost:3000/api/test-logger?mode=full&depth=2
```

查看**控制台输出**即可看到不同模式的效果！

### 方法 2：在实际操作中测试

1. 在 `.env.local` 中设置配置
2. 重启开发服务器
3. 访问任何使用 SmartCrudPage 的页面
4. 执行 CRUD 操作
5. 查看控制台日志

---

## 📊 日志数据库结构

当 `ACTION_LOG_DATABASE=1` 时，日志会写入 `action_logs` 集合：

```javascript
{
  userId: 'user-123',              // 操作用户 ID
  action: 'create',                // 操作类型（create/update/delete/query/batch_update/batch_delete）
  resourceType: 'user',            // 资源类型
  resourceId: 'user-456',          // 资源 ID（可选）
  params: { ... },                 // 请求参数（完整）
  result: { ... },                 // 返回结果（完整）
  success: true,                   // 是否成功
  duration: 123,                   // 执行时长（毫秒）
  createdAt: ISODate(...),         // 创建时间
  ip: '127.0.0.1',                 // IP 地址（可选，未来实现）
  userAgent: 'Mozilla/5.0...',     // User Agent（可选，未来实现）
}
```

---

## 💡 常见问题

### Q1: 如何完全关闭日志？

**A**: 在生产环境，控制台日志会自动关闭（`NODE_ENV=production`）。如果要关闭数据库日志：

```bash
ACTION_LOG_DATABASE=0
```

### Q2: simple 模式下看不到详细信息怎么办？

**A**: 临时切换到 full 模式：

```bash
ACTION_LOG_MODE=full
```

或者直接在 URL 参数中测试：
```
http://localhost:3000/api/test-logger?mode=full
```

### Q3: 数组太大，日志输出太多怎么办？

**A**: 使用 summary 模式 + 限制深度：

```bash
ACTION_LOG_MODE=summary
ACTION_LOG_DEPTH=2
```

### Q4: 如何只记录特定操作的日志？

**A**: 使用 `ACTION_LOG_TYPE` 配置：

```bash
# 只记录创建和删除操作
ACTION_LOG_TYPE=create,delete

# 只记录数据变更（不记录查询）
ACTION_LOG_TYPE=create,update,delete

# 完全禁用日志
ACTION_LOG_TYPE=
```

### Q5: 如何查看历史日志？

**A**: 从数据库查询 `action_logs` 集合：

```javascript
// 查询某用户的所有操作
db.action_logs.find({ userId: 'user-123' })

// 查询最近的失败操作
db.action_logs.find({ success: false }).sort({ createdAt: -1 }).limit(10)

// 查询某资源类型的操作统计
db.action_logs.aggregate([
  { $match: { resourceType: 'user' } },
  { $group: { _id: '$action', count: { $sum: 1 } } }
])
```

---

## 🚀 最佳实践

1. **开发阶段**：使用 `simple` 模式，保持控制台简洁
2. **调试问题**：切换到 `full` 模式，查看完整数据
3. **性能测试**：使用 `summary` 模式，避免大数据量影响性能
4. **生产环境**：开启数据库日志（`ACTION_LOG_DATABASE=1`），用于审计
5. **数据量大**：合理设置 `DEPTH`，避免展开过深

---

## 📝 更新日志

- **2025-11-06**: ✨ 添加 `ACTION_LOG_MAX` 配置，支持自动清理超出限制的旧日志
- **2025-11-06**: ✨ 添加 `ACTION_LOG_TYPE` 配置，支持按操作类型过滤日志记录
- **2025-11-06**: 添加 `ACTION_LOG_DATABASE` 配置，支持控制是否入库
- **2025-11-06**: 重构日志系统，实现 full/summary/simple 三种模式
- **2025-11-06**: 添加 `ACTION_LOG_DEPTH` 配置，支持 1-5 层深度控制
- **2025-11-06**: 统一使用 `logAction` 函数，移除旧版 `logActionToConsole`

---

## 📞 技术支持

如有问题，请查看：
- `lib/logging/action-logger.js` - 核心实现
- `lib/logging/README.md` - 详细技术文档
- `app/api/test-logger/route.js` - 测试 API 示例

