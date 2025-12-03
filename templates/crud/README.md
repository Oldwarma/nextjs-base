# NextJS Base 开发最佳实践指南

> 基于 PostgreSQL + Prisma + SmartCrudPage + nb.pubfn 的全栈开发框架

---

## 🎯 项目价值

NextJS Base 是一个**配置驱动**的全栈开发框架，核心价值：

| 特性 | 传统开发 | NextJS Base |
|------|---------|-------------|
| 创建 CRUD 页面 | 4-8 小时 | **10-30 分钟** |
| 代码量 | 500-1000 行 | **100-200 行** |
| 权限系统 | 手动实现 | **自动集成** |
| 表单验证 | 重复编写 | **配置驱动** |
| 操作日志 | 手动记录 | **自动记录** |

### 核心组件

```
┌─────────────────────────────────────────────────────────────┐
│                     前端层 (Client)                          │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ SmartCrudPage   │  │ SmartModalForm  │                   │
│  │ (万能表格)       │  │ (万能表单)       │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
│           │                    │                             │
│           └──────────┬─────────┘                             │
│                      ▼                                       │
├─────────────────────────────────────────────────────────────┤
│                   Server Actions                             │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ wrapAction      │  │ createCrudActions│                   │
│  │ (权限+日志)      │  │ (CRUD 工厂)      │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
│           │                    │                             │
│           └──────────┬─────────┘                             │
│                      ▼                                       │
├─────────────────────────────────────────────────────────────┤
│                    数据访问层 (DAO)                           │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ BaseDAO         │  │ selects         │                   │
│  │ (Prisma 封装)   │  │ (连表查询)       │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
│           │                    │                             │
│           └──────────┬─────────┘                             │
│                      ▼                                       │
├─────────────────────────────────────────────────────────────┤
│                   数据库层 (PostgreSQL)                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Prisma ORM                           ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 目录结构

```
app/
├── (admin)/                    # 后台管理
│   ├── admin/                  # 页面目录
│   │   ├── rbac/              # RBAC 权限模块
│   │   │   ├── roles/page.js
│   │   │   ├── permissions/page.js
│   │   │   └── menus/page.js
│   │   ├── system/            # 系统管理模块
│   │   │   ├── users/page.js
│   │   │   └── action_logs/page.js
│   │   └── cms/               # CMS 内容模块
│   │       └── posts/page.js
│   └── actions/               # Server Actions
│       ├── rbac/              # RBAC 相关 Actions
│       │   ├── crud-action.role.js
│       │   ├── crud-action.permission.js
│       │   └── crud-action.menu.js
│       ├── system/            # 系统相关 Actions
│       └── cms/               # CMS 相关 Actions
├── (client)/                  # 前台页面
│   └── [locale]/              # 多语言支持
└── api/                       # API 路由

lib/
├── core/                      # 核心功能
│   ├── action-wrapper.js      # Action 包装器
│   ├── crud-helper.js         # CRUD 工厂
│   └── permission-naming.js   # 权限命名
├── database/                  # 数据库
│   ├── prisma.js              # Prisma 客户端
│   └── selects.js             # 连表查询
├── function/                  # nb.pubfn 工具库
│   └── index.js
└── auth/                      # 认证授权

components/
├── admin/                     # 后台组件
│   ├── smart-crud-page.jsx    # 万能表格
│   └── smart-form/            # 万能表单
└── client/                    # 前台组件

prisma/
└── schema.prisma              # 数据库模型
```

---

## 🚀 快速开始

### 创建新功能的完整流程

假设我们要创建一个「优惠券管理」功能：

#### 步骤 1: 设计数据库模型

```prisma
// prisma/schema.prisma

model Coupon {
  id          String    @id @default(uuid())
  name        String
  code        String    @unique
  discount    Decimal   @db.Decimal(5, 2)
  type        String    @default("percentage")  // percentage, fixed
  minAmount   Decimal?  @db.Decimal(10, 2)
  maxDiscount Decimal?  @db.Decimal(10, 2)
  startDate   DateTime?
  endDate     DateTime?
  usageLimit  Int       @default(0)
  usedCount   Int       @default(0)
  enable      Boolean   @default(true)
  remark      String?
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?
  
  @@index([code])
  @@index([enable])
  @@index([deletedAt])
  @@map("coupons")
}
```

执行迁移：

```bash
npx prisma migrate dev --name add_coupon_table
npx prisma generate
```

#### 步骤 2: 创建 Server Actions

```javascript
// app/(admin)/actions/cms/crud-action.coupon.js

