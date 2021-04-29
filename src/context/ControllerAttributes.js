import GLC from './GLC'

// Helper function for creating noise settings
const noiseSettings = () => {
    return {
        value: {
            frequency: {
                value: Math.random() * 4 + 0.1,
                min: 0.0000001,
                max: 1.0000,
                type: "1f",
            },
            octaves: {
                value: 3,
                type: "1i",
                min: 1,
                max: 5,
                step: 2,
                marks: [1, 3, 5]
            },
            lacunarity: {
                value: 2.0,
                type: "1f",
                min: 0.1,
                max: 10.0,
            },
            persistence: {
                value: 0.5,
                type: "1f",
                min: 0.1,
                max: 5.0,
            },
            amplitude: {
                value: 1.0,
                type: "1f",
                min: 0.1,
                max: 10.0,
            },
            modifications: {
                value: {
                    ridgeThreshold: {
                        value: 1.0,
                        type: "1f",
                        min: 0.5,
                        max: 1.0,
                    },
                    pow: {
                        value: 1.0,
                        type: "1f",
                        min: -1.0,
                        max: 5
                    },
                    xStretch: {
                        value: 1.0,
                        type: "1f",
                        min: 0.001,
                        max: 10
                    },
                    yStretch: {
                        value: 1.0,
                        type: "1f",
                        min: 0.001,
                        max: 10
                    },
                },
            }
        },
        isUniform: true,
    }
};

// Helper function for creating time settings
const timeSettings = (value) => {
    return {
        value: value,
        min: 0.0,
        max: 1,
    }
};

// Default attributes for texture controller
const getTextureAttributes = () => {
    return {
        scale: {
            value: 1.0,
            isUniform: true,
            type: "1f",

            min: 0.001,
            max: 3
        },
        iterations: {
            value: 2,
            isUniform: true,
            type: "1i",

            min: 0,
            max: 4,
        },
        warpAmount: {
            value: 1,
            isUniform: true,
            type: "1f",

            min: 0.0,
            max: 5
        },
        resolution: {
            value: 1.0,
            isUniform: false,
            type: "1f",

            min: 0.1,
            max: 3
        },
        multisampling: {
            value: 0,
            isUniform: false,
            type: "1i",

            min: 0,
            max: 1
        },
        animationSpeed: {
            value: {
                general: timeSettings(0.1),
                source: timeSettings(1.0),
                angleControl: timeSettings(1.0),
                amountControl: timeSettings(1.0)
            },
            isUniform: false,
        },

        source: noiseSettings(),
        angleControl: noiseSettings(),
        amountControl: noiseSettings()
    };
}

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
            } else if(current.type == "1i") {
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
const setUniforms = (attributes, program) => {
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

// Returns the value of a specified attribute
const getAttributeValue = (attributes, location) => {
    const [, v] = getAttribute(attributes, location);
    if(typeof v === "undefined") return undefined;
    return v.value;
}

// Updates an attribute value and the corresponding uniform (if one exists)
const updateAttributeValue = (attributes, program, location, value) => {
    // Find the requested attribute, or return if it does not exist
    const [isUniform, attribute] = getAttribute(attributes, location);
    if(typeof attribute === "undefined") return false;

    // Do nothing if the value is unchanged
    if(attribute.value === value) return true;

    // Set the new value, and set the corresponding uniform
    attribute.value = value;

    if(isUniform) {
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

export { getTextureAttributes, getAttribute, getAttributeValue, setUniforms, updateAttributeValue, mergeAttributes, getRandomAttributes }