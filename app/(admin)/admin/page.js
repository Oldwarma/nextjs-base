import Link from "next/link";
export default function AdminDashboard() {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen">
			<h1 className="text-4xl font-bold">Admin Dashboard</h1>
			<p className="mt-4 text-lg text-gray-600">Administration Panel</p>
			<div className="mt-8 flex gap-4">
					<Link
					href="/admin/users"
					className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
				>
					User Management
				</Link>
					<Link
					href="/admin/packages"
					className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
				>
					Package Management
				</Link>
				<Link
					href="/admin/credits"
					className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
				>
					Credit Management
				</Link>
			</div>
		</div>
	);
}

