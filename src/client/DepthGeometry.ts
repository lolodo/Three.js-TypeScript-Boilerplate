import * as THREE from 'three'

class DepthGeometry extends THREE.BufferGeometry {
    imagePath: string;

	constructor(imgPath: string, widthSegments = 32, heightSegments = 32) {
		super();
        this.imagePath = imgPath

		widthSegments = Math.max( 3, Math.floor( widthSegments ) );
		heightSegments = Math.max( 3, Math.floor( heightSegments ) );

        const loader = new THREE.ImageLoader();
        const image = loader.load(imgPath);
        console.log(this.imagePath, ":", image.width, "x", image.height)
        console.log("image:", image)
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        if (context !== null) {
            context.drawImage(image, 0, 0)
            var data = context.getImageData(0, 0, image.width, image.height).data
            console.log("data0:", data)
        }
        

		let index = 0;
		const grid = [];

		const vertex = new THREE.Vector3();
		const normal = new THREE.Vector3();

		// buffers

		const indices = [];
		const vertices = [];
		const normals = [];
		const uvs = [];

		// generate vertices, normals and uvs

		for ( let iy = 0; iy <= heightSegments; iy ++ ) {

			const verticesRow = [];

			const v = iy / heightSegments;

			// special case for the poles

			let uOffset = 0;
			for ( let ix = 0; ix <= widthSegments; ix ++ ) {

				const u = ix / widthSegments;

				// vertex

				vertex.x = u * 2.0 - 1.0;
				vertex.y = v * 2.0 - 1.0;
                // vertex.z = (u - 0.5) * (u - 0.5) + (v - 0.5) * (v - 0.5);
                vertex.z = 0;
				vertices.push( vertex.x, vertex.y, vertex.z );

				// normal

				normal.copy( vertex ).normalize();
				normals.push( normal.x, normal.y, normal.z );

				// uv

				uvs.push( u, 1 - v );

				verticesRow.push( index ++ );

			}

			grid.push( verticesRow );

		}

		// indices

		for ( let iy = 0; iy < heightSegments; iy ++ ) {

			for ( let ix = 0; ix < widthSegments; ix ++ ) {

				const a = grid[ iy ][ ix + 1 ];
				const b = grid[ iy ][ ix ];
				const c = grid[ iy + 1 ][ ix ];
				const d = grid[ iy + 1 ][ ix + 1 ];

				if ( iy !== 0) indices.push( a, b, d );
				if ( iy !== heightSegments - 1  ) indices.push( b, c, d );

			}

		}

		// build geometry

		this.setIndex( indices );
		this.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
		this.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );
		this.setAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );

	}

	copy( source: THREE.BufferGeometry ) {

		super.copy( source );

		// this.parameters = Object.assign( {}, source.parameters );

		return this;

	}

}

export { DepthGeometry };