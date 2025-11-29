# CRUD 第二轮修复总结

**日期：** 2024-11-13  
**版本：** 2.0

---

## 🐛 新发现的问题

用户再次测试后发现了两个关键问题：

1. **Parent Permission 下拉菜单显示全是 "---"** ❌
2. **Actions 列依然显示 [object Object]**，表格空行很大 ❌

---

## 修复方案

### 问题 1：Parent Permission 下拉菜单显示 "---"

**根本原因：**

`getPermissionTreeForSelectAction` 返回的数据结构不符合 Ant Design TreeSelect 组件的要求。

TreeSelect 需要的数据格式：
```javascript
[
  {
    title: "显示文本",  // 必需
    value: "值",        // 必需
    key: "唯一键",      // 必需
    children: [...]     // 可选
  }
]
```

但 `sysDao.getPermissionTreeForSelect()` 返回的格式：
```javascript
[
  {
    id: "xxx",
    name: "xxx",
    parent_id: "xxx",
    children: [...]
    // ❌ 缺少 title, value, key
  }
]
```

**解决方案：**

修改 `app/(admin)/actions/rbac/crud-action.permission.js` 中的 `getPermissionTreeForSelectAction`：

```javascript
export const getPermissionTreeForSelectAction = wrapQueryAction('permission', async () => {
	// 使用 sysDao.getPermissionTreeForSelect 获取完整的权限树
	const tree = await sysDao.getPermissionTreeForSelect({ withLabel: false });
	
	// 转换为 TreeSelect 需要的格式
	const convertToTreeSelectFormat = (nodes) => {
		if (!nodes || !Array.isArray(nodes)) return [];
		
		return nodes.map(node => {
			const treeNode = {
				title: node.name,    // 显示名称
				value: node.id,      // 值为 ID
				key: node.id,        // key 也是 ID
			};
			
			// 递归处理子节点
			if (node.children && node.children.length > 0) {
				treeNode.children = convertToTreeSelectFormat(node.children);
			}
			
			return treeNode;
		});
	};
	
	const formattedTree = convertToTreeSelectFormat(tree);
	
	return {
		success: true,
		data: formattedTree || [],
	};
});
```

**修复效果：**
- 下拉菜单正确显示所有权限名称
- 可以正确选择父权限
- 支持树形结构展示和选择

---

### 问题 2：Actions 列显示 [object Object]

**根本原因：**

`formatter` 函数在 `generateTableColumns` 中没有被优先应用，或者 `array` 类型的默认渲染逻辑有问题。

**解决方案：**

将 `actions` 字段的 `type` 从 `array` 改为 `text`，并使用 `render` 函数代替 `formatter`：

```javascript
{
  key: 'actions',
  title: 'Actions',
  type: 'text',  // 改为 text 类型
  table: {
    width: 250,
    ellipsis: true,
    render: (value) => {  // 使用 render 而不是 formatter
      // 1. 处理空值
      if (!value) return <span style={{ color: '#999' }}>-</span>;
      if (!Array.isArray(value)) return <span>{String(value)}</span>;
      if (value.length === 0) return <span style={{ color: '#999' }}>-</span>;
      
      // 2. 确保将数组元素转换为字符串
      const stringValues = value.map(item => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
          return item.value || item.name || JSON.stringify(item);
        }
        return String(item);
      });
      
      // 3. 只显示前2个，其余显示数量
      const maxDisplay = 2;
      const displayed = stringValues.slice(0, maxDisplay);
      const remaining = stringValues.length - maxDisplay;
      
      let text = displayed.join(', ');
      if (remaining > 0) {
        text += ` (+${remaining} more)`;
      }
      
      // 4. 返回 JSX（带 tooltip）
      return (
        <span title={stringValues.join('\n')} style={{ cursor: 'help' }}>
          {text}
        </span>
      );
    },
  },
  form: {
    type: 'list',
    fieldProps: {
      copyIconProps: false,
      deleteIconProps: { tooltipText: 'Delete Action' },
      creatorButtonProps: { creatorButtonText: 'Add Action' },
    },
  },
  search: false,
  detail: {
    render: (value) => {
      if (!value || !Array.isArray(value) || value.length === 0) {
        return <span style={{ color: '#999' }}>-</span>;
      }
      const stringValues = value.map(item => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
          return item.value || item.name || JSON.stringify(item);
        }
        return String(item);
      });
      return (
        <div style={{ whiteSpace: 'pre-wrap' }}>
          {stringValues.join('\n')}
        </div>
      );
    },
  },
}
```

