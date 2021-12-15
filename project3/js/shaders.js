var VSHADER_SOURCE =
    'precision highp float;\n' +
    'precision highp int;\n' +

    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'attribute vec4 a_Normal;\n' +     

    'uniform mat4 u_ProjMatrix;\n' +
    'uniform mat4 u_ModelMatrix;\n' +   
    'uniform mat4 u_NormalMatrix;\n' +   

    //Uniforms
    'uniform vec3 u_eyePosWorld; \n' +

    //switch lightmode
    'uniform int lightMode;\n' +

    //Material uniforms
    'uniform vec3 u_Ks;\n' +  //specular
    'uniform vec3 u_Ke;\n' +  //emissive
    'uniform vec3 u_Ka;\n' +  //ambience
    'uniform vec3 u_Kd; \n' + //diffuse
    'uniform int u_KShiny;\n' + //shinyness

    //Headlight uniforms
    'uniform vec3 u_HeadlightPosition;\n' +
    'uniform vec3 u_HeadLightDirection;\n' +
    'uniform vec3 u_HeadlightDiffuse;\n' +
    'uniform vec3 u_HeadLightAmbient;\n' + 
    'uniform vec3 u_HeadlightSpecular;\n' +

    //Worldlight uniforms
    'uniform vec3 u_LightPosition;\n' +
    'uniform vec3 u_LightDirection;\n' +
    'uniform vec3 u_AmbientLight;\n' +
    'uniform vec3 u_LightDiffuse;\n' +
    'uniform vec3 u_Specular;\n' +

    'varying vec3 v_Color;\n' +
    'varying vec3 v_Normal;\n' +
    'varying vec3 v_Position;\n' +
    'varying vec3 v_Kd;\n' +


    'void main() {\n' +

    //phong shading
    'gl_Position = u_ProjMatrix * u_ModelMatrix * a_Position;\n' +
    'v_Position = vec3(u_ModelMatrix * a_Position);\n' +
    'v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
    // 'v_Color = a_Color;\n' +
    'v_Kd = u_Kd;\n' +

    //gouraud shading
    'if(lightMode == 3 || lightMode == 4){\n' +

        'vec3 normal = normalize(v_Normal); \n' +
        'vec3 eyeDirection = normalize(u_eyePosWorld.xyz - v_Position); \n' +
        
        'vec3 lightDirection = normalize(u_LightPosition - v_Position);\n' +
        'vec3 hLightDirection = normalize(u_HeadlightPosition - v_Position);\n' +

        'float nDotL = max(dot(lightDirection, normal), 0.0); \n' +
        'float nDotHl = max(dot(hLightDirection, normal),0.0);\n' +

        // for world light
        'vec3 emissiveW;\n' +
        'vec3 diffuseW;\n' +
        'vec3 ambientW;\n' +
        'vec3 specularW;\n' +

        // for head light
        'vec3 emissiveH;\n' +
        'vec3 diffuseH;\n' +
        'vec3 ambientH;\n' +
        'vec3 specularH;\n' +

        'float shineF = float(u_KShiny);\n' +

    //gouraud phong
    'if(lightMode==3){\n' +
        'vec3 W = normalize(lightDirection + eyeDirection); \n' +
        'float nDotW = max(dot(W, normal), 0.0); \n' +
        'float e64W = pow(nDotW, shineF); \n' +

        'vec3 H = normalize(hLightDirection + eyeDirection); \n' +
        'float nDotH = max(dot(H, normal), 0.0); \n' +
        'float e64H = pow(nDotH, shineF*0.5); \n' +

        //world light on objects
        'emissiveW = u_Ke;\n' +
        'ambientW = u_AmbientLight * u_Ka;\n' +
        'specularW = u_Specular * u_Ks * e64W;\n' +
        'diffuseW = u_LightDiffuse * v_Kd * nDotL;\n' +
        'v_Color = emissiveW + ambientW + diffuseW + specularW;\n' +

        //head light on objects
        'emissiveH = u_Ke;\n' +
        'ambientH = u_HeadLightAmbient * u_Ka;\n' +
        'specularH = u_HeadlightSpecular * u_Ks * e64H;\n' +
        'diffuseH = u_HeadlightDiffuse * v_Kd * nDotHl;\n' +
        'v_Color = v_Color+ emissiveH + ambientH + diffuseH + specularH;\n' +
    '}\n' +

    //Gouraud Blinn
    'if(lightMode==4){\n' +
        'vec3 refW = normalize(2.0*(normal * nDotL) - lightDirection); \n' +
        'float rDotRW = max(dot(refW, eyeDirection), 0.0); \n' +
        'float e64W = pow(rDotRW, shineF); \n' +

        'vec3 refH = normalize(2.0*(normal * nDotHl) - hLightDirection); \n' +
        'float rDotRH = max(dot(refH, eyeDirection), 0.0); \n' +
        'float e64H = pow(rDotRH, shineF*0.5); \n' +

        //world light on objects
        'emissiveW = u_Ke;\n' +
        'ambientW = u_AmbientLight * u_Ka;\n' +
        'specularW = u_Specular * u_Ks * e64W;\n' +
        'diffuseW = u_LightDiffuse * v_Kd * nDotL;\n' +
        'v_Color = emissiveW + ambientW + diffuseW + specularW;\n' +

        //head light on objects
        'emissiveH = u_Ke;\n' +
        'ambientH = u_HeadLightAmbient * u_Ka;\n' +
        'specularH = u_HeadlightSpecular * u_Ks * e64H;\n' +
        'diffuseH = u_HeadlightDiffuse * v_Kd * nDotHl;\n' +
        'v_Color = v_Color+ emissiveH + ambientH + diffuseH + specularH;\n' +
    '}\n' +
    '}\n' +
    
