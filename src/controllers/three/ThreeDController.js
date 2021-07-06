import * as THREE from 'three'
import * as POSTPROCESSING from 'postprocessing';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'

import { AttributeController } from '../ControllerAttributes'
import { TextureProcessor } from './processing/TextureProcessor';
import { NormalMapShader } from './shaders/NormalMapShader';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { SSAARenderPass } from 'three/examples/jsm/postprocessing/SSAARenderPass'; 

const createLightAttributes = (light, description, opts) => {
    const attributes = {};

    attributes.description = description;

    attributes.value = {
        intensity: {
            value: opts.intensity,
            default: opts.intensity,
            min: 0,
            max: 15,

            onChange: (value) => {
                light().intensity = value;
            },

            description: "Intensity/brightness of the light"
        },
        color: {
            value: opts.color,
            default: opts.color,
            type: 'color',
            
            onChange: (value) => {
                light().color.set(value);
            },

            description: "Color of the light"
        }

    };

    if(opts.type !== 'ambient') {
        attributes.value.x = {
            value: opts.position.x,
            default: opts.position.x,
            min: -2,
            max: 2,

            onChange: (value) => {
                light().position.x = value;
            },

            description: "X-coordinate of the light"
        };

        attributes.value.y = {
            value: opts.position.y,
            default: opts.position.y,
            min: 1,
            max: 3,

            onChange: (value) => {
                light().position.y = value;
            },

            description: "Y-coordinate of the light"
        };

        attributes.value.z = {
            value: opts.position.z,
            default: opts.position.z,
            min: -2,
            max: 2,

            onChange: (value) => {
                light().position.z = value;
            },

            description: "Z-coordinate of the light"
        };
    }

    if(opts.type === 'point') {
        attributes.value.distance = {
            value: opts.distance,
            default: opts.distance,
            min: 0.05,
            max: 3,

            onChange: (value) => {
                light().distance = value;
            },

            description: "How far away the light reaches" 
        };

        attributes.value.decay = {
            value: opts.decay,
            default: opts.decay,
            min: 1,
            max: 4,

            onChange: (value) => {
                light().decay = value;
            },

            description: "How much the light decreases in intensity across distance"
        };
    }

    return attributes;
};

class ThreeDController extends AttributeController {
    constructor() {
        super(() => { return {
            metalness: {
                value: 0.5,
                default: 0.5,
                min: 0.0,
                max: 1.0,

                onChange: (value) => {
                    this.material.metalness = value;
                },

                description: "How metallic the surface looks"
            },
            roughness: {
                value: 0.5,
                default: 0.5,
                min: 0.0,
                max: 1.0,

                onChange: (value) => {
                    this.material.roughness = value;
                },

                description: "How rough the surface is. A low value means clearer reflections"  
            },
            bumpScale: {
                value: 0.1,
                default: 0.1,
                min: 0.0,
                max: 1.0,
                step: 0.001,

                onChange: (value) => {
                    this.material.normalScale = new THREE.Vector2(value, value)
                },

                description: "The amount of small details"
            },
            displacement: {
                value: {
                    amount: {
                        value: 0.3,
                        default: 0.3,
                        min: 0.0,
                        max: 1.0,

                        onChange: (value) => {
                            this.material.displacementScale = value;
                            this.material.displacementBias = -value / 2;
                        },

                        description: "The height of the surface peaks"
                    },
                    smoothness: {
                        value: 0.2,
                        default: 0.2,
                        min: 0.0,
                        max: 1.0,

                        onChange: (value) => {
                            this.blurPass.scale = value;
                        },

                        description: "The smoothness of the surface peaks"
                    }
                }
            },
            fog: {
                value: {
                    color: {
                        value: '#000000',
                        default: '#000000',
                        type: 'color',
                        
                        onChange: (value) => {
                            this.scene.fog.color.set(value);
                            this.scene.background.set(value);
                        },

                        description: "The color of the background and fog"
                    },
                    near: {
                        value: 0.43,
                        default: 0.43,
                        min: 0.001,
                        max: 1.0,

                        onChange: (value) => {
                            this.scene.fog.near = value;
                        },

                        description: "At what distance the fog starts to take affect"
                    },
                    far: {
                        value: 1.8,
                        default: 1.8,
                        min: 0.1,
                        max: 4.0,

                        onChange: (value) => {
                            this.scene.fog.far = value;
                        },

                        description: "At what distance the fog takes full effect"
                    }
                }
            },
            lighting: {
                value: {
                    ambientLight: createLightAttributes(
                        () => this.ambientLight, 
                        "Ambient light", 
                        {
                            type: "ambient",
                            color: '#ffffff',
                            intensity: 0.3,
                        }
                    ),
                    directionalLight: createLightAttributes(
                        () => this.directionalLight, 
                        "Directional light", 
                        {
                            type: "directional",
                            color: '#ffffff',
                            intensity: 2.1,
                            position: new THREE.Vector3(0, 2, -2)
                        }
                    ),
                    pointLight: createLightAttributes(
                        () => this.pointLight, 
                        "Point light", 
                        {
                            type: "point",
                            color: '#ffffff',
                            intensity: 1.9,
                            decay: 2,
                            distance: 5,
                            position: new THREE.Vector3(0, 1, -0.25)
                        }
                    )
                },

                description: "Settings for the lights"
            }
        }});

        this.near = 0.01;
        this.far = 50;

        this.initialized = false;
    }

