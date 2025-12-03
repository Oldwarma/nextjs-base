# API 参考

<div align="center">

**NextJS Base 组件和函数的详细 API 文档**

</div>

---

## 📚 API 目录

### 核心 API

| 文档 | 说明 |
|:---|:---|
| [wrapAction](./WRAP_ACTION.md) | Action 包装器 API |
| [createCrudActions](./CRUD_HELPER.md) | CRUD 工厂函数 API |
| [BaseDAO](./BASE_DAO.md) | 数据访问对象 API |

### 组件 API

| 文档 | 说明 |
|:---|:---|
| [SmartCrudPage](./SMART_CRUD_PAGE.md) | 万能表格组件 Props |
| [SmartForm](./SMART_FORM.md) | 万能表单组件 Props |
| [fieldsConfig](./FIELDS_CONFIG.md) | 字段配置详解 |

### 工具库 API

| 文档 | 说明 |
|:---|:---|
| [nb.pubfn](./NB_PUBFN.md) | 公共函数库 |

---

## 🔧 快速参考

### wrapAction

```javascript
import { wrapAction } from '@/lib/core/action-wrapper'

export const myAction = wrapAction(
  'sysMyAction',           // Action 名称
  async (params, ctx) => { // 处理函数
    // ctx: { userId, user, isAdmin }
    return { success: true, data: result }
  },
  { skipLog: false }       // 选项
)
```

### createCrudActions

```javascript
import { createCrudActions } from '@/lib/core/crud-helper'

export const {
  getList,
  getDetail,
  create,
  update,
  delete: del,
} = createCrudActions({
  modelName: 'post',
  fields: { creatable: [...], updatable: [...] },
  validation: { ... },
  hooks: { ... },
})
```

### fieldsConfig

```javascript
const fieldsConfig = [
  {
    key: 'name',
    title: '名称',
    type: 'text',
    table: { width: 200 },
    form: { required: true },
    search: { enabled: true, mode: 'like' },
  },
]
```

### nb.pubfn

```javascript
import nb from '@/lib/function'

// 时间处理
nb.pubfn.timeFormat(new Date(), 'yyyy-MM-dd')

// 数组操作
nb.pubfn.arrayUnique([1, 2, 2, 3])

// 对象操作
nb.pubfn.deepClone(obj)

// 验证
nb.pubfn.test.email('test@example.com')
```

---

<div align="center">

[← 返回文档中心](../README.md)

</div>

