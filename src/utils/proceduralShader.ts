import * as THREE from 'three';

// Simplex 3D Noise function for GLSL
export const simplexNoise3D = `
// Simplex 3D Noise 
// by Ian McEwan, Ashima Arts
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0.0 + 0.0 * C 
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

// Permutations
  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients
// ( N*N points uniformly over a square, mapped onto an octahedron.)
  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}
`;

export const onBeforeCompileBrick = (shader: any) => {
  shader.vertexShader = shader.vertexShader.replace(
    '#include <common>',
    `
    #include <common>
    out vec3 vPos;
    out vec2 vUv2;
    ${simplexNoise3D}
    `
  );

  shader.vertexShader = shader.vertexShader.replace(
    '#include <begin_vertex>',
    `
    #include <begin_vertex>
    vPos = position;
    vUv2 = uv;

    // Apply macro displacement for weathered look
    float wNoise = snoise(position * 2.0);
    float edgeMask = smoothstep(0.4, 0.5, abs(uv.x - 0.5)) + smoothstep(0.4, 0.5, abs(uv.y - 0.5));
    // Erode the edges slightly
    vec3 wDisplacement = normal * (wNoise * 0.015 * clamp(edgeMask, 0.0, 1.0));
    transformed += wDisplacement;
    `
  );

  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <common>',
    `
    #include <common>
    in vec3 vPos;
    in vec2 vUv2;
    ${simplexNoise3D}
    `
  );

  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <color_fragment>',
    `
    #include <color_fragment>

    // Procedural texturing
    // High frequency pebbling
    float pebbleNoise = snoise(vPos * 250.0);
    float mediumNoise = snoise(vPos * 50.0);
    float macroNoise = snoise(vPos * 5.0);
    
    // Grout lines logic (edges)
    float edgeDistX = abs(vUv2.x - 0.5) * 2.0;
    float edgeDistY = abs(vUv2.y - 0.5) * 2.0;
    float edgeFact = max(pow(edgeDistX, 20.0), pow(edgeDistY, 20.0));
    
    // Color variation
    vec3 baseCol = diffuseColor.rgb;
    vec3 highlightCol = baseCol * 1.3;
    vec3 shadowCol = baseCol * 0.5;
    vec3 groutCol = vec3(0.6, 0.58, 0.55) * (1.0 + mediumNoise * 0.2);

    // Weathered variation
    vec3 finalColor = mix(baseCol, highlightCol, macroNoise * 0.5);
    finalColor = mix(finalColor, shadowCol, smoothstep(0.1, 0.9, pebbleNoise) * 0.4);

    // Mix in grout at the absolute edge
    diffuseColor.rgb = mix(finalColor, groutCol, edgeFact);
    `
  );

  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <roughnessmap_fragment>',
    `
    #include <roughnessmap_fragment>
    // Modify roughness based on noise
    float rNoise = snoise(vPos * 150.0) * 0.5 + 0.5;
    roughnessFactor = mix(0.4, 0.95, rNoise); // Highly varied roughness for realistic specularity
    // Edges are rougher
    float edgeR = max(pow(abs(vUv2.x - 0.5) * 2.0, 10.0), pow(abs(vUv2.y - 0.5) * 2.0, 10.0));
    roughnessFactor = mix(roughnessFactor, 1.0, edgeR);
    `
  );

  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <normal_fragment_maps>',
    `
    #include <normal_fragment_maps>
    // Procedural bump mapping
    float b1 = snoise(vPos * 250.0);
    float b2 = snoise(vPos * 80.0);
    float bump = b1 * 0.05 + b2 * 0.02;
    normal = normalize(normal + vec3(bump, bump, bump));
    `
  );
};
