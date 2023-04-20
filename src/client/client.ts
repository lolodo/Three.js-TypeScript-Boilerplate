import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';
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
const pointLight = new THREE.PointLight( 0x00FF00, 1, 100 );
// const pointLight = new THREE.DirectionalLight(0xffffff, 0.5)
pointLight.position.set( 0, 0, 1);
pointLight.color.set(0xffffff)
pointLight.intensity = 0.5
scene.add( pointLight );

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

const normalTexture = textureLoader.load('/assets/normal.png')
const heightTexture = textureLoader.load('/assets/depth.png')
// const geometry = new THREE.SphereGeometry( 1, 64, 64 );
// console.log(imgTexture.innerWidth, imgTexture.innerHeight)
// console.log("size is ", imgTexture.naturalWidth, "x", imgTexture.naturalHeight)
const geometry = new THREE.PlaneGeometry(2, 3);
// PlaneGeometry
const material = new THREE.MeshStandardMaterial(
  {
    bumpMap:heightTexture,
    bumpScale:10,
    normalMap:normalTexture,
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
const sphere = new THREE.Mesh( geometry, material );
scene.add( sphere );

const lightSpot = new THREE.SphereGeometry(0.1);
const spotMat = new THREE.MeshStandardMaterial({
    map: textureLoader.load('/assets/fire.png'),
    color:0x292929,
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
  color : 0xffffff
}

light.addColor(lightColor, 'color').onChange( (e) => {
  pointLight.color.set(e)
} )

const mousePosition = new THREE.Vector2()
window.addEventListener('mousemove', function(e){
  mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1
  mousePosition.y = - (e.clientY / window.innerHeight) * 2 + 1
  console.log("pos changed:", mousePosition)
//   spotMesh.position.set(mousePosition.x * 2.0 - 1.0, mousePosition.y * 2.0 - 1.0, pointLight.position.z)
})

window.addEventListener('mousedown', function(e){
  mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1
  mousePosition.y = - (e.clientY / window.innerHeight) * 2 + 1
//   spotMesh.position.set(mousePosition.x, mousePosition.y, pointLight.position.z)
//   pointLight.position.x = mousePosition.x
//   pointLight.position.y = mousePosition.y
})

function animate(){
  // material.normalScale.set(time, time)
  spotMesh.position.set(pointLight.position.x, pointLight.position.y, pointLight.position.z)
  renderer.render(scene, camera)
}

renderer.setAnimationLoop(animate)

window.addEventListener('resize', function(){
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

