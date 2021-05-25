/////////////
// TEXTURE //
/////////////

const randomElement = (array) => {
    return array[Math.floor(Math.random() * array.length)];
}

// Helper function for creating noise settings
const noiseSettings = (description) => {
    return {
        value: {
            frequency: {
                value: Math.random() * 1 + 0.2,
                default: 1.0,
                min: 0.0000001,
                max: 1.0000,
                type: "1f",

                description: "Speed of change across space"
            },
            octaves: {
                value: randomElement([1, 3, 5]),
                default: 3,
                type: "1i",
                min: 1,
                max: 5,
                step: 2,
                marks: [1, 3, 5],

                description: "Number of noise layers"
            },
            lacunarity: {
                value: Math.random() * 4 + 1.0,
                default: 2.0,
                type: "1f",
                min: 0.1,
                max: 10.0,

                description: "Frequency multiplier for each layer"
            },
            persistence: {
                value: Math.random() * 0.3,
                default: 0.5,
                type: "1f",
                min: 0.1,
                max: 5.0,

                description: "Amplitude multiplier for each layer"
            },
            amplitude: {
                value: 1.0,
                default: 1.0,
                type: "1f",
                min: 0.1,
                max: 10.0,

                description: "The strength (height) of the noise"
            },
            modifications: {
                value: {
                    ridgeThreshold: {
                        value: Math.random(),
                        default: 1.0,
                        type: "1f",
                        min: 0.5,
                        max: 1.0,

                        description: "Low values sharpens the peaks of the noise"
                    },
                    pow: {
                        value: Math.random() + 1.0,
                        default: 1.0,
                        type: "1f",
                        min: -1.0,
                        max: 5,

                        description: "Applies a power operator to the noise"
                    },
                    mod: {
                        value: 1.0,
                        default: 1.0,
                        type: "1f",
                        min: 1.0,
                        max: 5,

                        description: "Applies a modulus operator to the noise"
                    },
                    xStretch: {
                        value: 1.0,
                        default: 1.0,
                        type: "1f",
                        min: 0.001,
                        max: 10,

                        description: "Stretches the noise in the X direction"
                    },
                    yStretch: {
                        value: 1.0,
                        default: 1.0,
                        type: "1f",
                        min: 0.001,
                        max: 10,

                        description: "Stretches the noise in the Y direction"
                    },
                },
                description: "Various modifications that can be applied to the noise"
            }
        },
        isUniform: true,
        description: description,
    }
};

// Helper function for creating time settings
const timeSettings = (value, def = null) => {
    return {
        value: value,
        default: def || value,
        min: 0.0,
        max: 1,

        description: "Alters the animation speed"
    }
};

// Default attributes for texture controller
const getTextureAttributes = () => {
    return {
        scale: {
            value: 1.0,
            default: 1.0,
            isUniform: true,
            type: "1f",

            min: 0.001,
            max: 3,

            description: "Zooms the entire texture (can also be controlled using the mouse wheel)"
        },
        iterations: {
            value: randomElement([1, 2, 3, 4]),
            default: 2,
            isUniform: true,
            type: "1i",

            min: 0,
            max: 4,

            description: "Number of domain warping steps/iterations"
        },
        warpAmount: {
            value: Math.random() * 2 + 0.5,
            default: 1.0,
            isUniform: true,
            type: "1f",

            min: 0.0,
            max: 5,

            description: "Strength/amount of the domain warping effect"
        },
        animationSpeed: {
            value: {
                general: timeSettings(0.1),
                source: timeSettings(1.0),
                angleControl: timeSettings(1.0),
                amountControl: timeSettings(1.0)
            },
            description: "Controllers for animation speed of the entire animation and the three layers separately",
            isUniform: false,
        },

        source: noiseSettings("Noise controller for the source pattern: the domain warp effect is applied to this noise"),
        angleControl: noiseSettings("Noise controller for angle pattern: this controls the angle/rotation of the domain warp at a given point"),
        amountControl: noiseSettings("Noise controller for amount pattern: this controls the intensity of the domain warp at a given point")
    };
}

