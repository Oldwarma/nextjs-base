/**
 * 静态参数生成工具函数
 * 用于统一生成 Next.js 静态页面的参数
 */

import { locales } from '@/lib/i18n';
import { PAGINATION } from '@/lib/constants/page-config';
import { flattenCategories } from './category-utils';

/**
 * 生成详情页的静态参数
 * 适用于 [slug]/page.js 类型的页面（如产品详情、新闻详情）
 * @param {Object} options - 配置选项
 * @param {Function} options.getDataFn - 获取数据列表的函数
 * @param {Object} options.queryParams - 查询参数
 * @param {string} options.logPrefix - 日志前缀
 * @returns {Array} 静态参数数组 [{ lang, slug }]
 */
export async function generateDetailParams({
  getDataFn,
  queryParams = {},
  logPrefix = '详情页',
}) {
  try {
    // 获取所有数据（使用第一个语言获取 slug 列表）
    const allData = await getDataFn({
      lang: locales[0],
      ...queryParams,
      pageIndex: 1,
      pageSize: 10000, // 获取所有数据
    });

    // 为每条数据生成所有语言版本的参数
    const params = allData.rows.flatMap((item) =>
      locales.map((lang) => ({
        lang,
        slug: item.slug,
      }))
    );

    console.log(
      `✅ 预渲染 ${params.length} 个${logPrefix} (${allData.rows.length} 条 × ${locales.length} 语种)`
    );
    return params;
  } catch (error) {
    console.error(`❌ ${logPrefix} generateStaticParams 失败:`, error);
    return []; // 失败时返回空数组，允许动态渲染
  }
}

/**
 * 生成分类首页的静态参数
 * 适用于 category/[slug]/page.js 类型的页面
 * @param {Object} options - 配置选项
 * @param {Function} options.getCategoriesFn - 获取分类的函数
 * @param {Object} options.categoryQuery - 分类查询参数
 * @param {string} options.logPrefix - 日志前缀
 * @returns {Array} 静态参数数组 [{ lang, slug }]
 */
export async function generateCategoryParams({
  getCategoriesFn,
  categoryQuery = {},
  logPrefix = '分类首页',
}) {
  try {
    // 获取所有分类
    const categoryTree = await getCategoriesFn({
      lang: locales[0],
      ...categoryQuery,
    });

    const allCategories = flattenCategories(categoryTree);

    // 为每个分类的每种语言生成参数
    const params = allCategories
      .filter((category) => category.slug)
      .flatMap((category) =>
        locales.map((lang) => ({
          lang,
          slug: category.slug,
        }))
      );

    console.log(
      `✅ 预渲染 ${params.length} 个${logPrefix} (${allCategories.length} 分类 × ${locales.length} 语种)`
    );
    return params;
  } catch (error) {
    console.error(`❌ ${logPrefix} generateStaticParams 失败:`, error);
    return [];
  }
}

/**
 * 生成标签首页的静态参数
 * 适用于 tag/[tag]/page.js 类型的页面
 * @param {Object} options - 配置选项
 * @param {Function} options.getDataFn - 获取数据列表的函数
 * @param {Object} options.queryParams - 查询参数
 * @param {number} options.maxTags - 最大预生成标签数
 * @param {string} options.logPrefix - 日志前缀
 * @returns {Array} 静态参数数组 [{ lang, tag }]
 */
export async function generateTagParams({
  getDataFn,
  queryParams = {},
  maxTags = 10,
  logPrefix = '标签页',
}) {
  try {
    // 获取所有数据以提取标签
    const allData = await getDataFn({
      lang: locales[0],
      ...queryParams,
      pageIndex: 1,
      pageSize: 1000,
    });

    // 提取所有标签并统计频率
    const tagCounts = {};
    allData.rows?.forEach((item) => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    // 按频率排序，取热门标签
    const hotTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxTags)
      .map(([tag]) => tag);

    // 为每个热门标签的每种语言生成参数
    const params = hotTags.flatMap((tag) =>
      locales.map((lang) => ({
        lang,
        tag: encodeURIComponent(tag),
      }))
    );

    console.log(
      `✅ 预渲染 ${params.length} 个${logPrefix} (${hotTags.length} 热门标签 × ${locales.length} 语种)`
    );
    return params;
  } catch (error) {
    console.error(`❌ ${logPrefix} generateStaticParams 失败:`, error);
    return [];
  }
}

/**
 * 生成标签分页的静态参数
 * 适用于 tag/[tag]/page/[pageNum]/page.js 类型的页面
 * @param {Object} options - 配置选项
 * @param {Function} options.getDataFn - 获取数据列表的函数
 * @param {Object} options.queryParams - 查询参数
 * @param {number} options.maxTags - 最大预生成标签数
 * @param {number} options.maxPages - 最大预生成页数
 * @param {string} options.logPrefix - 日志前缀
 * @returns {Array} 静态参数数组 [{ lang, tag, pageNum }]
 */
