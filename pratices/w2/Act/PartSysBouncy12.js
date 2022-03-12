// //==============================================================================
// // Vertex shader program:
var VSHADER_SOURCE =
    'precision highp float;\n' +
    'precision highp int;\n' +

	'uniform   int u_runMode; \n' +	
	'uniform int ballMode;\n' +

    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'attribute vec4 a_Normal;\n' +     

    'uniform mat4 u_ProjMatrix;\n' +
    'uniform mat4 u_ModelMatrix;\n' +   
    'uniform mat4 u_NormalMatrix;\n' +   

    //Uniforms
    'uniform vec3 u_eyePosWorld; \n' +

    'varying vec4 v_Color;\n' +
    'varying vec3 v_Normal;\n' +
    'varying vec3 v_Position;\n' +


    'void main() {\n' +
		'  gl_PointSize = 20.0;\n' + 
		//phong shading
		'gl_Position = u_ProjMatrix * u_ModelMatrix * a_Position;\n' +
		'v_Position = vec3(u_ModelMatrix * a_Position);\n' +
		'v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
		'	if (ballMode == 1) { \n' +
			'  if(u_runMode == 0) { \n' +
			'	   v_Color = vec4(1.0, 0.0, 0.0, 1.0);	\n' +		// red: 0==reset
			'  	 } \n' +
			'  else if(u_runMode == 1) {  \n' +
			'    v_Color = vec4(1.0, 1.0, 0.0, 1.0); \n' +	// yellow: 1==pause
			'    }  \n' +
			'  else if(u_runMode == 2) { \n' +    
			'    v_Color = vec4(1.0, 1.0, 1.0, 1.0); \n' +	// white: 2==step
		'    } \n' +
			'  else { \n' +
			'    v_Color = vec4(0.2, 1.0, 0.2, 1.0); \n' +	// green: >=3 ==run
			'		 } \n' +
		'		 } \n' +
		'  else { \n' +
		'    v_Color = vec4(0.0, 0.0, 0.0, 1.0); \n' +	// green: >=3 ==run
		'		 } \n' +
		
'}\n';

//==============================================================================
// Fragment shader program:

// var FSHADER_SOURCE =
//     'precision highp float;\n' +
//     'precision highp int;\n' +

//     'varying vec4  v_Color;\n' +
//     'varying vec3 v_Normal;\n' +
//     'varying vec3 v_Position;\n' +

//     //Uniforms
//     'uniform vec3 u_eyePosWorld; \n' +
// 	'uniform int ballMode;\n' +

//     'void main(){ \n' +
// 	'	if (ballMode == 0) { \n' +
//         'gl_FragColor = v_Color;\n' +
// 	'	} \n' +
// 	'  else { \n' +
// 	'  float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); \n' +
// 		'  if(dist < 0.5) { \n' +	
// 			'  	gl_FragColor = vec4((1.0-2.0*dist)*v_Color.rgb, 1.0);\n' +
// 			'  }\n'+
// 			'else { discard; }\n' +
// 		'}\n'+
// 	'}\n';
var FSHADER_SOURCE =
    'precision highp float;\n' +
    'precision highp int;\n' +

    'varying vec4  v_Color;\n' +

    //Uniforms
    'uniform vec3 u_eyePosWorld; \n' +
	'uniform int ballMode;\n' +

    'void main(){ \n' +
		'	if (ballMode == 0) { \n' +
        	'gl_FragColor = v_Color;\n' +
		'	} \n' +
		'  else { \n' +
			'  float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); \n' +
			'  if(dist < 0.5) { \n' +	
					'  	gl_FragColor = vec4((1.0-2.0*dist)*v_Color.rgb, 1.0);\n' +
					'  }\n'+
					'else { discard; }\n' +
		'}\n'+
'}\n';

// Global Variables
// =========================

var gl;   // webGL Rendering Context.  Created in main(), used everywhere.
var g_canvas; // our HTML-5 canvas object that uses 'gl' for drawing.
var g_digits = 5; // # of digits printed on-screen (e.g. x.toFixed(g_digits);

// For keyboard, mouse-click-and-drag: -----------------
var isDrag=false;		// mouse-drag: true when user holds down mouse button
var xMclik=0.0;			// last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;  

var flag = -1;

