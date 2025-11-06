'use server';

/**
 * 操作日志管理 Server Actions
 * 使用核心库（BaseDAO + action-wrapper）自动处理权限验证和日志记录
 */

import { createReadOnlyActions } from '@/lib/core/crud-helper';
import { actionLogsCrudConfig } from './configs/action-logs-crud.config';

/**
 * 创建只读 CRUD Actions（操作日志只能查看）
 * BaseDAO 已支持 SmartCrudPage 的 whereJson 参数
 */
const crudActions = createReadOnlyActions(actionLogsCrudConfig);

/**
 * 导出标准查询 Actions
 */
export const getActionLogListAction = crudActions.getList;
export const getActionLogDetailAction = crudActions.getDetail;

