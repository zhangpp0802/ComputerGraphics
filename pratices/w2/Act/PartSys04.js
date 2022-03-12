//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)

// Set 'tab' to 2 spaces (for best on-screen appearance)

/*=================
  PartSys Library
===================
Prototype object that contains one complete particle system, including:
 -- state-variables s1, s2, & more that each describe a complete set of 
  particles at a fixed instant in time. Each state-var is a Float32Array that 
  hold the parameters of this.partCount particles (defined by constructor).
 -- Each particle is an identical sequence of floating-point parameters defined 
  by the extensible set of array-index names defined as constants near the top 
  of this file.  For example: PART_XPOS for x-coordinate of position, PART_YPOS 
  for particle's y-coord, and finally PART_MAXVAL defines total # of parameters.
  To access parameter PART_YVEL of the 17th particle in state var s1, use:
  this.s1[PART_YVEL + 17*PART_MAXVAL].
 -- A collection of 'forcer' objects (see CForcer prototype below),
 -- A collection of 'constraint' objects (see CLimit prototype below),
 -- Particle-system computing functions described in class notes: init(), run(),
  applyAllForces(), doConstraints(), render(), swap(), etc.
 
 HOW TO USE:
 ---------------
 a) Be sure your WebGL rendering context is available as the global var 'gl'.
 b) Create a global variable for each independent particle system:
  e.g.    g_PartA = new PartSys(500);   // 500-particle fire-like system 
          g_partB = new PartSys(32);    //  32-particle spring-mass system
          g_partC = new PartSys(1024);  // 1024-particle smoke-like system
          ...
 c) Modify each particle-system as needed to get desired results:
    g_PartA.init(3);  g_PartA.solvType = SOLV_ADAMS_BASHFORTH; etc...
 d) Be sure your program's animation method (e.g. 'tick()') calls the 'render()'
    function of each particle system.
*/


// Array-name consts for State-variables.  
/*------------------------------------------------------------------------------
     Each state-variable is a Float32Array object that holds 'this.partCount' 
particles. For each particle the state var holds exactly PART_MAXVAR elements 
(aka the 'parameters' of the particle) arranged in the sequence given by these 
array-name consts below.  
     For example, the state-variable object 'this.s1' is a Float32Array that 
holds this.partCount particles, and each particle is described by a sequence of
PART_MAXVAR floating-point parameters; in other words, the 'stride' that moves
use from a given parameter in one particle to the same parameter in the next
particle is PART_MAXVAR. Suppose we wish to find the Y velocity parameter of 
particle number 17 in s1 ('first' particle is number 0): we can
get that value if we write: this.s1[PART_XVEL + 17*PART_MAXVAR].
------------------------------------------------------------------------------*/
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
const PART_MASS     =13;	// mass, in kilograms  
const PART_DIAM 	=14;	// on-screen diameter (in pixels)
const PART_RENDMODE =15;	// on-screen appearance (square, round, or soft-round)
 // Other useful particle values, currently unused
const PART_AGE      =16;  // # of frame-times until re-initializing (Reeves Fire)
/*
const PART_CHARGE   =17;  // for electrostatic repulsion/attraction
const PART_MASS_VEL =18;  // time-rate-of-change of mass.
const PART_MASS_FTOT=19;  // force-accumulator for mass-change
const PART_R_VEL    =20;  // time-rate-of-change of color:red
const PART_G_VEL    =21;  // time-rate-of-change of color:grn
const PART_B_VEL    =22;  // time-rate-of-change of color:blu
const PART_R_FTOT   =23;  // force-accumulator for color-change: red
const PART_G_FTOT   =24;  // force-accumulator for color-change: grn
const PART_B_FTOT   =25;  // force-accumulator for color-change: blu
*/
const PART_MAXVAR   =17;  // Size of array in CPart uses to store its values.


// Array-Name consts that select PartSys objects' numerical-integration solver:
//------------------------------------------------------------------------------
// EXPLICIT methods: GOOD!
//    ++ simple, easy to understand, fast, but
//    -- Requires tiny time-steps for stable stiff systems, because
//    -- Errors tend to 'add energy' to any dynamical system, driving
//        many systems to instability even with small time-steps.
const SOLV_EULER       = 0;       // Euler integration: forward,explicit,...
const SOLV_MIDPOINT    = 1;       // Midpoint Method (see Pixar Tutorial)
const SOLV_ADAMS_BASH  = 2;       // Adams-Bashforth Explicit Integrator
const SOLV_RUNGEKUTTA  = 3;       // Arbitrary degree, set by 'solvDegree'

// IMPLICIT methods:  BETTER!
//          ++Permits larger time-steps for stiff systems, but
//          --More complicated, slower, less intuitively obvious,
//          ++Errors tend to 'remove energy' (ghost friction; 'damping') that
//              aids stability even for large time-steps.
//          --requires root-finding (iterative: often no analytical soln exists)
const SOLV_BACK_EULER  = 4;      // 'Backwind' or Implicit Euler
const SOLV_BACK_MIDPT  = 5;      // 'Backwind' or Implicit Midpoint
const SOLV_BACK_ADBASH = 6;    // 'Backwind' or Implicit Adams-Bashforth

