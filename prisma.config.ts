import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
	earlyAccess: true,
	schema: 'prisma/schema.prisma',
	migrate: {
		migrations: 'prisma/migrations',
	},
	datasource: {
		url: process.env.DATABASE_URL!,
	},
});

