const PART_XPOS     = 0;  //  position
const PART_YPOS     = 1;
const PART_ZPOS     = 2;
const PART_WPOS     = 3;            // (why include w? for matrix transforms;
                                    // for vector/point distinction
const PART_XVEL     = 4;  //  velocity -- ALWAYS a vector: x,y,z; no w. (w==0)
const PART_YVEL     = 5;
const PART_ZVEL     = 6;
const PART_X_FTOT   = 7;  // force accumulator:'ApplyForces()' fcn clears
const PART_Y_FTOT   = 8;  // to zero, then adds each force to each particle.
const PART_Z_FTOT   = 9;
const PART_R        =10;  // color : red,green,blue, alpha (opacity); 0<=RGBA<=1.0
const PART_G        =11;
const PART_B        =12;
const PART_MASS     =13;  	// mass, in kilograms
const PART_DIAM 	=14;	// on-screen diameter (in pixels)
const PART_RENDMODE =15;	// on-screen appearance (square, round, or soft-round)
const PART_AGE      =16;  // # of frame-times until re-initializing (Reeves Fire)
const PART_MAXVAR   =17;  // Size of array in CPart uses to store its values.


const SOLV_EULER       = 0;       // Euler integration: forward,explicit,...
const SOLV_MIDPOINT    = 1;       // Midpoint Method (see Pixar Tutorial)
const SOLV_OLDGOOD     = 2;      //  early accidental 'good-but-wrong' solver
const SOLV_BACK_EULER  = 3;      // 'Backwind' or Implicit Euler
const SOLV_BACK_MIDPT  = 4;      // 'Backwind' or Implicit Midpoint
const SOLV_VERLET      = 8;       // Verlet semi-implicit integrator;
const SOLV_VEL_VERLET  = 9;       // 'Velocity-Verlet'semi-implicit integrator
const SOLV_LEAPFROG    = 10;      // 'Leapfrog' integrator
const SOLV_MAX         = 11;      // number of solver types available.

const NU_EPSILON  = 10E-3;         // a tiny amount; a minimum vector length
                                    // to use to avoid 'divide-by-zero'
//=============================================================================
//==============================================================================

function PartSys(offset_x,offset_y,offset_z){

  this.VERT_SRC =
  ' precision mediump float;                 \n' + // req'd in OpenGL ES if we use 'float'
  ' uniform    int u_runMode;                \n' + // particle system state: // 0=reset; 1= pause; 2=step; 3=run
  ' attribute vec4 a_Position;               \n' +
  ' attribute float a_Size;                  \n' +
  ' uniform   mat4 u_ModelMat;               \n' +
  ' varying   vec4 v_Color;                  \n' +
  ' attribute vec3 a_Color;                  \n' +
  ' void main() {                            \n' +
  '   gl_PointSize = a_Size;                 \n' +// TRY MAKING THIS LARGER...
  '   gl_Position = u_ModelMat * a_Position; \n' +
  '   if(u_runMode == 0) {                   \n' +
  '     v_Color = vec4(1.0, 0.0, 0.0, 1.0);  \n' +   // red: 0==reset
  '     }                                    \n' +
  '   else if(u_runMode == 1) {              \n' +
  '     v_Color = vec4(1.0, 1.0, 0.0, 1.0);  \n' +  // yellow: 1==pause
  '     }                                    \n' +
  '   else if(u_runMode == 2) {              \n' +
  '     v_Color = vec4(1.0, 1.0, 1.0, 1.0);  \n' +  // white: 2==step
  '     }                                    \n' +
  '   else {                                 \n' +
  '     v_Color = vec4(a_Color, 1.0);  \n' +  // varing: >=3 ==run
  '     }                                    \n' +
  ' }                                        \n' ;

this.FRAG_SRC =
  'precision mediump float;                                 \n' +
  'varying vec4 v_Color;                                    \n' +
  'void main() {                                            \n' +
  '  float dist = distance(gl_PointCoord, vec2(0.5, 0.5));  \n' +
  '  if(dist < 0.5) {                                       \n' +
  '   gl_FragColor = vec4((1.0-2.0*dist)*v_Color.rgb, 1.0); \n' +
  '  } else { discard; }                                    \n' +
  '}                                                        \n' ;
  this.randX = 0;   // random point chosen by call to roundRand()
  this.randY = 0;
  this.randZ = 0;
  this.isFountain = 0;  
  this.forceList = [];           
  this.limitList = [];           
  this.u_runModeID;
  this.shaderLoc;
  this.ModelMat = new Matrix4();
  this.u_ModelMatLoc;
  this.offset_x = offset_x;
  this.offset_y = offset_y;
  this.offset_z = offset_z;
}
PartSys.prototype.roundRand = function(){

do {		
    this.randX = 2.0*Math.random() -1.0; 
    this.randY = 2.0*Math.random() -1.0; 
    this.randZ = 2.0*Math.random() -1.0;
    }       
while(this.randX*this.randX +
    this.randY*this.randY +
    this.randZ*this.randZ >= 1.0);
}

PartSys.prototype.initBouncy3D = function(count,addGravity,solverType) {
    this.partCount = count;
    this.s1 = new Float32Array(this.partCount * PART_MAXVAR)
    this.s2 = new Float32Array(this.partCount * PART_MAXVAR)
    this.s1dot = new Float32Array(this.partCount * PART_MAXVAR)

    if (addGravity){
        fTmp = new CForcer();
        fTmp.forceType = F_GRAV_E;
        fTmp.targFirst = 0;
        fTmp.targCount = -1;
        this.forceList.push(fTmp);
    }

    fTmp = new CForcer();
    fTmp.forceType = F_DRAG;
    fTmp.Kdrag = 0.15;
    fTmp.targFirst = 0;
    fTmp.targCount = -1;
    this.forceList.push(fTmp);

    fTmp = new CForcer();
    fTmp.forceType = F_FRIC;
    fTmp.d_fric = 0.01;
    fTmp.targFirst = 0;
    fTmp.targCount = -1;
    this.forceList.push(fTmp);

    cTmp = new CLimit();      // creat constraint-causing object, and
    cTmp.hitType = HIT_BOUNCE_VEL;  // set how particles 'bounce' from its surface,
    cTmp.limitType = LIM_VOL;       // confine particles inside axis-aligned
                                    // rectangular volume that
    cTmp.targFirst = 0;             // applies to ALL particles; starting at 0
    cTmp.partCount = -1;            // through all the rest of them.
    cTmp.xMin = -0.9 + this.offset_x; cTmp.xMax = 0.9 + this.offset_x;  // box extent:  +/- 1.0 box at origin
    cTmp.yMin = -0.9 + this.offset_y; cTmp.yMax = 0.9 + this.offset_y;
    cTmp.zMin = -0.9 + this.offset_z; cTmp.zMax = 0.9 + this.offset_z;
    cTmp.Kresti = 1.0;              // bouncyness: coeff. of restitution.
                                    // (and IGNORE all other CLimit members...)
    this.limitList.push(cTmp);      // append this 'box' constraint object to the 
    
    
    cTmp = new CLimit();
    cTmp.limitType = LIM_ZERO;
    cTmp.targFirst = 0;
    cTmp.partCount = -1;
    this.limitList.push(cTmp);


    cTmp = new CLimit();
    cTmp.limitType = LIM_ANCHOR;
    cTmp.targFirst = 0;
    cTmp.partCount = 0;
    cTmp.anchorsList = [];
    this.limitList.push(cTmp);

    // Report:
    console.log("PartSys.initBouncy3D() created PartSys.limitList[] array of ");
    console.log("\t\t", this.limitList.length, "CLimit objects.");

    this.INIT_VEL =  0.15 * 60.0;		
    this.drag = 0.7;
    this.grav = 9.832;
    this.resti = 1; 

    //--------------------------init Particle System Controls:
    this.runMode =  3;
    this.solvType = solverType;
    this.bounceType = 1;	
    this.diam = 100.0;

    var j = 0;
    for (var i = 0; i < this.partCount; i += 1, j += PART_MAXVAR){
        this.roundRand();
        this.s1[j + PART_XPOS] = -0.0 + 0.1 * this.randX + this.offset_x;
        this.s1[j + PART_YPOS] = -0.0 + 0.1 * this.randY + this.offset_y;
        this.s1[j + PART_ZPOS] = -0.0 + 0.1 * this.randZ + this.offset_z;
        this.s1[j + PART_WPOS] =  1.0;
        this.roundRand();
        this.s1[j + PART_XVEL] = this.INIT_VEL * (0.4 + 0.2*this.randX);
        this.s1[j + PART_YVEL] = this.INIT_VEL * (0.4 + 0.2*this.randY);
        this.s1[j + PART_ZVEL] = this.INIT_VEL * (0.4 + 0.2*this.randZ);
        this.s1[j + PART_MASS] = 1.0;
        this.s1[j + PART_DIAM] =  2.0 + 10*Math.random();
        this.s1[j + PART_RENDMODE] = 0.0;
        this.s1[j + PART_AGE] = 30 + 100*Math.random();
        this.s1[j + PART_R] = 1.0;
        this.s1[j + PART_G] = 1.0;
        this.s1[j + PART_B] = 1.0;


        var cDist = cameraDist(this.s1[j + PART_XPOS],this.s1[j + PART_YPOS],this.s1[j + PART_ZPOS]) 
        this.s1[j + PART_DIAM] = this.diam/(cDist + NU_EPSILON);

        this.s2.set(this.s1);
    }
    this.FSIZE = this.s1.BYTES_PER_ELEMENT;


}