///////////
// COLOR //
///////////

const componentController = (source, angle, amount, description, defaults=[1.0, 1.0, 1.0]) => {
    return {
        value: {
            mult: {
                value: 0,
                default: 0,
                type: "1i",
                min: 0,
                max: 1,

                description: "If activated, the three components will be multiplied together instead of summed"
            },
            source: {
                value: source,
                default: defaults[0],
                type: "1f",
                min: -1,
                max: 1,

                description: "The influence of the source pattern"
            },
            angle: {
                value: angle,
                default: defaults[1],
                type: "1f",
                min: -1,
                max: 1,
                description: "The influence of the angle pattern"
            },
            amount: {
                value: amount,
                default: defaults[2],
                type: "1f",
                min: -1,
                max: 1,
                description: "The influence of the amount pattern"
            }
        },
        description: description,
        isUniform: true
    };
};

const getColorAttributes = () => {
    return {
        power: {
            value: 1.0,
            default: 1.0,
            isUniform: true,
            type: "1f",

            min: 0.001,
            max: 10,

            description: "Applies the power operator to the brightness of the color"
        },
        general: {
            value: {
                hue: {
                    value: 0.0,
                    default: 0.0,
                    type: "1f",

                    min: -0.5,
                    max: 0.5,

                    description: "Hue shift of the output color"
                },
                saturation: {
                    value: 0.7,
                    default: 0.7,
                    isUniform: true,
                    type: "1f",

                    min: 0.001,
                    max: 10,

                    description: "Saturation of the output color"
                },
                brightness: {
                    value: 1.0,
                    default: 1.0,
                    isUniform: true,
                    type: "1f",

                    min: 0.001,
                    max: 4,

                    description: "Brightness of the output color"
                },
                red: {
                    value: 1.0,
                    default: 1.0,
                    isUniform: true,
                    type: "1f",

                    min: 0.001,
                    max: 4,
                    description: "Multiplier applied to the red channel of the output color"
                },
                green: {
                    value: 1.0,
                    default: 1.0,
                    isUniform: true,
                    type: "1f",

                    min: 0.001,
                    max: 4,
                    description: "Multiplier applied to the green channel of the output color"
                },
                blue: {
                    value: 1.0,
                    default: 1.0,
                    isUniform: true,
                    type: "1f",

                    min: 0.001,
                    max: 4,
                    description: "Multiplier applied to the blue channel of the output color"
                }
            },
            description: "General color settings",
            isUniform: true
        },
        hueController:        componentController(2.0 * Math.random() - 1.0, 2.0 * Math.random() - 1.0, 2.0 * Math.random() - 1.0,
                                                  "Controls how the three layers influence the hue of the output color",
                                                 [1.0, 1.0, 0.0]),
        saturationController: componentController(1.0 * Math.random(), 1.0 * Math.random(), 1.0 * Math.random(),
                                                  "Controls how the three layers influence the saturation of the output color",
                                                 [0.0, 1.0, -0.5]),
        brightnessController: componentController(1.0, 0.0, 0.0,
                                                  "Controls how the three layers influence the brightness of the output color",
                                                 [1.0, 0.0, 0.0]),
    }
};


////////////
// RENDER //
////////////
const getRenderAttributes = () => {
    return {
        resolution: {
            value: 1.0,
            default: 1.0,
            isUniform: false,
            type: "1f",

            min: 0.1,
            max: 3,

            description: "Multiplier for the width and height of the canvas"
        },
        ditheringAmount: {
            value: 1.0 / 255.0,
            default: 1.0 / 255.0,
            isUniform: false,

            min: 0.0,
            max: 0.2,
            description: "Applies dithering (blue noise) to the final color"
        },
        multisampling: {
            value: 0,
            default: 0,
            isUniform: false,
            type: "1i",

            min: 0,
            max: 1,

            description: "Activates multisampling: will use four samples per pixel instead of one, to reduce anti-aliasing"
        },
    }
}


