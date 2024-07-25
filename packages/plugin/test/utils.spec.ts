import { describe, expect, test } from 'vitest';
import { checkVisibility } from '../src/utils.js';

describe('The checkVisibility function is correct when', () => {
	const visibilityTest = test.extend<{ elements: { element: HTMLElement; parentElement: HTMLElement; grandparentElement: HTMLElement } }>({
		// eslint-disable-next-line no-empty-pattern
		async elements({}, use) {
			const element = document.createElement('div');
			const parentElement = document.createElement('div');
			const grandparentElement = document.createElement('div');

			parentElement.append(element);
			grandparentElement.append(parentElement);
			document.body.append(grandparentElement);

			await use({ element, parentElement, grandparentElement });

			document.body.textContent = '';
		},
	});

	visibilityTest.for([
		{ display: 'block', visible: true },
		{ display: 'none', visible: false },
	])('display is $display', ({ display, visible }, { elements: { element } }) => {
		element.style.display = display;
		expect(checkVisibility(element)).toBe(visible);
	});

	visibilityTest.for([
		{ visibility: 'visible', checked: true, visible: true },
		{ visibility: 'visible', checked: false, visible: true },
		{ visibility: 'visible', checked: undefined, visible: true },
		{ visibility: 'hidden', checked: true, visible: false },
		{ visibility: 'hidden', checked: false, visible: true },
		{ visibility: 'hidden', checked: undefined, visible: true },
	])('content-visibility is $visibility on an element and checkContentVisibility is $checked ', ({ checked, visibility, visible }, { elements: { element } }) => {
		element.style.contentVisibility = visibility;
		expect(checkVisibility(element, checked)).toBe(visible);
	});

	visibilityTest.for([
		{ visibility: 'visible', checked: true, visible: true },
		{ visibility: 'visible', checked: false, visible: true },
		{ visibility: 'visible', checked: undefined, visible: true },
		{ visibility: 'hidden', checked: true, visible: false },
		{ visibility: 'hidden', checked: false, visible: false },
		{ visibility: 'hidden', checked: undefined, visible: false },
	])('content-visibility is $visibility on an ancestor element and checkContentVisibility is $checked ', ({ checked, visibility, visible }, { elements: { element, grandparentElement } }) => {
		grandparentElement.style.contentVisibility = visibility;
		expect(checkVisibility(element, checked)).toBe(visible);
	});
});
