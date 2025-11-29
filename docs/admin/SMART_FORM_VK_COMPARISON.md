# SmartForm 与 VK-UniCloud 对比指南

本文档展示如何用我们的组件实现页面。

## 方式一：使用 SmartCrudPage（推荐，最简洁）

SmartCrudPage 已经内置了表格 + 创建/编辑表单，只需一个配置即可：

```jsx
'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import * as actions from '@/app/(admin)/actions/xxx/crud-action.xxx';

const SmartCrudPage = dynamic(() => import('@/components/admin/smart-crud-page'), {
  ssr: false,
});

export default function MyPage() {
  // 统一的字段配置（同时用于表格和表单）
  const fieldsConfig = useMemo(() => [
    { 
      key: '_id', 
      title: 'ID', 
      type: 'text', 
      table: { width: 220 },  // 表格配置
      form: false,             // 不在表单中显示
    },
    { 
      key: 'money', 
      title: '金额', 
      type: 'money', 
      table: { width: 80, sorter: true },
      form: { required: true, placeholder: '请输入金额' },
    },
    { 
      key: 'remark', 
      title: '备注', 
      type: 'text', 
      table: { width: 80 },
      form: { placeholder: '请输入备注' },
      search: { enabled: true, mode: 'like' },  // 搜索配置
    },
    { 
      key: '_add_time', 
      title: '添加时间', 
      type: 'datetime', 
      table: { width: 160, sorter: true },
      form: false,  // 创建时间不需要在表单中
      search: { enabled: true, mode: 'range' },  // 时间范围搜索
    },
  ], []);

  return (
    <SmartCrudPage
      fieldsConfig={fieldsConfig}
      actions={{
        getList: actions.getListAction,
        create: actions.createAction,
        update: actions.updateAction,
        delete: actions.deleteAction,
      }}
      title="数据管理"
      rowKey="_id"
      enableCreate={true}
      enableEdit={true}
      enableDelete={true}
    />
  );
}
```

**优点：**
- 代码量最少
- 表格、搜索、表单全部自动生成
- 内置了创建/编辑弹窗

---

## 方式二：分离表格和表单

如果你需要分开控制表格和表单，可以这样做：