PartSys.prototype.initSpringMesh = function(kspring,kdamp,height,width,restL,windForce,addGravity,solverType){
    this.partCount = width * height;
    this.s1 = new Float32Array(this.partCount * PART_MAXVAR)
    this.s2 = new Float32Array(this.partCount * PART_MAXVAR)
    this.s1dot = new Float32Array(this.partCount * PART_MAXVAR)

    fTmp = new CForcer();
    fTmp.forceType = F_WIND;
    fTmp.windPosition = new Vector3([this.offset_x,this.offset_y,this.offset_z]);
    fTmp.windStrength = windForce;
    fTmp.windRadius = 6;
    fTmp.windDirection = new Vector3([0.0,-1.0,0.0])
    fTmp.targFirst = 0;
    fTmp.targCount = -1;
    this.forceList.push(fTmp);

    for(var i = 0; i < height-1; i++){
        for (var j = 0; j < width-1; j++){
            fTmp = new CForcer();
            fTmp.forceType = F_SPRING;
            fTmp.e1 = i*width + j;
            fTmp.e2 = i*width + j+1;
            fTmp.K_restLength = restL;
            fTmp.K_spring = kspring;
            fTmp.K_springDamp = kdamp;
            this.forceList.push(fTmp);
        }
    }


    console.log("PartSys.initBouncy3D() created PartSys.forceList[] array of ");
    console.log("\t\t", this.forceList.length, "CForcer objects:");
    for(i=0; i<this.forceList.length; i++) {
        console.log("CForceList[",i,"]");
        this.forceList[i].printMe();
        }

    cTmp = new CLimit();      // creat constraint-causing object, and
    cTmp.hitType = HIT_BOUNCE_VEL;  // set how particles 'bounce' from its surface,
    cTmp.limitType = LIM_VOL;       // confine particles inside axis-aligned
                                    // rectangular volume that
    cTmp.targFirst = 0;             // applies to ALL particles; starting at 0
    cTmp.partCount = -1;            // through all the rest of them.
    cTmp.xMin = -0.9 + this.offset_x; cTmp.xMax = 0.9 + this.offset_x;  // box extent:  +/- 1.0 box at origin
    cTmp.yMin = -0.9 + this.offset_y; cTmp.yMax = 0.9 + this.offset_y;
    cTmp.zMin = -0.9 + this.offset_z; cTmp.zMax = 0.9 + this.offset_z;
    cTmp.Kresti = 1.0;              // bouncyness: coeff. of restitution.
                                    // (and IGNORE all other CLimit members...)
    this.limitList.push(cTmp);      // append this 'box' constraint object to the 
    
    
    cTmp = new CLimit();
    cTmp.limitType = LIM_ZERO;
    cTmp.targFirst = 0;
    cTmp.partCount = -1;
    this.limitList.push(cTmp);


    cTmp = new CLimit();
    cTmp.limitType = LIM_ANCHOR;
    cTmp.targFirst = 0;
    cTmp.partCount = 0;
    for (var index = 0; index < Math.floor(this.partCount/width); index ++){
        cTmp.anchorsList.push((index+1) * width - 1);
    }

    this.limitList.push(cTmp);

    // Report:
    console.log("PartSys.initBouncy3D() created PartSys.limitList[] array of ");
    console.log("\t\t", this.limitList.length, "CLimit objects.");

    this.INIT_VEL =  0;
    this.drag = 0.8;
    this.grav = 9.832;
    this.resti = 1; 

    //--------------------------init Particle System Controls:
    this.runMode =  3;
    this.solvType = solverType;
    this.bounceType = 1;	
    this.diam = 80.0;
    // INITIALIZE s1, s2:
    var j = 0;
    for (var i = 0; i < this.partCount; i += 1, j += PART_MAXVAR){
        this.roundRand();
        row = Math.floor(i/width);
        col = i - row*width;
        this.s1[j + PART_XPOS] = 0.0 + this.offset_x;
        this.s1[j + PART_YPOS] = col * restL *5 + this.offset_y;
        this.s1[j + PART_ZPOS] = row * restL *5 + this.offset_z -0.5 ;
        this.s1[j + PART_WPOS] =  1.0;
        this.roundRand();
        this.s1[j + PART_XVEL] = this.INIT_VEL * (0.4 + 0.2*this.randX);
        this.s1[j + PART_YVEL] = this.INIT_VEL * (0.4 + 0.2*this.randY);
        this.s1[j + PART_ZVEL] = this.INIT_VEL * (0.4 + 0.2*this.randZ);
        this.s1[j + PART_MASS] = 1.0;
        this.s1[j + PART_DIAM] =  2.0 + 10*Math.random();
        this.s1[j + PART_RENDMODE] = 0.0;
        this.s1[j + PART_AGE] = 30 + 100*Math.random();

        var cDist = cameraDist(this.s1[j + PART_XPOS],this.s1[j + PART_YPOS],this.s1[j + PART_ZPOS]) 
        this.s1[j + PART_DIAM] = this.diam/(cDist + NU_EPSILON);
        this.s1[j + PART_R] = 1.0;
        this.s1[j + PART_G] = 1.0;
        this.s1[j + PART_B] = 1.0;

        this.s2.set(this.s1);
    }
    this.FSIZE = this.s1.BYTES_PER_ELEMENT;

}
PartSys.prototype.initFlocking = function(count,ka,kv,kc,rad,vel,solverType){
    this.partCount = count;
    this.s1 = new Float32Array(this.partCount * PART_MAXVAR)
    this.s2 = new Float32Array(this.partCount * PART_MAXVAR)
    this.s1dot = new Float32Array(this.partCount * PART_MAXVAR)

    fTmp = new CForcer();
    fTmp.forceType = F_BOIDS;
    fTmp.targFirst = 0;
    fTmp.targCount = -1;
    fTmp.effectRadius = rad;
    fTmp.K_avoid = ka;
    fTmp.K_vel = kv;
    fTmp.K_centering = kc;
    this.forceList.push(fTmp);

    console.log("PartSys.initBouncy3D() created PartSys.forceList[] array of ");
    console.log("\t\t", this.forceList.length, "CForcer objects:");
    for(i=0; i<this.forceList.length; i++) {
        console.log("CForceList[",i,"]");
        this.forceList[i].printMe();
        }

    cTmp = new CLimit();      // creat constraint-causing object, and
    cTmp.hitType = HIT_BOUNCE_VEL;  // set how particles 'bounce' from its surface,
    cTmp.limitType = LIM_VOL;       // confine particles inside axis-aligned
                                    // rectangular volume that
    cTmp.targFirst = 0;             // applies to ALL particles; starting at 0
    cTmp.partCount = -1;            // through all the rest of them.
    cTmp.xMin = -0.9 + this.offset_x; cTmp.xMax = 0.9 + this.offset_x;  // box extent:  +/- 1.0 box at origin
    cTmp.yMin = -0.9 + this.offset_y; cTmp.yMax = 0.9 + this.offset_y;
    cTmp.zMin = -0.9 + this.offset_z; cTmp.zMax = 0.9 + this.offset_z;
    cTmp.Kresti = 1.0;              
    this.limitList.push(cTmp);      // append this 'box' constraint object to the 
    
    
    cTmp = new CLimit();
    cTmp.limitType = LIM_ZERO;
    cTmp.targFirst = 0;
    cTmp.partCount = -1;
    this.limitList.push(cTmp);


    cTmp = new CLimit();
    cTmp.limitType = LIM_ANCHOR;
    cTmp.targFirst = 0;
    cTmp.partCount = 0;
    cTmp.anchorsList = [];
    this.limitList.push(cTmp);

    // Report:
    console.log("PartSys.initBouncy3D() created PartSys.limitList[] array of ");
    console.log("\t\t", this.limitList.length, "CLimit objects.");

    this.INIT_VEL = vel;
    this.drag = 0.8;// units-free air-drag (scales velocity); adjust by d/D keys
    this.grav = 9.832;
    this.resti = 1; 

    //--------------------------init Particle System Controls:
    this.runMode =  3;
    this.solvType = solverType;
    this.bounceType = 1;
    this.diam = 100.0;
    // INITIALIZE s1, s2:
    var j = 0;
    for (var i = 0; i < this.partCount; i += 1, j += PART_MAXVAR){
        this.roundRand();
        this.s1[j + PART_XPOS] = -0.0 + 0.1 * this.randX + this.offset_x;
        this.s1[j + PART_YPOS] = -0.0 + 0.1 * this.randY + this.offset_y;
        this.s1[j + PART_ZPOS] = -0.0 + 0.1 * this.randZ + this.offset_z;
        this.s1[j + PART_WPOS] =  1.0;
        this.roundRand();
        this.s1[j + PART_XVEL] = this.INIT_VEL * (0.4 + 0.1*this.randX);
        this.s1[j + PART_YVEL] = this.INIT_VEL * (0.4 + 0.1*this.randY);
        this.s1[j + PART_ZVEL] = this.INIT_VEL * (0.4 + 0.1*this.randZ);
        this.s1[j + PART_MASS] = 1.0;
        this.s1[j + PART_DIAM] =  2.0 + 10*Math.random();
        this.s1[j + PART_RENDMODE] = 0.0;
        this.s1[j + PART_AGE] = 30 + 100*Math.random();

        var cDist = cameraDist(this.s1[j + PART_XPOS],this.s1[j + PART_YPOS],this.s1[j + PART_ZPOS]) 
        this.s1[j + PART_DIAM] = this.diam/(cDist + NU_EPSILON);
        this.s1[j + PART_R] = 1.0;
        this.s1[j + PART_G] = 1.0;
        this.s1[j + PART_B] = 1.0;

        this.s2.set(this.s1);
    }
    this.FSIZE = this.s1.BYTES_PER_ELEMENT;
}

