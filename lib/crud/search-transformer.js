/**
 * 搜索条件转换器
 * 
 * 将 ProTable 排序参数转换为 Prisma orderBy 格式
 */

/**
 * 构建排序条件
 * 
 * 将 ProTable 的排序格式转换为 Prisma 的 orderBy 格式
 * ProTable: { fieldName: 'ascend' | 'descend' }
 * Prisma: { fieldName: 'asc' | 'desc' }
 * 
 * @param {Object} sortParams - ProTable 的排序参数
 * @param {Array} fieldsConfig - 字段配置
 * @returns {Object} Prisma orderBy 条件
 */
export function buildSortCondition(sortParams, fieldsConfig) {
	// 如果有排序参数，转换格式
	if (sortParams && Object.keys(sortParams).length > 0) {
		const orderBy = {};
		Object.keys(sortParams).forEach(key => {
			const value = sortParams[key];
			if (value === 'ascend') {
				orderBy[key] = 'asc';
			} else if (value === 'descend') {
				orderBy[key] = 'desc';
			}
		});
		return orderBy;
	}
	
	// 没有排序参数，使用字段配置中的默认排序
	if (fieldsConfig && Array.isArray(fieldsConfig)) {
		const defaultSort = {};
		fieldsConfig.forEach(field => {
			if (field.table?.defaultSort) {
				defaultSort[field.key] = field.table.defaultSort === 'desc' ? 'desc' : 'asc';
			}
		});
		
		if (Object.keys(defaultSort).length > 0) {
			return defaultSort;
		}
	}
	
	// 兜底：按创建时间降序
	return { createdAt: 'desc' };
}