'use server';

import { createCrudActions } from '@/lib/core/crud-helper';
import { wrapAction } from '@/lib/core/action-wrapper';
import { prisma } from '@/lib/database/prisma';
import nb from '@/lib/function';

/**
 * Coupon CRUD 配置
 */
const couponConfig = {
  // 基础配置
  modelName: 'coupon',        // Prisma 模型名（小写单数）
  tableName: 'coupons',       // 数据库表名（selects 连表时用）
  primaryKey: 'id',
  softDelete: true,           // 启用软删除

  // 字段配置
  fields: {
    creatable: ['name', 'code', 'discount', 'type', 'minAmount', 'maxDiscount', 
                'startDate', 'endDate', 'usageLimit', 'enable', 'remark'],
    updatable: ['name', 'discount', 'type', 'minAmount', 'maxDiscount', 
                'startDate', 'endDate', 'usageLimit', 'enable', 'remark'],
    searchable: ['name', 'code'],
  },

  // 查询配置
  query: {
    defaultSort: { createdAt: 'desc' },
    defaultPageSize: 20,
  },

  // 验证规则
  validation: {
    name: {
      required: true,
      type: 'string',
      minLength: 2,
      maxLength: 100,
      message: 'Name must be between 2 and 100 characters',
    },
    code: {
      required: true,
      type: 'string',
      pattern: /^[A-Z0-9_-]+$/,
      message: 'Code must contain only uppercase letters, numbers, hyphens and underscores',
    },
    discount: {
      required: true,
      type: 'number',
      min: 0,
      max: 100,
    },
    type: {
      required: true,
      type: 'string',
      enum: ['percentage', 'fixed'],
    },
    enable: {
      type: 'boolean',
      default: true,
    },
  },

  // 生命周期钩子
  hooks: {
    beforeCreate: async (data) => {
      // 检查优惠码是否重复
      const existing = await prisma.coupon.findFirst({
        where: { code: data.code, deletedAt: null },
      });
      if (existing) {
        const error = new Error('Coupon code already exists');
        error.name = 'BusinessError';
        throw error;
      }
      
      // 设置默认值
      if (data.enable === undefined) data.enable = true;
      if (data.usedCount === undefined) data.usedCount = 0;
      
      return data;
    },

    beforeUpdate: async (id, data, existing) => {
      // 禁止修改优惠码
      delete data.code;
      return data;
    },

    beforeDelete: async (id, existing) => {
      // 检查是否已被使用
      if (existing.usedCount > 0) {
        const error = new Error('Cannot delete coupon that has been used');
        error.name = 'BusinessError';
        throw error;
      }
      return true;
    },
  },

  // 数据转换
  transforms: {
    input: (data) => {
      // 优惠码转大写
      if (data.code) data.code = data.code.toUpperCase().trim();
      if (data.name) data.name = data.name.trim();
      return data;
    },
    output: (data) => {
      // 确保布尔值
      if (data.enable === undefined) data.enable = true;
      return data;
    },
  },
};

// 创建标准 CRUD Actions
const crudActions = createCrudActions(couponConfig);

// 导出标准 CRUD Actions
export const getCouponListAction = crudActions.getList;
export const getCouponDetailAction = crudActions.getDetail;
export const createCouponAction = crudActions.create;
export const updateCouponAction = crudActions.update;
export const deleteCouponAction = crudActions.delete;
export const batchDeleteCouponsAction = crudActions.batchDelete;

/**
 * 自定义 Action: 获取可用优惠券（用于前台选择）
 */
export const getAvailableCouponsAction = wrapAction('pubGetAvailableCoupons', async (params, ctx) => {
  const now = new Date();
  
  const coupons = await prisma.coupon.findMany({
    where: {
      enable: true,
      deletedAt: null,
      OR: [
        { startDate: null },
        { startDate: { lte: now } },
      ],
      AND: [
        {
          OR: [
            { endDate: null },
            { endDate: { gte: now } },
          ],
        },
        {
          OR: [
            { usageLimit: 0 },
            { usedCount: { lt: prisma.coupon.fields.usageLimit } },
          ],
        },
      ],
    },
    orderBy: { discount: 'desc' },
  });

  return {
    success: true,
    data: coupons,
  };
});

