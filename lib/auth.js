import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { nextCookies } from 'better-auth/next-js';
import { admin, username } from 'better-auth/plugins';
import clientPromise from './mongodb';

// 复用 MongoDB 连接
let dbInstance = null;
async function getDatabase() {
	if (!dbInstance) {
		const client = await clientPromise;
		dbInstance = client.db(process.env.MONGODB_DB_NAME);
	}
	return dbInstance;
}

export const auth = betterAuth({
	database: mongodbAdapter(await getDatabase()),

	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false, // 暂时关闭邮箱验证，可根据需要开启
		minPasswordLength: 8,
		maxPasswordLength: 128,
	},

	// 第三方登录配置
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID || '',
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
			enabled: !!process.env.GOOGLE_CLIENT_ID,
		},
		github: {
			clientId: process.env.GITHUB_CLIENT_ID || '',
			clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
			enabled: !!process.env.GITHUB_CLIENT_ID,
		},
	},

	// 配置用户表
	user: {
		modelName: 'users', // 用户存储在 users 集合
		additionalFields: {
			// 基础信息
			username: {
				type: 'string',
				required: false,
			},
			role: {
				type: 'string',
				required: false,
				defaultValue: 'user',
				input: false, // 防止用户在注册时自定义角色
				output: true,
			},

			// 积分相关字段
			credits: {
				type: 'number',
				required: false,
				defaultValue: 0,
				input: false,
				output: true,
			},
			totalCreditsEarned: {
				type: 'number',
				required: false,
				defaultValue: 0,
				input: false,
				output: true,
			},
			totalCreditsUsed: {
				type: 'number',
				required: false,
				defaultValue: 0,
				input: false,
				output: true,
			},

			// 套餐相关字段
			currentPackageId: {
				type: 'string',
				required: false,
				input: false,
				output: true,
			},
			packageExpireAt: {
				type: 'date',
				required: false,
				input: false,
				output: true,
			},

			// 时间戳
			lastLoginAt: {
				type: 'date',
				required: false,
				input: false,
				output: true,
			},
		},
	},

	// 配置会话
	session: {
		expiresIn: 24 * 60 * 60, // 24小时
		updateAge: 60 * 60, // 1小时
		// 在 session 中包含用户积分等信息
		async fetchUser(userId) {
			const db = await getDatabase();
			const user = await db.collection('users').findOne({ id: userId });
			return user;
		},
	},

	// 配置插件
	plugins: [
		admin(),
		username(), // 支持用户名登录
		nextCookies(), // 确保这是最后一个插件
	],

	// 高级配置
	advanced: {
		crossSubDomainCookies: {
			enabled: false,
		},
		useSecureCookies: process.env.NODE_ENV === 'production',
		database: {
			generateId: () => {
				// 使用更短的 ID 格式
				return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
			},
		},
	},

	// 基础URL配置
	baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000',

	// 密钥配置
	secret: process.env.BETTER_AUTH_SECRET || process.env.NEXTAUTH_SECRET,
});
