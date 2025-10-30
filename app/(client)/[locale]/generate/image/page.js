export default function ImagePage() {
	return (
		<div className="flex flex-1 flex-col gap-4 p-4">
			<div className="grid auto-rows-min gap-4 md:grid-cols-3">
				<div className="aspect-video rounded-xl bg-muted/50" />
				<div className="aspect-video rounded-xl bg-muted/50" />
				<div className="aspect-video rounded-xl bg-muted/50" />
			</div>
			<div className="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min">
				<div className="p-8">
					<h1 className="text-2xl font-bold mb-4">Test Page</h1>
					<p className="text-muted-foreground">
						This is a test page to verify the sidebar is working correctly.
					</p>
				</div>
			</div>
		</div>
	);
}

