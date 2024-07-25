import { createApp } from 'vue';
import DemoPage from './demo-page.vue';
import { createLiveRegionPlugin } from '@topdesk/vue-plugin-a11y-live-regions';
import { DemoCustomElement } from './components/custom-element.js';

import './main.scss';

const liveRegionPlugin = createLiveRegionPlugin();
const app = createApp(DemoPage);

customElements.define('demo-custom-element', DemoCustomElement);

app.use(liveRegionPlugin);
app.mount('#app');
