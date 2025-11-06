# CRUD 工具库

SmartCrudPage 的核心工具集合，用于自动生成表格、表单和搜索功能。

## 📁 文件列表

| 文件 | 说明 |
|------|------|
| `field-generator.js` | 字段生成器 - 根据配置生成表格列、表单字段、搜索条件 |
| `field-types.js` | 字段类型注册表 - 定义所有可用的字段类型组件 |
| `rule-evaluator.js` | 规则评估器 - 处理 showRule、disabled 等条件渲染逻辑 |
| `search-transformer.js` | 搜索转换器 - 将前端搜索参数转换为数据库查询条件 |

## 🎯 使用方式

在 Smart CRUD Page 中自动导入使用：

```javascript
import {
    generateTableColumns,
    generateDetailColumns,
    generateSearchConfig,
    generateSearchTransform,
    validateFieldsConfig,
} from '@/lib/crud/field-generator';

import { buildSortCondition } from '@/lib/crud/search-transformer';
```

在动态表单组件中使用：

```javascript
import { evaluateRule } from '@/lib/crud/rule-evaluator';
import { FIELD_TYPE_REGISTRY } from '@/lib/crud/field-types';
```

## 📖 相关文档

- [Smart CRUD 使用指南](../../docs/admin/SMART_CRUD_GUIDE.md)
- [字段配置规范](../../docs/development/SMART_CRUD_GUIDE.md)

## 🔗 依赖关系

这些工具纯函数，仅依赖：
- Ant Design Pro Components
- React

