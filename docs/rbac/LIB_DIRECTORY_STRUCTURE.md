# Lib 目录结构设计方案

## 当前问题

```
lib/
├── admin/
│   └── crud/           ← ❌ 不合理：crud 不仅仅是 admin 用的
│       ├── field-generator.js
│       ├── field-types.js
│       ├── rule-evaluator.js
│       └── search-transformer.js
```

**问题：**
- CRUD 功能不仅 admin 用，client 端可能也需要
- `lib/admin/crud` 路径不清晰，混淆了层级关系

---

## 推荐方案：按功能分类

### 目录结构

```
lib/
├── database/           # 数据库相关（基础层）
│   ├── db-api.js      # ✅ 纯粹的 BaseDAO（已有）
│   ├── mongodb.js     # ✅ MongoDB 连接（已有）
│   └── README.md
│
├── dao/               # DAO 层（数据访问层）
│   ├── crud-helper.js        # ⭐ CRUD 辅助类（新增）
│   ├── action-wrapper.js     # ⭐ Action 包装器（新增）
│   └── README.md
│
├── crud/              # CRUD 通用工具（前端+后端都用）
│   ├── field-generator.js    # ✅ 字段生成器（已有）
│   ├── field-types.js        # ✅ 字段类型（已有）
│   ├── rule-evaluator.js     # ✅ 规则评估（已有）
│   ├── search-transformer.js # ✅ 搜索转换（已有）
│   └── README.md
│
├── auth/              # 认证相关
│   ├── auth.js               # ✅ Better Auth（已有）
│   ├── auth-client.js        # ✅ 客户端认证（已有）
│   ├── admin-auth.js         # ✅ 管理员认证（已有）
│   ├── page-auth.js          # ✅ 页面认证（已有）
│   ├── permission-auth.js    # ✅ 权限认证（已有）
│   └── README.md
│
├── logging/           # 日志相关
│   ├── action-logger.js      # ✅ 操作日志（已有）
│   ├── usage-logs.js         # ✅ 使用日志（已有）
│   └── README.md
│
├── business/          # 业务相关（特定业务逻辑）
│   ├── credits.js            # ✅ 积分系统（已有）
│   ├── packages.js           # ✅ 套餐系统（已有）
│   ├── user-profile.js       # ✅ 用户资料（已有）
│   ├── init-user.js          # ✅ 用户初始化（已有）
│   └── README.md
│
└── utils.js           # ✅ 通用工具（已有）
```

---

## 方案对比

### 方案 A：按功能分类（推荐）⭐

```
lib/
├── database/     # 数据库层
├── dao/          # DAO 层
├── crud/         # CRUD 工具
├── auth/         # 认证层
├── logging/      # 日志层
└── business/     # 业务层
```

**优点：**
- ✅ 职责清晰，按功能分类
- ✅ 易于查找和维护
- ✅ 可扩展性强
- ✅ 符合分层架构

**缺点：**
- ❌ 需要移动较多文件
- ❌ 需要更新所有导入路径

---

### 方案 B：按使用场景分类

```
lib/
├── core/         # 核心功能（数据库、DAO）
├── shared/       # 共享工具（CRUD、utils）
├── admin/        # Admin 专用
└── client/       # Client 专用
```

**优点：**
- ✅ 按使用场景区分
- ✅ 容易理解谁用什么

**缺点：**
- ❌ 职责不够清晰
- ❌ shared 可能变成垃圾桶

---

### 方案 C：扁平化（最简单）

```
lib/
├── db-api.js
├── mongodb.js
├── crud-helper.js      # 新增
├── action-wrapper.js   # 新增
├── field-generator.js  # 移出来
├── field-types.js      # 移出来
├── ... 其他所有文件
```

**优点：**
- ✅ 简单直接
- ✅ 不需要子目录

**缺点：**
- ❌ 文件太多，难以管理
- ❌ 没有组织结构

---

## 推荐：方案 A（按功能分类）

### 完整的目录结构

