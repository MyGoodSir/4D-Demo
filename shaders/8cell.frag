precision mediump float;
precision mediump int;

uniform float time;

varying vec4 vPosition;

void main()	{

	vec4 color = vec4( 0.,0.,1.,1.);
	color.r += vPosition.w * sin( 10.0 + time );

	gl_FragColor = color;

}