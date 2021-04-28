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

const timeSettings = (value) => {
    return {
        value: value,
        min: 0.0,
        max: 1,
    }
};


const getDefaultAttributes = () => {
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

const getRandomAttributes = () => {
    var attributes = getDefaultAttributes();

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

export { getDefaultAttributes, getRandomAttributes }