// eye pos
var g_EyeX = 0, g_EyeY = 4.0, g_EyeZ = 4.00;
// camera pos
var g_AtX = 0.0, g_AtY = 0.0, g_AtZ = 0.0;

// position matrices
var u_ModelMatrix = false;
var u_ProjMatrix = false;
var u_NormalMatrix = false;
var u_EyePosWorld;
var ballMode;
var bMode = 0;

var projMatrix = new Matrix4();
var modelMatrix = new Matrix4();
var normalMatrix = new Matrix4();

var u_eyePosWorld = false;

var floatsPerVertex = 6;

//--Animation---------------
var g_isClear = 1;		  // 0 or 1 to enable or disable screen-clearing in the
    									// draw() function. 'C' or 'c' key toggles in myKeyPress().
var g_last = Date.now();				//  Timestamp: set after each frame of animation,
																// used by 'animate()' function to find how much
																// time passed since we last updated our canvas.
var g_stepCount = 0;						// Advances by 1 for each timestep, modulo 1000, 
																// (0,1,2,3,...997,998,999,0,1,2,..) to identify 
																// WHEN the ball bounces.  RESET by 'r' or 'R' key.

var g_timeStep = 1000.0/60.0;			// current timestep in milliseconds (init to 1/60th sec) 
var g_timeStepMin = g_timeStep;   //holds min,max timestep values since last keypress.
var g_timeStepMax = g_timeStep;


// Our first global particle system object; contains 'state variables' s1,s2;
//---------------------------------------------------------
var g_partA = new PartSys();   // create our first particle-system object;
                              // for code, see PartSys.js


function main() {
  	// Retrieve <canvas> element where we will draw using WebGL
	g_canvas = document.getElementById('webgl');
	gl = g_canvas.getContext("webgl", { preserveDrawingBuffer: true});
	// gl =  getWebGLContext(g_canvas);
		// NOTE:{preserveDrawingBuffer: true} disables HTML-5default screen-clearing, 
		// so that our draw() function will over-write previous on-screen results 
		// until we call the gl.clear(COLOR_BUFFER_BIT); function. )
	if (!gl) {
		console.log('main() Failed to get the rendering context for WebGL');
		return;
	}  
	// KEYBOARD:----------------------------------------------
	window.addEventListener("keydown", myKeyDown, false);
	window.addEventListener("keyup", myKeyUp, false);
	window.addEventListener("mousedown", myMouseDown); 
  	window.addEventListener("mousemove", myMouseMove); 
	window.addEventListener("mouseup", myMouseUp);	
	window.addEventListener("click", myMouseClick);				
	window.addEventListener("dblclick", myMouseDblClick); 

	// Initialize shaders
	if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
		console.log('main() Failed to intialize shaders.');
		return;
	}

	gl.clearColor(0.25, 0.25, 0.25, 1);	 // RGBA color for clearing WebGL framebuffer
	gl.clear(gl.COLOR_BUFFER_BIT);		// clear it once to set that color as bkgnd.

  	u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
    u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    u_eyePosWorld = gl.getUniformLocation(gl.program, 'u_eyePosWorld');
	ballMode = gl.getUniformLocation(gl.program, 'ballMode');

	// Initialize Particle systems:
	g_partA.initBouncy3D(20);   

  
	// Display (initial) particle system values as text on webpage
  	printControls();

	gl.uniform1i(ballMode, bMode);

	var tick = function() {
		gl.uniform3f(u_eyePosWorld, g_EyeX, g_EyeY, g_EyeZ);
		g_timeStep = animate(); 

		if(g_timeStep > 200) {  
			g_timeStep = 1000/60;
		}
		// Update min/max for timeStep:
		if     (g_timeStep < g_timeStepMin) g_timeStepMin = g_timeStep;  
		else if(g_timeStep > g_timeStepMax) g_timeStepMax = g_timeStep;
		drawAll(g_partA.partCount); 
		// console.log(bMode);
		var n = initVertexBuffers(gl);
		if (n < 0) {
			console.log('Failed to specify the vertex information');
			return;
		}
		draw();
		requestAnimationFrame(tick, g_canvas);
	};
	tick();
}

