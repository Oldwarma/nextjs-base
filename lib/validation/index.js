/**
 * 验证模块入口
 * 
 * 提供自动 Schema 转换功能，将简单的 validation 配置自动转换为 Zod Schema
 */

export {
	validationToZod,
	getOrCreateSchema,
	validateWithConfig,
	runCustomValidators,
} from './auto-schema.js';

// 导出 zod 供高级用户直接使用
export { z } from 'zod';
