# 管理后台 - 用户管理功能文档

## 概述

用户管理模块是管理后台的核心功能之一，提供完整的用户 CRUD 操作、批量管理、详情查看等功能。

## 功能特性

### ✅ 已实现功能

1. **用户列表展示**
   - 分页查询（20条/页，可调整）
   - 搜索过滤（姓名、邮箱）
   - 角色筛选（Admin/User）
   - 排序功能（创建时间）
   - 实时刷新
   - 搜索栏默认收起，可展开
   - 列宽优化，响应式布局

2. **用户信息管理**
   - 查看用户详细信息
   - 编辑用户资料（姓名、邮箱、用户名、角色）
   - 更新用户角色
   - 设置邮箱验证状态
   - Credits 字段显示但禁用编辑（通过积分管理调整）

3. **批量操作**
   - 批量选择用户
   - 批量验证邮箱
   - 批量更新状态
   - 批量操作提示栏

4. **用户删除**
   - 软删除机制
   - 防止删除自己
   - Modal 确认对话框
   - 危险操作红色标识

5. **用户详情**
   - 完整的用户信息展示
   - 积分统计（当前、累计获得、累计使用）
   - 套餐信息（当前套餐、过期时间）
   - 活动记录（创建时间、最后登录、更新时间）
   - 使用 ProDescriptions 自动渲染

6. **操作菜单**
   - 下拉菜单式操作（节省空间）
   - View Details - 查看详情
   - Edit - 编辑用户
   - Delete - 删除用户（带确认）

7. **列显示优化**
   - 部分字段仅在详情中显示（`hideInTable: true`）
   - 表格只显示核心信息
   - 详情中显示完整信息

---

## 数据库结构

### Users 表字段（来自 Better Auth）

```javascript
{
  // 基础身份信息
  id: String,                    // 用户唯一ID
  email: String,                 // 邮箱
  emailVerified: Boolean,        // 邮箱是否已验证
  name: String,                  // 显示名称
  username: String,              // 用户名（登录用）
  image: String,                 // 头像URL
  role: String,                  // 角色: 'user' | 'admin'
  
  // 积分相关
  credits: Number,               // 当前积分
  totalCreditsEarned: Number,    // 累计获得积分
  totalCreditsUsed: Number,      // 累计使用积分
  
  // 套餐相关
  currentPackageId: String,      // 当前套餐ID
  packageExpireAt: Date,         // 套餐过期时间
  
  // 时间戳
  createdAt: Date,               // 创建时间
  updatedAt: Date,               // 更新时间
  lastLoginAt: Date,             // 最后登录时间
  deletedAt: Date,               // 删除时间（软删除）
}
```

---

## Server Actions

### 文件位置
```
app/(admin)/actions/admin-users.js
```

### 可用 Actions

#### 1. getUserListAction
获取用户列表（分页）

```javascript
import { getUserListAction } from '@/app/(admin)/actions';

const result = await getUserListAction({
  pageIndex: 1,        // 当前页码
  pageSize: 20,        // 每页数量
  role: 'user',        // 角色筛选（可选）
  search: 'john',      // 搜索关键词（可选）
});

// 返回格式
{
  success: true,
  data: [...],         // 用户列表
  total: 100,          // 总数
  pageIndex: 1,
  pageSize: 20,
  totalPages: 5,
}
```

#### 2. getUserDetailAction
获取用户详细信息

```javascript
const result = await getUserDetailAction(userId);

// 返回格式
{
  success: true,
  data: {
    id: '...',
    email: '...',
    name: '...',
    // ... 所有用户字段（除了密码）
  }
}
```

#### 3. updateUserInfoAction
更新用户信息

```javascript
const result = await updateUserInfoAction(userId, {
  name: 'New Name',
  email: 'newemail@example.com',
  username: 'newusername',
  role: 'admin',
  credits: 1000,
  emailVerified: true,
});
```

#### 4. updateUserRoleAction
更新用户角色

```javascript
const result = await updateUserRoleAction(userId, 'admin');
```

#### 5. deleteUserAction
删除用户（软删除）

```javascript
const result = await deleteUserAction(userId);
```

**注意**: 
- 无法删除自己
- 软删除：标记 `deletedAt`，修改邮箱避免冲突