/**
 * 自定义 Action: 使用优惠券
 */
export const useCouponAction = wrapAction('authUseCoupon', async ({ code, orderId }, ctx) => {
  const coupon = await prisma.coupon.findFirst({
    where: { code, enable: true, deletedAt: null },
  });

  if (!coupon) {
    return { success: false, error: 'Coupon not found or expired' };
  }

  // 检查使用次数
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    return { success: false, error: 'Coupon usage limit reached' };
  }

  // 更新使用次数
  await prisma.coupon.update({
    where: { id: coupon.id },
    data: { usedCount: { increment: 1 } },
  });

  return {
    success: true,
    data: { discount: coupon.discount, type: coupon.type },
  };
});
```

#### 步骤 3: 创建管理页面

```javascript
// app/(admin)/admin/cms/coupons/page.js

'use client';

import SmartCrudPage from '@/components/admin/smart-crud-page';
import { Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

// Server Actions
import * as couponActions from '@/app/(admin)/actions/cms/crud-action.coupon';

export default function CouponManagementPage() {
  // 字段配置
  const fieldsConfig = [
    // ID（隐藏）
    {
      key: 'id',
      title: 'ID',
      type: 'text',
      table: false,
      form: false,
      search: false,
    },

    // 优惠券名称
    {
      key: 'name',
      title: 'Name',
      type: 'text',
      table: {
        width: 200,
        ellipsis: true,
      },
      form: {
        required: true,
        placeholder: 'Enter coupon name',
        fieldProps: {
          showCount: true,
          maxLength: 100,
        },
      },
      search: {
        mode: 'like',
        placeholder: 'Search by name',
      },
    },

    // 优惠码
    {
      key: 'code',
      title: 'Code',
      type: 'text',
      table: {
        width: 150,
        copyable: true,
      },
      form: {
        required: true,
        placeholder: 'e.g., SUMMER2024',
        fieldProps: {
          maxLength: 20,
        },
        // 编辑时禁用
        disabled: (isCreate) => !isCreate,
      },
      search: {
        mode: 'like',
      },
    },

    // 折扣类型
    {
      key: 'type',
      title: 'Type',
      type: 'select',
      options: [
        { label: 'Percentage', value: 'percentage', color: 'blue' },
        { label: 'Fixed Amount', value: 'fixed', color: 'green' },
      ],
      table: {
        width: 120,
      },
      form: {
        required: true,
        placeholder: 'Select type',
      },
      search: {
        mode: 'exact',
      },
    },

    // 折扣值
    {
      key: 'discount',
      title: 'Discount',
      type: 'number',
      table: {
        width: 120,
        render: (value, record) => {
          if (record.type === 'percentage') {
            return `${value}%`;
          }
          return `$${value}`;
        },
      },
      form: {
        required: true,
        placeholder: 'Enter discount value',
        fieldProps: {
          min: 0,
          max: 100,
          precision: 2,
        },
      },
      search: false,
    },

    // 使用次数
    {
      key: 'usedCount',
      title: 'Used',
      type: 'number',
      table: {
        width: 80,
        render: (value, record) => {
          const limit = record.usageLimit || '∞';
          return `${value}/${limit}`;
        },
      },
      form: false,
      search: false,
    },

    // 有效期
    {
      key: 'startDate',
      title: 'Start Date',
      type: 'date',
      table: {
        width: 120,
      },
      form: {
        placeholder: 'Select start date',
      },
      search: false,
    },

    {
      key: 'endDate',
      title: 'End Date',
      type: 'date',
      table: {
        width: 120,
      },
      form: {
        placeholder: 'Select end date',
      },
      search: false,
    },

    // 状态
    {
      key: 'enable',
      title: 'Status',
      type: 'switch',
      table: {
        width: 100,
        render: (value) =>
          value ? (
            <Tag icon={<CheckCircleOutlined />} color='success'>Active</Tag>
          ) : (
            <Tag icon={<CloseCircleOutlined />} color='default'>Inactive</Tag>
          ),
      },
      form: {
        fieldProps: {
          checkedChildren: 'Active',
          unCheckedChildren: 'Inactive',
        },
      },
      search: {
        mode: 'exact',
      },
    },

    // 备注
    {
      key: 'remark',
      title: 'Remark',
      type: 'textarea',
      table: false,
      form: {
        placeholder: 'Optional notes',
        fieldProps: {
          rows: 3,
          showCount: true,
          maxLength: 500,
        },
      },
      search: false,
    },

    // 创建时间
    {
      key: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      table: {
        width: 180,
      },
      form: false,
      search: false,
    },
  ];

  return (
    <SmartCrudPage
      fieldsConfig={fieldsConfig}
      actions={{
        getList: couponActions.getCouponListAction,
        create: couponActions.createCouponAction,
        update: couponActions.updateCouponAction,
        delete: couponActions.deleteCouponAction,
      }}
      title='Coupon Management'
      enableCreate={true}
      enableEdit={true}
      enableDelete={true}
      enableDetail={true}
      formProps={{
        width: 600,
      }}
    />
  );
}
```

#### 步骤 4: 配置权限

在 Permission 表中添加相关权限：

```javascript
// 权限数据
{
  name: 'Coupon Management',
  parentId: null,  // 一级权限
  actions: [],
  apis: [],
}

{
  name: 'Query Coupons',
  parentId: '<coupon-management-id>',
  actions: ['sysGetCouponList', 'sysGetCouponDetail'],
  apis: [],
}

{
  name: 'Create Coupon',
  parentId: '<coupon-management-id>',
  actions: ['sysCreateCoupon'],
  apis: [],
}

{
  name: 'Update Coupon',
  parentId: '<coupon-management-id>',
  actions: ['sysUpdateCoupon'],
  apis: [],
}

{
  name: 'Delete Coupon',
  parentId: '<coupon-management-id>',
  actions: ['sysDeleteCoupon', 'sysBatchDeleteCoupon'],
  apis: [],
}
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
    
    // 表格配置（false = 不显示）
    table: {
      width: 150,
      ellipsis: true,
      align: 'center',
      sorter: true,
      copyable: true,
      render: (value, record) => <Tag>{value}</Tag>,
    },
    
    // 表单配置（false = 不显示）
    form: {
      required: true,
      placeholder: 'Enter value',
      disabled: (isCreate) => !isCreate,  // 动态禁用
      fieldProps: {
        showCount: true,
        maxLength: 50,
      },
    },
    
    // 搜索配置（false = 不可搜索）
    search: {
      mode: 'like',           // 搜索模式
      placeholder: 'Search',
    },
    
    // 详情配置（可选）
    detail: {
      render: (value, record) => <span>{value}</span>,
    },
  },
];
```

### 支持的字段类型

| 类型 | 说明 | 表单组件 | 示例 |
|------|------|---------|------|
| `text` | 单行文本 | Input | 名称、标题 |
| `textarea` | 多行文本 | TextArea | 描述、备注 |
| `number` | 数字输入 | InputNumber | 数量、价格 |
| `select` | 下拉选择 | Select | 状态、类型 |
| `switch` | 开关 | Switch | 启用/禁用 |
| `date` | 日期选择 | DatePicker | 生日、过期日期 |
| `datetime` | 日期时间 | DatePicker | 创建时间 |
| `dateRange` | 日期范围 | RangePicker | 有效期 |
| `tree-select` | 树形选择 | TreeSelect | 父级菜单 |
| `icon` | 图标选择 | IconPicker | 菜单图标 |
| `image` | 图片上传 | ImageUpload | 头像、封面 |
| `images` | 多图上传 | MultiImageUpload | 相册 |
| `file` | 文件上传 | FileUpload | 附件 |
| `markdown` | Markdown | MarkdownEditor | 文章内容 |
| `json` | JSON 编辑 | JsonEditor | 配置数据 |
| `custom` | 自定义 | - | 复杂字段 |

### 搜索模式

| 模式 | 说明 | Prisma 转换 |
|------|------|----------|
| `like` | 模糊搜索 | `{ contains: value, mode: 'insensitive' }` |
| `exact` | 精确搜索 | `value` |
| `in` | 数组包含 | `{ in: values }` |
| `range` | 范围搜索 | `{ gte: start, lte: end }` |

---

## 🔧 wrapAction 权限命名约定

### 命名规则

| 前缀 | 权限级别 | 说明 |
|------|---------|------|
| `pub` | public | 公开可访问，无需登录 |
| `auth` | auth | 需要登录，前台用户使用 |
| `sys` | system | 需要后台权限 + RBAC 检查 |
| `_` | private | 私有方法，不能被前端调用 |

### 使用示例

```javascript
import { wrapAction } from '@/lib/core/action-wrapper';