export async function generateTagPaginationParams({
  getDataFn,
  queryParams = {},
  maxTags = 10,
  maxPages = 3,
  logPrefix = '标签分页',
}) {
  try {
    const params = [];
    const pageSize = PAGINATION.PAGE_SIZE;

    // 获取所有数据以提取标签
    const allData = await getDataFn({
      lang: locales[0],
      ...queryParams,
      pageIndex: 1,
      pageSize: 1000,
    });

    // 提取所有标签并统计频率
    const tagCounts = {};
    allData.rows?.forEach((item) => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    // 按频率排序，取热门标签
    const hotTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxTags)
      .map(([tag]) => tag);

    // 对每个热门标签检查页数
    for (const tag of hotTags) {
      const tagData = await getDataFn({
        lang: locales[0],
        whereJson: { tags: tag },
        pageIndex: 1,
        pageSize,
      });

      const totalPages = tagData.pagination?.totalPages || 1;

      if (totalPages > 1) {
        const pagesToGenerate = Math.min(totalPages, maxPages);

        for (const lang of locales) {
          for (let pageNum = 2; pageNum <= pagesToGenerate; pageNum++) {
            params.push({
              lang,
              tag: encodeURIComponent(tag),
              pageNum: pageNum.toString(),
            });
          }
        }
      }
    }

    console.log(`✅ 预渲染 ${params.length} 个${logPrefix}`);
    return params;
  } catch (error) {
    console.error(`❌ ${logPrefix} generateStaticParams 失败:`, error);
    return [];
  }
}

/**
 * 生成列表分页的静态参数
 * 适用于 page/[pageNum]/page.js 类型的页面
 * @param {Object} options - 配置选项
 * @param {Function} options.getDataFn - 获取数据的函数
 * @param {Object} options.queryParams - 查询参数
 * @param {number} options.maxPages - 最大预生成页数
 * @param {string} options.logPrefix - 日志前缀
 * @returns {Array} 静态参数数组 [{ lang, pageNum }]
 */
export async function generatePaginationParams({
  getDataFn,
  queryParams = {},
  maxPages = PAGINATION.MAX_STATIC_PAGES,
  logPrefix = '列表分页',
}) {
  try {
    const params = [];
    const pageSize = PAGINATION.PAGE_SIZE;

    // 查询总数以确定实际页数
    const firstLangData = await getDataFn({
      lang: locales[0],
      ...queryParams,
      pageIndex: 1,
      pageSize,
    });

    const totalPages = firstLangData.pagination?.totalPages || 1;

    // 只有超过1页才生成第2+页
    if (totalPages > 1) {
      const pagesToGenerate = Math.min(totalPages, maxPages);

      for (const lang of locales) {
        // 从第2页开始生成（第1页在主页面）
        for (let pageNum = 2; pageNum <= pagesToGenerate; pageNum++) {
          params.push({
            lang,
            pageNum: pageNum.toString(),
          });
        }
      }

      console.log(
        `✅ 预渲染 ${params.length} 个${logPrefix} (${locales.length} 语种 × ${pagesToGenerate - 1} 页，总页数: ${totalPages})`
      );
    } else {
      console.log(`ℹ️ ${logPrefix}总数不足，无需预渲染分页（总页数: 1）`);
    }

    return params;
  } catch (error) {
    console.error(`❌ ${logPrefix} generateStaticParams 失败:`, error);
    return [];
  }
}

/**
 * 生成分类分页的静态参数
 * @param {Object} options - 配置选项
 * @param {Function} options.getCategoriesFn - 获取分类树的函数
 * @param {Function} options.getDataFn - 获取数据的函数
 * @param {Object} options.categoryQuery - 分类查询参数
 * @param {Function} options.buildWhereJson - 构建数据查询条件的函数
 * @param {number} options.maxPages - 最大预生成页数
 * @param {string} options.logPrefix - 日志前缀
 * @returns {Array} 静态参数数组
 */
export async function generateCategoryPaginationParams({
  getCategoriesFn,
  getDataFn,
  categoryQuery = {},
  buildWhereJson,
  maxPages = PAGINATION.MAX_CATEGORY_PAGES,
  logPrefix = '分类分页',
}) {
  try {
    const params = [];
    const pageSize = PAGINATION.PAGE_SIZE;

    // 获取所有分类
    const categoryTree = await getCategoriesFn({
      lang: locales[0],
      ...categoryQuery,
    });

    const allCategories = flattenCategories(categoryTree);

    // 对每个分类检查页数
    for (const category of allCategories) {
      const categoryData = await getDataFn({
        lang: locales[0],
        whereJson: buildWhereJson(category.id),
        pageIndex: 1,
        pageSize,
      });

      const totalPages = categoryData.pagination?.totalPages || 1;

      if (totalPages > 1) {
        const pagesToGenerate = Math.min(totalPages, maxPages);

        for (const lang of locales) {
          for (let pageNum = 2; pageNum <= pagesToGenerate; pageNum++) {
            params.push({
              lang,
              slug: category.slug,
              pageNum: pageNum.toString(),
            });
          }
        }
      }
    }

    console.log(`✅ 预渲染 ${params.length} 个${logPrefix}`);
    return params;
  } catch (error) {
    console.error(`❌ ${logPrefix} generateStaticParams 失败:`, error);
    return [];
  }
}

/**
 * 验证并解析页码
 * @param {string|number} pageNum - 页码
 * @returns {number|null} 解析后的页码，无效时返回 null
 */
export function validatePageNumber(pageNum) {
  const page = parseInt(pageNum, 10);
  if (isNaN(page) || page < 1) {
    return null;
  }
  return page;
}

