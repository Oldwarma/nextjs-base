# Lib 目录重构执行计划

## 影响评估

**需要更新的文件数量：** 30 个

**导入路径统计：**
```
14 次 - @/lib/auth
 7 次 - @/lib/admin-auth
 5 次 - @/lib/action-logger
 3 次 - @/lib/mongodb
 3 次 - @/lib/db-api
 2 次 - @/lib/utils
 2 次 - @/lib/usage-logs
 2 次 - @/lib/packages
 2 次 - @/lib/credits
 2 次 - @/lib/auth-client
 1 次 - @/lib/user-profile
 1 次 - @/lib/permission-auth
 1 次 - @/lib/init-user
 1 次 - @/lib/admin/crud/search-transformer
 1 次 - @/lib/admin/crud/rule-evaluator
 1 次 - @/lib/admin/crud/field-types
 1 次 - @/lib/admin/crud/field-generator
```

**风险评估：** 🟡 中等风险
- 需要更新 30 个文件的导入路径
- 如果路径错误会导致系统无法运行
- 但是可以逐步验证，风险可控

---

## 执行策略：分步骤、逐个验证

### 策略说明

**不要：** ❌ 一次性移动所有文件，然后批量替换路径
**要：** ✅ 一个目录一个目录移动，移动后立即更新路径并测试

**每个步骤：**
1. 移动文件到新目录
2. 更新导入路径
3. 运行测试
4. 提交 git

---

## 步骤 1：移动 CRUD 文件（最简单，先练手）

### 1.1 创建目录并移动文件

```bash
# 创建目录
mkdir -p lib/crud

# 移动文件
mv lib/admin/crud/field-generator.js lib/crud/
mv lib/admin/crud/field-types.js lib/crud/
mv lib/admin/crud/rule-evaluator.js lib/crud/
mv lib/admin/crud/search-transformer.js lib/crud/

# 删除空目录
rmdir lib/admin/crud
rmdir lib/admin
```

### 1.2 更新导入路径

**需要更新的文件（4 个）：**
1. `components/admin/smart-crud-page.jsx` - 2 处
2. `components/admin/dynamic-form-fields.jsx` - 2 处

**替换规则：**
```
'@/lib/admin/crud/field-generator' → '@/lib/crud/field-generator'
'@/lib/admin/crud/field-types' → '@/lib/crud/field-types'
'@/lib/admin/crud/rule-evaluator' → '@/lib/crud/rule-evaluator'
'@/lib/admin/crud/search-transformer' → '@/lib/crud/search-transformer'
```

### 1.3 测试验证

```bash
# 启动开发服务器
npm run dev

# 测试页面
# - 访问任意 CRUD 页面（如用户管理）
# - 确认表格、表单、搜索功能正常
```

### 1.4 提交

```bash
git add .
git commit -m "refactor: 移动 CRUD 工具到 lib/crud/

- 创建 lib/crud/ 目录
- 移动 field-generator.js, field-types.js, rule-evaluator.js, search-transformer.js
- 更新 2 个组件的导入路径
- 删除空的 lib/admin/ 目录
"
```

---

## 步骤 2：移动认证文件

### 2.1 创建目录并移动文件

```bash
# 创建目录
mkdir -p lib/auth

# 移动文件
mv lib/auth.js lib/auth/
mv lib/auth-client.js lib/auth/
mv lib/admin-auth.js lib/auth/
mv lib/page-auth.js lib/auth/
mv lib/permission-auth.js lib/auth/
```

### 2.2 更新导入路径

**需要更新的文件（~24 个）：**

**替换规则：**
```
'@/lib/auth' → '@/lib/auth/auth'
'@/lib/auth-client' → '@/lib/auth/auth-client'
'@/lib/admin-auth' → '@/lib/auth/admin-auth'
'@/lib/page-auth' → '@/lib/auth/page-auth'
'@/lib/permission-auth' → '@/lib/auth/permission-auth'
```

