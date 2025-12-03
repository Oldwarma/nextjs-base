# 完整实例：创建优惠券管理功能

本文档演示如何使用 NextJS Base 框架从零创建一个完整的「优惠券管理」功能。

---

## 📋 需求分析

### 功能需求

- 优惠券名称（必填）
- 优惠码（必填，唯一，大写字母+数字）
- 折扣类型（百分比/固定金额）
- 折扣值
- 最低消费金额
- 最大折扣金额
- 有效期（开始日期、结束日期）
- 使用次数限制
- 启用状态
- 备注

### 预计时间

| 步骤 | 传统开发 | NextJS Base |
|------|---------|-------------|
| 数据库设计 | 30 分钟 | 10 分钟 |
| Server Actions | 2-3 小时 | 15 分钟 |
| 管理页面 | 3-4 小时 | 15 分钟 |
| 权限配置 | 1 小时 | 10 分钟 |
| **总计** | **7-8 小时** | **50 分钟** |

---

## 步骤 1: 设计数据库模型

### 1.1 添加 Prisma 模型

编辑 `prisma/schema.prisma`：

```prisma
/// 优惠券表
model Coupon {
  id          String    @id @default(uuid())
  
  // 基础信息
  name        String                              // 优惠券名称
  code        String    @unique                   // 优惠码（唯一）
  
  // 折扣信息
  type        String    @default("percentage")    // percentage: 百分比, fixed: 固定金额
  discount    Decimal   @db.Decimal(10, 2)        // 折扣值
  minAmount   Decimal?  @db.Decimal(10, 2) @map("min_amount")   // 最低消费金额
  maxDiscount Decimal?  @db.Decimal(10, 2) @map("max_discount") // 最大折扣金额
  
  // 有效期
  startDate   DateTime? @map("start_date")
  endDate     DateTime? @map("end_date")
  
  // 使用限制
  usageLimit  Int       @default(0) @map("usage_limit")  // 0 = 无限制
  usedCount   Int       @default(0) @map("used_count")
  
  // 状态
  enable      Boolean   @default(true)
  remark      String?
  
  // 时间戳
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?
  
  @@index([code])
  @@index([type])
  @@index([enable])
  @@index([startDate])
  @@index([endDate])
  @@index([deletedAt])
  @@map("coupons")
}
```

### 1.2 执行迁移

```bash
# 创建迁移
npx prisma migrate dev --name add_coupon_table

# 重新生成 Prisma Client
npx prisma generate
```

---

## 步骤 2: 创建 Server Actions

### 2.1 创建 Action 文件

创建 `app/(admin)/actions/cms/crud-action.coupon.js`：