```
lib/
│
├── database/                 # 📦 数据库层（基础零件）
│   ├── db-api.js            # 纯粹的数据库操作
│   ├── mongodb.js           # MongoDB 连接管理
│   └── README.md            # 数据库层文档
│
├── dao/                      # 📦 DAO 层（数据访问）
│   ├── crud-helper.js       # ⭐ CRUD 辅助类（新增）
│   ├── action-wrapper.js    # ⭐ Action 统一包装器（新增）
│   └── README.md            # DAO 层文档
│
├── crud/                     # 📦 CRUD 工具（通用）
│   ├── field-generator.js   # 字段生成器
│   ├── field-types.js       # 字段类型注册表
│   ├── rule-evaluator.js    # 规则评估器
│   ├── search-transformer.js # 搜索转换器
│   └── README.md            # CRUD 工具文档
│
├── auth/                     # 📦 认证授权层
│   ├── auth.js              # Better Auth 配置
│   ├── auth-client.js       # 客户端认证工具
│   ├── admin-auth.js        # 管理员权限检查
│   ├── page-auth.js         # 页面权限控制
│   ├── permission-auth.js   # 权限验证
│   └── README.md            # 认证层文档
│
├── logging/                  # 📦 日志层
│   ├── action-logger.js     # 操作日志记录
│   ├── usage-logs.js        # 使用日志统计
│   └── README.md            # 日志层文档
│
├── business/                 # 📦 业务层（特定业务逻辑）
│   ├── credits.js           # 积分系统
│   ├── packages.js          # 套餐系统
│   ├── user-profile.js      # 用户资料
│   ├── init-user.js         # 用户初始化
│   └── README.md            # 业务层文档
│
└── utils.js                  # 🔧 通用工具函数
```

---

## 迁移计划

### 阶段 0：准备工作（5 分钟）

1. 创建新的目录结构
2. 创建各层级的 README.md
3. 备份当前代码

```bash
git checkout -b refactor/lib-structure
git add .
git commit -m "backup: 准备重构 lib 目录结构"
```

### 阶段 1：创建新目录结构（5 分钟）

```bash
# 创建新目录
mkdir -p lib/database
mkdir -p lib/dao
mkdir -p lib/crud
mkdir -p lib/auth
mkdir -p lib/logging
mkdir -p lib/business
```

### 阶段 2：移动数据库相关文件（10 分钟）

```bash
# 移动数据库文件
mv lib/db-api.js lib/database/
mv lib/mongodb.js lib/database/

# 创建 README
cat > lib/database/README.md << 'EOF'
# 数据库层

纯粹的数据库操作，不含业务逻辑。

## 文件说明

- `db-api.js` - 数据库 API（BaseDAO）
- `mongodb.js` - MongoDB 连接管理

## 使用示例

\`\`\`javascript
import { selects, add, updateOne, remove } from '@/lib/database/db-api';

// 查询
const result = await selects({
    dbName: 'users',
    whereJson: { role: 'admin' },
    pageIndex: 1,
    pageSize: 20,
});

// 新增
await add({
    dbName: 'users',
    dataJson: { name: 'John', email: 'john@example.com' },
});
\`\`\`
EOF
```

**更新导入路径：**
```bash
# 查找所有导入 db-api 的文件
grep -r "from '@/lib/db-api'" --include="*.js" --include="*.jsx"

# 批量替换（需要手动确认）
# '@/lib/db-api' → '@/lib/database/db-api'
# '@/lib/mongodb' → '@/lib/database/mongodb'
```

### 阶段 3：移动 CRUD 相关文件（10 分钟）

