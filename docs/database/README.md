# 数据库文档中心

本项目使用 **PostgreSQL** 作为数据库，**Prisma** 作为 ORM。

---

## 📚 文档导航

### 🚀 核心文档

1. **[PostgreSQL + Prisma 配置指南](./POSTGRESQL_SETUP.md)** ⭐ 推荐优先阅读
   - 环境配置
   - 数据库创建
   - Prisma 命令
   - 代码示例

---

## ⚡ 快速开始

### 1. 配置环境变量

在 `.env` 文件中添加：

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/nextjs_base?schema=public"
```

### 2. 初始化数据库

```bash
# 生成 Prisma Client
npx prisma generate

# 推送 Schema 到数据库
npx prisma db push
```

### 3. 在代码中使用

```javascript
import { prisma } from '@/lib/database/prisma';

// 查询
const users = await prisma.user.findMany();

// 创建
const user = await prisma.user.create({
  data: { name: 'John', email: 'john@example.com' },
});

// 更新
await prisma.user.update({
  where: { id: 'user-id' },
  data: { name: 'New Name' },
});

// 删除
await prisma.user.delete({
  where: { id: 'user-id' },
});
```

---

## 📊 技术栈

| 组件 | 技术 | 说明 |
|------|------|------|
| **数据库** | PostgreSQL | 关系型数据库 |
| **ORM** | Prisma | 类型安全的数据库客户端 |
| **认证** | Better Auth | 使用 Prisma Adapter |

---

## 🎯 设计原则

1. **类型安全** - Prisma 提供完整的 TypeScript 类型支持
2. **简洁优先** - 直接使用 Prisma Client，不过度封装
3. **性能优化** - 使用索引和连接池
4. **可维护性** - Schema 即文档，易于理解和修改

---

## 📁 文件结构

```
lib/database/
├── prisma.js          # Prisma Client 实例

prisma/
├── schema.prisma      # 数据库 Schema 定义
```

---

## 🆘 获取帮助

1. 阅读 [PostgreSQL + Prisma 配置指南](./POSTGRESQL_SETUP.md)
2. 查看 [Prisma 官方文档](https://www.prisma.io/docs)
3. 参考现有 DAO 文件的实现

---

**文档版本**: v3.0.0  
**最后更新**: 2025-12-01
