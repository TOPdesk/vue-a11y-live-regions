import { afterEach, assert, beforeEach, describe, expect, test, vi } from 'vitest';
import { AnnouncementOptions, Announcer, createPluginInternal, LiveBoundary, LiveBoundaryApi, PluginOptions, useAnnouncer } from '../src/plugin.js';
import { mount } from '@vue/test-utils';
import { FunctionalComponent, h, nextTick, Ref, ref, vShow, withDirectives } from 'vue';
import { AnnouncementType, AnnouncerManager, InternalAnnouncer, requestAnnouncement } from '../src/announcer.js';
import { DummyComponent, withDirective } from './test-utils.js';
import { createGlobalListener } from '../src/global-listener.js';
import { flushPromises } from '../src/utils.js';

vi.mock(import('../src/announcer.js'), { spy: true });

vi.mock(import('../src/global-listener.js'), async (importOriginal) => {
	const module = await importOriginal();

	return {
		createGlobalListener: vi.fn((announcerManager) => {
			const result = module.createGlobalListener(announcerManager);

			return {
				id: result.id,
				mount: vi.fn(result.mount),
				unmount: vi.fn(result.unmount),
			};
		}),
	};
});

const boundaryAnnouncer: InternalAnnouncer = {
	announce: vi.fn(),
	mount: vi.fn(),
	unmount: vi.fn(),
};

const globalAnnouncer: InternalAnnouncer = {
	announce: vi.fn(),
	mount: vi.fn(),
	unmount: vi.fn(),
};

const announcerManager: AnnouncerManager = {
	allowAnnouncements: vi.fn(),
	createAnnouncer: vi.fn(),
};

vi.mocked(AnnouncerManager).mockReturnValue(announcerManager);