```bash
# 移动 CRUD 文件
mv lib/admin/crud/field-generator.js lib/crud/
mv lib/admin/crud/field-types.js lib/crud/
mv lib/admin/crud/rule-evaluator.js lib/crud/
mv lib/admin/crud/search-transformer.js lib/crud/

# 删除空目录
rmdir lib/admin/crud
rmdir lib/admin

# 创建 README
cat > lib/crud/README.md << 'EOF'
# CRUD 工具层

Smart CRUD 相关的通用工具函数。

## 文件说明

- `field-generator.js` - 字段生成器（自动生成表格、表单配置）
- `field-types.js` - 字段类型注册表
- `rule-evaluator.js` - 规则评估器
- `search-transformer.js` - 搜索条件转换器

## 使用示例

\`\`\`javascript
import { generateTableColumns, generateSearchConfig } from '@/lib/crud/field-generator';

const fieldsConfig = [ /* ... */ ];
const tableColumns = generateTableColumns(fieldsConfig);
const searchConfig = generateSearchConfig(fieldsConfig);
\`\`\`
EOF
```

**更新导入路径：**
```bash
# '@/lib/admin/crud/field-generator' → '@/lib/crud/field-generator'
# '@/lib/admin/crud/field-types' → '@/lib/crud/field-types'
# '@/lib/admin/crud/rule-evaluator' → '@/lib/crud/rule-evaluator'
# '@/lib/admin/crud/search-transformer' → '@/lib/crud/search-transformer'
```

### 阶段 4：创建新的 DAO 层文件（稍后，不着急）

```bash
# 创建 DAO 层文件（新增，稍后实现）
touch lib/dao/crud-helper.js
touch lib/dao/action-wrapper.js

# 创建 README
cat > lib/dao/README.md << 'EOF'
# DAO 层

数据访问层，提供可选的 CRUD 辅助功能。

## 文件说明

- `crud-helper.js` - CRUD 辅助类
- `action-wrapper.js` - Action 统一包装器（自动权限+日志）

## 设计理念

DAO 层是"可选的积木"，使用 `lib/database` 的纯粹零件组装而成。

## 使用示例

\`\`\`javascript
import { CrudHelper } from '@/lib/dao/crud-helper';
import { createCrudActions } from '@/lib/dao/action-wrapper';

// 继承 CrudHelper
class UserDAO extends CrudHelper {
    // 获得标准 CRUD 方法
}

// 创建带日志和权限的 Actions
const actions = createCrudActions(userDao, config);
\`\`\`
EOF
```

### 阶段 5：移动认证相关文件（10 分钟）

```bash
# 移动认证文件
mv lib/auth.js lib/auth/
mv lib/auth-client.js lib/auth/
mv lib/admin-auth.js lib/auth/
mv lib/page-auth.js lib/auth/
mv lib/permission-auth.js lib/auth/

# 创建 README
cat > lib/auth/README.md << 'EOF'
# 认证授权层

处理用户认证和权限验证。

## 文件说明

- `auth.js` - Better Auth 配置
- `auth-client.js` - 客户端认证工具
- `admin-auth.js` - 管理员权限检查
- `page-auth.js` - 页面权限控制
- `permission-auth.js` - 权限验证

## 使用示例

\`\`\`javascript
import { checkAdminAction } from '@/lib/auth/admin-auth';

// 检查管理员权限
const adminCheck = await checkAdminAction();
if (!adminCheck.isAdmin) {
    return { success: false, error: 'Unauthorized' };
}
\`\`\`
EOF
```

### 阶段 6：移动日志相关文件（10 分钟）

```bash
# 移动日志文件
mv lib/action-logger.js lib/logging/
mv lib/usage-logs.js lib/logging/

# 创建 README
cat > lib/logging/README.md << 'EOF'
# 日志层

处理各类日志记录。

## 文件说明

- `action-logger.js` - 操作日志（存入 action_logs 表）
- `usage-logs.js` - 使用日志统计

## 使用示例

\`\`\`javascript
import { logAction } from '@/lib/logging/action-logger';

await logAction(
    'create',
    'admin/users',
    startTime,
    requestTime,
    params,
    result,
    isError
);
\`\`\`
EOF
```

### 阶段 7：移动业务相关文件（10 分钟）