```javascript
'use server';

import { createCrudActions } from '@/lib/core/crud-helper';
import { wrapAction } from '@/lib/core/action-wrapper';
import { prisma } from '@/lib/database/prisma';
import nb from '@/lib/function';

/**
 * Coupon CRUD 配置
 */
const couponConfig = {
  modelName: 'coupon',
  tableName: 'coupons',
  primaryKey: 'id',
  softDelete: true,

  fields: {
    creatable: [
      'name', 'code', 'type', 'discount', 
      'minAmount', 'maxDiscount', 
      'startDate', 'endDate', 
      'usageLimit', 'enable', 'remark'
    ],
    updatable: [
      'name', 'type', 'discount', 
      'minAmount', 'maxDiscount', 
      'startDate', 'endDate', 
      'usageLimit', 'enable', 'remark'
    ],
    searchable: ['name', 'code'],
  },

  query: {
    defaultSort: { createdAt: 'desc' },
    defaultPageSize: 20,
  },

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
      minLength: 3,
      maxLength: 20,
      message: 'Code must be 3-20 uppercase letters, numbers, hyphens or underscores',
    },
    type: {
      required: true,
      type: 'string',
      enum: ['percentage', 'fixed'],
      message: 'Type must be percentage or fixed',
    },
    discount: {
      required: true,
      type: 'number',
      min: 0,
      message: 'Discount must be a positive number',
    },
    minAmount: {
      type: 'number',
      min: 0,
    },
    maxDiscount: {
      type: 'number',
      min: 0,
    },
    usageLimit: {
      type: 'number',
      min: 0,
      default: 0,
    },
    enable: {
      type: 'boolean',
      default: true,
    },
  },

  uniqueFields: ['code'],

  hooks: {
    beforeCreate: async (data) => {
      // 设置默认值
      if (data.enable === undefined) data.enable = true;
      if (data.usedCount === undefined) data.usedCount = 0;
      if (data.usageLimit === undefined) data.usageLimit = 0;
      
      // 验证折扣值
      if (data.type === 'percentage' && data.discount > 100) {
        const error = new Error('Percentage discount cannot exceed 100');
        error.name = 'BusinessError';
        throw error;
      }
      
      return data;
    },

    beforeUpdate: async (id, data, existing) => {
      // 禁止修改优惠码
      delete data.code;
      
      // 验证折扣值
      const type = data.type || existing.type;
      const discount = data.discount || existing.discount;
      if (type === 'percentage' && discount > 100) {
        const error = new Error('Percentage discount cannot exceed 100');
        error.name = 'BusinessError';
        throw error;
      }
      
      return data;
    },

    beforeDelete: async (id, existing) => {
      // 已使用的优惠券不能删除
      if (existing.usedCount > 0) {
        const error = new Error('Cannot delete coupon that has been used');
        error.name = 'BusinessError';
        throw error;
      }
      return true;
    },
  },

  transforms: {
    input: (data) => {
      // 优惠码转大写
      if (data.code) {
        data.code = data.code.toUpperCase().trim().replace(/\s+/g, '_');
      }
      if (data.name) data.name = data.name.trim();
      if (data.remark === '') data.remark = null;
      return data;
    },
    output: (data) => {
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
 * 获取优惠券列表（用于选择器）
 */
export const getCouponListForSelectAction = wrapAction(
  'sysQueryCouponListForSelect',
  async (params, ctx) => {
    const result = await crudActions._dao.getList({
      pageIndex: 1,
      pageSize: 1000,
      whereJson: { enable: true },
      sortJson: { name: 'asc' },
    });

    if (!result.success) return result;

    const options = (result.data || []).map((item) => ({
      label: `${item.name} (${item.code})`,
      value: item.id,
    }));

    return { success: true, data: options };
  },
  { skipLog: true }
);

/**
 * 切换优惠券状态
 */
export const toggleCouponStatusAction = wrapAction(
  'sysToggleCouponStatus',
  async ({ id, enable }, ctx) => {
    if (!id) {
      return { success: false, error: 'ID is required' };
    }
    return await crudActions._dao.update(id, { enable: Boolean(enable) });
  }
);

/**
 * 公开接口：获取可用优惠券列表
 */
export const pubGetAvailableCouponsAction = wrapAction(
  'pubGetAvailableCoupons',
  async (params, ctx) => {
    const now = new Date();
    
    const coupons = await prisma.coupon.findMany({
      where: {
        enable: true,
        deletedAt: null,
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
        AND: {
          OR: [
            { endDate: null },
            { endDate: { gte: now } },
          ],
        },
      },
      orderBy: { discount: 'desc' },
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        discount: true,
        minAmount: true,
        maxDiscount: true,
        endDate: true,
      },
    });

    // 转换 Decimal 类型
    const data = coupons.map(c => ({
      ...c,
      discount: c.discount?.toNumber() || 0,
      minAmount: c.minAmount?.toNumber() || null,
      maxDiscount: c.maxDiscount?.toNumber() || null,
    }));

    return { success: true, data };
  },
  { skipLog: true }
);

/**
 * 前台用户：验证并使用优惠券
 */
export const authUseCouponAction = wrapAction(
  'authUseCoupon',
  async ({ code, orderAmount }, ctx) => {
    const { userId } = ctx;
    
    if (!code) {
      return { success: false, error: 'Coupon code is required' };
    }
    
    const now = new Date();
    
    // 查找优惠券
    const coupon = await prisma.coupon.findFirst({
      where: { 
        code: code.toUpperCase(),
        enable: true,
        deletedAt: null,
      },
    });

    if (!coupon) {
      return { success: false, error: 'Invalid coupon code' };
    }

    // 检查有效期
    if (coupon.startDate && coupon.startDate > now) {
      return { success: false, error: 'Coupon is not yet valid' };
    }
    if (coupon.endDate && coupon.endDate < now) {
      return { success: false, error: 'Coupon has expired' };
    }

    // 检查使用次数
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return { success: false, error: 'Coupon usage limit reached' };
    }

    // 检查最低消费
    const minAmount = coupon.minAmount?.toNumber() || 0;
    if (orderAmount && orderAmount < minAmount) {
      return { 
        success: false, 
        error: `Minimum order amount is $${minAmount.toFixed(2)}` 
      };
    }

    // 计算折扣金额
    let discountAmount = 0;
    const discountValue = coupon.discount.toNumber();
    
    if (coupon.type === 'percentage') {
      discountAmount = (orderAmount * discountValue) / 100;
    } else {
      discountAmount = discountValue;
    }

    // 检查最大折扣
    const maxDiscount = coupon.maxDiscount?.toNumber();
    if (maxDiscount && discountAmount > maxDiscount) {
      discountAmount = maxDiscount;
    }

    // 更新使用次数
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: { increment: 1 } },
    });

    return {
      success: true,
      data: {
        couponId: coupon.id,
        couponName: coupon.name,
        discountAmount: Math.round(discountAmount * 100) / 100,
        type: coupon.type,
      },
    };
  }
);
```