PartSys.prototype.initFireReeves = function(count,solverType){
    this.partCount = count;
    this.s1 = new Float32Array(this.partCount * PART_MAXVAR)
    this.s2 = new Float32Array(this.partCount * PART_MAXVAR)
    this.s1dot = new Float32Array(this.partCount * PART_MAXVAR)

// Create & init all force-causing objects------------------------------------

    fTmp = new CForcer();
    fTmp.forceType = F_WIND;
    fTmp.windPosition = new Vector3([this.offset_x,this.offset_y,this.offset_z]);
    fTmp.windStrength = 0.5;
    fTmp.windRadius = 4;
    fTmp.windDirection = new Vector3([0.0,0.0,1.0])
    fTmp.targFirst = 0;
    fTmp.targCount = -1;
    this.forceList.push(fTmp);

    // Report:
    console.log("PartSys.initBouncy3D() created PartSys.forceList[] array of ");
    console.log("\t\t", this.forceList.length, "CForcer objects:");
    for(i=0; i<this.forceList.length; i++) {
        console.log("CForceList[",i,"]");
        this.forceList[i].printMe();
        }
// Create & init all constraint-causing objects-------------------------------

    cTmp = new CLimit();
    cTmp.limitType = LIM_ZERO;
    cTmp.targFirst = 0;
    cTmp.partCount = -1;
    this.limitList.push(cTmp);

    cTmp = new CLimit();
    cTmp.limitType = LIM_NOBOUNCY;
    cTmp.xMin = -0.9 + this.offset_x; cTmp.xMax = 0.9 + this.offset_x;  // box extent:  +/- 1.0 box at origin
    cTmp.yMin = -0.9 + this.offset_y; cTmp.yMax = 0.9 + this.offset_y;
    cTmp.zMin = -0.9 + this.offset_z; cTmp.zMax = 0.9 + this.offset_z;
    cTmp.targFirst = 0;
    cTmp.partCount = -1;
    this.limitList.push(cTmp);


    // Report:
    console.log("PartSys.initBouncy3D() created PartSys.limitList[] array of ");
    console.log("\t\t", this.limitList.length, "CLimit objects.");

    this.INIT_VEL = 0;
    this.drag = 0.8;
    this.grav = 9.832;
    this.resti = 1; 

    //--------------------------init Particle System Controls:
    this.runMode =  3;
    this.solvType = solverType;
    this.bounceType = 1;	
    this.diam = 100.0;
    // INITIALIZE s1, s2:
    var j = 0;
    for (var i = 0; i < this.partCount; i += 1, j += PART_MAXVAR){
        this.roundRand();
        this.s1[j + PART_XPOS] = -0.0 + 0.2 * this.randX + this.offset_x;
        this.s1[j + PART_YPOS] = -0.0 + 0.2 * this.randY + this.offset_y;
        this.s1[j + PART_ZPOS] = -1.0 + 0.2 * this.randZ + this.offset_z;
        this.s1[j + PART_WPOS] =  1.0;
        this.roundRand();
        this.s1[j + PART_XVEL] = this.INIT_VEL * (0.4 + 0.1*this.randX);
        this.s1[j + PART_YVEL] = this.INIT_VEL * (0.4 + 0.1*this.randY);
        this.s1[j + PART_ZVEL] = this.INIT_VEL * (0.4 + 0.1*this.randZ);
        this.s1[j + PART_MASS] = 1.0;
        this.s1[j + PART_DIAM] =  2.0 + 10*Math.random();
        this.s1[j + PART_RENDMODE] = 0.0;
        this.s1[j + PART_AGE] = 10;
        this.s1[j + PART_R] = 1.0;
        this.s1[j + PART_G] = 0.65;
        this.s1[j + PART_B] = 1.0;

        var cDist = cameraDist(this.s1[j + PART_XPOS],this.s1[j + PART_YPOS],this.s1[j + PART_ZPOS]) 
        this.s1[j + PART_DIAM] = this.diam/(cDist + NU_EPSILON);

        this.s2.set(this.s1);
    }
    this.FSIZE = this.s1.BYTES_PER_ELEMENT;
    
}

