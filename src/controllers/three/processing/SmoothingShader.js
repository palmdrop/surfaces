var SmoothingShader = {

	uniforms: {

		'tDiffuse': { value: null },
		'opacity': { value: 1.0 },
        'source': { value: null }

	},

	vertexShader: /* glsl */`
		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,

	fragmentShader: /* glsl */`
		uniform float opacity;
		uniform sampler2D tDiffuse;
        uniform sampler2D source;

		varying vec2 vUv;


		void main() {
			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;
			//gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
		}`

};

export { SmoothingShader };