# Logging 日志模块

## 目录结构

```
lib/logging/
├── action-logger.js   # Server Action 日志记录
└── usage-logs.js      # 使用记录（积分消费、图片生成等）
```

## action-logger.js - Server Action 日志

### 功能

1. **自动日志记录**：为 Server Actions 提供统一的日志记录
2. **控制台输出**：开发环境下输出详细的彩色日志
3. **数据库存储**：异步写入 `action_logs` 表
4. **灵活配置**：支持多种日志模式和深度控制

### 环境变量配置

在 `.env.local` 中配置：

```bash
# 日志模式
ACTION_LOG_MODE=full    # full | summary | simple

# 日志深度（仅在 full 模式下生效）
ACTION_LOG_DEPTH=2      # 1 | 2 | 3 | ... | 不设置（完全展开）
```

### 日志模式说明

#### 1. **full** 模式（默认）
完整显示所有数据，适合开发调试。

```
--------【开始】【Server Action】【menu】【query_menu】--------
[09:30:15.123] 【请求参数】: { pageIndex: 1, pageSize: 20 }
[09:30:15.145] 【返回数据】: {
  success: true,
  data: [
    { id: '1', name: 'Dashboard', children: [...] },
    { id: '2', name: 'RBAC', children: [...] }
  ],
  total: 15
}
[09:30:15.145] 【总体耗时】: 22 毫秒
--------【结束】【Server Action】【menu】【query_menu】--------
```

#### 2. **summary** 模式
只显示关键信息，适合快速浏览。

```
--------【开始】【Server Action】【menu】【query_menu】--------
[09:30:15.123] 【请求参数】: { pageIndex: 1, pageSize: 20, _keys: "总计 5 个字段" }
[09:30:15.145] 【返回数据】: { success: true, data: "Array(15)", total: 15 }
[09:30:15.145] 【总体耗时】: 22 毫秒
--------【结束】【Server Action】【menu】【query_menu】--------
```

#### 3. **simple** 模式
极简输出，只显示操作结果。

```
--------【开始】【Server Action】【menu】【query_menu】--------
[09:30:15.123] 【请求参数】: pageIndex=1, pageSize=20
[09:30:15.145] 【返回数据】: ✓ Array(15), total: 15
[09:30:15.145] 【总体耗时】: 22 毫秒
--------【结束】【Server Action】【menu】【query_menu】--------
```

### 日志深度说明

`ACTION_LOG_DEPTH` 控制对象嵌套展开的层级，避免日志过长。

#### 示例数据结构

```javascript
{
  success: true,
  data: [
    {
      id: '1',
      name: 'RBAC',
      children: [
        { id: '1-1', name: 'Roles', children: [] },
        { id: '1-2', name: 'Permissions', children: [] }
      ]
    }
  ],
  total: 1
}
```

#### 不同深度的输出

**DEPTH=1** - 只显示第一层
```javascript
{
  success: true,
  data: '[Array(1)]',  // 折叠
  total: 1
}
```

**DEPTH=2** - 展开到第二层
```javascript
{
  success: true,
  data: [
    {
      id: '1',
      name: 'RBAC',
      children: '[Array(2)]'  // 折叠
    }
  ],
  total: 1
}
```

**DEPTH=3** - 展开到第三层
```javascript
{
  success: true,
  data: [
    {
      id: '1',
      name: 'RBAC',
      children: [
        {
          id: '1-1',
          name: 'Roles',
          children: '[Array(0)]'  // 折叠
        },
        {
          id: '1-2',
          name: 'Permissions',
          children: '[Array(0)]'  // 折叠
        }
      ]
    }
  ],
  total: 1
}
```

**不设置 DEPTH**（默认）- 完全展开
```javascript
{
  success: true,
  data: [
    {
      id: '1',
      name: 'RBAC',
      children: [
        { id: '1-1', name: 'Roles', children: [] },
        { id: '1-2', name: 'Permissions', children: [] }
      ]
    }
  ],
  total: 1
}
```

### 使用场景推荐

| 场景 | MODE | DEPTH | 说明 |
|------|------|-------|------|
| 日常开发 | `full` | `2` | 查看主要数据，避免嵌套过深 |
| 调试树形数据 | `full` | `3-4` | 完整查看层级结构 |
| 性能测试 | `simple` | - | 最小化日志开销 |
| 查看列表数据 | `full` | `2` | 查看列表项，不展开子数据 |
| 生产环境 | `simple` | - | 或完全关闭日志 |

### API

#### logAction (新版)

用于 `action-wrapper.js` 中的自动日志记录：

```javascript
await logAction({
  userId: 'user123',
  action: 'query',        // 操作类型
  resourceType: 'menu',   // 资源类型
  resourceId: 'menu123',  // 资源 ID（可选）
  params: {...},          // 请求参数
  result: {...},          // 返回结果
  success: true,          // 是否成功
  duration: 22            // 执行时长（毫秒）
});
```

#### logActionToConsole (旧版，已废弃)

仅用于控制台输出，不写入数据库：

```javascript
logActionToConsole(
  'getUserList',          // actionName
  'admin/users',          // category
  { pageIndex: 1 },       // params
  { success: true },      // result
  22,                     // duration
  false                   // isError
);
```

⚠️ **建议**：新代码请使用 `logAction`，它会同时处理控制台输出和数据库存储。

### 数据库日志结构

日志会异步写入 `action_logs` 表，ID 使用 `nb.pubfn.uuid()` 生成：

```javascript
import nb from '@/lib/function';

{
  id: nb.pubfn.uuid(),    // 使用统一的 UUID 生成方法
  userId: 'user123',
  action: 'query',
  resourceType: 'menu',
  resourceId: 'menu123',
  params: {...},          // 请求参数
  result: {...},          // 返回结果
  success: true,
  duration: 22,
  ip: null,               // TODO: 从 headers 获取
  userAgent: null,        // TODO: 从 headers 获取
  createdAt: ISODate()
}
```

## usage-logs.js - 使用记录

用于记录用户的积分消费、图片生成等业务日志。

### API

```javascript
import { logUsage } from '@/lib/logging/usage-logs';

await logUsage({
  userId: 'user123',
  action: 'generate_image',
  creditsUsed: 10,
  metadata: {...}
});
```

## 最佳实践

1. **开发时**：使用 `full` 模式 + `depth=2`，查看主要数据
2. **调试树形结构时**：临时调整 `depth=3` 或更高
3. **测试性能时**：使用 `simple` 模式，减少日志开销
4. **生产环境**：关闭开发日志或使用 `simple` 模式
5. ⚠️ **避免**：在生产环境使用 `full` + 无限深度，可能影响性能

## 相关文件

- `lib/core/action-wrapper.js` - 自动调用 `logAction`
- `app/(admin)/actions/dao/base.js` - BaseDAO 使用日志记录
- `lib/business/init-user.js` - 业务日志示例
- `lib/function/README.md` - `nb.pubfn` 工具函数文档