//////////
// UTIL //
//////////

// Randomizer of attributes
const getRandomAttributes = (attributes) => {
    const random = (min, max) => {
        return Math.random() * (Math.abs(max - min) + min);
    };

    const randomize = (current) => {
        if(typeof current.value === "object") {
            for(var name in current.value) {
                if(Object.prototype.hasOwnProperty.call(current.value, name)) {
                    current.value[name] = randomize(current.value[name]);
                }
            }
        } else {
            var result;
            if(current.marks) {
                result = current.marks[Math.floor(random(0, current.marks.length))];
            } else if(current.type === "1i") {
                result = Math.floor(random(current.min, current.max));
            } else {
                result = random(current.min, current.max);
            }

            current.value = result;
        }

        return current;
    }

    for(var name in attributes) {
        if(Object.prototype.hasOwnProperty.call(attributes, name)) {
            attributes[name] = randomize(attributes[name]);
        }
    }

    return attributes;
}

// HELPER FUNCTIONS FOR MANAGING ATTRIBUTES

// Used to fetch the attribute data of a specific location
const getAttribute = (attributes, location) => {
    // Helper function for checking if an object contains a specific property
    const hasProperty = (object, property) => {
        return Object.prototype.hasOwnProperty.call(object, property);
    }

    var subLocations = location.split(".");

    // Check if attribute exists in main attributes object
    if(!hasProperty(attributes, subLocations[0])) return undefined;

    // Get the current attribute
    var currentAttribute = attributes[subLocations[0]];

    // If there's more sub-locations in the query, iterate through them
    // until the bottom level is found
    for(var i = 1; i < subLocations.length; i++) {
        // Verify that the new attribute is an object (if not, the query is invalid)
        if(!(typeof currentAttribute === "object")) return undefined;

        // Check if the attribute contains the requested attribute 
        if(!hasProperty(currentAttribute.value, subLocations[i])) return undefined;

        // Get the value property of the attribute, since this will contain the next iteration
        currentAttribute = currentAttribute.value[subLocations[i]];
    }

    // Returns an array where the first element specifies if the attribute has a corresponding
    // shader uniform, and the second element is the data itself
    return [attributes[subLocations[0]].isUniform, currentAttribute];
}

// Sets uniforms for all attributes that have one
const setUniforms = (attributes, program, GLC) => {
    // Helper function for setting a specific uniform, if it exists
    // Recursively sets all sub-attributes
    const setUniform = (attribute, name) => {
        // Return if the value has no corresponding uniform, or if the texture controller is not initialized
        // Also, if the root level object is a uniform, assume all children are too
        if(!attribute.isUniform) return;

        // Recursively sets all sub-attributes' corresponding uniforms 
        const setAll = (current, location) => {
            // If the value property of the attribute is an object, then
            // more sub-attributes exist
            if(typeof current.value === "object") {
                // Iterate over all sub-attributes
                for(var name in current.value) {
                    if(Object.prototype.hasOwnProperty.call(current.value, name)) {
                        // And set all their corresponding uniforms
                        // The "." symbol is used to construct the uniform location
                        setAll(current.value[name], location + "." + name);
                    }
                }
            // If the value property is not an object, a leaf has been reached and we can set
            // the attribute uniform directly
            } else {
                GLC.setUniform(program, location, current.type, current.value);
            }
        };

        setAll(attribute, name);
    }

    // Iterate over all attributes and set their coorresponding uniforms
    for (var name in attributes) {
        if(Object.prototype.hasOwnProperty.call(attributes, name)) {
            setUniform(attributes[name], name);
        }
    }
}

