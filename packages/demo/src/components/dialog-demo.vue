<template>
	<div class="demo-container">
		<dialog ref="dialog" class="dialog" aria-labelledby="dialog-title">
			<h2 id="dialog-title">Announcements in modal dialogs</h2>
			<LiveBoundary ref="liveBoundary" class="live-boundary" v-slot="{ announce }">
				<div class="live-boundary-title">This is the live boundary (normally invisible)</div>
				<section aria-labelledby="modal-directive-heading" class="panel modal-panel">
					<h3 id="modal-directive-heading">Directive</h3>
					<!-- The directive is inside the component -->
					<ClickCounter />
				</section>
				<section aria-labelledby="modal-custom-announcement-heading" class="panel modal-panel">
					<h3 id="modal-custom-announcement-heading">Announce function</h3>

					<!-- Announcement logic is inside the component -->
					<h4>Via a child component</h4>
					<SayHello class="child-component-announcer"/>

					<h4>From this component</h4>
					<button type="button" value="customText" @click="announce('Hello there!')">Say hello!</button>
				</section>
			</LiveBoundary>
			<button type="button" @click.stop="closeModal" class="close-dialog-button">Close</button>
		</dialog>
		<button type="button" @click.stop="showModal">Show modal</button>
	</div>
</template>

<script setup lang="ts">
import { LiveBoundary } from '@topdesk/vue-plugin-a11y-live-regions';
import { useTemplateRef } from 'vue';
import SayHello from './say-hello.vue';
import ClickCounter from './click-counter.vue';

const dialogRef = useTemplateRef<HTMLDialogElement>('dialog');

function showModal() {
	dialogRef.value?.showModal();
}

function closeModal() {
	dialogRef.value?.close();
}

</script>

<style lang="scss" scoped>

.demo-container {
	display: contents;
}

.dialog {
	width: 550px;
	max-width: 80% !important;
	border: 2px solid gray;
	border-radius: var(--border-radius);
	box-shadow: 0 0 12px rgb(176, 176, 176);
}

#dialog-title {
	margin-bottom: 24px;
}

.close-dialog-button {
	display: block;
	margin-top: 16px;
	margin-left: auto;
	align-self: flex-end;
}

.live-boundary {
	display: flex;
	flex-direction: column;
	gap: 16px;
	border: 1px solid darkgray;
	padding: 8px 16px 16px;
	border-radius: var(--border-radius);
}

.live-boundary-title {
	color: rgb(100, 100, 100);
	margin-top: -16px;
    background: white;
    width: max-content;
	max-width: 100%;
    padding: 0px 4px;
}

.modal-panel {
	box-shadow: unset;
	gap: 12px;
}

.child-component-announcer {
	margin-bottom: 8px;
}

</style>
