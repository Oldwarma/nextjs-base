# SmartCrudPage 模板使用指南

> 基于 Menus、Permissions、Roles 等页面总结的最新模板规范

---

## 🎯 核心理念

### 1. 两个文件，完整功能

```
app/(admin)/
├── admin/{resource}/
│   └── page.js                         # 前端页面 + fieldsConfig
└── actions/{module}/
    └── crud-action.{resource}.js       # Server Actions + 配置
```

**不再需要**单独的 config 文件！

### 2. 配置驱动 + 类型驱动

- **配置驱动**: 一份 `fieldsConfig` 应用于 Table、Form、Search、Detail
- **类型驱动**: 通过 `type` 字段自动渲染组件

---

## 🚀 快速开始

### 步骤 1: 复制模板文件

```bash
# 1. 创建页面目录
mkdir -p app/(admin)/admin/{module}/{resource}

# 2. 复制 Page 模板
cp templates/crud/page.template.js app/(admin)/admin/{module}/{resource}/page.js

# 3. 复制 Action 模板
cp templates/crud/action.template.js app/(admin)/actions/{module}/crud-action.{resource}.js
```

### 步骤 2: 批量替换变量

在你的编辑器中，批量替换以下变量：

| 变量 | 说明 | 示例 |
|------|------|------|
| `{RESOURCE_NAME}` | 资源名(小写单数) | `coupon` |
| `{RESOURCE_LABEL}` | 资源标签(首字母大写) | `Coupon` |
| `{COLLECTION_NAME}` | MongoDB 集合名(小写复数) | `coupons` |
| `{ACTION_PATH}` | Action 文件路径 | `cms`, `rbac`, `system` |

**快捷替换命令**（macOS/Linux）：

```bash
# 在 page.js 中替换
sed -i '' 's/{RESOURCE_NAME}/coupon/g' page.js
sed -i '' 's/{RESOURCE_LABEL}/Coupon/g' page.js
sed -i '' 's/{ACTION_PATH}/cms/g' page.js

# 在 action 文件中替换
sed -i '' 's/{RESOURCE_NAME}/coupon/g' crud-action.coupon.js
sed -i '' 's/{RESOURCE_LABEL}/Coupon/g' crud-action.coupon.js
sed -i '' 's/{COLLECTION_NAME}/coupons/g' crud-action.coupon.js
```

### 步骤 3: 配置字段

在 `page.js` 中，修改 `fieldsConfig` 数组，定义你的字段。

---

## 📋 最新规范

### ✅ 正确写法

```javascript
'use client';

// 1. 静态导入 SmartCrudPage（不使用 dynamic）
import SmartCrudPage from '@/components/admin/smart-crud-page';

// 2. 统一导入 Actions
import * as resourceActions from '@/app/(admin)/actions/module/crud-action.resource';

export default function ResourceManagementPage() {
	// 3. 直接定义 fieldsConfig（不使用 useMemo）
	const fieldsConfig = [
		{
			key: 'name',
			title: 'Name',
			type: 'text',
			table: { width: 200 },
			form: { required: true },
			search: { mode: 'like' },  // 直接使用 mode，不需要 enabled: true
		},
	];

	// 4. 在 JSX 中内联定义 actions
	return (
		<SmartCrudPage
			fieldsConfig={fieldsConfig}
			actions={{
				getList: resourceActions.getResourceListAction,
				create: resourceActions.createResourceAction,
				update: resourceActions.updateResourceAction,
				delete: resourceActions.deleteResourceAction,
			}}
			title='Resource Management'
			enableCreate={true}
			enableEdit={true}
			enableDelete={true}
			enableDetail={true}
		/>
	);
}
```

### ❌ 旧写法（不推荐）

```javascript
// ❌ 不要使用 dynamic 导入
const SmartCrudPage = dynamic(() => import('@/components/admin/smart-crud-page'), { ssr: false });

// ❌ 不要使用 useMemo 包裹 fieldsConfig
const fieldsConfig = useMemo(() => [...], []);

// ❌ 不要单独定义 actions 对象
const actions = { getList, create, update, delete: deleteItem };

// ❌ 不要使用 search.enabled
search: { enabled: true, mode: 'like' }  // enabled 是多余的
```

---

## 📋 fieldsConfig 配置详解

### 基础结构

```javascript
const fieldsConfig = [
  {
    key: 'fieldName',        // 字段名（必需）
    title: 'Field Label',    // 显示标签（必需）
    type: 'text',            // 字段类型（必需）
    
    // 表格配置（false 表示不显示）
    table: {
      width: 150,
      ellipsis: true,
      align: 'center',
    },
    
    // 表单配置（false 表示不显示）
    form: {
      required: true,
      placeholder: 'Enter value',
      fieldProps: {
        showCount: true,
        maxLength: 50,
      },
    },
    
    // 搜索配置（false 表示不可搜索）
    search: {
      mode: 'like',           // 搜索模式
      placeholder: 'Search',
    },
  },
];
```