#### 6. getUserStatisticsAdminAction
获取用户统计信息

```javascript
const result = await getUserStatisticsAdminAction(userId);

// 返回格式
{
  success: true,
  data: {
    userId: '...',
    credits: {
      current: 100,
      totalEarned: 500,
      totalUsed: 400,
    },
    packages: {
      total: 5,
      active: 2,
    },
    usage: {
      total: 100,
      successful: 95,
      failureRate: 5,
    },
    activity: {
      lastCreditActivity: Date,
      lastUsageActivity: Date,
      memberSince: Date,
      lastLogin: Date,
    }
  }
}
```

#### 7. batchUpdateUsersAction
批量更新用户

```javascript
const result = await batchUpdateUsersAction(
  ['userId1', 'userId2', 'userId3'],  // 用户ID数组
  { emailVerified: true }              // 更新内容
);
```

---

## 页面组件结构

### 文件位置
```
app/(admin)/admin/users/page.js
```

### 组件层次

```
UsersManagementPage
├── ProTable                    # 主表格
│   ├── Columns                 # 列定义
│   ├── Request                 # 数据请求
│   ├── Pagination              # 分页
│   ├── Search                  # 搜索栏
│   ├── RowSelection            # 行选择
│   ├── TableAlert              # 批量操作提示
│   └── ToolBar                 # 工具栏
├── ModalForm                   # 编辑模态框
│   ├── ProFormText             # 文本字段
│   ├── ProFormSelect           # 下拉选择
│   └── ProFormDigit            # 数字字段
└── DrawerForm                  # 详情抽屉
    └── Descriptions            # 描述列表
```

---

## 核心功能实现

### 1. 列表展示

#### 表格列配置

```jsx
const columns = [
  {
    title: 'Avatar',
    dataIndex: 'image',
    search: false,
    width: 80,  // 固定宽度（像素）
    render: (image, record) => (
      <Avatar src={image} icon={<UserOutlined />} size={40}>
        {record.name?.[0]?.toUpperCase()}
      </Avatar>
    ),
  },
  {
    title: 'Name',
    dataIndex: 'name',
    copyable: true,           // 可复制
    ellipsis: true,           // 超长省略
    width: 120,
    render: (name, record) => (
      <div>
        <div style={{ fontWeight: 500 }}>{name || 'N/A'}</div>
        <div style={{ fontSize: 12, color: '#999' }}>
          @{record.username || 'N/A'}
        </div>
      </div>
    ),
  },
  {
    title: 'Email',
    dataIndex: 'email',
    copyable: true,
    ellipsis: true,
    width: 150,
  },
  {
    title: 'Role',
    dataIndex: 'role',
    valueType: 'select',
    width: 100,
    valueEnum: {
      admin: { text: 'Admin', status: 'Success' },
      user: { text: 'User', status: 'Default' },
    },
    render: (_, record) => (
      <Tag color={record.role === 'admin' ? 'blue' : 'default'}>
        {record.role === 'admin' ? 'Admin' : 'User'}
      </Tag>
    ),
  },
  {
    title: 'Credits',
    dataIndex: 'credits',
    search: false,
    width: 100,
    sorter: true,
    render: (credits) => (
      <span style={{ 
        fontWeight: 500, 
        color: credits > 0 ? '#52c41a' : '#999' 
      }}>
        {credits || 0}
      </span>
    ),
  },
  // 仅在详情中显示的字段
  {
    title: 'Email Verified',
    dataIndex: 'emailVerified',
    hideInTable: true,  // 🎯 不在表格显示
    render: (verified) => (
      <Tag color={verified ? 'green' : 'default'}>
        {verified ? 'Verified' : 'Unverified'}
      </Tag>
    ),
  },
  // ... 更多列
];
```

#### 列宽度说明

列的 `width` 单位为**像素（px）**：

| 列名 | 宽度 | 说明 |
|------|------|------|
| Avatar | 80px | 头像固定小尺寸 |
| Name | 120px | 姓名+用户名 |
| Email | 150px | 邮箱地址 |
| Role | 100px | 角色标签 |
| Credits | 100px | 积分数字 |
| Created At | 180px | 日期时间 |
| Actions | 80px | 操作按钮 |

### 2. 数据请求

