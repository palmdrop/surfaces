import * as THREE from 'three'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'

import { AttributeController } from '../ControllerAttributes'

class ThreeDController extends AttributeController {
    constructor() {
        //TODO add descriptions
        super(() => {
            return {
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
                    value: 0.1,
                    default: 0.1,
                    min: 0.0,
                    max: 1.0,

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
                directionalLight: {
                    value: {
                        x: {
                            value: 0,
                            default: 0,
                            min: -2,
                            max: 2,

                            onChange: (value) => {
                                this.directionalLight.position.x = value;
                            }
                        },
                        y: {
                            value: 2,
                            default: 2,
                            min: 1,
                            max: 3,

                            onChange: (value) => {
                                this.directionalLight.position.y = value;
                            }
                        },
                        z: {
                            value: -2,
                            default: -2,
                            min: -2,
                            max: 2,

                            onChange: (value) => {
                                this.directionalLight.position.z = value;
                            }
                        },
                        intensity: {
                            value: 7,
                            default: 7,
                            min: 0,
                            max: 15,

                            onChange: (value) => {
                                this.directionalLight.intensity = value;
                            }
                        },
                        color: {
                            value: '#ffffff',
                            default: '#ffffff',
                            type: 'color',
                            
                            onChange: (value) => {
                                this.directionalLight.color.set(value);
                            }
                        }

                    },
                }
        }});

        this.initialized = false;

        this.far = 2;
        this.near = 0.01;
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
        this.scene.background = new THREE.Color('#000000');
        this.scene.fog = new THREE.Fog('#ffffff', 
            this.near,
            this.far
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
            bumpScale: 0.01,

            metalness: 0.5,
            roughness: 0.0,

            displacementMap: texture,
            displacementScale: 0.1,
            displacementBias: -0.05,
        });

        const plane = new THREE.Mesh(geometry, material);
        plane.rotation.x = -Math.PI / 2;

        this.material = material;

        // Light
        this.directionalLight = new THREE.DirectionalLight('#ffffff', 7);
        this.directionalLight.position.set(0, 2, -2);

        const ambientLight = new THREE.AmbientLight('#ffffff', 0.3);

        this.scene.add(
            plane,
            this.directionalLight,
            ambientLight
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