# Action Logger 使用示例

## 📋 快速开始

### 1️⃣ 基础配置

在 `.env.local` 中添加：

```bash
ACTION_LOG_MODE=simple
ACTION_LOG_DATABASE=1
ACTION_LOG_TYPE=all
ACTION_LOG_MAX=10000
```

### 2️⃣ 重启开发服务器

```bash
npm run dev
# 或
bun dev
```

### 3️⃣ 测试日志

访问任何 SmartCrudPage 页面，执行 CRUD 操作，查看控制台输出。

---

## 🎯 实战场景配置

### 场景 1：开发调试 - 查看完整数据

**需求**：
- 排查 bug，需要查看完整的请求参数和返回结果
- 不需要入库，只看控制台

**配置**：

```bash
ACTION_LOG_MODE=full
ACTION_LOG_DEPTH=3
ACTION_LOG_DATABASE=0
ACTION_LOG_TYPE=all
```

**效果**：

```
--------【开始】【Server Action】【users】【query_users】--------
13:45:23.123 【请求参数】: {
  pageIndex: 1,
  pageSize: 20,
  search: 'john',
  filters: {
    status: 'active'
  }
}
13:45:23.145 【返回数据】: {
  success: true,
  data: [
    {
      id: '123',
      name: 'John Doe',
      email: 'john@example.com',
      profile: {
        age: 25,
        city: 'Shanghai'
      }
    }
  ],
  total: 1
}
13:45:23.145 【总体耗时】: 22 毫秒
13:45:23.145 【请求时间】: 2025-11-06 13:45:23
--------【结束】【Server Action】【users】【query_users】--------
```

---

### 场景 2：日常开发 - 控制台简洁

**需求**：
- 日常开发，只需要知道操作是否成功
- 控制台保持简洁

**配置**：

```bash
ACTION_LOG_MODE=simple
ACTION_LOG_DATABASE=0
ACTION_LOG_TYPE=all
```

**效果**：

```
13:45:23.123 [✓] query_users | params: {pageIndex:1, pageSize:20, search:"john"} | result: {success:true, data:[1], total:1} | 22ms
13:45:25.456 [✓] create_order | params: {userId:"123", items:[3]} | result: {success:true, id:"order-456"} | 85ms
13:45:27.789 [✗] delete_user | params: {id:"999"} | result: User not found | 12ms
```

---

### 场景 3：生产环境 - 只记录数据变更

**需求**：
- 生产环境，只关注数据变更操作（创建、更新、删除）
- 不记录查询操作，减少日志量
- 保留最新 5 万条记录

**配置**：

```bash
ACTION_LOG_MODE=summary
ACTION_LOG_DEPTH=2
ACTION_LOG_DATABASE=1
ACTION_LOG_TYPE=create,update,delete
ACTION_LOG_MAX=50000
```

**效果**：

- 控制台（开发环境）：输出所有操作
- 数据库：
  - ✅ 记录：`create`, `update`, `batchUpdate`, `delete`, `batchDelete`
  - ❌ 不记录：`query`, `getList`, `getDetail`
- 🗑️ 自动清理：超过 5 万条后，删除最旧的日志

---

### 场景 4：安全审计 - 只记录创建和删除

**需求**：
- 安全审计，重点关注创建和删除操作
- 防止误删或恶意操作
- 保留最新 3 万条记录

**配置**：

```bash
ACTION_LOG_MODE=summary
ACTION_LOG_DEPTH=1
ACTION_LOG_DATABASE=1
ACTION_LOG_TYPE=create,delete
ACTION_LOG_MAX=30000
```

**效果**：

- 控制台（开发环境）：输出所有操作
- 数据库：
  - ✅ 记录：`create`, `delete`, `batchDelete`
  - ❌ 不记录：`query`, `getList`, `getDetail`, `update`, `batchUpdate`
- 🗑️ 自动清理：超过 3 万条后，删除最旧的日志