// SEMI-IMPLICIT METHODS: BEST?
//          --Permits larger time-steps for stiff systems,
//          ++Simpler, easier-to-understand than Implicit methods
//          ++Errors tend to 'remove energy) (ghost friction; 'damping') that
//              aids stability even for large time-steps.
//          ++ DOES NOT require the root-finding of implicit methods,
const SOLV_VERLET      = 6;       // Verlet semi-implicit integrator;
const SOLV_VEL_VERLET  = 7;       // 'Velocity-Verlet'semi-implicit integrator
const SOLV_LEAPFROG    = 8;       // 'Leapfrog' integrator
const SOLV_MAX         = 9;       // number of solver types available.

const NU_EPSILON  = 10E-15;         // a tiny amount; a minimum vector length
                                    // to use to avoid 'divide-by-zero'

//=============================================================================
//=============================================================================
function PartSys() {
//==============================================================================
//=============================================================================
// Constructor for a new particle system.
  this.randX = 0;   // random point chosen by call to roundRand()
  this.randY = 0;
  this.randZ = 0;
  this.isFountain = 0;  // Press 'f' or 'F' key to toggle; if 1, apply age 
                        // age constraint, which re-initializes particles whose
                        // lifetime falls to zero, forming a 'fountain' of
                        // freshly re-initialized bouncy-balls.
}
// HELPER FUNCTIONS:
//=====================
// Misc functions that don't fit elsewhere

PartSys.prototype.roundRand = function() {
//==============================================================================
// When called, find a new 3D point (this.randX, this.randY, this.randZ) chosen 
// 'randomly' and 'uniformly' inside a sphere of radius 1.0 centered at origin.  
//		(within this sphere, all regions of equal volume are equally likely to
//		contain the the point (randX, randY, randZ, 1).

	do {			// RECALL: Math.random() gives #s with uniform PDF between 0 and 1.
		this.randX = 2.0*Math.random() -1.0; // choose an equally-likely 2D point
		this.randY = 2.0*Math.random() -1.0; // within the +/-1 cube, but
		this.randZ = 2.0*Math.random() -1.0;
		}       // is x,y,z outside sphere? try again!
	while(this.randX*this.randX + 
	      this.randY*this.randY + 
	      this.randZ*this.randZ >= 1.0); 
}

// INIT FUNCTIONS:
//==================
// Each 'init' function initializes everything in our particle system. Each 
// creates all necessary state variables, force-applying objects, 
// constraint-applying objects, solvers and all other values needed to prepare
// the particle-system to run without any further adjustments.

