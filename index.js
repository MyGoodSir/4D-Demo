import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js";
import { GUI } from 'https://cdn.jsdelivr.net/npm/lil-gui@0.16/+esm';

class Rotor {
    constructor(plane, theta = 0) {
        this.p = plane;
        this.theta = theta
    }
    updateTheta = (dt) => { this.theta = this.theta + dt; return this; }
}

const range = (start, stop, step = 1) => Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + (i * step));
const gui = new GUI();
const speeds = { xy: 0, xz: 0, xw: 0, yz: 0, yw: 0, zw: 0 }
const colorControls = { colorMode: 0}
const rotors = {
    xy: new Rotor(new THREE.Vector4(1, 1, 0, 0)),
    xz: new Rotor(new THREE.Vector4(1, 0, 1, 0)),
    xw: new Rotor(new THREE.Vector4(1, 0, 0, 1)),
    yz: new Rotor(new THREE.Vector4(0, 1, 1, 0)),
    yw: new Rotor(new THREE.Vector4(0, 1, 0, 1)),
    zw: new Rotor(new THREE.Vector4(0, 0, 1, 1)),
    value: [],
}
function updateRotors(dt) {
    for (const [key, val] of Object.entries(speeds)) {
        if (key != 'init') { rotors[key].updateTheta(dt * val); }
    }
}

async function main() {
    /*
        init gui
    */
    colorControls.colorMode = 0;
    for (let p in speeds) {
        speeds[p] = 0;
    }
    rotors['value'] = [rotors.xy, rotors.xz, rotors.xw, rotors.yz, rotors.yw, rotors.zw];
    for (const [key, val] of Object.entries(speeds)) {
        if (key != 'init') { gui.add(speeds, key, 0, 2); }
    }
    gui.add(colorControls, 'colorMode', { basic: 0, vibe: 1, based: 2, tame: 3, bland: 4 });

    /*
        init threejs stuff
    */
    let tprev = 0;
    let scene = new THREE.Scene();
    let camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 1, 1000);
    camera.position.set(2, .5, 3);
    let renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    document.body.appendChild(renderer.domElement);
    let controls = new OrbitControls(camera, renderer.domElement);

    /*
        setup geometry
    */
    let [vs, fs] = await Promise.all(['./shaders/8cell.vert', './shaders/8cell.frag'].map(p => fetch(p).then(r => r.text())));
    let g8 = EightCellGeometry();
    let m8 = new THREE.RawShaderMaterial({

        uniforms: {
            time: { value: 0 },
            rots: { value: [rotors.xy, rotors.xz, rotors.xw, rotors.yz, rotors.yw, rotors.zw] },
            va4: { value: 45.0 },
            colorMode: { value: colorControls.colorMode },
            F: { value: new THREE.Vector4(4., 0., 0., 0.) },
            T: { value: new THREE.Vector4(0., 0., 0., 0.) },
            U: { value: new THREE.Vector4(0., 1., 0., 0.) },
            O: { value: new THREE.Vector4(0., 0., 1., 0.) },
            RP: { value: new THREE.Vector4(1.0, 0.0, 0.0, 1.0) }
        },
        vertexShader: vs,
        fragmentShader: fs,
        side: THREE.DoubleSide,
        transparent: true

    });
    let l = new THREE.LineSegments(g8, m8);
    scene.add(l);


    /*
        resize callback
    */
    window.addEventListener("resize", () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
    })

    let clock = new THREE.Clock();
    /*
        render loop
    */
    renderer.setAnimationLoop(() => {
        let t = clock.getElapsedTime() * 0.5;
        let dt = t - tprev;
        tprev = t;
        let wave = Math.sin(t);
        const object = scene.children[0];
        updateRotors(dt);
        object.material.uniforms.time.value = t;
        object.material.uniforms.colorMode.value = colorControls.colorMode;
        object.material.uniforms.rots.value = rotors.value;

        renderer.render(scene, camera);
    })

}
main();


function EightCellGeometry() {

    /*
        this generates the list of vertex positions    
    */
    let pts = Array.from(range(0, 15),                                  //count to 15
        n => n.toString(2)                                              // take each number in binary (ie. 0,1,10,11,...,1111)
            .split('')                                                  // split into a char array ('1111' becomes ['1','1','1','1'])
            .reverse()                                                  //--v--
            .concat(Array(4 - n.toString(2).split('').length).fill('0'))// pad out the beginning with zeros so that all arrays have 4 elements
            .reverse());                                                //--^--

    /*
        this generates an edge list 
    */
    let edges = Array.from(pts, (p, i) => {                                                     //for each point
        return pts.filter((_, oi) => oi > i)                                                    //only consider points we havent checked this against
            .filter(o => o.reduce((pr, cu, idx) => cu != p[idx] ? pr + 1 : pr, 0) == 1)         //filter by vertices that only have one differing coordinate from the current vertex
            .map(o => pts.indexOf(o)).reduce((pr, cu) => pr.concat(i, cu), []);                 //map to the index of those vertices and create an array where each of the selected indices is paired with the index of the current vertex.
    }).flat();                                                                                  //flatten all the adjacency lists into one long index array


    //change the vertex coordinates to be centered around the origin
    let verts = pts.flat().map(n => n == 0 ? -1 : n);

    //create the buffer geometry out of the stuff we generated
    let g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 4));
    g.setIndex(edges);

    return g;
}




