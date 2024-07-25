export class DemoCustomElement extends HTMLElement {
	constructor() {
	  super();
	}

	set content(value){
		this.textContent = value;
	}

	get content(){
		return this.textContent;
	}
}
