'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { FileJson, FileCode, Monitor, Code2 } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Image from 'next/image';
import SectionHeader from './section-header';

const TRADITIONAL_CODE = `// Traditional Way - 500+ lines of code
const UserPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, size: 10 });
  const [filters, setFilters] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  
  // Manual column definitions...
  // Manual pagination logic...
  // Manual filter handlers...
  // Manual form validation...
  // Manual API calls...
  // Manual error handling...
  // ... hundreds more lines
  
  return (
    <div>
      <Table columns={columns} dataSource={data} />
      <Modal visible={modalVisible}>
        <Form>{/* Complex form fields */}</Form>
      </Modal>
    </div>
  )
}`;

const NEXTJS_BASE_CODE = `// NextJS Base - Just Configuration
const fieldsConfig = [
  {
    key: 'basic-group',
    title: 'Basic Information',
    type: 'group',
    columns: [
      {
        key: 'title',
        title: 'Title',
        type: 'text',
        form: { required: true },
        search: { enabled: true },
      },
      {
        key: 'status',
        title: 'Status',
        type: 'select',
        data: statusOptions,
        search: { enabled: true },
      },
    ],
  },
  {
    key: 'media-group',
    title: 'Media Files',
    type: 'group',
    columns: [
      { key: 'coverImage', title: 'Cover', type: 'image' },
      { key: 'gallery', title: 'Gallery', type: 'images', form: { max: 6 } },
    ],
  },
];

export default function Page() {
  return (
    <SmartCrudPage
      fieldsConfig={fieldsConfig}
      actions={actions}
      enableCreate
      enableEdit
      enableDelete
    />
  );
}`;

