# Testing

## Setup
To be able to test the announcing behavior in your application, you'll need multiple things:
1. A dom-based test environment (e.g. `jsdom`, or an actual browser)
1. The plugin needs to be registered in your test Vue application
1. The tested component [needs to be attached to the document](https://test-utils.vuejs.org/api/#attachTo)
1. If you use `jsdom` as a testing environment, you will need to polyfill the `innerText` property of `HTMLElement`. The plugin provides a basic utility for this. See: [Polyfilling jsdom](#polyfilling-jsdom)

## Basic usage
### createTestingPlugin
For testing, it's recommended to use `createTestingPlugin` instead of `createLiveRegionPlugin`.

Internally, the two plugins work the same way, but `createTestingPlugin` exposes extra utilities for testing.

#### Timers
The plugin uses timers internally to guarantee specific behaviors, like announcing multiple messages coming in at the same time, or skipping unwanted announcements on the first load of the application. To make sure your tests can take these into account, the testing plugin exposes some utilities.

##### waitUntilReady
The return value of `createTestingPlugin` exposes a `waitUntilReady` function. To make sure the plugin is ready to announce a state change after the initial render, you can wait for the `Promise` returned by `waitUntilReady`, before moving on to triggering the state change.

##### Fake timers
If your test uses fake timers, the plugin needs to know about this to make sure it works correctly. You can do this by passing a function to the testing plugin on creation as an option.

Example for Vitest: `createTestingPlugin({ advanceTimersFn: vi.advanceTimersByTime });`

*Note: fake timers can be beneficial to speed up tests making announcement assertions.*

#### Announcements
The return value of `createTestingPlugin` exposes a `getAnnouncements` function. This function is asynchronous, and should be awaited to retrieve an array of all the announcement requests made since the plugin was installed, or the [announcements were manually cleared](#manually-clearing-announcement-history).

The function makes sure internally that the [waitForElement](./installation.md#waitforelement-optional) promises and other timers are flushed before evaluating and returning the announcements.

Each `announcement` entry contains the following properties:
- `text`: The text content of the announcement.
- `sourceElement`: The element (or an element representing a component) where the announcement request originates from.
- `handlerElement`: The element that handled the announcement request. This is normally the `document.body`, but it can also be an element representing a `LiveBoundary` component instance.
- `type`: This can either be `status` or `alert`.

#### Manually clearing announcement history
The return value of `createTestingPlugin` also exposes a `clearAnnouncements` function that can be used to clear the announcement history manually between assertions. This function is also async to make sure all announcements are flushed before clearing them up, to avoid timing issues.

#### Example
```javascript
import { mount } from '@vue/test-utils';
import Component from './Component.vue';

import { createTestingPlugin, cleanup } from '@topdesk/vue-plugin-a11y-live-regions/testing';

// If the app is not unmounted between test runs or the automatic cleanup is not enough
afterEach(() => {
	// Cleans up all testing plugin instances
	cleanup();
})

test('Status is correct', async () => {
	const liveRegionPlugin = createTestingPlugin();
	const { getAnnouncements, clearAnnouncements } = liveRegionPlugin;

	// Register plugin
	mount(Component, {
		global: {
			plugins: [liveRegionPlugin]
		}
	});

	await liveRegionPlugin.waitUntilReady();

	// Trigger a state change
	// ...

	// Validate announcements
	const announcements = await getAnnouncements();
	expect(announcements).toHaveLength(1);
	expect(announcements[0].text).toBe('Expected status');

	// In case you need a reset between assertions
	await clearAnnouncements();
	expect(announcements).toHaveLength(0);
})
```

## Polyfilling jsdom
### innerText
For the plugin to be able to announce messages as close to the visible text as possible, it's using `innerText` internally to evaluate text content, instead of `textContent`. See: [HTMLElement: innerText property](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/innerText). Unfortunately, this property is not supported in `jsdom`, so it requires workarounds. One of the simplest ways to "polyfill" this is to use `textContent` after all in testing scenarios.

### Polyfill provided by the plugin
The plugin provides a way to naively polyfill the above feature by importing the following in your test setup file:
```javascript
// test-setup.js

import '@topdesk/vue-plugin-a11y-live-regions/jsdom';
```

It is of course also possible to provide your own polyfills, instead, in case you need a more realistic reproduction of `innerText`, for example.

## LiveBoundary
### Example
```html
<!-- YourComponent.vue -->
<template>
	<LiveBoundary data-testid="live-boundary">
		<!-- ... -->
	</LiveBoundary>
</template>
```
```javascript
// your test (example is using vue-testing-library, but it can be rewritten to any framework)

// mount component with the plugin registered...
const { getAnnouncements } = liveRegionTestingPlugin;

const announcements = await getAnnouncements();

expect(announcements).toHaveLength(1);
expect(announcements[0].text).toBe('Expected status');

// If you need to validate that the request is handled by a specific boundary, instead of the document.body
const boundary = getByTestId('live-boundary');
expect(announcements[0].handlerElement).toBe(boundary);
```