    initialize(textureCanvas, canvas) {
        this.canvas = canvas;

        // CREATE RENDERER
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: false,
            powerPreference: 'high-performance'
        });
        //this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.physicallyCorrectLights = true;

        // CREATE CAMERA
        this.camera = new THREE.PerspectiveCamera(
            75,                           // fov
            canvas.width / canvas.height, // aspect
            this.near,                    // near
            this.far                      // far
        );
        this.camera.position.set(0, 0.5, 0.75);

        // CREATE CONTROLS
        this.controls = new TrackballControls(this.camera, canvas);
        this.controls.rotationSpeed = 3;
        this.controls.dynamicDampingFactor = 0.15;

        // CREATE SCENE
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.getValue("fog.color"));
        this.scene.fog = new THREE.Fog(this.getValue("fog.color"),
            this.getValue("fog.near"),
            this.getValue("fog.far")
        );

        // POPULATE SCENE

        // Texture
        const texture = new THREE.CanvasTexture(textureCanvas);
        texture.needsUpdate = true;
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearFilter;
        this.texture = texture;

        // Calculate normal map
        this.normalMaterial = new THREE.ShaderMaterial(NormalMapShader);
        this.normalMaterial.uniforms.width.value = canvas.clientWidth;
        this.normalMaterial.uniforms.height.value = canvas.clientHeight;

        const normalPass = new POSTPROCESSING.ShaderPass(
            this.normalMaterial,
            'tDiffuse'
        );

        this.normalMapProducer = new TextureProcessor(this.renderer, texture, canvas.clientWidth, canvas.clientHeight, [
            normalPass,
        ]);

        // Calculate heightmap
        const blurPass = new POSTPROCESSING.BlurPass({
            kernelSize: POSTPROCESSING.KernelSize.MEDIUM
        });
        this.blurPass = blurPass;

        this.heightMapProducer = new TextureProcessor(this.renderer, texture, canvas.clientWidth, canvas.clientHeight, [
            blurPass
        ]);

        const normalMap = this.normalMapProducer.getProcessedTexture();
        const heightMap = this.heightMapProducer.getProcessedTexture();

        // Plane
        const detail = 500;
        const geometry = new THREE.PlaneBufferGeometry(1, 1, detail, detail);
        const material = new THREE.MeshStandardMaterial({
            color: '#ffffff',
            map: texture,

            metalness: this.getValue("metalness"),
            roughness: this.getValue("roughness"),

            normalMap: normalMap,
            normalScale: new THREE.Vector2(
                this.getValue("bumpScale"),
                this.getValue("bumpScale")
            ),

            displacementMap: heightMap,
            displacementScale: this.getValue("displacement.amount"),
            displacementBias: -this.getValue("displacement.amount") / 2
        });

        const plane = new THREE.Mesh(geometry, material);
        plane.rotation.x = -Math.PI / 2;

        this.material = material;

        // Light
        this.ambientLight = new THREE.AmbientLight(
            this.getValue("lighting.ambientLight.color"), 
            this.getValue("lighting.ambientLight.intensity")
        );

        this.directionalLight = new THREE.DirectionalLight(
            this.getValue("lighting.directionalLight.color"),
            this.getValue("lighting.directionalLight.intensity")
        );
        this.directionalLight.position.set(
            this.getValue("lighting.directionalLight.x"),
            this.getValue("lighting.directionalLight.y"),
            this.getValue("lighting.directionalLight.z")
        );

        this.pointLight = new THREE.PointLight(
            this.getValue("lighting.pointLight.color"),
            this.getValue("lighting.pointLight.intensity"),
            this.getValue("lighting.pointLight.distance"),
            this.getValue("lighting.pointLight.decay"),
        );
        this.pointLight.position.set(
            this.getValue("lighting.pointLight.x"),
            this.getValue("lighting.pointLight.y"),
            this.getValue("lighting.pointLight.z")
        );

        this.scene.add(
            plane,
            this.ambientLight,
            this.directionalLight,
            this.pointLight
        );

        // Post processing
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new SSAARenderPass(this.scene, this.camera));
        this.composer.setPixelRatio(window.devicePixelRatio);

        this.initialized = true;

        this.handleResize();
        return true;
    }

    isInitialized() {
        return this.initialized;
    }

    update(delta) {
        this.controls.update();
        this.texture.needsUpdate = true;
    }

    render(delta) {
        this.normalMapProducer.render(delta);
        this.heightMapProducer.render(delta);

        this.composer.render(delta);

        // Capture the frame if requested
        if(this.captureNext) {
            this.captureNext = false;
            const captureData = this.canvas.toDataURL("image/png");
            this.dataCallback(captureData);
        }
    }

    // Used to capture the next frame of animation
    // The data callback function will be used to return the result
    captureFrame(dataCallback) {
        this.captureNext = true;
        this.dataCallback = dataCallback;
    }

    handleResize() {
        if(!this.initialized) return;

        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        const currentSize = this.renderer.getSize(new THREE.Vector2());

        const newSize = new THREE.Vector2(width, height);

        if(currentSize.equals(newSize)) return;

        this.renderer.setSize( newSize.x, newSize.y, false );
        this.composer.setSize( newSize.x, newSize.y );

        this.normalMaterial.uniforms.width.value = newSize.x;
        this.normalMaterial.uniforms.height.value = newSize.y;

        this.camera.aspect = newSize.x / newSize.y;
        this.camera.updateProjectionMatrix();

        this.normalMapProducer.setSize( newSize.x, newSize.y );
        this.heightMapProducer.setSize( newSize.x, newSize.y );
    }
}

export { ThreeDController };