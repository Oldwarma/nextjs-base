# Database API 文档中心

欢迎来到数据库 API 文档中心！这里包含了项目中所有数据库操作相关的文档。

---

## 📚 文档导航

### 🚀 核心文档

1. **[Database API 完整指南](./DB_API_GUIDE.md)** ⭐ 推荐优先阅读
   - 完整的 API 参考
   - 详细的参数说明
   - 返回值格式
   - 使用注意事项
   - 实战示例

2. **[DB API vs BaseDAO 对比](./DB_API_VS_BASEDAO.md)**
   - 功能对比表
   - 使用场景分析
   - 选择决策流程
   - 迁移指南

3. **[ForeignDB 连表查询指南](./FOREIGNDB_JOIN_GUIDE.md)**
   - 连表查询配置
   - 使用场景
   - 最佳实践
   - 常见问题

---

## 🎯 根据需求选择文档

### 我需要完整的 API 文档

→ 阅读 **[Database API 完整指南](./DB_API_GUIDE.md)**

这是最全面的文档，包含所有 API 的详细说明、参数、返回值、示例和最佳实践。

### 我不知道该用 DB API 还是 BaseDAO

→ 阅读 **[DB API vs BaseDAO 对比](./DB_API_VS_BASEDAO.md)**

这里详细对比了两者的特点，帮助你根据具体场景做出正确选择。

### 我需要实现连表查询

→ 阅读 **[ForeignDB 连表查询指南](./FOREIGNDB_JOIN_GUIDE.md)**

详细说明如何配置和使用连表查询功能。

---

## 📊 文档结构

```
docs/database/
├── README.md                    # 本文档（文档索引）
├── DB_API_GUIDE.md              # 完整 API 指南
├── DB_API_VS_BASEDAO.md         # 对比分析
└── FOREIGNDB_JOIN_GUIDE.md      # 连表查询指南
```

---

## ⚡ 核心概念

### 统一接口

所有数据库操作使用一致的参数命名：

```javascript
{
  dbName: 'collection_name',    // 集合名称
  whereJson: { /* 查询条件 */ }, // 查询条件
  dataJson: { /* 数据 */ },      // 数据
  sortJson: { /* 排序 */ },      // 排序规则
  pageIndex: 1,                  // 页码
  pageSize: 20                   // 每页数量
}
```

### 自动处理

- 自动添加和更新时间戳
- 自动处理 ObjectId 转换
- 统一的错误处理
- 统一的返回格式

### 兼容性

- 完全兼容 MongoDB 原生查询语法
- 可以混用 MongoDB 原生方法
- 不影响现有代码

---

## 🎯 设计原则

1. **简洁优先** - API 设计简洁明了，易于理解和使用
2. **一致性** - 所有操作使用统一的参数和返回格式
3. **灵活性** - 完全支持 MongoDB 原生查询语法
4. **可维护性** - 集中管理，便于统一修改和优化
5. **向后兼容** - 保持与现有代码的兼容性

---

## 🆘 获取帮助

### 使用问题

1. 先查看相关文档
2. 查看 [DB API 完整指南](./DB_API_GUIDE.md) 中的详细说明
3. 参考实际使用的页面代码

### 技术问题

1. 检查是否使用了正确的参数格式
2. 查看 [DB API vs BaseDAO 对比](./DB_API_VS_BASEDAO.md) 确认使用场景
3. 参考 [ForeignDB 连表查询指南](./FOREIGNDB_JOIN_GUIDE.md) 处理关联查询

---

## 🎉 开始使用

准备好了吗？从这里开始：

1. 📖 阅读 [Database API 完整指南](./DB_API_GUIDE.md)
2. 💻 在项目中尝试使用 DB API
3. 🎯 根据需要查阅相关文档

祝你开发愉快！✨

---

**文档版本**：v2.0.0  
**最后更新**：2025-11-07
