import { notFound } from 'next/navigation';

/**
 * 捕获所有不存在的 /admin/* 路径
 * 触发 not-found.js 显示自定义 404 页面
 */
export default function CatchAllAdminPage() {
	notFound();
}
