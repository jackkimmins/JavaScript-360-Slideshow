console.log("Loaded main.js");

let lon = 90, lat = -20, phi = 0, theta = 0, fov = 60;

//Initialises the 3D space.
const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 1, 1100);
const scene = new THREE.Scene();
const geometry = new THREE.SphereGeometry(500, 60, 40);

//Inverts the geometry.
geometry.scale(-1, 1, 1);

//Handles loaded textures.
const manager = new THREE.LoadingManager();

//Runs when the manager is being loaded.
manager.onLoad = () => {
    startSequence();
}

//Shuffles the given array.
function Shuffle(array) {
    let currentIndex = array.length, temporaryValue, randomIndex;
    while (0 !== currentIndex)
    {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

//Loads the 360s.
let tLoader = new THREE.TextureLoader(manager);
let textures = [
    tLoader.load("img/pano/1.JPG"),
    tLoader.load("img/pano/2.JPG"),
    tLoader.load("img/pano/3.JPG"),
    tLoader.load("img/pano/4.JPG"),
    tLoader.load("img/pano/5.JPG"),
    tLoader.load("img/pano/6.JPG"),
    tLoader.load("img/pano/7.JPG")
];

//Shuffles the textures.
textures = Shuffle(textures);

//Sets the material object and specifies the GL shaders.
let material = new THREE.ShaderMaterial({
    uniforms: {
        t1: {
            value: null
        },
        t2: {
            value: null
        },
        transition: {
            value: 0
        }
    },
    vertexShader: `
        varying vec2 vUv;

        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D t1;
        uniform sampler2D t2;
        uniform float transition;
        varying vec2 vUv;

        void main() {
            vec4 tex1 = texture2D(t1, vUv);
            vec4 tex2 = texture2D(t2, vUv);
        
            gl_FragColor = mix(tex1, tex2, transition);
        }
    `
});

let counter = 0;

//Creates the mesh object.
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

//Creates and adds the renderer to the DOM.
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//Detects when the window is resized and updates the render.
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
});

//Starts the loop animation.
function startSequence() {
    gsap.fromTo(material.uniforms.transition, { value: 0 }, {
        value: 1,
        duration: 10,
        repeat: -1,
        repeatRefresh: true,
        onRepat: () => {
            let idx1 = counter % textures.length;
            let idx2 = (idx1 + 1) == textures.length ? 0 : idx1 + 1;

            material.uniforms.t1.value = textures[idx1];
            material.uniforms.t2.value = textures[idx2];

            counter++;
        }       
    });
}

let latDirection = 0;
let fovDirection = 0;

//Pans the camera around the sphere and ensures that it always stays within the sphere's centre.
renderer.setAnimationLoop(_ => {
    lon += 0.02;

    if (lat > 6) {
        latDirection += -0.000008;
    } else if (lat < -18) {
        latDirection += 0.000008;
    }

    if (fov > 90) {
        fovDirection += -0.00008;
    } else if (fov < 60) {
        fovDirection += 0.00008;
    }

    lat += latDirection;
    fov += fovDirection;

    camera.fov = fov;
    camera.updateProjectionMatrix();

    lat = Math.max(-85, Math.min(85, lat));
    phi = THREE.MathUtils.degToRad(90 - lat);
    theta = THREE.MathUtils.degToRad(lon);

    const x = 500 * Math.sin(phi) * Math.cos(theta);
    const y = 500 * Math.cos(phi);
    const z = 500 * Math.sin(phi) * Math.sin(theta);

    camera.lookAt(x, y, z);

    renderer.render(scene, camera);
});