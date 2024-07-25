# Usage

Table of contents
1. [General information](#general-information)
1. [v-live directive](#v-live-directive)
1. [useAnnouncer composable](#useannouncer)
1. [LiveBoundary component](#liveboundary-component)
1. [Not supported](#not-supported)

## General information
In general, announcements made via the below conveniences act like they came from
a change directly in the `document.body`. However, if a [live boundary](#liveboundary-component)
is used somewhere up in the component tree, changes will be announced like they came from inside that boundary.

Announcements made by the plugin are always [atomic](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-atomic) and they can either be [polite or assertive](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions#live_regions) based on the specific announcement settings.

**Important:** Announcements on the first (sync) load of the application are skipped to avoid interfering with the normal flow of the browser that might also trigger (a part of) the page to be read.

## v-live directive
The plugin provides a directive called `v-live` that can be used in multiple ways.

### Examples

#### Announcing the (reactive) innerText of an element
```html
<!--
 The "innerText" of span will be announced each time the element appears, and on each "reactiveText" change
-->
<span v-if="condition" v-live>{{ reactiveText }}</span>
```
#### Reading a (reactive) (custom) element property
```html
<!-- "reactiveText" will be announced on the first render of the parent,
 and then on each "reactiveText" change -->
<custom-element v-live:header :header="reactiveText" />

<!-- "reactiveText" will be announced on the first render of the parent,
 and then on each "reactiveText" change -->
<div v-live:ariaLabel :aria-label="reactiveText" />
```
#### Announcing a specific value
```html
<!-- "reactiveText" will be announced on the first render of the parent,
 and then on each "reactiveText" change -->
<div v-live="{ text: reactiveText }" />
```

#### Suspending announcements
```html
<!-- When "elementNotInSight" evaluates to "true", changes in the content property will not be announced. If the element comes back in sight, the latest "content" value will be announced automatically. -->
<custom-element v-live:content="{ disabled: elementNotInSight }" />
```

#### Assertive announcements (alerts)
```html
<!-- The "innerText" of span will be announced as an alert -->
<span v-live.alert>{{ reactiveText }}</span>

<!-- "reactiveText" will be announced as an alert -->
<custom-element v-live:header.alert :header="reactiveText" />
```

## useAnnouncer
Calling `useAnnouncer` in the `setup` function will provide you with a function that can be used to programmatically announce changes.

Important notes:
* the provided function should only be used _after_ the component is mounted
* it's recommended to only call the `useAnnouncer` function in components with a single root element

### Example
```javascript
import { useAnnouncer } from '@topdesk/vue-plugin-a11y-live-regions';

...

setup() {
	const announce = useAnnouncer();
	const error = ref(false);

	onMounted(() => {
		// Polite announcement
		announce('Ready for user interaction');
	});

	watch(error, (hasError) => {
		if (hasError) {
			// Assertive announcement
			announce('An unexpected error happened.', { type: 'alert' });
		}
	});
}
```

## LiveBoundary component
### Why is it needed?
In specific scenarios, it can happen that even though a global announcement request was made, the screen reader does not pick this up, resulting in unannounced status changes.

One such confirmed scenario is when announcements are made from a `modal dialog`.
NVDA ignores all such announcements while the modal is open.
This is most likely caused by the announcements acting like they happened in the `document.body`, which is behind the modal, being in an [inert](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inert) state.

The `LiveBoundary` component can be wrapped around a part of the component tree, introducing a boundary layer for announcements made **by the plugin**, which acts as a workaround for the above issue.

In reality, this means that the announcements will happen directly inside this component (instead of the `document.body`), increasing the chances of screen readers finding them relevant.

### Caveats
#### First render announcements
As the `LiveBoundary` component is rendered by Vue (possibly at the same time as its children), it is by design less stable when it comes to announcing statuses on the first render of the component than the global announcer. For the same reason, putting a `LiveBoundary` behind a `v-if` should generally be avoided.

#### useAnnouncer
Announcements made via the `useAnnouncer` composable will **not** be caught by the `LiveBoundary`, unless they come from a child component. For announcements within the same component, the `LiveBoundary` component exposes an `announce` function both as a slot prop and on the component instance `ref`.

### Example
```html
<template>
	<div>
		<!-- Will be announced in the global scope -->
		<span v-live>{{ globalReactiveText }}</span>

		<LiveBoundary ref="liveBoundaryRef" v-slot="{ announce }">
			<!-- Will be announced in the scope of the LiveBoundary -->
			<button type="button" @click="announce('Live boundary announcement via slot props')">
				Make local announcement via the function from slot props
			</button>

			<!-- Will be announced in the scope of the LiveBoundary -->
			<button type="button" @click="liveBoundaryRef.announce('Live boundary announcement via exposed function')">
				Make local announcement via exposed function
			</button>

			<!-- Will be announced in the scope of the LiveBoundary -->
			<span v-live>{{ boundedReactiveText }}</span>

			<!-- Annoucements inside will be announced in the scope of the LiveBoundary -->
			<component-with-use-announcer />

			<!-- Will still be announced in the global scope -->
			<button type="button" @click="globalAnnounce('Global announcement')">
				Make global announcement
			</button>
		</LiveBoundary>
	</div>
</template>

<script setup lang="ts">
import { LiveBoundary, LiveBoundaryApi } from '@topdesk/vue-plugin-a11y-live-regions';
import { onMounted } from 'vue';

const liveBoundaryRef = ref<LiveBoundaryApi | null>(null);
const globalAnnounce = useAnnouncer();

onMounted(() => {
	/*
		Announcements via this function will always be made
		directly by the live boundary in this component.
	*/
	liveBoundaryRef.value?.announce('Hello from the live boundary!');

	/*
		Announcements via this function will always be made
		either in the global scope, or by a LiveBoundary in
		a PARENT component.
	*/
	globalAnnounce('Hello from the document body!');
});
</script>
```

## Not supported
There are some `aria-live` features not supported by the plugin, and support for them is also not planned, unless legitimate reasons come up without reasonable workarouds.

### aria-atomic
The plugin does not support `aria-atomic` directly. Currently, each announcement made by the plugin acts as if the announcement happened in a region with `aria-atomic="true"`, and there are good reasons for that.
* The plugin relies on extracting textual information from the elements with directives, and copying it to a global live region unaffected by Vue rendering. Even if there was a global live region with aria-atomic set to false, just setting the new text won't actually make a difference. The screen readers will most likely still announce the full length of the text, even if just a word changed in reality.
* To fix the above point, the plugin could extract HTML instead of text for better partitioning, but the problem remains. Unless we specifically update only the parts of the copied HTML that actually changed, screen-readers might still go announcing the full HTML. And doing this kind of diffing might be a bit too expensive for this purpose.
* Alternatively, there could be a wrapper component that hides a live region internally where Vue can do precision updates, but at that point, announcements on first render cannot be guaranteed anyway in a clean way, and the ergonomics would not be much better than they would be by just wrapping something with a `<div aria-live="polite" />`

### aria-relevant
Supporting `aria-relevant` also does not make sense for the reasons detailed in the [aria-atomic section](#aria-atomic), plus general recommendation seems to be against using it, unless you have some niche use-cases.

### aria-busy
There is no direct support for `aria-busy`, as it can indirectly be supported via the `disabled` property of the directive, and making it work for the JavaScript announcer should also be trivial.
