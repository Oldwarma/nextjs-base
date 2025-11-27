/**
 * 字段生成器
 *
 * 基于统一的字段配置自动生成:
 * - 表格列配置 (ProTable columns)
 * - 表单字段 (Form fields)
 * - 搜索配置 (Search config)
 * - 详情配置 (Detail config)
 */

import React from 'react';
import { FIELD_TYPE_REGISTRY } from './field-types';

/**
 * 展平分组字段配置
 * 
 * 将嵌套在 group 类型中的 columns 字段展平到顶层
 * 
 * @param {Array} fieldsConfig - 字段配置（可能包含 group 分组）
 * @returns {Array} 展平后的字段配置
 */
export function flattenFieldsConfig(fieldsConfig) {
	const result = [];
	
	for (const field of fieldsConfig) {
		if (field.type === 'group' && Array.isArray(field.columns)) {
			// 递归展平分组内的字段
			result.push(...flattenFieldsConfig(field.columns));
		} else {
			result.push(field);
		}
	}
	
	return result;
}

/**
 * 生成 ProTable 的 columns 配置
 *
 * @param {Array} fieldsConfig - 统一的字段配置（支持嵌套分组）
 * @param {Object} options - 配置选项
 * @param {Boolean} options.searchExpanded - 搜索表单是否展开
 * @returns {Array} ProTable columns
 */
export function generateTableColumns(fieldsConfig, options = {}) {
	const { searchExpanded = false } = options;
	
	// 先展平分组字段
	const flatFields = flattenFieldsConfig(fieldsConfig);

	return flatFields
		.filter((field) => {
			// 排除不在表格中显示的字段
			if (field.table === false) return false;
			if (field.hideInTable) return false;
			return true;
		})
		.map((field) => {
			const typeConfig = FIELD_TYPE_REGISTRY[field.type];

			// 基础列配置
			const column = {
				title: field.title,
				dataIndex: field.key,
				key: field.key,
			};

			// 应用 table 配置
			if (field.table) {
				Object.assign(column, {
					width: field.table.width,
					fixed: field.table.fixed,
					ellipsis: field.table.ellipsis,
					copyable: field.table.copyable,
					sorter: field.table.sorter,
					align: field.table.align,
					...field.table.props,
				});
			}

			// ✅ 自定义渲染函数（优先级：render > formatter > typeConfig.table）
			if (field.table?.render) {
				// 优先使用自定义 JSX render 函数
				column.render = field.table.render;
			} else if (field.table?.formatter) {
				// ✅ 支持纯 JS formatter 函数（vk-unicloud 风格）
				column.render = (value, record, index) => {
					const result = field.table.formatter(value, record, index);
					// formatter 可以返回字符串、数字或 React 元素
					return result;
				};
			} else if (typeConfig?.table) {
				// 使用类型对应的渲染函数
				column.render = (value, record) => typeConfig.table(value, field);
			}

			// 搜索配置
			if (field.search === false) {
				column.search = false;
			} else if (field.search) {
				// 检查是否需要延迟加载（仅在展开时显示）
				const lazyLoad = field.search?.lazyLoad === true;

				// 如果设置了 lazyLoad 且搜索表单未展开，则隐藏该搜索字段
				if (lazyLoad && !searchExpanded) {
					column.search = false;
					column.hideInSearch = true;
				} else {
					column.search = true;
					column.hideInSearch = false;

					// 处理搜索组件的渲染
					if (typeConfig?.search) {
						// ProTable 会自动添加 label（来自 column.title）
						// 所以 renderFormItem 返回的组件不应该有 label
						column.renderFormItem = () => {
							const searchComponent = typeConfig.search(field);
							// 移除组件自带的 label，避免重复显示
							if (searchComponent && searchComponent.props) {
								// 清理废弃属性和 label
								const { label, onDropdownVisibleChange, ...cleanProps } = searchComponent.props;
								return React.cloneElement(searchComponent, {
									...cleanProps,
									label: undefined, // 移除 label
									// 如果存在 onDropdownVisibleChange，转换为 onOpenChange
									...(onDropdownVisibleChange && !cleanProps.onOpenChange ? { onOpenChange: onDropdownVisibleChange } : {}),
								});
							}
							return searchComponent;
						};
					}
				}
			}

			return column;
		});
}

