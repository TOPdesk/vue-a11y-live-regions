import { InjectionKey } from 'vue';
import { AnnouncerManager } from './announcer.js';

/*
	Had to move these out here from plugin.ts, because Vitest browser mode had some issues where Symbols were
	not matching between imports, rendering the injection in useAnnouncer useless.
*/
export const globalListenerIdKey: InjectionKey<symbol> = Symbol('global-listener-id-key');
export const announcerManagerKey: InjectionKey<AnnouncerManager> = Symbol('announcer-manager-key');

export const noop = () => {};

export const INITIAL_TIMEOUT = 100;
export const BUFFER_TIMEOUT = 0;

// Credit to: https://github.com/kentor/flush-promises
const scheduler = typeof setImmediate === 'function' ? setImmediate : setTimeout;
export function flushPromises() {
	return new Promise((resolve) => {
		scheduler(resolve, 0);
	});
}

/**
 * Naive implementation of a visibility check.
 * This is replacing `HTMLElement.checkVisibility()`, as that one relies on the browser recalculating the layout and/or repainting,
 * which makes it flaky to use in the directive updates without hooking into animation frames.
 * @param element to be checked
 * @param [checkContentVisibility=false] whether content-visibility should be taken into account (this is always considered `true` for ancestors of the element)
 * @returns whether the element is considered visible
 */
export function checkVisibility(element: HTMLElement, checkContentVisibility: boolean = false): boolean {
	const { display, contentVisibility } = getComputedStyle(element);

	return display !== 'none' &&
		(!checkContentVisibility || contentVisibility !== 'hidden') &&
		(!element.parentElement || checkVisibility(element.parentElement, true));
};
