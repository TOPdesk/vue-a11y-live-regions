import { defineComponent, Directive, getCurrentInstance, h, inject, ObjectPlugin, onMounted, ref, SlotsType, withModifiers } from 'vue';
import { createGlobalListener } from './global-listener.js';
import { announcementEventName, AnnouncementHandledHook, AnnouncerManager, requestAnnouncement, GlobalAnnouncementRequestEvent, AnnouncementType } from './announcer.js';
import { announcerManagerKey, checkVisibility, globalListenerIdKey, INITIAL_TIMEOUT } from './utils.js';

export interface InternalPluginOptions {
	waitForElement?: WaitForElement;
	onAnnouncement?: AnnouncementHandledHook;
};

export type PublicPluginOptions = Pick<InternalPluginOptions, 'waitForElement'>;

export type CreatePluginReturnType = ObjectPlugin & {
	cleanup: () => void;
};

export interface AnnouncementOptions {
	type?: AnnouncementType;
}

export type Announcer = (text: string, options?: AnnouncementOptions) => void;

export interface LiveBoundaryApi {
	announce: Announcer;
}

export type WaitForElement = (element: HTMLElement) => Promise<unknown>;

export interface VLiveDirectiveValue {
	disabled?: boolean;
	text?: string;
}

export type VLiveDirectiveModifiers = 'alert';

export type VLiveDirective<T extends HTMLElement = HTMLElement> = Directive<T, VLiveDirectiveValue | undefined, VLiveDirectiveModifiers, Extract<keyof T, string> | (string & {})>; // Allow custom values, while preserving autocomplete for concrete values

interface HtmlElementWithCustomProperties extends HTMLElement {
	[key: string]: unknown;
}

export function createPluginInternal({ waitForElement, onAnnouncement }: InternalPluginOptions = {}): CreatePluginReturnType {
	const announcerManager = AnnouncerManager(onAnnouncement);
	const { id, mount, unmount } = createGlobalListener(announcerManager);

	return {
		/** Clean up the DOM changes caused by this specific plugin instance */
		cleanup() {
			unmount();
		},
		install(app) {
			// Checking if it's a function for non-typescript consumers
			const waitForElementToBeReady = waitForElement && typeof waitForElement === 'function' ? waitForElement : () => Promise.resolve();

			app.directive('live', createDirective(id, waitForElementToBeReady));
			app.provide(globalListenerIdKey, id);
			app.provide(announcerManagerKey, announcerManager);
			app.onUnmount(this.cleanup);
			skipFirstLoadAnnouncements(announcerManager);

			mount();
		},
	};
}

/**
 * Calling `useAnnouncer` in a `setup` function will provide you with a function that can be used to programmatically announce changes.

 * Important notes:
 * - the provided function should only be used _after_ the component is mounted
 * - it's recommended to only call the `useAnnouncer` function in components with a single root element
 */
export function useAnnouncer(): Announcer {
	const globalListenerId = inject(globalListenerIdKey);

	if (!globalListenerId) {
		throw new Error('You tried to call "useAnnouncer" outside of a setup() function, or the plugin is not installed.');
	}

	// Retrieving this once so event listeners can also use it
	const instance = getCurrentInstance();

	const announce: Announcer = (text, options) => {
		const sourceElement = instance?.proxy?.$el;

		if (!sourceElement) {
			throw new Error('Could not dispatch announcement. Is the component mounted?');
		}

		// triggering it from the component boundary, so live boundaries in ancestors can catch the announcement
		requestAnnouncement({ sourceElement, text, globalListenerId, type: options?.type });
	};

	return announce;
}

/**
 * The `LiveBoundary` component can be wrapped around a part of the component tree to introduce a boundary layer for announcements made by the plugin.
 *
 * In reality, this means that the announcements will happen directly in this component (instead of the `document.body`), increasing the chances of screen readers finding them relevant.
 *
 * *Only use this component if announcements are not happening otherwise.*
 */
export const LiveBoundary = defineComponent({
	slots: Object as SlotsType<{
		default: { announce: Announcer };
	}>,
	setup(_, { slots, expose }) {
		const announcerManager = inject(announcerManagerKey);

		if (!announcerManager) {
			throw new Error('You tried using the LiveBoundary component, but the plugin is not installed.');
		}

		const announcer = announcerManager.createAnnouncer();
		const wrapper = ref<HTMLDivElement | null>(null);

		onMounted(() => {
			if (!wrapper.value) return;
			announcer.mount(wrapper.value);
		});

		const announce: Announcer = (text, options) => {
			// This is not a very realistic scenario
			if (!wrapper.value) {
				throw new Error(`The live boundary component failed to announce "${text}", as it is not mounted.`);
			}

			announcer.announce({ text, sourceElement: wrapper.value, type: options?.type });
		};

		expose<LiveBoundaryApi>({
			announce,
		});

		return () => h('div', {
			[`on${kebabToPascalCase(announcementEventName)}`]: withModifiers((({ detail }: GlobalAnnouncementRequestEvent) => {
				announcer.announce({ sourceElement: detail.sourceElement, text: detail.text, type: detail.type });
			}) as EventListener, ['stop']),
			ref: wrapper,
		}, slots.default ? [ slots.default({ announce }) ] : undefined);
	},
});

function createDirective(globalListenerId: symbol, waitForElementToBeReady: WaitForElement): VLiveDirective<HtmlElementWithCustomProperties> {
	// This is called when the parent is mounted/updated
	return async (sourceElement, { arg: sourceProperty, value, modifiers }) => {
		await waitForElementToBeReady(sourceElement);

		if (!checkVisibility(sourceElement) || value?.disabled === true) {
			sourceElement.dataset.lastAnnounced = '';
			return;
		};

		const newAnnouncement = value?.text || sourceElement[sourceProperty ?? 'innerText'];
		// Adding this to the element itself so we can avoid re-announcing things when something else changes in the parent, and the status region already announced sth else in the meantime
		const oldAnnouncement = sourceElement.dataset.lastAnnounced;

		if (newAnnouncement && typeof newAnnouncement === 'string' && newAnnouncement !== oldAnnouncement) {
			requestAnnouncement({ sourceElement, text: newAnnouncement, globalListenerId, type: modifiers.alert ? 'alert' : 'status' });
			sourceElement.dataset.lastAnnounced = newAnnouncement;
		}
	};
}

function kebabToPascalCase(text: string) {
	return text
			.split('-')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join('');
}

function skipFirstLoadAnnouncements(announcerManager: AnnouncerManager) {
	announcerManager.allowAnnouncements(false);

	setTimeout(() => {
		announcerManager.allowAnnouncements(true);
	}, INITIAL_TIMEOUT);
}
