/**
 * 规则评估器
 * 
 * 用于评估 showRule 和 disabled 等条件表达式
 * 支持表达式字符串和函数两种形式
 * 
 * 参考 vk-unicloud: https://vkdoc.fsq.pub/admin/components/0%E3%80%81public.html#showrule
 */

/**
 * 评估规则表达式
 * 
 * 支持的操作符：= == > >= < <= != in && ||
 * 
 * @param {String|Function} rule - 规则表达式或函数
 * @param {Object} formData - 表单数据
 * @param {Object} field - 字段配置
 * @returns {Boolean} 是否满足条件
 * 
 * @example
 * // 字符串表达式
 * evaluateRule("login_appid_type==1", { login_appid_type: 1 })  // true
 * evaluateRule("age>=18", { age: 20 })  // true
 * evaluateRule("status in ['active','pending']", { status: 'active' })  // true
 * 
 * // 函数形式
 * evaluateRule((formData) => formData.age >= 18, { age: 20 })  // true
 */
export function evaluateRule(rule, formData, field = {}) {
	// 如果没有规则，默认返回 true
	if (!rule) return true;
	
	// 如果是函数，直接调用
	if (typeof rule === 'function') {
		try {
			return Boolean(rule(formData, field));
		} catch (error) {
			console.error('Rule evaluation error:', error);
			return false;
		}
	}
	
	// 如果是字符串表达式
	if (typeof rule === 'string') {
		try {
			return evaluateExpression(rule, formData);
		} catch (error) {
			console.error('Expression evaluation error:', error, 'Expression:', rule);
			return false;
		}
	}
	
	// 其他情况返回 false
	return false;
}

/**
 * 评估字符串表达式
 * 
 * @param {String} expression - 表达式字符串
 * @param {Object} formData - 表单数据
 * @returns {Boolean} 评估结果
 */
function evaluateExpression(expression, formData) {
	// 移除首尾空格
	expression = expression.trim();
	
	// 处理逻辑运算符 || 和 &&
	if (expression.includes('||')) {
		const parts = expression.split('||').map(p => p.trim());
		return parts.some(part => evaluateExpression(part, formData));
	}
	
	if (expression.includes('&&')) {
		const parts = expression.split('&&').map(p => p.trim());
		return parts.every(part => evaluateExpression(part, formData));
	}
	
	// 处理 in 操作符
	if (expression.includes(' in ')) {
		return evaluateInExpression(expression, formData);
	}
	
	// 处理比较操作符（注意顺序：长的操作符要先检查）
	const operators = ['===', '!==', '==', '!=', '>=', '<=', '>', '<', '='];
	
	for (const op of operators) {
		if (expression.includes(op)) {
			return evaluateComparisonExpression(expression, op, formData);
		}
	}
	
	// 如果没有操作符，直接判断字段值的真假
	const value = getValueByPath(expression, formData);
	return Boolean(value);
}

/**
 * 评估 in 表达式
 * 
 * @example
 * "status in ['active','pending']"
 */
