/**
 * Metadata 生成工具函数
 * 用于统一生成页面的 metadata 配置
 */

import { generateAlternates } from '@/lib/i18n';
import { SiteConfig } from '@/lib/client';

/**
 * 生成基础 metadata 配置
 * @param {Object} options - 配置选项
 * @param {string} options.title - 页面标题
 * @param {string} options.description - 页面描述
 * @param {string} [options.keywords] - 页面关键词
 * @param {string} options.path - 页面路径（不含语言前缀）
 * @param {string} options.lang - 当前语言
 * @param {boolean} [options.includeOpenGraph=false] - 是否包含 OpenGraph 配置
 * @param {boolean} [options.includeTwitter=false] - 是否包含 Twitter 配置
 * @returns {Object} metadata 配置对象
 */
export function generateBaseMetadata({
	title,
	description,
	keywords,
	path,
	lang,
	includeOpenGraph = false,
	includeTwitter = false,
}) {
	const alternates = generateAlternates(path, lang);

	const metadata = {
		title,
		description,
		alternates,
	};

	// 添加关键词（如果提供）
	if (keywords) {
		metadata.keywords = keywords;
	}

	// 添加 OpenGraph 配置（主要页面使用）
	if (includeOpenGraph) {
		metadata.metadataBase = new URL(process.env.NEXT_PUBLIC_SITE_URL);
		metadata.openGraph = {
			...SiteConfig.openGraph,
			title,
			description,
		};
	}

	// 添加 Twitter 配置（主要页面使用）
	if (includeTwitter) {
		metadata.twitter = {
			...SiteConfig.twitter,
			title,
			description,
		};
	}

	return metadata;
}

/**
 * 生成完整 metadata 配置（包含 OpenGraph 和 Twitter）
 * 适用于主要页面（首页、关于、联系等）
 * @param {Object} options - 配置选项
 * @param {string} options.title - 页面标题
 * @param {string} options.description - 页面描述
 * @param {string} [options.keywords] - 页面关键词
 * @param {string} options.path - 页面路径（不含语言前缀）
 * @param {string} options.lang - 当前语言
 * @returns {Object} metadata 配置对象
 */
export function generateFullMetadata({ title, description, keywords, path, lang }) {
	return generateBaseMetadata({
		title,
		description,
		keywords,
		path,
		lang,
		includeOpenGraph: true,
		includeTwitter: true,
	});
}

/**
 * 生成列表页 metadata 配置
 * 适用于产品列表、新闻列表等页面
 * @param {Object} options - 配置选项
 * @param {string} options.title - 页面标题
 * @param {string} options.description - 页面描述
 * @param {string} options.path - 页面路径（不含语言前缀）
 * @param {string} options.lang - 当前语言
 * @param {number} [options.pageNum] - 页码（可选，用于分页）
 * @returns {Object} metadata 配置对象
 */
export function generateListMetadata({ title, description, path, lang, pageNum }) {
	const finalTitle = pageNum && pageNum > 1 ? `${title} - Page ${pageNum}` : title;
	const finalPath = pageNum && pageNum > 1 ? `${path}/page/${pageNum}` : path;

	return generateBaseMetadata({
		title: finalTitle,
		description,
		path: finalPath,
		lang,
	});
}

/**
 * 生成详情页 metadata 配置
 * 适用于产品详情、新闻详情等页面
 * @param {Object} options - 配置选项
 * @param {string} options.itemTitle - 条目标题（产品名/新闻标题）
 * @param {string} options.siteTitle - 站点标题
 * @param {string} options.description - 页面描述
 * @param {string} options.path - 页面路径（不含语言前缀）
 * @param {string} options.lang - 当前语言
 * @returns {Object} metadata 配置对象
 */
export function generateDetailMetadata({ itemTitle, siteTitle, description, path, lang }) {
	return generateBaseMetadata({
		title: `${itemTitle} - ${siteTitle}`,
		description,
		path,
		lang,
	});
}

/**
 * 生成分类页 metadata 配置
 * 适用于产品分类、新闻分类等页面
 * @param {Object} options - 配置选项
 * @param {string} options.categoryName - 分类名称
 * @param {string} options.pageTitle - 页面标题（模板页标题）
 * @param {string} options.description - 页面描述
 * @param {string} options.path - 页面路径（不含语言前缀）
 * @param {string} options.lang - 当前语言
 * @param {number} [options.pageNum] - 页码（可选，用于分页）
 * @returns {Object} metadata 配置对象
 */
export function generateCategoryMetadata({ categoryName, pageTitle, description, path, lang, pageNum }) {
	const baseTitle = `${categoryName} - ${pageTitle}`;
	const finalTitle = pageNum && pageNum > 1 ? `${baseTitle} - Page ${pageNum}` : baseTitle;
	const finalPath = pageNum && pageNum > 1 ? `${path}/page/${pageNum}` : path;

	return generateBaseMetadata({
		title: finalTitle,
		description,
		path: finalPath,
		lang,
	});
}

/**
 * 安全地生成 metadata（带错误处理）
 * 当数据获取失败时返回默认 metadata
 * @param {Function} metadataFn - 生成 metadata 的异步函数
 * @param {Object} fallback - 失败时的默认 metadata
 * @returns {Promise<Object>} metadata 配置对象
 */
export async function safeGenerateMetadata(metadataFn, fallback = {}) {
	try {
		return await metadataFn();
	} catch (error) {
		// console.error('❌ Metadata generation failed');
		return {
			title: fallback.title || 'Page',
			description: fallback.description || '',
			...fallback,
		};
	}
}

/**
 * 生成首页 metadata 配置
 * 适用于首页（/ 和 /[lang]）
 * @param {Object} options - 配置选项
 * @param {string} options.title - 页面标题
 * @param {string} options.description - 页面描述
 * @param {string} [options.keywords] - 页面关键词
 * @param {string} options.lang - 当前语言
 * @returns {Object} metadata 配置对象
 */
export function generateHomeMetadata({ title, description, keywords, lang }) {
	return {
		title: title || SiteConfig.name,
		description: description || SiteConfig.description,
		keywords: keywords || SiteConfig.keywords,
		authors: SiteConfig.authors,
		icons: SiteConfig.icons,
		metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://charcoalgo.com'),
		alternates: generateAlternates('/', lang),
		openGraph: {
			...SiteConfig.openGraph,
			title: title || SiteConfig.name,
			description: description || SiteConfig.description,
		},
		twitter: {
			...SiteConfig.twitter,
			title: title || SiteConfig.name,
			description: description || SiteConfig.description,
		},
	};
}