'}\n';

var FSHADER_SOURCE =
    'precision highp float;\n' +
    'precision highp int;\n' +

    'varying vec3  v_Color;\n' +
    'varying vec3 v_Normal;\n' +
    'varying vec3 v_Position;\n' +
    'varying vec3 v_Kd;\n' +

    //Uniforms
    'uniform vec3 u_eyePosWorld; \n' +

    //Material uniforms
    'uniform vec3 u_Ks;\n' + 
    'uniform vec3 u_Ke;\n' + 
    'uniform vec3 u_Ka;\n' + 
    'uniform vec3 u_Kd; \n' + 
    'uniform int u_KShiny;\n' +

    //Worldlight uniforms
    'uniform vec3 u_LightPosition;\n' + 
    'uniform vec3 u_LightDirection;\n' +
    'uniform vec3 u_LightDiffuse;\n' +  
    'uniform vec3 u_AmbientLight;\n' +  
    'uniform vec3 u_Specular;\n' +

    //Headlight uniforms
    'uniform vec3 u_HeadLightDirection;\n' +
    'uniform vec3 u_HeadlightPosition;\n' + 
    'uniform vec3 u_HeadlightDiffuse;\n' + 
    'uniform vec3 u_HeadLightAmbient;\n' + 
    'uniform vec3 u_HeadlightSpecular;\n' +

    //switch lightmode
    'uniform int lightMode;\n' +
    'uniform int headlightOn;\n' +
    'uniform int worldLightOn;\n' +


    'void main(){ \n' +
    //phong shading
    'if(lightMode==1 || lightMode==2){\n' +
        'vec3 normal = normalize(v_Normal); \n' +
        'vec3 eyeDirection = normalize(u_eyePosWorld.xyz - v_Position); \n' +
        'vec3 lightDirection = normalize(u_LightPosition - v_Position);\n' +
        'vec3 hLightDirection = normalize(u_HeadlightPosition - v_Position);\n' +

        'float nDotL = max(dot(lightDirection, normal), 0.0); \n' +
        'float nDotHl = max(dot(hLightDirection, normal),0.0);\n' +

        // for world light
        'vec3 emissiveW;\n' +
        'vec3 diffuseW;\n' +
        'vec3 ambientW;\n' +
        'vec3 specularW;\n' +

        // for head light
        'vec3 emissiveH;\n' +
        'vec3 diffuseH;\n' +
        'vec3 ambientH;\n' +
        'vec3 specularH;\n' +

        'float shineF = float(u_KShiny);\n' +

        'vec4 headFrag;\n' +
        'vec4 worldFrag;\n' +
    
        //Blinn Phong
        'if(lightMode==2){\n' +
            'vec3 W = normalize(lightDirection + eyeDirection); \n' +
            'float nDotW = max(dot(W, normal), 0.0); \n' +
            'float e64W = pow(nDotW, shineF); \n' +

            'vec3 H = normalize(hLightDirection + eyeDirection); \n' +
            'float nDotH = max(dot(H, normal), 0.0); \n' +
            'float e64H = pow(nDotH, shineF*0.5); \n' +

            'vec3 hdiff = u_HeadlightDiffuse * v_Kd * nDotHl;\n' +
            'vec3 hspec = u_HeadlightSpecular * u_Ks * e64H;\n' +

            //world light on objects
            'emissiveW = u_Ke;\n' +
            'ambientW = u_AmbientLight * u_Ka;\n' +
            'specularW = u_Specular * u_Ks * e64W;\n' +
            'diffuseW = u_LightDiffuse * v_Kd * nDotL;\n' +
            'worldFrag = vec4((emissiveW + ambientW + diffuseW + specularW), 1.0);\n' +

            //head light on objects
            'emissiveH = u_Ke;\n' +
            'ambientH = u_HeadLightAmbient * u_Ka;\n' +
            'specularH = u_HeadlightSpecular * u_Ks * e64H;\n' +
            'diffuseH = u_HeadlightDiffuse * v_Kd * nDotHl;\n' +
            'headFrag = vec4((emissiveH + ambientH + nDotHl*diffuseH + specularH*hspec), 1.0);\n' +
            // 'headFrag = vec4((emissiveW + ambientW + diffuseW + specularW), 1.0);\n' +
        '}\n' +

        // phong phong
        'if(lightMode == 1){\n'+
            'vec3 refW = normalize(2.0*(normal * nDotL) - lightDirection); \n' +
            'float rDotRW = max(dot(refW, eyeDirection), 0.0); \n' +
            'float e64W = pow(rDotRW, shineF); \n' +

            'vec3 refH = normalize(2.0*(normal * nDotHl) - hLightDirection); \n' +
            'float rDotRH = max(dot(refH, eyeDirection), 0.0); \n' +
            'float e64H = pow(rDotRH, shineF*0.8); \n' +

            'vec3 hdiff = u_HeadlightDiffuse * v_Kd * nDotHl;\n' +
            'vec3 hspec = u_HeadlightSpecular * u_Ks * e64H;\n' +

            //world light on objects
            'emissiveW = u_Ke;\n' +
            'ambientW = u_AmbientLight * u_Ka;\n' +
            'specularW = u_Specular * u_Ks * e64W;\n' +
            'diffuseW = u_LightDiffuse * v_Kd * nDotL;\n' +
            'worldFrag = vec4((emissiveW + ambientW + diffuseW + specularW), 1.0);\n' +

            //head light on objects
            'emissiveH = u_Ke;\n' +
            'ambientH = u_HeadLightAmbient * u_Ka;\n' +
            'specularH = u_HeadlightSpecular * u_Ks * e64H;\n' +
            'diffuseH = u_HeadlightDiffuse * v_Kd * nDotHl;\n' +
            'headFrag = vec4((emissiveH + ambientH + nDotHl*diffuseH + specularH*hspec), 1.0);\n' +
            // 'headFrag = vec4((emissiveW + ambientW + diffuseW + specularW), 1.0);\n' +
        '}\n' +

        'vec4 frag;\n' +
        //headlight and world light determine
        'if(headlightOn == 1 && worldLightOn == 1){\n' +
            'frag = headFrag + worldFrag;\n' +
        '}\n' +
        'else if(headlightOn == 1 && worldLightOn == 0){\n' +
            'frag = headFrag;\n' +
        '}\n' +
        'else{\n' +
            'frag = worldFrag;\n' +
        '}\n' +
        'gl_FragColor = frag;\n' +

    '}\n' +

    // gouraud
    'else{\n'+
        'gl_FragColor = vec4(v_Color, 1.0);\n' +
    '}\n' +
'}\n';
