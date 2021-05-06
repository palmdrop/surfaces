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

float getNoise(vec3 position, float frequency, float amplitude, vec3 offset, Modifications modifications) {
    vec3 sample = position * vec3(modifications.xStretch, modifications.yStretch, 1.0) * frequency + offset;
    float result = 0.0;

    result = simplex3d(sample);
    result = 0.5 + result / 2.0;

    // Apply modiifcations
    if(modifications.ridgeThreshold < 1.0) {
        float threshold = max(0.5, modifications.ridgeThreshold);
        if(result > threshold) {
            result = threshold - (result - threshold);
        }
        //TODO fix magic number etc
        result /= pow(threshold, 0.70);
    }
    if(modifications.pow != 1.0) {
        result = pow(result, modifications.pow);
    }

    if(modifications.mod != 1.0) {
        result = fract(result * modifications.mod);
    }

    // Verify valid result
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
    Modifications modifications = settings.modifications;

    float result = 0.0;
    float max = 0.0;
    if(octaves == 1) {
        result = getNoise(position, settings.frequency, 1.0, offset, modifications);
        max = 1.0;
    } else if(octaves == 3) {
        for(int i = 0; i < 3; i++) {
            float f = settings.frequency * pow(settings.lacunarity,  float(i));
            float a = 1.0                * pow(settings.persistence, float(i));
            result += getNoise(position, f, a, offset, modifications);
            max += a;
        }
    } else if(octaves == 5) {
        for(int i = 0; i < 5; i++) {
            float f = settings.frequency * pow(settings.lacunarity,  float(i));
            float a = 1.0                * pow(settings.persistence, float(i));
            result += getNoise(position, f, a, offset, modifications);
            max += a;
        }
    }

    return settings.amplitude * result / max;
}

#pragma glslify: export(noiseSupplier)