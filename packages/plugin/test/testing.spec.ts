import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, createTestingPlugin, PluginOptions } from '../src/testing.js';
import { AnnouncementOptions, createLiveRegionPlugin, LiveBoundary, LiveBoundaryApi } from '../src/index.js';
import { DummyComponent, withDirective } from './test-utils.js';
import { mount } from '@vue/test-utils';
import { h, nextTick, ref } from 'vue';
import { AnnouncementType } from '../src/announcer.js';
import { noop } from '../src/utils.js';

const pluginCleanup = vi.fn();

vi.mock(import('../src/plugin.js'), async (importOriginal) => {
	const original = await importOriginal();
	return {
		...original,
		createPluginInternal: (options) => {
			const pluginInstance = original.createPluginInternal(options);
			return {
				install: pluginInstance.install,
				cleanup: () => {
					pluginCleanup();
					pluginInstance.cleanup();
				},
			};
		},
	};
});

afterEach(() => {
	vi.clearAllMocks();
	vi.useRealTimers();
});

describe('The global cleanup', () => {
	test('cleans up all test plugin instances', () => {
		createTestingPlugin();
		createTestingPlugin();

		cleanup();
		expect(pluginCleanup).toHaveBeenCalledTimes(2);

		// They don't get called again after
		cleanup();
		expect(pluginCleanup).toHaveBeenCalledTimes(2);
	});

	test('does not clean up production plugin instances', () => {
		createLiveRegionPlugin();

		cleanup();
		expect(pluginCleanup).not.toHaveBeenCalled();
	});
});

describe.each<{ timer: string; options: PluginOptions; prep: () => void }>([
	{ timer: 'real', options: {}, prep: noop },
	{ timer: 'fake', options: { advanceTimersFn: vi.advanceTimersByTime }, prep: () => vi.useFakeTimers() },
])('The test plugin, with a $timer timer', ({ options, prep }) => {
	const announcement = 'Component is ready';

	beforeEach(prep);

	async function mountWithPlugin<T extends Parameters<typeof mount>[0]>(vnode: T) {
		const plugin = createTestingPlugin(options);
		const wrapper = mount(vnode, { attachTo: document.body, global: { plugins: [ plugin ] } });

		await plugin.waitUntilReady();

		return { wrapper, ...plugin };
	}

	describe.each<{ type: AnnouncementOptions['type']; handledType: AnnouncementType }>([
		{ type: 'status', handledType: 'status' },
		{ type: 'alert', handledType: 'alert' },
		{ type: undefined, handledType: 'status' },
	])('catches announcements with type $type from', ({ type, handledType }) => {
		test('the composable', async () => {
			const { wrapper, getAnnouncements } = await mountWithPlugin(h(DummyComponent));

			await wrapper.setProps({ text: announcement, type });

			const announcements = await getAnnouncements();
			expect(announcements).toHaveLength(1);
			expect(announcements[0]).toEqual({
				text: announcement,
				sourceElement: wrapper.element,
				handlerElement: document.body,
				type: handledType,
			});
		});

		test('the directive', async () => {
			const text = ref('');
			const { wrapper, getAnnouncements } = await mountWithPlugin(withDirective(() => h('span', text.value), { modifiers: { alert: type === 'alert' } }));

			text.value = announcement;
			await nextTick();

			const announcements = await getAnnouncements();
			expect(announcements).toHaveLength(1);
			expect(announcements[0]).toEqual({
				text: announcement,
				sourceElement: wrapper.element,
				handlerElement: document.body,
				type: handledType,
			});
		});

		describe('the live boundary', () => {
			test('announce function', async () => {
				const { wrapper, getAnnouncements } = await mountWithPlugin(h(LiveBoundary, () => h('div')));
				const instance = wrapper.vm as unknown as LiveBoundaryApi;

				instance.announce(announcement, { type });

				const announcements = await getAnnouncements();
				expect(announcements).toHaveLength(1);
				expect(announcements[0]).toEqual({
					text: announcement,
					sourceElement: wrapper.element,
					handlerElement: wrapper.element,
					type: handledType,
				});
			});

			test('when a child component calls the global announce function', async () => {
				const text = ref('');
				const { wrapper, getAnnouncements } = await mountWithPlugin(() => h(LiveBoundary, () => h(DummyComponent, { text: text.value, type })));

				text.value = announcement;
				await nextTick();

				const announcements = await getAnnouncements();
				expect(announcements).toHaveLength(1);
				expect(announcements[0]).toEqual({
					text: announcement,
					sourceElement: wrapper.getComponent(DummyComponent).element,
					handlerElement: wrapper.element,
					type: handledType,
				});
			});

			test('when a child component has the directive', async () => {
				const childId = 'child';
				const text = ref('');
				const { wrapper, getAnnouncements } = await mountWithPlugin(() => h(LiveBoundary, () => h(withDirective(() => h('span', { id: childId, innerText: text.value }), { modifiers: { alert: type === 'alert' } }))));

				text.value = announcement;
				await nextTick();

				const announcements = await getAnnouncements();
				expect(announcements).toHaveLength(1);
				expect(announcements[0]).toEqual({
					text: announcement,
					sourceElement: wrapper.get(`span#${childId}`).element,
					handlerElement: wrapper.element,
					type: handledType,
				});
			});
		});
	});

	test('can clear the collected announcements', async () => {
		const text = ref('');
		const { getAnnouncements, clearAnnouncements } = await mountWithPlugin(() => h(DummyComponent, { text: text.value }));

		text.value = announcement;
		await nextTick();

		expect((await getAnnouncements())).toHaveLength(1);

		await clearAnnouncements();
		expect((await getAnnouncements())).toHaveLength(0);
	});

	test('delegates the instance-specific cleanup', () => {
		const { cleanup } = createTestingPlugin();

		cleanup();
		expect(pluginCleanup).toHaveBeenCalled();
	});

	test('cleans up after itself when the app is unmounted', async () => {
		const text = ref('');
		const { wrapper } = await mountWithPlugin(() => h(DummyComponent, { text: text.value }));

		/*
			This tests implicitly that there are no dangling announcements
			that could trigger an UnmountedAnnouncementError
		 */
		text.value = announcement;
		await nextTick();

		wrapper.unmount();
		expect(pluginCleanup).toHaveBeenCalled();
	});

});
