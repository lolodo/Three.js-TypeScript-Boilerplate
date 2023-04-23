import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';
import * as dat from 'dat.gui'
import { DepthGeometry } from './DepthGeometry';
import { TestGeometry } from './TestGeometry';
import { exit } from 'process';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// 3D/2D
let render_mode = '3D';

let render_pass = false;
var composer: EffectComposer | undefined;

// const originImg = '/assets/original.jpeg'
// const depthImg = '/assets/depth-estimation.jpeg'
// const maskImg = '/assets/mask.png'
// const normalImg = '/assets/surface-normals.jpeg'

const originImg = '/assets/model/origin.png'
const depthImg = '/assets/model/depth.png'
const maskImg = '/assets/mask.png'
const normalImg = '/assets/model/normal.png'

const blendingShader = {
    'uniforms': {
        'tDiffuse': { 'type': 't', 'value': null },
        'rPower': { 'type': 'f', 'value': 0.2126 },
        'gPower': { 'type': 'f', 'value': 0.7152 },
        'bPower': { 'type': 'f', 'value': 0.0722 }
    },

    'vertexShader': [
        `varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
        `
    ].join('\n'),

    'fragmentShader': [
        `
      uniform float rPower;
      uniform float gPower;
      uniform float bPower;

      // pass in the image/texture we'll be modifying
      uniform sampler2D tDiffuse;

      // used to determine the correct texel we're working on
      varying vec2 vUv;

      // executed, in parallel, for each pixel
      void main() {

      // get the pixel from the texture we're working with (called a texel)
      vec4 texel = texture2D( tDiffuse, vUv );

      // calculate the new color
      float gray = texel.r*rPower + texel.g*gPower + texel.b*bPower;

      // return this new color
      gl_FragColor = vec4( vec3(gray), texel.w );
      }`

    ].join('\n')
}

const renderer = new THREE.WebGLRenderer()

if (render_pass) {
    composer = new EffectComposer(renderer);
}

const container = document.getElementById('container')
if (container === null) {
    exit(-1)
}

renderer.setSize(window.innerWidth, window.innerHeight)
container.appendChild(renderer.domElement)

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
pointLight.color.set(0xffffff)
if (render_mode == '2D') {
    pointLight.position.set(-0.6, 0.7, -0.2);
    pointLight.intensity = 1.0
} else {
    pointLight.position.set(-0.6, 0.7, 3);
    pointLight.intensity = 0.5

}
scene.add(pointLight);

const textureLoader = new THREE.TextureLoader()
const imgTexture = textureLoader.load(originImg)

const imageLoader = new THREE.ImageLoader()
const imageparams = imageLoader.load(originImg)
if (render_mode === '2D') {
    const postPlane = new THREE.PlaneGeometry(2, 2.0 * imageparams.height / imageparams.width)
    const mat = new THREE.MeshBasicMaterial({
        map: imgTexture,
        depthTest: true,
        depthWrite: false,
        transparent: true,
        blending: THREE.NoBlending
    })
    const postQuad = new THREE.Mesh(postPlane, mat)
    // postQuad.position.set(
    //   1920 - (800 * 0.5 + (1280 - 800) * 0.5),
    //   1280 * 0.5, 0
    //   )

    scene.add(postQuad)
}

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
// console.log("buffer geo:", bufferGeometry)

// Create a texture loader so we can load our image file
var loader = new THREE.TextureLoader();

// specify the url to the texture
var url = originImg;

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

const properties = gui.addFolder('properties')

