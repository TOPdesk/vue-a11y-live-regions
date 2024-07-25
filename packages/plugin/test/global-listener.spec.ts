import { afterEach, describe, expect, expectTypeOf, test, vi } from 'vitest';
import { createGlobalListener } from '../src/global-listener.js';
import { GlobalAnnouncementRequest, AnnouncerManager, InternalAnnouncer, requestAnnouncement } from '../src/announcer.js';

describe('The created global listeners', { sequential: true }, () => {
	const internalAnnouncer: InternalAnnouncer = {
		announce: vi.fn(),
		mount: vi.fn(),
		unmount: vi.fn(),
	};

	const announcerManager: AnnouncerManager = {
		allowAnnouncements: vi.fn(),
		createAnnouncer: () => internalAnnouncer,
	};

	afterEach(() => {
		vi.clearAllMocks();
	});

	test('have the correct generated IDs', async () => {
		const globalListener1 = createGlobalListener(announcerManager);

		expectTypeOf(globalListener1.id).toBeSymbol();
		expect(globalListener1.id.description).toBe('listener-id');
	});

	test('mount an internal announcer', async () => {
		const globalListener = createGlobalListener(announcerManager);

		globalListener.mount();
		expect(internalAnnouncer.mount).toHaveBeenCalled();
	});

	test('only handle announcement requests targeted at them', async () => {
		const sourceElement = document.createElement('span');
		const globalListener1 = createGlobalListener(announcerManager);
		const globalListener2 = createGlobalListener(announcerManager);
		const text = 'Announced by the 2nd global listener';
		const request: GlobalAnnouncementRequest = { globalListenerId: globalListener2.id, sourceElement, text, type: 'status' };

		globalListener1.mount();
		globalListener2.mount();
		document.body.append(sourceElement);

		requestAnnouncement(request);
		expect(internalAnnouncer.announce).toHaveBeenCalledOnce();
		expect(internalAnnouncer.announce).toHaveBeenCalledWith(request);
	});

	test('get unmounted properly', () => {
		const sourceElement = document.createElement('span');
		const globalListener = createGlobalListener(announcerManager);
		const text = 'Not announced';
		const request: GlobalAnnouncementRequest = { globalListenerId: globalListener.id, sourceElement, text, type: 'status' };

		globalListener.mount();
		document.body.append(sourceElement);
		globalListener.unmount();

		requestAnnouncement(request);
		expect(internalAnnouncer.announce).not.toHaveBeenCalled();
		expect(internalAnnouncer.unmount).toHaveBeenCalled();
	});
});