function animate() {
//==============================================================================  
// Returns how much time (in milliseconds) passed since the last call to this fcn.
  var now = Date.now();	        
  var elapsed = now - g_last;	// amount of time passed, in integer milliseconds
  g_last = now;               // re-set our stopwatch/timer.

  // INSTRUMENTATION:  (delete if you don't care how much the time-steps varied)
  g_stepCount = (g_stepCount +1)%1000;		// count 0,1,2,...999,0,1,2,...
  //-----------------------end instrumentation
  return elapsed;
}

function drawAll() {
//============================================================================== 
	bMode = 1;
	gl.uniform1i(ballMode, bMode);

	if(g_isClear == 1) gl.clear(gl.COLOR_BUFFER_BIT);
	// update particle system state
	if(g_partA.runMode > 1) {								// 0=reset; 1= pause; 2=step; 3=run
			if(g_partA.runMode == 2) g_partA.runMode=1;			// (if 2, do just one step and pause.)
			// Make our 'bouncy-ball' move forward by one timestep, but now the 's' key 
			// will select which kind of solver to use by changing g_partA.solvType:
		g_partA.applyForces(g_partA.s1, g_partA.forceList);  // find current net force on each particle
		g_partA.dotFinder(g_partA.s1dot, g_partA.s1);      // find s1 time-derivative, s1dot;
		g_partA.solver();         // find s2 from s1 & related states.
		g_partA.doConstraints();  // Apply all constraints.  s2 is ready!
		g_partA.render();   // transfer current state to VBO, set uniforms, draw it!
		g_partA.swap();           // Make s2 the new current state
	}
	else {    // runMode==0 (reset) or ==1 (pause): re-draw existing particles.
		g_partA.render();
	}

	printControls();		// Display particle-system status on-screen. 
    // Report mouse-drag totals.
	document.getElementById('MouseResult0').innerHTML=
			'Mouse Drag totals (CVV coords):\t' + xMdragTot.toFixed(g_digits)+
			                             ', \t' + yMdragTot.toFixed(g_digits);
	bMode = 0;
	gl.uniform1i(ballMode, bMode);	
}

//===================Mouse and Keyboard event-handling Callbacks===============
//=============================================================================
function myMouseDown(ev) {
//=============================================================================
// Called when user PRESSES down any mouse button;
// 									(Which button?    console.log('ev.button='+ev.button);   )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									  // x==0 at canvas left edge
  var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
	
	isDrag = true;											// set our mouse-dragging flag
	xMclik = x;													// record where mouse-dragging began
	yMclik = y;
		document.getElementById('MouseResult1').innerHTML = 
	'myMouseDown() at CVV coords x,y = '+x.toFixed(g_digits)+
	                                ', '+y.toFixed(g_digits)+'<br>';
};

function myMouseMove(ev) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

	if(isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'

	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									  // x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp.toFixed(g_digits),',\t',yp.toFixed(g_digits));

	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
//	console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

	// find how far we dragged the mouse:
	xMdragTot += (x - xMclik);					// Accumulate change-in-mouse-position,&
	yMdragTot += (y - yMclik);
	xMclik = x;													// Make next drag-measurement from here.
	yMclik = y;
// (? why no 'document.getElementById() call here, as we did for myMouseDown()
// and myMouseUp()? Because the webpage doesn't get updated when we move the 
// mouse. Put the web-page updating command in the 'draw()' function instead)
};

function myMouseUp(ev) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									  // x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
	console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
	
	isDrag = false;											// CLEAR our mouse-dragging flag, and
	// accumulate any final bit of mouse-dragging we did:
	xMdragTot += (x - xMclik);
	yMdragTot += (y - yMclik);
	console.log('myMouseUp: xMdragTot,yMdragTot =',xMdragTot.toFixed(g_digits),',\t', 
	                                               yMdragTot.toFixed(g_digits));
	// Put it on our webpage too...
	document.getElementById('MouseResult1').innerHTML = 
	'myMouseUp() at CVV coords x,y = '+x+', '+y+'<br>';
};

function myMouseClick(ev) {
//=============================================================================
// Called when user completes a mouse-button single-click event 
// (e.g. mouse-button pressed down, then released)
// 									   
//    WHICH button? try:  console.log('ev.button='+ev.button); 
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!) 
//    See myMouseUp(), myMouseDown() for conversions to  CVV coordinates.

  // STUB
	console.log("myMouseClick() on button: ", ev.button); 
}	

