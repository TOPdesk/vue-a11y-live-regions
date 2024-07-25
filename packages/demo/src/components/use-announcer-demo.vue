<template>
	<form title="Custom announcement configuration" @submit.prevent="announce(text, { type: alert ? 'alert' : 'status' })">
		<div class="text-input-container">
			<label :for="textInputId">Text to announce</label>
			<input v-model="text" :id="textInputId" type="text"/>
		</div>
		<div class="checkbox-container">
			<input v-model="alert" :id="checkboxId" type="checkbox"/>
			<label :for="checkboxId">Assertive (alert)</label>
		</div>
		<button>Announce</button>
	</form>
</template>

<script setup lang="ts">
import { useAnnouncer } from '@topdesk/vue-plugin-a11y-live-regions';
import { computed, ref, useId } from 'vue';

const announce = useAnnouncer();

const id = useId();
const textInputId = computed(() => `text-input-${id}`);
const checkboxId = computed(() => `assertive-checkbox-${id}`);

const text = ref('');
const alert = ref(false);
</script>

<style lang="scss" scoped>
.text-input-container {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	max-width: 100%;
}
</style>
