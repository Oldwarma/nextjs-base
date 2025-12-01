/**
 * 权限命名约定解析器
 * 
 * 通过命名约定自动识别权限级别，参考 vk-unicloud 的设计理念
 * https://vkdoc.fsq.pub/client/uniCloud/cloudfunctions/cloudObject.html#permissions
 * 
 * ## 命名约定
 * 
 * ### 前缀识别词（按优先级从高到低）：
 * 
 * | 前缀 | 权限级别 | 说明 |
 * |------|---------|------|
 * | `_` 或 `private` | private | 私有方法，不能被前端直接调用 |
 * | `pub` | public | 公开可访问，绕开所有权限检查 |
 * | `auth` | auth | 需要登录，给前台用户使用 |
 * | `sys` 或 `admin` | system | 需要后台权限，给后台用户使用 |
 * 
 * ## 优先级规则（重要！）
 * 
 * **函数名/文件名 > 目录路径**
 * 
 * 当函数名和目录路径包含不同的权限关键词时，以函数名/文件名为准：
 * 
 * | 场景 | 最终权限 | 说明 |
 * |------|---------|------|
 * | `/actions/pub/userActions.js` 中的 `authGetInfo` | auth | 函数名优先 |
 * | `/api/sys/pubupload/route.js` | public | 文件名 pubupload 优先 |
 * | `/actions/auth/pubConfig.js` 中的 `getConfig` | public | 文件名优先 |
 * | `/api/pub/sysadmin/route.js` | system | 文件名 sysadmin 优先 |
 * 
 * ### Server Actions 命名示例：
 * 
 * ```
 * // 函数名优先
 * /actions/pub/userActions.js::authGetInfo  → auth（函数名优先）
 * /actions/sys/config.js::pubGetConfig      → public（函数名优先）
 * 
 * // 文件名次之
 * /actions/pubConfig.js::getData            → public（文件名）
 * /actions/authUser.js::getProfile          → auth（文件名）
 * 
 * // 目录路径最后
 * /actions/pub/config.js::getData           → public（目录）
 * /actions/auth/user.js::getProfile         → auth（目录）
 * ```
 * 
 * ### API Routes 路径示例：
 * 
 * ```
 * // 最后一级路径（文件名）优先
 * /api/sys/pubupload/route.js   → public（pubupload 优先）
 * /api/pub/authuser/route.js    → auth（authuser 优先）
 * 
 * // 完整路径次之
 * /api/pub/config/route.js      → public
 * /api/auth/user/route.js       → auth
 * /api/sys/users/route.js       → system
 * ```
 * 
 * ## 关键词优先级
 * 
 * 在同一个字符串中存在多个关键词时，按以下优先级：
 * 1. private（最高）- `_` 前缀或 `private`
 * 2. pub/public
 * 3. auth
 * 4. sys/admin
 * 5. 默认 - 如果没有识别词，默认为 auth（需要登录）
 */

/**
 * 权限级别枚举
 */
export const PermissionLevel = {
	/** 私有方法，不能被前端直接调用 */
	PRIVATE: 'private',
	/** 公开可访问，绕开所有权限检查 */
	PUBLIC: 'public',
	/** 需要登录，给前台用户使用 */
	AUTH: 'auth',
	/** 需要后台权限，给后台用户使用 */
	SYSTEM: 'system',
};

/**
 * 识别词配置
 * 按优先级从高到低排列
 * 
 * 注意：使用精确匹配避免误匹配
 * - pub 不会匹配 publish、publisher（但会匹配 pubupload、pubconfig）
 * - auth 不会匹配 author、authorization（但会匹配 authuser）
 * - sys 不会匹配 system（作为普通单词）
 * 
 * 匹配规则：
 * 1. 作为独立单词出现（被 / - _ 或字符串边界分隔）
 * 2. 作为前缀出现（如 pubGetConfig、pubupload、authUser、authuser）
 * 3. 精确匹配完整单词（如 pub、auth、sys）
 * 
 * 排除规则（不匹配）：
 * - publish、publisher、publication（pub 后面是 l）
 * - author、authorization、authenticate（auth 后面是 o）
 * - system（sys 后面是 t）
 */
