# 管理后台 Pro Components 使用指南

## 概述

管理后台使用 [Ant Design Pro Components](https://procomponents.ant.design/) 构建，这是一套基于 Ant Design 的高级组件库，专为企业级中后台系统设计。

## 技术栈

- **@ant-design/pro-components** - 企业级组件库
- **@ant-design/pro-layout** - 布局组件
- **@ant-design/pro-table** - 高级表格
- **@ant-design/pro-form** - 高级表单
- **antd** - Ant Design 基础组件库
- **@ant-design/icons** - 图标库

---

## 设计系统

### 配色方案

```css
/* 主题色 */
--primary-color: #1890ff;

/* 背景色 */
--bg-page: #f5f5f5;
--bg-card: #ffffff;

/* 文字色 */
--text-primary: #262626;
--text-secondary: #595959;
--text-disabled: #bfbfbf;

/* 状态色 */
--success: #52c41a;
--warning: #faad14;
--error: #f5222d;
--info: #1890ff;

/* 选中状态 */
--selected-bg: #e6f4ff;
--hover-bg: #f5f5f5;
```

### 布局配置

```javascript
{
  // ProLayout Token 配置
  token: {
    header: {
      colorBgHeader: '#fff',           // 头部背景
      heightLayoutHeader: 56,          // 头部高度
    },
    sider: {
      colorMenuBackground: '#fff',     // 侧边栏背景
      colorTextMenu: '#595959',        // 菜单文字
      colorTextMenuSelected: '#1890ff', // 选中文字
      colorBgMenuItemSelected: '#e6f4ff', // 选中背景
      colorBgMenuItemHover: '#f5f5f5',  // Hover 背景
    },
    pageContainer: {
      paddingBlockPageContainerContent: 24,  // 垂直内边距
      paddingInlinePageContainerContent: 24, // 水平内边距
      colorBgPageContainer: '#f5f5f5',       // 页面背景
    },
  }
}
```

---

## 核心组件使用

### 1. ProLayout - 布局组件

**用途**: 管理后台的整体布局框架

**文档**: https://procomponents.ant.design/components/layout

**基础使用**:

```jsx
import { ProLayout } from '@ant-design/pro-components';

<ProLayout
  title='Jimeng Admin'
  logo='/logo.png'
  layout='mix'              // 布局模式：side, top, mix
  navTheme='light'          // 主题：light, dark
  fixSiderbar               // 固定侧边栏
  fixedHeader               // 固定头部
  route={route}             // 路由配置
  location={{ pathname }}   // 当前路径
>
  {children}
</ProLayout>
```

**路由配置**:

```jsx
const route = {
  path: '/admin',
  routes: [
    {
      path: '/admin',
      name: 'Dashboard',
      icon: <DashboardOutlined />,
    },
    {
      path: '/admin/users',
      name: 'User Management',
      icon: <UserOutlined />,
    },
    // 支持多级菜单
    {
      path: '/admin/system',
      name: 'System',
      icon: <SettingOutlined />,
      routes: [
        {
          path: '/admin/system/config',
          name: 'Configuration',
        },
      ],
    },
  ],
};
```

---

### 2. ProTable - 高级表格

**用途**: 数据列表展示和管理

**文档**: https://procomponents.ant.design/components/table

**完整示例**:

```jsx
'use client';

import { ProTable } from '@ant-design/pro-components';
import { Button, Space, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

export default function UsersPage() {
  // 定义列
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false, // 不在搜索栏显示
    },
    {
      title: 'Name',
      dataIndex: 'name',
      copyable: true, // 可复制
      ellipsis: true, // 超长省略
    },
    {
      title: 'Email',
      dataIndex: 'email',
      copyable: true,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      valueType: 'select',
      valueEnum: {
        admin: { text: 'Admin', status: 'Success' },
        user: { text: 'User', status: 'Default' },
      },
      render: (_, record) => (
        <Tag color={record.role === 'admin' ? 'blue' : 'default'}>
          {record.role}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        active: { text: 'Active', status: 'Success' },
        inactive: { text: 'Inactive', status: 'Default' },
      },
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      search: false,
    },
    {
      title: 'Actions',
      valueType: 'option',
      render: (_, record) => [
        <Button
          key="edit"
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          Edit
        </Button>,
        <Button
          key="delete"
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record.id)}
        >
          Delete
        </Button>,
      ],
    },
  ];

  // 请求数据
  const request = async (params, sort, filter) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: params.current,
          pageSize: params.pageSize,
          ...params,
        }),
      });
      
      const result = await response.json();
      
      return {
        data: result.data,
        success: result.success,
        total: result.total,
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

  return (
    <ProTable
      columns={columns}
      request={request}
      rowKey="id"
      pagination={{
        pageSize: 20,
        showSizeChanger: true,
      }}
      search={{
        labelWidth: 'auto',
      }}
      dateFormatter="string"
      headerTitle="User List"
      toolBarRender={() => [
        <Button
          key="create"
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleCreate()}
        >
          Add User
        </Button>,
      ]}
    />
  );
}
```

**ProTable 高级功能**:

```jsx
<ProTable
  // 列配置
  columns={columns}
  
  // 数据请求
  request={request}
  
  // 行选择
  rowSelection={{
    onChange: (keys, rows) => console.log(keys, rows),
  }}
  
  // 工具栏
  toolBarRender={() => [
    <Button>导出</Button>,
    <Button type="primary">新建</Button>,
  ]}
  
  // 搜索栏
  search={{
    labelWidth: 120,
    span: 8,
    collapsed: false, // 默认展开
    collapseRender: (collapsed) => collapsed ? '展开' : '收起',
  }}
  
  // 分页
  pagination={{
    pageSize: 10,
    showTotal: (total) => `Total ${total} items`,
  }}
  
  // 批量操作
  tableAlertRender={({ selectedRowKeys }) => (
    <Space>
      <span>已选择 {selectedRowKeys.length} 项</span>
      <Button>批量删除</Button>
    </Space>
  )}
/>
```

**valueType 类型**:

```javascript
{
  dataIndex: 'field',
  valueType: 'text' | 'textarea' | 'select' | 'radio' | 
             'checkbox' | 'date' | 'dateTime' | 'dateRange' | 
             'time' | 'digit' | 'money' | 'percent' | 
             'option' | 'password' | 'avatar' | 'code'
}
```

---

### 3. ProForm - 高级表单

**用途**: 创建和编辑数据的表单

**文档**: https://procomponents.ant.design/components/form

**完整示例**:

```jsx
'use client';

import { 
  ProForm, 
  ProFormText, 
  ProFormSelect,
  ProFormDigit,
  ProFormDatePicker,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { message } from 'antd';

export default function UserForm({ initialValues, onSuccess }) {
  const handleFinish = async (values) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      
      const result = await response.json();
      
      if (result.success) {
        message.success('User created successfully');
        onSuccess?.();
      } else {
        message.error(result.error);
      }
    } catch (error) {
      message.error('Failed to create user');
    }
  };

  return (
    <ProForm
      initialValues={initialValues}
      onFinish={handleFinish}
      layout="vertical"
      submitter={{
        searchConfig: {
          submitText: 'Submit',
          resetText: 'Reset',
        },
      }}
    >
      <ProFormText
        name="name"
        label="Name"
        placeholder="Enter user name"
        rules={[
          { required: true, message: 'Please enter name' },
        ]}
      />
      
      <ProFormText
        name="email"
        label="Email"
        placeholder="user@example.com"
        rules={[
          { required: true, message: 'Please enter email' },
          { type: 'email', message: 'Invalid email format' },
        ]}
      />
      
      <ProFormSelect
        name="role"
        label="Role"
        valueEnum={{
          user: 'User',
          admin: 'Admin',
        }}
        rules={[
          { required: true, message: 'Please select role' },
        ]}
      />
      
      <ProFormDigit
        name="credits"
        label="Initial Credits"
        min={0}
        max={10000}
        fieldProps={{ precision: 0 }}
      />
      
      <ProFormTextArea
        name="notes"
        label="Notes"
        placeholder="Additional notes"
        fieldProps={{
          rows: 4,
        }}
      />
    </ProForm>
  );
}
```

**常用表单组件**:

```jsx
// 文本输入
<ProFormText name="field" label="Label" />

// 密码输入
<ProFormText.Password name="password" label="Password" />

// 数字输入
<ProFormDigit name="amount" label="Amount" min={0} max={1000} />

// 下拉选择
<ProFormSelect
  name="select"
  label="Select"
  options={[
    { label: 'Option 1', value: '1' },
    { label: 'Option 2', value: '2' },
  ]}
/>

// 日期选择
<ProFormDatePicker name="date" label="Date" />
<ProFormDateRangePicker name="dateRange" label="Date Range" />

// 文本域
<ProFormTextArea name="textarea" label="Description" />

// 开关
<ProFormSwitch name="enabled" label="Enable" />

// 单选
<ProFormRadio.Group
  name="radio"
  label="Radio"
  options={[
    { label: 'A', value: 'a' },
    { label: 'B', value: 'b' },
  ]}
/>

// 多选
<ProFormCheckbox.Group
  name="checkbox"
  label="Checkbox"
  options={['A', 'B', 'C']}
/>
```

**表单布局**:

```jsx
// 步骤表单
import { StepsForm } from '@ant-design/pro-components';

<StepsForm
  onFinish={async (values) => {
    console.log(values);
  }}
>
  <StepsForm.StepForm name="step1" title="Step 1">
    <ProFormText name="name" label="Name" />
  </StepsForm.StepForm>
  
  <StepsForm.StepForm name="step2" title="Step 2">
    <ProFormText name="email" label="Email" />
  </StepsForm.StepForm>
</StepsForm>

// 模态框表单
import { ModalForm } from '@ant-design/pro-components';

<ModalForm
  title="Create User"
  trigger={<Button type="primary">New User</Button>}
  onFinish={async (values) => {
    // 提交逻辑
    return true;
  }}
>
  <ProFormText name="name" label="Name" />
</ModalForm>

// 抽屉表单
import { DrawerForm } from '@ant-design/pro-components';

<DrawerForm
  title="Edit User"
  trigger={<Button>Edit</Button>}
  onFinish={async (values) => {
    // 提交逻辑
    return true;
  }}
>
  <ProFormText name="name" label="Name" />
</DrawerForm>
```

---

### 4. ProCard - 卡片组件

**用途**: 页面内容分组和布局

**文档**: https://procomponents.ant.design/components/card

**基础使用**:

```jsx
import { ProCard } from '@ant-design/pro-components';

<ProCard
  title="Card Title"
  extra={<Button>Action</Button>}
  headerBordered
  bordered
>
  Card Content
</ProCard>
```

**卡片组合**:

```jsx
// 水平分割
<ProCard split="vertical">
  <ProCard title="Left">Left Content</ProCard>
  <ProCard title="Right">Right Content</ProCard>
</ProCard>

// 垂直分割
<ProCard split="horizontal">
  <ProCard title="Top">Top Content</ProCard>
  <ProCard title="Bottom">Bottom Content</ProCard>
</ProCard>

// 网格布局
<ProCard.Group>
  <ProCard title="Card 1" colSpan={12}>Content</ProCard>
  <ProCard title="Card 2" colSpan={12}>Content</ProCard>
</ProCard.Group>

// Tabs 卡片
<ProCard
  tabs={{
    items: [
      { label: 'Tab 1', key: 'tab1', children: 'Content 1' },
      { label: 'Tab 2', key: 'tab2', children: 'Content 2' },
    ],
  }}
/>
```

---

### 5. StatisticCard - 统计卡片

**用途**: 数据统计展示

**文档**: https://procomponents.ant.design/components/statistic-card

**完整示例**:

```jsx
import { StatisticCard } from '@ant-design/pro-components';

const { Statistic } = StatisticCard;

// 单个统计卡片
<StatisticCard
  statistic={{
    title: 'Total Users',
    value: 1128,
    prefix: '$',
    suffix: '万',
    description: (
      <Statistic
        title="Weekly Growth"
        value="12.8%"
        trend="up"
      />
    ),
  }}
/>

// 统计卡片组
<StatisticCard.Group direction="row">
  <StatisticCard
    statistic={{
      title: 'Total',
      value: 79.0,
      precision: 2,
      suffix: '%',
    }}
  />
  <StatisticCard
    statistic={{
      title: 'Active',
      value: 6560,
      description: <Statistic value="92%" trend="up" />,
    }}
  />
</StatisticCard.Group>
```

**趋势指示器**:

```jsx
<Statistic
  title="Growth Rate"
  value="12.8%"
  trend="up"    // up, down
  style={{ color: '#3f8600' }}
/>
```

---

## 实战案例

### 完整的 CRUD 页面

```jsx
'use client';

import { useState, useRef } from 'react';
import { ProTable, ModalForm, ProFormText, ProFormSelect } from '@ant-design/pro-components';
import { Button, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

export default function UsersManagementPage() {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState();
  const actionRef = useRef();

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      copyable: true,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      copyable: true,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      valueType: 'select',
      valueEnum: {
        admin: { text: 'Admin', status: 'Success' },
        user: { text: 'User', status: 'Default' },
      },
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      search: false,
    },
    {
      title: 'Actions',
      valueType: 'option',
      render: (_, record) => [
        <Button
          key="edit"
          type="link"
          icon={<EditOutlined />}
          onClick={() => {
            setCurrentRow(record);
            setEditModalVisible(true);
          }}
        >
          Edit
        </Button>,
        <Popconfirm
          key="delete"
          title="Are you sure to delete this user?"
          onConfirm={() => handleDelete(record.id)}
        >
          <Button type="link" danger icon={<DeleteOutlined />}>
            Delete
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  // 获取数据
  const request = async (params) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          page: params.current,
          pageSize: params.pageSize,
          name: params.name,
          role: params.role,
        }),
      });
      
      const result = await response.json();
      
      return {
        data: result.data,
        success: result.success,
        total: result.total,
      };
    } catch (error) {
      message.error('Failed to fetch data');
      return { data: [], success: false, total: 0 };
    }
  };

  // 删除用户
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        message.success('User deleted successfully');
        actionRef.current?.reload();
      } else {
        message.error(result.error);
      }
    } catch (error) {
      message.error('Failed to delete user');
    }
  };

  // 保存用户
  const handleSave = async (values) => {
    try {
      const url = currentRow ? `/api/admin/users/${currentRow.id}` : '/api/admin/users';
      const method = currentRow ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        body: JSON.stringify(values),
      });
      
      const result = await response.json();
      
      if (result.success) {
        message.success(`User ${currentRow ? 'updated' : 'created'} successfully`);
        setEditModalVisible(false);
        setCurrentRow(undefined);
        actionRef.current?.reload();
        return true;
      } else {
        message.error(result.error);
        return false;
      }
    } catch (error) {
      message.error('Failed to save user');
      return false;
    }
  };

  return (
    <>
      <ProTable
        columns={columns}
        actionRef={actionRef}
        request={request}
        rowKey="id"
        pagination={{
          pageSize: 20,
        }}
        search={{
          labelWidth: 'auto',
        }}
        headerTitle="User Management"
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setCurrentRow(undefined);
              setEditModalVisible(true);
            }}
          >
            Add User
          </Button>,
        ]}
      />

      {/* 编辑/新建表单 */}
      <ModalForm
        title={currentRow ? 'Edit User' : 'Create User'}
        open={editModalVisible}
        onOpenChange={setEditModalVisible}
        initialValues={currentRow}
        onFinish={handleSave}
      >
        <ProFormText
          name="name"
          label="Name"
          rules={[{ required: true }]}
        />
        <ProFormText
          name="email"
          label="Email"
          rules={[
            { required: true },
            { type: 'email' },
          ]}
        />
        <ProFormSelect
          name="role"
          label="Role"
          valueEnum={{
            user: 'User',
            admin: 'Admin',
          }}
          rules={[{ required: true }]}
        />
      </ModalForm>
    </>
  );
}
```

---

## Server Actions 集成

### 创建 API 端点

```javascript
// app/(admin)/actions/admin-users.js
'use server';

import { checkAdminAction } from '@/lib/admin-auth';
import { getUserList, createUser, updateUser, deleteUser } from '@/lib/user-profile';

export async function getUserListAction(params) {
  const adminCheck = await checkAdminAction();
  if (!adminCheck.isAdmin) {
    return { success: false, error: adminCheck.error };
  }

  try {
    const result = await getUserList(params);
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function createUserAction(data) {
  const adminCheck = await checkAdminAction();
  if (!adminCheck.isAdmin) {
    return { success: false, error: adminCheck.error };
  }

  try {
    const result = await createUser(data);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### 在组件中使用

```jsx
'use client';

import { getUserListAction, createUserAction } from '@/app/(admin)/actions/admin-users';

const request = async (params) => {
  const result = await getUserListAction({
    page: params.current,
    pageSize: params.pageSize,
    ...params,
  });
  
  return {
    data: result.data || [],
    success: result.success,
    total: result.total || 0,
  };
};

const handleCreate = async (values) => {
  const result = await createUserAction(values);
  
  if (result.success) {
    message.success('Created successfully');
    return true;
  } else {
    message.error(result.error);
    return false;
  }
};
```

---

## 最佳实践

### 1. 代码组织

```
app/(admin)/admin/
├── users/
│   ├── page.js              # 列表页
│   ├── components/
│   │   ├── UserForm.jsx     # 用户表单
│   │   └── UserDetail.jsx   # 用户详情
│   └── [id]/
│       └── page.js          # 详情页
```

### 2. 状态管理

```jsx
// 使用 actionRef 刷新表格
const actionRef = useRef();

// 操作后刷新
actionRef.current?.reload();

// 重置到第一页
actionRef.current?.reloadAndRest();
```

### 3. 错误处理

```jsx
try {
  const result = await action();
  if (result.success) {
    message.success('Success');
  } else {
    message.error(result.error || 'Operation failed');
  }
} catch (error) {
  message.error('Network error');
}
```

### 4. 加载状态

```jsx
const [loading, setLoading] = useState(false);

const handleSubmit = async (values) => {
  setLoading(true);
  try {
    await action(values);
  } finally {
    setLoading(false);
  }
};
```

---

## 常见问题

### Q: ProTable 如何实现服务端分页？

A: request 函数返回 `{ data, success, total }` 即可：

```jsx
const request = async (params) => {
  const result = await fetchData({
    page: params.current,    // 当前页
    pageSize: params.pageSize, // 每页条数
  });
  
  return {
    data: result.data,
    success: true,
    total: result.total,     // 总条数
  };
};
```

### Q: 如何自定义搜索栏？

A: 在 columns 中配置 `search` 属性：

```jsx
{
  title: 'Name',
  dataIndex: 'name',
  search: true,  // 显示搜索
}

{
  title: 'ID',
  dataIndex: 'id',
  search: false, // 不显示搜索
}
```

### Q: 如何实现批量操作？

A: 使用 `rowSelection` 和 `tableAlertRender`：

```jsx
<ProTable
  rowSelection={{
    onChange: (keys) => setSelectedKeys(keys),
  }}
  tableAlertRender={({ selectedRowKeys }) => (
    <Space>
      <span>已选择 {selectedRowKeys.length} 项</span>
      <Button onClick={() => handleBatchDelete(selectedRowKeys)}>
        批量删除
      </Button>
    </Space>
  )}
/>
```

---

## 相关资源

- [Pro Components 官方文档](https://procomponents.ant.design/)
- [Ant Design 官方文档](https://ant.design/)
- [Pro Components GitHub](https://github.com/ant-design/pro-components)
- [示例代码](https://procomponents.ant.design/components)

---

## 下一步

现在你可以开始实现具体的管理功能：

1. ✅ 用户管理 - 使用 ProTable + ModalForm
2. ✅ 套餐管理 - 使用 ProTable + DrawerForm
3. ✅ 积分管理 - 使用 ProTable + 统计卡片
4. ✅ 使用统计 - 使用 StatisticCard + 图表
5. ✅ 系统设置 - 使用 ProForm + ProCard

参考本文档中的示例代码，结合实际业务需求进行开发。

