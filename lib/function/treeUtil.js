/**
 * 树形结构工具函数
 * 参考 vk-unicloud 的 arrayToTree / treeToArray 设计
 * @see https://vkdoc.fsq.pub/client/jsapi.html#arrayToTree
 * 
 * 使用方式：
 * import nb from '@/lib/function';
 * nb.pubfn.tree.arrayToTree(list);
 * nb.pubfn.tree.mapTree(tree, node => ({ title: node.name, value: node.id }));
 */

import deepClone from './deepClone';

const tree = {};

/**
 * 数组转树形结构
 * @param {Array} arr - 扁平数组
 * @param {Object} options - 配置选项
 * @param {string} options.id - 主键字段名，默认 'id'
 * @param {string} options.parentId - 父级字段名，默认 'parentId'
 * @param {string} options.children - 子节点字段名，默认 'children'
 * @param {any} options.rootParentId - 根节点的 parentId 值，默认 null
 * @param {boolean} options.deleteParentId - 是否删除 parentId 字段，默认 false
 * @param {Function} options.filter - 过滤函数，返回 false 的节点会被过滤掉
 * @param {Function} options.transform - 转换函数，可以修改节点数据
 * @param {Array} options.sortBy - 排序字段，如 [{ field: 'sort', order: 'asc' }]
 * @returns {Array} 树形结构数组
 * 
 * @example
 * // 基础用法
 * const menuTree = nb.pubfn.tree.arrayToTree(menuList);
 * 
 * @example
 * // 自定义字段名
 * const tree = nb.pubfn.tree.arrayToTree(list, { 
 *   id: '_id', 
 *   parentId: 'pid', 
 *   children: 'items' 
 * });
 * 
 * @example
 * // 带过滤和排序
 * const tree = nb.pubfn.tree.arrayToTree(menuList, {
 *   filter: (item) => item.enable !== false,
 *   sortBy: [{ field: 'sort', order: 'asc' }, { field: 'name', order: 'asc' }]
 * });
 */
tree.arrayToTree = function(arr, options = {}) {
	if (!Array.isArray(arr) || arr.length === 0) {
		return [];
	}

	const {
		id = 'id',
		parentId = 'parentId',
		children = 'children',
		rootParentId = null,
		deleteParentId = false,
		filter = null,
		transform = null,
		sortBy = null,
	} = options;

	// 过滤数据
	let filteredArr = arr;
	if (typeof filter === 'function') {
		filteredArr = arr.filter(filter);
	}

	// 创建节点映射
	const nodeMap = new Map();
	const result = [];

	// 第一遍：创建所有节点的映射
	filteredArr.forEach((item) => {
		const node = transform ? transform({ ...item }) : { ...item };
		node[children] = [];
		nodeMap.set(node[id], node);
	});

	// 第二遍：构建树形结构
	filteredArr.forEach((item) => {
		const node = nodeMap.get(item[id]);
		const parentIdValue = item[parentId];

		// 判断是否为根节点
		const isRoot = parentIdValue === rootParentId || 
			parentIdValue === undefined || 
			parentIdValue === '' ||
			!nodeMap.has(parentIdValue);

		if (isRoot) {
			result.push(node);
		} else {
			const parent = nodeMap.get(parentIdValue);
			if (parent) {
				parent[children].push(node);
			}
		}

		// 删除 parentId 字段
		if (deleteParentId) {
			delete node[parentId];
		}
	});

	// 递归清理空的 children 数组
	const cleanEmptyChildren = (nodes) => {
		nodes.forEach((node) => {
			if (node[children] && node[children].length === 0) {
				delete node[children];
			} else if (node[children]) {
				cleanEmptyChildren(node[children]);
			}
		});
	};
	cleanEmptyChildren(result);

	// 排序
	if (sortBy && Array.isArray(sortBy) && sortBy.length > 0) {
		const sortTree = (nodes) => {
			nodes.sort((a, b) => {
				for (const { field, order = 'asc' } of sortBy) {
					const aVal = a[field] ?? 0;
					const bVal = b[field] ?? 0;
					if (aVal !== bVal) {
						return order === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
					}
				}
				return 0;
			});
			nodes.forEach((node) => {
				if (node[children] && node[children].length > 0) {
					sortTree(node[children]);
				}
			});
		};
		sortTree(result);
	}

	return result;
};

/**
 * 树形结构转扁平数组
 * @param {Array} treeData - 树形结构数组
 * @param {Object} options - 配置选项
 * @param {string} options.children - 子节点字段名，默认 'children'
 * @param {boolean} options.deleteChildren - 是否删除 children 字段，默认 true
 * @param {boolean} options.addLevel - 是否添加层级字段，默认 false
 * @param {string} options.levelField - 层级字段名，默认 'level'
 * @param {boolean} options.addPath - 是否添加路径字段，默认 false
 * @param {string} options.pathField - 路径字段名，默认 'path'
 * @param {string} options.id - 主键字段名（用于生成路径），默认 'id'
 * @returns {Array} 扁平数组
 * 
 * @example
 * // 基础用法
 * const list = nb.pubfn.tree.treeToArray(menuTree);
 * 
 * @example
 * // 添加层级信息
 * const list = nb.pubfn.tree.treeToArray(menuTree, { addLevel: true });
 * // 结果: [{ id: 1, name: 'A', level: 0 }, { id: 2, name: 'B', level: 1 }, ...]
 */
