import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

const alias = process.env.NODE_ENV === 'development' ? { '@topdesk/vue-plugin-a11y-live-regions': path.resolve(__dirname, '../plugin/src') } : undefined;

export default defineConfig({
	plugins: [vue({
		template: {
			compilerOptions: {
				isCustomElement(tag) {
					return tag === 'demo-custom-element'
				}
			}
		}
	})],
	root: 'src',
	build: {
		outDir: '../dist',
		emptyOutDir: true,
	},
	base: process.env.NODE_ENV === 'production' ? '/vue-a11y-live-regions/' : '/',
	resolve: {
		alias
	}
});
