import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
	plugins: [vue()],
	test: {
		browser: {
			provider: playwright(),
			enabled: true,
			screenshotFailures: false,
			headless: true,
			instances: [
				{ browser: 'chromium' },
			],
		},
		retry: 3,
		coverage: {
			provider: 'v8',
			include: ['src'],
		},
		setupFiles: ['./test/test-setup.ts'],
	},
});