const PERMISSION_KEYWORDS = [
	// private: 下划线前缀或 private 前缀
	{ pattern: /^_/, level: PermissionLevel.PRIVATE, name: 'underscore prefix' },
	{ pattern: /^private/i, level: PermissionLevel.PRIVATE, name: 'private prefix' },
	
	// public: 
	// 匹配：pub、pubXxx、pubupload、/pub/、pub_xxx
	// 不匹配：publish、publisher、publication（pub 后面是 l）、republic
	{ pattern: /^pub$/i, level: PermissionLevel.PUBLIC, name: 'pub exact' },
	{ pattern: /^pub(?![l])/i, level: PermissionLevel.PUBLIC, name: 'pub prefix' },  // 排除 publish 等
	{ pattern: /\/pub(?:\/|$)/i, level: PermissionLevel.PUBLIC, name: 'pub path' },
	{ pattern: /[_-]pub[_-]/i, level: PermissionLevel.PUBLIC, name: 'pub segment' },
	{ pattern: /^pub[_-]/i, level: PermissionLevel.PUBLIC, name: 'pub start' },
	{ pattern: /[_-]pub$/i, level: PermissionLevel.PUBLIC, name: 'pub end' },
	{ pattern: /\bpublic\b/i, level: PermissionLevel.PUBLIC, name: 'public keyword' },
	
	// auth:
	// 匹配：auth、authXxx、authuser、/auth/、auth_xxx
	// 不匹配：author、authorization、authenticate（auth 后面是 o 或 e）
	{ pattern: /^auth$/i, level: PermissionLevel.AUTH, name: 'auth exact' },
	{ pattern: /^auth(?![oe])/i, level: PermissionLevel.AUTH, name: 'auth prefix' },  // 排除 author、authenticate 等
	{ pattern: /\/auth(?:\/|$)/i, level: PermissionLevel.AUTH, name: 'auth path' },
	{ pattern: /[_-]auth[_-]/i, level: PermissionLevel.AUTH, name: 'auth segment' },
	{ pattern: /^auth[_-]/i, level: PermissionLevel.AUTH, name: 'auth start' },
	{ pattern: /[_-]auth$/i, level: PermissionLevel.AUTH, name: 'auth end' },
	
	// system:
	// 匹配：sys、sysXxx、sysuser、/sys/、sys_xxx、admin
	// 不匹配：system、systematic（sys 后面是 t）
	{ pattern: /^sys$/i, level: PermissionLevel.SYSTEM, name: 'sys exact' },
	{ pattern: /^sys(?![t])/i, level: PermissionLevel.SYSTEM, name: 'sys prefix' },  // 排除 system 等
	{ pattern: /\/sys(?:\/|$)/i, level: PermissionLevel.SYSTEM, name: 'sys path' },
	{ pattern: /[_-]sys[_-]/i, level: PermissionLevel.SYSTEM, name: 'sys segment' },
	{ pattern: /^sys[_-]/i, level: PermissionLevel.SYSTEM, name: 'sys start' },
	{ pattern: /[_-]sys$/i, level: PermissionLevel.SYSTEM, name: 'sys end' },
	{ pattern: /^admin$/i, level: PermissionLevel.SYSTEM, name: 'admin exact' },
	{ pattern: /\/admin(?:\/|$)/i, level: PermissionLevel.SYSTEM, name: 'admin path' },
	{ pattern: /[_-]admin[_-]/i, level: PermissionLevel.SYSTEM, name: 'admin segment' },
	{ pattern: /^admin[_-]/i, level: PermissionLevel.SYSTEM, name: 'admin start' },
	{ pattern: /[_-]admin$/i, level: PermissionLevel.SYSTEM, name: 'admin end' },
];

/**
 * 从单个字符串中解析权限级别
 * 
 * @param {string} str - 要解析的字符串（函数名、路径等）
 * @param {Object} options - 可选配置
 * @param {string} options.defaultLevel - 默认权限级别（默认为 AUTH）
 * @returns {Object} 解析结果
 * - level: 权限级别
 * - keyword: 匹配的关键词
 * - isDefault: 是否使用默认值
 */
export function parsePermissionLevel(str, options = {}) {
	const { defaultLevel = PermissionLevel.AUTH } = options;

	if (!str || typeof str !== 'string') {
		return {
			level: defaultLevel,
			keyword: null,
			isDefault: true,
			source: null,
		};
	}

	// 按优先级检查每个识别词
	for (const keyword of PERMISSION_KEYWORDS) {
		if (keyword.pattern.test(str)) {
			return {
				level: keyword.level,
				keyword: keyword.name,
				isDefault: false,
				source: str,
			};
		}
	}

	return {
		level: defaultLevel,
		keyword: null,
		isDefault: true,
		source: str,
	};
}

