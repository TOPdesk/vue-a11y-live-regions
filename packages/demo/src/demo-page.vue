<template>
	<header>
		<h1>Live regions demo</h1>
		<p>
			The main purpose of this page is to introduce the functionalities of the
			<a target="_blank" href="https://github.com/TOPdesk/vue-a11y-live-regions">live regions Vue plugin</a>,
			and it's best experienced using a screen reader and
			<a target="_blank" href="https://github.com/TOPdesk/vue-a11y-live-regions/blob/main/packages/demo/src/demo-page.vue">following the demo code</a>.
		</p>
	</header>
	<main>
		 <section class="panel" aria-labelledby="custom-announcements-heading">
			<h2 id="custom-announcements-heading">The useAnnouncer composable</h2>
			<UseAnnouncerDemo />
		 </section>
		<section class="panel" aria-labelledby="directive-announcements-heading">
			<h2 id="directive-announcements-heading">Directive announcements</h2>
			<DirectiveDemo />
		</section>
		<section class="panel" aria-labelledby="modal-announcements-heading">
			<h2 id="modal-announcements-heading">Announcements in modal dialogs</h2>
			<div>
				Announcements in modal dialogs don't work out of the box, and require a
				<a target="_blank" href="https://github.com/TOPdesk/vue-a11y-live-regions/blob/main/docs/usage.md#liveboundary-component">LiveBoundary component</a>
				to be wrapped around the reactive parts.
			</div>
			<DialogDemo />
		</section>
	</main>
</template>

<script setup lang="ts">
import UseAnnouncerDemo from './components/use-announcer-demo.vue';
import DirectiveDemo from './components/directive-demo.vue';
import DialogDemo from './components/dialog-demo.vue';
</script>

<style lang="scss" scoped>
header {
	padding: 16px 16px 8px;
	display: flex;
	flex-direction: column;
}

main {
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 0 16px 16px;
}
</style>