tree.treeToArray = function(treeData, options = {}) {
	if (!Array.isArray(treeData) || treeData.length === 0) {
		return [];
	}

	const {
		children = 'children',
		deleteChildren = true,
		addLevel = false,
		levelField = 'level',
		addPath = false,
		pathField = 'path',
		id = 'id',
	} = options;

	const result = [];

	const traverse = (nodes, level = 0, parentPath = '') => {
		nodes.forEach((node) => {
			const item = { ...node };
			const childNodes = item[children];

			// 添加层级
			if (addLevel) {
				item[levelField] = level;
			}

			// 添加路径
			if (addPath) {
				item[pathField] = parentPath ? `${parentPath}/${item[id]}` : String(item[id]);
			}

			// 删除 children
			if (deleteChildren) {
				delete item[children];
			}

			result.push(item);

			// 递归处理子节点
			if (childNodes && Array.isArray(childNodes) && childNodes.length > 0) {
				traverse(childNodes, level + 1, addPath ? item[pathField] : '');
			}
		});
	};

	traverse(treeData);
	return result;
};

/**
 * 在树中查找节点
 * @param {Array} treeData - 树形结构数组
 * @param {Function} predicate - 查找条件函数
 * @param {Object} options - 配置选项
 * @param {string} options.children - 子节点字段名，默认 'children'
 * @returns {Object|null} 找到的节点，未找到返回 null
 * 
 * @example
 * const node = nb.pubfn.tree.findInTree(menuTree, item => item.id === 'menu-1');
 */
tree.findInTree = function(treeData, predicate, options = {}) {
	if (!Array.isArray(treeData)) return null;

	const { children = 'children' } = options;

	for (const node of treeData) {
		if (predicate(node)) {
			return node;
		}
		if (node[children] && node[children].length > 0) {
			const found = tree.findInTree(node[children], predicate, options);
			if (found) return found;
		}
	}

	return null;
};

/**
 * 在树中查找所有匹配的节点
 * @param {Array} treeData - 树形结构数组
 * @param {Function} predicate - 查找条件函数
 * @param {Object} options - 配置选项
 * @param {string} options.children - 子节点字段名，默认 'children'
 * @returns {Array} 所有匹配的节点数组
 * 
 * @example
 * const nodes = nb.pubfn.tree.findAllInTree(menuTree, item => item.type === 'menu');
 */
tree.findAllInTree = function(treeData, predicate, options = {}) {
	if (!Array.isArray(treeData)) return [];

	const { children = 'children' } = options;
	const result = [];

	const traverse = (nodes) => {
		for (const node of nodes) {
			if (predicate(node)) {
				result.push(node);
			}
			if (node[children] && node[children].length > 0) {
				traverse(node[children]);
			}
		}
	};

	traverse(treeData);
	return result;
};

/**
 * 获取节点的所有父级节点
 * @param {Array} treeData - 树形结构数组
 * @param {Function} predicate - 查找条件函数
 * @param {Object} options - 配置选项
 * @param {string} options.children - 子节点字段名，默认 'children'
 * @returns {Array} 父级节点数组（从根到直接父级）
 * 
 * @example
 * const parents = nb.pubfn.tree.getParentsInTree(menuTree, item => item.id === 'sub-menu-1');
 */
tree.getParentsInTree = function(treeData, predicate, options = {}) {
	if (!Array.isArray(treeData)) return [];

	const { children = 'children' } = options;

	const findPath = (nodes, path = []) => {
		for (const node of nodes) {
			if (predicate(node)) {
				return path;
			}
			if (node[children] && node[children].length > 0) {
				const found = findPath(node[children], [...path, node]);
				if (found) return found;
			}
		}
		return null;
	};

	return findPath(treeData) || [];
};

/**
 * 过滤树形结构（保留匹配节点及其父级）
 * @param {Array} treeData - 树形结构数组
 * @param {Function} predicate - 过滤条件函数
 * @param {Object} options - 配置选项
 * @param {string} options.children - 子节点字段名，默认 'children'
 * @returns {Array} 过滤后的树形结构
 * 
 * @example
 * // 搜索过滤，保留匹配节点及其父级
 * const filtered = nb.pubfn.tree.filterTree(menuTree, item => item.name.includes('用户'));
 */
