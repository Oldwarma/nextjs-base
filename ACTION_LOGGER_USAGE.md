# Server Actions 日志使用指南

## 🎯 灵活的日志模式

日志系统支持 **3 种模式**，可以根据需要随时切换！

---

## 📋 模式说明

### 模式 1: 完整模式（默认）⭐ 推荐

**显示所有数据**，随时可以查看完整内容。

```bash
# 默认就是完整模式，无需配置
npm run dev
```

**输出示例**：
```bash
--------【开始】【Server Action】【admin/users】【getList】--------
21:50:00.123 【请求参数】: { pageIndex: 1, pageSize: 20 }
21:50:00.245 【返回数据】: {
  success: true,
  data: [
    {
      _id: '123',
      name: '张三',
      email: 'zhang@example.com',
      role: 'user',
      createdAt: '2025-11-03T10:00:00.000Z',
      ...
    },
    {
      _id: '124',
      name: '李四',
      email: 'li@example.com',
      ...
    },
    ... 更多 18 条
  ],
  total: 150
}
21:50:00.245 【总体耗时】: 122 毫秒
--------【结束】【Server Action】【admin/users】【getList】--------
```

✅ **优点**：可以随时在终端中查看完整数据，滚动查看详情
⚠️ **缺点**：数据多时，终端输出较长

---

### 模式 2: 摘要模式

**只显示关键信息**，控制台更简洁。

```bash
# 在 .env.local 中添加
ACTION_LOG_MODE=summary

# 或者临时使用
ACTION_LOG_MODE=summary npm run dev
```

**输出示例**：
```bash
--------【开始】【Server Action】【admin/users】【getList】--------
21:50:00.123 【请求参数】: { pageIndex: 1, pageSize: 20 }
21:50:00.245 【返回数据】: {
  success: true,
  total: 150,
  _keys: '3 keys'
}
21:50:00.245 提示: 设置 ACTION_LOG_MODE=full 查看完整数据
21:50:00.245 【总体耗时】: 122 毫秒
--------【结束】【Server Action】【admin/users】【getList】--------
```

✅ **优点**：控制台清爽，关键信息一目了然
⚠️ **缺点**：需要切换模式才能看完整数据

---

### 模式 3: 极简模式 🆕

**完全折叠数据**，只显示最关键的信息和状态。

```bash
# 在 .env.local 中添加
ACTION_LOG_MODE=simple

# 或者临时使用
ACTION_LOG_MODE=simple npm run dev
```

**输出示例**：
```bash
--------【开始】【Server Action】【admin/users】【getList】--------
21:50:00.123 【请求参数】: Object
21:50:00.245 【返回数据】: ✓ Array(20), total: 150
21:50:00.245 【总体耗时】: 122 毫秒
--------【结束】【Server Action】【admin/users】【getList】--------
```

✅ **优点**：极致简洁，一行显示，专注性能和状态
✅ **适合**：演示、录屏、关注耗时和成功率
⚠️ **缺点**：完全看不到数据细节

---

## 🚀 快速切换

### 方法 1: 环境变量（推荐）

在 `.env.local` 文件中设置：

```env
# 极简模式（一行显示）
ACTION_LOG_MODE=simple

# 摘要模式（关键信息）
ACTION_LOG_MODE=summary

# 完整模式（所有数据，默认）
ACTION_LOG_MODE=full
```

然后重启服务器：
```bash
npm run dev
```

### 方法 2: 临时切换

不修改文件，直接在命令行指定：

```bash
# 临时使用极简模式
ACTION_LOG_MODE=simple npm run dev

# 临时使用摘要模式
ACTION_LOG_MODE=summary npm run dev

# 临时使用完整模式
ACTION_LOG_MODE=full npm run dev
```

---

## 💡 使用建议

### 日常开发（推荐完整模式）

```bash
# 使用默认的完整模式
npm run dev
```

**适合场景**：
- ✅ 调试业务逻辑
- ✅ 检查数据结构
- ✅ 验证返回值
- ✅ 需要随时查看数据详情

### 专注开发（使用摘要模式）

