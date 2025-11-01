# Smart CRUD 系统 - 基于 vk-unicloud 万能表格/表单思想

## 概述

参考 vk-unicloud 的万能表格/表单设计思想，实现了一套基于统一字段配置的智能 CRUD 系统。

## 核心文件

### 1. 字段类型注册表
**文件**: `lib/admin/crud/field-types.js`

定义了 16 种内置字段类型：
- `text` - 单行文本
- `textarea` - 多行文本
- `number` - 数字
- `money` - 金额
- `percentage` - 百分比
- `date` - 日期
- `datetime` - 日期时间
- `daterange` - 日期范围（仅搜索）
- `datetimerange` - 日期时间范围（仅搜索）
- `select` - 下拉选择
- `radio` - 单选
- `checkbox` - 多选
- `switch` - 开关
- `image` - 图片
- `file` - 文件
- `json` - JSON

每个类型包含：
- `table`: 表格渲染函数
- `form`: 表单组件生成函数
- `search`: 搜索组件生成函数（可选）
- `detail`: 详情渲染函数（可选）

### 2. 字段生成器
**文件**: `lib/admin/crud/field-generator.js`

提供核心生成函数：
- `generateTableColumns(fieldsConfig)` - 生成表格列
- `generateFormFields(fieldsConfig, options)` - 生成表单字段
- `generateDetailColumns(fieldsConfig)` - 生成详情列
- `generateSearchConfig(fieldsConfig)` - 生成搜索配置
- `validateFieldsConfig(fieldsConfig)` - 验证字段配置
- `mergeFieldsConfig(base, override)` - 合并字段配置

### 3. 搜索转换器
**文件**: `lib/admin/crud/search-transformer.js`

提供搜索相关功能：
- `transformSearchToQuery(searchParams, fieldsConfig)` - 转换搜索参数为 MongoDB 查询
- `buildSortCondition(sortParams, fieldsConfig)` - 构建排序条件
- `mergeQueryConditions(baseQuery, searchQuery)` - 合并查询条件
- `generateTableDataConfig(fieldsConfig, searchParams, options)` - 生成完整查询配置

支持的搜索模式：
- `like` / `%%` - 模糊搜索
- `likeLeft` / `%=` - 左模糊
- `likeRight` / `=%` - 右模糊
- `exact` / `==` - 精确搜索
- `range` / `[]` - 范围搜索
- `in` - 包含（多选）
- `gt` / `>` - 大于
- `gte` / `>=` - 大于等于
- `lt` / `<` - 小于
- `lte` / `<=` - 小于等于
- `ne` / `!=` - 不等于

### 4. SmartCrudPage 组件
**文件**: `components/admin/smart-crud-page.jsx`

智能 CRUD 页面组件，特点：
- 基于统一字段配置自动生成 UI
- 支持所有 CrudPage 的功能
- 自动处理搜索条件转换
- 自动生成表单验证规则
- 支持自定义渲染和扩展

## 使用方式

### 快速开始

1. 复制模板文件
```bash
cp app/(admin)/admin/_template/smart-page.js app/(admin)/admin/your-page/page.js
```

2. 配置字段
```javascript
const fieldsConfig = [
	{
		key: 'name',
		title: 'Name',
		type: 'text',
		table: { width: 150, ellipsis: true },
		form: { required: true },
		search: { enabled: true, mode: 'like' },
	},
	// ... 更多字段
];
```

3. 配置 Actions
```javascript
const actions = {
	getList: getDataListAction,
	update: updateDataAction,
	delete: deleteDataAction,
};
```

4. 使用组件
```javascript
return (
	<SmartCrudPage
		fieldsConfig={fieldsConfig}
		actions={actions}
		title='Your Page Title'
	/>
);
```

### 完整示例

参考模板文件：
- `app/(admin)/admin/_template/smart-page.js` - 智能 CRUD 模板（推荐）
- `app/(admin)/admin/_template/page.js` - 传统 CRUD 模板（兼容）

## 优势

### 1. 减少代码量
- 传统方式：120-150 行代码
- 智能方式：40-50 行代码
- **减少 67% 代码量**

### 2. 统一配置
- 只需维护一份字段配置
- 表格、表单、搜索自动同步
- 修改一处，全局生效

### 3. 类型安全
- 内置 16 种常用字段类型
- 自动生成验证规则
- 统一的数据转换逻辑

### 4. 易于扩展
- 支持自定义字段类型
- 支持自定义渲染函数
- 支持字段级别的配置覆盖

### 5. 降低学习成本
- 统一的配置格式
- 清晰的字段配置结构
- 丰富的文档和示例

## 字段配置格式