**数据库查询示例**：

```javascript
// 查看最近的删除操作
db.action_logs.find({ 
  action: { $in: ['delete', 'batchDelete'] } 
}).sort({ createdAt: -1 }).limit(10)

// 查看某用户的所有创建操作
db.action_logs.find({ 
  userId: '69030d2a9ff630ade7f92b33',
  action: 'create' 
}).sort({ createdAt: -1 })
```

---

### 场景 5：性能分析 - 只记录查询操作

**需求**：
- 分析查询性能
- 找出慢查询
- 不关心数据变更

**配置**：

```bash
ACTION_LOG_MODE=full
ACTION_LOG_DEPTH=1
ACTION_LOG_DATABASE=1
ACTION_LOG_TYPE=read
ACTION_LOG_MAX=100000
```

**效果**：

- 控制台（开发环境）：输出所有操作
- 数据库：
  - ✅ 记录：`query`, `getList`, `getDetail`
  - ❌ 不记录：`create`, `update`, `delete` 等

**数据库分析示例**：

```javascript
// 查找耗时超过 1 秒的查询
db.action_logs.find({ 
  action: { $in: ['query', 'getList', 'getDetail'] },
  duration: { $gt: 1000 } 
}).sort({ duration: -1 })

// 统计各资源类型的平均查询时间
db.action_logs.aggregate([
  { $match: { action: { $in: ['query', 'getList', 'getDetail'] } } },
  { $group: { 
    _id: '$resourceType', 
    avgDuration: { $avg: '$duration' },
    count: { $sum: 1 }
  }},
  { $sort: { avgDuration: -1 } }
])
```

---

### 场景 6：性能测试 - 禁用数据库日志

**需求**：
- 进行性能测试
- 避免数据库写入影响测试结果

**配置**：

```bash
ACTION_LOG_TYPE=
ACTION_LOG_DATABASE=0
```

**效果**：

- 控制台（开发环境）：✅ 仍然输出（便于观察测试过程）
- 数据库：❌ 不记录任何操作
- ✅ 无数据库写入开销

---

## 🧪 测试新功能

### 测试类型过滤

1. **设置环境变量**：

```bash
# 只记录创建和删除
export ACTION_LOG_TYPE=create,delete
```

2. **运行测试脚本**：

```bash
node scripts/test-action-logger-filters.js
```

3. **观察输出**：

- 控制台：✅ 显示所有操作（不受影响）
- 数据库：只写入 `create` 和 `delete` 操作

4. **检查数据库**：

```bash
# MongoDB Shell
use jimeng
db.action_logs.count()  // 应该只包含 create 和 delete 操作
db.action_logs.find().sort({createdAt:-1}).limit(5)
```

---

### 测试最大记录数限制

1. **设置环境变量**：

```bash
# 最多保留 100 条记录
export ACTION_LOG_MAX=100
export ACTION_LOG_DATABASE=1
```

2. **生成大量日志**：

访问 SmartCrudPage 页面，执行多次查询操作（刷新页面 50 次以上）

3. **检查数据库**：

```bash
# MongoDB Shell
use jimeng
db.action_logs.count()  // 应该不超过 100 条
```

4. **观察控制台**：

当日志数超过 100 时，会输出清理信息：

```
[action-logger] Cleaned up 50 old logs (total: 150, max: 100)
```

---

## 📊 日志分析示例

### 1. 查看用户操作历史

```javascript
// 查看某用户的所有操作
db.action_logs.find({ 
  userId: '69030d2a9ff630ade7f92b33' 
}).sort({ createdAt: -1 }).limit(20)

// 查看某用户的创建操作
db.action_logs.find({ 
  userId: '69030d2a9ff630ade7f92b33',
  action: 'create'
}).sort({ createdAt: -1 })
```

### 2. 统计操作类型分布