PartSys.prototype.applyForces = function(s,fList){
    var j = 0;
    for (var i = 0; i < this.partCount; i += 1, j += PART_MAXVAR){
        s[j + PART_X_FTOT] = 0.0
        s[j + PART_Y_FTOT] = 0.0
        s[j + PART_Z_FTOT] = 0.0
    }
    for (var k = 0; k < fList.length; k++){
        if (fList[k].forceType <= 0){
            continue;
        }
        var m = fList[k].targFirst;
        var mmax = this.partCount;

        if(fList[k].targCount ==0){
            m=mmax=0;
        }
        else if(fList[k].targCount > 0){
            var tmp = fList[k].targCount;
            if(tmp<mmax) mmax = tmp;
            else console.log("\n\n!!PartSys.applyForces() index error!!\n\n");
        }

            switch(fList[k].forceType){
                case F_MOUSE:
                    onsole.log("PartSys.applyForces(), fList[",k,"].forceType:",
                                    fList[k].forceType, "NOT YET IMPLEMENTED!!");
                    break;
                case F_GRAV_E:
                    var j = m*PART_MAXVAR;
                    for(;m<mmax;m++,j+=PART_MAXVAR){
                        s[j+PART_X_FTOT] += s[j+PART_MASS] * fList[k].gravConst * fList[k].downDir.elements[0];
                        s[j+PART_Y_FTOT] += s[j+PART_MASS] * fList[k].gravConst * fList[k].downDir.elements[1];
                        s[j+PART_Z_FTOT] += s[j+PART_MASS] * fList[k].gravConst * fList[k].downDir.elements[2];
                    }
                    break;
                case F_GRAV_P:    
                    console.log("PartSys.applyForces(), fList[",k,"].forceType:",
                                            fList[k].forceType, "NOT YET IMPLEMENTED!!");
                    break;
                case F_WIND:      
                    var j = m*PART_MAXVAR;
                    for(;m<mmax;m++,j+=PART_MAXVAR){
                        var partPoint = new Vector3([s[j+PART_XPOS],s[j+PART_YPOS],s[j+PART_ZPOS]]);
                        res = pointsDist(partPoint,fList[k].windPosition);
                        var dist = res[1];
                        var effectRatio = fList[k].windRadius / (dist + 0.1);
                        if (dist <= fList[k].windRadius){
                            s[j+PART_X_FTOT] += fList[k].windDirection.elements[0] * (0.5*Math.random()+fList[k].windStrength) * effectRatio;
                            s[j+PART_Y_FTOT] += fList[k].windDirection.elements[1] * (0.5*Math.random()+fList[k].windStrength) * effectRatio;
                            s[j+PART_Z_FTOT] += fList[k].windDirection.elements[2] * (0.5*Math.random()+fList[k].windStrength) * effectRatio;
                        }
                    }
                    break;
                case F_BUBBLE:   
                    var j = m*PART_MAXVAR;
                    for(;m<mmax;m++,j+=PART_MAXVAR){
                        var partPoint = new Vector3([s[j+PART_XPOS],s[j+PART_YPOS],s[j+PART_ZPOS]]);
                        res = pointsDist(fList[k].bub_ctr,partPoint);
                        if(res[1] > fList[k].bub_radius){
                            stretch = Math.pow((res[1] - fList[k].bub_radius),2);
                            mag = stretch * fList[k].bub_force;
                            s[j+PART_X_FTOT] += res[0].elements[0] * mag;
                            s[j+PART_Y_FTOT] += res[0].elements[1] * mag;
                            s[j+PART_Z_FTOT] += res[0].elements[2] * mag;
                        }
                    }
                    break;
                case F_DRAG:    
                    var j = m*PART_MAXVAR; 
                    for(; m<mmax; m++, j+=PART_MAXVAR) { 
                        s[j + PART_X_FTOT] -= fList[k].K_drag * s[j + PART_XVEL];
                        s[j + PART_Y_FTOT] -= fList[k].K_drag * s[j + PART_YVEL];
                        s[j + PART_Z_FTOT] -= fList[k].K_drag * s[j + PART_ZVEL];
                    }
                    break;
                case F_SPRING:
                    var e1 = fList[k].e1;
                    var e2 = fList[k].e2;
                    var point1 = new Vector3([s[e1*PART_MAXVAR + PART_XPOS],s[e1*PART_MAXVAR + PART_YPOS],s[e1*PART_MAXVAR + PART_ZPOS]]);
                    var point2 = new Vector3([s[e2*PART_MAXVAR + PART_XPOS],s[e2*PART_MAXVAR + PART_YPOS],s[e2*PART_MAXVAR + PART_ZPOS]]);
                    res = pointsDist(point2,point1);
                    sub = res[0];
                    endDist = res[1];
                    dir = res[2];
                    var stretch = endDist - fList[k].K_restLength;
                    var mag = stretch * fList[k].K_spring;
                    normX = dir.elements[0];
                    normY = dir.elements[1]; 
                    normZ = dir.elements[2];
                    s[e1*PART_MAXVAR + PART_X_FTOT] += mag * normX;
                    s[e1*PART_MAXVAR + PART_Y_FTOT] += mag * normY;
                    s[e1*PART_MAXVAR + PART_Z_FTOT] += mag * normZ;

                    s[e2*PART_MAXVAR + PART_X_FTOT] -= mag * normX;
                    s[e2*PART_MAXVAR + PART_Y_FTOT] -= mag * normY;
                    s[e2*PART_MAXVAR + PART_Z_FTOT] -= mag * normZ;

                    // add damping
                    var netXVel = s[e2*PART_MAXVAR + PART_XVEL] - s[e1*PART_MAXVAR + PART_XVEL];
                    var netYVel = s[e2*PART_MAXVAR + PART_YVEL] - s[e1*PART_MAXVAR + PART_YVEL];
                    var netZVel = s[e2*PART_MAXVAR + PART_ZVEL] - s[e1*PART_MAXVAR + PART_ZVEL];

                    magD = netXVel * normX + netYVel * normY + netZVel * normZ;
                    magD *= fList[k].K_springDamp;
                    s[e1*PART_MAXVAR + PART_X_FTOT] += magD * normX;
                    s[e1*PART_MAXVAR + PART_Y_FTOT] += magD * normY;
                    s[e1*PART_MAXVAR + PART_Z_FTOT] += magD * normZ;

                    s[e2*PART_MAXVAR + PART_X_FTOT] -= magD * normX;
                    s[e2*PART_MAXVAR + PART_Y_FTOT] -= magD * normY;
                    s[e2*PART_MAXVAR + PART_Z_FTOT] -= magD * normZ;

                    break;
                case F_SPRINGSET:
                    console.log("PartSys.applyForces(), fList[",k,"].forceType:",
                                            fList[k].forceType, "NOT YET IMPLEMENTED!!");
                    break;
                case F_CHARGE:
                    console.log("PartSys.applyForces(), fList[",k,"].forceType:",
                                            fList[k].forceType, "NOT YET IMPLEMENTED!!");
                    break;

                case F_FRIC:
                    var j = m*PART_MAXVAR;
                    for(; m<mmax; m++, j+=PART_MAXVAR){
                        if ((s[j + PART_ZPOS]-(-0.9)) < NU_EPSILON){
                        if (s[j + PART_XVEL] == 0){
                            s[j + PART_X_FTOT] = Math.max(0,s[j + PART_X_FTOT]-fList[k].d_fric*Math.abs(s[j + PART_Z_FTOT]))}
                        else{
                            s[j + PART_X_FTOT] += fList[k].d_fric* Math.abs(s[j + PART_Z_FTOT])*(-1*Math.sign(s[j + PART_XVEL]))
                        }
                        if (s[j + PART_YVEL] == 0){
                            s[j + PART_Y_FTOT] = Math.max(0,s[j + PART_Y_FTOT]-fList[k].d_fric*Math.abs(s[j + PART_Z_FTOT]))}
                        else{
                            s[j + PART_Y_FTOT] += fList[k].d_fric* Math.abs(s[j + PART_Z_FTOT])*(-1*Math.sign(s[j + PART_YVEL]))
                        }
                    }
                }
                    break;
                case F_BOIDS:
                    var j = m*PART_MAXVAR;
                    var n = m*PART_MAXVAR;
                    for (var i = 0; i < this.partCount; i++, j+=PART_MAXVAR){
                        var curPoint = new Vector3([s[j+PART_XPOS],s[j+PART_YPOS],s[j+PART_ZPOS]])

                        for (var t = i; t<this.partCount; t++, n+=PART_MAXVAR){
                            var effectPoint = new Vector3([s[n+PART_XPOS],s[n+PART_YPOS],s[n+PART_ZPOS]])
                            res = pointsDist(effectPoint,curPoint);
                            sub = res[0];
                            dist = res[1];
                            dir = res[2];
                            if (dist <= fList[k].effectRadius){
                            // Collision avoidance
                                s[j+PART_X_FTOT] -= (fList[k].K_avoid * dir.elements[0] / dist) * s[j+PART_MASS];
                                s[j+PART_Y_FTOT] -= (fList[k].K_avoid * dir.elements[1] / dist) * s[j+PART_MASS];
                                s[j+PART_Z_FTOT] -= (fList[k].K_avoid * dir.elements[2] / dist) * s[j+PART_MASS];
                                s[n+PART_X_FTOT] -= (fList[k].K_avoid * dir.elements[0] / dist) * s[n+PART_MASS];
                                s[n+PART_Y_FTOT] -= (fList[k].K_avoid * dir.elements[1] / dist) * s[n+PART_MASS];
                                s[n+PART_Z_FTOT] -= (fList[k].K_avoid * dir.elements[2] / dist) * s[n+PART_MASS];
                        }
                    }
                }
                    break;
                default:
                    console.log("!!!ApplyForces() fList[",k,"] invalid forceType:", fList[k].forceType);
                break;
            }
        }
    }