PartSys.prototype.initBouncy2D = function(count,offset_x,offset_y,offset_z) {
//==============================================================================
  this.partCount = count;
  this.s1 = new Float32Array(this.partCount * PART_MAXVAR);
  this.s2 = new Float32Array(this.partCount * PART_MAXVAR);

  this.offset_x = offset_x;
  this.offset_y = offset_y;
  this.offset_z = offset_z;
        // NOTE: Float32Array objects are zero-filled by default.
        
  this.INIT_VEL =  0.15 * 60.0;		// initial velocity in meters/sec.
	                  // adjust by ++Start, --Start buttons. Original value 
										// was 0.15 meters per timestep; multiply by 60 to get
                    // meters per second.
  this.drag = 0.985;// units-free air-drag (scales velocity); adjust by d/D keys
  this.grav = 9.832;// gravity's acceleration(meter/sec^2); adjust by g/G keys.
	                  // on Earth surface, value is 9.832 meters/sec^2.
  this.resti = 1.0; // units-free 'Coefficient of Restitution' for 
	                  // inelastic collisions.  Sets the fraction of momentum 
										// (0.0 <= resti < 1.0) that remains after a ball 
										// 'bounces' on a wall or floor, as computed using 
										// velocity perpendicular to the surface. 
										// (Recall: momentum==mass*velocity.  If ball mass does 
										// not change, and the ball bounces off the x==0 wall,
										// its x velocity xvel will change to -xvel * resti ).
  //--------------------------Particle System Controls:
  this.runMode =  3;// Master Control: 0=reset; 1= pause; 2=step; 3=run
  this.solvType = 1;// adjust by s/S keys.
                    // ==0 for Euler solver (explicit, forward-time, as 
										// found in BouncyBall03 and BouncyBall04.goodMKS)
										// ==1 for special-case implicit solver, reverse-time, 
										// as found in BouncyBall03.01BAD, BouncyBall04.01badMKS)
  this.bounceType = 1;	// floor-bounce constraint type:
										// ==0 for velocity-reversal, as in all previous versions
										// ==1 for Chapter 3's collision resolution method, which
										// uses an 'impulse' to cancel any velocity boost caused
										// by falling below the floor.
										
//--------------------------------Create & fill VBO with state var s1 contents:
// INITIALIZE s1, s2:
//  NOTE: s1,s2 are a Float32Array objects, zero-filled by default.
// That's OK for most particle parameters, but these need non-zero defaults:

  var j = 0;  // i==particle number; j==array index for i-th particle
  for(var i = 0; i < this.partCount; i += 1, j+= PART_MAXVAR) {
    this.roundRand();       // set this.randX,randY,randZ to random location in 
                            // a 3D unit sphere centered at the origin.
    //all our bouncy-balls stay within a +/- 0.9 cube centered at origin; 
    // set random positions in a 0.1-radius ball centered at (-0.8,-0.8,-0.8)
    // this.s1[j + PART_XPOS] = -0.8 + 0.1*this.randX; 
    // this.s1[j + PART_YPOS] = -0.8 + 0.1*this.randY;  
    // this.s1[j + PART_ZPOS] = -0.8 + 0.1*this.randZ;
	this.s1[j + PART_XPOS] = 0.1 * this.randX + offset_x; 
    this.s1[j + PART_YPOS] = 0.1 * this.randY + offset_y;  
    this.s1[j + PART_ZPOS] = 0.1 * this.randZ + offset_z;
    this.s1[j + PART_WPOS] =  1.0;      // position 'w' coordinate;
    this.roundRand(); // Now choose random initial velocities too:
    this.s1[j + PART_XVEL] =  this.INIT_VEL*(0.4 + 0.1*this.randX);
    this.s1[j + PART_YVEL] =  this.INIT_VEL*(0.4 + 0.1*this.randY);
    this.s1[j + PART_ZVEL] =  this.INIT_VEL*(0.4 + 0.1*this.randZ);
    this.s1[j + PART_MASS] =  1.0;      // mass, in kg.
    this.s1[j + PART_DIAM] =  2.0 + 10*Math.random(); // on-screen diameter, in pixels
    this.s1[j + PART_RENDMODE] = 0.0;
    this.s1[j + PART_AGE] = 30 + 100*Math.random();
    //----------------------------
    this.s2.set(this.s1);   // COPY contents of state-vector s1 to s2.
  }

  this.FSIZE = this.s1.BYTES_PER_ELEMENT;  // 'float' size, in bytes.
// Create a vertex buffer object (VBO) in the graphics hardware: get its ID# 
  this.vboID = gl.createBuffer();
  if (!this.vboID) {
    console.log('PartSys.init() Failed to create the VBO object in the GPU');
    return -1;
  }
  // "Bind the new buffer object (memory in the graphics system) to target"
  // In other words, specify the usage of one selected buffer object.
  // What's a "Target"? it's the poorly-chosen OpenGL/WebGL name for the 
  // intended use of this buffer's memory; so far, we have just two choices:
  //	== "gl.ARRAY_BUFFER" meaning the buffer object holds actual values we 
  //      need for rendering (positions, colors, normals, etc), or 
  //	== "gl.ELEMENT_ARRAY_BUFFER" meaning the buffer object holds indices 
  // 			into a list of values we need; indices such as object #s, face #s, 
  //			edge vertex #s.
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vboID);

  // Write data from our JavaScript array to graphics systems' buffer object:
  gl.bufferData(gl.ARRAY_BUFFER, this.s1, gl.DYNAMIC_DRAW);
  // why 'DYNAMIC_DRAW'? Because we change VBO's content with bufferSubData() later

  // ---------Set up all attributes for VBO contents:
  //Get the ID# for the a_Position variable in the graphics hardware
  this.a_PositionID = gl.getAttribLocation(gl.program, 'a_Position');
  if(this.a_PositionID < 0) {
    console.log('PartSys.init() Failed to get the storage location of a_Position');
    return -1;
  }
  // Tell GLSL to fill the 'a_Position' attribute variable for each shader with
  // values from the buffer object chosen by 'gl.bindBuffer()' command.
  // websearch yields OpenGL version: 
  //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml
  gl.vertexAttribPointer(this.a_PositionID, 
          4,  // # of values in this attrib (1,2,3,4) 
          gl.FLOAT, // data type (usually gl.FLOAT)
          false,    // use integer normalizing? (usually false)
          PART_MAXVAR*this.FSIZE,  // Stride: #bytes from 1st stored value to next one
          PART_XPOS * this.FSIZE); // Offset; #bytes from start of buffer to 
                    // 1st stored attrib value we will actually use.
  // Enable this assignment of the bound buffer to the a_Position variable:
  gl.enableVertexAttribArray(this.a_PositionID);
 
  // ---------Set up all uniforms we send to the GPU:
  // Get graphics system storage location of each uniform our shaders use:
  // (why? see  http://www.opengl.org/wiki/Uniform_(GLSL) )
  this.u_runModeID = gl.getUniformLocation(gl.program, 'u_runMode');
  if(!this.u_runModeID) {
  	console.log('PartSys.init() Failed to get u_runMode variable location');
  	return;
  }
  // Set the initial values of all uniforms on GPU: (runMode set by keyboard)
	gl.uniform1i(this.u_runModeID, this.runMode);
}

