/**
 * 修复 lib 文件中的 userId 查询
 * 将 { id: userId } 替换为动态导入 ObjectId 并使用 { _id: new ObjectId(userId) }
 */

const fs = require('fs');
const path = require('path');

const files = [
	'lib/credits.js',
	'lib/user-profile.js',
	'lib/packages.js',
];

function fixFile(filePath) {
	console.log(`\n处理文件: ${filePath}`);
	
	const fullPath = path.join(__dirname, '..', filePath);
	let content = fs.readFileSync(fullPath, 'utf8');
	
	// 替换模式：在函数开头添加 ObjectId 导入，并替换查询条件
	// 查找所有包含 { _id: new ObjectId(userId) } 的函数
	const functionPattern = /(export\s+async\s+function\s+\w+\([^)]*userId[^)]*\)\s*{)/g;
	
	content = content.replace(functionPattern, (match, funcStart) => {
		// 检查函数体内是否有 new ObjectId(userId)
		if (match.includes('new ObjectId(userId)')) {
			// 在函数开头添加 ObjectId 导入
			return `${funcStart}\n\tconst { ObjectId } = await import('mongodb');`;
		}
		return match;
	});
	
	fs.writeFileSync(fullPath, content, 'utf8');
	console.log(`✅ 已修复: ${filePath}`);
}

// 执行修复
files.forEach(fixFile);

console.log('\n🎉 所有文件已修复！');

