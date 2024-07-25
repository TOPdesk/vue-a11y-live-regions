import { CreatePluginReturnType, createPluginInternal, PluginOptions as InternalPluginOptions } from './plugin.js';
import { HandledAnnouncement, AnnouncementHandledHook } from './announcer.js';
import { flushPromises } from './utils.js';
import { nextTick } from 'vue';

interface TestHookReturnType {
	onAnnouncement: AnnouncementHandledHook;
	clearAnnouncements: () => Promise<void>;
	getAnnouncements: () => Promise<ReadonlyArray<HandledAnnouncement>>;
}

export type PluginOptions = Omit<InternalPluginOptions, 'onAnnouncement'>; // TODO: dedupe this with index.ts

export type CreateTestingPluginReturnType = CreatePluginReturnType & Omit<TestHookReturnType, 'onAnnouncement'>;

const cleanupFunctions: (() => void)[] = [];

function createAnnouncementHook(): TestHookReturnType {
	const announcements: HandledAnnouncement[] = [];

	const onAnnouncement: AnnouncementHandledHook = (details) => {
		announcements.push(details);
	};

	async function clearAnnouncements() {
		await flushPromises();
		announcements.length = 0;
	}

	async function getAnnouncements() {
		await nextTick();
		await flushPromises();
		return announcements;
	}

	return { onAnnouncement, clearAnnouncements, getAnnouncements };
}

/**
 * Creates a live region plugin, that's identical to the production plugin internally, but exposes additional utilities for testing.
 *
 * Docs: [createTestingPlugin](https://github.com/TOPdesk/vue-a11y-live-regions/blob/main/docs/testing.md#createtestingplugin)
 */
export const createTestingPlugin = (options: PluginOptions = {}): CreateTestingPluginReturnType => {
	const { clearAnnouncements, onAnnouncement, getAnnouncements } = createAnnouncementHook();
	const plugin = createPluginInternal({ ...options, onAnnouncement });

	cleanupFunctions.push(plugin.cleanup);

	return {
		...plugin,
		clearAnnouncements,
		getAnnouncements,
	};
};

/**
 * Clean up *all* registered test live regions from the document.
 *
 * **Example use-case:** cleaning up leftover live regions in the rendered DOM before/after tests.
 */
export function cleanup() {
	cleanupFunctions.forEach(fn => fn());
	cleanupFunctions.length = 0;
}