PartSys.prototype.initBouncy3D = function(count) { 
//==============================================================================
  console.log('PartSys.initBouncy3D() stub not finished!');
}

PartSys.prototype.initFireReeves = function(count) {
//==============================================================================
  console.log('PartSys.initFireReeves() stub not finished!');
}

PartSys.prototype.initTornado = function(count) { 
//==============================================================================
  console.log('PartSys.initTornado() stub not finished!');
}
PartSys.prototype.initFlocking = function(count) { 
//==============================================================================
  console.log('PartSys.initFlocking() stub not finished!');
}
PartSys.prototype.initSpringPair = function() { 
//==============================================================================
  console.log('PartSys.initSpringPair() stub not finished!');
}
PartSys.prototype.initSpringRope = function(count) { 
//==============================================================================
  console.log('PartSys.initSpringRope() stub not finished!');
}
PartSys.prototype.initSpringCloth = function(xSiz,ySiz) {
//==============================================================================
  console.log('PartSys.initSpringCloth() stub not finished!');
}
PartSys.prototype.initSpringSolid = function() {
//==============================================================================
  console.log('PartSys.initSpringSolid() stub not finished!');
}
PartSys.prototype.initOrbits = function() {
//==============================================================================
  console.log('PartSys.initOrbits() stub not finished!');
}

PartSys.prototype.applyForces = function(s, fSet) { 
//==============================================================================
// Clear the force-accumulator vector for each particle in state-vector 's', 
// then apply each force described in the collection of force-applying objects 
// found in 'fSet'.
// (this function will simplify our too-complicated 'draw()' function)
}

PartSys.prototype.dotFinder = function(dest, src) {
//==============================================================================
// fill the already-existing 'dest' variable (a float32array) with the 
// time-derivative of given state 'src'.
}

