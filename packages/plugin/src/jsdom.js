/**
 * https://github.com/jsdom/jsdom/issues/1245
 *
 * In JSDOM, innerText is not properly implemented, so to enable testing with the plugin,
 * this method will replace all `HTMLElement.innerText` calls with `HTMLElement.textContent` calls __globally__.
 * This can be used as part of a test setup file.
 */
function replaceInnerTextWithTextContent() {
	Object.defineProperty(HTMLElement.prototype, 'innerText', {
		get() {
			return this.textContent;
		},
		set(text) {
			this.textContent = text;
		},
	});
}

replaceInnerTextWithTextContent();
