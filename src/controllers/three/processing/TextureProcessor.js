import * as THREE from 'three';
import * as POSTPROCESSING from 'postprocessing';

// Class for rendering a texture using a custom shader
// Useful for applying effects or filters to a texture
export class TextureProcessor {
    constructor(renderer, texture, width, height, passes) {
        this.renderer = renderer;

        // Create Camera
        this.camera = new THREE.OrthographicCamera(
           -width / 2,
            width / 2,
            height / 2,
           -height / 2,
           -1000,
            1000,
        );
        this.camera.position.z = 100;

        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#ff0000');

        // Create render target
        this.composer = new POSTPROCESSING.EffectComposer(this.renderer, {
            frameBufferType: THREE.HalfFloatType
        });
        this.composer.autoRenderToScreen = false;
        //this.composer.autoRenderToScreen = true;
        const renderPass = new POSTPROCESSING.RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        passes.forEach(pass => {
            this.composer.addPass(pass);
        });

        // Create material
        const material = new THREE.MeshBasicMaterial({
            map: texture
        });

        // Create plane
        const plane = new THREE.PlaneBufferGeometry(1, 1);

        // Create plane mesh
        this.quad = new THREE.Mesh(plane, material);
        this.quad.position.z = -100;
        this.quad.scale.x = width;
        this.quad.scale.y = height;

        const light = new THREE.AmbientLight("#ffffff", 5);

        this.scene.add(this.quad, light);
    }

    setSize(width, height) {
        // Update camera
        this.camera.left   = -width / 2;
        this.camera.right  =  width / 2;
        this.camera.top    =  height / 2;
        this.camera.bottom = -height / 2;
        this.camera.updateProjectionMatrix();

        // Update size
        this.composer.setSize();

        // Update quad
        this.quad.scale.x = width;
        this.quad.scale.y = height;
    }

    render(delta) {
        this.composer.render(delta);
    }

    getProcessedTexture() {
        return this.composer.outputBuffer.texture;
    }

}