function evaluateInExpression(expression, formData) {
	const [fieldExpr, arrayExpr] = expression.split(' in ').map(p => p.trim());
	const fieldValue = getValueByPath(fieldExpr, formData);
	
	// 解析数组表达式
	let array;
	try {
		// 支持 ['active','pending'] 或 ["active","pending"] 格式
		array = JSON.parse(arrayExpr.replace(/'/g, '"'));
	} catch (error) {
		console.error('Failed to parse array expression:', arrayExpr);
		return false;
	}
	
	if (!Array.isArray(array)) {
		return false;
	}
	
	return array.includes(fieldValue);
}

/**
 * 评估比较表达式
 * 
 * @example
 * "age >= 18"
 * "name == 'John'"
 */
function evaluateComparisonExpression(expression, operator, formData) {
	const [leftExpr, rightExpr] = expression.split(operator).map(p => p.trim());
	
	const leftValue = getValueByPath(leftExpr, formData);
	let rightValue = rightExpr;
	
	// 尝试解析右侧值
	// 如果是数字，转换为数字
	if (/^-?\d+(\.\d+)?$/.test(rightValue)) {
		rightValue = Number(rightValue);
	}
	// 如果是字符串（带引号），移除引号
	else if ((rightValue.startsWith("'") && rightValue.endsWith("'")) ||
	         (rightValue.startsWith('"') && rightValue.endsWith('"'))) {
		rightValue = rightValue.slice(1, -1);
	}
	// 如果是布尔值
	else if (rightValue === 'true') {
		rightValue = true;
	} else if (rightValue === 'false') {
		rightValue = false;
	}
	// 否则尝试从 formData 中获取
	else {
		rightValue = getValueByPath(rightValue, formData);
	}
	
	// 执行比较
	switch (operator) {
		case '===':
			// 严格相等
			return leftValue === rightValue;
		case '!==':
			// 严格不等
			return leftValue !== rightValue;
		case '=':
		case '==':
			// 使用非严格相等，因为可能涉及类型转换
			return leftValue == rightValue;
		case '!=':
			return leftValue != rightValue;
		case '>':
			return leftValue > rightValue;
		case '>=':
			return leftValue >= rightValue;
		case '<':
			return leftValue < rightValue;
		case '<=':
			return leftValue <= rightValue;
		default:
			return false;
	}
}

/**
 * 根据路径获取对象的值
 * 支持点号路径，如 "user.profile.name"
 * 
 * @param {String} path - 路径
 * @param {Object} obj - 对象
 * @returns {*} 值
 */
function getValueByPath(path, obj) {
	if (!path || !obj) return undefined;
	
	const keys = path.split('.');
	let value = obj;
	
	for (const key of keys) {
		if (value === null || value === undefined) {
			return undefined;
		}
		value = value[key];
	}
	
	return value;
}

/**
 * 批量评估多个字段的显示规则
 * 
 * @param {Array} fieldsConfig - 字段配置数组
 * @param {Object} formData - 表单数据
 * @returns {Object} 字段key → 是否显示的映射
 */
export function evaluateFieldsVisibility(fieldsConfig, formData) {
	const visibility = {};
	
	fieldsConfig.forEach(field => {
		if (field.showRule) {
			visibility[field.key] = evaluateRule(field.showRule, formData, field);
		} else {
			// 没有 showRule，默认显示
			visibility[field.key] = true;
		}
	});
	
	return visibility;
}

/**
 * 批量评估多个字段的禁用规则
 * 
 * @param {Array} fieldsConfig - 字段配置数组
 * @param {Object} formData - 表单数据
 * @returns {Object} 字段key → 是否禁用的映射
 */
export function evaluateFieldsDisabled(fieldsConfig, formData) {
	const disabled = {};
	
	fieldsConfig.forEach(field => {
		if (field.disabled) {
			disabled[field.key] = evaluateRule(field.disabled, formData, field);
		} else {
			// 没有 disabled，默认不禁用
			disabled[field.key] = false;
		}
	});
	
	return disabled;
}

/**
 * 测试用例（开发时使用）
 */
export function testRuleEvaluator() {
	const formData = {
		age: 20,
		status: 'active',
		login_appid_type: 1,
		user: {
			role: 'admin',
		},
	};
	
	const tests = [
		{ rule: 'age>=18', expected: true },
		{ rule: 'age<18', expected: false },
		{ rule: 'age==20', expected: true },
		{ rule: 'age=20', expected: true },
		{ rule: 'age!=20', expected: false },
		{ rule: "status=='active'", expected: true },
		{ rule: "status in ['active','pending']", expected: true },
		{ rule: "status in ['inactive','banned']", expected: false },
		{ rule: 'login_appid_type==1', expected: true },
		{ rule: 'age>=18 && status=="active"', expected: true },
		{ rule: 'age<18 || status=="active"', expected: true },
		{ rule: 'user.role=="admin"', expected: true },
		{ rule: (data) => data.age >= 18, expected: true },
	];
	
	console.log('Testing Rule Evaluator:');
	tests.forEach((test, index) => {
		const result = evaluateRule(test.rule, formData);
		const pass = result === test.expected;
		console.log(`Test ${index + 1}: ${pass ? '✅' : '❌'}`, test.rule, '→', result);
	});
}

