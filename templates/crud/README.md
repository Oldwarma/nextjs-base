# CRUD 模板使用指南

快速创建完整的 CRUD 管理页面，只需 3 步 + 3 个文件。

---

## 🚀 快速开始（3 步骤）

### 步骤 1：创建配置文件

复制 `crud-config.template.js` 并修改：

```bash
cp templates/crud/crud-config.template.js app/(admin)/actions/coupons/configs/coupon-crud.config.js
```

修改内容：
- 替换 `{RESOURCE_NAME}` → `coupons`
- 配置 `fieldsConfig`（字段定义）

### 步骤 2：创建 Actions 文件

复制 `crud-action.template.js` 并修改：

```bash
cp templates/crud/crud-action.template.js app/(admin)/actions/coupons/admin-coupons.js
```

修改内容：
- 替换 `{RESOURCE_NAME}` → `coupon`
- 替换 `{RESOURCE_LABEL}` → `Coupon`
- 引入正确的 config

### 步骤 3：创建前端页面

复制 `crud-page.template.jsx` 并修改：

```bash
cp templates/crud/crud-page.template.jsx app/(admin)/admin/coupons/page.js
```

修改内容：
- 替换 `{RESOURCE_NAME}` → `coupon`
- 替换 `{RESOURCE_LABEL}` → `Coupon`
- 引入正确的 actions

---

## ✅ 完成！

你现在拥有一个完整的 CRUD 页面，包括：

- ✅ 列表展示（分页、排序、搜索）
- ✅ 创建表单
- ✅ 编辑表单
- ✅ 删除操作
- ✅ 批量更新
- ✅ 批量删除
- ✅ 详情查看
- ✅ 权限验证
- ✅ 操作日志
- ✅ 字段验证
- ✅ 错误处理

**代码量**：不到 100 行

---

## 📖 详细配置说明

### fieldsConfig 字段类型

#### 1. 文本类型

```javascript
{
    type: 'text',        // 单行文本
    type: 'textarea',    // 多行文本
    type: 'password',    // 密码输入
    type: 'email',       // 邮箱输入
    type: 'url',         // URL 输入
}
```

#### 2. 数字类型

```javascript
{
    type: 'number',      // 数字输入
    type: 'slider',      // 滑块选择
}
```

#### 3. 选择类型

```javascript
{
    type: 'select',      // 下拉选择
    type: 'radio',       // 单选按钮
    type: 'checkbox',    // 多选框
    options: [
        { label: 'Option 1', value: 'value1' },
        { label: 'Option 2', value: 'value2' },
    ],
}
```

#### 4. 日期类型

```javascript
{
    type: 'date',        // 日期选择
    type: 'dateRange',   // 日期范围
    type: 'time',        // 时间选择
    type: 'datetime',    // 日期时间
}
```

#### 5. 特殊类型

```javascript
{
    type: 'switch',      // 开关
    type: 'upload',      // 文件上传
    type: 'image',       // 图片上传
    type: 'markdown',    // Markdown 编辑器
    type: 'json',        // JSON 编辑器
    type: 'color',       // 颜色选择器
}
```

### 字段显示控制

```javascript
{
    tableShow: true,     // 表格中显示
    formShow: true,      // 表单中显示
    searchShow: true,    // 搜索中显示
    detailShow: true,    // 详情中显示
    
    // 条件显示（根据其他字段的值）
    showRule: {
        field: 'type',
        operator: 'eq',
        value: 'custom',
    },
}
```

### 验证规则

```javascript
rules: [
    { required: true, message: 'This field is required' },
    { min: 2, max: 50, message: 'Length: 2-50 characters' },
    { pattern: /^[a-zA-Z0-9]+$/, message: 'Only letters and numbers' },
    { type: 'email', message: 'Invalid email format' },
    { type: 'url', message: 'Invalid URL format' },
    { 
        validator: (rule, value) => {
            if (value < 0) return Promise.reject('Must be positive');
            return Promise.resolve();
        }
    },
]
```

