#pragma glslify: NoiseSettings = require(../settings/noiseSettings.glsl);
#pragma glslify: FractalNoiseSettings = require(../settings/fractalNoiseSettings.glsl);

#pragma glslify: noiseSupplier = require(./noiseSupplier.glsl);

float fractalNoiseSupplier(FractalNoiseSettings settings, vec3 position) {
    NoiseSettings ns = settings.noise;
    int octaves = settings.octaves;

    float max = 0.0;
    float result = 0.0;

    // 1 OCTAVE
    // This is the same as regular nosie
    if(octaves == 1) {
        result = max = noiseSupplier(ns, position);
    } else 
    
    // 3 OCTAVES
    if(octaves <= 3) {
        for(int i = 0; i < 3; i++) {
            float f = ns.frequency * pow(settings.lacunarity, float(i));
            NoiseSettings s = NoiseSettings(
                ns.type, 
                ns.dimensions,
                f,
                ns.offset,
                ns.pow,
                ns.hasModifications,
                ns.modifications
            );

            float a = 1.0 * pow(settings.persistence, float(i));
            float n = a * noiseSupplier(s, position);

            result += n;
            max += a;
        }
    } else

    // 5 OCTAVES
    if(octaves <= 5) {
        for(int i = 0; i < 5; i++) {
            float f = ns.frequency * pow(settings.lacunarity, float(i));
            NoiseSettings s = NoiseSettings(
                ns.type, 
                ns.dimensions,
                f,
                ns.offset,
                ns.pow,
                ns.hasModifications,
                ns.modifications
            );

            float a = 1.0 * pow(settings.persistence, float(i));
            float n = a * noiseSupplier(s, position);

            result += n;
            max += a;
        }
    } 

    // 8 OCTAVES
    else {
        for(int i = 0; i < 8; i++) {
            float f = ns.frequency * pow(settings.lacunarity, float(i));
            NoiseSettings s = NoiseSettings(
                ns.type, 
                ns.dimensions,
                f,
                ns.offset,
                ns.pow,
                ns.hasModifications,
                ns.modifications
            );

            float a = 1.0 * pow(settings.persistence, float(i));
            float n = a * noiseSupplier(s, position);

            result += n;
            max += a;
        }
    }
    
    if(settings.normalize) {
        return result / max;
    } else {
        return result;
    }
}

#pragma glslify: export(fractalNoiseSupplier)