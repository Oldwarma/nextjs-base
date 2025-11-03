# 项目文档中心

欢迎来到 Jimeng SaaS 项目文档中心！

---

## 📚 文档导航

### 🎨 客户端开发 (Client)

前端用户相关的功能和 API：

1. **[认证系统](./client/AUTH.md)** 
   - 用户注册、登录、第三方登录
   - Session 管理
   - 密码重置

2. **[Server Actions](./client/SERVER_ACTIONS.md)** ⭐ 推荐
   - 用户 Actions（个人资料、统计）
   - 积分 Actions（查询、交易记录）
   - 套餐 Actions（购买、查询）
   - 使用记录 Actions
   - 图片生成 Actions

3. **[国际化 (i18n)](./client/I18N_GUIDE.md)**
   - 多语言配置
   - 翻译文件管理
   - 语言切换组件

4. **[权限系统](./client/PERMISSIONS.md)**
   - 角色权限
   - 访问控制
   - 资源保护

---

### 🔧 后台管理 (Admin)

管理员后台相关的功能和开发指南：

1. **[后台管理系统](./admin/README.md)** ⭐ 必读
   - 快速开始
   - 系统架构
   - 目录结构
   - 核心概念

2. **[Smart CRUD 系统](./admin/SMART_CRUD.md)** 🔥 推荐
   - 完整使用指南
   - 26 种字段类型
   - 11 种搜索模式
   - VK 特性支持
   - 最佳实践与示例

3. **[CRUD 开发指南](./admin/CRUD_GUIDE.md)**
   - 页面模板使用
   - 配置项详解
   - 常见配置示例
   - 完整示例代码

4. **[BaseDAO 文档](./admin/BASE_DAO.md)**
   - BaseDAO 完整 API
   - 配置项详解
   - 验证规则
   - 生命周期钩子

5. **[示例页面指南](./admin/EXAMPLE_PAGE_GUIDE.md)**
   - 完整示例演示
   - 所有字段类型
   - 高级功能展示

6. **[菜单管理系统](./admin/MENU_MANAGEMENT.md)**
   - 动态菜单加载
   - 树形结构管理
   - 图标父级联动
   - 最佳实践

7. **[Markdown 编辑器](./admin/MARKDOWN_EDITOR_GUIDE.md)**
   - 编辑器配置
   - 使用方法
   - 自定义选项

8. **[权限验证](./admin/AUTH.md)**
   - 管理员权限检查
   - Layout 保护
   - Action 保护
   - 最佳实践

---

### 💾 数据库 API (Database)

统一的数据库操作接口层：

1. **[Database API 文档中心](./database/README.md)** 🏠 入口
   - 文档导航和索引
   - 学习路径
   - 快速查找指南

2. **[快速参考卡片](./database/QUICK_REFERENCE.md)** ⚡ 推荐优先阅读
   - 常用操作速查
   - 代码模板
   - 常见问题

3. **[Database API 完整指南](./database/DB_API_GUIDE.md)**
   - 完整 API 参考
   - 详细参数说明
   - 最佳实践

4. **[Database API 实战示例](./database/DB_API_EXAMPLES.md)**
   - 用户管理示例
   - 积分系统示例
   - 订单系统示例
   - 数据统计示例

5. **[DB API vs BaseDAO](./database/DB_API_VS_BASEDAO.md)** 📊 必读
   - 功能对比
   - 使用场景
   - 选择指南

6. **[数据库系统总结](./database/DATABASE_SUMMARY.md)**
   - 系统概述
   - 架构设计
   - 性能优化

7. **[重构总结](./database/REFACTORING_SUMMARY.md)**
   - 重构范围
   - 代码对比
   - 效果统计

---

## 🚀 快速开始

### 客户端开发

如果你要开发**前端用户功能**：

1. 阅读 [Server Actions 文档](./client/SERVER_ACTIONS.md)
2. 了解 [认证系统](./client/AUTH.md)
3. 如需多语言，参考 [i18n 指南](./client/I18N_GUIDE.md)