**注意：** 还需要更新 lib 内部的交叉引用：
- `lib/auth/admin-auth.js` 导入 `auth.js`
- `lib/auth/permission-auth.js` 导入 `auth.js`
- `lib/auth/page-auth.js` 导入 `auth.js`

### 2.3 测试验证

```bash
# 测试功能
# - 登录
# - 注册
# - 访问需要权限的页面
# - 管理员操作
```

### 2.4 提交

```bash
git add .
git commit -m "refactor: 移动认证文件到 lib/auth/

- 创建 lib/auth/ 目录
- 移动所有认证相关文件
- 更新约 24 个文件的导入路径
- 更新 lib 内部的交叉引用
"
```

---

## 步骤 3：移动日志文件

### 3.1 创建目录并移动文件

```bash
# 创建目录
mkdir -p lib/logging

# 移动文件
mv lib/action-logger.js lib/logging/
mv lib/usage-logs.js lib/logging/
```

### 3.2 更新导入路径

**需要更新的文件（~7 个）：**

**替换规则：**
```
'@/lib/action-logger' → '@/lib/logging/action-logger'
'@/lib/usage-logs' → '@/lib/logging/usage-logs'
```

### 3.3 测试验证

```bash
# 测试功能
# - 执行任意管理员操作
# - 检查 action_logs 表是否有新记录
# - 检查控制台是否有错误
```

### 3.4 提交

```bash
git add .
git commit -m "refactor: 移动日志文件到 lib/logging/

- 创建 lib/logging/ 目录
- 移动 action-logger.js, usage-logs.js
- 更新约 7 个文件的导入路径
"
```

---

## 步骤 4：移动数据库文件

### 4.1 创建目录并移动文件

```bash
# 创建目录
mkdir -p lib/database

# 移动文件
mv lib/db-api.js lib/database/
mv lib/mongodb.js lib/database/
```

### 4.2 更新导入路径

**需要更新的文件（~6 个）：**

**替换规则：**
```
'@/lib/db-api' → '@/lib/database/db-api'
'@/lib/mongodb' → '@/lib/database/mongodb'
```

**注意：** db-api.js 本身也导入了 mongodb.js，需要更新

### 4.3 测试验证

```bash
# 测试功能
# - 访问任意 CRUD 页面
# - 执行创建、更新、删除操作
# - 确认数据库操作正常
```

### 4.4 提交

```bash
git add .
git commit -m "refactor: 移动数据库文件到 lib/database/

- 创建 lib/database/ 目录
- 移动 db-api.js, mongodb.js
- 更新约 6 个文件的导入路径
- 更新 db-api.js 内部引用
"
```

---

## 步骤 5：移动业务文件

### 5.1 创建目录并移动文件

```bash
# 创建目录
mkdir -p lib/business

# 移动文件
mv lib/credits.js lib/business/
mv lib/packages.js lib/business/
mv lib/user-profile.js lib/business/
mv lib/init-user.js lib/business/
```

### 5.2 更新导入路径

**需要更新的文件（~8 个）：**

**替换规则：**
```
'@/lib/credits' → '@/lib/business/credits'
'@/lib/packages' → '@/lib/business/packages'
'@/lib/user-profile' → '@/lib/business/user-profile'
'@/lib/init-user' → '@/lib/business/init-user'
```

**注意：** 这些文件之间可能有交叉引用，需要检查

### 5.3 测试验证

```bash
# 测试功能
# - 用户注册（init-user）
# - 积分操作（credits）
# - 套餐购买（packages）
# - 用户资料（user-profile）
```

### 5.4 提交

```bash
git add .
git commit -m "refactor: 移动业务文件到 lib/business/

- 创建 lib/business/ 目录
- 移动 credits.js, packages.js, user-profile.js, init-user.js
- 更新约 8 个文件的导入路径
- 更新文件间的交叉引用
"
```

---

## 步骤 6：创建 README 文档

### 6.1 为每个目录创建 README

```bash
# 创建所有 README
touch lib/database/README.md
touch lib/crud/README.md
touch lib/auth/README.md
touch lib/logging/README.md
touch lib/business/README.md
```