```javascript
{
	// 基础配置（必需）
	key: 'fieldName',        // 字段名
	title: 'Field Title',    // 显示标题
	type: 'text',            // 字段类型
	
	// 表格配置
	table: {
		width: 150,          // 列宽
		ellipsis: true,      // 超长省略
		copyable: true,      // 可复制
		sorter: true,        // 可排序
		defaultSort: 'desc', // 默认排序
		render: (value, record) => { ... }, // 自定义渲染
	},
	
	// 表单配置
	form: {
		required: true,      // 必填
		placeholder: '...',  // 占位符
		disabled: false,     // 禁用
		minLength: 2,        // 最小长度
		maxLength: 50,       // 最大长度
		pattern: /regex/,    // 正则验证
		validator: (value) => { ... }, // 自定义验证
		render: (field) => { ... }, // 自定义渲染
	},
	
	// 搜索配置
	search: {
		enabled: true,       // 启用搜索
		mode: 'like',        // 搜索模式
	},
	
	// 选项配置（用于 select/radio/checkbox）
	options: [
		{ label: 'Label', value: 'value', color: 'green' },
	],
	
	// 控制显示
	hideInTable: false,      // 隐藏表格列
	hideInForm: false,       // 隐藏表单字段
	hideInDetail: false,     // 隐藏详情字段
}
```

## 扩展自定义类型

```javascript
import { registerFieldType } from '@/lib/admin/crud/field-types';

registerFieldType('customType', {
	table: (value, config) => {
		// 表格渲染逻辑
		return <YourTableComponent value={value} />;
	},
	form: (config) => {
		// 表单组件
		return <YourFormComponent {...config} />;
	},
	search: (config) => {
		// 搜索组件（可选）
		return <YourSearchComponent {...config} />;
	},
});
```

## 与 vk-unicloud 的对比

### 相似之处

1. **统一配置思想**
   - vk: `columns` 配置同时服务于表格、表单、搜索
   - 本项目: `fieldsConfig` 统一配置所有场景

2. **类型驱动组件**
   - vk: 通过 `type` 字段自动选择组件（29 种类型）
   - 本项目: 通过 `type` 字段自动选择组件（16 种类型）

3. **搜索模式**
   - vk: 支持 `mode` 配置（`%%`, `==`, `[]` 等）
   - 本项目: 支持 `mode` 配置（`like`, `exact`, `range` 等）

4. **数据层统一处理**
   - vk: `vk.baseDao.getTableData` 统一处理查询
   - 本项目: `transformSearchToQuery` 统一转换查询条件

### 差异之处

1. **技术栈**
   - vk: uni-app + uniCloud
   - 本项目: Next.js + React + Ant Design

2. **组件库**
   - vk: Element UI
   - 本项目: Ant Design + ProComponents

3. **数据层**
   - vk: 云函数自动处理
   - 本项目: Server Actions + 手动调用转换器

4. **扩展性**
   - vk: 封装较深，扩展需要了解框架内部
   - 本项目: 开放式设计，易于扩展和自定义

## 迁移指南

### 从传统 CrudPage 迁移到 SmartCrudPage

1. **提取字段配置**
```javascript
// 旧方式
const columns = [
	{ title: 'Name', dataIndex: 'name', width: 150 },
	{ title: 'Status', dataIndex: 'status', width: 120 },
];

const formFields = (
	<>
		<ProFormText name='name' label='Name' />
		<ProFormSelect name='status' label='Status' />
	</>
);

// 新方式
const fieldsConfig = [
	{
		key: 'name',
		title: 'Name',
		type: 'text',
		table: { width: 150 },
		form: { required: true },
		search: { enabled: true, mode: 'like' },
	},
	{
		key: 'status',
		title: 'Status',
		type: 'select',
		options: [...],
		table: { width: 120 },
		form: { required: true },
		search: { enabled: true },
	},
];
```

2. **更新组件引用**
```javascript
// 旧方式
import CrudPage from '@/components/admin/crud-page';

// 新方式
import SmartCrudPage from '@/components/admin/smart-crud-page';
```

3. **简化配置**
```javascript
// 旧方式
<CrudPage
	columns={columns}
	formFields={formFields}
	searchConfig={searchConfig}
	// ...
/>

// 新方式
<SmartCrudPage
	fieldsConfig={fieldsConfig}
	// searchConfig 自动生成
	// ...
/>
```

## 后续规划

### 短期（已完成）
- [x] 实现基础字段类型（16 种）
- [x] 实现字段生成器
- [x] 实现搜索转换器
- [x] 实现 SmartCrudPage 组件
- [x] 创建模板和文档

### 中期
- [ ] 补充更多字段类型（富文本、级联选择、树形选择等）
- [ ] 优化搜索转换器（支持更多 MongoDB 操作符）
- [ ] 实现字段配置的 TypeScript 类型定义
- [ ] 创建字段配置生成工具（CLI）

### 长期
- [ ] 实现可视化配置界面
- [ ] 支持字段配置的导入/导出
- [ ] 集成到项目脚手架
- [ ] 发布为独立 npm 包

## 相关文档

- [Smart CRUD 使用指南](./SMART_CRUD.md)
- [CRUD 开发指南](./CRUD_GUIDE.md)
- [BaseDao 工具](./BASE_DAO.md)

## 贡献

欢迎贡献新的字段类型或改进现有功能！

## 许可

MIT

