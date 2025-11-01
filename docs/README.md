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

2. **[BaseDAO 文档](./admin/BASE_DAO.md)**
   - BaseDAO 完整 API
   - 配置项详解
   - 验证规则
   - 生命周期钩子

3. **[CRUD 开发指南](./admin/CRUD_GUIDE.md)**
   - 页面模板使用
   - 配置项详解
   - 常见配置示例
   - 完整示例代码

4. **[权限验证](./admin/AUTH.md)**
   - 管理员权限检查
   - Layout 保护
   - Action 保护
   - 最佳实践

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
2. 学习 [CRUD 开发指南](./admin/CRUD_GUIDE.md)
3. 参考 [BaseDAO 文档](./admin/BASE_DAO.md)

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

详细步骤参考：[CRUD 开发指南](./admin/CRUD_GUIDE.md)

---

## 📁 目录结构

```
docs/
├── README.md                      # 本文档
│
├── client/                        # 客户端文档
│   ├── AUTH.md                    # 认证系统
│   ├── SERVER_ACTIONS.md          # Server Actions
│   ├── I18N_GUIDE.md              # 国际化
│   └── PERMISSIONS.md             # 权限系统
│
└── admin/                         # 后台管理文档
    ├── README.md                  # 后台管理总览
    ├── BASE_DAO.md                # BaseDAO 完整文档
    ├── CRUD_GUIDE.md              # CRUD 开发指南
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
2. [Server Actions 文档](./client/SERVER_ACTIONS.md)
3. [CRUD 开发指南](./admin/CRUD_GUIDE.md)

### 深入学习

1. [BaseDAO 完整文档](./admin/BASE_DAO.md)
2. [认证系统](./client/AUTH.md)
3. [权限系统](./client/PERMISSIONS.md)

### 高级主题

1. [管理员权限验证](./admin/AUTH.md)
2. [国际化指南](./client/I18N_GUIDE.md)

---

## 🔄 文档更新

文档会随着项目开发持续更新。

**最后更新**：2025-11-01

**版本**：v1.2.0

---

## 📮 反馈

如果文档有任何不清楚的地方，欢迎提出建议！

---

## 🎉 开始开发

准备好了吗？选择你的方向：

- 👉 [客户端开发](./client/SERVER_ACTIONS.md)
- 👉 [后台管理开发](./admin/README.md)

祝你开发愉快！✨

