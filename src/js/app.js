import { Vector2D, Vector3D } from './vector.js';
import { Renderer } from './renderer.js';

window.Vector2D = Vector2D;
const App = new class {
	renderer;
	
	constructor() {
		window.App = this;
		this.renderer = new Renderer({canvas: document.querySelector('#renderCanvas')});
		this.renderer.draw();
	}	
}


export default App;