/**
 * 按优先级从多个来源解析权限级别
 * 
 * 优先级：函数名 > 文件名 > 目录路径
 * 
 * @param {Array<string>} sources - 按优先级排列的来源数组（第一个优先级最高）
 * @param {Object} options - 可选配置
 * @returns {Object} 解析结果
 * 
 * @example
 * // 函数名优先
 * parsePermissionWithPriority(['authGetInfo', 'userActions', '/actions/pub/'])
 * // => { level: 'auth', source: 'authGetInfo' }
 * 
 * // 文件名次之
 * parsePermissionWithPriority(['getData', 'pubConfig', '/actions/sys/'])
 * // => { level: 'public', source: 'pubConfig' }
 * 
 * // 目录路径最后
 * parsePermissionWithPriority(['getData', 'config', '/actions/pub/'])
 * // => { level: 'public', source: '/actions/pub/' }
 */
export function parsePermissionWithPriority(sources, options = {}) {
	const { defaultLevel = PermissionLevel.AUTH } = options;

	if (!Array.isArray(sources) || sources.length === 0) {
		return {
			level: defaultLevel,
			keyword: null,
			isDefault: true,
			source: null,
		};
	}

	// 按优先级检查每个来源
	for (const source of sources) {
		if (!source || typeof source !== 'string') continue;

		const result = parsePermissionLevel(source, { defaultLevel: null });
		
		// 如果找到了权限关键词，返回结果
		if (!result.isDefault && result.level !== null) {
			return {
				...result,
				source,
			};
		}
	}

	// 没有找到任何关键词，使用默认值
	return {
		level: defaultLevel,
		keyword: null,
		isDefault: true,
		source: sources[sources.length - 1] || null,
	};
}

/**
 * 从 Server Action 解析权限级别
 * 
 * 优先级：函数名 > 文件名 > 目录路径
 * 
 * @param {string} actionName - Action 函数名
 * @param {Object} options - 可选配置
 * @param {string} options.filePath - 文件路径（可选）
 * @returns {Object} 解析结果
 * 
 * @example
 * // 只有函数名
 * parseActionPermission('pubGetConfig')
 * // => { level: 'public', source: 'pubGetConfig' }
 * 
 * // 函数名 + 文件路径
 * parseActionPermission('authGetInfo', { filePath: '/actions/pub/userActions.js' })
 * // => { level: 'auth', source: 'authGetInfo' }（函数名优先）
 * 
 * // 函数名无关键词，使用文件路径
 * parseActionPermission('getData', { filePath: '/actions/pub/config.js' })
 * // => { level: 'public', source: 'pub' }
 */
export function parseActionPermission(actionName, options = {}) {
	const { filePath = null, defaultLevel = PermissionLevel.AUTH } = options;

	// 构建优先级来源数组
	const sources = [actionName];

	if (filePath) {
		// 提取文件名（不含扩展名）
		const fileName = extractFileName(filePath);
		if (fileName) {
			sources.push(fileName);
		}

		// 提取目录路径中的各级目录名
		const dirNames = extractDirNames(filePath);
		sources.push(...dirNames);
	}

	return parsePermissionWithPriority(sources, { defaultLevel });
}

/**
 * 从 API 路径解析权限级别
 * 
 * 优先级：最后一级路径（文件名）> 完整路径
 * 
 * @param {string} apiPath - API 路径（如 '/api/sys/pubupload'）
 * @param {Object} options - 可选配置
 * @returns {Object} 解析结果
 * 
 * @example
 * // 最后一级路径优先
 * parseApiPermission('/api/sys/pubupload')
 * // => { level: 'public', source: 'pubupload' }
 * 
 * // 完整路径
 * parseApiPermission('/api/pub/config')
 * // => { level: 'public', source: 'pub' }
 */
export function parseApiPermission(apiPath, options = {}) {
	const { defaultLevel = PermissionLevel.AUTH } = options;

	if (!apiPath || typeof apiPath !== 'string') {
		return {
			level: defaultLevel,
			keyword: null,
			isDefault: true,
			source: null,
		};
	}

	// 提取路径段
	const segments = apiPath.split('/').filter(Boolean);
	
	// 构建优先级来源数组（从最后一级到第一级）
	// 例如 /api/sys/pubupload -> ['pubupload', 'sys', 'api']
	const sources = [...segments].reverse();

	return parsePermissionWithPriority(sources, { defaultLevel });
}

/**
 * 从文件路径提取文件名（不含扩展名）
 * 
 * @param {string} filePath - 文件路径
 * @returns {string|null} 文件名
 */
