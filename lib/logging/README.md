# 日志系统

管理员操作日志和用户使用记录的统一日志工具库。

## 📁 文件列表

| 文件 | 说明 |
|------|------|
| `action-logger.js` | 管理员操作日志 - 记录所有后台操作（增删改查） |
| `usage-logs.js` | 使用记录日志 - 记录用户功能使用（图片生成等） |

## 🎯 使用方式

### 管理员操作日志

```javascript
import { logAction } from '@/lib/logging/action-logger';

// 自动记录成功/失败
try {
    const result = await someOperation();
    await logAction({
        userId,
        action: 'create',
        resourceType: 'user',
        resourceId: result.id,
        details: { email: result.email },
        success: true,
    });
    return result;
} catch (error) {
    await logAction({
        userId,
        action: 'create',
        resourceType: 'user',
        details: { error: error.message },
        success: false,
    });
    throw error;
}
```

### 用户使用记录

```javascript
import { 
    createUsageLog, 
    updateUsageLog, 
    checkUserCanUseFeature 
} from '@/lib/logging/usage-logs';

// 创建使用记录
const log = await createUsageLog({
    userId,
    featureId: 'text-to-image',
    creditsUsed: 10,
    parameters: { prompt, model },
});

// 更新记录状态
await updateUsageLog(log._id, {
    status: 'completed',
    result: { imageUrl },
    completedAt: new Date(),
});

// 检查功能可用性
const { canUse, reason } = await checkUserCanUseFeature(userId, 'text-to-image');
```

## 📖 相关文档

- [Action Logger 文档](../../docs/admin/ACTION_LOGGER.md)
- [BaseDAO 日志集成](../../docs/admin/BASE_DAO.md)

## 🔗 依赖关系

- MongoDB (通过相对路径导入)
- 日志存储在 `action_logs` 和 `usage_logs` 集合