PartSys.prototype.solver = function(){
    switch(this.solvType){
        case SOLV_EULER:
            for (var n = 0; n < this.s1.length; n++){
                this.s2[n] = this.s1[n] + this.s1dot[n] * (g_timeStep * 0.001);
            }
        break;
        case SOLV_OLDGOOD:
            var j = 0;
            for (var i = 0; i < this.partCount; i+=1, j+= PART_MAXVAR){
                this.s2[j + PART_YVEL] -= this.grav*(g_timeStep*0.001);
                this.s2[j + PART_XVEL] *= this.drag;
                this.s2[j + PART_YVEL] *= this.drag;
                this.s2[j + PART_ZVEL] *= this.drag;

                this.s2[j + PART_XPOS] += this.s2[j + PART_XVEL] * (g_timeStep * 0.001)
                this.s2[j + PART_YPOS] += this.s2[j + PART_YVEL] * (g_timeStep * 0.001)
                this.s2[j + PART_ZPOS] += this.s2[j + PART_ZVEL] * (g_timeStep * 0.001)
            }
        break;
        case SOLV_MIDPOINT:         // Midpoint Method (see lecture notes)
            var sM = new Float32Array(this.partCount * PART_MAXVAR);
            var sMdot = new Float32Array(this.partCount * PART_MAXVAR);

            for (var n = 0; n < this.s1.length; n++) {
                sM[n] = this.s1[n] + this.s1dot[n] * (g_timeStep * 0.001 * 0.5);
            }

            this.dotFinder(sMdot, sM);

            for (var n = 0; n < this.s1.length; n++) {
                this.s2[n] = this.s1[n] + sMdot[n] * (g_timeStep * 0.001)
            }

        break;
        case SOLV_BACK_EULER:       // 'Backwind' or Implicit Euler
             var sErr = new Float32Array(this.partCount * PART_MAXVAR);
             var s2Intermediate = new Float32Array(this.partCount * PART_MAXVAR);
             var s2IntermediateDot = new Float32Array(this.partCount * PART_MAXVAR);

            for (var n = 0; n < this.s1.length; n++) {
                s2Intermediate[n] = this.s1[n] + this.s1dot[n] * (g_timeStep * 0.001)
            }

            this.dotFinder(s2IntermediateDot, s2Intermediate);

            for (var n = 0; n < this.s1.length; n++) {
                sErr[n] = (s2IntermediateDot[n] - this.s1dot[n]) * g_timeStep * 0.001;
            }

            for (var n = 0; n < this.s1.length; n++) {
                this.s2[n] = s2Intermediate[n] + sErr[n] * g_timeStep * 0.001;
            }

            break;
        case  SOLV_BACK_MIDPT:      // 'Backwind' or Implicit Midpoint
            var sErr = new Float32Array(this.partCount * PART_MAXVAR);
            var s2Intermediate = new Float32Array(this.partCount * PART_MAXVAR);
            var s2IntermediateDot = new Float32Array(this.partCount * PART_MAXVAR);
            var sM = new Float32Array(this.partCount * PART_MAXVAR);
            var sMdot = new Float32Array(this.partCount * PART_MAXVAR);
            var s3 = new Float32Array(this.partCount * PART_MAXVAR);

            for (var n = 0; n < this.s1.length; n++) {
                s2Intermediate[n] = this.s1[n] + this.s1dot[n] * (g_timeStep * 0.001)
            }

            this.dotFinder(s2IntermediateDot, s2Intermediate);

            for (var n = 0; n < s2Intermediate.length; n++) {
                sM[n] = s2Intermediate[n] - s2IntermediateDot[n] * g_timeStep * 0.001 * 0.5;
            }

            this.dotFinder(sMdot, sM);

            for (var n = 0; n < s2Intermediate.length; n++) {
                s3[n] = s2Intermediate[n] - sMdot[n] * g_timeStep * 0.001;
            }

            for (var n = 0; n < s2Intermediate.length; n++) {
                sErr[n] = s3[n] - this.s1[n];
            }

            for (var n = 0; n < s2Intermediate.length; n++) {
                this.s2[n] = s2Intermediate[n] - (sErr[n] * 0.5);
            }
        break;
        case SOLV_BACK_ADBASH:     
            console.log('NOT YET IMPLEMENTED: this.solvType==' + this.solvType);
        break;
        case SOLV_VERLET:        
            console.log('NOT YET IMPLEMENTED: this.solvType==' + this.solvType);
        break;
        case SOLV_VEL_VERLET:     
            console.log('NOT YET IMPLEMENTED: this.solvType==' + this.solvType);
        break;
        default:
            console.log('?!?! unknown solver: this.solvType==' + this.solvType);
        break;
            }
		return;
}