function extractFileName(filePath) {
	if (!filePath) return null;
	
	// 获取最后一个路径段
	const segments = filePath.split(/[/\\]/);
	const lastSegment = segments[segments.length - 1];
	
	if (!lastSegment) return null;
	
	// 移除扩展名
	const dotIndex = lastSegment.lastIndexOf('.');
	if (dotIndex > 0) {
		return lastSegment.substring(0, dotIndex);
	}
	
	return lastSegment;
}

/**
 * 从文件路径提取目录名数组
 * 
 * @param {string} filePath - 文件路径
 * @returns {Array<string>} 目录名数组（从最近到最远）
 */
function extractDirNames(filePath) {
	if (!filePath) return [];
	
	const segments = filePath.split(/[/\\]/).filter(Boolean);
	
	// 移除文件名，保留目录
	if (segments.length > 0) {
		segments.pop();
	}
	
	// 反转，使最近的目录优先
	return segments.reverse();
}

/**
 * 检查是否是私有方法（不能被前端直接调用）
 * 
 * @param {string} name - 函数名或路径
 * @param {Object} options - 可选配置
 * @returns {boolean}
 */
export function isPrivateMethod(name, options = {}) {
	const result = options.filePath 
		? parseActionPermission(name, options)
		: parsePermissionLevel(name);
	return result.level === PermissionLevel.PRIVATE;
}

/**
 * 检查是否是公开方法（无需任何权限）
 * 
 * @param {string} name - 函数名或路径
 * @param {Object} options - 可选配置
 * @returns {boolean}
 */
export function isPublicMethod(name, options = {}) {
	const result = options.filePath 
		? parseActionPermission(name, options)
		: parsePermissionLevel(name);
	return result.level === PermissionLevel.PUBLIC;
}

/**
 * 检查是否需要登录（auth 级别）
 * 
 * @param {string} name - 函数名或路径
 * @param {Object} options - 可选配置
 * @returns {boolean}
 */
export function requiresAuth(name, options = {}) {
	const result = options.filePath 
		? parseActionPermission(name, options)
		: parsePermissionLevel(name);
	return result.level === PermissionLevel.AUTH;
}

/**
 * 检查是否需要后台权限（system 级别）
 * 
 * @param {string} name - 函数名或路径
 * @param {Object} options - 可选配置
 * @returns {boolean}
 */
export function requiresSystem(name, options = {}) {
	const result = options.filePath 
		? parseActionPermission(name, options)
		: parsePermissionLevel(name);
	return result.level === PermissionLevel.SYSTEM;
}

/**
 * 获取权限级别的描述
 * 
 * @param {string} level - 权限级别
 * @returns {Object} 描述信息
 */
export function getPermissionLevelInfo(level) {
	const info = {
		[PermissionLevel.PRIVATE]: {
			name: 'Private',
			description: '私有方法，不能被前端直接调用',
			requiresLogin: false,
			requiresRbac: false,
			canBeCalledDirectly: false,
		},
		[PermissionLevel.PUBLIC]: {
			name: 'Public',
			description: '公开可访问，绕开所有权限检查',
			requiresLogin: false,
			requiresRbac: false,
			canBeCalledDirectly: true,
		},
		[PermissionLevel.AUTH]: {
			name: 'Auth',
			description: '需要登录，给前台用户使用',
			requiresLogin: true,
			requiresRbac: false,
			canBeCalledDirectly: true,
		},
		[PermissionLevel.SYSTEM]: {
			name: 'System',
			description: '需要后台权限，给后台用户使用',
			requiresLogin: true,
			requiresRbac: true,
			canBeCalledDirectly: true,
		},
	};

	return info[level] || info[PermissionLevel.AUTH];
}

/**
 * 根据权限级别获取检查配置
 * 用于 wrapAction 等包装器
 * 
 * @param {string} level - 权限级别
 * @returns {Object} 检查配置
 */
export function getPermissionCheckConfig(level) {
	switch (level) {
		case PermissionLevel.PRIVATE:
			return {
				skipAuth: false,
				skipPermission: true,
				isPrivate: true,
				errorMessage: 'This method is private and cannot be called directly',
			};
		case PermissionLevel.PUBLIC:
			return {
				skipAuth: true,
				skipPermission: true,
				isPrivate: false,
			};
		case PermissionLevel.AUTH:
			return {
				skipAuth: false,
				skipPermission: true, // auth 级别只验证登录，不检查 RBAC
				isPrivate: false,
			};
		case PermissionLevel.SYSTEM:
			return {
				skipAuth: false,
				skipPermission: false, // system 级别需要 RBAC 检查
				isPrivate: false,
			};
		default:
			return {
				skipAuth: false,
				skipPermission: true,
				isPrivate: false,
			};
	}
}
