import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';
import * as dat from 'dat.gui'
import { DepthGeometry } from './DepthGeometry';
import { TestGeometry } from './TestGeometry';

const renderer = new THREE.WebGLRenderer()

renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

renderer.shadowMap.enabled = true

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    1000
)
camera.position.set(0, 0, 5)

const orbit = new OrbitControls(camera, renderer.domElement)

const gui = new dat.GUI()
const pointLight = new THREE.PointLight(0x00FF00, 1, 100);
// const pointLight = new THREE.DirectionalLight(0xffffff, 0.5)
pointLight.position.set(0, 0, 1);
pointLight.color.set(0xffffff)
pointLight.intensity = 0.5
scene.add(pointLight);

const textureLoader = new THREE.TextureLoader()
const imgTexture = textureLoader.load('assets/origin.png')

const mat = new THREE.MeshBasicMaterial({
    map: imgTexture,
    depthTest: true,
    depthWrite: false,
    transparent: true,
    blending: THREE.AdditiveBlending
})

const postPlane = new THREE.PlaneGeometry(2, 3)
const postQuad = new THREE.Mesh(postPlane, mat)
// postQuad.position.set(
//   1920 - (800 * 0.5 + (1280 - 800) * 0.5),
//   1280 * 0.5, 0
//   )

scene.add(postQuad)

const vertex_shader = `
    varying vec2 vUv; // pass the uv coordinates of each pixel to the frag shader

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`
const fragment_shader = `
// precision highp float; // set float precision (optional)
uniform sampler2D depthTexture; // identify the texture as a uniform argument
varying vec2 vUv; // identify the uv values as a varying attribute

void main() {
  gl_FragColor = texture2D(depthTexture, vUv);
}`


var bufferGeometry = new THREE.BufferGeometry();

/*
Now we need to push some vertices into that geometry to identify the coordinates the geometry should cover
*/

// Identify the image size
var imageSize = { width: 10, height: 7.5 };

// Identify the x, y, z coords where the image should be placed
var coords = { x: -5, y: -3.75, z: 0 };

// Add one vertex for each corner of the image, using the 
// following order: lower left, lower right, upper right, upper left
var vertices = new Float32Array([
    coords.x, coords.y, coords.z, // bottom left
    coords.x + imageSize.width, coords.y, coords.z, // bottom right
    coords.x + imageSize.width, coords.y + imageSize.height, coords.z, // upper right
    coords.x, coords.y + imageSize.height, coords.z, // upper left
])

// set the uvs for this box; these identify the following corners:
// lower-left, lower-right, upper-right, upper-left
var uvs = new Float32Array([
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
])

// indices = sequence of index positions in `vertices` to use as vertices
// we make two triangles but only use 4 distinct vertices in the object
// the second argument to THREE.BufferAttribute is the number of elements
// in the first argument per vertex
bufferGeometry.setIndex([0, 1, 2, 2, 3, 0])
bufferGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
bufferGeometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
console.log("buffer geo:", bufferGeometry)

// Create a texture loader so we can load our image file
var loader = new THREE.TextureLoader();

// specify the url to the texture
var url = '/assets/origin.png';

// specify custom uniforms and attributes for shaders
// Uniform types: https://github.com/mrdoob/three.js/wiki/Uniforms-types
var meshMaterial = new THREE.ShaderMaterial({
    uniforms: {
        depthTexture: {
            value: loader.load(url)
        },
    },
    vertexShader: vertex_shader,
    fragmentShader: fragment_shader
});

// Combine our image geometry and material into a mesh
var mesh = new THREE.Mesh(bufferGeometry, meshMaterial);

// Set the position of the image mesh in the x,y,z dimensions
mesh.position.set(0, 0, 0)

// Add the image to the scene
// scene.add(mesh);

const heightTexture = textureLoader.load('/assets/depth.png')
const normalTexture = textureLoader.load('/assets/normal.png')
var depthMat = new THREE.MeshStandardMaterial({
    // displacementMap:heightTexture,
    // alphaMap:heightTexture
    // displacementScale:10.0
    normalMap: normalTexture,
    map:imgTexture,
    roughness: 0.8,
    metalness: 0.5,
    blending: THREE.CustomBlending,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneFactor
    // wireframe:true
})
// var depthGeo = new TestGeometry('/assets/depth.png');
// var depthGeo = new TestGeometry(2, 3);
// // const depthGeo = new THREE.PlaneGeometry(2, 3);
// var mesh1 = new THREE.Mesh(depthGeo, depthMat);
// scene.add(mesh1)
// console.log("depth geo:", depthGeo)

// const normalTexture = textureLoader.load('/assets/normal.png')
const sgeometry = new THREE.SphereGeometry( 1, 64, 64 );
console.log("sphere:", sgeometry)
// console.log(imgTexture.innerWidth, imgTexture.innerHeight)
// console.log("size is ", imgTexture.naturalWidth, "x", imgTexture.naturalHeight)
const geometry = new THREE.PlaneGeometry(2, 3);
// PlaneGeometry
const material = new THREE.MeshStandardMaterial(
    {
        // displacementMap: heightTexture,
        // bumpScale: 10,
        normalMap: normalTexture,
        map: imgTexture,
        roughness: 0.8,
        metalness: 0.5,
        blending: THREE.CustomBlending,
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.OneFactor
    }
)
// material.bumpMap = heightTexture 
// material.normalScale.set(2, 2)
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

const lightSpot = new THREE.SphereGeometry(0.1);
const spotMat = new THREE.MeshStandardMaterial({
    map: textureLoader.load('/assets/fire.png'),
    color: 0x292929,
    roughness: 0.4,
    metalness: 0.7,
    blending: THREE.NoBlending
})

const spotMesh = new THREE.Mesh(lightSpot, spotMat)
// scene.add(spotMesh)

const properties = gui.addFolder('properties')
properties.add(material, 'roughness', 0.0, 1.0, 0.01)
properties.add(material, 'metalness', 0.0, 1.0, 0.01)
properties.add(material, 'bumpScale', 0.0, 10.0, 0.01)
properties.open()

const light = gui.addFolder('light properties')

light.add(pointLight.position, 'x').min(-5).max(5).step(.01)
light.add(pointLight.position, 'y').min(-5).max(5).step(.01)
light.add(pointLight.position, 'z', -10, 10, 0.01)
light.add(pointLight, 'intensity').min(0).max(1).step(.01)
light.open()

const lightColor = {
    color: 0xffffff
}

light.addColor(lightColor, 'color').onChange((e) => {
    pointLight.color.set(e)
})

const mousePosition = new THREE.Vector2()
window.addEventListener('mousemove', function (e) {
    mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1
    mousePosition.y = - (e.clientY / window.innerHeight) * 2 + 1
    // console.log("pos changed:", mousePosition)
    //   spotMesh.position.set(mousePosition.x * 2.0 - 1.0, mousePosition.y * 2.0 - 1.0, pointLight.position.z)
})

window.addEventListener('mousedown', function (e) {
    mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1
    mousePosition.y = - (e.clientY / window.innerHeight) * 2 + 1
    //   spotMesh.position.set(mousePosition.x, mousePosition.y, pointLight.position.z)
    //   pointLight.position.x = mousePosition.x
    //   pointLight.position.y = mousePosition.y
})

function animate() {
    // material.normalScale.set(time, time)
    spotMesh.position.set(pointLight.position.x, pointLight.position.y, pointLight.position.z)
    renderer.render(scene, camera)
}

renderer.setAnimationLoop(animate)

window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
})