```jsx
const request = async (params, sort) => {
  const result = await getUserListAction({
    pageIndex: params.current,
    pageSize: params.pageSize,
    role: params.role,
    search: params.name || params.email,
  });

  return {
    data: result.data || [],
    success: true,
    total: result.total || 0,
  };
};
```

### 3. 编辑功能

```jsx
// 打开编辑框
const handleEdit = (record) => {
  setCurrentRow(record);
  setEditModalVisible(true);
};

// 保存更新
const handleSave = async (values) => {
  const result = await updateUserInfoAction(currentRow.id, values);
  
  if (result.success) {
    message.success('User updated successfully');
    actionRef.current?.reload();  // 刷新表格
    return true;
  }
  
  message.error(result.error);
  return false;
};
```

### 4. 操作菜单（Dropdown）

使用下拉菜单节省空间，集中所有操作：

```jsx
{
  title: 'Actions',
  valueType: 'option',
  width: 80,
  fixed: 'right',
  render: (_, record) => {
    const items = [
      {
        key: 'view',
        label: 'View Details',
        icon: <EyeOutlined />,
        onClick: () => handleViewDetail(record),
      },
      {
        key: 'edit',
        label: 'Edit',
        icon: <EditOutlined />,
        onClick: () => handleEdit(record),
      },
      {
        type: 'divider',  // 分隔线
      },
      {
        key: 'delete',
        label: 'Delete',
        icon: <DeleteOutlined />,
        danger: true,  // 红色危险样式
        onClick: () => {
          Modal.confirm({
            title: 'Delete User',
            content: 'Are you sure you want to delete this user? This action cannot be undone.',
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: () => handleDelete(record.id),
          });
        },
      },
    ];

    return (
      <Dropdown menu={{ items }} trigger={['click']}>
        <Button
          type='text'
          icon={<MoreOutlined />}
          onClick={(e) => e.stopPropagation()}
        />
      </Dropdown>
    );
  },
}
```

#### 优势
- ✅ 只占用 80px 宽度（vs 之前的 200px）
- ✅ 更现代的 UI 设计
- ✅ 使用 Modal.confirm 替代 Popconfirm，确认框更明显
- ✅ 危险操作用红色标识
- ✅ 有分隔线分组不同类型的操作

### 5. 批量操作

```jsx
// 行选择
rowSelection={{
  selectedRowKeys,
  onChange: (keys) => setSelectedRowKeys(keys),
}}

// 批量操作栏
tableAlertRender={({ selectedRowKeys }) => (
  <Space>
    <span>Selected {selectedRowKeys.length} users</span>
  </Space>
)}

tableAlertOptionRender={() => (
  <Space>
    <Button onClick={() => handleBatchUpdate({ emailVerified: true })}>
      Verify Email
    </Button>
    <Button onClick={() => setSelectedRowKeys([])}>
      Clear
    </Button>
  </Space>
)}
```

### 6. 详情查看（ProDescriptions）

使用 ProDescriptions 自动从 columns 配置生成详情页：

```jsx
// 打开详情抽屉 - 直接使用表格数据，无需额外请求
const handleViewDetail = (record) => {
  setCurrentRow(record);
  setDetailDrawerVisible(true);
};

// 详情展示 - 自动从 columns 读取配置
<DrawerForm
  title='User Details'
  open={detailDrawerVisible}
  onOpenChange={setDetailDrawerVisible}
  submitter={false}
  width={700}
>
  {currentRow && (
    <>
      {/* 用户头像和基本信息 */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Avatar src={currentRow.image} size={80} icon={<UserOutlined />}>
          {currentRow.name?.[0]?.toUpperCase()}
        </Avatar>
        <div style={{ marginTop: 12, fontSize: 18, fontWeight: 500 }}>
          {currentRow.name || 'N/A'}
        </div>
        <div style={{ color: '#999' }}>
          @{currentRow.username || 'N/A'}
        </div>
      </div>

      {/* 使用 ProDescriptions 自动渲染所有字段 */}
      <ProDescriptions
        column={1}
        bordered
        dataSource={currentRow}
        columns={columns.filter(
          (col) =>
            col.dataIndex &&
            col.dataIndex !== 'image' &&
            col.valueType !== 'option'
        )}
      />
    </>
  )}
</DrawerForm>
```

