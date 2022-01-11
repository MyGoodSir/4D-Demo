import * as THREE from "https://cdn.skypack.dev/three@0.132.2/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js";
const range = (start, stop, step = 1) => Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + (i * step));

const fshader = `
precision mediump float;
precision mediump int;

uniform float time;

varying vec4 vPosition;

void main()	{

	vec4 color = vec4( 0.,0.,1.,1.);
	color.r += vPosition.w * sin( 10.0 + time );

	gl_FragColor = color;

}
`;
const vshader = `
precision mediump float;
precision mediump int;

uniform mat4 modelViewMatrix; 
uniform mat4 projectionMatrix;
uniform vec4 F,T,U,O,RP;
uniform float va4, time, rAngle;
vec4 frot;

attribute vec4 position;
//attribute vec4 color;

varying vec4 vPosition;
float det2(vec2 a, vec2 b){
    return a.x*b.y-a.y*b.x;
}
float pcf(vec3 a, vec3 b){
    return dot(a.xz,b.zx)-(a.y*b.y);
}
float ncf(vec3 a, vec3 b){
    return -dot(a.xz,b.zx)+(a.y*b.y);
}
mat4 genRotMat(vec4 rp, float angle){
    float s, c, t;
    float x=rp.x, y=rp.y, z=rp.z,w=rp.w;
    s = sin(angle);
    c = cos(angle);
    t = c - 1.;
    return mat4(
        1. + x * t, -x * y * s, z * x * s, -x * w * s,
        x * y * s, 1. + y * t, -y * z * s, y * w * s,
        -z * x * s, y * z * s, 1. + z * t, z * w * s,
        x * w * s, -y * w * s, -z * w * s, 1. + w * t
    );
}
vec4 x4(vec4 u, vec4 v, vec4 w){
    vec3 a = vec3(det2(v.xy, w.xy),det2(v.xz, w.xz),det2(v.xw, w.xw));
    vec3 b = vec3(det2(v.yz, w.yz),det2(v.yw, w.yw),det2(v.zw, w.zw));
    return vec4(
        pcf(u.yzw, b.xyz),
        ncf(u.xzw, vec3(a.yz,b.z)),
        pcf(u.xyw, vec3(a.xz,b.y)),
        ncf(u.xyz, vec3(a.xy,b.x))
    );
}
void calc4mat(out vec4 Wa, out vec4 Wb, out vec4 Wc, out vec4 Wd){
    Wd = normalize(T-frot);
    Wa = normalize(x4(U,O,Wd));
    Wb = normalize(x4(O,Wd,Wa));
    Wc = normalize(x4(Wd,Wa,Wb));
}
vec3 p3d(vec4 p){
    vec4 a,b,c,d;
    calc4mat(a,b,c,d);
    vec4 v = p-frot;
    float scale = (1./tan(va4/2.))/dot(v,d);
    return scale*vec3(dot(v,a), dot(v,b), dot(v,c));
}

void main()	{
    frot = genRotMat(RP, rAngle) * F;
	vPosition = position;

	gl_Position = projectionMatrix * modelViewMatrix * vec4(p3d(position), 1.);

}
`;


let tprev = 0;

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 1, 1000);
camera.position.set(2, .5, 3);
let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

let controls = new OrbitControls(camera, renderer.domElement);

let dummy = new THREE.Object3D();

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
    vertexShader: vshader,
    fragmentShader: fshader,
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
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 4));//doublecheck this works with vector4
    g.setIndex(edges);
    
    return g;
}

