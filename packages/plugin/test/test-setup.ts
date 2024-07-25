class DirectiveCustomElement extends HTMLElement {
	set content(value) {
		this.setAttribute('content', value ?? '');
	}

	get content() {
		return this.getAttribute('content') ?? '';
	}
}

customElements.define('directive-custom-element', DirectiveCustomElement);
