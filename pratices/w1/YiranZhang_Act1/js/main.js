var floatsPerVertex = 6; //# of Float32Array used for each vertex

// MOUSE DRAG STUFF
var isDrag = false;		// mouse-drag: true when user holds down mouse button
var xMclik = 0.0;			// last mouse button-down position (in CVV coords)
var yMclik = 0.0;
var xMdragTot = 0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot = 0.0;

//Global canvas/gl things
var canvas;
var gl;


var r = 1;
var g = 1;
var b = 1;

var g_EyeX = 0, g_EyeY = 3.0, g_EyeZ = 3.00;
var g_AtX = 0.0, g_AtY = 0.0, g_AtZ = 0.0;

var theta = 0;

var flag = -1;

var u_LightMode;
var lMode = 1;
var bMode = 0;
var maxModes = 4;

var u_ModelMatrix = false;
var u_ProjMatrix = false;
var u_NormalMatrix = false;

var u_HeadlightPosition;
var u_HeadlightDiffuse;
var u_HeadlightSpecular;
var u_HeadlightAmbient;

var u_LightDiffuse;
var u_LightPosition;
var u_AmbientLight;
var u_Specular;
// var u_DiffuseLight;

var u_EyePosWorld;

var u_Ke;
var u_Ks;
var u_Ka;
var u_Kd;
var u_KShiny;

var projMatrix = new Matrix4();
var modelMatrix = new Matrix4();
var normalMatrix = new Matrix4();

var u_eyePosWorld = false;

var u_ballShiftID;
var u_ballMode;

//Light control
var headlightOn = true;
var worldLightOn = true;
var hLOn;
var wLOn;

var g_last = Date.now();

var timeStep = 1000.0/60.0;         // current timestep (1/60th sec) in milliseconds

// Define all the adjustable ball-movement parameters, and
var INIT_VEL =  0.5 * 60.0;                    
var g_drag = 0.985;      
var g_grav = 9.832;         
                                                
// Define just one 'bouncy ball' particle
var xposNow = 0.0;          var yposNow = 0.0;      var zposNow =  0.0;     
var xvelNow = INIT_VEL; var yvelNow = INIT_VEL;     var zvelNow =  0.0;

// For keyboard, mouse-click-and-drag:      

var isDrag=false;       // mouse-drag: true when user holds down mouse button
var xMclik=0.0;         // last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;  // total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;  

var isClear = 1;        // 0 or 1 to enable or disable screen-clearing in the


//Variables for user adjusted aspects of world lights
var usrAmbiR, usrAmbiG,usrAmbiB,usrDiffR,usrDiffG,usrDiffB,usrSpecR,usrSpecG,usrSpecB,usrPosX,usrPosY,usrPosZ;

var currentAngle;
var ANGLE_STEP = 35.0;

var treeAngle;
var TREE_ANGLE_STEP = 15.0;

