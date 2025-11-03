# Server Actions 日志格式优化

## ✨ 智能折叠显示

日志系统现在会自动折叠大数组和对象，让控制台输出更清晰！

---

## 📊 显示规则

### 数组折叠规则

- **≤ 3 项**: 完整显示所有内容
- **> 3 项**: 折叠为 `[Array(n)] 展开查看 ↓`

### 对象折叠规则

- **重要对象**: 始终完整显示（包含 `success`, `error`, `message`, `total` 等关键字段）
- **≤ 5 个字段**: 完整显示
- **> 5 个字段**: 折叠为 `{Object} n keys`

---

## 🎨 效果对比

### 之前（冗长）

```bash
--------【开始】【Server Action】【admin/menus】【getMenuList】--------
21:47:31.329 【请求参数】: { pageIndex: 1, pageSize: 1000, sort: {} }
21:47:31.329 【返回数据】: {
  success: true,
  data: [
    {
      _id: '69087e61d5283f3d218130fd',
      key: 'admin-dashboard',
      name: 'Dashboard',
      icon: 'DashboardOutlined',
      url: '/admin',
      sortOrder: 0,
      parentId: null,
      remark: null,
      enabled: true,
      hidden: false,
      createdAt: 2025-11-03T10:05:21.688Z,
      updatedAt: 2025-11-03T12:47:06.407Z
    },
    {
      _id: '69087f13d5283f3d218130fe',
      key: 'permission',
      name: 'Users & Permission',
      icon: 'UserOutlined',
      url: null,
      sortOrder: 998,
      parentId: null,
      remark: null,
      enabled: true,
      hidden: false,
      createdAt: 2025-11-03T10:08:19.866Z,
      updatedAt: 2025-11-03T12:43:59.761Z,
      children: [Array]
    },
    ... 更多项
  ],
  total: 3
}
21:47:31.329 【总体耗时】: 971 毫秒
--------【结束】【Server Action】【admin/menus】【getMenuList】--------
```

### 现在（简洁）

```bash
--------【开始】【Server Action】【admin/menus】【getMenuList】--------
21:47:31.329 【请求参数】: { pageIndex: 1, pageSize: 1000, sort: {} }
21:47:31.329 【返回数据】: {
  success: true,
  data: '[Array(150)] 展开查看 ↓',
  total: 150
}
21:47:31.329 💡 数据包含 150 条记录，使用 console.log 查看完整数据
21:47:31.329 【总体耗时】: 971 毫秒
--------【结束】【Server Action】【admin/menus】【getMenuList】--------
```

---

## 🎯 示例

### 示例 1: 用户列表（大数组）

**输出**:
```bash
--------【开始】【Server Action】【admin/users】【getList】--------
【请求参数】: { pageIndex: 1, pageSize: 20 }
【返回数据】: {
  success: true,
  data: '[Array(20)] 展开查看 ↓',
  total: 150
}
💡 数据包含 20 条记录，使用 console.log 查看完整数据
【总体耗时】: 120 毫秒
--------【结束】【Server Action】【admin/users】【getList】--------
```

### 示例 2: 单个用户（小对象）

**输出**:
```bash
--------【开始】【Server Action】【admin/users】【getDetail】--------
【请求参数】: { id: '123' }
【返回数据】: {
  success: true,
  data: {
    _id: '123',
    name: '张三',
    email: 'zhang@example.com',
    role: 'user',
    createdAt: '2025-11-03T10:00:00.000Z'
  }
}
【总体耗时】: 50 毫秒
--------【结束】【Server Action】【admin/users】【getDetail】--------
```

### 示例 3: 错误响应（始终完整显示）

**输出**:
```bash
--------【开始】【Server Action】【admin/users】【delete】--------
【请求参数】: { id: 'invalid-id' }
【Error】: {
  success: false,
  error: 'User not found',
  message: 'User not found'
}
【总体耗时】: 80 毫秒
--------【结束】【Server Action】【admin/users】【delete】--------
```

---

## ⚙️ 自定义配置

如果需要调整折叠规则，可以修改 `lib/action-logger.js` 中的 `formatData` 函数参数：

```javascript
function formatData(data, maxItems = 3, maxDepth = 2) {
	// maxItems: 数组显示的最大项数（默认 3）
	// maxDepth: 递归深度（默认 2）
}
```

### 调整示例

```javascript
// 显示更多数组项（5项以内不折叠）
function formatData(data, maxItems = 5, maxDepth = 2) { ... }

// 更深的递归（显示更多嵌套内容）
function formatData(data, maxItems = 3, maxDepth = 3) { ... }
```

---

## 💡 如何查看完整数据？

如果需要查看被折叠的完整数据，可以在代码中临时添加：

```javascript
export async function getUserListAction(params) {
	const result = await userCrud.getList(params);
	
	// 临时查看完整数据
	console.log('完整数据:', JSON.stringify(result, null, 2));
	
	return result;
}
```

或者使用调试器：
1. 在 action 函数中设置断点
2. 检查 `result` 变量
3. 在调试控制台展开查看

---

## 🎨 颜色说明

日志中的颜色编码：

- 🔵 **蓝色** - 开始/结束分隔线
- ⚫ **默认** - 请求参数、返回数据
- 🟢 **绿色** - 成功操作的耗时
- 🟡 **黄色** - 失败操作的耗时
- 🔴 **红色** - 错误信息
- 💡 **提示** - 数据折叠提示

---

## 📝 最佳实践

1. **日常开发**: 使用折叠日志，保持控制台清晰
2. **调试问题**: 在特定 action 中添加 `console.log` 查看完整数据
3. **性能分析**: 关注"总体耗时"指标
4. **错误排查**: 错误信息始终完整显示，便于快速定位问题

---

**享受更清晰的控制台输出！** ✨

