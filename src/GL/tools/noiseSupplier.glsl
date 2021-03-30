#pragma glslify: NoiseSettings = require(./noiseSettings.glsl)

#pragma glslify: perlin2d = require(glsl-noise/classic/2d);
#pragma glslify: simplex2d = require(glsl-noise/simplex/2d);

#pragma glslify: perlin3d = require(glsl-noise/classic/3d);
#pragma glslify: simplex3d = require(glsl-noise/simplex/3d);

int PERLIN = 0;
int SIMPLEX = 1;

bool isnan( float val )
{
  return ( val < 0.0 || 0.0 < val || val == 0.0 ) ? false : true;
}

bool isinf(float val) {
    return (val != 0.0 && val * 2.0 == val) ? true : false;
}

float noiseSupplier(NoiseSettings settings, vec3 position) {
    int type = settings.type;
    int dimensions = settings.dimensions;

    if(dimensions < 2 || dimensions > 3) return 0.0;

    vec3 sample = position * settings.frequency + settings.offset;
    float result = 0.0;

    // PERLIN
    if (type == PERLIN) {
        
        // 2D PERLIN
        if(dimensions == 2) {
            result = perlin2d(sample.xy);
        // 3D PERLIN
        } else {
            result = perlin3d(sample);    
        }

    } else 

    // SIMPLEX
    if(type == SIMPLEX) {

        // 2D SIMPLEX
        if(dimensions == 2) {
            result = simplex2d(sample.xy);
        // 3D SIMPLEX
        } else {
            result = simplex3d(sample);
        }
    } 

    result = pow((0.5 + result / 2.0), settings.pow);

    if(isnan(result)) {
        //TODO better fix?
        result = 0.0;
    }
    if(isinf(result)) {
        result = 1.0;
    }

    return result;
}

#pragma glslify: export(noiseSupplier)