/**
 * 菜单管理 CRUD 配置
 */
export const menuCrudConfig = {
	// 集合名称
	collectionName: 'menus',
	
	// 主键字段
	primaryKey: 'id',
	
	// 字段配置
	fields: {
		creatable: ['name', 'parent', 'url', 'icon', 'sort', 'enable'],
		updatable: ['name', 'parent', 'url', 'icon', 'sort', 'enable'],
		searchable: ['name', 'url'],
	},
	
	// 查询配置
	query: {
		defaultSort: { sort: 1, createdAt: 1 },
		defaultPageSize: 20,
		baseFilter: {},
	},
	
	// 软删除：禁用（菜单直接删除）
	softDelete: false,
	
	// 数据验证规则
	validation: {
		name: {
			required: true,
			minLength: 2,
			maxLength: 50,
			message: 'Menu name must be 2-50 characters',
		},
		url: {
			maxLength: 200,
			message: 'URL max length: 200',
		},
	},
	
	// 生命周期钩子
	hooks: {
		/**
		 * 删除前钩子 - 检查是否有子菜单
		 */
		beforeDelete: async (id, existing) => {
			const { getCollection } = await import('@/lib/database/mongodb');
			const collection = await getCollection('menus');
			
			// 检查是否有子菜单
			const childCount = await collection.count({ parent: id });
			if (childCount > 0) {
				throw new Error(`Cannot delete menu "${existing.name}": it has ${childCount} child menu(s). Please delete or reassign them first.`);
			}
			
			return true;
		},
		
		/**
		 * 删除后钩子 - 清理关联数据
		 */
		afterDelete: async (id, deleted) => {
			
			// 从角色的 menu 数组中移除该菜单
			const { getCollection } = await import('@/lib/database/mongodb');
			const rolesCollection = await getCollection('roles');
			
			await rolesCollection.updateMany(
				{ menu: id },
				{ $pull: { menu: id } }
			);
			
		},
	},
};