// 公开接口 - 无需登录
export const pubGetConfig = wrapAction('pubGetConfig', async (_, ctx) => {
  return { success: true, data: { ... } };
});

// 需要登录 - 前台用户
export const authGetProfile = wrapAction('authGetProfile', async (params, ctx) => {
  const { userId } = ctx;  // 自动注入用户ID
  return { success: true, data: { ... } };
});

// 后台功能 - 需要后台权限 + RBAC
export const sysGetUserList = wrapAction('sysGetUserList', async (params, ctx) => {
  const { userId, isAdmin, user } = ctx;
  return { success: true, data: [] };
});

// 跳过日志
export const sysGetOptions = wrapAction('sysGetOptions', handler, { skipLog: true });
```

---

## 🛠️ nb.pubfn 常用工具

### 空值检测

```javascript
import nb from '@/lib/function';

nb.pubfn.isNull(value);        // 检测是否为空（undefined, null, {}, [], ""）
nb.pubfn.isNotNull(value);     // 检测是否不为空
nb.pubfn.isNullOne(a, b, c);   // 至少有一个为空
nb.pubfn.isNotNullAll(a, b);   // 全部都不为空
```

### 类型判断

```javascript
nb.pubfn.isArray(value);       // 是否数组
nb.pubfn.isObject(value);      // 是否对象
nb.pubfn.isString(value);      // 是否字符串
nb.pubfn.isNumber(value);      // 是否数字
nb.pubfn.isBoolean(value);     // 是否布尔
nb.pubfn.isFunction(value);    // 是否函数
```

### 数组操作

```javascript
// 数组去重
nb.pubfn.arrayUnique([1, 2, 2, 3]);  // [1, 2, 3]
nb.pubfn.arrayUnique([{id:1},{id:2},{id:1}], 'id');  // [{id:1},{id:2}]