#### ProDescriptions 优势
- ✅ **自动渲染**：从 columns 配置自动生成，无需重复代码
- ✅ **统一样式**：渲染逻辑、格式化、标签颜色等都复用
- ✅ **包含隐藏列**：`hideInTable: true` 的字段会在这里显示
- ✅ **易于维护**：添加新字段只需在 columns 中配置一次

---

## 列显示配置（hideInTable）

### 概念

使用 `hideInTable: true` 配置，可以让某些列只在详情中显示，而不在表格中显示。这样可以：
- ✅ 保持表格简洁
- ✅ 减少列数，提升可读性
- ✅ 详情中仍能看到完整信息

### 实现方式

```jsx
const columns = [
  // 表格中显示的字段
  {
    title: 'Name',
    dataIndex: 'name',
    // 没有 hideInTable，会在表格和详情中都显示
  },
  
  // 仅在详情中显示的字段
  {
    title: 'Email Verified',
    dataIndex: 'emailVerified',
    hideInTable: true,  // 🎯 关键配置
    render: (verified) => (
      <Tag color={verified ? 'green' : 'default'}>
        {verified ? 'Verified' : 'Unverified'}
      </Tag>
    ),
  },
];
```

### 当前配置

| 字段 | 表格显示 | 详情显示 | 说明 |
|------|---------|---------|------|
| Avatar | ✅ | ✅ | 用户头像 |
| Name | ✅ | ✅ | 姓名和用户名 |
| Email | ✅ | ✅ | 邮箱地址 |
| Role | ✅ | ✅ | 用户角色 |
| Credits | ✅ | ✅ | 当前积分 |
| Created At | ✅ | ✅ | 创建时间 |
| **Email Verified** | ❌ | ✅ | 邮箱验证状态 |
| **Last Login** | ❌ | ✅ | 最后登录时间 |
| **Total Credits Earned** | ❌ | ✅ | 累计获得积分 |
| **Total Credits Used** | ❌ | ✅ | 累计使用积分 |
| **Current Package** | ❌ | ✅ | 当前套餐 |
| **Package Expires At** | ❌ | ✅ | 套餐过期时间 |
| **Updated At** | ❌ | ✅ | 更新时间 |

### 如何添加新的"仅详情"字段

只需在 columns 数组中添加：

```jsx
{
  title: '新字段标题',
  dataIndex: '字段名',
  hideInTable: true,  // 🎯 关键：只在详情显示
  search: false,
  render: (value) => {
    // 自定义渲染逻辑
    return value || 'N/A';
  },
}
```

ProDescriptions 会自动读取这个配置并在详情中显示，无需修改详情组件代码。

---

## 表单字段说明

### 编辑表单字段

| 字段 | 类型 | 验证规则 | 说明 |
|------|------|----------|------|
| name | ProFormText | Required | 用户显示名称 |
| email | ProFormText | Required, Email | 邮箱地址 |
| username | ProFormText | Optional, Pattern | 用户名（3-20字符） |
| role | ProFormSelect | Required | 用户角色 |
| credits | ProFormDigit | Disabled | 用户积分（只读，禁止编辑） |
| emailVerified | ProFormSelect | Required | 邮箱验证状态 |

**注意**：Credits 字段设置为 `disabled`，只显示不可编辑。积分调整应通过专门的积分管理功能进行。

### 字段验证

```jsx
// 邮箱验证
rules={[
  { required: true, message: 'Please enter email' },
  { type: 'email', message: 'Invalid email format' },
]}

// 用户名验证
rules={[
  {
    pattern: /^[a-zA-Z0-9_]{3,20}$/,
    message: 'Username must be 3-20 characters',
  },
]}

// 积分验证
<ProFormDigit
  min={0}
  max={999999}
  fieldProps={{ precision: 0 }}
/>
```

---

## 权限控制

### Server Actions 权限检查

所有 Admin Actions 都通过 `checkAdminAction()` 进行权限验证：

```javascript
import { checkAdminAction } from '@/lib/admin-auth';

export async function someAdminAction() {
  const adminCheck = await checkAdminAction();
  
  if (!adminCheck.isAdmin) {
    return {
      success: false,
      error: adminCheck.error,  // 'Unauthorized' or 'Forbidden'
    };
  }
  
  // 执行操作...
}
```

### 特殊权限规则

