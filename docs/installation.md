# Installation

## npm
```bash
npm i @topdesk/vue-plugin-a11y-live-regions@latest
```

## Registering the plugin
**Important:** For the plugin to work properly, the application should not be mounted directly to the `document.body`, but to an element inside the `body` instead.
```javascript
const plugin = createLiveRegionPlugin();

createApp(App)
  .use(plugin)
  .mount('#app');
```

### Plugin options on creation

#### waitForElement (optional)
Some elements (e.g `LitElements`) might require some internal processes to finish before their latest state can properly be read. If your project uses elements like this, you can make sure they won't be announced before they are ready by defining a global function that takes an element, and returns a promise, which resolves when the given element is done processing.

### Utility functions returned by the create function
```javascript
const plugin = createLiveRegionPlugin();

const { cleanup } = plugin;
```
#### cleanup
This function can be used to clean up the DOM changes caused by this specific plugin instance.
*Note: the plugin will automatically clean up after itself when the application instance in unmounted.*
