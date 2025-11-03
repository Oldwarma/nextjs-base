/**
 * Package CRUD 配置
 * 套餐管理的增删改查配置
 */

export const packageCrudConfig = {
	collectionName: 'packages',
	primaryKey: '_id',
	logCategory: 'admin/packages',

	// 字段配置
	fields: {
		// 可创建的字段
		creatable: ['name', 'description', 'price', 'credits', 'validDays', 'features', 'isActive', 'sort'],
		// 可更新的字段
		updatable: ['name', 'description', 'price', 'credits', 'validDays', 'features', 'isActive', 'sort'],
		// 可搜索的字段
		searchable: ['name', 'description'],
	},

	// 验证规则
	validation: {
		name: {
			required: true,
			minLength: 1,
			maxLength: 100,
			message: 'Package name must be 1-100 characters',
		},
		price: {
			required: true,
			validator: async (value) => {
				return typeof value === 'number' && value >= 0;
			},
			message: 'Price must be a non-negative number',
		},
		credits: {
			required: true,
			validator: async (value) => {
				return typeof value === 'number' && value >= 0 && Number.isInteger(value);
			},
			message: 'Credits must be a non-negative integer',
		},
		validDays: {
			required: true,
			validator: async (value) => {
				return typeof value === 'number' && value >= 0 && Number.isInteger(value);
			},
			message: 'Valid days must be a non-negative integer',
		},
	},

	// 查询配置
	query: {
		defaultSort: { sort: 1, createdAt: -1 }, // 先按 sort 排序，再按创建时间
		defaultPageSize: 20,
		baseFilter: {}, // 管理员可以看到所有套餐（包括未激活的）
	},

	// 生命周期钩子
	hooks: {
		beforeCreate: async (data) => {
			// 确保 features 是数组
			if (data.features && !Array.isArray(data.features)) {
				data.features = [data.features];
			}
			// 默认值
			if (data.features === undefined) data.features = [];
			if (data.isActive === undefined) data.isActive = true;
			if (data.sort === undefined) data.sort = 0;
			if (data.description === undefined) data.description = '';
			return data;
		},
		beforeUpdate: async (id, data, existing) => {
			// 确保 features 是数组
			if (data.features && !Array.isArray(data.features)) {
				data.features = [data.features];
			}
			return data;
		},
		beforeDelete: async (id, existing) => {
			// TODO: 可以检查是否有用户正在使用此套餐
			// const usersCollection = await getCollection('user_packages');
			// const activeUsers = await usersCollection.countDocuments({
			// 	packageId: id,
			// 	status: 'active'
			// });
			// if (activeUsers > 0) {
			// 	throw new Error('Cannot delete package with active users');
			// }
			return true;
		},
	},

	// 数据转换
	transforms: {
		input: (data) => {
			// 确保数字类型
			if (data.price !== undefined) data.price = Number(data.price);
			if (data.credits !== undefined) data.credits = Number(data.credits);
			if (data.validDays !== undefined) data.validDays = Number(data.validDays);
			if (data.sort !== undefined) data.sort = Number(data.sort);
			return data;
		},
		output: (data) => {
			return data;
		},
	},

	// 软删除配置
	softDelete: false, // 套餐不使用软删除，直接删除或设置 isActive=false
};