function myMouseDblClick(ev) {
//=============================================================================
// Called when user completes a mouse-button double-click event 
// 									   
//    WHICH button? try:  console.log('ev.button='+ev.button); 
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!) 
//    See myMouseUp(), myMouseDown() for conversions to  CVV coordinates.

  // STUB
	console.log("myMouse-DOUBLE-Click() on button: ", ev.button); 
}	

function myKeyDown(kev) {
          
	document.getElementById('KeyDown').innerHTML = ''; // clear old result
	document.getElementById('KeyMod').innerHTML = ''; 
	document.getElementById('KeyMod' ).innerHTML = 
			"   --kev.code:"+kev.code   +"      --kev.key:"+kev.key+
		"<br>--kev.ctrlKey:"+kev.ctrlKey+" --kev.shiftKey:"+kev.shiftKey+
		"<br> --kev.altKey:"+kev.altKey +"  --kev.metaKey:"+kev.metaKey;  

	// RESET our g_timeStep min/max recorder on every key-down event:
	g_timeStepMin = g_timeStep;
	g_timeStepMax = g_timeStep;

	var xd = g_EyeX - g_AtX;
	var yd = g_EyeY - g_AtY;
	var zd = g_EyeZ - g_AtZ;
	var lxy = Math.sqrt(xd * xd + yd * yd);
	var l = Math.sqrt(xd * xd + yd * yd + zd * zd);

  switch(kev.code) {
    case "Digit0":
			console.log("Run Mode 0: RESET!\n");              // print on console,
			document.getElementById('KeyDown').innerHTML =  
			'myKeyDown() digit 0 key. Run Mode 0: RESET!';    // print on webpage
			g_partA.runMode = 0;			// RESET!
      break;
    case "Digit1":
			console.log("Run Mode 1: PAUSE!\n");              // print on console,
			document.getElementById('KeyDown').innerHTML =  
			'myKeyDown() digit 1 key. Run Mode 1: PAUSE!';    // print on webpage
			g_partA.runMode = 1;			// PAUSE!
      break;
    case "Digit2":
			console.log("Run Mode 2: STEP!\n");               // print on console,
			document.getElementById('KeyDown').innerHTML =  
			'myKeyDown() digit 2 key. Run Mode 2: STEP!';     // print on webpage
			g_partA.runMode = 2;			// STEP!
      break;
    case "Digit3":
			console.log("Run Mode 3: RUN!\n");                // print on console,
			document.getElementById('KeyDown').innerHTML =  
			'myKeyDown() digit 3 key. Run Mode 3: RUN!';      // print on webpage
			g_partA.runMode = 3;			// RESET!
      break;
    case "KeyB":                // Toggle floor-bounce constraint type
			if(g_partA.bounceType==0) g_partA.bounceType = 1;   // impulsive vs simple
			else g_partA.bounceType = 0;       
      break;
    case "KeyC":                // Toggle screen-clearing to show 'trails'
			g_isClear += 1;
			if(g_isClear > 1) g_isClear = 0;
      break;
    case "KeyD":      // 'd'  INCREASE drag loss; 'D' to DECREASE drag loss
      if(kev.shiftKey==false) g_partA.drag *= 0.995; // permit less movement.
      else {
        g_partA.drag *= 1.0 / 0.995;
        if(g_partA.drag > 1.0) g_partA.drag = 1.0;  // don't allow drag to ADD energy!
        }
      console.log("g_partA.drag:", g_partA.drag);
      break;
    case "KeyF":    // 'f' or 'F' to toggle particle fountain on/off
      g_partA.isFountain += 1;
      if(g_partA.isFountain > 1) g_partA.isFountain = 0;
      break;
    case "KeyG":    // 'g' to REDUCE gravity; 'G' to increase.
      if(kev.shiftKey==false) 		g_partA.grav *= 0.99;		// shrink 1%
      else                        g_partA.grav *= 1.0/0.98; // grow 2%
      console.log("g_partA.grav:", g_partA.grav);
      break;
    case "KeyM":    // 'm' to REDUCE mass; 'M' to increase.
      if(kev.shiftKey==false)     g_partA.mass *= 0.98;   // shrink 2%
      else                        g_partA.mass *= 1.0/0.98; // grow 2%  
      console.log("g_partA.mass:", g_partA.mass);
      break;
		case "KeyP":
			console.log("Pause/unPause!\n");                // print on console,
			document.getElementById('KeyDown').innerHTML =  
			'myKeyDown() found p/P key. Pause/unPause!';   // print on webpage
			if(g_partA.runMode == 3) g_partA.runMode = 1;		// if running, pause
									        else g_partA.runMode = 3;		// if paused, run.
			break;
    case "KeyR":    // r/R for RESET: 
      if(kev.shiftKey==false) {   // 'r' key: SOFT reset; boost velocity only
  		  g_partA.runMode = 3;  // RUN!
        var j=0; // array index for particle i
        for(var i = 0; i < g_partA.partCount; i += 1, j+= PART_MAXVAR) {
          g_partA.roundRand();  // make a spherical random var.
    			if(  g_partA.s2[j + PART_XVEL] > 0.0) // ADD to positive velocity, and 
    			     g_partA.s2[j + PART_XVEL] += 0.5 + 0.4*g_partA.randX*g_partA.INIT_VEL;
    			                                      // SUBTRACT from negative velocity: 
    			else g_partA.s2[j + PART_XVEL] -= 0.5 + 0.4*g_partA.randX*g_partA.INIT_VEL; 
    			if(  g_partA.s2[j + PART_YVEL] > 0.0) 
    			     g_partA.s2[j + PART_YVEL] += 1.7 + 0.4*g_partA.randY*g_partA.INIT_VEL; 
    			else g_partA.s2[j + PART_YVEL] -= 1.7 + 0.4*g_partA.randY*g_partA.INIT_VEL;
    			if(  g_partA.s2[j + PART_ZVEL] > 0.0) 
    			     g_partA.s2[j + PART_ZVEL] += 0.5 + 0.4*g_partA.randZ*g_partA.INIT_VEL; 
    			else g_partA.s2[j + PART_ZVEL] -= 0.5 + 0.4*g_partA.randZ*g_partA.INIT_VEL;
    			}
      }
      else {      // HARD reset: position AND velocity, BOTH state vectors:
  		  g_partA.runMode = 0;			// RESET!
        // Reset state vector s1 for ALL particles:
        var j=0; // array index for particle i
        for(var i = 0; i < g_partA.partCount; i += 1, j+= PART_MAXVAR) {
              g_partA.roundRand();
        			g_partA.s1[j + PART_XPOS] =  -0.9;      // lower-left corner of CVV
        			g_partA.s1[j + PART_YPOS] =  -0.9;      // with a 0.1 margin
        			g_partA.s1[j + PART_ZPOS] =  0.0;	
        			g_partA.s1[j + PART_XVEL] =  3.7 + 0.4*g_partA.randX*g_partA.INIT_VEL;	
        			g_partA.s1[j + PART_YVEL] =  3.7 + 0.4*g_partA.randY*g_partA.INIT_VEL; // initial velocity in meters/sec.
              g_partA.s1[j + PART_ZVEL] =  3.7 + 0.4*g_partA.randZ*g_partA.INIT_VEL;
              // do state-vector s2 as well: just copy all elements of the float32array.
              g_partA.s2.set(g_partA.s1);
        } // end for loop
      } // end HARD reset
      break;
		case "KeyS":
		  console.log("Change Solver!\n");                // print on console.
			document.getElementById('KeyDown').innerHTML =  
			'myKeyDown() found s/S key. Switch solvers!';   // print on webpage.
			g_partA.solvType += 1;              // next solver type
			if(g_partA.solvType > 1) g_partA.solvType = 0;  // if past the last one.     
			break;
		case "Space":
		  console.log("Single Step!\n");                  // print on console.
			document.getElementById('KeyDown').innerHTML =  
			'myKeyDown() found Space key. Single-step!';   // print on webpage.
      g_partA.runMode = 2;
      break;
		case "ArrowLeft": 	
			if (flag == -1) theta = -Math.acos(xd / lxy) + 0.1;
            else theta = theta + 0.1;
            g_AtX = g_EyeX + lxy * Math.cos(theta);
            g_AtY = g_EyeY + lxy * Math.sin(theta);
            flag = 1;
            break;
		case "ArrowRight":
			if (flag == -1) theta = -Math.acos(xd / lxy) - 0.1;
            else theta = theta - 0.1;
            g_AtX = g_EyeX + lxy * Math.cos(theta);
            g_AtY = g_EyeY + lxy * Math.sin(theta);
            flag = 1;
            break;
		case "ArrowUp":		
			cg_AtX = g_AtX - 0.1 * (xd / l);
            g_AtY = g_AtY - 0.1 * (yd / l);
            g_AtZ = g_AtZ - 0.1 * (zd / l);

            g_EyeX = g_EyeX - 0.1 * (xd / l);
            g_EyeY = g_EyeY - 0.1 * (yd / l);
            g_EyeZ = g_EyeZ - 0.1 * (zd / l);
            break;
		case "ArrowDown":
			g_AtX = g_AtX + 0.1 * (xd / l);
            g_AtY = g_AtY + 0.1 * (yd / l);
            g_AtZ = g_AtZ + 0.1 * (zd / l);

            g_EyeX = g_EyeX + 0.1 * (xd / l);
            g_EyeY = g_EyeY + 0.1 * (yd / l);
            g_EyeZ = g_EyeZ + 0.1 * (zd / l);
            break;	
    default:
      console.log("UNUSED!");
  		document.getElementById('KeyDown').innerHTML =
  			'myKeyDown(): UNUSED!';
      break;
  }
}

