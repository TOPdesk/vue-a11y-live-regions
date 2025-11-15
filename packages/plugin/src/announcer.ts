import { BUFFER_TIMEOUT, noop } from './utils.js';

const cssClass = createStyling();
export const announcementEventName = 'vue-plugin-a11y-live-announcement';

export type AnnouncementType = 'status' | 'alert';

export interface AnnouncementRequest {
	sourceElement: HTMLElement;
	text: string;
	type?: AnnouncementType;
}

export interface GlobalAnnouncementRequest extends AnnouncementRequest {
	globalListenerId: symbol;
}

export interface InternalAnnouncer {
	announce: (announcement: AnnouncementRequest) => void;
	mount: (parent: HTMLElement) => void;
	unmount: () => void;
}

export interface AnnouncerManager {
	allowAnnouncements: (allow: boolean) => void;
	createAnnouncer: () => InternalAnnouncer;
}

export type GlobalAnnouncementRequestEvent = CustomEvent<GlobalAnnouncementRequest>;
export type HandledAnnouncement = AnnouncementRequest & { handlerElement: HTMLElement };
export type AnnouncementHandledHook = (details: HandledAnnouncement) => void;

export class UnmountedAnnouncementError extends Error {
	constructor(text: string) {
		super(`"${text}" could not be announced, because the announcer is not mounted in the DOM.`);
	}
}

/**
 * Creates the style element with a class to be used on the live regions
 * @returns the class name
 */
function createStyling() {
	const style = document.createElement('style');
	const className = 'vue-plugin-a11y-live-region';
	style.textContent = `
		.${className} {
			position: absolute;
			clip-path: inset(50%);
			white-space: nowrap;
			width: 1px;
			height: 1px;
			overflow: hidden;
		}
	`;

	document.head.appendChild(style);

	return className;
}

export function AnnouncerManager(onAnnouncement: AnnouncementHandledHook = noop): AnnouncerManager {
	let enableAnnouncements = true;

	function allowAnnouncements(allow: boolean) {
		enableAnnouncements = allow;
	}

	function createDivGroup(parent: HTMLElement, setup: (e: HTMLElement) => void) {
		let currentIndex = 0;

		const elements = [document.createElement('div'), document.createElement('div')];
		elements.forEach(setup);
		parent.append(...elements);

		return {
			replaceText(text: string) {
				elements[currentIndex].textContent = '';
				currentIndex = (currentIndex + 1) % elements.length;
				elements[currentIndex].innerText = text;
			},
		};
	}

	return {
		allowAnnouncements,
		createAnnouncer() {
			const wrapper = document.createElement('div');
			wrapper.className = cssClass;

			const { replaceText: announceStatus } = createDivGroup(wrapper, (e) => { e.role = 'status'; });
			const { replaceText: announceAlert } = createDivGroup(wrapper, (e) => { e.role = 'alert'; });

			const buffer: AnnouncementRequest[] = [];

			function announce(request: AnnouncementRequest) {
				if (!buffer.length) {
					setTimeout(() => {
						if (!enableAnnouncements) {
							buffer.length = 0;
							return;
						};

						let status = '';
						let alert = '';

						// can this be done with array.shift?
						buffer.forEach(({ sourceElement, text, type = 'status' }) => {
							if (!wrapper.parentElement) {
								throw new UnmountedAnnouncementError(text);
							}

							if (type === 'alert') {
								alert += `${text}\n`;
							} else {
								status += `${text}\n`;
							}

							onAnnouncement({
								sourceElement,
								text,
								type,
								handlerElement: wrapper.parentElement,
							});
						});

						if (alert.trim()) {
							announceAlert(alert.trim());
							alert = '';
						}

						if (status.trim()) {
							announceStatus(status.trim());
							status = '';
						}

						buffer.length = 0;
					}, BUFFER_TIMEOUT);
				}

				buffer.push(request);
			}

			function unmount() {
				wrapper.remove();
			}

			function mount(parent: HTMLElement) {
				parent.prepend(wrapper);
			}

			return { announce, mount, unmount };
		},
	};
}

export function requestAnnouncement(request: GlobalAnnouncementRequest) {
	const event: GlobalAnnouncementRequestEvent = new CustomEvent(announcementEventName, { detail: request, bubbles: true, composed: true });
	request.sourceElement.dispatchEvent(event);
}
