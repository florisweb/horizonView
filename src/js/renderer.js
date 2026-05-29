import { Vector3D, Vector2D } from './vector.js';
import { GPU } from 'gpu.js';
const gpu = new GPU();



export class Renderer {

	canvas;

	size = new Vector2D(100, 100);
	viewSize = new Vector2D(500, 500);
	ctx;


	#scaleCanv;
	#scaleCanvCtx;

	constructor({canvas}) {
		this.canvas = canvas;
		this.ctx = this.canvas.getContext('2d');
		this.ctx.constructor.prototype.circle = function(x, y, size) {
		    if (size <= 0) return;
		    this.beginPath();
		    this.ellipse(
		      x, 
		      y, 
		      size,
		      size,
		      0,
		      0,
		      2 * Math.PI
		    );
		    this.closePath();
		}


		this.renderOnGPU = gpu.createKernel(function(_viewSize) {
			const worldRad = 100;
			const atmosThickness = 1;
			const atmosConc = 0.05; // Atmospheric 'concentration'

			const x = this.thread.x / _viewSize[0];
			const y = this.thread.y / _viewSize[1]; // Higher value = higher on screen

			// TODO properly calculate d

			const d = y; // Height of the 'viewport' when projected against the atmospheric edge
			const length = Math.sqrt(d**2 + (worldRad + atmosThickness)**2 - (worldRad + d)**2);

			
			const sunColor = [1.0, 1.0, 1.0];
			const epsR = 0.3;
			const epsG = 0.5;
			const epsB = 0.7;

			if (x < 0.2)
			{
				this.color(sunColor[0], sunColor[1], sunColor[2], 1.0);
			} else {
			    this.color(
			    	sunColor[0] * 10**(-epsR * atmosConc * length),
			    	sunColor[1] * 10**(-epsG * atmosConc * length),
			    	sunColor[2] * 10**(-epsB * atmosConc * length),
			    	1.0
			    );
			}
		})
			.setOutput(this.viewSize.value)
		  	.setGraphical(true);

		this.#scaleCanv = document.createElement('canvas');
		this.#scaleCanv.width = this.viewSize.x;
		this.#scaleCanv.height = this.viewSize.y;
		this.#scaleCanvCtx = this.#scaleCanv.getContext('2d');


		window.addEventListener('resize', () => this.onResize());
		this.onResize();
	}

	onResize() {
		const pxScalar = 2;
		this.canvas.width = this.canvas.offsetWidth * pxScalar;
		this.canvas.height = this.canvas.offsetHeight * pxScalar;
		this.size = new Vector2D(this.canvas.width, this.canvas.height);
	}


	

	async draw() {
		this.renderOnGPU(this.viewSize.value); 

		const pxData = this.renderOnGPU.getPixels(); 
		const imgData = new ImageData(pxData, this.viewSize.x, this.viewSize.y);
		
		this.#scaleCanvCtx.putImageData(imgData, 0, 0);  
		
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.imageSmoothingEnabled = false;       // optional: crisp nearest-neighbor
		this.ctx.drawImage(this.#scaleCanv, 0, 0, this.canvas.width, this.canvas.height);
	}
}