---

## 步骤 3: 创建管理页面

### 3.1 创建页面目录

```bash
mkdir -p app/(admin)/admin/cms/coupons
```

### 3.2 创建页面文件

创建 `app/(admin)/admin/cms/coupons/page.js`：

```javascript
'use client';

import { useMemo } from 'react';
import SmartCrudPage from '@/components/admin/smart-crud-page';
import { Tag, Tooltip, Progress } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  PercentageOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import nb from '@/lib/function';

// Server Actions
import * as couponActions from '@/app/(admin)/actions/cms/crud-action.coupon';

export default function CouponManagementPage() {
  // 字段配置
  const fieldsConfig = useMemo(() => [
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
        width: 180,
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
        width: 140,
        copyable: true,
        render: (value) => (
          <Tag color="blue" style={{ fontFamily: 'monospace' }}>
            {value}
          </Tag>
        ),
      },
      form: {
        required: true,
        placeholder: 'e.g., SUMMER2024',
        fieldProps: {
          maxLength: 20,
          style: { textTransform: 'uppercase' },
        },
        help: 'Only uppercase letters, numbers, hyphens and underscores',
        // 编辑时禁用
        disabled: (isCreate) => !isCreate,
      },
      search: {
        mode: 'like',
        placeholder: 'Search by code',
      },
    },

    // 折扣类型
    {
      key: 'type',
      title: 'Type',
      type: 'select',
      options: [
        { label: 'Percentage', value: 'percentage', color: 'purple' },
        { label: 'Fixed Amount', value: 'fixed', color: 'green' },
      ],
      table: {
        width: 120,
        render: (value) => {
          const config = {
            percentage: { icon: <PercentageOutlined />, color: 'purple', text: 'Percentage' },
            fixed: { icon: <DollarOutlined />, color: 'green', text: 'Fixed' },
          };
          const { icon, color, text } = config[value] || {};
          return (
            <Tag icon={icon} color={color}>
              {text}
            </Tag>
          );
        },
      },
      form: {
        required: true,
        placeholder: 'Select discount type',
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
        width: 100,
        render: (value, record) => {
          if (record.type === 'percentage') {
            return <span style={{ color: '#722ed1' }}>{value}%</span>;
          }
          return <span style={{ color: '#52c41a' }}>${value}</span>;
        },
      },
      form: {
        required: true,
        placeholder: 'Enter discount value',
        fieldProps: {
          min: 0,
          precision: 2,
        },
        help: 'For percentage type, max is 100',
      },
      search: false,
    },

    // 最低消费
    {
      key: 'minAmount',
      title: 'Min Amount',
      type: 'number',
      table: {
        width: 110,
        render: (value) => value ? `$${value}` : '-',
      },
      form: {
        placeholder: 'Minimum order amount',
        fieldProps: {
          min: 0,
          precision: 2,
          prefix: '$',
        },
      },
      search: false,
    },

    // 最大折扣
    {
      key: 'maxDiscount',
      title: 'Max Discount',
      type: 'number',
      table: {
        width: 110,
        render: (value) => value ? `$${value}` : '-',
      },
      form: {
        placeholder: 'Maximum discount amount',
        fieldProps: {
          min: 0,
          precision: 2,
          prefix: '$',
        },
        help: 'Leave empty for no limit',
      },
      search: false,
    },

    // 有效期开始
    {
      key: 'startDate',
      title: 'Start Date',
      type: 'date',
      table: {
        width: 110,
      },
      form: {
        placeholder: 'Select start date',
      },
      search: false,
    },

    // 有效期结束
    {
      key: 'endDate',
      title: 'End Date',
      type: 'date',
      table: {
        width: 110,
        render: (value) => {
          if (!value) return '-';
          const isExpired = new Date(value) < new Date();
          return (
            <span style={{ color: isExpired ? '#ff4d4f' : 'inherit' }}>
              {nb.pubfn.timeFormat(new Date(value), 'yyyy-MM-dd')}
              {isExpired && ' (Expired)'}
            </span>
          );
        },
      },
      form: {
        placeholder: 'Select end date',
      },
      search: false,
    },

    // 使用次数限制
    {
      key: 'usageLimit',
      title: 'Usage Limit',
      type: 'number',
      table: false,
      form: {
        placeholder: '0 = Unlimited',
        fieldProps: {
          min: 0,
        },
        help: 'Enter 0 for unlimited usage',
      },
      search: false,
    },

    // 使用情况
    {
      key: 'usedCount',
      title: 'Usage',
      type: 'custom',
      table: {
        width: 120,
        render: (value, record) => {
          const used = value || 0;
          const limit = record.usageLimit || 0;
          
          if (limit === 0) {
            return <span>{used} / ∞</span>;
          }
          
          const percent = Math.round((used / limit) * 100);
          const status = percent >= 100 ? 'exception' : percent >= 80 ? 'normal' : 'success';
          
          return (
            <Tooltip title={`${used} / ${limit} used`}>
              <Progress 
                percent={percent} 
                size="small" 
                status={status}
                format={() => `${used}/${limit}`}
              />
            </Tooltip>
          );
        },
      },
      form: false,
      search: false,
    },

    // 状态
    {
      key: 'enable',
      title: 'Status',
      type: 'switch',
      table: {
        width: 100,
        render: (value, record) => {
          // 检查是否过期
          if (record.endDate && new Date(record.endDate) < new Date()) {
            return <Tag color="default">Expired</Tag>;
          }
          // 检查是否用完
          if (record.usageLimit > 0 && record.usedCount >= record.usageLimit) {
            return <Tag color="warning">Used Up</Tag>;
          }
          return value ? (
            <Tag icon={<CheckCircleOutlined />} color='success'>Active</Tag>
          ) : (
            <Tag icon={<CloseCircleOutlined />} color='default'>Inactive</Tag>
          );
        },
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
        width: 160,
      },
      form: false,
      search: false,
    },
  ], []);

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
        width: 700,
      }}
      tableProps={{
        scroll: { x: 1400 },
      }}
    />
  );
}
```

