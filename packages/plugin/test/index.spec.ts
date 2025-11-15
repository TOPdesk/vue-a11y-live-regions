import { describe, test, expect, vi } from 'vitest';
import { createApp, h } from 'vue';
import { createLiveRegionPlugin } from '../src/index.js';
import { createPluginInternal } from '../src/plugin.js';

const mockPlugin = {
	cleanup: vi.fn(),
	install: vi.fn(),
};

const waitForElement = vi.fn();

vi.mock(import('../src/plugin.js'));
vi.mocked(createPluginInternal).mockReturnValue(mockPlugin);

describe('The production plugin', () => {
	test('creates the correct internal instance', () => {
		const prodPlugin = createLiveRegionPlugin({ waitForElement });
		expect(createPluginInternal).toHaveBeenCalledWith({ waitForElement });

		const app = createApp(h('div'));
		prodPlugin.install(app);
		expect(mockPlugin.install).toHaveBeenCalledWith(app);

		prodPlugin.cleanup();
		expect(mockPlugin.cleanup).toHaveBeenCalled();
	});
});
