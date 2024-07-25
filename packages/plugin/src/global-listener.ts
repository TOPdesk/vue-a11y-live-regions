import { announcementEventName, GlobalAnnouncementRequestEvent, AnnouncerManager } from './announcer.js';

export function	createGlobalListener(announcerManager: AnnouncerManager) {
	const id = Symbol('listener-id');

	const abortController = new AbortController();
	const announcer = announcerManager.createAnnouncer();

	function mount() {
		document.body.addEventListener(announcementEventName, (({ detail }: GlobalAnnouncementRequestEvent) => {
			if (id !== detail.globalListenerId) return; // The event is not for this listener -> discard
			announcer.announce(detail);
		}) as EventListener, { signal: abortController.signal });

		announcer.mount(document.body);
	}

	function unmount() {
		abortController.abort();
		announcer.unmount();
	}

	return { id, mount, unmount };
};
