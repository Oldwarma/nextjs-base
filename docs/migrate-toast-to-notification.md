# 将 Toast 迁移到 Ant Design Notification

## 🎯 迁移目的

将后台管理系统的消息提示从第三方 `sonner` toast 库迁移到 [Ant Design Notification](https://ant.design/components/notification-cn)，以获得更好的一致性和功能。

## ✅ 迁移优势

### 1. 设计一致性
- ✅ 完全符合 Ant Design 设计规范
- ✅ 与其他 Ant Design 组件风格统一
- ✅ 支持主题定制（Design Token）

### 2. 功能更强大
- ✅ 支持 `message` 和 `description` 分离显示
- ✅ 支持自定义按钮组（actions）
- ✅ 支持自定义图标
- ✅ 支持 8 个位置配置（top, topLeft, topRight, bottom, bottomLeft, bottomRight）
- ✅ 支持显示进度条（showProgress）
- ✅ 支持堆叠模式（stack）
- ✅ 支持悬停暂停计时器（pauseOnHover）

### 3. 更好的集成
- ✅ 通过 hooks 方式 (`useNotification`) 可以获取 context
- ✅ 支持 ConfigProvider 全局配置
- ✅ 支持国际化（i18n）
- ✅ 支持 RTL 模式

## 📝 迁移步骤

### 1. 更新导入

**之前 (sonner)**:
```javascript
import { toast } from 'sonner';
```

**现在 (Ant Design)**:
```javascript
import { notification } from 'antd';
```

### 2. 使用 Hooks

在组件内部使用 `notification.useNotification()`:

```javascript
export default function SmartCrudPage({ ... }) {
  // 使用 Ant Design notification hooks
  const [api, contextHolder] = notification.useNotification();
  
  // ... 其他代码
  
  return (
    <>
      {contextHolder}
      {/* 其他组件 */}
    </>
  );
}
```

### 3. 替换所有 Toast 调用

#### 成功消息

**之前**:
```javascript
toast.success('Created successfully');
toast.success(result.message || 'Created successfully');
```

**现在**:
```javascript
api.success({
  message: 'Success',
  description: result.message || 'Created successfully',
  placement: 'topRight',
});
```

#### 错误消息

**之前**:
```javascript
toast.error('Failed to create');
toast.error(result.error || 'Failed to create');
```

**现在**:
```javascript
api.error({
  message: 'Failed to Create',
  description: result.error || 'Failed to create',
  placement: 'topRight',
});
```

#### 警告消息

**之前**:
```javascript
toast.warning('Please select items first');
```

**现在**:
```javascript
api.warning({
  message: 'No Selection',
  description: 'Please select items first',
  placement: 'topRight',
});
```

#### 信息消息

**之前**:
```javascript
toast.info('Processing...');
```

**现在**:
```javascript
api.info({
  message: 'Processing',
  description: 'Please wait...',
  placement: 'topRight',
});
```

## 🔄 完整的替换对照表

| Sonner Toast | Ant Design Notification | 说明 |
|--------------|------------------------|------|
| `toast.success(msg)` | `api.success({ message, description })` | 成功提示 |
| `toast.error(msg)` | `api.error({ message, description })` | 错误提示 |
| `toast.warning(msg)` | `api.warning({ message, description })` | 警告提示 |
| `toast.info(msg)` | `api.info({ message, description })` | 信息提示 |
| `toast(msg)` | `api.open({ message, description })` | 通用提示 |

## 📊 API 对比

### Sonner Toast API

```javascript
toast('Simple message');
toast.success('Success!');
toast.error('Error!');
toast.warning('Warning!');
toast.info('Info!');

// 配置选项
toast.success('Success!', {
  duration: 3000,
  position: 'top-right',
});
```

### Ant Design Notification API

```javascript
// 基础用法
api.success({
  message: 'Success',
  description: 'Operation completed successfully',
});

// 完整配置
api.success({
  message: 'Success',               // 标题（必需）
  description: 'Description text',  // 描述内容
  placement: 'topRight',            // 位置
  duration: 4.5,                    // 持续时间（秒）
  showProgress: true,               // 显示进度条
  pauseOnHover: true,               // 悬停暂停
  icon: <CheckCircleOutlined />,    // 自定义图标
  actions: [                        // 自定义按钮
    <Button>Action 1</Button>,
    <Button>Action 2</Button>,
  ],
  onClose: () => {},                // 关闭回调
  onClick: () => {},                // 点击回调
});
```

## 🎨 样式对比

### Sonner Toast
- 简洁现代的设计
- 固定在右上角
- 较小的尺寸
- 自动堆叠

### Ant Design Notification
- 更丰富的信息层次（message + description）
- 可配置 8 个位置
- 较大的尺寸，适合更多信息
- 可配置堆叠阈值
- 支持自定义按钮和图标

## 📦 迁移的文件

### `/components/admin/smart-crud-page.jsx`

**修改内容**:
1. ✅ 移除 `import { toast } from 'sonner'`
2. ✅ 添加 `import { notification } from 'antd'`
3. ✅ 添加 `const [api, contextHolder] = notification.useNotification()`
4. ✅ 添加 `{contextHolder}` 到 JSX
5. ✅ 替换所有 toast 调用（共 14 处）：
   - 配置验证错误（1 处）
   - 数据获取错误（2 处）
   - 详情获取错误（2 处）
   - 删除操作（3 处）
   - 更新操作（3 处）
   - 创建操作（3 处）
   - 批量操作（4 处）

## 🔍 消息结构改进

### 之前：单一消息

```javascript
toast.error('Failed to create user');
```

用户看到：
```
❌ Failed to create user
```

### 现在：结构化消息

```javascript
api.error({
  message: 'Failed to Create',
  description: 'User with this email already exists',
  placement: 'topRight',
});
```

用户看到：
```
❌ Failed to Create
   User with this email already exists
```

**优势**:
- ✅ 标题简洁明确（Failed to Create）
- ✅ 描述提供详细信息（具体原因）
- ✅ 信息层次清晰，易于理解

## 🎯 位置配置

Ant Design Notification 支持 8 个位置：

```javascript
// 顶部
placement: 'top'          // 顶部居中
placement: 'topLeft'      // 顶部左侧
placement: 'topRight'     // 顶部右侧（默认）

// 底部
placement: 'bottom'       // 底部居中
placement: 'bottomLeft'   // 底部左侧
placement: 'bottomRight'  // 底部右侧
```

**当前配置**: 统一使用 `topRight`（右上角）

## ⚙️ 全局配置

可以在应用启动时配置全局默认值：

```javascript
notification.config({
  placement: 'topRight',
  duration: 4.5,
  showProgress: true,
  pauseOnHover: true,
  maxCount: 3,
});
```

**当前配置**: 使用默认配置，每次调用时指定 `placement: 'topRight'`

## 🚀 高级功能

### 1. 显示进度条

```javascript
api.success({
  message: 'Success',
  description: 'Operation completed',
  showProgress: true,         // ✅ 显示进度条
  pauseOnHover: true,         // ✅ 悬停暂停
});
```

### 2. 自定义按钮

```javascript
api.info({
  message: 'Confirm Action',
  description: 'Are you sure you want to proceed?',
  actions: [
    <Button type="primary" onClick={handleConfirm}>
      Confirm
    </Button>,
    <Button onClick={handleCancel}>
      Cancel
    </Button>,
  ],
});
```

### 3. 更新通知内容

```javascript
const key = 'updatable';

api.open({
  key,
  message: 'Uploading...',
  description: '0%',
});

// 更新进度
api.open({
  key,
  message: 'Uploading...',
  description: '50%',
});

// 完成
api.success({
  key,
  message: 'Upload Complete',
  description: 'File uploaded successfully',
});
```

### 4. 堆叠模式

```javascript
// 超过 3 个通知会自动堆叠
api.config({
  stack: { threshold: 3 },
});
```

## 📖 参考文档

- [Ant Design Notification 官方文档](https://ant.design/components/notification-cn)
- [ProComponents 消息提示最佳实践](https://procomponents.ant.design/components/notification)

## 🎉 迁移结果

### 迁移前
- ❌ 使用第三方 toast 库（sonner）
- ❌ 样式与 Ant Design 不一致
- ❌ 功能有限（只有简单文本）
- ❌ 无法自定义位置和样式

### 迁移后
- ✅ 使用 Ant Design 原生组件
- ✅ 样式完全统一
- ✅ 功能丰富（message + description + actions）
- ✅ 可配置位置、持续时间、进度条等
- ✅ 更好的用户体验

### 代码质量提升
- ✅ 移除外部依赖（sonner）
- ✅ 代码更加标准化
- ✅ 更好的类型支持（TypeScript）
- ✅ 更好的可维护性

---

**迁移日期**: 2025-11-03  
**影响范围**: 后台管理系统所有页面  
**破坏性变更**: ❌ 无（用户无感知）  
**状态**: ✅ 已完成并测试