/**
 * 生成表单字段
 *
 * @param {Array} fieldsConfig - 统一的字段配置
 * @param {Object} options - 选项
 * @param {Boolean} options.isCreate - 是否是创建表单 (会排除不可创建的字段)
 * @returns {Array} React 组件数组（每个组件都有 key 和 _fieldKey）
 */
export function generateFormFields(fieldsConfig, options = {}) {
	const { isCreate = false } = options;

	return fieldsConfig
		.filter((field) => {
			// 排除不在表单中显示的字段
			if (field.form === false) return false;
			if (field.hideInForm) return false;

			// 创建表单排除不可创建的字段
			if (isCreate && field.createOnly === false) return false;

			// 编辑表单排除不可编辑的字段
			if (!isCreate && field.editOnly === false) return false;

			return true;
		})
		.map((field, index) => {
			const typeConfig = FIELD_TYPE_REGISTRY[field.type];

			// 自定义表单组件
			if (field.form?.render) {
				return {
					component: field.form.render(field),
					key: field.key || `form-field-${index}`,
				};
			}

			// 使用类型对应的表单组件
			if (typeConfig?.form) {
				return {
					component: typeConfig.form(field),
					key: field.key || `form-field-${index}`,
				};
			}

			// 如果没有对应的表单组件,返回 null
			return null;
		})
		.filter(Boolean); // 过滤掉 null
}

/**
 * 生成详情字段配置
 *
 * @param {Array} fieldsConfig - 统一的字段配置（支持嵌套分组）
 * @returns {Array} ProDescriptions columns
 */
export function generateDetailColumns(fieldsConfig) {
	// 先展平分组字段
	const flatFields = flattenFieldsConfig(fieldsConfig);
	
	return flatFields
		.filter((field) => {
			// 排除不在详情中显示的字段
			if (field.detail === false) return false;
			if (field.hideInDetail) return false;

			// 排除操作列
			if (field.valueType === 'option') return false;
			
			// 排除 group 类型（分组只用于表单布局，不在详情中显示）
			if (field.type === 'group') return false;
			
			// 排除没有 detail 和 table 渲染器的类型
			const typeConfig = FIELD_TYPE_REGISTRY[field.type];
			if (typeConfig?.detail === null && typeConfig?.table === null) return false;

			return true;
		})
		.map((field) => {
			const typeConfig = FIELD_TYPE_REGISTRY[field.type];

			const column = {
				title: field.title,
				dataIndex: field.key,
				key: field.key,
			};

			// 自定义渲染函数
			if (field.detail?.render) {
				column.render = field.detail.render;
			} else if (typeConfig?.detail) {
				// 使用类型的详情渲染函数
				column.render = (value, record) => typeConfig.detail(value, field);
			} else if (typeConfig?.table) {
				// 回退到表格渲染函数
				column.render = (value, record) => typeConfig.table(value, field);
			}

			return column;
		});
}

/**
 * 生成搜索配置
 *
 * @param {Array} fieldsConfig - 统一的字段配置
 * @param {Object} options - 配置选项
 * @param {Boolean} options.searchExpanded - 搜索表单是否展开
 * @returns {Object} 搜索配置对象 (不包含 transform，该函数单独导出)
 */
export function generateSearchConfig(fieldsConfig, options = {}) {
	const { searchExpanded = false } = options;

	// 只返回 ProTable search 配置，不包含 transform
	return {
		labelWidth: 'auto',
		defaultCollapsed: true,
		// 当搜索表单展开状态变化时,会触发重新渲染
		collapsed: !searchExpanded,
	};
}

/**
 * 生成搜索参数转换函数
 *
 * @param {Array} fieldsConfig - 统一的字段配置
 * @returns {Function} 转换函数
 */