**修复效果：**
- 表格中正确显示数组内容（不再是 [object Object]）
- 只显示前 2 个元素，多余的显示 " (+N more)"
- 鼠标悬停显示完整列表
- 详情页显示完整列表（每行一个）
- 表格行高正常

---

## 📊 修复对比

### 修复前 vs 修复后

| 功能 | 修复前 | 修复后 |
|------|--------|--------|
| **Parent Permission 下拉** | 显示 "---" | 显示权限名称 |
| **Actions 表格列** | [object Object] | 正确显示数组内容 |
| **Actions 详情页** | "-" | 完整列表（换行） |
| **表格行高** | 异常大 | 正常 |

---

## 🔍 关键发现

### 1. TreeSelect 数据格式要求

Ant Design 的 TreeSelect 组件**严格要求**数据格式：

```javascript
// 正确格式
{
  title: "显示文本",  // 必需
  value: "选择值",    // 必需
  key: "唯一标识",    // 必需
  children: []        // 可选
}

// ❌ 错误格式（会显示 "---"）
{
  id: "xxx",
  name: "xxx",
  // 缺少 title, value, key
}
```

### 2. render vs formatter

在 `fieldsConfig` 中：

- **`render`**：返回 React JSX 元素，优先级最高
- **`formatter`**：返回字符串或数字，优先级次之
- **`typeConfig`**：类型默认渲染，优先级最低

当需要复杂渲染（如处理数组、对象）时，应该使用 `render` 而不是 `formatter`。

### 3. type 的选择

- **`array` 类型**：可能有默认的渲染逻辑，不够灵活
- **`text` 类型 + 自定义 render**：完全控制渲染逻辑，更可靠

---

## 📝 经验教训

### 1. 数据格式转换要彻底

从数据库查询到 UI 展示，中间可能需要多次数据格式转换：

```
数据库格式 → DAO 格式 → API 返回格式 → UI 组件格式
```

每一层都要确保格式正确，尤其是 UI 组件层。

### 2. 组件 API 文档要仔细阅读

Ant Design TreeSelect 的 `treeData` 格式要求在官方文档中有明确说明，但容易被忽略。

### 3. 复杂数据渲染优先使用 render

对于数组、对象等复杂数据类型：
- 使用 `render` 返回 JSX
- ❌ 不要依赖 `formatter` 或默认类型渲染

---

## 🎯 测试清单

请再次测试以下功能：

### 1. Parent Permission 字段
- [ ] 创建弹窗：下拉菜单显示所有权限（树形结构）
- [ ] 编辑弹窗：下拉菜单显示所有权限
- [ ] 编辑弹窗：当前父权限正确显示（不是 ID）
- [ ] 表格列：显示父权限名称（不是 ID）
- [ ] 详情页：显示父权限名称

### 2. Actions 字段
- [ ] 表格列：正确显示数组内容（不是 [object Object]）
- [ ] 表格列：只显示前 2 个，多余的显示数量
- [ ] 表格列：鼠标悬停显示完整列表
- [ ] 详情页：显示完整列表（换行显示）
- [ ] 表格行高：正常（不是异常大）

### 3. 其他字段
- [ ] CRUD Category：显示标签和颜色
- [ ] Permission Level：显示标签和颜色
- [ ] Enable：显示 switch 样式（带图标和颜色）

### 4. 整体功能
- [ ] 创建新权限
- [ ] 编辑权限
- [ ] 删除权限
- [ ] 搜索功能
- [ ] 排序功能

---

## 📚 相关文件

修改的文件：

1. **`app/(admin)/actions/rbac/crud-action.permission.js`**
   - 修改 `getPermissionTreeForSelectAction`
   - 添加 `convertToTreeSelectFormat` 函数

2. **`app/(admin)/admin/rbac/permissions/page.js`**
   - 修改 `actions` 字段配置
   - 从 `type: 'array'` 改为 `type: 'text'`
   - 从 `formatter` 改为 `render`

---

## 🚀 下一步

如果测试通过，可以考虑：

1. 将 `convertToTreeSelectFormat` 函数提取为公共工具函数
2. 将 Actions 列的渲染逻辑提取为可复用组件
3. 更新文档，说明 TreeSelect 数据格式要求
4. 继续重构其他 RBAC 页面（roles, menus, users）

---

**文档版本：** 2.0  
**最后更新：** 2024-11-13  
**修复人：** Claude (Sonnet 4.5)

