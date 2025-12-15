# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

*Note: The commit history is not aligned completely with this changelog, as the project had a different history while it was still closed-souce.*

## [1.0.1] - 2025-12-15
### Changed
- Dependency updates
- Internal: Repository added to package.json

## [1.0.0] - 2025-11-17
### Fixed
- The plugin can now announce multiple messages coming in at the same time

### Changed
- **Breaking**: Announcements no longer happen on the first (sync) load of the application
	- This also affects tests relying on announcements on the first mounting of the application. You can find further information in the [Timers section of the testing documentation](./docs/testing.md#timers).
- The project was moved to GitHub and got open-sourced
- Dependency updates

## [0.5.0] - 2025-04-04
### Fixed
- Elements appearing were not announced by the `v-live` directive on rare occasions

### Changed
- **Breaking**: Announcements are no longer directly exposed by `createTestingPlugin`. To retrieve announcements, the new async `getAnnouncements` function should be used instead, which also makes sure internally that all the `waitForElement` promises are flushed before the announcements are returned.
- **Breaking**: The `clearAnnouncements` function returned by `createTestingPlugin` is now async
- `HTMLElement.checkVisibility()` no longer needs to be polyfilled for `jsdom`
- The demo page was reworked to better represent the capabilities of the plugin
- Dependency updates

### Added
- Assertive announcements are now possible from both the `useAnnouncer` composable and the `v-live` directive
- The `LiveBoundary` component also exposes its `announce` function via slot props
- Clarification in the documentation about live region features that are not supported


## [0.4.2] - 2025-03-06
### Fixed
- The plugin should not cause vertical scrollbars to appear anymore

## [0.4.1] - 2025-01-20
### Fixed
- The `checkVisibility` method of `HTMLElement` is now properly polyfilled in `jsdom` environments

## [0.4.0] - 2025-01-06
### Fixed
- The `v-live` directive can now re-announce the same text when the directive is re-enabled or the element re-appears. This was only possible for elements hidden by `v-if` previously.
- The plugin can now re-announce the exact same text coming from two different sources after each other.

### Changed
- **Breaking**: The plugin does not require a `liveRegionId` at creation anymore
- **Breaking**: [The way to test plugin announcements changed](./docs/testing.md) and the utilities were moved to `@topdesk/vue-plugin-a11y-live-regions/testing`
  - the plugin used in tests should be created via `createTestingPlugin`
  - announcements are available as part of the return value of `createTestingPlugin`
  - `cleanup` is now only available in `@topdesk/vue-plugin-a11y-live-regions/testing` and no longer cleans up production plugin instances
- Improved type-support for the `v-live` directive
- Improved documentation for the `LiveBoundary` component
- Internal: The plugin tests now run in the browser mode of Vitest
- Internal: The visually hidden class got improved internals and a more unique name
- Internal: Introduced `eslint`

## [0.3.0] - 2024-09-25
### Changed
- The plugin cleans up its DOM changes automatically when the application is unmounted
- The minimum required Vue version is **3.5**

## [0.2.0] - 2024-08-09
### Fixed
- All global announcers triggering at the same time

### Added
- Programmatic announcements coming from `useAnnouncer` can now be caught by `LiveBoundary` wrappers in parent components

## [0.1.0] - 2024-08-01
### Added
- `useAnnouncer` utility to help screen-reader announcements programmatically
- `v-live` directive for declarative announcements in Vue templates
- `LiveBoundary` component for announcements scoped to a specific part of the component tree
