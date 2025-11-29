# SmartCrudPage 增强进度报告

**日期：** 2024-11-13  
**目标：** 参考 [vk-unicloud 内置组件](https://vkdoc.fsq.pub/admin/2/table.html) 实现智能渲染

---

## 已完成（Phase 1 - Part 1）

### 1. Switch 类型增强 ✅

**文件：** `lib/crud/field-types.js` (第 833-871 行)

**新增功能：**
- 支持 `activeText` / `inactiveText` (优先)
- 支持 `trueText` / `falseText` (向后兼容)
- 支持 `activeColor` / `inactiveColor` (自定义颜色)
- 支持 `activeIcon` / `inactiveIcon` (图标名称)
- 动态加载 Ant Design 图标

**配置示例：**
```javascript
{
  key: 'enable',
  type: 'switch',
  table: {
    activeText: 'Enabled',
    inactiveText: 'Disabled',
    activeColor: 'success',
    inactiveColor: 'error',
    activeIcon: 'CheckCircleOutlined',
    inactiveIcon: 'CloseCircleOutlined',
  },
}
```

**渲染结果：**
- `true` → `<Tag color="success" icon={<CheckCircleOutlined />}>Enabled</Tag>`
- `false` → `<Tag color="error" icon={<CloseCircleOutlined />}>Disabled</Tag>`

---

### 2. Select + valueEnum 增强 ✅

**文件：** `lib/crud/field-types.js` (第 649-723 行)

**新增功能：**
- 支持 `table.valueEnum` (Ant Design Pro 风格)
- 支持 `status` 字段自动映射颜色
- 状态映射：Success → success, Error → error, Warning → warning 等
- 支持单选和多选
- 向后兼容 `options` 配置

**状态到颜色映射：**
```javascript
const statusColorMap = {
  Success: 'success',
  Error: 'error',
  Default: 'default',
  Processing: 'processing',
  Warning: 'warning',
};
```

**配置示例：**
```javascript
{
  key: 'crud_category',
  type: 'select',
  table: {
    valueEnum: {
      0: { text: 'Unclassified', status: 'Default' },
      1: { text: 'Create', status: 'Success' },
      2: { text: 'Delete', status: 'Error' },
      3: { text: 'Update', status: 'Processing' },
      4: { text: 'Read', status: 'Default' },
      5: { text: 'Special', status: 'Warning' },
    },
  },
}
```

**渲染结果：**
- 值 `1` → `<Tag color="success">Create</Tag>`
- 值 `2` → `<Tag color="error">Delete</Tag>`
- 值 `5` → `<Tag color="warning">Special</Tag>`

---

## 🔄 待完成（Phase 1 - Part 2）

### 3. Array 类型增强（待实施）

**目标文件：** `lib/crud/field-types.js` - array 类型

**计划功能：**
1. 支持 `formatter` 函数（纯 JS）
2. 支持 `arrayRender` 配置
   - `maxDisplay`: 最多显示几个
   - `tagColor`: Tag 颜色（函数或固定值）

**配置示例：**
```javascript
{
  key: 'actions',
  type: 'array',
  table: {
    formatter: (value) => {
      if (!value || value.length === 0) return '-';
      return value.slice(0, 2).join(', ') + (value.length > 2 ? ' ...' : '');
    },
    // 或使用 arrayRender
    arrayRender: {
      maxDisplay: 2,
      tagColor: (item) => item.includes('*') ? 'blue' : 'default',
    },
  },
}
```

---

### 4. formatter 函数支持（待实施）

**目标文件：** `lib/crud/field-generator.js` - generateTableColumns 函数

**计划修改位置：** 第 56-61 行

**优先级：** `render` > `formatter` > `typeConfig.table`

**当前代码：**
```javascript
if (field.table?.render) {
  column.render = field.table.render;
} else if (typeConfig?.table) {
  column.render = (value, record) => typeConfig.table(value, field);
}
```

**改进为：**
```javascript
if (field.table?.render) {
  // 自定义 JSX render 函数
  column.render = field.table.render;
} else if (field.table?.formatter) {
  // 支持纯 JS formatter 函数
  column.render = (value, record, index) => {
    const result = field.table.formatter(value, record, index);
    return result;  // 可以是字符串或 React 元素
  };
} else if (typeConfig?.table) {
  // 使用类型对应的渲染函数
  column.render = (value, record) => typeConfig.table(value, field);
}
```

---

### 5. 自动识别树形数据（待实施）

**目标文件：** `components/admin/smart-crud-page.jsx`

**计划功能：**
1. 在 `request` 函数中检测返回数据是否包含 `children` 字段
2. 如果检测到树形数据，自动设置 `expandable` 配置
3. 支持手动覆盖

**实施位置：** 约第 300-400 行的 request 函数

**伪代码：**
```javascript
const request = async (params, sort, filter) => {
  // ... 现有请求逻辑 ...
  
  if (result.success) {
    // 检测是否为树形数据
    const hasChildren = result.data && result.data.some(item => 
      item.children && Array.isArray(item.children) && item.children.length > 0
    );
    
    if (hasChildren) {
      setIsTreeData(true);  // 设置状态
    }
    
    return { data: result.data, success: true, total: result.total };
  }
};

// ProTable 配置
<ProTable
  expandable={
    isTreeData && !tableProps.expandable
      ? { defaultExpandAllRows: false, indentSize: 24 }
      : tableProps.expandable
  }
/>
```

---

## 📊 进度统计

| 任务 | 状态 | 文件 | 行数 |
|------|------|------|------|
| Switch 增强 | 完成 | field-types.js | ~40 行 |
| Select + valueEnum | 完成 | field-types.js | ~75 行 |
| Array 增强 | 🔄 待完成 | field-types.js | ~50 行 |
| formatter 支持 | 🔄 待完成 | field-generator.js | ~10 行 |
| 树形数据识别 | 🔄 待完成 | smart-crud-page.jsx | ~30 行 |

**总进度：** 2/5 (40%)

---

## 🧪 测试计划

### 已完成测试

#### Test 1: Switch 类型
```javascript
// Config
{
  key: 'enable',
  type: 'switch',
  table: {
    activeText: 'Enabled',
    inactiveText: 'Disabled',
    activeColor: 'success',
    inactiveColor: 'error',
    activeIcon: 'CheckCircleOutlined',
    inactiveIcon: 'CloseCircleOutlined',
  },
}

// 预期：显示带图标的 Tag
// 需要在浏览器中验证
```

#### Test 2: Select + valueEnum
```javascript
// Config
{
  key: 'crud_category',
  type: 'select',
  table: {
    valueEnum: {
      0: { text: 'Unclassified', status: 'Default' },
      1: { text: 'Create', status: 'Success' },
      2: { text: 'Delete', status: 'Error' },
    },
  },
}

// 预期：根据 status 自动显示不同颜色的 Tag
// 需要在浏览器中验证
```

### 待完成测试

- [ ] Array + formatter 测试
- [ ] Array + arrayRender 测试  
- [ ] formatter 优先级测试
- [ ] 树形数据自动识别测试
- [ ] Permissions 页面完整功能测试

---

## 🎯 下一步行动

### 立即行动（继续实施）

1. **实施 Array 类型增强**
   - 支持 `formatter` 函数
   - 支持 `arrayRender` 配置

2. **实施 formatter 函数支持**
   - 修改 `field-generator.js`
   - 添加优先级处理

3. **实施树形数据自动识别**
   - 修改 `smart-crud-page.jsx`
   - 添加自动检测逻辑

### 测试验证

4. 🧪 **浏览器测试**
   - 访问 `/admin/rbac/permissions`
   - 验证所有新功能
   - 检查控制台错误

### 文档更新

5. 📝 **更新文档**
   - 更新 `crud-config.permission.js` 使用新特性
   - 创建使用示例
   - 更新 README

---

## 📝 使用说明

### Permission Config 更新建议

**当前 `crud-config.permission.js` 使用新特性：**

```javascript
export const permissionCrudConfig = {
  fieldsConfig: [
    // 使用新的 Switch 配置
    {
      key: 'enable',
      type: 'switch',
      table: {
        activeText: 'Enabled',    // 新增
        inactiveText: 'Disabled', // 新增
        activeColor: 'success',   // 新增
        inactiveColor: 'error',   // 新增
        activeIcon: 'CheckCircleOutlined',   // 新增
        inactiveIcon: 'CloseCircleOutlined', // 新增
      },
    },
    
    // 使用新的 Select + valueEnum 配置
    {
      key: 'crud_category',
      type: 'select',
      table: {
        valueEnum: {              // 新增
          0: { text: 'Unclassified', status: 'Default' },
          1: { text: 'Create', status: 'Success' },
          2: { text: 'Delete', status: 'Error' },
          3: { text: 'Update', status: 'Processing' },
          4: { text: 'Read', status: 'Default' },
          5: { text: 'Special', status: 'Warning' },
        },
      },
    },
    
    // 等待实施：Array + formatter
    {
      key: 'actions',
      type: 'array',
      table: {
        formatter: (value) => {   // 待实施
          if (!value || value.length === 0) return '-';
          return value.slice(0, 2).join(', ') + (value.length > 2 ? ' ...' : '');
        },
      },
    },
  ],
};
```

---

## 🔗 参考资料

- [vk-unicloud 万能表格文档](https://vkdoc.fsq.pub/admin/2/table.html)
- [vk-unicloud 内置组件](https://vkdoc.fsq.pub/admin/2/table.html#%E5%86%85%E7%BD%AE%E7%BB%84%E4%BB%B6)
- [Ant Design Pro - valueEnum](https://procomponents.ant.design/components/schema#valueenum)
- [实施计划文档](./smart-crud-page-implementation-plan.md)
- [设计分析文档](./vk-data-table-design-analysis.md)

---

**当前状态：** 🟢 进行中  
**下次继续：** Array 类型增强 → formatter 支持 → 树形数据识别 → 测试验证  
**预计完成时间：** 1-2 小时

---

**文档版本：** 1.0  
**最后更新：** 2024-11-13 (Part 1 完成)

