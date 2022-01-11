import * as THREE from "https://cdn.skypack.dev/three@0.132.2/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js";
const range = (start, stop, step = 1) => Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + (i * step));

async function main(){
    let [vs,fs] = await Promise.all(['./shaders/8cell.vert','./shaders/8cell.frag'].map(p=>fetch(p).then(r=>r.text())));
    let tprev = 0;
    
    let scene = new THREE.Scene();
    let camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 1, 1000);
    camera.position.set(2, .5, 3);
    let renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    document.body.appendChild(renderer.domElement);
    
    let controls = new OrbitControls(camera, renderer.domElement);
    
    let g8 = EightCellGeometry();
    let m8 = new THREE.RawShaderMaterial({
        
        uniforms: {
            time: { value: 0 },
            rAngle: { value: 0 },
            va4: { value: 45.0 },
            F: { value: new THREE.Vector4(4., 0., 0., 0.) },
            T: { value: new THREE.Vector4(0., 0., 0., 0.) },
            U: { value: new THREE.Vector4(0., 1., 0., 0.) },
            O: { value: new THREE.Vector4(0, 0, 1.0, 0) },
            RP: { value: new THREE.Vector4(1.0, 0.0, 0.0, 1.0) }
        },
        vertexShader: vs,
        fragmentShader: fs,
        side: THREE.DoubleSide,
        transparent: true
        
    });
    let l = new THREE.LineSegments(g8, m8);
    scene.add(l);
    
    window.addEventListener("resize", () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
    })
    
    let clock = new THREE.Clock();
    
    renderer.setAnimationLoop(() => {
        let t = clock.getElapsedTime() * 0.5;
        let dt = t - tprev;
        tprev = t;
        let wave = Math.sin(t);
        const object = scene.children[0];
        object.material.uniforms.time.value = t;
        if (wRot) { object.material.uniforms.rAngle.value += dt; }
        
        renderer.render(scene, camera);
    })

}
main();
function EightCellGeometry() {
    let pts = Array.from(range(0, 15),
    n => n.toString(2)
    .split('')
    .reverse()
    .concat(Array(4 - n.toString(2).split('').length).fill('0'))
    .reverse());
    let edges = Array.from(pts, (p, i) => {
        return pts.filter((_, oi) => oi > i)
        .filter(o => o.reduce((pr, cu, idx) => cu != p[idx] ? pr + 1 : pr, 0) == 1)
        .map(o => pts.indexOf(o)).reduce((pr, cu) => pr.concat(i, cu), []);
    }).flat();
    let verts = pts.flat().map(n => n == 0 ? -1 : n);
    
    let g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 4));
    g.setIndex(edges);
    
    return g;
}

