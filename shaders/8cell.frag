precision mediump float;
precision mediump int;
#define TWOPI 6.28318

struct Rotor {
    vec4 p;
    float theta;
};

uniform int colorMode;
uniform float time;
uniform Rotor rots[6];
    
varying vec4 vPosition;
varying vec3 vColor;

struct PaletteGen{
    vec3 a, b, c, d;
};

float sumThetas(){
    float sum = 0.;
    for(int i = 0; i<6; i++){
        sum+=rots[i].theta;
    }
    return sum;
}

vec3 genColor(PaletteGen p){
    return p.a+p.b*cos(TWOPI*p.c*time+p.d);
}
void main()	{
    vec4 color;
    if(colorMode == 0){
        color = vec4(0.,0.,1.,1.);
        color += vPosition * asin(sin( 10.0 + time ));
    }
    else if(colorMode == 1){
        PaletteGen ypm = PaletteGen(
        vec3(0.731, 1.098, 0.192), 
        vec3(0.358, 1.090, 0.657), 
        vec3(1.077, 0.360, 0.328), 
        vec3(0.965, 2.265, 0.837)*1./vPosition.w);
        color = vec4(genColor(ypm),1.);
    }
    else if(colorMode == 2){
        color = vec4( vec3(0.5,0.,1.)*cos(1./vPosition.z) + vec3(1.5)*cos(1./vPosition.y)*cos(3.14159265*vec3(1.,1.,0.)*(sumThetas()/time)*1./vPosition.w)- vec3(0.,1.,0),1.) ;

    }
    else if(colorMode == 3){
        color = vec4(vColor,1.);
    }
    else if(colorMode == 4){
        color = vec4(.5,.3,.7,1.);
    }
    
	gl_FragColor = color;//clamp(normalize(color),.2,1.);
    
}