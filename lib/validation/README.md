# 数据验证模块

本模块提供简单直观的数据验证功能，**自动将 validation 配置转换为 Zod Schema**。

## 核心理念

- **简单优先**：使用熟悉的配置对象格式，无需学习 Zod 语法
- **自动转换**：内部自动转换为 Zod Schema，获得类型安全和数据转换
- **灵活选择**：高级用户也可以直接使用 Zod Schema

## 使用方式

### 1. 在 CRUD 配置中使用（推荐）

```javascript
const userConfig = {
  modelName: 'users',
  primaryKey: 'id',
  
  // 字段验证规则
  validation: {
    name: {
      required: true,
      type: 'string',
      minLength: 2,
      maxLength: 50,
      message: 'Name must be 2-50 characters',
    },
    email: {
      required: true,
      type: 'email',
      message: 'Invalid email format',
    },
    age: {
      type: 'number',
      min: 0,
      max: 150,
      int: true,  // 整数
    },
    tags: {
      type: 'array',
      itemType: 'string',
      maxLength: 10,
    },
    role: {
      type: 'string',
      enum: ['admin', 'user', 'guest'],
      default: 'user',
    },
    // 自定义验证器（用于复杂逻辑）
    password: {
      required: true,
      type: 'string',
      minLength: 8,
      validator: async (value, context) => {
        // 检查密码强度
        if (!/[A-Z]/.test(value)) {
          throw new Error('Password must contain uppercase letter');
        }
        return true;
      },
    },
  },
  
  // 唯一性验证（数据库级别）
  uniqueFields: ['email'],
};
```

### 2. 支持的验证规则

| 配置项 | 说明 | 示例 |
|--------|------|------|
| `required` | 是否必填（create 时生效） | `true` |
| `type` | 数据类型 | `'string'`, `'number'`, `'boolean'`, `'array'`, `'date'`, `'email'`, `'url'` |
| `minLength` | 最小长度（字符串/数组） | `2` |
| `maxLength` | 最大长度（字符串/数组） | `50` |
| `min` | 最小值（数字） | `0` |
| `max` | 最大值（数字） | `100` |
| `int` | 是否整数（数字） | `true` |
| `pattern` | 正则表达式 | `/^[a-z]+$/` |
| `enum` | 枚举值 | `['active', 'inactive']` |
| `itemType` | 数组元素类型 | `'string'`, `'number'` |
| `default` | 默认值 | `true`, `0`, `'active'` |
| `message` | 自定义错误消息 | `'Invalid value'` |
| `validator` | 自定义验证函数 | `async (value, context) => { ... }` |
| `custom` | 同 validator | `async (value, context) => { ... }` |

### 3. 类型说明

```javascript
// 字符串
{ type: 'string', minLength: 2, maxLength: 100 }

// 数字
{ type: 'number', min: 0, max: 100, int: true }

// 布尔值
{ type: 'boolean', default: true }

// 数组
{ type: 'array', itemType: 'string', maxLength: 10 }

// 日期
{ type: 'date' }

// 邮箱（自动验证格式）
{ type: 'email' }

// URL（自动验证格式）
{ type: 'url' }

// 枚举
{ type: 'string', enum: ['active', 'inactive', 'draft'] }
```

### 4. 自定义验证器

用于处理 Zod 无法表达的复杂验证逻辑：

```javascript
validation: {
  // 异步验证
  username: {
    required: true,
    type: 'string',
    validator: async (value, context) => {
      // context 包含 { data, action, recordId, modelName }
      const { prisma } = await import('@/lib/database/prisma');
      const exists = await prisma.user.findFirst({
        where: { username: value },
      });
      if (exists && exists.id !== context.recordId) {
        throw new Error('Username already taken');
      }
      return true;
    },
  },
  
  // 跨字段验证
  confirmPassword: {
    required: true,
    type: 'string',
    validator: async (value, context) => {
      if (value !== context.data.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    },
  },
}
```

### 5. 高级用法：直接使用 Zod Schema

如果需要更复杂的验证逻辑，可以直接传入 Zod Schema：

```javascript
import { z } from 'zod';

const userConfig = {
  modelName: 'users',
  
  // 直接使用 Zod Schema（优先级高于 validation）
  schemas: {
    create: z.object({
      name: z.string().min(2).max(50),
      email: z.string().email(),
      password: z.string().min(8).regex(/[A-Z]/, 'Must contain uppercase'),
    }),
    update: z.object({
      name: z.string().min(2).max(50).optional(),
      email: z.string().email().optional(),
    }),
  },
};
```

## 验证流程

BaseDAO 的 `validate()` 方法执行以下步骤：

1. **Zod Schema 验证**
   - 优先使用 `config.schemas`（用户直接传入的 Zod Schema）
   - 否则将 `config.validation` 自动转换为 Zod Schema
   - 验证类型、长度、范围、格式等

2. **自定义验证器**
   - 执行 `validator` 或 `custom` 函数
   - 用于异步验证、跨字段验证等复杂逻辑

3. **唯一性验证**
   - 通过 `uniqueFields` 配置
   - 在数据库级别检查字段唯一性

## API

### validateWithConfig(config, data, action)

验证数据并返回结果。

```javascript
import { validateWithConfig } from '@/lib/validation';

const result = validateWithConfig(config, data, 'create');

if (result.success) {
  console.log('Validated data:', result.data);
} else {
  console.log('Error:', result.error);
  console.log('Details:', result.errors);
}
```

### runCustomValidators(validation, data, action, context)

执行自定义验证器。

```javascript
import { runCustomValidators } from '@/lib/validation';

await runCustomValidators(validation, data, 'create', {
  recordId: 'xxx',
  modelName: 'users',
});
```

### validationToZod(validation, action)

将 validation 配置转换为 Zod Schema（内部使用）。

```javascript
import { validationToZod } from '@/lib/validation';

const schema = validationToZod({
  name: { required: true, minLength: 2 },
}, 'create');
```

## 最佳实践

1. **简单场景**：使用 `validation` 配置，简单直观
2. **复杂验证**：使用 `validator/custom` 自定义函数
3. **唯一性检查**：使用 `uniqueFields`，这是数据库级别的验证
4. **业务逻辑验证**：使用 `hooks.beforeCreate` / `hooks.beforeUpdate`
5. **高级用法**：直接传入 Zod Schema（`schemas` 配置）

## 文件结构

```text
lib/validation/
├── auto-schema.js   # 核心：自动转换 + 验证函数
├── index.js         # 导出入口
└── README.md        # 本文档
```

## 与 nb.pubfn 配合使用

验证模块内部使用 `nb.pubfn` 进行类型判断：

```javascript
import nb from '@/lib/function';

// 类型判断
if (!nb.pubfn.isObject(validation)) { ... }
if (nb.pubfn.isFunction(validator)) { ... }
if (nb.pubfn.isArray(rule.enum)) { ... }
```

详见 [lib/function/README.md](../function/README.md)

## 与旧版本的兼容性

本模块完全兼容旧的 `validation` 配置格式，无需修改现有代码。

新增功能：

- 自动转换为 Zod Schema（内部实现）
- 更好的类型验证和数据转换
- 支持 `int` 配置（整数验证）
- 支持 `validator/custom` 自定义验证函数