PartSys.prototype.render = function(s) {
//==============================================================================
// Draw the contents of state-vector 's' on-screen. To do this:
//  a) transfer its contents to the already-existing VBO in the GPU using the
//      WebGL call 'gl.bufferSubData()', then 
//  b) set all the 'uniform' values needed by our shaders,
//  c) draw VBO contents using gl.drawArray().

  // CHANGE our VBO's contents:
  gl.bufferSubData( 
          gl.ARRAY_BUFFER,  // specify the 'binding target': either
                  //    gl.ARRAY_BUFFER (VBO holding sets of vertex attribs)
                  // or gl.ELEMENT_ARRAY_BUFFER (VBO holding vertex-index values)
          0,      // offset: # of bytes to skip at the start of the VBO before 
                    // we begin data replacement.
          this.s1); // Float32Array data source.

	gl.uniform1i(this.u_runModeID, this.runMode);	// run/step/pause the particle system 

  // Draw our VBO's new contents:
  gl.drawArrays(gl.POINTS,          // mode: WebGL drawing primitive to use 
                0,                  // index: start at this vertex in the VBO;
                this.partCount);    // draw this many vertices.
}

 PartSys.prototype.solver = function() {
//==============================================================================
// Find next state s2 from current state s1 (and perhaps some related states
// such as s1dot, sM, sMdot, etc.) by the numerical integration method chosen
// by PartSys.solvType.

		switch(this.solvType)
		{
		  case 0://-----------------------------------------------------------------
			// EXPLICIT or 'forward time' solver, as found in bouncyBall03.01BAD and
			// bouncyBall04.01badMKS.  CAREFUL! this solver adds energy -- not stable
			// for many particle system settings!
			// This solver looks quite sensible and logical.  Formally, it's an 
			//	explicit or 'forward-time' solver known as the Euler method:
			//			Use the current velocity ('s1dot') to move forward by
			//			one timestep: s2 = s1 + s1dot*h, and
			//		-- Compute the new velocity (e.g. s2dot) too: apply gravity & drag.
			//		-- Then apply constraints: check to see if new position (s2)
			//			is outside our floor, ceiling, or walls, and if new velocity
			//			will move us further in the wrong direction. If so, reverse it!
			// CAREFUL! must convert g_timeStep from milliseconds to seconds!
			//------------------
      //this.swap(); moved to 'draw()' function, outside of PartSys
			//------------------
			// Compute new position from current position, current velocity, & timestep
      var j = 0;  // i==particle number; j==array index for i-th particle
      for(var i = 0; i < this.partCount; i += 1, j+= PART_MAXVAR) {
    			g_partA.s2[j + PART_XPOS] += g_partA.s2[j + PART_XVEL] * (g_timeStep * 0.001);
    			g_partA.s2[j + PART_YPOS] += g_partA.s2[j + PART_YVEL] * (g_timeStep * 0.001); 
    			g_partA.s2[j + PART_ZPOS] += g_partA.s2[j + PART_ZVEL] * (g_timeStep * 0.001); 
    			    			// -- apply acceleration due to gravity to current velocity:
    			// 					 s2[PART_YVEL] -= (accel. due to gravity)*(timestep in seconds) 
    			//									 -= (9.832 meters/sec^2) * (g_timeStep/1000.0);
    			g_partA.s2[j + PART_YVEL] -= this.grav*(g_timeStep*0.001);
    			// -- apply drag: attenuate current velocity:
    			g_partA.s2[j + PART_XVEL] *= g_partA.drag;
    			g_partA.s2[j + PART_YVEL] *= g_partA.drag; 
    			g_partA.s2[j + PART_ZVEL] *= g_partA.drag; 
    	    }
		// We're done!
			//		**BUT***  IT DOESN"T WORK!?!? WHY DOES THE BALL NEVER STOP?
			//	Multiple answers:
			//	1a) Note how easily we can confuse these two cases (bouncyball03 vs 
			//		bouncyball03.01) unless we're extremely careful; one seemingly 
			//		trivial mod to version 03 radically changes bouncyball behavior!
			//		State-variable formulation prevents these confusions by strict 
			//		separation of all parameters of the current state (s1) and the next 
			//		state (s2), with an unambiguous 'swap' operation at the end of our 
			//		animation loop (see lecture notes).
			//	1b) bouncyball03.01 fails by using an 'explicit' solver, but the 
			//		'weirdly out-of-order' bouncyBall03.js works. Why? because 
			//		version03 uses a simple, accidental special case of an 'implicit' or 
			//		'time-reversed' solver: it finds the NEXT timestep's velocity but 
			//		applies it 'backwards in time' -- adds it to the CURRENT position! 
			//				Implicit solvers (we'll learn much more about them soon) will
			//		often work MUCH better that the simple and obvious Euler method (an  
			//		explicit, 'forward-time' solver) because implicit solvers are 
			//		'lossy': their  errors slow down the bouncy ball, cause it to lose 
			//		more energy, acting as a new kind of 'drag' that helps stop the ball.
			//		Conversely, errors from the 'sensible' Euler method always ADD 
			//		energy to the bouncing ball, causing it to keep moving incessantly.
			// 2) BAD CONSTRAINTS: simple velocity reversals aren't enough to 
			//		adequately simulate collisions, bouncing, and resting contact on a 
			//		solid wall or floor.  BOTH bouncyball03 AND bouncyball03.01BAD need 
			//		improvement: read Chapter 7 in your book to learn the multi-step 
			//		process needed, and why state-variable formulation is especially 
			//		helpful.  For example, imagine that in the current timestep (s1) the 
			//		ball is at rest on the floor with zero velocity.  During the time 
			//		between s1 and s2, gravity will accelerate the ball downwards; it 
			//		will 'fall through the floor'; thus our next state s2 is erroneous, 
			//		and we must correct it.  To improve our floor and wall collision 
			//		handling we must: 
			//				1) 'resolve collision' -- in s2, re-position the ball at the 
			//						surface of the floor, and 
			//				2) 'apply impulse' -- in s2, remove the CHANGE in velocity 
			//						caused by erroneous 'fall-through', 
			//		and 3) 'bounce' -- reverse the velocity that remains, moving the
			//						particle away from the collision at a velocity scaled by the 
			//						floor's bouncy-ness (coefficient of restitution; see book).
		  break;
		case 1://-------------------------------------------------------------------
			// IMPLICIT or 'reverse time' solver, as found in bouncyBall04.goodMKS;
			// This category of solver is often better, more stable, but lossy.

//      this.swap();   // replace s1 (current state) with s2 (next state)
      
			// -- apply acceleration due to gravity to current velocity:
			//				  s2[PART_YVEL] -= (accel. due to gravity)*(g_timestep in seconds) 
			//                  -= (9.832 meters/sec^2) * (g_timeStep/1000.0);
      var j = 0;  // i==particle number; j==array index for i-th particle
      for(var i = 0; i < this.partCount; i += 1, j+= PART_MAXVAR) {
  			this.s2[j + PART_YVEL] -= this.grav*(g_timeStep*0.001);
  			// -- apply drag: attenuate current velocity:
  			this.s2[j + PART_XVEL] *= this.drag;
  			this.s2[j + PART_YVEL] *= this.drag;
  			this.s2[j + PART_ZVEL] *= this.drag;
  			// -- move our particle using current velocity:
  			// CAREFUL! must convert g_timeStep from milliseconds to seconds!
  			this.s2[j + PART_XPOS] += this.s2[j + PART_XVEL] * (g_timeStep * 0.001);
  			this.s2[j + PART_YPOS] += this.s2[j + PART_YVEL] * (g_timeStep * 0.001); 
  			this.s2[j + PART_ZPOS] += this.s2[j + PART_ZVEL] * (g_timeStep * 0.001); 
  		}
			// What's the result of this rearrangement?
			//	IT WORKS BEAUTIFULLY! much more stable much more often...
		  break;
    default:
			console.log('?!?! unknown solver: g_partA.solvType==' + this.solvType);
			break;
		}
		return;
}

