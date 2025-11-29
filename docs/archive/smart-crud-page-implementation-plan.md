# SmartCrudPage 实现计划

**日期：** 2024-11-13  
**目标：** 实现 vk-data-table 风格的智能渲染

---

## 🎯 核心目标

1. **Type 驱动自动渲染** - 通过 `type` 字段决定组件渲染方式
2. **自动识别树形数据** - 当 `getList` 返回树形数据时，自动渲染为树形表格

---

## 📝 需要修改的文件

### 1. lib/crud/field-types.js

**修改位置：** `switch` 类型的 `table` 渲染函数（第 834-838 行）

**当前代码：**
```javascript
switch: {
  table: (value, config) => {
    const trueText = config.table?.trueText || 'Yes';
    const falseText = config.table?.falseText || 'No';
    const color = value ? 'green' : 'default';
    return <Tag color={color}>{value ? trueText : falseText}</Tag>;
  },
}
```

**改进为：**
```javascript
switch: {
  table: (value, config) => {
    // 支持activeText/inactiveText
    const activeText = config.table?.activeText || config.table?.trueText || 'Yes';
    const inactiveText = config.table?.inactiveText || config.table?.falseText || 'No';
    
    // 支持自定义颜色
    const activeColor = config.table?.activeColor || 'success';
    const inactiveColor = config.table?.inactiveColor || 'default';
    
    // 支持图标
    const activeIcon = config.table?.activeIcon;
    const inactiveIcon = config.table?.inactiveIcon;
    
    const text = value ? activeText : inactiveText;
    const color = value ? activeColor : inactiveColor;
    
    // 动态导入图标
    let icon = null;
    if (value && activeIcon) {
      icon = React.createElement(require('@ant-design/icons')[activeIcon]);
    } else if (!value && inactiveIcon) {
      icon = React.createElement(require('@ant-design/icons')[inactiveIcon]);
    }
    
    return <Tag color={color} icon={icon}>{text}</Tag>;
  },
}
```

---

### 2. lib/crud/field-types.js - Select 类型

**添加位置：** `select` 类型的 `table` 渲染函数

**当前代码：** 简单的文本渲染

**改进为：**
```javascript
select: {
  table: (value, config) => {
    // 支持 valueEnum 自动渲染 Tag（Ant Design Pro 风格）
    const valueEnum = config.table?.valueEnum;
    
    if (valueEnum && valueEnum[value]) {
      const enumConfig = valueEnum[value];
      const text = enumConfig.text || value;
      const status = enumConfig.status || 'Default';
      
      // 状态映射到颜色
      const statusColorMap = {
        Success: 'success',
        Error: 'error',
        Default: 'default',
        Processing: 'processing',
        Warning: 'warning',
      };
      
      const color = statusColorMap[status] || 'default';
      return <Tag color={color}>{text}</Tag>;
    }
    
    // 回退：从 options 查找
    const options = config.data || config.options || config.table?.data || config.table?.options || [];
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value || '-';
  },
}
```

---

### 3. lib/crud/field-types.js - Array 类型

**修改位置：** `array` 类型的 `table` 渲染函数

**当前代码：** 简单的连接字符串

**改进为：**
```javascript
array: {
  table: (value, config) => {
    if (!value || !Array.isArray(value) || value.length === 0) return '-';
    
    // 支持 formatter 函数
    if (config.table?.formatter) {
      const result = config.table.formatter(value, config);
      // 如果返回字符串，直接显示
      if (typeof result === 'string') {
        return result;
      }
      // 如果返回 React 元素，直接返回
      return result;
    }
    
    // 支持 arrayRender 配置
    const arrayRender = config.table?.arrayRender;
    if (arrayRender) {
      const maxDisplay = arrayRender.maxDisplay || value.length;
      const tagColor = arrayRender.tagColor;
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {value.slice(0, maxDisplay).map((item, index) => {
            const color = typeof tagColor === 'function' ? tagColor(item) : tagColor || 'default';
            return (
              <Tag key={index} color={color} style={{ marginBottom: 0, fontSize: 12 }}>
                {item}
              </Tag>
            );
          })}
          {value.length > maxDisplay && (
            <Tag color='processing' style={{ marginBottom: 0 }}>
              +{value.length - maxDisplay} more
            </Tag>
          )}
        </div>
      );
    }
    
    // 默认：连接字符串
    return value.join(', ');
  },
}
```

---

### 4. lib/crud/field-generator.js - 支持 formatter

**修改位置：** `generateTableColumns` 函数（第 56-61 行）

**当前代码：**
```javascript
// 自定义渲染函数
if (field.table?.render) {
  column.render = field.table.render;
} else if (typeConfig?.table) {
  // 使用类型对应的渲染函数
  column.render = (value, record) => typeConfig.table(value, field);
}
```

