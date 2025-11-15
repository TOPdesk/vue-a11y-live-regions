# @topdesk/vue-plugin-a11y-live-regions

This plugin aims to make announcing status changes to screen reader users easier and more reliable via the use of custom directives and utility functions that can be used in JavaScript/TypeScript and in Vue SFC templates.

## Docs
- [Installation](https://github.com/TOPdesk/vue-a11y-live-regions/blob/main/docs/installation.md)
- [Usage](https://github.com/TOPdesk/vue-a11y-live-regions/blob/main/docs/usage.md)
- [Testing](https://github.com/TOPdesk/vue-a11y-live-regions/blob/main/docs/testing.md)
- [Demo](https://topdesk.github.io/vue-a11y-live-regions/)

## When to use this plugin
- If you care about screen-reader users getting live updates on dynamic state changes in your application (you should), but it's a bit too inconvenient
- If you have complex pages made with components that all have different dynamic states combined with `v-if`/`v-show` structures that could prevent live regions from working properly
- If you need a way to programmatically announce things to the user via JavaScript/TypeScript

## Important to note
While the utilities provided by this plugin should make interacting with screen-readers easier, it can in _no way guarantee_ that the utilities will always properly work together with all screen readers in all the browsers, in all your different scenarios.

You should __always__ validate your changeset against an actual environment using a supported screen reader.

If you run into an unsupported case, don't hesitate to reach out.