PartSys.prototype.dotFinder = function(s1dot,s1){
    var invMass;
    var j = 0;
    for(var i = 0; i < this.partCount; i += 1, j += PART_MAXVAR){
        s1dot[j + PART_XPOS]     = s1[j + PART_XVEL];
        s1dot[j + PART_YPOS]     = s1[j + PART_YVEL];
        s1dot[j + PART_ZPOS]     = s1[j + PART_ZVEL];
        s1dot[j + PART_WPOS]     = 0.0;
        invMass                  = 1.0 / s1[j + PART_MASS];
        s1dot[j + PART_XVEL]     = s1[j + PART_X_FTOT] * invMass;
        s1dot[j + PART_YVEL]     = s1[j + PART_Y_FTOT] * invMass;
        s1dot[j + PART_ZVEL]     = s1[j + PART_Z_FTOT] * invMass;
        s1dot[j + PART_X_FTOT]   = 0.0;
        s1dot[j + PART_Y_FTOT]   = 0.0;
        s1dot[j + PART_Z_FTOT]   = 0.0;
        s1dot[j + PART_R]        = 0.0;
        s1dot[j + PART_G]        = 0.0;
        s1dot[j + PART_B]        = 0.0;
        s1dot[j + PART_MASS]     = 0.0;
        s1dot[j + PART_DIAM]     = 0.0;
        s1dot[j + PART_RENDMODE] = 0.0;
        s1dot[j + PART_AGE]      = 0.0;
    }
}
PartSys.prototype.render = function(s){
    gl.bufferSubData(
        gl.ARRAY_BUFFER,
        0,
        this.s1
    );
    gl.uniform1i(this.u_runModeID, this.runMode);
    gl.drawArrays( gl.POINTS, 0, this.partCount);

}
PartSys.prototype.doConstraints = function(sNow, sNext, cList) {
      for(var k = 0; k < cList.length; k++) {  // for every CLimit in cList array,
    //    console.log("cList[k].limitType:", cList[k].limitType);
        if(cList[k].limitType <=0) {     //.................Invalid limit? SKIP IT!
                            // if limitType is LIM_NONE or if limitType was
          continue;         // negated to (temporarily) disable the CLimit object,
          }                 // skip this k-th object in the cList[] array.
        var m = cList[k].targFirst;    // first targed particle # in the state vars
        var mmax = this.partCount;    // total number of particles in the state vars
                                      // (last particle number we access is mmax-1)
        if(cList[k].targCount==0){    // ! Apply CLimit to e1,e2 particles only!
          m=mmax=0;   // don't let loop run; apply CLimit to e1,e2 particles only.
          }
        else if(cList[k].targCount > 0) {   // ?did CLimit say HOW MANY particles?
          // YES! limit applies to 'targCount' particles starting with particle # m:
          var tmp = cList[k].targCount;
          if(tmp < mmax) mmax = tmp; // (but MAKE SURE mmax doesn't get larger)
          else console.log("\n\n!!PartSys.doConstraints() index error!!\n\n");
          }
          //console.log("m:",m,"mmax:",mmax);
          // m and mmax are now correctly initialized; use them!
        //......................................Apply limit specified by limitType
        switch(cList[k].limitType) {    // what kind of limit should we apply?
            case LIM_VOL:     // The axis-aligned rectangular volume specified by
                            // cList[k].xMin,xMax,yMin,yMax,zMin,zMax keeps
                            // particles INSIDE if xMin<xMax, yMin<yMax, zMin<zMax
                            //      and OUTSIDE if xMin>xMax, yMin>yMax, zMin>xMax.
            var j = m*PART_MAXVAR;  // state var array index for particle # m

            for (; m < mmax; m++ , j += PART_MAXVAR) {
                if (sNext[j + PART_XPOS] < cList[k].xMin) {
                    sNext[j + PART_XPOS] = cList[k].xMin;
                    sNext[j + PART_XVEL] = sNow[j + PART_XVEL];
                    sNext[j + PART_XVEL] *= this.drag;
                    if (sNext[j + PART_XVEL] < 0.0)
                        sNext[j + PART_XVEL] = -cList[k].K_resti * sNext[j + PART_XVEL]; // need sign change--bounce!
                    else
                        sNext[j + PART_XVEL] = cList[k].K_resti * sNext[j + PART_XVEL]; // sign changed-- don't need another.
                }
                else if (sNext[j + PART_XPOS] > cList[k].xMax) { // && this.s2[j + PART_XVEL] > 0.0) {
                    // collision!
                    sNext[j + PART_XPOS] = cList[k].xMax; // 1) resolve contact: put particle at wall.
                    sNext[j + PART_XVEL] = sNow[j + PART_XVEL];	// 2a) undo velocity change:
                    sNext[j + PART_XVEL] *= this.drag;			        // 2b) apply drag:
                // 3) BOUNCE:  reversed velocity*coeff-of-restitution.
                // ATTENTION! VERY SUBTLE PROBLEM HERE!
                // need a velocity-sign test here that ensures the 'bounce' step will
                    // always send the ball outwards, away from its wall or floor collision.
                    if (sNext[j + PART_XVEL] > 0.0)
                        sNext[j + PART_XVEL] = -cList[k].K_resti * sNext[j + PART_XVEL]; // need sign change--bounce!
                    else
                        sNext[j + PART_XVEL] = cList[k].K_resti * sNext[j + PART_XVEL];	// sign changed-- don't need another.
            }
                //--------  floor (-Y) wall  --------------------------------------------
                if (sNext[j + PART_YPOS] < cList[k].yMin) { // && this.s2[j + PART_YVEL] < 0.0) {
                    // collision! floor...
                    sNext[j + PART_YPOS] = cList[k].yMin;// 1) resolve contact: put particle at wall.
                    sNext[j + PART_YVEL] = sNow[j + PART_YVEL];	// 2a) undo velocity change:
                    sNext[j + PART_YVEL] *= this.drag;		          // 2b) apply drag:

                    if (sNext[j + PART_YVEL] < 0.0)
                        sNext[j + PART_YVEL] = -cList[k].K_resti * sNext[j + PART_YVEL]; // need sign change--bounce!
                    else
                        sNext[j + PART_YVEL] = cList[k].K_resti * sNext[j + PART_YVEL];	// sign changed-- don't need another.
            }
                //--------  ceiling (+Y) wall  ------------------------------------------
                else if (sNext[j + PART_YPOS] > cList[k].yMax) { // && sNext[j + PART_YVEL] > 0.0) {
                // collision! ceiling...
                    sNext[j + PART_YPOS] = cList[k].yMax;// 1) resolve contact: put particle at wall.
                    sNext[j + PART_YVEL] = this.s1[j + PART_YVEL];	// 2a) undo velocity change:
                    sNext[j + PART_YVEL] *= this.drag;			        // 2b) apply drag:
                if (sNext[j + PART_YVEL] > 0.0)
                    sNext[j + PART_YVEL] = -cList[k].K_resti * sNext[j + PART_YVEL]; // need sign change--bounce!
                else
                    sNext[j + PART_YVEL] = cList[k].K_resti * sNext[j + PART_YVEL];	// sign changed-- don't need another.
            }
                //--------  near (-Z) wall  ---------------------------------------------
                if (sNext[j + PART_ZPOS] < cList[k].zMin) { // && sNext[j + PART_ZVEL] < 0.0 ) {
                // collision!
                    sNext[j + PART_ZPOS] = cList[k].zMin;// 1) resolve contact: put particle at wall.
                    sNext[j + PART_ZVEL] = sNow[j + PART_ZVEL];  // 2a) undo velocity change:
                    sNext[j + PART_ZVEL] *= this.drag;			        // 2b) apply drag:
                if (sNext[j + PART_ZVEL] < 0.0)
                    sNext[j + PART_ZVEL] = -cList[k].K_resti * sNext[j + PART_ZVEL]; // need sign change--bounce!
                else
                    sNext[j + PART_ZVEL] = cList[k].K_resti * sNext[j + PART_ZVEL];	// sign changed-- don't need another.
            }
            //--------  far (+Z) wall  ----------------------------------------------
                else if (sNext[j + PART_ZPOS] > cList[k].zMax) { // && sNext[j + PART_ZVEL] > 0.0) {
                // collision!
                    sNext[j + PART_ZPOS] = cList[k].zMax; // 1) resolve contact: put particle at wall.
                    sNext[j + PART_ZVEL] = sNow[j + PART_ZVEL];  // 2a) undo velocity change:
                    sNext[j + PART_ZVEL] *= this.drag;			        // 2b) apply drag:

                if (sNext[j + PART_ZVEL] > 0.0)
                    sNext[j + PART_ZVEL] = -cList[k].K_resti * sNext[j + PART_ZVEL]; // need sign change--bounce!
                else
                    sNext[j + PART_ZVEL] = cList[k].K_resti * sNext[j + PART_ZVEL];	// sign changed-- don't need another.
            } // end of (+Z) wall constraint
            }
                break;
            case LIM_ZERO:
                var j = m * PART_MAXVAR;
                for (; m < mmax; m++ , j += PART_MAXVAR){
                    if((sNext[j + PART_XVEL]*sNow[j + PART_XVEL] < 0) && Math.abs(sNext[j + PART_XVEL]) < cList[k].minvel ){
                        //console.log('XXXXXXX')
                        sNext[j + PART_XVEL] = 0;
                    }
                    if((sNext[j + PART_YVEL]*sNow[j + PART_YVEL] < 0) && Math.abs(sNext[j + PART_YVEL]) < cList[k].minvel ){
                        //console.log('YYYYY')
                        sNext[j + PART_YVEL] = 0;
                    }
                    if((sNext[j + PART_ZVEL]*sNow[j + PART_ZVEL] < 0) && Math.abs(sNext[j + PART_ZVEL]) < cList[k].minvel ){
                        //console.log('ZZZZZZ')
                        sNext[j + PART_ZVEL] = 0;
                    }
                }
            break;

            case LIM_WALL:    // 2-sided wall: rectangular, axis-aligned, flat/2D,
                        // zero thickness, any desired size & position

                break;
            case LIM_DISC:    // 2-sided ellipsoidal wall, axis-aligned, flat/2D,
                            // zero thickness, any desired size & position
                break;
            case LIM_BOX:
                break;
            case LIM_MAT_WALL:
                break;
            case LIM_MAT_DISC:
                break;
            case LIM_MAT_BALL:
                break;
            case LIM_ANCHOR:
                for(var i = 0;i < cList[k].anchorsList.length;i++){
                    var j = cList[k].anchorsList[i]*PART_MAXVAR;
                    sNext[j + PART_XPOS] = sNow[j + PART_XPOS];
                    sNext[j + PART_YPOS] = sNow[j + PART_YPOS];
                    sNext[j + PART_ZPOS] = sNow[j + PART_ZPOS];
                    sNext[j + PART_XVEL] = 0.0;
                    sNext[j + PART_YVEL] = 0.0;
                    sNext[j + PART_ZVEL] = 0.0;
                }
                break;
            case LIM_SLOT:
                break;
            case LIM_ROD:
                break;
            case LIM_ROPE:
                break;
            case LIM_RADIUS:
                break;
            case LIM_PULLEY:
                break;
            case LIM_NOBOUNCY:
                var j = m*PART_MAXVAR;  // state var array index for particle # m

                for (; m < mmax; m++ , j += PART_MAXVAR) {
                    if (sNext[j + PART_XPOS] <= cList[k].xMin) {
                        sNext[j + PART_XPOS] = cList[k].xMin;
                        sNext[j + PART_XVEL] = 0;
                    }
                    else if (sNext[j + PART_XPOS] >= cList[k].xMax) { // && this.s2[j + PART_XVEL] > 0.0) {
                        // collision!
                        sNext[j + PART_XPOS] = cList[k].xMax; // 1) resolve contact: put particle at wall.
                        sNext[j + PART_XVEL] = 0;	// 2a) undo velocity change:
                    }
                    //--------  floor (-Y) wall  --------------------------------------------
                    if (sNext[j + PART_YPOS] <= cList[k].yMin) { // && this.s2[j + PART_YVEL] < 0.0) {
                        // collision! floor...
                        sNext[j + PART_YPOS] = cList[k].yMin;// 1) resolve contact: put particle at wall.
                        
                        sNext[j + PART_YVEL] = 0;	// 2a) undo velocity change:
                        
                    }
                    //--------  ceiling (+Y) wall  ------------------------------------------
                    else if (sNext[j + PART_YPOS] >= cList[k].yMax) { // && sNext[j + PART_YVEL] > 0.0) {
                    // collision! ceiling...
                        sNext[j + PART_YPOS] = cList[k].yMax;// 1) resolve contact: put particle at wall.
                        
                        sNext[j + PART_YVEL] = 0;	// 2a) undo velocity change:
                        
                }
                    //--------  near (-Z) wall  ---------------------------------------------
                    if (sNext[j + PART_ZPOS] <= cList[k].zMin) { // && sNext[j + PART_ZVEL] < 0.0 ) {
                    // collision!
                        sNext[j + PART_ZPOS] = cList[k].zMin;// 1) resolve contact: put particle at wall.
                        
                        sNext[j + PART_ZVEL] = 0;  // 2a) undo velocity change:
                }
                //--------  far (+Z) wall  ----------------------------------------------
                    else if (sNext[j + PART_ZPOS] >= cList[k].zMax) { // && sNext[j + PART_ZVEL] > 0.0) {
                    // collision!
                        sNext[j + PART_ZPOS] = cList[k].zMax; // 1) resolve contact: put particle at wall.
                        
                        sNext[j + PART_ZVEL] = 0;  // 2a) undo velocity change:
                } // end of (+Z) wall constraint
                
            }
                break;
            default:
                console.log("!!!doConstraints() cList[", k, "] invalid limitType:", cList[k].limitType);
                break;
        } // switch(cList[k].limitType) ebd
      } // for(k=0...) end
    }
