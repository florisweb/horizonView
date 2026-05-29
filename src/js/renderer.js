// Courtesy of https://joeiddon.github.io/projects/javascript/perlin.html
let perlin = {
    rand_vect: function(){
        let theta = Math.random() * 2 * Math.PI;
        return {x: Math.cos(theta), y: Math.sin(theta)};
    },
    dot_prod_grid: function(x, y, vx, vy){
        let g_vect;
        let d_vect = {x: x - vx, y: y - vy};
        if (this.gradients[[vx,vy]]){
            g_vect = this.gradients[[vx,vy]];
        } else {
            g_vect = this.rand_vect();
            this.gradients[[vx, vy]] = g_vect;
        }
        return d_vect.x * g_vect.x + d_vect.y * g_vect.y;
    },
    smootherstep: function(x){
        return 6*x**5 - 15*x**4 + 10*x**3;
    },
    interp: function(x, a, b){
        return a + this.smootherstep(x) * (b-a);
    },
    seed: function(){
        this.gradients = {};
        this.memory = {};
    },
    get: function(x, y) {
        if (this.memory.hasOwnProperty([x,y]))
            return this.memory[[x,y]];
        let xf = Math.floor(x);
        let yf = Math.floor(y);
        //interpolate
        let tl = this.dot_prod_grid(x, y, xf,   yf);
        let tr = this.dot_prod_grid(x, y, xf+1, yf);
        let bl = this.dot_prod_grid(x, y, xf,   yf+1);
        let br = this.dot_prod_grid(x, y, xf+1, yf+1);
        let xt = this.interp(x-xf, tl, tr);
        let xb = this.interp(x-xf, bl, br);
        let v = this.interp(y-yf, xt, xb);
        this.memory[[x,y]] = v;
        return v;
    }
}
perlin.seed();





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


		let perlinNoise = [0];
		// let perlinNoise = [];
		// for (let y = 0; y < this.viewSize.y; y++)
		// {
		// 	perlinNoise[y] = [];
		// 	for (let x = 0; x < this.viewSize.x; x++)
		// 	{
		// 		perlinNoise[y][x] = perlin.get(x / this.viewSize.x * 3, y / this.viewSize.y * 3) * 2;
		// 	}
		// }

		const createTexture = gpu.createKernel(function(_data, _viewSize) {
			return -1; //_data[this.thread.y][this.thread.x];
		})
			.setOutput(this.viewSize.value)
		  	.setPipeline(true);
		this.noiseTexture = createTexture(perlinNoise, this.viewSize.value);



		this.renderOnGPU = gpu.createKernel(function(_noiseTexture, _viewSize, t) {
			const worldRad = 1000;
			const atmosThickness = 1;// + (1 + Math.sin(2 * Math.PI * t / 1000 * 0.1))/2 * 50;

			const x = this.thread.x / _viewSize[0];
			const y = this.thread.y / _viewSize[1]; // Higher value = higher on screen
			const curNoise = _noiseTexture[this.thread.x][this.thread.y];
			const atmosConc = 0.01 * (x > 0.5 ? (1 + (1 + curNoise) * 0.1) : 1); // Atmospheric 'concentration'


			// TODO properly calculate d

			const d = y; // Height of the 'viewport' when projected against the atmospheric edge
			const length = Math.sqrt(d**2 + (worldRad + atmosThickness)**2 - (worldRad + d)**2);

			const wavelengths = [
				0.68, // units um
				0.54,
				0.45
			]; // nm
			const redWavelengthColor = [
				156/255, 31/255, 20/255
			];
			const greenWavelengthColor = [
				133/255, 243/255, 211/255
			];
			const blueWavelengthColor = [
				31/255, 12/255, 206/255
			];
			const wavelengthDist = [0.33, 0.33, 0.33];

			
			// const intensityScalar = 2;
			const intensityScalar = 0.5 * (1 + Math.sin(2 * Math.PI * t / 1000 * 0.1))/2 * 2;
			const sunColor = [
				(redWavelengthColor[0] * wavelengthDist[0] + greenWavelengthColor[0] * wavelengthDist[1] + blueWavelengthColor[0] * wavelengthDist[2]) * intensityScalar,
				(redWavelengthColor[1] * wavelengthDist[0] + greenWavelengthColor[1] * wavelengthDist[1] + blueWavelengthColor[1] * wavelengthDist[2]) * intensityScalar,
				(redWavelengthColor[2] * wavelengthDist[0] + greenWavelengthColor[2] * wavelengthDist[1] + blueWavelengthColor[2] * wavelengthDist[2]) * intensityScalar,
			];
			// const sunColor = [1.0, 1.0, 1.0];

			// const airEps = [0.1, 0.55, 1.5];
			const airEps = [0.1, 0.55, 1.5];

			// Absorption of light

			const absFactors = [
				10**(-airEps[0] * atmosConc * length),
				10**(-airEps[1] * atmosConc * length),
				10**(-airEps[2] * atmosConc * length)
			];

			
			const n = 1.5;
			const reyFactor = 100;
			// const reyFactor = 0.6;
			const l = length;
			const reyleighFactors = [
				Math.min(l**-2 * wavelengths[0]**-4 * reyFactor, 1),
				Math.min(l**-2 * wavelengths[1]**-4 * reyFactor, 1),
				Math.min(l**-2 * wavelengths[2]**-4 * reyFactor, 1)
				// 1 / (2 * length**2) * (2 * Math.PI / wavelengths[1])**4 * ((n**2 - 1)/(n**2 + 2))**2 * r**6,
				// 1 / (2 * length**2) * (2 * Math.PI / wavelengths[2])**4 * ((n**2 - 1)/(n**2 + 2))**2 * r**6,
			];

			// 1 / (2 * length**2) * (2 * Math.PI / wavelengths[2])**4 * ((n**2 - 1)/(n**2 + 2))**2 * r**6,

				
			if (x < 0.3)
			{
			    this.color(
			    	sunColor[0] * absFactors[0],
			    	sunColor[1] * absFactors[1],
			    	sunColor[2] * absFactors[2],
			    	1.0
			    );
			} else if (x < 0.6) {
				this.color(
			    	sunColor[0] * absFactors[0] * reyleighFactors[0],
			    	sunColor[1] * absFactors[1] * reyleighFactors[1],
			    	sunColor[2] * absFactors[2] * reyleighFactors[2],
			    	1.0
			    );

			} else {
			     this.color(
			    	sunColor[0] * reyleighFactors[0],
			    	sunColor[1] * reyleighFactors[1],
			    	sunColor[2] * reyleighFactors[2],
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
		this.renderOnGPU(this.noiseTexture, this.viewSize.value, new Date().getTime() - performance.timeOrigin); 

		const pxData = this.renderOnGPU.getPixels(); 
		const imgData = new ImageData(pxData, this.viewSize.x, this.viewSize.y);
		
		this.#scaleCanvCtx.putImageData(imgData, 0, 0);  
		
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.imageSmoothingEnabled = false;       // optional: crisp nearest-neighbor
		this.ctx.drawImage(this.#scaleCanv, 0, 0, this.canvas.width, this.canvas.height);
		requestAnimationFrame(() => this.draw());
	}
}