// Do an operation for each attribute
const forEach = (attributes, operation, stopCondition) => {
    const performOperation = (current) => {
        if(stopCondition && stopCondition(current)) return;

        if(typeof current.value === "object") {
            for(var name in current.value) {
                if(Object.prototype.hasOwnProperty.call(current.value, name)) {
                    performOperation(current.value[name]);
                }
            }
        } else {
            operation(current);
        }
    }

    for (var name in attributes) {
        if(Object.prototype.hasOwnProperty.call(attributes, name)) {
            performOperation(attributes[name], name);
        }
    }

    return attributes;
};

const resetAttributesToDefault = (attributes) => {
    return forEach(attributes, (current) => current.value = current.default);
}

// Returns the value of a specified attribute
const getAttributeValue = (attributes, location) => {
    const [, v] = getAttribute(attributes, location);
    if(typeof v === "undefined") return undefined;
    return v.value;
}

// Returns the default of a specified attribute
const getAttributeDefault = (attributes, location) => {
    const [, v] = getAttribute(attributes, location);
    if(typeof v === "undefined") return undefined;
    return v.default;
}

// Updates an attribute value and the corresponding uniform (if one exists)
const updateAttributeValue = (attributes, program, location, value, GLC) => {
    // Find the requested attribute, or return if it does not exist
    const [isUniform, attribute] = getAttribute(attributes, location);
    if(typeof attribute === "undefined") return false;

    // Do nothing if the value is unchanged
    if(attribute.value === value) return true;

    // Set the new value, and set the corresponding uniform
    attribute.value = value;

    if(isUniform && program && GLC) {
        GLC.setUniform(program, location, attribute.type, attribute.value);
    } 

    return true;
}

// Merges two attribute objects
// "current" will define the structure, "changes" will overwrite values in the base
const mergeAttributes = (current, changes) => {
    // Check if the current object is a single value or an array. In that case, update, if 
    // an updated value exists
    if(typeof current !== "object" || Array.isArray(current)) return changes || current;

    // If the changes are null or undefined, use the current object
    if(!changes) return current;

    var updated = {};

    // Iterate over all the properties in the current object, and merge each
    // property with the corresponding property in the changes object
    for(var prop in current) {
        if(Object.prototype.hasOwnProperty.call(current, prop)) {
            updated[prop] = mergeAttributes(current[prop], changes[prop]);
        }
    }

    return updated;
}

// Helper class for defining a attribute controller
// Also has support for handling, although "program" can remain null
class AttributeController {
    constructor(attributeGetter) {
        this._attributeGetter = attributeGetter;
        this.attributes = this._attributeGetter();
        this.program = null;
        this.GLC = null;
    }

    // Updates a value and it's corresponding uniform (if such exists)
    updateValue(location, value) {
        return updateAttributeValue(this.attributes, this.program, location, value, this.GLC)
    }

    // Returns the value at a specified location
    getValue(location) {
        return getAttributeValue(this.attributes, location);
    }

    // Returns the default (initial) value
    getDefault(location) {
        return getAttributeDefault(this.attributes, location);
    }

    // Returns all attributes
    getAttributes() {
        return this.attributes;
    }

    _setUniforms() {
        if(this.GLC && this.program) {
            setUniforms(this.attributes, this.program, this.GLC);
        }
    }

    // Sets all attributes, and updates uniforms (if such exist)
    setAttributes(attributes) {
        this.attributes = attributes;
        this._setUniforms();
    }

    // Resets all values to their defaults
    reset() {
        this.attributes = resetAttributesToDefault(this.attributes);
        this._setUniforms();
    }

    // Randomizes the values (by fetching new attributes)
    randomize() {
        this.attributes = this._attributeGetter();
        this._setUniforms();
    }
}

export { 
    getTextureAttributes, 
    getColorAttributes, 
    getRenderAttributes,
    getAttribute, 
    getAttributeValue, 
    getAttributeDefault,
    resetAttributesToDefault,
    setUniforms, 
    updateAttributeValue, 
    mergeAttributes, 
    getRandomAttributes,

    AttributeController
}