PartSys.prototype.swap = function(){
this.s1.set(this.s2)
}

PartSys.prototype.vboInit = function(){
// a) Compile,link,upload shaders-----------------------------------------------
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc){
        console.log(this.constructor.name +
            '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
        }
    gl.program = this.shaderLoc;
// b) Create VBO on GPU, fill it------------------------------------------------
    this.vboLoc = gl.createBuffer();
    if (!this.vboLoc) {
        console.log(this.constructor.name +
    						'.init() failed to create VBO in GPU. Bye!');
    return -1;
  }
    gl.useProgram(this.shaderLoc);
// Specify the purpose of our newly-created VBO on the GPU.
    gl.bindBuffer(gl.ARRAY_BUFFER,this.vboLoc);
// Fill the GPU's newly-created VBO object with the vertex data we stored in
//  our 'vboContents' member (JavaScript Float32Array object).
    gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
    this.s1, 		// JavaScript Float32Array
    gl.DYNAMIC_DRAW);			// Usage hint.

    this.a_PosLoc = gl.getAttribLocation(this.shaderLoc,'a_Position')
    if(this.a_PosLoc < 0) {
        console.log(this.constructor.name +
                                '.init() Failed to get GPU location of attribute a_PosLoc');
        return -1;	// error exit.
    }

    this.a_SizeLoc = gl.getAttribLocation(this.shaderLoc,'a_Size');
    if (this.a_SizeID < 0) {
        console.log('PartSys.init() Failed to get the storage location of a_Size');
        return -1;
    }

    this.a_ColorLoc = gl.getAttribLocation(this.shaderLoc,'a_Color');
    if (this.a_ColorLoc < 0) {
        console.log('PartSys.init() Failed to get the storage location of a_Color');
        return -1;
    }

    this.u_runModeID = gl.getUniformLocation(gl.program, 'u_runMode');
    if(!this.u_runModeID) {
        console.log('PartSys.init() Failed to get u_runMode variable location');
  	return;
    }

    this.u_ModelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat');
    if (!this.u_ModelMatLoc) {
        console.log(this.constructor.name + 
                                '.init() failed to get GPU location for u_ModelMatrix uniform');
    return;

  }
  console.log('VBO box init');

}

