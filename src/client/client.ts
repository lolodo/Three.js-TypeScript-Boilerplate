import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import * as dat from 'dat.gui'

const renderer = new THREE.WebGLRenderer()

renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

renderer.shadowMap.enabled = true

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
  45, 
  window.innerWidth/window.innerHeight,
  1,
  1000
)
camera.position.set(0,0,5)

const orbit = new OrbitControls(camera, renderer.domElement)

const gui = new dat.GUI()

// const pointLightWhite = new THREE.PointLight( 0xffffff, 1, 100 );
// pointLightWhite.position.set( 0.0,0.0,3.43 );
// pointLightWhite.intensity = .5
// scene.add( pointLightWhite );

// const pointLightHelper1 = new THREE.PointLightHelper( pointLightWhite, 1 );
// scene.add( pointLightHelper1 );

// const pointLightRed = new THREE.PointLight( 0xff0000, 1, 100 );
// pointLightRed.position.set( 5,3.3,.34 );
// pointLightRed.intensity = 3.2
// scene.add( pointLightRed );

// const pointLightHelper2 = new THREE.PointLightHelper( pointLightRed, 1 );
// scene.add( pointLightHelper2 );

const pointLight2 = new THREE.PointLight( 0x00FF00, 1, 100 );
// const pointLight2 = new THREE.DirectionalLight(0xffffff, 0.5)
pointLight2.position.set( 0, 0, 1);
pointLight2.color.set(0xffffff)
pointLight2.intensity = 1.0
scene.add( pointLight2 );

// const pointLightHelper3 = new THREE.PointLightHelper( pointLight2, 1 );
// scene.add( pointLightHelper3 );

const textureLoader = new THREE.TextureLoader()
const imgTexture = textureLoader.load('/assets/origin.png')
console.log("img:", imgTexture)

// const fireTexture = textureLoader.load('/assets/origin.jpg') 
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

const normalTexture = textureLoader.load('/assets/normal.png')
const heightTexture = textureLoader.load('/assets/depth.png')
// const geometry = new THREE.SphereGeometry( 1, 64, 64 );
// console.log(imgTexture.innerWidth, imgTexture.innerHeight)
// console.log("size is ", imgTexture.naturalWidth, "x", imgTexture.naturalHeight)
console.log("size is ", imgTexture)
const geometry = new THREE.PlaneGeometry(2, 3);
// PlaneGeometry
const material = new THREE.MeshStandardMaterial(
  {
    normalMap:normalTexture,
    map: imgTexture,
    roughness: 0.4,
    metalness: 0.7,
    blending: THREE.CustomBlending,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneFactor
  }
)
// material.bumpMap = heightTexture 
// material.normalScale.set(2, 2)
const sphere = new THREE.Mesh( geometry, material );
scene.add( sphere );

// const fireTexture = textureLoader.load('/assets/fire.jpg') 
// const mat = new THREE.MeshBasicMaterial({
//   map: fireTexture,
//   depthTest: true,
//   depthWrite: false,
//   transparent: true,
//   blending: THREE.AdditiveBlending
// })

// const postPlane = new THREE.PlaneGeometry(2, 2)
// const postQuad = new THREE.Mesh(postPlane, mat)
// // postQuad.position.set(
// //   1920 - (800 * 0.5 + (1280 - 800) * 0.5),
// //   1280 * 0.5, 0
// //   )

// scene.add(postQuad)

const properties = gui.addFolder('properties')
properties.add(material, 'roughness', 0.0, 1.0, 0.01)
properties.add(material, 'metalness', 0.0, 1.0, 0.01)
properties.open()

// const normalParams = gui.addFolder('normal')
// normalParams.add(material.normalScale, 'x', 0.0, 2.0, 0.01)
// normalParams.add(material.normalScale, 'y', 0.0, 2.0, 0.01)
// normalParams.open()

// const heightParams = gui.addFolder('height')
// heightParams.add(material, 'bumpScale', 0.0, 2.0, 0.01)
// heightParams.open()

// const whiteLight = gui.addFolder('white light')

// whiteLight.add(pointLightWhite.position, 'x').min(-5).max(5).step(.01)
// whiteLight.add(pointLightWhite.position, 'y').min(-5).max(5).step(.01)
// whiteLight.add(pointLightWhite.position, 'z').min(-5).max(5).step(.01)
// whiteLight.add(pointLightWhite, 'intensity').min(0).max(10).step(.01)

// const redLight = gui.addFolder('red light')

// redLight.add(pointLightRed.position, 'x').min(-5).max(5).step(.01)
// redLight.add(pointLightRed.position, 'y').min(-5).max(5).step(.01)
// redLight.add(pointLightRed.position, 'z').min(-5).max(5).step(.01)
// redLight.add(pointLightRed, 'intensity').min(0).max(10).step(.01)

const light3 = gui.addFolder('light properties')

light3.add(pointLight2.position, 'x').min(-5).max(5).step(.01)
light3.add(pointLight2.position, 'y').min(-5).max(5).step(.01)
light3.add(pointLight2.position, 'z').min(-5).max(5).step(.01)
light3.add(pointLight2, 'intensity').min(0).max(10).step(.01)
light3.open()

const light3Color = {
  color : 0xffffff
}

light3.addColor(light3Color, 'color').onChange( (e) => {
  pointLight2.color.set(e)
} )

function animate(){
  // material.normalScale.set(time, time)
  renderer.render(scene, camera)
}

renderer.setAnimationLoop(animate)

window.addEventListener('resize', function(){
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

const mousePosition = new THREE.Vector2()
window.addEventListener('mousemove', function(e){
  mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1
  mousePosition.y = - (e.clientY / window.innerHeight) * 2 + 1
})