function myKeyUp(kev) {
//=============================================================================
// Called when user releases ANY key on the keyboard.
// Rarely needed -- most code needs only myKeyDown().

	console.log("myKeyUp():\n--kev.code:",kev.code,"\t\t--kev.key:", kev.key);
}

function printControls() {
//==============================================================================
// Print current state of the particle system on the webpage:
	var recipTime = 1000.0 / g_timeStep;			// to report fractional seconds
	var recipMin  = 1000.0 / g_timeStepMin;
	var recipMax  = 1000.0 / g_timeStepMax; 
	var solvTypeTxt;												// convert solver number to text:
	if(g_partA.solvType==0) solvTypeTxt = 'Explicit--(unstable!)<br>';
	                  else  solvTypeTxt = 'Implicit--(stable)<br>'; 
	var bounceTypeTxt;											// convert bounce number to text
	if(g_partA.bounceType==0) bounceTypeTxt = 'Velocity Reverse(no rest)<br>';
	                     else bounceTypeTxt = 'Impulsive (will rest)<br>';
	var fountainText;
	if(g_partA.isFountain==0) fountainText = 'OFF: ageless particles.<br>';
	else                      fountainText = 'ON: re-cycle old particles.<br>';
	var xvLimit = g_partA.s2[PART_XVEL];	// find absolute values of s2[PART_XVEL]
	if(g_partA.s2[PART_XVEL] < 0.0) xvLimit = -g_partA.s2[PART_XVEL];
	var yvLimit = g_partA.s2[PART_YVEL];	// find absolute values of s2[PART_YVEL]
	if(g_partA.s2[PART_YVEL] < 0.0) yvLimit = -g_partA.s2[PART_YVEL];
	
	document.getElementById('KeyControls').innerHTML = 
   			'<b>Solver = </b>' + solvTypeTxt + 
   			'<b>Bounce = </b>' + bounceTypeTxt +
   			'<b>Fountain =</b>' + fountainText +
   			'<b>drag = </b>' + g_partA.drag.toFixed(5) + 
   			', <b>grav = </b>' + g_partA.grav.toFixed(5) +
   			' m/s^2; <b>yVel = +/-</b> ' + yvLimit.toFixed(5) + 
   			' m/s; <b>xVel = +/-</b> ' + xvLimit.toFixed(5) + 
   			' m/s;<br><b>timeStep = </b> 1/' + recipTime.toFixed(3) + ' sec' +
   			                ' <b>min:</b> 1/' + recipMin.toFixed(3)  + ' sec' + 
   			                ' <b>max:</b> 1/' + recipMax.toFixed(3)  + ' sec<br>';
   			' <b>stepCount: </b>' + g_stepCount.toFixed(3) ;
}


function onPlusButton() {
//==============================================================================
	g_partA.INIT_VEL *= 1.2;		// increase
	console.log('Initial velocity: '+g_partA.INIT_VEL);
}

function onMinusButton() {
//==============================================================================
	g_partA.INIT_VEL /= 1.2;		// shrink
	console.log('Initial velocity: '+g_partA.INIT_VEL);
}

