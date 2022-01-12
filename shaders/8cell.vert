precision mediump float;
precision mediump int;

struct Rotor {
    vec4 p;
    float theta;
};

uniform mat4 modelViewMatrix; 
uniform mat4 projectionMatrix;
uniform vec4 F,T,U,O,RP;
uniform float va4, time;
uniform Rotor rots[6];
vec4 frot;

attribute vec4 position;
varying vec3 vColor;
    
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

vec4 megaRot(vec4 v){
    for(int i=0;i<6;i++){
        v = genRotMat(rots[i].p,rots[i].theta) * v;
    }
    return v;
}
    
void main()	{
    frot = megaRot(F);
	vPosition = position;
    vColor = normalize(position.x*vec3(1.,0.,1.) + position.y*vec3(1.,0.,0.) 
             + position.z*vec3(0.,0.,1.) + position.w*vec3(0.,1.,0.))*.75 + vec3(.5);
    
	gl_Position = projectionMatrix * modelViewMatrix * vec4(p3d(position), 1.);
    
}