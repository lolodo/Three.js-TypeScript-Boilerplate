import * as THREE from 'three'

class TestGeometry extends THREE.BufferGeometry {
	depthData: any[] | undefined ;
	normalData: any[] | undefined; 
	canvas_width = 0;
	canvas_height = 0;
	canvas: HTMLCanvasElement;
	constructor(depthImgPath: string, normalImgPath:string, width = 1, height = 1) {
		super();

		this.canvas = document.createElement('canvas');
		const scale = 1;
		const ratio = 1;
		this.getPixelCanvas(depthImgPath, scale, (_canvas) => {
			const canvas = _canvas;

			this.canvas_width = canvas.width;
			this.canvas_height = canvas.height;
			this.depthData = this.getPixelColor(canvas, 0, 0, this.canvas_width, this.canvas_height);
			// console.log("depth data:", this.depthData);
			this.addParams(this.depthData, 0, width, height, canvas.width / ratio, canvas.height / ratio);
		})

		this.getPixelCanvas(normalImgPath, scale, (_canvas) => {
			const canvas = _canvas;

			this.canvas_width = canvas.width;
			this.canvas_height = canvas.height;
			this.normalData = this.getPixelColor(canvas, 0, 0, this.canvas_width, this.canvas_height);
			// console.log("normal data:", this.normalData);
			this.addParams(this.normalData, 1, width, height, canvas.width / ratio, canvas.height / ratio);
		})
	
	}
	
	addParams(data: any[], type: number, width: number, height: number, widthSegments: number, heightSegments: number) {
		const width_half = width / 2;
		const height_half = height / 2;

		const gridX = Math.floor(widthSegments);
		const gridY = Math.floor(heightSegments);

		const gridX1 = gridX + 1;
		const gridY1 = gridY + 1;

		const segment_width = width / gridX;
		const segment_height = height / gridY;

		const indices = [];
		const vertices = [];
		const normals = [];
		const uvs = [];

		for (let iy = 0; iy < gridY1; iy++) {

			const y = iy * segment_height - height_half;

			for (let ix = 0; ix < gridX1; ix++) {

				const x = ix * segment_width - width_half;

				const column = Math.round(this.canvas_width * ix / gridX1);
				const row = Math.round(this.canvas_height * iy / gridY1);
				var depth = 0;
				if (type == 0) {
					// const cur_data = data[row * this.canvas_width + column];
					// const cur_data = data[row * this.canvas_width + column];
					var cur_data = this.gaaussianSmooth(data, column, row, this.canvas_width, this.canvas_height);
					depth = (cur_data.x + cur_data.y + cur_data.z) / 3;
					if (depth < 0.2) {
						depth = 0;
					}
					vertices.push(x, - y, depth);
				} else if (type == 1) {
					// var normal = data[row * this.canvas_width + column];
					var normal = this.gaaussianSmooth(data, column, row, this.canvas_width, this.canvas_height);
					normal.x = 2.0 * normal.x - 1.0;
					normal.y = 2.0 * normal.y - 1.0;
					normal.z = 2.0 * normal.z - 1.0;
					// console.log("normal:", normal)
					normals.push(normal.x, normal.y, normal.z);
					// normals.push(0, 0, 1);
				} else {
					console.log("wrong type");
				}

				uvs.push(ix / gridX);
				uvs.push(1 - (iy / gridY));

			}

		}

		for (let iy = 0; iy < gridY; iy++) {

			for (let ix = 0; ix < gridX; ix++) {

				const a = ix + gridX1 * iy;
				const b = ix + gridX1 * (iy + 1);
				const c = (ix + 1) + gridX1 * (iy + 1);
				const d = (ix + 1) + gridX1 * iy;

				indices.push(a, b, d);
				indices.push(b, c, d);

			}

		}

		this.setIndex(indices);
		if (type == 0) {
			this.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
		} else if (type == 1) {
			this.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
		}
		this.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

		// console.log("vertices:", vertices)

	}

	copy(source: THREE.BufferGeometry) {

		super.copy(source);
		return this;

	}

	getPixelCanvas(url: string, scale = 1, callback: (arg0: HTMLCanvasElement) => any) {
		if (!url) return false;
		// let canvas = document.createElement('canvas');
		const canvas = this.canvas;
		const context = canvas.getContext('2d');
		if (context === null) {
			return false;
		}

		canvas.width = 512;
		canvas.height = 512;

		const img = new Image();

		img.src = url;
		img.onload = () => {
			const width = img.width / scale;
			const height = img.height / scale;

			canvas.width = width;
			canvas.height = height;

			context.drawImage(img, 0, 0, width, height);

			callback && callback(canvas);
		}
	}

	// 读取指定canvas 的像素颜色
	getPixelColor(canvas: { getContext: (arg0: string) => any; }, x: any, y: any, width: number, height: any) {
		var context = canvas.getContext("2d");
		var imageData = context.getImageData(x, y, width, height);
		// console.log("img:", imageData)
		// 获取该点像素数据 
		var pixel = imageData.data;

		// return `rgba(${r},${g},${b},${a})`
		let index = 0;
		const colors = [];
		for (let i = 0; i < pixel.length; i += 4) {

			var r = pixel[i + 0];
			var g = pixel[i + 1];
			var b = pixel[i + 2];
			var a = pixel[i + 3] / 255;

			const cols = index % (width);
			const rows = index / width;
			if (a != 0) {
				colors.push({
					x: cols + 1,
					y: Math.floor(rows) + 1,
					color: `rgb(${r}, ${g}, ${b})`,
					r: r / 255,
					g: g / 255,
					b: b / 255,
					a
				});
			}
			index++;
		};
		return colors;
	}

	gaaussianSmooth(data : any[], column: number, row: number, width: number, height: number) {
		if (data === undefined) {
			return;
		}
		var index = row * width + column;
		if (column < 1 || row < 1 || column >= width - 1 || row >= height - 1) {
			return data[index];
		}

		var index00 = (row - 1) * width + column - 1;
		var index01 = (row - 1) * width + column;
		var index02 = (row - 1) * width + column + 1;

		var index10 = row * width + column - 1;
		var index11 = row * width + column;
		var index12 = row * width + column + 1;

		var index20 = (row + 1) * width + column - 1;
		var index21 = (row + 1) * width + column;
		var index22 = (row + 1) * width + column + 1;

		var v00 = new THREE.Vector3(data[index00].r, data[index00].g, data[index00].b);
		var v01 = new THREE.Vector3(data[index01].r, data[index01].g, data[index01].b);
		var v02 = new THREE.Vector3(data[index02].r, data[index01].g, data[index01].b);

		var v10 = new THREE.Vector3(data[index10].r, data[index10].g, data[index10].b);
		var v11 = new THREE.Vector3(data[index11].r, data[index11].g, data[index11].b);
		var v12 = new THREE.Vector3(data[index12].r, data[index12].g, data[index12].b);

		var v20 = new THREE.Vector3(data[index20].r, data[index20].g, data[index20].b);
		var v21 = new THREE.Vector3(data[index21].r, data[index21].g, data[index21].b);
		var v22 = new THREE.Vector3(data[index22].r, data[index22].g, data[index22].b);

		v01 = v01.multiplyScalar(2.0);
		v10 = v10.multiplyScalar(2.0);
		v11 = v11.multiplyScalar(4.0);
		v12 = v12.multiplyScalar(2.0);
		v21 = v21.multiplyScalar(2.0);

		var result = v00.add(v01).add(v02).add(v10).add(v11).add(v12).add(v20).add(v21).add(v22);
		result = result.divideScalar(16.0);

		return result;
	}
}

export { TestGeometry };