export function generateSearchTransform(fieldsConfig) {
	// 获取所有可搜索的字段
	const searchableFields = fieldsConfig.filter((field) => {
		return field.search !== false && field.search;
	});

	// 返回转换函数
	return (searchParams) => {
		const conditions = {};

		searchableFields.forEach((field) => {
			const value = searchParams[field.key];
			if (value === undefined || value === null || value === '') return;

			// 获取搜索模式
			const mode = field.search?.mode || 'exact';

			// 根据模式转换查询条件
			switch (mode) {
				case 'like':
				case '%%':
					// 模糊搜索 - 转换为 MongoDB $regex 格式
					conditions[field.key] = { $regex: value, $options: 'i' };
					break;

				case 'exact':
				case '==':
					// 精确搜索
					conditions[field.key] = value;
					break;

				case 'range':
				case '[]':
					// 范围搜索 (用于日期范围等)
					if (Array.isArray(value) && value.length === 2) {
						conditions[`${field.key}_start`] = value[0];
						conditions[`${field.key}_end`] = value[1];
					}
					break;

				case 'gt':
				case '>':
					// 大于
					conditions[`${field.key}_gt`] = value;
					break;

				case 'gte':
				case '>=':
					// 大于等于
					conditions[`${field.key}_gte`] = value;
					break;

				case 'lt':
				case '<':
					// 小于
					conditions[`${field.key}_lt`] = value;
					break;

				case 'lte':
				case '<=':
					// 小于等于
					conditions[`${field.key}_lte`] = value;
					break;

				case 'in':
					// 包含查询
					// 用于查询数组字段是否包含某些值 (MongoDB $in 操作符)
					if (Array.isArray(value) && value.length > 0) {
						// 生成 $in 查询标记，由 DAO 层转换为 MongoDB $in 操作符
						conditions[`${field.key}_in`] = value;
					} else if (value) {
						// 如果是单个值，也转换为 $in 查询
						conditions[`${field.key}_in`] = [value];
					}
					break;

				default:
					// 默认精确搜索
					conditions[field.key] = value;
			}
		});

		return conditions;
	};
}

/**
 * 生成排序配置
 *
 * @param {Array} fieldsConfig - 统一的字段配置
 * @returns {Array} 排序规则
 */
export function generateSortRules(fieldsConfig) {
	const sortRules = [];

	fieldsConfig.forEach((field) => {
		if (field.table?.defaultSort) {
			sortRules.push({
				name: field.key,
				type: field.table.defaultSort, // 'asc' or 'desc'
			});
		}
	});

	return sortRules;
}

/**
 * 从字段配置中提取可创建/可更新的字段列表
 *
 * @param {Array} fieldsConfig - 统一的字段配置
 * @returns {Object} { creatable, updatable }
 */
export function extractFieldPermissions(fieldsConfig) {
	const creatable = [];
	const updatable = [];

	fieldsConfig.forEach((field) => {
		// 可创建字段
		if (field.form !== false && field.createOnly !== false) {
			creatable.push(field.key);
		}

		// 可更新字段
		if (field.form !== false && field.editOnly !== false) {
			updatable.push(field.key);
		}
	});

	return { creatable, updatable };
}

/**
 * 验证字段配置的完整性
 *
 * @param {Array} fieldsConfig - 字段配置
 * @throws {Error} 如果配置不完整
 */
export function validateFieldsConfig(fieldsConfig) {
	if (!Array.isArray(fieldsConfig)) {
		throw new Error('fieldsConfig must be an array');
	}

	fieldsConfig.forEach((field, index) => {
		// 必需字段
		if (!field.key) {
			throw new Error(`Field at index ${index} is missing 'key' property`);
		}
		if (!field.title) {
			throw new Error(`Field '${field.key}' is missing 'title' property`);
		}
		if (!field.type) {
			throw new Error(`Field '${field.key}' is missing 'type' property`);
		}

		// 检查类型是否注册
		// if (!FIELD_TYPE_REGISTRY[field.type]) {
		// 	console.warn(`Field '${field.key}' uses unregistered type '${field.type}'`);
		// }
	});
}

/**
 * 合并字段配置
 * 用于继承和覆盖配置
 *
 * @param {Array} baseConfig - 基础配置
 * @param {Array} overrideConfig - 覆盖配置
 * @returns {Array} 合并后的配置
 */
export function mergeFieldsConfig(baseConfig, overrideConfig) {
	const merged = [...baseConfig];

	overrideConfig.forEach((overrideField) => {
		const index = merged.findIndex((f) => f.key === overrideField.key);

		if (index >= 0) {
			// 深度合并
			merged[index] = {
				...merged[index],
				...overrideField,
				table: { ...merged[index].table, ...overrideField.table },
				form: { ...merged[index].form, ...overrideField.form },
				search: { ...merged[index].search, ...overrideField.search },
				detail: { ...merged[index].detail, ...overrideField.detail },
			};
		} else {
			// 新增字段
			merged.push(overrideField);
		}
	});

	return merged;
}