PartSys.prototype.switchToMe = function(){
// a) select our shader program:
    gl.useProgram(this.shaderLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER,this.vboLoc)
    gl.vertexAttribPointer(
        this.a_PosLoc,
        4,
        gl.FLOAT,
        false,
        PART_MAXVAR * this.FSIZE,
        PART_XPOS * this.FSIZE
    );
    gl.enableVertexAttribArray(this.a_PosLoc);

    gl.vertexAttribPointer(
        this.a_SizeLoc, 
        1, 
        gl.FLOAT, 
        false, 
        PART_MAXVAR * this.FSIZE, 
        PART_DIAM * this.FSIZE
    );
    gl.enableVertexAttribArray(this.a_SizeLoc);

    gl.vertexAttribPointer(
        this.a_ColorLoc,
        3,
        gl.FLOAT,
        false,
        PART_MAXVAR * this.FSIZE,
        PART_R * this.FSIZE
    );
    gl.enableVertexAttribArray(this.a_ColorLoc);

    gl.uniform1i(this.u_runModeID, this.runMode);
}

PartSys.prototype.isReady = function(){
    var isOK = true;
    if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
        console.log(this.constructor.name +
                                '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
      }
      if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
          console.log(this.constructor.name +
                              '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
      }
      return isOK;

}
PartSys.prototype.adjust = function(flame){
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name +
  						'.adjust() call you needed to call this.switchToMe()!!');
    }
    this.ModelMat.setIdentity();
    this.ModelMat.set(camMatrix);	// use our global, shared camera.
    gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										this.ModelMat.elements);	// send data from Javascript.
    for (var i = 0, j = 0; i < this.partCount; i+=1, j+= PART_MAXVAR){
        cDist = cameraDist(this.s1[j + PART_XPOS],this.s1[j + PART_YPOS],this.s1[j + PART_ZPOS]) 
        //console.log(cDist);
        this.s1[j + PART_DIAM] = this.diam/(cDist + NU_EPSILON);
    }

    if(flame){
        for(var i = 0, j = 0; i < this.partCount; i++, j+= PART_MAXVAR){
            this.s1[j+PART_AGE] -= 1;
            this.s1[j+PART_DIAM] *= 0.8;
            this.s1[j+PART_MASS] *= 0.9;
            this.s1[j+PART_R] *= 0.99;
            this.s1[j+PART_G] *= 0.94;
            this.s1[j+PART_B] *= 0;
            //console.log(this.s1[j+PART_AGE])
            
            if (this.s1[j + PART_AGE] <= 0){
                this.s1[j + PART_XPOS] = -0.0 + 0.2 * this.randX + this.offset_x;
                this.s1[j + PART_YPOS] = -0.0 + 0.2 * this.randY + this.offset_y;
                this.s1[j + PART_ZPOS] = -0.8 + 0.2 * this.randZ + this.offset_z;
                this.s1[j + PART_WPOS] = 1.0;      // position 'w' coordinate;
                this.roundRand(); // Now choose random initial velocities too:
                this.s1[j + PART_XVEL] = this.INIT_VEL * (0.0 + 0.2 * this.randX) * 0.5;
                this.s1[j + PART_YVEL] = this.INIT_VEL * (0.5 + 0.2 * this.randY) * 0.6;
                this.s1[j + PART_ZVEL] = this.INIT_VEL * (0.0 + 0.2 * this.randZ) * 0.5;
                this.s1[j + PART_MASS] = 0.2;      // mass, in kg.
                var cDist = cameraDist(this.s1[j + PART_XPOS],this.s1[j + PART_YPOS],this.s1[j + PART_ZPOS]) 
                this.s1[j + PART_DIAM] = this.diam/(cDist + NU_EPSILON);
                this.s1[j + PART_RENDMODE] = 0.0;
                
                this.s1[j + PART_R] = 1 + Math.random() * 0.1;
                this.s1[j + PART_G] = 1 + Math.random() * 0.1;
                this.s1[j + PART_B] = 0.1;
                this.s1[j + PART_AGE] = 8 + 10 * Math.random();
                
            }
            
        }
    }

}

function pointsDist(point1, point2){
    /*
    point1 - point2. Return [sub,dist,dir].
    */
    var sub = new Vector3([point1.elements[0] - point2.elements[0],point1.elements[1] - point2.elements[1],point1.elements[2] - point2.elements[2]])
    var distance = Math.sqrt(Math.pow(sub.elements[0],2) + Math.pow(sub.elements[1],2) + Math.pow(sub.elements[2],2));
    var dir = new Vector3([sub.elements[0]/(distance+NU_EPSILON),sub.elements[1]/(distance+NU_EPSILON),sub.elements[2]/(distance+NU_EPSILON)])
    return [sub, distance, dir]
}

function cameraDist(x,y,z){
    var distance = Math.sqrt(Math.pow(g_EyeX - x,2) + Math.pow(g_EyeY - y,2) + Math.pow(g_EyeZ - z,2))
    return distance
}