import { describe, expect, test } from 'vitest';
import '../src/jsdom.js';

describe('The innerText polyfill', () => {
	test('sets the text content properly', () => {
		const element = document.createElement('div');
		element.innerText = 'This is the text';
		document.body.append(element);

		expect(element.textContent).toBe(element.innerText);
	});

	test('gets the text content properly', () => {
		const element = document.createElement('div');
		element.innerHTML = '<p>Test</p><p style="display:none;">Text</p>';
		document.body.append(element);

		expect(element.innerText).toBe(element.textContent);
	});
});