```bash
# .env.local
ACTION_LOG_MODE=summary
```

**适合场景**：
- ✅ 关注性能（总体耗时）
- ✅ 只需要知道成功/失败
- ✅ 控制台输出太多，影响阅读
- ✅ 演示或录屏时保持界面清爽

---

## 🔍 如何查看完整数据？

### 方法 1: 切换到完整模式（推荐）

```bash
# 修改 .env.local
ACTION_LOG_MODE=full

# 重启服务器
npm run dev
```

### 方法 2: 临时添加 console.log

在需要查看的 action 中添加：

```javascript
export async function getUserListAction(params) {
	const result = await userCrud.getList(params);
	
	// 临时查看完整数据
	console.log('🔍 完整数据:', JSON.stringify(result, null, 2));
	
	return result;
}
```

### 方法 3: 使用调试器

1. 在 action 中设置断点
2. 启动调试模式
3. 在 Variables 面板查看完整数据

---

## 📊 三种模式对比

| 特性 | 极简模式 | 摘要模式 | 完整模式 |
|------|---------|---------|---------|
| **显示数据** | 状态+数量 | 关键字段 | 全部 |
| **终端输出** | 超简洁 | 简洁 | 较长 |
| **查看详情** | 无法查看 | 需切换模式 | 直接滚动 |
| **性能影响** | 无 | 无 | 无 |
| **推荐场景** | 演示/录屏 | 关注性能 | 日常开发 |

---

## 🎨 完整示例

### 场景 1: 列表查询（完整模式）

```bash
--------【开始】【Server Action】【admin/menus】【getList】--------
【请求参数】: { pageIndex: 1, pageSize: 1000 }
【返回数据】: {
  success: true,
  data: [
    { _id: '1', name: 'Dashboard', icon: 'DashboardOutlined', ... },
    { _id: '2', name: 'Users', icon: 'UserOutlined', ... },
    { _id: '3', name: 'Settings', icon: 'SettingOutlined', ... }
  ],
  total: 3
}
【总体耗时】: 45 毫秒
--------【结束】【Server Action】【admin/menus】【getList】--------
```

### 场景 2: 列表查询（摘要模式）

```bash
--------【开始】【Server Action】【admin/menus】【getList】--------
【请求参数】: { pageIndex: 1, pageSize: 1000 }
【返回数据】: { success: true, total: 3, _keys: '3 keys' }
提示: 设置 ACTION_LOG_MODE=full 查看完整数据
【总体耗时】: 45 毫秒
--------【结束】【Server Action】【admin/menus】【getList】--------
```

### 场景 3: 列表查询（极简模式）🆕

```bash
--------【开始】【Server Action】【admin/menus】【getList】--------
【请求参数】: Object
【返回数据】: ✓ Array(3), total: 3
【总体耗时】: 45 毫秒
--------【结束】【Server Action】【admin/menus】【getList】--------
```

### 场景 4: 错误情况（始终显示完整）

```bash
--------【开始】【Server Action】【admin/users】【delete】--------
【请求参数】: { id: 'invalid-id' }
【Error】: {
  success: false,
  error: 'User not found',
  message: 'User not found'
}
【总体耗时】: 30 毫秒
--------【结束】【Server Action】【admin/users】【delete】--------
```

> **注意**：错误信息在所有模式下都会完整显示！

---

## 🎯 最佳实践

### 1. 开发阶段
```env
# .env.local
ACTION_LOG_MODE=full
```
👍 可以随时查看数据，方便调试

### 2. 性能优化阶段
```env
# .env.local
ACTION_LOG_MODE=summary
```
👍 专注于耗时指标

### 3. 演示/录屏
```bash
ACTION_LOG_MODE=simple npm run dev
```
👍 极致简洁，只显示状态和耗时

### 4. 紧急调试
```bash
# 临时切换到完整模式
ACTION_LOG_MODE=full npm run dev
```
👍 快速查看问题

---

## 📚 相关文档

- [Action Logger 配置](./docs/admin/ACTION_LOGGER.md)
- [清理总结](./CLEANUP_SUMMARY.md)

---

**灵活切换，按需查看！** ✨