**改进为：**
```javascript
// 优先级：render > formatter > typeConfig.table
if (field.table?.render) {
  // 自定义 JSX render 函数
  column.render = field.table.render;
} else if (field.table?.formatter) {
  // 支持纯 JS formatter 函数
  column.render = (value, record, index) => {
    const result = field.table.formatter(value, record, index);
    // 如果返回字符串，直接显示
    if (typeof result === 'string') {
      return result;
    }
    // 如果返回 React 元素或其他，直接返回
    return result;
  };
} else if (typeConfig?.table) {
  // 使用类型对应的渲染函数
  column.render = (value, record) => typeConfig.table(value, field);
}
```

---

### 5. components/admin/smart-crud-page.jsx - 自动识别树形数据

**修改位置：** `request` 函数和 ProTable 配置

**当前位置：** 约第 300-400 行

**添加功能：**
```javascript
// 在 request 函数中检测树形数据
const request = async (params, sort, filter) => {
  // ... 现有代码 ...
  
  const result = await actions.getList(requestParams);
  
  if (result.success) {
    // 检测是否为树形数据
    const hasChildren = result.data && result.data.some(item => 
      item.children && Array.isArray(item.children)
    );
    
    // 如果检测到树形数据，自动设置 expandable
    if (hasChildren && !tableProps.expandable) {
      // 通过 state 或其他方式通知组件启用树形显示
      setIsTreeData(true);
    }
    
    return {
      data: result.data || [],
      success: true,
      total: result.total || result.data?.length || 0,
    };
  }
  // ... 错误处理 ...
};

// ProTable 配置
<ProTable
  // ... 现有配置 ...
  expandable={
    isTreeData 
      ? {
          defaultExpandAllRows: false,
          indentSize: 24,
          ...tableProps.expandable,
        }
      : tableProps.expandable
  }
/>
```

---

### 6. Tree-Select 自动加载数据（暂缓）

**复杂度：** 高  
**原因：** 需要在表单组件挂载时从 `actions` prop 中查找并调用对应的 action

**实现思路：**
1. 在 `DynamicFormFields` 组件中接收 `actions` prop
2. 检测字段配置中的 `form.action` 字段
3. 从 `actions` 中查找对应的函数
4. 调用函数获取数据
5. 根据 `form.props` 映射数据结构
6. 填充到 TreeSelect 组件

**建议：** 先实现 1-5 项，Tree-Select 自动加载作为 Phase 2

---

## 📊 实施优先级

### Phase 1（本次实施）- 高优先级

1. **Switch 类型增强**
   - 支持 `activeText`/`inactiveText`
   - 支持 `activeColor`/`inactiveColor`
   - 支持 `activeIcon`/`inactiveIcon`

2. **Select + valueEnum**
   - 自动渲染为 Tag
   - 支持 status 映射

3. **Array + arrayRender**
   - 支持 `maxDisplay`
   - 支持 `tagColor` 函数或固定值

4. **支持 formatter 函数**
   - 优先级：`render` > `formatter` > `typeConfig.table`

5. **自动识别树形数据**
   - 检测 `children` 字段
   - 自动启用 `expandable`

### Phase 2（未来）- 中优先级

6. 🔄 **Tree-Select 自动加载**
   - 通过 `action` 名称自动调用
   - 根据 `props` 映射数据

---

## 🧪 测试计划

### 测试用例 1：Switch 类型

**Config：**
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

**预期：** 渲染为带图标的 Tag

---

### 测试用例 2：Select + valueEnum

**Config：**
```javascript
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
```

**预期：** 自动渲染为不同颜色的 Tag

---

### 测试用例 3：Array + formatter

**Config：**
```javascript
{
  key: 'actions',
  type: 'array',
  table: {
    formatter: (value) => {
      if (!value || value.length === 0) return '-';
      return value.slice(0, 2).join(', ') + (value.length > 2 ? ' ...' : '');
    },
  },
}
```

**预期：** 显示前 2 个，其余显示 "..."

---

### 测试用例 4：树形数据自动识别

**Data：**
```javascript
[
  {
    id: '1',
    name: 'Parent',
    children: [
      { id: '1-1', name: 'Child' }
    ]
  }
]
```

**预期：** 自动渲染为树形表格，支持展开/收起

---

## 完成标准

- [ ] Switch 类型支持新配置
- [ ] Select + valueEnum 自动渲染 Tag
- [ ] Array + arrayRender/formatter 正确渲染
- [ ] formatter 函数优先级正确
- [ ] 树形数据自动识别并渲染
- [ ] 所有测试用例通过
- [ ] Permissions 页面正常工作

---

**预计工作量：** 2-3 小时  
**风险：** 低（主要是增强现有功能）

---

**准备好开始实施了吗？** 🚀