```jsx
'use client';

import { useState, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Button, Space, App } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { SmartModalForm } from '@/components/admin/smart-form';
import * as actions from '@/app/(admin)/actions/xxx/crud-action.xxx';

const SmartCrudPage = dynamic(() => import('@/components/admin/smart-crud-page'), {
  ssr: false,
});

export default function MyPage() {
  const { message } = App.useApp();
  
  // ============================================
  // 状态管理
  // ============================================
  const [formVisible, setFormVisible] = useState(false);
  const [formType, setFormType] = useState('add'); // 'add' | 'update'
  const [formData, setFormData] = useState({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ============================================
  // 表格字段配置
  // ============================================
  const tableFieldsConfig = useMemo(() => [
    { key: '_id', title: 'ID', type: 'text', table: { width: 220 } },
    { key: 'money', title: '金额', type: 'money', table: { width: 80, sorter: true } },
    { key: 'remark', title: '备注', type: 'text', table: { width: 80 } },
    { key: '_add_time', title: '添加时间', type: 'datetime', table: { width: 160, sorter: true } },
  ], []);

  // ============================================
  // 表单字段配置
  // ============================================
  const formFieldsConfig = useMemo(() => [
    { 
      key: 'money', 
      title: '金额', 
      type: 'money', 
      form: { required: true, placeholder: '请输入金额' } 
    },
    { 
      key: 'remark', 
      title: '备注', 
      type: 'text', 
      form: { placeholder: '请输入备注' } 
    },
  ], []);

  // ============================================
  // 搜索字段配置
  // ============================================
  const searchFieldsConfig = useMemo(() => [
    { 
      key: 'remark', 
      title: '备注', 
      type: 'text', 
      search: { enabled: true, mode: 'like' } 
    },
    { 
      key: '_add_time', 
      title: '添加时间', 
      type: 'datetimerange', 
      search: { enabled: true, mode: 'range' } 
    },
  ], []);

  // 合并配置（用于 SmartCrudPage）
  const fieldsConfig = useMemo(() => {
    // 合并表格和搜索配置
    const merged = [...tableFieldsConfig];
    
    // 添加搜索配置
    searchFieldsConfig.forEach(searchField => {
      const existing = merged.find(f => f.key === searchField.key);
      if (existing) {
        existing.search = searchField.search;
      } else {
        merged.push({ ...searchField, table: false });
      }
    });
    
    // 禁用内置表单（我们用独立的 SmartModalForm）
    return merged.map(f => ({ ...f, form: false }));
  }, [tableFieldsConfig, searchFieldsConfig]);

  // ============================================
  // 按钮事件
  // ============================================
  
  // 添加按钮
  const handleAdd = () => {
    setFormType('add');
    setFormData({});  // 清空表单数据
    setFormVisible(true);
  };

  // 编辑按钮（通过 customRowActions 触发）
  const handleEdit = (record) => {
    setFormType('update');
    setFormData(record);  // 设置表单数据
    setFormVisible(true);
  };

  // 表单提交
  const handleFormSubmit = async (values) => {
    try {
      let result;
      
      if (formType === 'add') {
        result = await actions.createAction(values);
      } else {
        result = await actions.updateAction(formData._id, values);
      }
      
      if (result.success) {
        message.success(formType === 'add' ? '添加成功' : '修改成功');
        setRefreshTrigger(prev => prev + 1);  // 刷新表格
        return true;  // 关闭弹窗
      } else {
        message.error(result.error || '操作失败');
        return false;
      }
    } catch (error) {
      message.error('操作失败');
      return false;
    }
  };

  // ============================================
  // 自定义行操作
  // ============================================
  const customRowActions = [
    {
      key: 'edit',
      text: '编辑',
      onClick: handleEdit,
    },
  ];

  return (
    <>
      {/* 表格（禁用内置的创建/编辑功能） */}
      <SmartCrudPage
        fieldsConfig={fieldsConfig}
        actions={{
          getList: actions.getListAction,
          delete: actions.deleteAction,
        }}
        title="数据管理"
        rowKey="_id"
        enableCreate={false}  // 禁用内置创建
        enableEdit={false}    // 禁用内置编辑
        enableDelete={true}
        customRowActions={customRowActions}
        customToolbarButtons={[
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            添加
          </Button>,
        ]}
        refreshTrigger={refreshTrigger}
      />

      {/* 独立的表单弹窗 */}
      <SmartModalForm
        title={formType === 'add' ? '添加' : '编辑'}
        open={formVisible}
        onOpenChange={setFormVisible}
        fieldsConfig={formFieldsConfig}
        initialValues={formData}
        onFinish={handleFormSubmit}
        isCreate={formType === 'add'}
        width={500}
      />
    </>
  );
}
```

**这种方式的优点：**
- 表格和表单配置完全分离
- 可以完全控制弹窗的显示/隐藏
- 可以自定义表单的标题、宽度等
- 更灵活，适合复杂场景

---

## 方式三：纯 SmartModalForm（不使用 SmartCrudPage）

如果你只需要表单功能，不需要表格：

```jsx
'use client';

import { useState } from 'react';
import { Button, App } from 'antd';
import { SmartModalForm } from '@/components/admin/smart-form';

export default function MyPage() {
  const { message } = App.useApp();
  const [visible, setVisible] = useState(false);

  const fieldsConfig = [
    { key: 'money', title: '金额', type: 'money', form: { required: true } },
    { key: 'remark', title: '备注', type: 'text' },
  ];

  return (
    <>
      <Button type="primary" onClick={() => setVisible(true)}>
        打开表单
      </Button>

      <SmartModalForm
        title="添加数据"
        open={visible}
        onOpenChange={setVisible}
        fieldsConfig={fieldsConfig}
        onFinish={async (values) => {
          console.log('表单数据:', values);
          message.success('提交成功');
          return true;
        }}
      />
    </>
  );
}
```

---

## VK 与我们的配置对照表

| VK 配置 | 我们的配置 | 说明 |
|---------|-----------|------|
| `table1.columns` | `fieldsConfig` + `table: {...}` | 表格列配置 |
| `form1.props.columns` | `fieldsConfig` + `form: {...}` | 表单字段配置 |
| `queryForm1.columns` | `fieldsConfig` + `search: {...}` | 搜索字段配置 |
| `form1.props.show` | `open` | 弹窗显示状态 |
| `form1.props.title` | `title` | 弹窗标题 |
| `form1.props.formType` | `isCreate` | 是否创建模式 |
| `form1.data` | `initialValues` | 表单数据 |
| `form1.props.action` | `onFinish` | 提交处理 |
| `form1.props.rules` | `form.rules` 或 `form.required` | 验证规则 |