**常见任务**：
- 获取用户信息 → [SERVER_ACTIONS.md - 用户相关](./client/SERVER_ACTIONS.md#1-用户相关-userjs)
- 查询积分 → [SERVER_ACTIONS.md - 积分相关](./client/SERVER_ACTIONS.md#2-积分相关-creditsjs)
- 购买套餐 → [SERVER_ACTIONS.md - 套餐相关](./client/SERVER_ACTIONS.md#3-套餐相关-packagesjs)
- 生成图片 → [SERVER_ACTIONS.md - 图片生成](./client/SERVER_ACTIONS.md#5-图片生成-generatejs)

---

### 后台管理开发

如果你要开发**后台管理功能**：

1. 阅读 [后台管理系统总览](./admin/README.md)
2. 学习 [Smart CRUD 系统](./admin/SMART_CRUD.md) 🔥
3. 参考 [CRUD 开发指南](./admin/CRUD_GUIDE.md)

**创建新的管理页面（5 分钟）**：

```bash
# 1. 创建配置文件
touch app/(admin)/actions/configs/entity-crud.config.js

# 2. 创建 Server Actions
touch app/(admin)/actions/admin-entity.js

# 3. 复制页面模板
cp app/(admin)/admin/_template/page.js app/(admin)/admin/entity/page.js

# 4. 修改配置即可！
```

详细步骤参考：[Smart CRUD 系统](./admin/SMART_CRUD.md)

---

## 📁 目录结构

```
docs/
├── README.md                      # 本文档
│
├── database/                      # 数据库 API 文档
│   ├── README.md                  # 文档中心（入口）
│   ├── QUICK_REFERENCE.md         # 快速参考卡片
│   ├── DB_API_GUIDE.md            # 完整 API 指南
│   ├── DB_API_EXAMPLES.md         # 实战示例
│   ├── DB_API_VS_BASEDAO.md       # 对比分析
│   ├── DATABASE_SUMMARY.md        # 系统总结
│   └── REFACTORING_SUMMARY.md     # 重构总结
│
├── client/                        # 客户端文档
│   ├── AUTH.md                    # 认证系统
│   ├── SERVER_ACTIONS.md          # Server Actions
│   ├── I18N_GUIDE.md              # 国际化
│   └── PERMISSIONS.md             # 权限系统
│
└── admin/                         # 后台管理文档
    ├── README.md                  # 后台管理总览
    ├── SMART_CRUD.md              # Smart CRUD 系统（推荐）
    ├── CRUD_GUIDE.md              # CRUD 开发指南
    ├── BASE_DAO.md                # BaseDAO 完整文档
    ├── EXAMPLE_PAGE_GUIDE.md      # 示例页面指南
    ├── MENU_MANAGEMENT.md         # 菜单管理系统
    ├── MARKDOWN_EDITOR_GUIDE.md   # Markdown 编辑器
    └── AUTH.md                    # 管理员权限验证
```

---

## 🎯 常见问题

### Q1: 如何调用 Server Actions？

**客户端组件**：
```javascript
'use client';
import { getUserProfileAction } from '@/app/(client)/actions/user';

const result = await getUserProfileAction();
```

**服务端组件**：
```javascript
import { getUserProfileAction } from '@/app/(client)/actions/user';

export default async function Page() {
  const result = await getUserProfileAction();
  return <div>{result.data.name}</div>;
}
```

详见：[SERVER_ACTIONS.md](./client/SERVER_ACTIONS.md)

---

### Q2: 如何创建新的 CRUD 页面？

**使用 Smart CRUD（推荐）**：

1. 定义统一的字段配置 `fieldsConfig`
2. 配置 Server Actions
3. 使用 SmartCrudPage 组件

```javascript
const fieldsConfig = [
  {
    key: 'name',
    title: 'Name',
    type: 'text',
    table: { width: 150 },
    form: { required: true },
    search: { enabled: true, mode: 'like' },
  },
  // ... 更多字段
];

return (
  <SmartCrudPage
    fieldsConfig={fieldsConfig}
    actions={actions}
    title='Data Management'
  />
);
```

详见：[Smart CRUD 系统](./admin/SMART_CRUD.md)

**传统方式**：

1. 创建 CRUD 配置：`configs/entity-crud.config.js`
2. 创建 Server Actions：`admin-entity.js`
3. 复制页面模板并修改配置

详见：[CRUD 开发指南](./admin/CRUD_GUIDE.md)

---

### Q3: 如何保护管理员页面？

在 Layout 中使用 `checkAdmin()`：

```javascript
import { checkAdmin } from '@/lib/admin-auth';

export default async function AdminLayout({ children }) {
  await checkAdmin(); // 自动验证权限
  return <div>{children}</div>;
}
```

详见：[管理员权限验证](./admin/AUTH.md)

---

### Q4: 如何添加多语言？

1. 在 `i18n/messages/` 中添加翻译
2. 使用 `useTranslations` hook
3. 配置语言切换器

详见：[i18n 指南](./client/I18N_GUIDE.md)

---

### Q5: Smart CRUD 和传统 CRUD 有什么区别？

| 对比项 | Smart CRUD | 传统 CRUD |
|--------|-----------|-----------|
| **代码量** | ~200 行 | ~500 行 |
| **配置方式** | 统一 fieldsConfig | 分散的 columns/formFields/searchConfig |
| **维护成本** | 低（一处修改） | 高（多处同步） |
| **学习成本** | 低（统一格式） | 中（多个 API） |
| **灵活性** | 高（自定义渲染、钩子） | 中 |
| **字段类型** | 26 种内置 | 需手动配置 |
| **搜索转换** | 自动（11 种模式） | 手动编写 |

**推荐使用 Smart CRUD** 用于标准 CRUD 页面，可减少 60% 代码量。

详见：[Smart CRUD 系统](./admin/SMART_CRUD.md)

---

## 🛠️ 技术栈

### 前端
- **Next.js 15** - React 框架
- **Ant Design Pro Components** - UI 组件库
- **next-intl** - 国际化
- **Sonner** - Toast 通知

### 后端
- **Server Actions** - 服务端逻辑
- **Better Auth** - 认证系统
- **MongoDB** - 数据库
- **BaseDAO** - 数据访问层

---

## 📖 推荐阅读顺序

### 新手入门

1. [后台管理系统总览](./admin/README.md)
2. [Smart CRUD 系统](./admin/SMART_CRUD.md) 🔥
3. [Server Actions 文档](./client/SERVER_ACTIONS.md)

### 深入学习

1. [CRUD 开发指南](./admin/CRUD_GUIDE.md)
2. [BaseDAO 完整文档](./admin/BASE_DAO.md)
3. [认证系统](./client/AUTH.md)
4. [权限系统](./client/PERMISSIONS.md)

### 高级主题

1. [菜单管理系统](./admin/MENU_MANAGEMENT.md)
2. [Database API vs BaseDAO](./database/DB_API_VS_BASEDAO.md)
3. [管理员权限验证](./admin/AUTH.md)
4. [国际化指南](./client/I18N_GUIDE.md)

---

## 🎨 系统亮点

### Smart CRUD 系统

借鉴 vk-unicloud 万能表格/表单设计理念，实现：

- ✅ **统一配置** - 一处定义，处处使用
- ✅ **类型驱动** - 26 种字段类型自动映射组件
- ✅ **自动生成** - 表格/表单/搜索自动生成
- ✅ **搜索转换** - 11 种搜索模式自动转换 MongoDB 查询
- ✅ **高度可扩展** - 自定义渲染、钩子、字段类型

**代码减少 60%，开发效率提升 3-5 倍！**

详见：[Smart CRUD 系统](./admin/SMART_CRUD.md)

---

## 🔄 文档更新

文档会随着项目开发持续更新。

**最后更新**：2025-11-03

**版本**：v2.0.0

---

## 📮 反馈

如果文档有任何不清楚的地方，欢迎提出建议！

---

## 🎉 开始开发

准备好了吗？选择你的方向：

- 👉 [客户端开发](./client/SERVER_ACTIONS.md)
- 👉 [后台管理开发](./admin/README.md)
- 👉 [Smart CRUD 系统](./admin/SMART_CRUD.md) 🔥 推荐

祝你开发愉快！✨
