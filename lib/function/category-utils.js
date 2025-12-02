/**
 * 分类相关工具函数
 */

import nb from '@/lib/function';

/**
 * 获取分类的 weight 属性值
 * @param {Object} category - 分类对象
 * @returns {number} weight 值，默认为 0
 */
export function getCategoryWeight(category) {
  const weightProp = category.properties?.find((prop) => prop.name === 'weight');
  return weightProp ? parseFloat(weightProp.value) || 0 : 0;
}

/**
 * 递归排序分类树（按 weight 属性）
 * @param {Array} categories - 分类数组
 * @returns {Array} 排序后的分类数组
 * 
 * 注意：这里使用 mapTree 来处理排序，保持原有行为
 */
export function sortCategoriesByWeight(categories) {
  if (!Array.isArray(categories)) return categories;

  // 先排序当前层级
  const sorted = [...categories].sort((a, b) => getCategoryWeight(a) - getCategoryWeight(b));

  // 使用 mapTree 递归处理子节点排序
  return nb.pubfn.tree.mapTree(sorted, (node) => ({ ...node }), { children: 'children' })
    .map((node) => {
      if (node.children && node.children.length > 0) {
        node.children = sortCategoriesByWeight(node.children);
      }
      return node;
    });
}

/**
 * 扁平化分类树
 * @param {Array} categories - 分类树数组
 * @returns {Array} 扁平化后的分类数组
 */
export function flattenCategories(categories) {
  // 使用 treeToArray 工具函数
  return nb.pubfn.tree.treeToArray(categories, { deleteChildren: false });
}