// 数组差集
nb.pubfn.arrayDiff([1,2,3], [2,3,4]);  // [1]

// 数组交集
nb.pubfn.arrayIntersect([1,2,3], [2,3,4]);  // [2,3]

// 数组并集
nb.pubfn.arrayUnion([1,2,3], [2,3,4]);  // [1,2,3,4]

// 数组分组
nb.pubfn.groupBy([{type:'a',v:1},{type:'b',v:2}], 'type');
// {a:[{type:'a',v:1}], b:[{type:'b',v:2}]}

// 数组求和
nb.pubfn.sum([1, 2, 3]);  // 6
nb.pubfn.sum([{v:1},{v:2}], 'v');  // 3

// 获取数组中的对象
nb.pubfn.getListItem(list, 'id', '123');  // 找到 id=123 的对象
nb.pubfn.getListIndex(list, 'id', '123'); // 找到 id=123 的索引
```

### 树形结构

```javascript
// 数组转树形
nb.pubfn.tree.arrayToTree(list, {
  id: 'id',
  parentId: 'parentId',
  children: 'children',
});

// 树形转数组
nb.pubfn.tree.treeToArray(tree);

// 在树中查找
nb.pubfn.tree.findInTree(tree, node => node.id === '123');

// 映射树节点
nb.pubfn.tree.mapTree(tree, node => ({
  title: node.name,
  value: node.id,
  children: node.children,
}));

// 过滤树节点
nb.pubfn.tree.filterTree(tree, node => node.enable);
```

### 对象操作

```javascript
// 深拷贝
nb.pubfn.deepClone(obj);

// 对象合并（深度）
nb.pubfn.merge({a:{b:1}}, {a:{c:2}});  // {a:{b:1,c:2}}

// 获取嵌套属性
nb.pubfn.getData(obj, 'a.b.c');
nb.pubfn.getData(obj, 'a[0].name');

// 设置嵌套属性
nb.pubfn.setData(obj, 'a.b.c', value);

