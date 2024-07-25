import { afterEach, assert, beforeEach, describe, expect, test, vi } from 'vitest';
import { GlobalAnnouncementRequest, AnnouncementType, AnnouncerManager, requestAnnouncement, UnmountedAnnouncementError, AnnouncementRequest } from '../src/announcer.js';

afterEach(() => {
	document.body.innerHTML = '';
	vi.useRealTimers();
});

beforeEach(() => {
	vi.useFakeTimers();
});

function skipBuffer() {
	vi.advanceTimersByTime(1);
}

describe('The announcer', () => {
	// This style registration happens in the global scope as a side-effect
	test('is created with the correct styling', () => {
		const announcer = AnnouncerManager().createAnnouncer();
		announcer.mount(document.body);

		const wrapper = document.body.children[0];
		const styles = wrapper.computedStyleMap();

		expect(styles.get('position')?.toString()).toEqual('absolute');
		expect(styles.get('clip-path')?.toString()).toEqual('inset(50%)');
		expect(styles.get('white-space')?.toString()).toEqual('nowrap');
		expect(styles.get('width')?.toString()).toEqual('1px');
		expect(styles.get('height')?.toString()).toEqual('1px');
		expect(styles.get('overflow')?.toString()).toEqual('hidden');
	});

	test('can be unmounted', () => {
		const announcer = AnnouncerManager().createAnnouncer();
		announcer.mount(document.body);

		expect(document.body.childElementCount).toBe(1);

		announcer.unmount();
		expect(document.body.childElementCount).toBe(0);
	});

	test('is not added to the DOM without mounting', () => {
		AnnouncerManager().createAnnouncer();
		expect(document.body.childElementCount).toBe(0);
	});

	test('has the proper internals', () => {
		const announcer = AnnouncerManager().createAnnouncer();
		announcer.mount(document.body);

		const wrapper = document.body.lastElementChild;
		assert(wrapper, 'The announcer is not mounted');

		const statusFields = wrapper.querySelectorAll('[role=status]');
		expect(statusFields).toHaveLength(2);
	});

	test('throws an error when trying to announce something unmounted', async () => {
		const announcer = AnnouncerManager().createAnnouncer();
		const text = 'failed text';
		expect(() => {
			announcer.announce({ text, sourceElement: document.createElement('span') });
			skipBuffer();
		}).toThrow(new UnmountedAnnouncementError(text));
	});

	test.each<{ incomingType: AnnouncementRequest['type']; type: AnnouncementType }>([
		{ incomingType: 'status', type: 'status' },
		{ incomingType: 'alert', type: 'alert' },
		{ incomingType: undefined, type: 'status' },
	])('can announce requests with type $incomingType', async ({ incomingType, type }) => {
		const onAnnouncement = vi.fn();
		const announcer = AnnouncerManager(onAnnouncement).createAnnouncer();
		const handlerElement = document.body;
		announcer.mount(handlerElement);

		const wrapper = document.body.lastElementChild;
		assert(wrapper, 'The announcer is not mounted');
		const statusFields = wrapper.querySelectorAll<HTMLElement>(`[role=${type}]`);

		const sourceElement = document.createElement('span');
		document.body.append(sourceElement);

		const text1 = 'Text 1';
		announcer.announce({ text: text1, sourceElement, type: incomingType });
		skipBuffer();
		expect(statusFields[0].textContent).toBe('');
		expect(statusFields[1].textContent).toBe(text1);
		expect(onAnnouncement).toHaveBeenLastCalledWith(expect.objectContaining({ text: text1, sourceElement, handlerElement, type }));

		const text2 = 'Text 2';
		announcer.announce({ text: text2, sourceElement, type: incomingType });
		skipBuffer();
		expect(statusFields[0].textContent).toBe(text2);
		expect(statusFields[1].textContent).toBe('');
		expect(onAnnouncement).toHaveBeenLastCalledWith(expect.objectContaining({ text: text2, sourceElement, handlerElement, type }));

		// Also testing simultaneous announcements
		const text3 = 'Text 3';
		const text4 = 'Text 4';
		announcer.announce({ text: text3, sourceElement, type: incomingType });
		announcer.announce({ text: text4, sourceElement, type: incomingType });
		skipBuffer();
		expect(statusFields[0].textContent).toBe('');
		expect(statusFields[1].innerText).toBe(`${text3}\n${text4}`);
		expect(onAnnouncement).toHaveBeenNthCalledWith(3, expect.objectContaining({ text: text3, sourceElement, handlerElement, type }));
		expect(onAnnouncement).toHaveBeenNthCalledWith(4, expect.objectContaining({ text: text4, sourceElement, handlerElement, type }));
	});

	test('can be suspended and re-enabled via the announcer manager', () => {
		const onAnnouncement = vi.fn();
		const manager = AnnouncerManager(onAnnouncement);
		const announcer = manager.createAnnouncer();
		announcer.mount(document.body);

		announcer.announce({ text: 'something', sourceElement: document.body });
		skipBuffer();
		expect(onAnnouncement).toHaveBeenCalledOnce();

		announcer.announce({ text: 'another thing', sourceElement: document.body });
		manager.allowAnnouncements(false);
		skipBuffer();
		expect(onAnnouncement).toHaveBeenCalledOnce();

		const lastAnnouncement = 'another thing again';
		const statusFields = document.body.querySelectorAll<HTMLElement>('[role=status]');
		announcer.announce({ text: lastAnnouncement, sourceElement: document.body });
		manager.allowAnnouncements(true);
		skipBuffer();
		expect(onAnnouncement).toHaveBeenCalledTimes(2);
		expect(statusFields[0].textContent).toBe(lastAnnouncement);
	});
});

describe('The announcement request', () => {
	test.each<AnnouncementRequest['type']>(['status', 'alert', undefined])('dispatches the correct announcement event for changes with type %s', (type) => {
		const sourceElement = document.createElement('span');
		const globalListenerId = Symbol('test-id');
		const text = 'Announcement request';

		const eventSpy = vi.spyOn(sourceElement, 'dispatchEvent');

		const request: GlobalAnnouncementRequest = { globalListenerId, sourceElement, text, type };
		requestAnnouncement(request);

		const expectedEvent = new CustomEvent('vue-plugin-a11y-live-announcement', { detail: request, bubbles: true, composed: true });
		const actualEvent = eventSpy.mock.lastCall ? eventSpy.mock.lastCall[0] as CustomEvent : null;

		assert(actualEvent, 'No event was dispatched.');
		expect(actualEvent.type).toBe(expectedEvent.type);
		expect(actualEvent.detail).toEqual(expectedEvent.detail);
		expect(actualEvent.bubbles).toEqual(expectedEvent.bubbles);
		expect(actualEvent.composed).toEqual(expectedEvent.composed);
	});
});
