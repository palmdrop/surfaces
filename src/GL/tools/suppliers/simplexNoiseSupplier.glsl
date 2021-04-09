#pragma glslify: simplex3d = require(glsl-noise/simplex/3d);

#pragma glslify: NoiseSettings = require(../settings/noiseSettings.glsl)
#pragma glslify: Modifications = require(../settings/modifications.glsl)

int PERLIN = 0;
int SIMPLEX = 1;

bool isnan( float val )
{
  return ( val < 0.0 || 0.0 < val || val == 0.0 ) ? false : true;
}

bool isinf(float val) {
    return (val != 0.0 && val * 2.0 == val) ? true : false;
}

float applyModifications(float value, Modifications modifications) {
    if(modifications.ridgeThreshold < 1.0) {
        float threshold = max(0.5, modifications.ridgeThreshold);
        if(value > threshold) {
            value = threshold - (value - threshold);
        }
        //TODO fix magic number etc
        value /= pow(threshold, 0.70);
    }
    if(modifications.pow != 1.0) {
        value = pow(value, modifications.pow);
    }

    return value;
}

float getNoise(vec3 position, float frequency, float amplitude, vec3 offset, bool hasModifications, Modifications modifications) {
    vec3 sample = position * frequency + offset;
    float result = 0.0;

    result = simplex3d(sample);
    result = 0.5 + result / 2.0;

    if(hasModifications) {
        result = applyModifications(result, modifications);
    }

    if(isnan(result)) {
        result = 0.0;
    }
    if(isinf(result)) {
        result = 1.0;
    }

    return amplitude * result;
}

float noiseSupplier(NoiseSettings settings, vec3 position) {
    int octaves = settings.octaves;
    vec3 offset = settings.offset;
    bool hasModifications = settings.hasModifications;
    Modifications modifications = settings.modifications;

    float result = 0.0;
    float max = 0.0;
    if(octaves == 1) {
        result = getNoise(position, settings.frequency, 1.0, offset, hasModifications, modifications);
        max = 1.0;
    } else if(octaves == 3) {
        for(int i = 0; i < 3; i++) {
            float f = settings.frequency * pow(settings.lacunarity,  float(i));
            float a = 1.0                * pow(settings.persistence, float(i));
            result += getNoise(position, f, a, offset, hasModifications, modifications);
            max += a;
        }
    } else if(octaves == 5) {
        for(int i = 0; i < 5; i++) {
            float f = settings.frequency * pow(settings.lacunarity,  float(i));
            float a = 1.0                * pow(settings.persistence, float(i));
            result += getNoise(position, f, a, offset, hasModifications, modifications);
            max += a;
        }
    }

    if(settings.normalize) {
        return result / max;
    } else {
        return result;
    }
}

#pragma glslify: export(noiseSupplier)