```javascript
db.action_logs.aggregate([
  { $group: { 
    _id: '$action', 
    count: { $sum: 1 } 
  }},
  { $sort: { count: -1 } }
])

// 输出示例：
// { _id: 'query', count: 1523 }
// { _id: 'update', count: 234 }
// { _id: 'create', count: 156 }
// { _id: 'delete', count: 89 }
```

### 3. 查找失败的操作

```javascript
// 最近的失败操作
db.action_logs.find({ 
  success: false 
}).sort({ createdAt: -1 }).limit(10)

// 按资源类型统计失败次数
db.action_logs.aggregate([
  { $match: { success: false } },
  { $group: { 
    _id: { resourceType: '$resourceType', action: '$action' },
    count: { $sum: 1 },
    examples: { $push: '$result' }
  }},
  { $sort: { count: -1 } }
])
```

### 4. 性能分析

```javascript
// 查找慢操作（耗时 > 1 秒）
db.action_logs.find({ 
  duration: { $gt: 1000 } 
}).sort({ duration: -1 }).limit(20)

// 各资源类型的平均响应时间
db.action_logs.aggregate([
  { $group: { 
    _id: '$resourceType',
    avgDuration: { $avg: '$duration' },
    maxDuration: { $max: '$duration' },
    minDuration: { $min: '$duration' },
    count: { $sum: 1 }
  }},
  { $sort: { avgDuration: -1 } }
])
```

### 5. 时间分布分析

```javascript
// 每小时的操作数量
db.action_logs.aggregate([
  { $group: { 
    _id: { 
      hour: { $hour: '$createdAt' },
      date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
    },
    count: { $sum: 1 }
  }},
  { $sort: { '_id.date': -1, '_id.hour': 1 } }
])
```

---

## 🚀 最佳实践总结

### 开发阶段

```bash
# 日常开发：simple 模式
ACTION_LOG_MODE=simple
ACTION_LOG_DATABASE=0
ACTION_LOG_TYPE=all

# 调试问题：full 模式
ACTION_LOG_MODE=full
ACTION_LOG_DEPTH=3
ACTION_LOG_DATABASE=0
ACTION_LOG_TYPE=all
```

### 生产环境

```bash
# 完整审计（记录所有操作）
ACTION_LOG_MODE=summary
ACTION_LOG_DEPTH=2
ACTION_LOG_DATABASE=1
ACTION_LOG_TYPE=all
ACTION_LOG_MAX=100000

# 关键操作审计（只记录变更）
ACTION_LOG_MODE=summary
ACTION_LOG_DEPTH=2
ACTION_LOG_DATABASE=1
ACTION_LOG_TYPE=create,update,delete
ACTION_LOG_MAX=50000
```

### 性能测试

```bash
# 完全禁用日志
ACTION_LOG_TYPE=
ACTION_LOG_DATABASE=0
```

---

## 💡 常见问题

### Q: 如何临时关闭数据库日志？

**A**: 设置 `ACTION_LOG_TYPE=`（空值）或 `ACTION_LOG_DATABASE=0`

```bash
# 方式1：禁用数据库写入（控制台仍输出）
export ACTION_LOG_TYPE=

# 方式2：完全禁用数据库（控制台仍输出）
export ACTION_LOG_DATABASE=0
```

### Q: 如何只记录错误操作？

**A**: 当前不支持，但可以通过数据库查询：

```javascript
db.action_logs.find({ success: false })
```

### Q: 日志清理会影响性能吗？

**A**: 不会。清理操作：
- 在后台异步执行
- 只在写入新日志后触发
- 使用索引快速删除
- 不阻塞主流程

### Q: 如何导出日志用于分析？

**A**: 使用 MongoDB 导出工具：

```bash
mongoexport --db jimeng --collection action_logs --out action_logs.json
```

---

## 📞 更多信息

- 完整配置说明：`docs/ACTION_LOGGER_CONFIG.md`
- 核心实现：`lib/logging/action-logger.js`
- 测试脚本：`scripts/test-action-logger-filters.js`

