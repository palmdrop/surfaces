const attributes = {
    animationSpeed: {
        value: {
            general: {
                value: 0.2,
                min: 0.0,
                max: 3,
            },
            source: {
                value: 1.0,
                min: 0.0,
                max: 5,
            },
            angleControl: {
                value: 1.0,
                min: 0.0,
                max: 5,
            },
            amountControl: {
                value: 1.0,
                min: 0.0,
                max: 5,
            },
        },
        isUniform: false,
    },
    scale: {
        value: 1.0,
        isUniform: true,
        type: "1f",

        min: 0.01,
        max: 10
    },
    iterations: {
        value: 2,
        isUniform: true,
        type: "1i",

        min: 0,
        max: 4,
    },
    warpAmount: {
        value: 100,
        isUniform: true,
        type: "1f",

        min: 0.0,
        max: 1000
    },
    multisampling: {
        value: 0,
        isUniform: true,
        type: "1i",

        min: 0,
        max: 1
    },
    source: {
        value: {
            frequency: {
                value: 0.01,
                type: "1f",
                min: 0.0000001,
                max: 0.035
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
                max: 5.0,
            },
            persistence: {
                value: 0.5,
                type: "1f",
                min: 0.1,
                max: 2.0,
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
                        min: 0.0,
                        max: 5
                    }
                },
            }
        },
        isUniform: true,
    },
    angleControl: {
        value: {
            frequency: {
                value: Math.random() * 0.01,
                min: 0.0000001,
                max: 0.035,
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
                max: 5.0,
            },
            persistence: {
                value: 0.5,
                type: "1f",
                min: 0.1,
                max: 2.0,
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
                        min: 0.0,
                        max: 5
                    }
                },
            }
        },
        isUniform: true,
    },
    amountControl: {
        value: {
            frequency: {
                value: Math.random() * 0.01,
                min: 0.0000001,
                max: 0.035,
                type: "1f"
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
                max: 5.0,
            },
            persistence: {
                value: 0.5,
                type: "1f",
                min: 0.1,
                max: 2.0,
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
                        min: 0.0,
                        max: 5
                    },
                },
            }
        },
        isUniform: true,
    },
};

export { attributes }