beforeEach(() => {
	vi.mocked(announcerManager.createAnnouncer)
			.mockReset()
			.mockReturnValueOnce(globalAnnouncer)
			.mockReturnValueOnce(boundaryAnnouncer);
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('The plugin', () => {
	test('mounts a global listener correctly', async () => {
		const onAnnouncementMock = vi.fn();

		await mountWithPlugin(() => h('div'), { onAnnouncement: onAnnouncementMock });

		const globalListener = getGlobalListener();

		expect(vi.mocked(AnnouncerManager)).toHaveBeenCalledWith(onAnnouncementMock);
		expect(vi.mocked(createGlobalListener)).toHaveBeenCalledWith(announcerManager);
		expect(globalListener.mount).toHaveBeenCalled();
	});

	test('cleans up its global listener when the app is unmounted', async () => {
		const { wrapper } = await mountWithPlugin(() => h('div'));

		wrapper.unmount();
		expect(getGlobalListener().unmount).toHaveBeenCalled();
	});

	test('cleans up its global listener on manual cleanup', async () => {
		const { cleanup } = await mountWithPlugin(() => h('div'));

		cleanup();
		expect(getGlobalListener().unmount).toHaveBeenCalled();
	});
});

describe('The directive', () => {
	const initialText = 'Not ready';
	const updatedText = 'Ready';

	test('can be suspended and reactivated', async () => {
		const text = ref(initialText);
		const disabled = ref(true);

		const { wrapper } = await mountWithPlugin(withDirective(h('div'), { value: () => ({ text: text.value, disabled: disabled.value }) }));

		expect(requestAnnouncement).not.toHaveBeenCalled();

		text.value = updatedText;
		await flushPromises();

		expect(requestAnnouncement).not.toHaveBeenCalled();

		disabled.value = false;
		await flushPromises();

		expectCorrectAnnouncementRequest(wrapper.element, updatedText, 'status');
	});

	test.each([
		{
			name: 'directly',
			setup: async (show: Ref) => {
				const { wrapper } = await mountWithPlugin(withDirective(() => h('div', initialText), undefined, show));
				return { wrapper, sourceElement: wrapper.element };
			},
		},
		{
			name: 'by an ancestor',
			setup: async (show: Ref) => {
				const { wrapper } = await mountWithPlugin(() => withDirectives(h('div', h('div', withDirective(() => h('span', initialText))())), [[vShow, show.value]]));
				return { wrapper, sourceElement: wrapper.get('span').element };
			},
		},
	])('can re-announce the same text after being hidden $name', async ({ setup }) => {
		const show = ref(true);
		const { wrapper, sourceElement } = await setup(show);

		expect(requestAnnouncement).toHaveBeenCalledOnce();
		expectCorrectAnnouncementRequest(sourceElement, initialText, 'status');

		show.value = false;
		await flushPromises();
		expect(wrapper.isVisible()).toBe(false);
		expect(requestAnnouncement).toHaveBeenCalledOnce();

		show.value = true;
		await flushPromises();
		expect(wrapper.isVisible()).toBe(true);
		expect(requestAnnouncement).toHaveBeenCalledTimes(2);
	});

	test('can re-announce the same text after being re-enabled', async () => {
		const disabled = ref(false);
		const { wrapper } = await mountWithPlugin(withDirective(() => h('div', initialText), { value: () => ({ disabled: disabled.value }) }));

		const element: HTMLDivElement = wrapper.element;
		expect(requestAnnouncement).toHaveBeenCalledOnce();
		expectCorrectAnnouncementRequest(element, initialText, 'status');

		disabled.value = true;
		await flushPromises();
		expect(requestAnnouncement).toHaveBeenCalledOnce();

		disabled.value = false;
		await flushPromises();
		expect(requestAnnouncement).toHaveBeenCalledTimes(2);
	});

	test.each([
		{ name: 'inner text', setup: (textRef: Ref<string>) => mountWithPlugin(withDirective(() => h('span', { innerText: textRef.value }))) },
		{ name: 'text value', setup: (textRef: Ref<string>) => mountWithPlugin(withDirective(() => h('div'), { value: () => ({ text: textRef.value }) })) },
		{ name: 'custom element property', setup: (textRef: Ref<string>) => mountWithPlugin(withDirective(() => h('directive-custom-element', { content: textRef.value }), { arg: 'content' })) },
		{ name: 'HTML element property', setup: (textRef: Ref<string>) => mountWithPlugin(withDirective(() => h('span', { ariaLabel: textRef.value }), { arg: 'ariaLabel' })) },
	])('works with a reactive $name', async ({ setup }) => {
		const text = ref(initialText);
		const { wrapper } = await setup(text);

		expectCorrectAnnouncementRequest(wrapper.element, initialText, 'status');

		text.value = updatedText;
		await flushPromises();

		expectCorrectAnnouncementRequest(wrapper.element, updatedText, 'status');
	});

	test('prevents repetitive announcements when something unobserved changes', async () => {
		const divText = ref(initialText);
		const observedText = ref(initialText);
		await mountWithPlugin(withDirective(() => h('div', [ divText.value ]), { value: () => ({ text: observedText.value }) }));

		expect(requestAnnouncement).toHaveBeenCalledOnce();

		divText.value = updatedText;
		await flushPromises();

		// The observed text value didn't change, so it's not announced again, even if the directive hook is called
		expect(requestAnnouncement).toHaveBeenCalledOnce();
	});

	test('prevents entering an empty string', async () => {
		const text = ref(initialText);
		await mountWithPlugin(withDirective(h('div'), { value: () => ({ text: text.value }) }));

		expect(requestAnnouncement).toHaveBeenCalledOnce();

		text.value = '';
		await flushPromises();

		expect(requestAnnouncement).toHaveBeenCalledOnce();
	});

	test.each([
		// @ts-expect-error Explicitly testing wrong input
		{ name: 'the text directive value', setup: () => mountWithPlugin(withDirective(h('div'), { value: () => ({ text: () => {} }) })) },
		{ name: 'an element property', setup: () => mountWithPlugin(withDirective(h('div'), { arg: 'click' })) },
	])('prevents setting a non-string value from $name', async ({ setup }) => {
		await setup();

		expect(requestAnnouncement).not.toHaveBeenCalled();
	});

	test('waits for the element to be ready', async () => {
		let resolvePromise = (_?: unknown) => {};
		const asyncElementResolvedText = 'I am ready';
		const elementPromise = (element: HTMLElement) => new Promise((resolve) => {
			resolvePromise = resolve;
		}).then(() => { element.innerText = asyncElementResolvedText; });

		const { wrapper } = await mountWithPlugin(withDirective(h('div')), { waitForElement: elementPromise });

		expect(requestAnnouncement).not.toHaveBeenCalled();

		resolvePromise();
		await flushPromises();

		expectCorrectAnnouncementRequest(wrapper.element, asyncElementResolvedText, 'status');
	});

	test('can announce changes as an alert', async () => {
		const text = ref(initialText);
		const { wrapper } = await mountWithPlugin(withDirective(() => h('span', { innerText: text.value }), { modifiers: { alert: true } }));

		expectCorrectAnnouncementRequest(wrapper.element, initialText, 'alert');
	});
});

describe('useAnnouncer', () => {
	test('throws an error if used outside of a setup function', async () => {
		await mountWithPlugin(() => h('div'));
		expect(() => useAnnouncer()).toThrowError('You tried to call "useAnnouncer" outside of a setup() function, or the plugin is not installed.');
	});

	test('throws an error if the plugin is not installed', () => {
		expect(() => mount(DummyComponent)).toThrowError('You tried to call "useAnnouncer" outside of a setup() function, or the plugin is not installed.');
	});

	test('throws an error if an announcement is dispatched before the component is mounted', async () => {
		const DummyComponent: FunctionalComponent = () => {
			const announce = useAnnouncer();
			announce('hello');

			return h('div');
		};
		await expect(() => mountWithPlugin(DummyComponent)).rejects.toThrowError('Could not dispatch announcement. Is the component mounted?');
	});

	test.each<AnnouncementOptions['type']>(['status', 'alert', undefined])('can announce changes with type %s correctly', async (type) => {
		const text = 'Ready';
		const { wrapper } = await mountWithPlugin(h(DummyComponent, { text, type }));

		expectCorrectAnnouncementRequest(wrapper.element, text, type);
	});
});

describe('The live boundary', () => {
	const initialText = 'Not Ready';
	const updatedText = 'Ready';

	test('catches the directive changes and announces them', async () => {
		const text = ref(initialText);
		const sourceElementId = 'source-id';

		const { wrapper } = await mountWithPlugin(h(LiveBoundary, withDirective(h('span', { id: sourceElementId }), { value: () => ({ text: text.value }) })));

		// First load is registered in the region
		const sourceElement = wrapper.get(`span#${sourceElementId}`).element;
		expect(boundaryAnnouncer.announce).toHaveBeenCalledWith({ sourceElement, text: initialText, type: 'status' });

		// Update is registered in the region
		text.value = updatedText;
		await flushPromises();
		expect(boundaryAnnouncer.announce).toHaveBeenCalledWith({ sourceElement, text: updatedText, type: 'status' });

		// Status updates were caught and not propagated to the global live region
		expect(globalAnnouncer.announce).not.toHaveBeenCalled();
	});

	test.each<AnnouncementOptions['type']>(['status', 'alert', undefined])('announces changes with %s type correctly when using the exposed function', async (type) => {
		const  { wrapper } = await mountWithPlugin(h(LiveBoundary, () => h('span')));
		const instance = wrapper.vm as unknown as LiveBoundaryApi;

		assert(instance.announce, 'There is no announce function exposed.');

		instance.announce(updatedText, { type });
		await nextTick();

		expect(boundaryAnnouncer.announce).toHaveBeenCalledWith({ sourceElement: wrapper.element, text: updatedText, type });
	});

	test.each<AnnouncementOptions['type']>(['status', 'alert', undefined])('announces changes with %s type correctly when called via slot props', async (type) => {
		const  { wrapper } = await mountWithPlugin(h(LiveBoundary, null, {
			default: ({ announce }: { announce: Announcer }) => h('button', { type: 'button', onClick: () => announce(updatedText, { type }) }, 'Announce'),
		}));

		wrapper.find('button').element.click();
		await nextTick();

		expect(boundaryAnnouncer.announce).toHaveBeenCalledWith({ sourceElement: wrapper.element, text: updatedText, type });
	});

	test.each<AnnouncementOptions['type']>(['status', 'alert', undefined])('catches %s type global announcements coming from child components', async (type) => {
		const announcement = 'Child component is ready';
		const { wrapper } = await mountWithPlugin(() => h(LiveBoundary, () => h(DummyComponent, { text: announcement, type })));

		await nextTick();

		expect(boundaryAnnouncer.announce).toHaveBeenCalledWith({ sourceElement: wrapper.getComponent(DummyComponent).element, text: announcement, type });
		// Status updates were caught and not propagated to the global live region
		expect(globalAnnouncer.announce).not.toHaveBeenCalled();
	});

	test('throws an error if the plugin is not installed', async () => {
		expect(() => mount(h(LiveBoundary, () => h('span')))).toThrow('You tried using the LiveBoundary component, but the plugin is not installed.');
	});
});

async function mountWithPlugin(vnode: Parameters<typeof mount>[0], options: PluginOptions = {}) {
	const plugin = createPluginInternal(options);
	const wrapper = mount(vnode, { attachTo: document.body, global: { plugins: [ plugin ] } });
	await flushPromises();

	return { wrapper, ...plugin };
}

function expectCorrectAnnouncementRequest(sourceElement: HTMLElement, text: string, type?: AnnouncementType) {
	expect(requestAnnouncement).toHaveBeenCalledWith({ text, sourceElement, globalListenerId: getGlobalListener().id, type });
}

function getGlobalListener() {
	const results = vi.mocked(createGlobalListener).mock.results;
	const lastResult = results[results.length - 1];

	if (lastResult.type !== 'return') {
		throw new Error('There was an issue creating a global listener.');
	}

	return lastResult.value;
}