export default function CodeShowcase() {
	const t = useTranslations('home.showcase');
	const { resolvedTheme } = useTheme();
	const [activeTab, setActiveTab] = useState('base'); // 'base', 'traditional', 'preview'
	const isDark = resolvedTheme === 'dark';

	return (
		<section className='py-24 relative overflow-hidden bg-zinc-100 dark:bg-zinc-950'>
			<div className='container mx-auto px-4'>
				<SectionHeader
					title={t('title')}
					subtitle={t('subtitle')}
				/>

				{/* Stacked Container */}
				<div className='relative max-w-5xl mx-auto'>
					{/* Glow Background */}
					<div
						aria-hidden
						className='absolute -inset-x-20 top-50 bottom-0 z-0 w-full opacity-60 blur-3xl pointer-events-none'
						style={{
							background:
								'radial-gradient(ellipse 60% 50% at 30% 30%, rgba(59,130,246,0.25), transparent), radial-gradient(ellipse 50% 40% at 70% 20%, rgba(139,92,246,0.2), transparent), radial-gradient(ellipse 60% 50% at 50% 90%, rgba(45,212,191,0.2), transparent)',
						}}
					/>
					{/* Tab Buttons - Outside the card */}
					<div className='relative z-10 flex justify-center gap-2 mb-6'>
						<button
							onClick={() => setActiveTab('preview')}
							className={`px-5 py-2.5 text-sm rounded-full transition-all flex items-center gap-2 border ${
								activeTab === 'preview'
									? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30 font-medium'
									: 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 bg-white/50 dark:bg-zinc-900/50'
							}`}
						>
							<Monitor size={16} />
							Live Preview
						</button>
						<button
							onClick={() => setActiveTab('base')}
							className={`px-5 py-2.5 text-sm rounded-full transition-all flex items-center gap-2 border ${
								activeTab === 'base'
									? 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30 font-medium'
									: 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 bg-white/50 dark:bg-zinc-900/50'
							}`}
						>
							<FileJson size={16} />
							NextJS Base
						</button>
						<button
							onClick={() => setActiveTab('traditional')}
							className={`px-5 py-2.5 text-sm rounded-full transition-all flex items-center gap-2 border ${
								activeTab === 'traditional'
									? 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30 font-medium'
									: 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 bg-white/50 dark:bg-zinc-900/50'
							}`}
						>
							<FileCode size={16} />
							Traditional
						</button>
					</div>

					{/* Stacked Cards Container */}
					<div className='relative z-10 h-[520px]'>
						{/* Code Editor Card */}
						<div
							className={`absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border border-zinc-300 dark:border-zinc-800 bg-[#f8f8f8] dark:bg-[#1e1e1e] transition-all duration-500 ease-out ${
								activeTab === 'preview' ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
							}`}
						>
							{/* Window Header */}
							<div className='flex items-center justify-between px-4 py-3 bg-zinc-200 dark:bg-[#252526] border-b border-zinc-300 dark:border-white/5'>
								<div className='flex items-center gap-2'>
									<div className='w-3 h-3 rounded-full bg-[#ff5f56]' />
									<div className='w-3 h-3 rounded-full bg-[#ffbd2e]' />
									<div className='w-3 h-3 rounded-full bg-[#27c93f]' />
									<span className='ml-4 text-zinc-600 dark:text-zinc-500 text-sm font-mono'>
										{activeTab === 'base' ? 'smart-crud.js' : 'traditional.js'}
									</span>
								</div>
								<div className='flex items-center gap-2 text-zinc-600 dark:text-zinc-500 text-xs'>
									<Code2 size={14} />
									{activeTab === 'base' ? '~70 lines' : '500+ lines'}
								</div>
							</div>

							{/* Code Content */}
							<div className='relative h-[calc(100%-48px)]'>
								<SyntaxHighlighter
									language='javascript'
									style={isDark ? atomDark : oneLight}
									customStyle={{
										margin: 0,
										padding: '1.5rem',
										background: isDark ? '#1e1e1e' : '#f8f8f8',
										fontSize: '0.875rem',
										lineHeight: '1.6',
										height: '100%',
									}}
									showLineNumbers={true}
									wrapLines={true}
								>
									{activeTab === 'base' ? NEXTJS_BASE_CODE : TRADITIONAL_CODE}
								</SyntaxHighlighter>

								{/* Badge */}
								{activeTab === 'base' && (
									<div className='absolute bottom-4 right-4 bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md'>
										✨ 90% Less Code
									</div>
								)}
								{activeTab === 'traditional' && (
									<div className='absolute bottom-4 right-4 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md'>
										😫 Repetitive Boilerplate
									</div>
								)}
							</div>
						</div>

						{/* Preview Card */}
						<div
							className={`absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 transition-all duration-500 ease-out ${
								activeTab === 'preview' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
							}`}
						>
							{/* Browser Chrome */}
							<div className='flex items-center gap-2 px-4 py-2 bg-zinc-200 dark:bg-zinc-800 border-b border-zinc-300 dark:border-zinc-700'>
								<div className='flex items-center gap-1.5'>
									<div className='w-3 h-3 rounded-full bg-[#ff5f56]' />
									<div className='w-3 h-3 rounded-full bg-[#ffbd2e]' />
									<div className='w-3 h-3 rounded-full bg-[#27c93f]' />
								</div>
								<div className='flex-1 mx-4'>
									<div className='bg-zinc-300 dark:bg-zinc-700 rounded-md px-4 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 font-mono max-w-md mx-auto text-center'>
										https://admin-demo.nextjsbase.com/example/data-table
									</div>
								</div>
							</div>

							{/* Screenshot Area */}
							<div className='relative h-[calc(100%-48px)] bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center'>
								{/* Placeholder - Replace with actual screenshot */}
								{/* <div className='text-center text-zinc-500'>
									<Monitor size={64} className='mx-auto mb-4 opacity-30' />
									<p className='text-lg font-medium'>Admin Screenshot</p>
									<p className='text-sm mt-1'>Place your screenshot at:</p>
									<code className='text-xs bg-zinc-800 px-2 py-1 rounded mt-2 inline-block'>
										/public/screenshots/admin-preview.png
									</code>
								</div> */}
								{/* Uncomment when you have the screenshot */}

								<Image
									src='/screenshots/admin-preview.png'
									alt='Admin Panel Preview'
									fill
									className='object-cover object-top'
								/>

								{/* Badge */}
								<div className='absolute bottom-4 right-4 bg-blue-500/10 border border-blue-500/30 text-blue-400 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md'>
									🎨 Auto-generated UI
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