---

## 🔧 高级功能

### 1. 添加自定义 Action

在 Actions 文件中：

```javascript
import { wrapAdminAction } from '@/lib/core/action-wrapper';

export const activateCouponAction = wrapAdminAction(
    'activate',
    'coupon',
    async ({ id }, context) => {
        const dao = crudActions._dao;
        return await dao.update({
            id,
            data: { status: 'active' },
            userId: context.userId,
        });
    }
);
```

### 2. 添加钩子函数

```javascript
import { createCrudActionsWithHooks } from '@/lib/core/crud-helper';

const crudActions = createCrudActionsWithHooks(config, {
    beforeCreate: async (params, context) => {
        console.log('Creating...', params);
    },
    afterCreate: async (result, context) => {
        // 发送通知
        await sendNotification(result);
    },
});
```

### 3. 连表查询

在 config 中：

```javascript
foreignDB: [
    {
        dbName: 'users',
        localKey: 'userId',
        foreignKey: 'id',
        as: 'user',
        fieldJson: { id: 1, name: 1, email: 1 },
    },
]
```

### 4. 自定义页面按钮

在 Page 中：

```javascript
<SmartCrudPage
    // ... 其他配置
    customActions={[
        {
            key: 'activate',
            label: 'Activate',
            onClick: async (record) => {
                await activateCouponAction({ id: record.id });
            },
        },
    ]}
/>
```

---

## 📚 相关文档

- [核心库文档](../../lib/core/README.md)
- [SmartCrudPage 使用指南](../../docs/admin/SMART_CRUD_GUIDE.md)
- [BaseDAO 文档](../../docs/admin/BASE_DAO.md)

---

## 💡 最佳实践

### 1. 文件组织

```
app/(admin)/
├── actions/
│   └── coupons/
│       ├── configs/
│       │   └── coupon-crud.config.js  # 配置
│       └── admin-coupons.js           # Actions
└── admin/
    └── coupons/
        └── page.js                     # 页面
```

### 2. 命名规范

- **集合名**：复数，小写，如 `coupons`
- **配置名**：`{resource}CrudConfig`，如 `couponCrudConfig`
- **Action名**：`{action}{Resource}Action`，如 `createCouponAction`
- **文件名**：kebab-case，如 `admin-coupons.js`

### 3. 权限配置

```javascript
permissions: {
    create: 'coupon:create',  // 具体权限
    update: 'coupon:update',
    delete: 'coupon:delete',
    read: 'admin',            // 或要求管理员
}
```

### 4. 搜索优化

```javascript
// 只对常用字段启用搜索
searchFields: ['name', 'code', 'status'],

// 不要对所有字段都启用搜索
// searchFields: Object.keys(fieldsConfig), // ❌ 不推荐
```

---

## 🎯 模板变量替换表

| 变量 | 说明 | 示例 |
|------|------|------|
| `{RESOURCE_NAME}` | 资源名（小写，单数） | `coupon` |
| `{RESOURCE_LABEL}` | 资源标签（首字母大写） | `Coupon` |
| `{RESOURCE_NAME}s` | 资源名（小写，复数） | `coupons` |

### 批量替换命令

```bash
# macOS/Linux
sed -i '' 's/{RESOURCE_NAME}/coupon/g' your-file.js
sed -i '' 's/{RESOURCE_LABEL}/Coupon/g' your-file.js

# 或使用你的编辑器的查找替换功能
```

---

## ✨ 总结

使用模板创建 CRUD 页面的优势：

- 🚀 **快速** - 3 个文件，不到 5 分钟
- 🔐 **安全** - 自动权限验证
- 📝 **规范** - 自动日志记录
- ⚡ **高效** - 统一的代码风格
- 🎯 **专注** - 只需关注业务逻辑

**开发效率提升 10 倍！** 🎉

