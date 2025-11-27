/**
 * SmartForm 组件导出入口
 * 
 * 万能表单组件集合，通过配置驱动自动生成表单
 * 
 * @example
 * ```jsx
 * import { SmartForm, SmartModalForm, SmartDrawerForm } from '@/components/admin/smart-form';
 * 
 * // 基础表单
 * <SmartForm
 *   fieldsConfig={[...]}
 *   onFinish={handleSubmit}
 * />
 * 
 * // 模态框表单
 * <SmartModalForm
 *   title="Create User"
 *   open={visible}
 *   onOpenChange={setVisible}
 *   fieldsConfig={[...]}
 *   onFinish={handleCreate}
 * />
 * 
 * // 抽屉表单
 * <SmartDrawerForm
 *   title="Edit Profile"
 *   open={visible}
 *   onOpenChange={setVisible}
 *   fieldsConfig={[...]}
 *   onFinish={handleUpdate}
 * />
 * ```
 */

// 基础表单组件
export { default as SmartForm } from './smart-form';

// 模态框表单组件
export { default as SmartModalForm } from './smart-modal-form';

// 抽屉表单组件
export { default as SmartDrawerForm } from './smart-drawer-form';

// 默认导出 SmartModalForm（最常用）
export { default } from './smart-modal-form';