tree.filterTree = function(treeData, predicate, options = {}) {
	if (!Array.isArray(treeData)) return [];

	const { children = 'children' } = options;

	const filter = (nodes) => {
		const result = [];

		for (const node of nodes) {
			const newNode = { ...node };
			const childNodes = node[children];

			// 先处理子节点
			if (childNodes && childNodes.length > 0) {
				const filteredChildren = filter(childNodes);
				if (filteredChildren.length > 0) {
					newNode[children] = filteredChildren;
					result.push(newNode);
					continue;
				}
			}

			// 如果当前节点匹配，添加到结果
			if (predicate(node)) {
				delete newNode[children];
				result.push(newNode);
			}
		}

		return result;
	};

	return filter(treeData);
};

/**
 * 遍历树形结构（深度优先）
 * @param {Array} treeData - 树形结构数组
 * @param {Function} callback - 回调函数 (node, level, parent) => void
 * @param {Object} options - 配置选项
 * @param {string} options.children - 子节点字段名，默认 'children'
 * 
 * @example
 * nb.pubfn.tree.traverseTree(menuTree, (node, level) => {
 *   console.log('  '.repeat(level) + node.name);
 * });
 */
tree.traverseTree = function(treeData, callback, options = {}) {
	if (!Array.isArray(treeData)) return;

	const { children = 'children' } = options;

	const traverse = (nodes, level = 0, parent = null) => {
		for (const node of nodes) {
			callback(node, level, parent);
			if (node[children] && node[children].length > 0) {
				traverse(node[children], level + 1, node);
			}
		}
	};

	traverse(treeData);
};

/**
 * 映射树形结构（类似 Array.map）
 * @param {Array} treeData - 树形结构数组
 * @param {Function} mapper - 映射函数 (node, level, parent) => newNode
 * @param {Object} options - 配置选项
 * @param {string} options.children - 子节点字段名，默认 'children'
 * @returns {Array} 映射后的树形结构
 * 
 * @example
 * // 转换为 TreeSelect 格式
 * const selectTree = nb.pubfn.tree.mapTree(menuTree, node => ({
 *   title: node.name,
 *   value: node.id,
 *   key: node.id,
 * }));
 */
tree.mapTree = function(treeData, mapper, options = {}) {
	if (!Array.isArray(treeData)) return [];

	const { children = 'children' } = options;

	const map = (nodes, level = 0, parent = null) => {
		return nodes.map((node) => {
			const newNode = mapper(node, level, parent);
			if (node[children] && node[children].length > 0) {
				newNode[children] = map(node[children], level + 1, node);
			}
			return newNode;
		});
	};

	return map(treeData);
};

/**
 * 获取树的所有叶子节点
 * @param {Array} treeData - 树形结构数组
 * @param {Object} options - 配置选项
 * @param {string} options.children - 子节点字段名，默认 'children'
 * @returns {Array} 所有叶子节点数组
 * 
 * @example
 * const leaves = nb.pubfn.tree.getLeaves(menuTree);
 */
tree.getLeaves = function(treeData, options = {}) {
	if (!Array.isArray(treeData)) return [];

	const { children = 'children' } = options;
	const result = [];

	const traverse = (nodes) => {
		for (const node of nodes) {
			if (!node[children] || node[children].length === 0) {
				result.push(node);
			} else {
				traverse(node[children]);
			}
		}
	};

	traverse(treeData);
	return result;
};

/**
 * 补全缺失的父级节点
 * 当选中子节点但父节点不在列表中时，自动补全父节点
 * @param {Array} nodes - 节点数组
 * @param {Array} allNodes - 所有节点的完整列表
 * @param {Object} options - 配置选项
 * @param {string} options.id - 主键字段名，默认 'id'
 * @param {string} options.parentId - 父级字段名，默认 'parentId'
 * @returns {Array} 补全后的节点数组
 * 
 * @example
 * const complete = nb.pubfn.tree.fillMissingParents(selectedMenus, allMenus);
 */
tree.fillMissingParents = function(nodes, allNodes, options = {}) {
	if (!Array.isArray(nodes) || nodes.length === 0) {
		return nodes;
	}

	const { id = 'id', parentId = 'parentId' } = options;

	// 创建所有节点的映射
	const allNodesMap = new Map();
	allNodes.forEach((node) => {
		allNodesMap.set(node[id], node);
	});

	// 创建已有节点的映射
	const nodeMap = new Map();
	const missingParentIds = new Set();

	nodes.forEach((node) => {
		nodeMap.set(node[id], node);
	});

	// 查找缺失的父级
	nodes.forEach((node) => {
		let currentParentId = node[parentId];
		while (currentParentId && !nodeMap.has(currentParentId)) {
			missingParentIds.add(currentParentId);
			const parentNode = allNodesMap.get(currentParentId);
			if (parentNode) {
				currentParentId = parentNode[parentId];
			} else {
				break;
			}
		}
	});

	// 添加缺失的父级节点
	const result = [...nodes];
	missingParentIds.forEach((missingId) => {
		const parentNode = allNodesMap.get(missingId);
		if (parentNode && !nodeMap.has(missingId)) {
			result.push(parentNode);
			nodeMap.set(missingId, parentNode);
		}
	});

	return result;
};

export default tree;