### 6.2 编写 README 内容

（参考之前提供的 README 模板）

### 6.3 提交

```bash
git add .
git commit -m "docs: 为 lib 各子目录添加 README 文档

- 添加 database/README.md
- 添加 crud/README.md
- 添加 auth/README.md
- 添加 logging/README.md
- 添加 business/README.md
"
```

---

## 步骤 7：创建 DAO 层（稍后实施）

这是新功能，不是迁移，可以之后再做：

```bash
mkdir -p lib/dao
touch lib/dao/crud-helper.js
touch lib/dao/action-wrapper.js
touch lib/dao/README.md
```

---

## 时间线

| 步骤 | 内容 | 预计时间 | 累计时间 |
|------|------|----------|----------|
| 1 | 移动 CRUD 文件 | 15 分钟 | 15 分钟 |
| 2 | 移动认证文件 | 30 分钟 | 45 分钟 |
| 3 | 移动日志文件 | 15 分钟 | 60 分钟 |
| 4 | 移动数据库文件 | 20 分钟 | 80 分钟 |
| 5 | 移动业务文件 | 20 分钟 | 100 分钟 |
| 6 | 创建 README | 10 分钟 | 110 分钟 |
| **总计** | | **~2 小时** | |

---

## 风险控制

### 1. 每步都提交 Git

```bash
# 每完成一步就提交
git add .
git commit -m "..."

# 如果出问题可以回滚
git reset --hard HEAD^
```

### 2. 每步都测试

不要等全部完成才测试，每步都要：
- 启动开发服务器
- 测试相关功能
- 检查控制台错误

### 3. 保留备份

```bash
# 开始前创建备份分支
git checkout -b refactor/lib-structure
git checkout -b backup/before-refactor
git checkout refactor/lib-structure
```

---

## 执行清单

### 准备阶段
- [ ] 创建新分支 `refactor/lib-structure`
- [ ] 创建备份分支 `backup/before-refactor`
- [ ] 确认当前代码可以正常运行

### 步骤 1：CRUD 文件
- [ ] 创建 `lib/crud/` 目录
- [ ] 移动 4 个 CRUD 文件
- [ ] 更新 2 个组件的导入路径
- [ ] 测试 CRUD 页面功能
- [ ] 提交 Git

### 步骤 2：认证文件
- [ ] 创建 `lib/auth/` 目录
- [ ] 移动 5 个认证文件
- [ ] 更新约 24 个文件的导入路径
- [ ] 更新 lib 内部交叉引用
- [ ] 测试登录、注册、权限功能
- [ ] 提交 Git

### 步骤 3：日志文件
- [ ] 创建 `lib/logging/` 目录
- [ ] 移动 2 个日志文件
- [ ] 更新约 7 个文件的导入路径
- [ ] 测试日志记录功能
- [ ] 提交 Git

### 步骤 4：数据库文件
- [ ] 创建 `lib/database/` 目录
- [ ] 移动 2 个数据库文件
- [ ] 更新约 6 个文件的导入路径
- [ ] 更新 db-api.js 内部引用
- [ ] 测试数据库操作
- [ ] 提交 Git

### 步骤 5：业务文件
- [ ] 创建 `lib/business/` 目录
- [ ] 移动 4 个业务文件
- [ ] 更新约 8 个文件的导入路径
- [ ] 更新文件间交叉引用
- [ ] 测试业务功能
- [ ] 提交 Git

### 步骤 6：文档
- [ ] 创建各目录 README
- [ ] 编写文档内容
- [ ] 提交 Git

### 完成阶段
- [ ] 运行完整测试
- [ ] 运行 linter
- [ ] 检查是否有遗漏
- [ ] 合并到主分支

---

## 下一步

你想：
1. **立即开始步骤 1** - 移动 CRUD 文件（最简单，练手）
2. **先看详细的替换命令** - 我可以为每个文件写出具体的替换命令
3. **调整计划** - 如果有任何疑问或修改

告诉我，我们开始哪一步！🚀

