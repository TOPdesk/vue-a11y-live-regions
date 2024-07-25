<template>
	<div class="container">
		<div v-live>Click count: {{ clickCount }}</div>
		<button type="button" @click.stop="clickCount++">Click me!</button>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const clickCount = ref(0);
</script>

<style lang="scss" scoped>
.container {
	display: flex;
	flex-direction: column;
	gap: 12px;
}
</style>
