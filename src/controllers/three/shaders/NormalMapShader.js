var NormalMapShader = {
	uniforms: {

		'tDiffuse': { value: null },
		'opacity': { value: 1.0 },
		'width': { value: 0 },
		'height': { value: 0 },
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

		uniform float width;
		uniform float height;

		varying vec2 vUv;


		float toGray(vec4 color) {
			return dot(color.rgb, vec3(0.299, 0.587, 0.114));
		}

		float smpl(float offsetX, float offsetY) {
			return toGray(texture2D( tDiffuse, vUv + vec2(offsetX, offsetY)));
		}

		vec3 getNormal(vec2 uv) {
			float offsetX = 1.0 / width;	
			float offsetY = 1.0 / height;	

			float tx0 = toGray(texture2D( tDiffuse, uv + vec2(-offsetX, 0)));
			float tx1 = toGray(texture2D( tDiffuse, uv + vec2(offsetX, 0)));

			float ty0 = toGray(texture2D( tDiffuse, uv + vec2(0, -offsetX)));
			float ty1 = toGray(texture2D( tDiffuse, uv + vec2(0, offsetX)));

			vec3 normal = normalize(vec3(
				(tx0 - tx1) / (offsetX),
				(ty0 - ty1) / (offsetY),
				1
			));

			normal.x += 1.0;
			normal.x /= 2.0;
			normal.y += 1.0;
			normal.y /= 2.0;
			normal.z = 1.0;

			return normal;

			/*vec3 p1 = vec3(uv, 0.0);
			vec3 p2 = vec3(uv + vec2(offsetX, 0), 0.0);
			vec3 p3 = vec3(uv + vec2(0, offsetY), 0.0);

			p1.z = toGray(texture2D( tDiffuse, p1.xy ));
			p2.z = toGray(texture2D( tDiffuse, p2.xy ));
			p3.z = toGray(texture2D( tDiffuse, p3.xy ));

			vec3 u = p2 - p1;
			vec3 v = p3 - p1;

			return normalize(vec3(
				((u.y * v.z - u.z * v.y) + 1.0) / 2.0,
				((u.z * v.x - u.x - v.z) + 1.0) / 2.0,
				((u.x * v.y - u.y * v.x) + 1.0) / 2.0
			));*/

			/*vec3 normal;
			float scale = 1.0 / width;

			float s0 = smpl(-offsetX, -offsetY);
			float s1 = smpl(0.0, -offsetY);
			float s2 = smpl(offsetX, -offsetY);

			float s3 = smpl(-offsetX, 0.0);
			float s4 = smpl(0.0, 0.0);
			float s5 = smpl(offsetX, 0.0);

			float s6 = smpl(-offsetX, offsetY);
			float s7 = smpl(0.0, offsetY);
			float s8 = smpl(offsetX, offsetY);

			normal.x = scale * -(s2-s0+2.0*(s5-s3)+s8-s6);
			normal.y = scale * -(s6-s0+2.0*(s7-s1)+s8-s2);
			normal.z = 1.0;

			normal = normalize(normal);

			normal.x += 1.0;
			normal.x /= 2.0;
			normal.y += 1.0;
			normal.y /= 2.0;

			return normal;*/
		}

		void main() {
			vec4 texel = texture2D( tDiffuse, vUv );
			//float gray = toGray(texel);
			//gl_FragColor = opacity * vec4(vec3(gray), texel.a);
			vec3 normal = getNormal( vUv );
			gl_FragColor = vec4(normal, texel.a);
		}`
};

export { NormalMapShader };