PartSys.prototype.doConstraints = function() {
//==============================================================================
// apply all constraints to s1 and s2:
// 'bounce' our ball off floor & walls at +/- 0.9,+/-0.9, +/-0.9
// where this.bounceType selects constraint type:
// ==0 for simple velocity-reversal, as in all previous versions
// ==1 for textbook's collision resolution method, which uses an 'impulse' 
//          to cancel any velocity boost caused by falling below the floor.
//    
	if(this.bounceType==0) { //------------------------------------------------
    var j = 0;  // i==particle number; j==array index for i-th particle
    for(var i = 0; i < this.partCount; i += 1, j+= PART_MAXVAR) {
  		// simple velocity-reversal: 
  		if(      this.s2[j + PART_XPOS] < -0.9 && this.s2[j + PART_XVEL] < 0.0) { 
  		  // bounce on left (-X) wall
  		   this.s2[j + PART_XVEL] = -this.resti * this.s2[j + PART_XVEL]; 
  		}
  		else if( this.s2[j + PART_XPOS] >  0.9 && this.s2[j + PART_XVEL] > 0.0) {		
  		  // bounce on right (+X) wall
  			 this.s2[j + PART_XVEL] = -this.resti * this.s2[j + PART_XVEL];
  		} //---------------------------
  		if(      this.s2[j + PART_YPOS] < -0.9 && this.s2[j + PART_YVEL] < 0.0) {
  			// bounce on floor (-Y)
  			 this.s2[j + PART_YVEL] = -this.resti * this.s2[j + PART_YVEL];
  		}
  		else if( this.s2[j + PART_YPOS] >  0.9 && this.s2[j + PART_YVEL] > 0.0) {		
  		  // bounce on ceiling (+Y)
  			 this.s2[j + PART_YVEL] = -this.resti * this.s2[j + PART_YVEL];
  		} //---------------------------
  		if(      this.s2[j + PART_ZPOS] < -0.9 && this.s2[j + PART_ZVEL] < 0.0) {
  			// bounce on near wall (-Z)
  			 this.s2[j + PART_ZVEL] = -this.resti * this.s2[j + PART_ZVEL];
  		}
  		else if( this.s2[j + PART_ZPOS] >  0.9 && this.s2[j + PART_ZVEL] > 0.0) {		
  		  // bounce on far wall (+Z)
  			 this.s2[j + PART_ZVEL] = -this.resti * this.s2[j + PART_ZVEL];
  			}	
  	//--------------------------
    // The above constraints change ONLY the velocity; nothing explicitly
    // forces the bouncy-ball to stay within the walls. If we begin with a
    // bouncy-ball on floor with zero velocity, gravity will cause it to 'fall' 
    // through the floor during the next timestep.  At the end of that timestep
    // our velocity-only constraint will scale velocity by -this.resti, but its
    // position is still below the floor!  Worse, the resti-weakened upward 
    // velocity will get cancelled by the new downward velocity added by gravity 
    // during the NEXT time-step. This gives the ball a net downwards velocity 
    // again, which again gets multiplied by -this.resti to make a slight upwards
    // velocity, but with the ball even further below the floor. As this cycle
    // repeats, the ball slowly sinks further and further downwards.
    // THUS the floor needs this position-enforcing constraint as well:
  		if(      this.s2[j + PART_YPOS] < -0.9) this.s2[j + PART_YPOS] = -0.9;
      else if( this.s2[j + PART_YPOS] >  0.9) this.s2[j + PART_YPOS] =  0.9; // ceiling
      if(      this.s2[j + PART_XPOS] < -0.9) this.s2[j + PART_XPOS] = -0.9; // left wall
      else if( this.s2[j + PART_XPOS] >  0.9) this.s2[j + PART_XPOS] =  0.9; // right wall
      if(      this.s2[j + PART_ZPOS] < -0.9) this.s2[j + PART_ZPOS] = -0.9; // near wall
      else if( this.s2[j + PART_ZPOS] >  0.9) this.s2[j + PART_ZPOS] =  0.9; // far wall
		// Our simple 'bouncy-ball' particle system needs this position-limiting
		// constraint ONLY for the floor and not the walls, as no forces exist that
		// could 'push' a zero-velocity particle against the wall. But suppose we
		// have a 'blowing wind' force that pushes particles left or right? Any
		// particle that comes to rest against our left or right wall could be
		// slowly 'pushed' through that wall as well -- THUS we need position-limiting
		// constraints for ALL the walls:
    } // end of for-loop thru all particles
	} // end of 'if' for bounceType==0
	else if (this.bounceType==1) { 
	//-----------------------------------------------------------------
	  var j = 0;  // i==particle number; j==array index for i-th particle
    for(var i = 0; i < this.partCount; i += 1, j+= PART_MAXVAR) {
      //--------  left (-X) wall  ----------
  		if( this.s2[j + PART_XPOS] < -0.9) {// && this.s2[j + PART_XVEL] < 0.0 ) {
  		// collision!
  			this.s2[j + PART_XPOS] = -0.9;// 1) resolve contact: put particle at wall.
			  this.s2[j + PART_XVEL] = this.s1[j + PART_XVEL];  // 2a) undo velocity change:
  			this.s2[j + PART_XVEL] *= this.drag;	            // 2b) apply drag:
  		  // 3) BOUNCE:  reversed velocity*coeff-of-restitution.
  			// ATTENTION! VERY SUBTLE PROBLEM HERE!
  			// need a velocity-sign test here that ensures the 'bounce' step will 
  			// always send the ball outwards, away from its wall or floor collision. 
  			if( this.s2[j + PART_XVEL] < 0.0) 
  			    this.s2[j + PART_XVEL] = -this.resti * this.s2[j + PART_XVEL]; // need sign change--bounce!
  			else 
  			    this.s2[j + PART_XVEL] =  this.resti * this.s2[j + PART_XVEL]; // sign changed-- don't need another.
  		}
  		//--------  right (+X) wall  --------------------------------------------
  		else if( this.s2[j + PART_XPOS] >  0.9) { // && this.s2[j + PART_XVEL] > 0.0) {	
  		// collision!
  			this.s2[j + PART_XPOS] = 0.9; // 1) resolve contact: put particle at wall.
  			this.s2[j + PART_XVEL] = this.s1[j + PART_XVEL];	// 2a) undo velocity change:
  			this.s2[j + PART_XVEL] *= this.drag;			        // 2b) apply drag:
  		  // 3) BOUNCE:  reversed velocity*coeff-of-restitution.
  			// ATTENTION! VERY SUBTLE PROBLEM HERE! 
  			// need a velocity-sign test here that ensures the 'bounce' step will 
  			// always send the ball outwards, away from its wall or floor collision. 
  			if(this.s2[j + PART_XVEL] > 0.0) 
  			    this.s2[j + PART_XVEL] = -this.resti * this.s2[j + PART_XVEL]; // need sign change--bounce!
  			else 
  			    this.s2[j + PART_XVEL] =  this.resti * this.s2[j + PART_XVEL];	// sign changed-- don't need another.
  		}
      //--------  floor (-Y) wall  --------------------------------------------  		
  		if( this.s2[j + PART_YPOS] < -0.9) { // && this.s2[j + PART_YVEL] < 0.0) {		
  		// collision! floor...  
  			this.s2[j + PART_YPOS] = -0.9;// 1) resolve contact: put particle at wall.
  			this.s2[j + PART_YVEL] = this.s1[j + PART_YVEL];	// 2a) undo velocity change:
  			this.s2[j + PART_YVEL] *= this.drag;		          // 2b) apply drag:	
  		  // 3) BOUNCE:  reversed velocity*coeff-of-restitution.
  			// ATTENTION! VERY SUBTLE PROBLEM HERE!
  			// need a velocity-sign test here that ensures the 'bounce' step will 
  			// always send the ball outwards, away from its wall or floor collision.
  			if(this.s2[j + PART_YVEL] < 0.0) 
  			    this.s2[j + PART_YVEL] = -this.resti * this.s2[j + PART_YVEL]; // need sign change--bounce!
  			else 
  			    this.s2[j + PART_YVEL] =  this.resti * this.s2[j + PART_YVEL];	// sign changed-- don't need another.
  		}
  		//--------  ceiling (+Y) wall  ------------------------------------------
  		else if( this.s2[j + PART_YPOS] > 0.9 ) { // && this.s2[j + PART_YVEL] > 0.0) {
  		 		// collision! ceiling...
  			this.s2[j + PART_YPOS] = 0.9;// 1) resolve contact: put particle at wall.
  			this.s2[j + PART_YVEL] = this.s1[j + PART_YVEL];	// 2a) undo velocity change:
  			this.s2[j + PART_YVEL] *= this.drag;			        // 2b) apply drag:
  		  // 3) BOUNCE:  reversed velocity*coeff-of-restitution.
  			// ATTENTION! VERY SUBTLE PROBLEM HERE!
  			// need a velocity-sign test here that ensures the 'bounce' step will 
  			// always send the ball outwards, away from its wall or floor collision.
  			if(this.s2[j + PART_YVEL] > 0.0) 
  			    this.s2[j + PART_YVEL] = -this.resti * this.s2[j + PART_YVEL]; // need sign change--bounce!
  			else 
  			    this.s2[j + PART_YVEL] =  this.resti * this.s2[j + PART_YVEL];	// sign changed-- don't need another.
  		}
  		//--------  near (-Z) wall  --------------------------------------------- 
  		if( this.s2[j + PART_ZPOS] < -0.9 ) { // && this.s2[j + PART_ZVEL] < 0.0 ) {
  		// collision! 
  			this.s2[j + PART_ZPOS] = -0.9;// 1) resolve contact: put particle at wall.
  			this.s2[j + PART_ZVEL] = this.s1[j + PART_ZVEL];  // 2a) undo velocity change:
  			this.s2[j + PART_ZVEL] *= this.drag;			        // 2b) apply drag:
  		  // 3) BOUNCE:  reversed velocity*coeff-of-restitution.
  			// ATTENTION! VERY SUBTLE PROBLEM HERE! ------------------------------
  			// need a velocity-sign test here that ensures the 'bounce' step will 
  			// always send the ball outwards, away from its wall or floor collision. 
  			if( this.s2[j + PART_ZVEL] < 0.0) 
  			    this.s2[j + PART_ZVEL] = -this.resti * this.s2[j + PART_ZVEL]; // need sign change--bounce!
  			else 
  			    this.s2[j + PART_ZVEL] =  this.resti * this.s2[j + PART_ZVEL];	// sign changed-- don't need another.
  		}
  		//--------  far (+Z) wall  ---------------------------------------------- 
  		else if( this.s2[j + PART_ZPOS] >  0.9) { // && this.s2[j + PART_ZVEL] > 0.0) {	
  		// collision! 
  			this.s2[j + PART_ZPOS] = 0.9; // 1) resolve contact: put particle at wall.
  			this.s2[j + PART_ZVEL] = this.s1[j + PART_ZVEL];  // 2a) undo velocity change:
  			this.s2[j + PART_ZVEL] *= this.drag;			        // 2b) apply drag:
  		  // 3) BOUNCE:  reversed velocity*coeff-of-restitution.
  			// ATTENTION! VERY SUBTLE PROBLEM HERE! ------------------------------
  			// need a velocity-sign test here that ensures the 'bounce' step will 
  			// always send the ball outwards, away from its wall or floor collision.   			
  			if(this.s2[j + PART_ZVEL] > 0.0) 
  			    this.s2[j + PART_ZVEL] = -this.resti * this.s2[j + PART_ZVEL]; // need sign change--bounce!
  			else 
  			    this.s2[j + PART_ZVEL] =  this.resti * this.s2[j + PART_ZVEL];	// sign changed-- don't need another.
  		} // end of (+Z) wall constraint
  	} // end of for-loop for all particles
	} // end of bounceType==1 
	else {
		console.log('?!?! unknown constraint: PartSys.bounceType==' + this.bounceType);
		return;
	}

//-----------------------------add 'age' constraint:
  if(this.isFountain == 1)    // When particle age falls to zero, re-initialize
                              // to re-launch from a randomized location with
                              // a randomized velocity and randomized age.
                              
  var j = 0;  // i==particle number; j==array index for i-th particle
  for(var i = 0; i < this.partCount; i += 1, j+= PART_MAXVAR) {
    this.s2[j + PART_AGE] -= 1;     // decrement lifetime.
    if(this.s2[j + PART_AGE] <= 0) { // End of life: RESET this particle!
      this.roundRand();       // set this.randX,randY,randZ to random location in 
                              // a 3D unit sphere centered at the origin.
      //all our bouncy-balls stay within a +/- 0.9 cube centered at origin; 
      // set random positions in a 0.1-radius ball centered at (-0.8,-0.8,-0.8)
      this.s2[j + PART_XPOS] = -0.0 + 0.2*this.randX; 
      this.s2[j + PART_YPOS] = -0.4 + 0.2*this.randY;  
      this.s2[j + PART_ZPOS] = -0.0 + 0.2*this.randZ;
      this.s2[j + PART_WPOS] =  1.0;      // position 'w' coordinate;
      this.roundRand(); // Now choose random initial velocities too:
      this.s2[j + PART_XVEL] =  this.INIT_VEL*(0.0 + 0.2*this.randX);
      this.s2[j + PART_YVEL] =  this.INIT_VEL*(0.5 + 0.2*this.randY);
      this.s2[j + PART_ZVEL] =  this.INIT_VEL*(0.0 + 0.2*this.randZ);
      this.s2[j + PART_MASS] =  1.0;      // mass, in kg.
      this.s2[j + PART_DIAM] =  2.0 + 10*Math.random(); // on-screen diameter, in pixels
      this.s2[j + PART_RENDMODE] = 0.0;
      this.s2[j + PART_AGE] = 30 + 100*Math.random();
      } // if age <=0
  } // for loop thru all particles
}

PartSys.prototype.swap = function() {
//==============================================================================
// Choose the method you want:

// We can EXCHANGE, actually SWAP the contents of s1 and s2, like this:  
// but !! YOU PROBABLY DON'T WANT TO DO THIS !!
/*
  var tmp = this.s1;
  this.s1 = this.s2;
  this.s2 = tmp;
*/

// Or we can REPLACE s1 contents with s2 contents, like this:
// NOTE: if we try:  this.s1 = this.s2; we DISCARD s1's memory!!

  this.s1.set(this.s2);     // set values of s1 array to match s2 array.
// (WHY? so that your solver can make intermittent changes to particle
// values without any unwanted 'old' values re-appearing. For example,
// At timestep 36, particle 11 had 'red' color in s1, and your solver changes
// its color to blue in s2, but makes no further changes.  If swap() EXCHANGES 
// s1 and s2 contents, on timestep 37 the particle is blue, but on timestep 38
// the particle is red again!  If we REPLACE s1 contents with s2 contents, the
// particle is red at time step 36, but blue for 37, 38, 39 and all further
// timesteps until we change it again.
// REPLACE s1 contents with s2 contents:

}