---

## 字段类型对照

| VK 类型 | 我们的类型 | 说明 |
|---------|-----------|------|
| `text` | `text` | 单行文本 |
| `textarea` | `textarea` | 多行文本 |
| `number` | `number` | 数字 |
| `money` | `money` | 金额 |
| `percentage` | `percentage` | 百分比 |
| `radio` | `radio` | 单选 |
| `checkbox` | `checkbox` | 多选 |
| `select` | `select` | 下拉选择 |
| `switch` | `switch` | 开关 |
| `date` | `date` | 日期 |
| `time` | `time` | 时间 |
| `datetime` | `datetime` | 日期时间 |
| `datetimerange` | `datetimerange` | 日期时间范围 |
| `rate` | `rate` | 评分 |
| `slider` | `slider` | 滑块 |
| `color` | `color` | 颜色 |
| `image` | `image` | 图片上传 |
| `file` | `file` | 文件上传 |
| `avatar` | `avatar` | 头像上传 |
| `editor` | `markdown` | 富文本/Markdown |
| `json` | `json` | JSON 编辑器 |
| `array` | `array` | 动态数组 |
| `tree-select` | `tree-select` | 树形选择 |
| `cascader` | `cascader` | 级联选择 |
| `icon` | `icon` | 图标选择 |
| `group` | `group` | 分组容器（布局类型） |

---

## 搜索模式对照

| VK 模式 | 我们的模式 | 说明 |
|---------|-----------|------|
| `%%` | `like` | 模糊搜索 |
| `==` | `exact` | 精确匹配 |
| `[]` | `range` | 范围查询 |
| `>` | `gt` | 大于 |
| `>=` | `gte` | 大于等于 |
| `<` | `lt` | 小于 |
| `<=` | `lte` | 小于等于 |
| `in` | `in` | 包含查询 |

---

## 高级功能对照

### 分组布局 (group)

VK 使用 `group` 类型进行分组，我们也支持：

```javascript
// 我们的配置
{
  key: 'basic-group',
  title: '📋 基础信息',
  type: 'group',
  tips: '请填写基础信息',
  columns: [
    { key: 'title', title: 'Title', type: 'text', col: { span: 16 } },
    { key: 'status', title: 'Status', type: 'select', col: { span: 8 } },
  ],
}
```

**注意**：我们使用自定义分组实现（Divider + Row/Col）而非 ProFormGroup，以支持精确的栅格宽度控制。

### 条件显示 (showRule)

| VK 配置 | 我们的配置 | 说明 |
|---------|-----------|------|
| `showRule: "type=='advanced'"` | `showRule: "type === 'advanced'"` | 字符串表达式 |
| `showRule: (data) => data.type === 'advanced'` | `showRule: (formData) => formData.type === 'advanced'` | 函数形式 |

**支持的操作符**：`= == === != !== > >= < <= in && ||`

### 字段联动 (watch)

```javascript
// 我们的配置
{
  key: 'category',
  title: 'Category',
  type: 'select',
  data: categoryOptions,
  watch: {
    handler: (value, { setFieldValue }) => {
      setFieldValue('subCategory', undefined);
    },
  },
}
```

### 动态选项 (data 函数)

```javascript
// 我们的配置
{
  key: 'subCategory',
  title: 'Sub Category',
  type: 'select',
  data: (formData) => {
    return subCategoryMap[formData?.category] || [];
  },
}
```

### 条件禁用 (disabled 函数)

```javascript
// 我们的配置
{
  key: 'subCategory',
  title: 'Sub Category',
  type: 'select',
  disabled: (formData) => !formData?.category,
}
```

---

## 总结

1. **如果追求简洁**：使用 SmartCrudPage，一个 `fieldsConfig` 搞定一切
2. **如果需要灵活控制**：分离表格和表单，使用 SmartModalForm
3. **配置格式兼容**：我们的 `fieldsConfig` 设计参考了 VK，字段类型基本对应
4. **高级功能齐全**：支持分组布局、条件显示、字段联动、动态选项等