const alphaTexture = textureLoader.load(maskImg)
const normalTexture = textureLoader.load(normalImg)
if (render_mode !== '2D') {
    const mat = new THREE.MeshBasicMaterial({
        map: imgTexture,
        depthTest: true,
        depthWrite: false,
        transparent: true,
        blending: THREE.AdditiveBlending
    })

    var depthMat = new THREE.MeshStandardMaterial({
        // displacementMap:heightTexture,
        // alphaMap:alphaTexture,
        // displacementScale:10.0
        // normalMap: normalTexture,
        map: imgTexture,
        roughness: 0.8,
        metalness: 0.5,
        depthTest: true,
        depthWrite: true,
        transparent: false
        // blending: THREE.NoBlending
        // blending: THREE.CustomBlending,
        // blendSrc: THREE.OneFactor,
        // blendDst: THREE.OneFactor
        // wireframe:true
    })

    var depthGeo = new TestGeometry(depthImg, normalImg, 2, 2.0 * imageparams.height / imageparams.width);
    var mesh0 = new THREE.Mesh(depthGeo, mat);
    scene.add(mesh0)
    var mesh1 = new THREE.Mesh(depthGeo, depthMat);
    scene.add(mesh1)

    properties.add(depthMat, 'roughness', 0.0, 1.0, 0.01)
    properties.add(depthMat, 'metalness', 0.0, 1.0, 0.01)
    properties.add(depthMat, 'bumpScale', 0.0, 10.0, 0.01)
}
// console.log("depth geo:", depthGeo)

// const normalTexture = textureLoader.load('/assets/normal.png')
// const sgeometry = new THREE.SphereGeometry(1, 64, 64);
// console.log("sphere:", sgeometry)
// console.log(imgTexture.innerWidth, imgTexture.innerHeight)
// console.log("size is ", imgTexture.naturalWidth, "x", imgTexture.naturalHeight)

if (render_mode === '2D') {
    const geometry = new THREE.PlaneGeometry(2, 2.0 * imageparams.height / imageparams.width)
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

    properties.add(material, 'roughness', 0.0, 1.0, 0.01)
    properties.add(material, 'metalness', 0.0, 1.0, 0.01)
    properties.add(material, 'bumpScale', 0.0, 10.0, 0.01)
}

// const lightSpot = new THREE.SphereGeometry(0.1);
// const spotMat = new THREE.MeshStandardMaterial({
//     // map: textureLoader.load('/assets/fire.png'),
//     color: 0x292929,
//     roughness: 0.4,
//     metalness: 0.7,
//     blending: THREE.NoBlending
// })

// const spotMesh = new THREE.Mesh(lightSpot, spotMat)
// scene.add(spotMesh)

properties.open()

const light = gui.addFolder('light properties')

light.add(pointLight.position, 'x').min(-5).max(5).step(.01)
light.add(pointLight.position, 'y').min(-5).max(5).step(.01)
light.add(pointLight.position, 'z', -10, 10, 0.01)
light.add(pointLight, 'intensity').min(0).max(3).step(.01)
light.open()

const lightColor = {
    color: 0xffffff
}

light.addColor(lightColor, 'color').onChange((e) => {
    pointLight.color.set(e)
})

if (render_pass && composer !== undefined) {
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const effectCustomGrayScale = new ShaderPass(blendingShader);
    composer.addPass(effectCustomGrayScale);

    // const glitchPass = new GlitchPass();
    // composer.addPass( glitchPass );
}

const mousePosition = new THREE.Vector2()
window.addEventListener('mousemove', function (e) {
    mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1
    mousePosition.y = - (e.clientY / window.innerHeight) * 2 + 1
    // console.log("pos changed:", mousePosition)
    //   spotMesh.position.set(mousePosition.x * 2.0 - 1.0, mousePosition.y * 2.0 - 1.0, pointLight.position.z)
})

window.addEventListener('dragstart', function (e) {
})

window.addEventListener('dragend', function (e) {
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
    // spotMesh.position.set(pointLight.position.x, pointLight.position.y, pointLight.position.z)
    if (render_pass && composer !== undefined) {
        requestAnimationFrame(animate);
        composer.render();
    } else {
        renderer.render(scene, camera)

    }
}

renderer.setAnimationLoop(animate)

window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
})

