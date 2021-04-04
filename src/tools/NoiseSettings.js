import GLC from '../context/GLC'

const noiseTypes = {
    PERLIN: 0,
    SIMPLEX: 1,
}

const createModifications = (ridgeThreshold) => {
    return {
        ridgeThreshold: ridgeThreshold
    };
}

const createNoiseSettings = (type, dimensions, frequency, offset, pow, modifications = null) => {
    if(!Object.keys(noiseTypes).some(k => noiseTypes[k] === type)) {
        throw new Error("No such noise type");
    }
    if(dimensions !== 2 && dimensions !== 3) {
        throw new Error("Dimensions has to be 2 or 3");
    }
    if(typeof frequency !== 'number') {
        throw new Error("Frequency has to be a number");
    } 
    if(!Array.isArray(offset)                                           // If not an array
    ||   offset.length  !== dimensions                                  // If not the same number of dimensions as "dimensions"
    || !(offset.length !== 2 || (!isNaN(offset[0]) && !isNaN(offset[1]))) // If the first two elements are not numbers
    || !(offset.length !== 3 || !isNaN(offset[2]))                      // If the third element is not a number
    ) {                   
        throw new Error("Offset is not a " + dimensions + "-dimensional vector");
    }
    if(isNaN(pow)) {
        throw new Error("Pow is not a number");
    }

    return {
        type: type,
        dimensions: dimensions,
        frequency: frequency,
        offset: offset,
        pow: pow,
        modifications: modifications
    };
}

const setNoiseSettings = (noiseSettings, program, uniformName) => {
    if(!GLC.isInitialized()) {
        throw new Error("GLC is not initialized");
    }

    GLC.setUniform(program, uniformName + ".type", "1i", noiseSettings.type);
    GLC.setUniform(program, uniformName + ".dimensions", "1i", noiseSettings.dimensions);
    GLC.setUniform(program, uniformName + ".frequency", "1f", noiseSettings.frequency);

    var offset;
    if(noiseSettings.dimensions === 2) {
        offset = [noiseSettings.offset[0], noiseSettings.offset[1], 0.0];
    } else {
        offset = noiseSettings.offset;
    }

    GLC.setUniform(program, uniformName + ".offset", "3fv", offset);
    GLC.setUniform(program, uniformName + ".pow", "1f", noiseSettings.pow);

    if(noiseSettings.modifications) {
        GLC.setUniform(program, uniformName + ".hasModifications", "1i", 1);
        if(noiseSettings.modifications.ridgeThreshold) {
            GLC.setUniform(program, uniformName + ".modifications.isRidged", "1i", 1);
            GLC.setUniform(program, uniformName + ".modifications.ridgeThreshold", "1f", noiseSettings.modifications.ridgeThreshold);
        } else {
            GLC.setUniform(program, uniformName + ".modifications.isRidged", "1i", 0);
        }
        //TODO pass to shader

    } else {
        GLC.setUniform(program, uniformName + ".hasModifications", "1i", 0);
    }
};

export {
    createNoiseSettings, 
    createModifications,
    setNoiseSettings,
    noiseTypes
};