### 支持的字段类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `text` | 单行文本 | 名称、标题 |
| `textarea` | 多行文本 | 描述、备注 |
| `number` | 数字输入 | 数量、排序 |
| `select` | 下拉选择 | 状态、类型 |
| `switch` | 开关 | 启用/禁用 |
| `date` | 日期选择 | 生日、过期日期 |
| `datetime` | 日期时间 | 创建时间 |
| `tree-select` | 树形选择 | 父级菜单 |
| `icon` | 图标选择 | 菜单图标 |
| `image` | 图片上传 | 头像、封面 |
| `markdown` | Markdown 编辑器 | 文章内容 |

### 搜索模式

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| `like` | 模糊搜索 | 文本字段 |
| `exact` | 精确搜索 | 状态、布尔值 |
| `in` | 数组包含 | 多选字段 |
| `range` | 范围搜索 | 日期范围 |

---

## 🎨 配置示例

### 1. 基础字段

```javascript
// 文本字段
{
  key: 'name',
  title: 'Name',
  type: 'text',
  table: { width: 200, ellipsis: true },
  form: {
    required: true,
    placeholder: 'Enter name',
    fieldProps: {
      showCount: true,
      maxLength: 50,
    },
  },
  search: { mode: 'like' },
}

// 开关字段
{
  key: 'enable',
  title: 'Status',
  type: 'switch',
  table: { width: 100, align: 'center' },
  form: {
    fieldProps: {
      checkedChildren: 'Enabled',
      unCheckedChildren: 'Disabled',
    },
  },
  search: { fieldProps: { placeholder: 'Filter by status' } },
}

// 时间字段（只读）
{
  key: 'createdAt',
  title: 'Created At',
  type: 'datetime',
  table: { width: 180 },
  form: false,
  search: false,
}
```

### 2. 树形选择（动态加载）

```javascript
{
  key: 'parent_id',
  title: 'Parent Menu',
  type: 'tree-select',
  table: false,
  form: {
    placeholder: 'Select parent menu',
    action: 'getMenuTreeForSelectAction',  // Action 名称，自动调用
    fieldProps: {
      allowClear: true,
      showSearch: true,
      treeDefaultExpandAll: false,
    },
  },
  search: false,
}
```

### 3. 自定义表格渲染

```javascript
{
  key: 'enable',
  title: 'Status',
  type: 'switch',
  table: {
    width: 100,
    render: (enable) => (
      enable ? (
        <Tag icon={<CheckCircleOutlined />} color='success'>Enabled</Tag>
      ) : (
        <Tag icon={<CloseCircleOutlined />} color='default'>Disabled</Tag>
      )
    ),
  },
}
```

---

## 🔧 Action 配置

### 基础配置

```javascript
const resourceConfig = {
  collectionName: 'resources',      // MongoDB 集合名
  primaryKey: 'id',                 // 主键字段
  softDelete: false,                // 是否软删除
  
  fields: {
    creatable: ['name', 'enable', 'remark'],  // 可创建字段
    updatable: ['name', 'enable', 'remark'],  // 可更新字段
    searchable: ['name', 'remark'],           // 可搜索字段
  },
  
  query: {
    defaultSort: { createdAt: -1 },  // 默认排序
    defaultPageSize: 20,             // 默认分页大小
  },
  
  validation: {
    name: {
      required: true,
      type: 'string',
      minLength: 2,
      maxLength: 50,
    },
  },
};
```

### 生命周期钩子

```javascript
hooks: {
  beforeCreate: async (data) => {
    // 创建前处理
    return data;
  },
  
  beforeUpdate: async (id, data) => {
    // 更新前处理
    return data;
  },
  
  beforeDelete: async (id) => {
    // 删除前检查
    return true;
  },
}
```

---

## 📚 参考示例

| 页面 | 路径 | 特点 |
|------|------|------|
| Menus | `admin/rbac/menus` | 树形表格、图标选择、动态 TreeSelect |
| Permissions | `admin/rbac/permissions` | 树形结构、数组字段 |
| Roles | `admin/rbac/roles` | 自定义操作、权限分配 |
| Posts | `admin/cms/post` | Markdown 编辑器、批量操作 |

---

## 🐛 常见问题

### 1. 搜索不生效

**检查**: `search` 配置是否正确设置了 `mode`

```javascript
// ❌ 错误
search: { enabled: true }

// ✅ 正确
search: { mode: 'like' }
```

### 2. TreeSelect 数据不加载

**检查**: `form.action` 是否在 `actions` 中注册

```javascript
// page.js
actions={{
  getList: ...,
  getMenuTreeForSelectAction: menuActions.getMenuTreeForSelectAction,  // 必须注册
}}

// fieldsConfig
form: {
  action: 'getMenuTreeForSelectAction',  // 与上面对应
}
```

### 3. 删除报错 "ID is required"

**检查**: `rowKey` 是否正确配置

```javascript
// ❌ 错误
rowKey={(record) => record.id}

// ✅ 正确
rowKey='id'
```

---

## ✨ 总结

使用 SmartCrudPage 模板的优势：

- 🚀 **快速开发** - 2 个文件，10 分钟完成
- 📦 **代码复用** - 减少 50-60% 代码量
- 🎯 **统一规范** - 所有页面结构一致
- 🔧 **易于维护** - 配置集中，修改方便
- ⚡ **类型驱动** - 自动渲染，开箱即用

**开始使用模板，提升开发效率！** 🎉