1. **删除用户**: 无法删除自己
2. **角色更新**: 只能设置 `user` 或 `admin`
3. **批量操作**: 需要先选择用户

---

## 搜索和筛选

### 搜索字段

- **Name**: 模糊搜索用户名
- **Email**: 模糊搜索邮箱

### 筛选字段

- **Role**: 精确筛选角色（Admin/User）

### 实现方式

```jsx
<ProTable
  search={{
    labelWidth: 'auto',
    defaultCollapsed: true,  // 默认收起搜索栏
  }}
/>
```

**注意**：不要使用 `collapsed: true`，这会导致无法展开。应使用 `defaultCollapsed: true`。

---

## 样式定制

### 表格样式

```jsx
<ProTable
  scroll={{ x: 1400 }}  // 横向滚动
  pagination={{
    pageSize: 20,
    showSizeChanger: true,
    showTotal: (total) => `Total ${total} users`,
  }}
/>
```

### 标签颜色

```jsx
// 角色标签
<Tag color={record.role === 'admin' ? 'blue' : 'default'}>
  {record.role}
</Tag>

// 验证状态
<Tag color={verified ? 'green' : 'default'}>
  {verified ? 'Verified' : 'Unverified'}
</Tag>
```

---

## 技术细节

### 1. 日期处理

#### 问题
MongoDB 返回的日期可能是 Date 对象，需要正确处理以避免显示 "Invalid Date"。

#### 解决方案
修改 `lib/mongodb.js` 中的 `fromObjectId` 函数，保留 Date 对象不转换：

```javascript
export function fromObjectId(id) {
  // ... 其他代码 ...
  
  // 处理Date对象 - 直接返回，不要转换
  if (id instanceof Date) {
    return id;
  }
  
  // 处理对象时也要排除Date
  if (typeof id === 'object' && !(id instanceof Date)) {
    const result = { ...id };
    
    for (const key in result) {
      if (result[key] instanceof Date) {
        // 保持Date对象不变
        result[key] = result[key];
      }
      // ... 其他处理
    }
  }
}
```

### 2. lastLoginAt 自动更新

Better Auth 默认不会更新 `lastLoginAt` 字段，需要手动实现。

#### 实现方案
在 `lib/admin-auth.js` 的 `checkAdmin` 函数中添加更新逻辑：

```javascript
export async function checkAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  // ... 权限检查 ...
  
  // 更新 lastLoginAt（后台运行，不阻塞）
  if (session.user.id) {
    import('@/lib/mongodb')
      .then(({ getCollection }) => getCollection('users'))
      .then((usersCollection) =>
        usersCollection.updateOne(
          { id: session.user.id },
          { $set: { lastLoginAt: new Date() } }
        )
      )
      .catch((err) => console.error('Failed to update lastLoginAt:', err));
  }
  
  return session;
}
```

**优点**：
- ✅ 不阻塞页面加载
- ✅ 使用 dynamic import 避免循环依赖
- ✅ 每次访问管理后台都会更新
- ✅ 错误不会影响正常流程

### 3. 软删除实现

软删除不会真正删除数据，只是标记 `deletedAt` 字段。

#### 实现代码
```javascript
// 软删除
await usersCollection.updateOne(
  { id: userId },
  {
    $set: {
      deletedAt: new Date(),
      email: `deleted_${userId}@deleted.com`,  // 避免邮箱冲突
      updatedAt: new Date(),
    },
  }
);

// 查询时排除已删除用户
const query = {
  $or: [
    { deletedAt: { $exists: false } },
    { deletedAt: null }
  ],
};
```

### 4. 数据分页

使用 `findWithPagination` 方法处理分页：

```javascript
const result = await usersCollection.findWithPagination({
  query,
  pageIndex: 1,
  pageSize: 20,
  sort: { createdAt: -1 },
});

// 返回格式
{
  rows: [...],      // 数据数组
  total: 100,       // 总数
  pageIndex: 1,
  pageSize: 20,
  totalPages: 5,
}
```

**注意**：`findWithPagination` 返回的是 `rows` 字段，而 ProTable 期望的是 `data` 字段，需要转换：

```javascript
return {
  data: result.rows || result.data || [],
  success: true,
  total: result.total || 0,
};
```

---

## 最佳实践

