# 基础功能测试清单

在实际页面中使用之前，请确保以下基本功能正常。

## TreeSelectorModal 测试

### 基础功能
- [ ] Modal 可以正常打开和关闭
- [ ] 树形数据正常显示
- [ ] 单选模式工作正常
- [ ] 多选模式工作正常
- [ ] 搜索功能正常
- [ ] 展开/收起功能正常
- [ ] 选中状态正确显示
- [ ] 点击确定调用 onSave
- [ ] 点击取消调用 onCancel
- [ ] 保存后 Modal 自动关闭

### 高级功能
- [ ] 额外选项（extraOptions）正常显示
- [ ] Checkbox 状态正确传递
- [ ] 禁用节点不可选中
- [ ] 空数据显示提示信息
- [ ] 加载状态正常显示
- [ ] 默认展开所有节点功能正常

### 边界情况
- [ ] 空 treeData 不报错
- [ ] checkedKeys 为空不报错
- [ ] 快速打开关闭不报错
- [ ] 保存失败 Modal 不关闭

---

## ResetPasswordModal 测试

### 基础功能
- [ ] Modal 可以正常打开和关闭
- [ ] 用户信息正确显示
- [ ] 密码输入正常
- [ ] 确认密码输入正常
- [ ] 密码强度验证正常
- [ ] 两次密码不一致提示
- [ ] 点击确定调用 onSave
- [ ] 保存成功 Modal 关闭
- [ ] 表单重置正常

### 高级功能
- [ ] 密码生成器正常工作
- [ ] 生成的密码符合规则
- [ ] 安全提示正常显示
- [ ] 最小长度验证正常
- [ ] 密码显示/隐藏切换正常

### 边界情况
- [ ] user 为 null 不报错
- [ ] 保存失败 Modal 不关闭
- [ ] 取消时表单正确重置

---

## CreateUserModal 测试

### 基础功能
- [ ] Modal 可以正常打开和关闭
- [ ] 所有表单字段正常显示
- [ ] 邮箱验证正常
- [ ] 密码验证正常
- [ ] 用户名验证正常
- [ ] 角色选择正常
- [ ] Switch 开关正常
- [ ] 积分输入正常
- [ ] 点击确定调用 onSave
- [ ] 保存成功 Modal 关闭

### 高级功能
- [ ] defaultValues 正确应用
- [ ] showCredits 控制正常
- [ ] showBackendAccess 控制正常
- [ ] 提示信息正常显示
- [ ] 表单验证信息清晰

### 边界情况
- [ ] 邮箱格式错误提示
- [ ] 密码太短提示
- [ ] 密码强度不足提示
- [ ] 保存失败 Modal 不关闭
- [ ] 取消时表单正确重置

---

## 集成测试

### 在 SmartCrudPage 中使用
- [ ] customRowActions 正确触发 Modal
- [ ] Modal 操作后列表正确刷新
- [ ] refreshTrigger 机制正常
- [ ] 多个 Modal 不互相干扰
- [ ] 快速切换不同 Modal 不报错

### 错误处理
- [ ] onSave 抛出错误时 Modal 不关闭
- [ ] 错误消息正确显示
- [ ] 网络错误正确处理
- [ ] 验证错误正确显示

### 性能测试
- [ ] 大量数据（1000+ 节点）加载正常
- [ ] 搜索性能可接受
- [ ] Modal 打开关闭流畅
- [ ] 无内存泄漏

---

## 快速测试脚本

可以创建一个临时测试页面快速验证功能：

```jsx
// app/(admin)/admin/test-modals/page.js
'use client';

import { useState } from 'react';
import { Button, Space, message } from 'antd';
import {
  TreeSelectorModal,
  ResetPasswordModal,
  CreateUserModal
} from '@/components/admin/modals';

export default function TestModalsPage() {
  const [treeModalVisible, setTreeModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // 测试数据
  const testTreeData = [
    {
      title: 'Parent 1',
      value: 'p1',
      key: 'p1',
      children: [
        { title: 'Child 1-1', value: 'c1-1', key: 'c1-1' },
        { title: 'Child 1-2', value: 'c1-2', key: 'c1-2', disabled: true },
      ]
    },
    {
      title: 'Parent 2',
      value: 'p2',
      key: 'p2',
      children: [
        { title: 'Child 2-1', value: 'c2-1', key: 'c2-1' },
      ]
    }
  ];

  const testUser = {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com'
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Modal Components Test Page</h1>
      
      <Space direction="vertical" size="large">
        <Button onClick={() => setTreeModalVisible(true)}>
          Test TreeSelectorModal
        </Button>
        
        <Button onClick={() => setPasswordModalVisible(true)}>
          Test ResetPasswordModal
        </Button>
        
        <Button onClick={() => setCreateModalVisible(true)}>
          Test CreateUserModal
        </Button>
      </Space>

      {/* TreeSelectorModal */}
      <TreeSelectorModal
        visible={treeModalVisible}
        title="Test Tree Selector"
        treeData={testTreeData}
        checkedKeys={['c1-1']}
        onSave={async (keys) => {
          console.log('Selected:', keys);
          message.success(`Selected: ${JSON.stringify(keys)}`);
        }}
        onCancel={() => setTreeModalVisible(false)}
        extraOptions={[
          {
            key: 'test',
            label: 'Test Extra Option',
            checked: true
          }
        ]}
      />

      {/* ResetPasswordModal */}
      <ResetPasswordModal
        visible={passwordModalVisible}
        user={testUser}
        onSave={async (userId, password) => {
          console.log('Reset password:', userId, password);
          message.success('Password reset: ' + password);
        }}
        onCancel={() => setPasswordModalVisible(false)}
      />

      {/* CreateUserModal */}
      <CreateUserModal
        visible={createModalVisible}
        onSave={async (userData) => {
          console.log('Create user:', userData);
          message.success('User created: ' + JSON.stringify(userData));
        }}
        onCancel={() => setCreateModalVisible(false)}
      />
    </div>
  );
}
```

---

## 自动化测试（未来）

```bash
# 单元测试
npm run test components/admin/modals

# E2E 测试
npm run test:e2e -- --grep "Modal Components"
```

---

## 测试完成标准

- [ ] 所有基础功能测试通过
- [ ] 所有高级功能测试通过
- [ ] 所有边界情况处理正常
- [ ] 集成测试通过
- [ ] 性能可接受
- [ ] 无 Console 错误
- [ ] 无 Console 警告
- [ ] 代码审查通过

---

**测试日期：** _________

**测试人：** _________

**测试环境：** _________

**测试结果：** ✅ 通过 / ❌ 失败

**备注：**