```bash
# 移动业务文件
mv lib/credits.js lib/business/
mv lib/packages.js lib/business/
mv lib/user-profile.js lib/business/
mv lib/init-user.js lib/business/

# 创建 README
cat > lib/business/README.md << 'EOF'
# 业务层

特定业务逻辑实现。

## 文件说明

- `credits.js` - 积分系统
- `packages.js` - 套餐系统
- `user-profile.js` - 用户资料管理
- `init-user.js` - 用户初始化

## 使用示例

\`\`\`javascript
import { addCredits, consumeCredits } from '@/lib/business/credits';

// 添加积分
await addCredits(userId, 100, 'register_bonus');

// 消费积分
await consumeCredits(userId, 10, 'generate_image');
\`\`\`
EOF
```

### 阶段 8：更新所有导入路径（30 分钟）

**需要更新的路径映射表：**

| 旧路径 | 新路径 |
|--------|--------|
| `@/lib/db-api` | `@/lib/database/db-api` |
| `@/lib/mongodb` | `@/lib/database/mongodb` |
| `@/lib/admin/crud/*` | `@/lib/crud/*` |
| `@/lib/auth` | `@/lib/auth/auth` |
| `@/lib/auth-client` | `@/lib/auth/auth-client` |
| `@/lib/admin-auth` | `@/lib/auth/admin-auth` |
| `@/lib/page-auth` | `@/lib/auth/page-auth` |
| `@/lib/permission-auth` | `@/lib/auth/permission-auth` |
| `@/lib/action-logger` | `@/lib/logging/action-logger` |
| `@/lib/usage-logs` | `@/lib/logging/usage-logs` |
| `@/lib/credits` | `@/lib/business/credits` |
| `@/lib/packages` | `@/lib/business/packages` |
| `@/lib/user-profile` | `@/lib/business/user-profile` |
| `@/lib/init-user` | `@/lib/business/init-user` |

**查找需要更新的文件：**

```bash
# 查找所有需要更新的导入
grep -r "from '@/lib/" --include="*.js" --include="*.jsx" app/ components/ lib/

# 统计数量
grep -r "from '@/lib/" --include="*.js" --include="*.jsx" app/ components/ lib/ | wc -l
```

### 阶段 9：测试验证（30 分钟）

```bash
# 1. 重新启动开发服务器
npm run dev

# 2. 检查控制台是否有导入错误

# 3. 测试关键功能
# - 登录/注册
# - 用户管理页面
# - 角色管理页面
# - 菜单管理页面

# 4. 运行 linter
npm run lint
```

### 阶段 10：提交代码（5 分钟）

```bash
git add .
git commit -m "refactor: 重构 lib 目录结构，按功能分类

- 创建 database/ (数据库层)
- 创建 dao/ (数据访问层)
- 创建 crud/ (CRUD 工具)
- 创建 auth/ (认证层)
- 创建 logging/ (日志层)
- 创建 business/ (业务层)
- 更新所有导入路径
- 添加各层级 README 文档
"
```

---

## 总时间估算

| 阶段 | 描述 | 预计时间 |
|------|------|----------|
| 0 | 准备工作 | 5 分钟 |
| 1 | 创建目录 | 5 分钟 |
| 2 | 移动数据库文件 | 10 分钟 |
| 3 | 移动 CRUD 文件 | 10 分钟 |
| 4 | 创建 DAO 层（空文件） | 5 分钟 |
| 5 | 移动认证文件 | 10 分钟 |
| 6 | 移动日志文件 | 10 分钟 |
| 7 | 移动业务文件 | 10 分钟 |
| 8 | 更新导入路径 | 30 分钟 |
| 9 | 测试验证 | 30 分钟 |
| 10 | 提交代码 | 5 分钟 |
| **总计** | | **~2 小时** |

---

## 下一步

你觉得这个方案如何？

**选项：**

1. **立即开始** - 我一步步帮你执行
2. **调整方案** - 如果有不满意的地方
3. **先看看影响** - 我可以先列出所有需要更新的文件

**建议顺序：**
1. ✅ 先列出所有需要更新的文件（评估影响）
2. ✅ 逐步执行迁移（一个目录一个目录来）
3. ✅ 每步都测试（确保没问题）

你想怎么开始？🚀

