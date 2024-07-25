<template>
	<div class="demo-container">
		<fieldset class="panel">
			<legend>Select a directive version</legend>
			<div class="radio-container">
				<input v-model="currentDirective" id="custom-text-directive" type="radio" value="customText">
				<label for="custom-text-directive">Custom text value</label>
			</div>
			<div class="radio-container">
				<input v-model="currentDirective" id="inner-text-directive" type="radio" value="innerText">
				<label for="inner-text-directive">Inner text value</label>
			</div>
			<div class="radio-container">
				<input v-model="currentDirective" id="custom-element-directive" type="radio" value="customElement">
				<label for="custom-element-directive">Custom element property</label>
			</div>
			<div class="radio-container">
				<input v-model="currentDirective" id="alert-directive" type="radio" value="alert">
				<label for="alert-directive">Alert</label>
			</div>
			<div class="radio-container">
				<input v-model="currentDirective" id="disabled-directive" type="radio" value="disabled">
				<label for="disabled-directive">Disabled</label>
			</div>
			<div class="radio-container">
				<input v-model="currentDirective" id="aria-label-directive" type="radio" value="ariaLabel">
				<label for="aria-label-directive">ARIA label</label>
			</div>
		</fieldset>

		<!-- The interesting part starts here-->
		<div v-if="currentDirective === 'customText'" v-live="{ text: 'Welcome to the demo page' }">This div will announce something else than visible.</div>
		<div v-if="currentDirective === 'innerText'" class="directive-example-content">
			<div>This div announces click count.</div>
			<!-- The directive is inside the component -->
			<ClickCounter />
		</div>
		<demo-custom-element v-if="currentDirective === 'customElement'" v-live:content content="This directive directly reads the content property of a custom element." />
		<div v-if="currentDirective === 'alert'" v-live.alert>This announcement should be assertive.</div>
		<div v-if="currentDirective === 'disabled'" class="directive-example-content">
			<div class="checkbox-container">
				<input v-model="directiveEnabled" id="directive-enabled-checkbox" type="checkbox"/>
				<label for="directive-enabled-checkbox">Enable announcement of the text below</label>
			</div>
			<div v-live="{ disabled: !directiveEnabled }">This text should not be announced unless the checkbox above is checked.</div>
		</div>
		<div v-if="currentDirective === 'ariaLabel'" v-live:ariaLabel aria-label="You should not use aria-label on a plain div next time around.">This div will get its aria-label announced.</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ClickCounter from './click-counter.vue';

const currentDirective = ref<'customText'|'innerText'|'customElement'|'alert'|'disabled'|'ariaLabel'>('customText');
const directiveEnabled = ref(false);

</script>

<style lang="scss" scoped>

.demo-container {
	display: contents;
}

fieldset {
	width: 100%;
	margin: 0;
	gap: 0;
	box-shadow: none;
}

.directive-example-content {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

</style>
