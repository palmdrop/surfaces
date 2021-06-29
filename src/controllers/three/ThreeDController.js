import * as THREE from 'three'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'

import { AttributeController } from '../ControllerAttributes'

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
            }
        },
        color: {
            value: opts.color,
            default: opts.color,
            type: 'color',
            
            onChange: (value) => {
                light().color.set(value);
            }
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
            }
        };

        attributes.value.y = {
            value: opts.position.y,
            default: opts.position.y,
            min: 1,
            max: 3,

            onChange: (value) => {
                light().position.y = value;
            }
        };

        attributes.value.z = {
            value: opts.position.z,
            default: opts.position.z,
            min: -2,
            max: 2,

            onChange: (value) => {
                light().position.z = value;
            }
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
            }
        };

        attributes.value.decay = {
            value: opts.decay,
            default: opts.decay,
            min: 1,
            max: 4,

            onChange: (value) => {
                light().decay = value;
            }
        };
    }

    return attributes;
};

class ThreeDController extends AttributeController {
    constructor() {
        //TODO add descriptions
        super(() => { return {
            metalness: {
                value: 0.5,
                default: 0.5,
                min: 0.0,
                max: 1.0,

                onChange: (value) => {
                    this.material.metalness = value;
                }
            },
            roughness: {
                value: 0.5,
                default: 0.5,
                min: 0.0,
                max: 1.0,

                onChange: (value) => {
                    this.material.roughness = value;
                }
            },
            bumpScale: {
                value: 0.01,
                default: 0.01,
                min: 0.0,
                max: 1.0,
                step: 0.001,

                onChange: (value) => {
                    this.material.bumpScale = value;
                }
            },
            height: {
                value: 0.1,
                default: 0.1,
                min: 0.0,
                max: 1.0,

                onChange: (value) => {
                    this.material.displacementScale = value;
                    this.material.displacementBias = -value / 2;
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
                        }
                    },
                    near: {
                        value: 0.43,
                        default: 0.43,
                        min: 0.001,
                        max: 1.0,

                        onChange: (value) => {
                            this.scene.fog.near = value;
                        }
                    },
                    far: {
                        value: 1.8,
                        default: 1.8,
                        min: 0.1,
                        max: 4.0,

                        onChange: (value) => {
                            this.scene.fog.far = value;
                        }
                    }
                }
            },
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
                    intensity: 2,
                    position: new THREE.Vector3(0, 2, -2)
                }
            ),
            pointLight: createLightAttributes(
                () => this.pointLight, 
                "Point light", 
                {
                    type: "point",
                    color: '#ffffff',
                    intensity: 3,
                    decay: 2,
                    distance: 5,
                    position: new THREE.Vector3(0, 1, -0.25)
                }
            ),
        }});

        this.initialized = false;
    }

    initialize(textureCanvas, canvas) {
        this.canvas = canvas;

        // CREATE RENDERER
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
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
        this.texture = texture;

        //TODO create filtered versions of the texture,
        // TODO make height increase falloff, blur bumpMap slightly

        // Plane
        const detail = 500;
        const geometry = new THREE.PlaneBufferGeometry(1, 1, detail, detail);
        const material = new THREE.MeshStandardMaterial({
            color: '#ffffff',
            map: texture,
            bumpMap: texture,
            bumpScale: this.getValue("bumpScale"),

            metalness: this.getValue("metalness"),
            roughness: this.getValue("roughness"),

            displacementMap: texture,
            displacementScale: this.getValue("height"),
            displacementBias: -this.getValue("height") / 2
        });

        const plane = new THREE.Mesh(geometry, material);
        plane.rotation.x = -Math.PI / 2;

        this.material = material;

        // Light
        this.ambientLight = new THREE.AmbientLight(
            this.getValue("ambientLight.color"), 
            this.getValue("ambientLight.intensity")
        );

        this.directionalLight = new THREE.DirectionalLight(
            this.getValue("directionalLight.color"),
            this.getValue("directionalLight.intensity")
        );
        this.directionalLight.position.set(
            this.getValue("directionalLight.x"),
            this.getValue("directionalLight.y"),
            this.getValue("directionalLight.z")
        );

        this.pointLight = new THREE.PointLight(
            this.getValue("pointLight.color"),
            this.getValue("pointLight.intensity"),
            this.getValue("pointLight.distance"),
            this.getValue("pointLight.decay"),
        );
        this.pointLight.position.set(
            this.getValue("pointLight.x"),
            this.getValue("pointLight.y"),
            this.getValue("pointLight.z")
        );

        this.scene.add(
            plane,
            this.ambientLight,
            this.directionalLight,
            this.pointLight
        );

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
        this.renderer.render(this.scene, this.camera);

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

        this.camera.aspect = newSize.x / newSize.y;
        this.camera.updateProjectionMatrix();
    }
}

export { ThreeDController };