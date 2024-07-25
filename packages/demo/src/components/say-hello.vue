<template>
	<button type="button" @click="announce('Hello from component!')">Say hello!</button>
</template>

<script setup lang="ts">
import { useAnnouncer } from '@topdesk/vue-plugin-a11y-live-regions';

const announce = useAnnouncer()
</script>
