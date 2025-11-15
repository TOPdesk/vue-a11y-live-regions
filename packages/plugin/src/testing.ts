import { CreatePluginReturnType, createPluginInternal, PluginOptions as InternalPluginOptions } from './plugin.js';
import { HandledAnnouncement, AnnouncementHandledHook } from './announcer.js';
import { BUFFER_TIMEOUT, INITIAL_TIMEOUT } from './utils.js';

interface TestHookReturnType {
	onAnnouncement: AnnouncementHandledHook;
	clearAnnouncements: () => Promise<void>;
	getAnnouncements: () => Promise<ReadonlyArray<HandledAnnouncement>>;
	waitUntilReady: () => Promise<void>;
}

type AdvanceTimersFn = (ms: number) => unknown;

export type PluginOptions = Omit<InternalPluginOptions, 'onAnnouncement'> & { advanceTimersFn?: AdvanceTimersFn };

export type CreateTestingPluginReturnType = CreatePluginReturnType & Omit<TestHookReturnType, 'onAnnouncement'>;

const cleanupFunctions: (() => void)[] = [];

function createAnnouncementHook(advanceTimersFn?: AdvanceTimersFn): TestHookReturnType {
	const announcements: HandledAnnouncement[] = [];

	const onAnnouncement: AnnouncementHandledHook = (details) => {
		announcements.push(details);
	};

	async function clearAnnouncements() {
		await waitForTimer(BUFFER_TIMEOUT);
		announcements.length = 0;
	}

	function waitUntilReady() {
		return waitForTimer(INITIAL_TIMEOUT);
	}

	async function getAnnouncements() {
		await waitForTimer(BUFFER_TIMEOUT);

		return announcements;
	}

	async function waitForTimer(time: number) {
		const promise = new Promise<void>((resolve) => {
			setTimeout(() => {
				resolve();
			}, time);
		});

		if (advanceTimersFn) {
			advanceTimersFn(time);
		}

		return promise;
	}

	return { onAnnouncement, clearAnnouncements, getAnnouncements, waitUntilReady };
}

/**
 * Creates a live region plugin that's identical to the production plugin internally, but exposes additional utilities for testing.
 *
 * Docs: [createTestingPlugin](https://github.com/TOPdesk/vue-a11y-live-regions/blob/main/docs/testing.md#createtestingplugin)
 */
export const createTestingPlugin = (options: PluginOptions = {}): CreateTestingPluginReturnType => {
	const { clearAnnouncements, onAnnouncement, getAnnouncements, waitUntilReady } = createAnnouncementHook(options.advanceTimersFn);
	const plugin = createPluginInternal({ ...options, onAnnouncement });

	cleanupFunctions.push(plugin.cleanup);

	return {
		...plugin,
		clearAnnouncements,
		getAnnouncements,
		waitUntilReady,
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