function main() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    // Get the rendering context for WebGL
    gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
    // unless the new Z value is closer to the eye than the old one..
    //  gl.depthFunc(gl.LESS);       // WebGL default setting:
    gl.enable(gl.DEPTH_TEST);

    // Set the vertex coordinates and color (the blue triangle is in the front)
    var n = initVertexBuffers(gl);

    if (n < 0) {
        console.log('Failed to specify the vertex information');
        return;
    }

    // Specify the color for clearing <canvas>
    gl.clearColor(0, 0, 0, 0);

    // Next, register all keyboard events found within our HTML webpage window:
    window.addEventListener("keydown", myKeyDown, false);
    window.addEventListener("keyup", myKeyUp, false);
    window.addEventListener("keypress", myKeyPress, false);

    //uniform matrices
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
    u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    u_eyePosWorld = gl.getUniformLocation(gl.program, 'u_eyePosWorld');

    u_LightMode = gl.getUniformLocation(gl.program, 'lightMode');
    u_ballMode = gl.getUniformLocation(gl.program, 'ballMode');

    u_HeadlightDiffuse = gl.getUniformLocation(gl.program, 'u_HeadlightDiffuse');
    u_HeadlightPosition = gl.getUniformLocation(gl.program, 'u_HeadlightPosition');
    u_HeadlightSpecular = gl.getUniformLocation(gl.program, 'u_HeadlightSpecular');
    u_HeadlightAmbient = gl.getUniformLocation(gl.program, 'u_HeadlightAmbient');

    u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
    u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
    u_LightDiffuse = gl.getUniformLocation(gl.program, 'u_LightDiffuse');
    u_Specular = gl.getUniformLocation(gl.program, 'u_Specular');

    wLOn = gl.getUniformLocation(gl.program, 'worldLightOn');
    hlOn = gl.getUniformLocation(gl.program, 'headLightOn');

    u_Ke = gl.getUniformLocation(gl.program, 'u_Ke');
    u_Ks = gl.getUniformLocation(gl.program, 'u_Ks');
    u_Ka = gl.getUniformLocation(gl.program, 'u_Ka');
    u_Kd = gl.getUniformLocation(gl.program, 'u_Kd');
    u_KShiny = gl.getUniformLocation(gl.program, 'u_KShiny');

    gl.uniform3f(u_Ks, 1.0, 1.0, 1.0);
    gl.uniform3f(u_Ka, 0.6, 0.3, 0.3);
    gl.uniform3f(u_Kd, 0.3, 0.3, 0.3);


    gl.uniform3f(u_HeadlightDiffuse, 1.0, 1.0, 1.0);
    gl.uniform3f(u_HeadlightSpecular, 1.0, 1.0, 1.0);
    gl.uniform1i(wLOn, 1);
    gl.uniform1i(hlOn, 1);
    gl.uniform1i(u_LightMode, lMode);
    gl.uniform1i(u_ballMode, bMode);

    currentAngle = 0.0;
    treeAngle = 0.0;

    var tick = function () {
        canvas.width = innerWidth;
        canvas.height = innerHeight *0.75;
        gl.uniform1i(u_LightMode, lMode);
        // gl.uniform1i(u_ballMode, bMode);
        userValues();
        gl.uniform3f(u_eyePosWorld, g_EyeX, g_EyeY, g_EyeZ);
        // timeStep = animate(timeStep);
        draw();
        requestAnimationFrame(tick, canvas);
    };
    tick();

}

function userValues() {
    var ar, ag, ab, dr, dg, db, sr, sg, sb, px, py, px;

    ar = document.getElementById("AR").value/255;
    if (isNaN(ar))
    {
        ar = usrAmbiR
        }
    ag = document.getElementById("AG").value/255;
    if (isNaN(ag))
    {
        ag = usrAmbiG;
    }
    ab = document.getElementById("AB").value/255;
    if (isNaN(ab)) {
        ab = usrAmbiB
    }
    dr = document.getElementById("DR").value/255;
    if (isNaN(dr)) {
        dr = usrDiffR;
    }
    dg = document.getElementById("DG").value/255;
    if (isNaN(dg)) {
        dg = usrDiffG;
    }
    db = document.getElementById("DB").value/255;
    if (isNaN(db)) {
        db = usrDiffB;
    }
    sr = document.getElementById("SR").value/255;
    if (isNaN(sr)) {
        sr = usrSpecR;
    }
    sg = document.getElementById("SG").value/255;
    if (isNaN(sg)) {
        sg = usrSpecG;
    }
    sb = document.getElementById("SB").value/255;
    if (isNaN(sb)) {
        sb = usrSpecB;
    }
    px = document.getElementById("PX").value/255;
    if (isNaN(px)) {
        px = usrPosX;
    }
    py = document.getElementById("PY").value/255;
    if (isNaN(py)) {
        py = usrPosY;
    }
    pz = document.getElementById("PZ").value/255;
    if (isNaN(pz)) {
        pz = usrPosZ;
    }
    usrAmbiR = ar;
    usrAmbiG = ag;
    usrAmbiB = ab;
    usrDiffR = dr;
    usrDiffG = dg;
    usrDiffB = db;
    usrSpecR = sr;
    usrSpecG = sg;
    usrSpecB = sb;
    usrPosX =  px;
    usrPosY = py;
    usrPosZ = pz;
    
}
