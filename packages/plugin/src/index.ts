
import { CreatePluginReturnType, PublicPluginOptions, VLiveDirective } from './plugin.js';
import { createPluginInternal } from './plugin.js';

export type PluginOptions = PublicPluginOptions;

/**
 * Creates an instance of the live region plugin that can be registered on a Vue application instance.
 *
 * @param {Object} PluginOptions - Configuration for the plugin instance
 * @param {Function} [PluginOptions.waitForElement] - Some elements (e.g LitElements) might require some internal processes to finish before
 * their latest state can properly be read. If your project uses elements like this, you can make sure they won't be announced before they are ready,
 * by defining a function that returns a promise, which resolves when the element is done.
 * @example (element) => updateCompleteIn(element)
 *
 * @returns a plugin instance and a way to clean up the DOM modifications caused by installing the plugin
 * @example
 * // Register plugin
 * const liveRegionPlugin = createLiveRegionPlugin();
 * createApp(RouterView).use(liveRegionPlugin);
 *
 * // Clean up the DOM changes caused by this specific plugin instance
 * liveRegionPlugin.cleanup();
 */
export const createLiveRegionPlugin = (options: PluginOptions = {}): CreatePluginReturnType => createPluginInternal(options);

export {
	useAnnouncer,
	LiveBoundary,
	type CreatePluginReturnType,
	type LiveBoundaryApi,
	type WaitForElement,
	type VLiveDirective,
	type VLiveDirectiveValue,
	type VLiveDirectiveModifiers,
	type AnnouncementOptions,
	type Announcer,
} from './plugin.js';

declare module '@vue/runtime-core' {
	interface GlobalDirectives {
		vLive: VLiveDirective;
	}
}