---

## 步骤 4: 配置权限

### 4.1 添加权限记录

在 `/admin/rbac/permissions` 页面添加以下权限：

| 名称 | 父级 | Actions |
|------|------|---------|
| Coupon Management | (根级) | - |
| Query Coupons | Coupon Management | `sysGetCouponList`, `sysGetCouponDetail` |
| Create Coupon | Coupon Management | `sysCreateCoupon` |
| Update Coupon | Coupon Management | `sysUpdateCoupon`, `sysToggleCouponStatus` |
| Delete Coupon | Coupon Management | `sysDeleteCoupon`, `sysBatchDeleteCoupon` |

### 4.2 添加菜单记录

在 `/admin/rbac/menus` 页面添加菜单：

| 名称 | 父级 | URL | 图标 | 关联权限 |
|------|------|-----|------|---------|
| Coupon Management | CMS | /admin/cms/coupons | GiftOutlined | Query Coupons |

### 4.3 分配权限给角色

在 `/admin/rbac/roles` 页面：

1. 选择目标角色
2. 点击 "Assign Permissions"
3. 勾选 Coupon Management 下的权限
4. 点击 "Assign Menus"
5. 勾选 Coupon Management 菜单

---

## 步骤 5: 测试

### 5.1 启动开发服务器

```bash
npm run dev
```

### 5.2 访问管理页面

打开浏览器访问 `http://localhost:3000/admin/cms/coupons`

### 5.3 功能测试清单

- [ ] 创建优惠券
  - [ ] 验证必填字段
  - [ ] 验证优惠码格式
  - [ ] 验证优惠码唯一性
  - [ ] 验证百分比不超过 100
- [ ] 编辑优惠券
  - [ ] 优惠码不可修改
  - [ ] 其他字段正常更新
- [ ] 删除优惠券
  - [ ] 未使用的可删除
  - [ ] 已使用的不可删除
- [ ] 搜索功能
  - [ ] 按名称搜索
  - [ ] 按优惠码搜索
  - [ ] 按状态筛选
- [ ] 权限测试
  - [ ] 无权限用户不能访问
  - [ ] 只有查询权限的用户不能创建/编辑/删除

---

## 📁 最终文件结构

```
app/(admin)/
├── admin/
│   └── cms/
│       └── coupons/
│           └── page.js              # 管理页面
└── actions/
    └── cms/
        └── crud-action.coupon.js    # Server Actions

prisma/
└── schema.prisma                    # 数据库模型
```

---

## 🎉 总结

通过 NextJS Base 框架，我们在约 50 分钟内完成了：

1. ✅ 数据库设计和迁移
2. ✅ 完整的 CRUD Server Actions
3. ✅ 功能丰富的管理页面
4. ✅ 权限系统集成
5. ✅ 自定义业务逻辑（验证、限制等）

**代码量对比：**
- 传统开发：约 800-1000 行
- NextJS Base：约 300 行

**效率提升：约 70%** 🚀