// 删除指定字段
nb.pubfn.deleteObjectKeys(data, ['password', 'token']);
```

### 时间处理

```javascript
// 格式化时间
nb.pubfn.timeFormat(new Date(), 'yyyy-MM-dd hh:mm:ss');

// 获取时间范围
nb.pubfn.getCommonTime();  // { todayStart, todayEnd, monthStart, ... }

// 相对时间
nb.pubfn.dateDiff(startTime);  // "3天前"
nb.pubfn.dateDiff2(endTime);   // "3天"

// 时间偏移
nb.pubfn.getDayOffsetStartAndEnd(0);   // 今天的开始和结束
nb.pubfn.getDayOffsetStartAndEnd(-1);  // 昨天的开始和结束
nb.pubfn.getMonthOffsetStartAndEnd(0); // 本月的开始和结束
```

### 其他工具

```javascript
// 生成 UUID
nb.pubfn.uuid();  // 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'

// 生成随机数
nb.pubfn.random(6);  // '123456'
nb.pubfn.random(8, 'a-z,0-9');  // 'a1b2c3d4'

// 防抖
nb.pubfn.debounce(fn, 300);

// 节流
nb.pubfn.throttle(fn, 300);

// 休眠
await nb.pubfn.sleep(1000);

// 金额格式化
nb.pubfn.formatMoney(1234567.89);  // '1,234,567.89'

// 隐藏中间字符
nb.pubfn.hidden('13800138000', 3, 4);  // '138****8000'
```

---

## 🔐 权限系统设计

### RBAC 模型

```
User (用户)
  └── roles: String[]  ──────┐
                              ▼
Role (角色) ─────────────────────────────────────────┐
  ├── permission: String[]  ──┐                      │
  ├── menu: String[]  ────────┼──┐                   │
  └── inheritMenuPermissions  │  │                   │
                              ▼  │                   │
Permission (权限) ◄───────────────┘                   │
  ├── actions: String[]   // Server Action 名称      │
  └── apis: String[]      // API 路径                │
                                                     │
Menu (菜单) ◄────────────────────────────────────────┘
  └── permission: String[]  // 菜单关联的权限
```

### 权限检查流程

```
1. 用户请求 → wrapAction 拦截
2. 解析 actionName 前缀（pub/auth/sys）
3. sys 前缀:
   a. 检查后台访问权限（isBackendAllowed 或 admin）
   b. RBAC 检查：用户角色 → 权限 → actions 数组
4. 通过检查 → 执行业务逻辑
5. 记录操作日志
```

### 菜单权限继承

当 `Role.inheritMenuPermissions = true` 时：
- 用户拥有角色分配的菜单
- 同时自动继承这些菜单关联的权限

---

## 📚 参考示例

| 页面 | 路径 | 特点 |
|------|------|------|
| Roles | `admin/rbac/roles` | 树形选择器、自定义操作 |
| Permissions | `admin/rbac/permissions` | 树形表格、数组字段 |
| Menus | `admin/rbac/menus` | 图标选择、动态 TreeSelect |
| Posts | `admin/cms/posts` | Markdown 编辑器 |
| Action Logs | `admin/system/action_logs` | 只读表格、JSON 展示 |

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
  getMenuTreeForSelectAction: menuActions.getMenuTreeForSelectAction,
}}

// fieldsConfig
form: {
  action: 'getMenuTreeForSelectAction',
}
```

### 3. 权限报错 "Action not allowed"

**检查**: 
1. Action 名称是否以 `sys` 开头
2. Permission 表中是否添加了该 action
3. 用户角色是否分配了该权限

### 4. Decimal 类型序列化错误

BaseDAO 已自动处理，如果手动查询需要：

```javascript
import { serializeRecord } from '@/app/(admin)/actions/dao/base';

const data = await prisma.coupon.findMany();
return data.map(serializeRecord);
```

---

## ✨ 总结

使用 NextJS Base 开发的优势：

- 🚀 **快速开发** - 配置驱动，10 分钟完成 CRUD
- 📦 **代码复用** - 减少 60-80% 代码量
- 🎯 **统一规范** - 所有页面结构一致
- 🔒 **安全可靠** - 内置权限系统和日志
- 🔧 **易于维护** - 配置集中，修改方便
- ⚡ **类型驱动** - 自动渲染，开箱即用

**开始使用模板，提升开发效率！** 🎉