### 1. 使用 actionRef 刷新表格

```jsx
const actionRef = useRef();

// 操作后刷新
actionRef.current?.reload();

// 重置到第一页
actionRef.current?.reloadAndRest();
```

### 2. 统一错误处理

```jsx
try {
  const result = await someAction();
  
  if (result.success) {
    message.success('Success');
  } else {
    message.error(result.error || 'Operation failed');
  }
} catch (error) {
  message.error('Network error');
}
```

### 3. 清理状态

```jsx
const handleSave = async (values) => {
  // ... 执行操作
  
  if (success) {
    setEditModalVisible(false);
    setCurrentRow(null);           // 清理状态
    actionRef.current?.reload();
  }
};
```

### 4. 防止重复提交

ProForm 自动处理提交状态，按钮会显示 loading。

---

## 扩展功能建议

### 1. 导出用户数据

```jsx
const handleExport = async () => {
  const result = await getUserListAction({
    pageIndex: 1,
    pageSize: 9999,  // 获取所有数据
  });
  
  // 转换为 CSV 并下载
  exportToCSV(result.data);
};
```

### 2. 用户统计卡片

```jsx
import { StatisticCard } from '@ant-design/pro-components';

<StatisticCard.Group>
  <StatisticCard
    statistic={{
      title: 'Total Users',
      value: totalUsers,
    }}
  />
  <StatisticCard
    statistic={{
      title: 'Active Users',
      value: activeUsers,
    }}
  />
</StatisticCard.Group>
```

### 3. 高级搜索

```jsx
// 添加更多搜索字段
{
  title: 'Credits',
  dataIndex: 'credits',
  hideInTable: true,        // 不在表格显示
  valueType: 'digitRange',  // 数字范围搜索
}
```

### 4. 用户活动日志

创建一个新的页面展示用户的所有操作记录。

---

## 常见问题

### Q: 如何添加新的用户字段？

A: 需要同步修改三个地方：
1. 表格列定义 (`columns`)
2. 编辑表单字段
3. Server Action 更新逻辑

### Q: 如何实现硬删除？

A: 修改 `deleteUserAction`：

```javascript
// 硬删除
const result = await usersCollection.deleteOne({ id: userId });
```

### Q: 如何防止用户绕过前端直接调用 Action？

A: 所有 Server Actions 都通过 `checkAdminAction()` 验证权限，前端只是 UI 层。

### Q: 如何实现更细粒度的权限控制？

A: 可以在 users 表添加 `permissions` 字段，在 `checkAdminAction()` 中检查具体权限。

---

## 相关文档

- [ADMIN_AUTH.md](./ADMIN_AUTH.md) - 管理员认证系统
- [ADMIN_PROCOMPONENTS.md](./ADMIN_PROCOMPONENTS.md) - Pro Components 使用指南
- [SERVER_ACTIONS.md](./SERVER_ACTIONS.md) - Server Actions 文档
- [PERMISSIONS.md](./PERMISSIONS.md) - 权限系统文档

---

## 更新日志

### 2025-11-01 (最新)
- ✅ 优化搜索栏：默认收起，可展开
- ✅ 修复日期显示问题（Invalid Date）
- ✅ 实现 lastLoginAt 自动更新
- ✅ 操作按钮改为下拉菜单（节省空间）
- ✅ 实现列显示配置（hideInTable）
- ✅ 使用 ProDescriptions 自动渲染详情
- ✅ Credits 字段改为禁用（只读）
- ✅ 添加更多"仅详情显示"字段
- ✅ 优化列宽配置
- ✅ 完善技术文档

### 2024-10-31
- ✅ 完成用户列表展示
- ✅ 实现用户编辑功能
- ✅ 实现用户删除功能（软删除）
- ✅ 实现用户详情查看
- ✅ 实现批量操作功能
- ✅ 集成权限控制
- ✅ 完善错误处理
- ✅ 创建完整文档

---

## 下一步

现在可以参考此文档，继续实现其他管理功能：

1. 📦 **套餐管理** - 管理付费套餐
2. 💰 **积分管理** - 管理用户积分
3. 📊 **使用统计** - 查看系统使用情况
4. ⚙️ **系统设置** - 系统配置管理

参考本文档的实现方式，结合 Pro Components 快速开发！

