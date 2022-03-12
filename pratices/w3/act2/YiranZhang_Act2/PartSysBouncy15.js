// Global Variables
// =========================
// Use globals to avoid needlessly complex & tiresome function argument lists.
// For example, the WebGL rendering context 'gl' gets used in almost every fcn;
// requiring 'gl' as an argument won't give us any added 'encapsulation'; make
// it global.  Later, if the # of global vars grows, we can unify them in to 
// one (or just a few) sensible global objects for better modularity.

var gl;   // webGL Rendering Context.  Created in main(), used everywhere.
var g_canvas; // our HTML-5 canvas object that uses 'gl' for drawing.
var g_digits = 5; // # of digits printed on-screen (e.g. x.toFixed(g_digits);
var flag = -1;
/**************************Everything I add is here************************/
space = new SpaceVBO();

var floatsPerVertex = 6;

// Camera's global variables
var g_EyeX = 0, g_EyeY = -4.5, g_EyeZ = 4.5; // 40 angle Eye position
var g_LookX = 0.0, g_LookY = 0.0, g_LookZ = 0.0;  // Look at position
var theta = 0; // Used to change view
var g_viewScale = 1.0; // zoom in / out scale
/***************************************************************************/


// For keyboard, mouse-click-and-drag: -----------------
var isDrag=false;		// mouse-drag: true when user holds down mouse button
var xMclik=0.0;			// last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;  

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
var g_partA = new PartSys(2.0,0.0,1.0, 0.0,0.0,0.0);   // create our first particle-system object;
                              // for code, see PartSys.js
var g_partB = new PartSys(3.0,0.0,1.0, 0.0,0.0,0.0);   // create our first particle-system object;
                              // for code, see PartSys.js


function main() {
//==============================================================================
  // Retrieve <canvas> element where we will draw using WebGL
  g_canvas = document.getElementById('webgl');
	gl = g_canvas.getContext("webgl", { preserveDrawingBuffer: true});
	// NOTE:{preserveDrawingBuffer: true} disables HTML-5default screen-clearing, 
	// so that our draw() function will over-write previous on-screen results 
	// until we call the gl.clear(COLOR_BUFFER_BIT); function. )
  if (!gl) {
    console.log('main() Failed to get the rendering context for WebGL');
    return;
  }  
	// Register the Keyboard & Mouse Event-handlers------------------------------
	// When users move, click or drag the mouse and when they press a key on the 
	// keyboard the operating system creates a simple text-based 'event' message.
	// Your Javascript program can respond to 'events' if you:
	// a) tell JavaScript to 'listen' for each event that should trigger an
	//   action within your program: call the 'addEventListener()' function, and 
	// b) write your own 'event-handler' function for each of the user-triggered 
	//    actions; Javascript's 'event-listener' will call your 'event-handler'
	//		function each time it 'hears' the triggering event from users.
	//
  // KEYBOARD:----------------------------------------------
  // The 'keyDown' and 'keyUp' events respond to ALL keys on the keyboard,
  //      including shift,alt,ctrl,arrow, pgUp, pgDn,f1,f2...f12 etc. 
	window.addEventListener("keydown", myKeyDown, false);
	// After each 'keydown' event, call the 'myKeyDown()' function.  The 'false' 
	// arg (default) ensures myKeyDown() call in 'bubbling', not 'capture' stage)
	// ( https://www.w3schools.com/jsref/met_document_addeventlistener.asp )
	window.addEventListener("keyup", myKeyUp, false);
	// Called when user RELEASES the key.  Now rarely used...
	// MOUSE:--------------------------------------------------
	// Create 'event listeners' for a few vital mouse events 
	// (others events are available too... google it!).  
	window.addEventListener("mousedown", myMouseDown); 
	// (After each 'mousedown' event, browser calls the myMouseDown() fcn.)
  window.addEventListener("mousemove", myMouseMove); 
	window.addEventListener("mouseup", myMouseUp);	
	window.addEventListener("click", myMouseClick);				
	window.addEventListener("dblclick", myMouseDblClick); 
	// Note that these 'event listeners' will respond to mouse click/drag 
	// ANYWHERE, as long as you begin in the browser window 'client area'.  
	// You can also make 'event listeners' that respond ONLY within an HTML-5 
	// element or division. For example, to 'listen' for 'mouse click' only
	// within the HTML-5 canvas where we draw our WebGL results, try:
	// g_canvasID.addEventListener("click", myCanvasClick);
  //
	// Wait wait wait -- these 'event listeners' just NAME the function called 
	// when the event occurs!   How do the functionss get data about the event?
	//  ANSWER1:----- Look it up:
	//    All event handlers receive one unified 'event' object:
	//	  https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
	//  ANSWER2:----- Investigate:
	// 		All Javascript functions have a built-in local variable/object named 
	//    'argument'.  It holds an array of all values (if any) found in within
	//	   the parintheses used in the function call.
  //     DETAILS:  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments
	// END Keyboard & Mouse Event-Handlers---------------------------------------

  gl.clearColor(0.25, 0.25, 0.25, 1);	// RGBA color for clearing WebGL framebuffer
  gl.clear(gl.COLOR_BUFFER_BIT);		  // clear it once to set that color as bkgnd.

//   // Initialize Particle systems:
//   g_partA.switchToMe()
  g_partA.initBouncy3D(1);
  g_partB.initBouncy3D(1);        
  g_partA.switchToMe();
  g_partB.switchToMe();
  printControls(); 	// Display (initial) particle system values as text on webpage
	
  // Quick tutorial on synchronous, real-time animation in JavaScript/HTML-5: 
  //  	http://creativejs.com/resources/requestanimationframe/
  //		--------------------------------------------------------
  // Why use 'requestAnimationFrame()' instead of the simple-to-use
  //	fixed-time setInterval() or setTimeout() functions?  Because:
  //		1) it draws the next animation frame 'at the next opportunity' instead 
  //			of a fixed time interval. It allows your browser and operating system
  //			to manage its own processes, power, and computing loads and respond to 
  //			on-screen window placement (skip battery-draining animation in any 
  //			window hidden behind others, or scrolled off-screen)
  //		2) it helps your program avoid 'stuttering' or 'jittery' animation
  //			due to delayed or 'missed' frames.  Your program can read and respond 
  //			to the ACTUAL time interval between displayed frames instead of fixed
  //		 	fixed-time 'setInterval()' calls that may take longer than expected.

  var spVerts = space.init(gl);
  if (spVerts < 0) {
    console.log('Failed to set the positions of the vertices2');
    return;
  }

//   var roofVerts = roofBox.init(gl);
//   if (roofVerts < 0) {
//     console.log('Failed to set the positions of the vertices3');
//     return;
//   }

  var tick = function() {
    g_timeStep = animate(); 
                      // find how much time passed (in milliseconds) since the
                      // last call to 'animate()'.
    if(g_timeStep > 200) {   // did we wait > 0.2 seconds? 
      // YES. That's way too long for a single time-step; somehow our particle
      // system simulation got stopped -- perhaps user switched to a different
      // browser-tab or otherwise covered our browser window's HTML-5 canvas.
      // Resume simulation with a normal-sized time step:
      g_timeStep = 1000/60;
      }
    // Update min/max for timeStep:
    if     (g_timeStep < g_timeStepMin) g_timeStepMin = g_timeStep;  
    else if(g_timeStep > g_timeStepMax) g_timeStepMax = g_timeStep;
  	drawAll(g_partA.partCount); // compute new particle state at current time
	drawAll(g_partB.partCount); // compute new particle state at current time
    requestAnimationFrame(tick, g_canvas);
                      // Call tick() again 'at the next opportunity' as seen by 
                      // the HTML-5 element 'g_canvas'.
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
  // Clear WebGL frame-buffer? (The 'c' or 'C' key toggles g_isClear between 0 & 1).
  if(g_isClear == 1) gl.clear(gl.COLOR_BUFFER_BIT);

// *** SURPRISE! ***
//  What happens when you forget (or comment-out) this gl.clear() call?
// In OpenGL (but not WebGL), you'd see 'trails' of particles caused by drawing 
// without clearing any previous drawing. But not in WebGL; by default, HTML-5 
// clears the canvas to white (your browser's default webpage color).  To see 
// 'trails' in WebGL you must disable the canvas' own screen clearing.  HOW?
// -- in main() where we create our WebGL drawing context, 
// replace this (default):  
//          gl = g_canvas.getContext("webgl");
// -- with this:
//          gl = g_canvas.getContext("webgl", { preserveDrawingBuffer: true});
// -- To learn more, see: 
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext

space.switchToMe();  // Set WebGL to render from this VBObox.
space.adjust();		 // Send new values for uniforms to the GPU, and
space.draw();		 // draw our VBO's contents using our shaders.
// update particle system state? 
  if(  g_partA.runMode > 1) {					// 0=reset; 1= pause; 2=step; 3=run
    // YES! advance particle system(s) by 1 timestep.
		if(g_partA.runMode == 2) { // (if runMode==2, do just one step & pause)
		  g_partA.runMode=1;	
		  }                                 
	g_partA.switchToMe();
    g_partA.applyForces(g_partA.s1, g_partA.forceList);  // find current net force on each particle
    g_partA.dotFinder(g_partA.s1dot, g_partA.s1); // find time-derivative s1dot from s1;
    g_partA.solver();         // find s2 from s1 & related states.
    g_partA.doConstraints();  // Apply all constraints.  s2 is ready!
  	g_partA.render();         // transfer current state to VBO, set uniforms, draw it!
    g_partA.swap();           // Make s2 the new current state s1.s
    //===========================================
    //===========================================
	  }
	else {    // runMode==0 (reset) or ==1 (pause): re-draw existing particles.
	  g_partA.render();
	  }

	  if(  g_partA.runMode > 1) {					// 0=reset; 1= pause; 2=step; 3=run
    // YES! advance particle system(s) by 1 timestep.
		if(g_partA.runMode == 2) { // (if runMode==2, do just one step & pause)
		  g_partA.runMode=1;	
		  }                                 
	g_partA.switchToMe();
    g_partA.applyForces(g_partA.s1, g_partA.forceList);  // find current net force on each particle
    g_partA.dotFinder(g_partA.s1dot, g_partA.s1); // find time-derivative s1dot from s1;
    g_partA.solver();         // find s2 from s1 & related states.
    g_partA.doConstraints();  // Apply all constraints.  s2 is ready!
  	g_partA.render();         // transfer current state to VBO, set uniforms, draw it!
    g_partA.swap();           // Make s2 the new current state s1.s
    //===========================================
    //===========================================
	  }
	else {    // runMode==0 (reset) or ==1 (pause): re-draw existing particles.
	  g_partA.render();
	  }
    // part A
	if(  g_partA.runMode > 1) {					// 0=reset; 1= pause; 2=step; 3=run
    // YES! advance particle system(s) by 1 timestep.
		if(g_partA.runMode == 2) { // (if runMode==2, do just one step & pause)
		  g_partA.runMode=1;	
		  }                                 
	g_partA.switchToMe();
    g_partA.applyForces(g_partA.s1, g_partA.forceList);  // find current net force on each particle
    g_partA.dotFinder(g_partA.s1dot, g_partA.s1); // find time-derivative s1dot from s1;
    g_partA.solver();         // find s2 from s1 & related states.
    g_partA.doConstraints();  // Apply all constraints.  s2 is ready!
  	g_partA.render();         // transfer current state to VBO, set uniforms, draw it!
    g_partA.swap();           // Make s2 the new current state s1.s
	}
	else {    // runMode==0 (reset) or ==1 (pause): re-draw existing particles.
	  g_partA.render();
	  }

	// part B
	if(  g_partB.runMode > 1) {					// 0=reset; 1= pause; 2=step; 3=run
		if(g_partB.runMode == 2) { // (if runMode==2, do just one step & pause)
			g_partB.runMode=1;	
			}                                 
	g_partB.switchToMe();
	g_partB.applyForces(g_partB.s1, g_partB.forceList);  // find current net force on each particle
	g_partB.dotFinder(g_partB.s1dot, g_partB.s1); // find time-derivative s1dot from s1;
	g_partB.solver();         // find s2 from s1 & related states.
	g_partB.doConstraints();  // Apply all constraints.  s2 is ready!
	g_partB.render();         // transfer current state to VBO, set uniforms, draw it!
	g_partB.swap();           // Make s2 the new current state s1.s
	}
	else {    // runMode==0 (reset) or ==1 (pause): re-draw existing particles.
		g_partB.render();
		}
	printControls();		// Display particle-system status on-screen. 
                      // Report mouse-drag totals since last re-draw:
	document.getElementById('MouseResult0').innerHTML=
			'Mouse Drag totals (CVV coords):\t' + xMdragTot.toFixed(g_digits)+
			                             ', \t' + yMdragTot.toFixed(g_digits);	
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
//	console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
	
	isDrag = false;											// CLEAR our mouse-dragging flag, and
	// accumulate any final bit of mouse-dragging we did:
	xMdragTot += (x - xMclik);
	yMdragTot += (y - yMclik);
//	console.log('myMouseUp: xMdragTot,yMdragTot =',xMdragTot.toFixed(g_digits),',\t', 
//	                                               yMdragTot.toFixed(g_digits));
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
//	console.log("myMouseClick() on button: ", ev.button); 
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
//	console.log("myMouse-DOUBLE-Click() on button: ", ev.button); 
}	

function myKeyDown(kev) {
//============================================================================
// Called when user presses down ANY key on the keyboard;
//
// For a light, easy explanation of keyboard events in JavaScript,
// see:    http://www.kirupa.com/html5/keyboard_events_in_javascript.htm
// For a thorough explanation of a mess of JavaScript keyboard event handling,
// see:    http://javascript.info/tutorial/keyboard-events
//
// NOTE: Mozilla deprecated the 'keypress' event entirely, and in the
//        'keydown' event deprecated several read-only properties I used
//        previously, including kev.charCode, kev.keyCode. 
//        Revised 2/2019:  use kev.key and kev.code instead.
//
/*
	// On console, report EVERYTHING about this key-down event:  
  console.log("--kev.code:",      kev.code,   "\t\t--kev.key:",     kev.key, 
              "\n--kev.ctrlKey:", kev.ctrlKey,  "\t--kev.shiftKey:",kev.shiftKey,
              "\n--kev.altKey:",  kev.altKey,   "\t--kev.metaKey:", kev.metaKey);
*/
  // On webpage, report EVERYTING about this key-down event:              
	document.getElementById('KeyDown').innerHTML = ''; // clear old result
  document.getElementById('KeyMod').innerHTML = ''; 
  document.getElementById('KeyMod' ).innerHTML = 
        "   --kev.code:"+kev.code   +"      --kev.key:"+kev.key+
    "<br>--kev.ctrlKey:"+kev.ctrlKey+" --kev.shiftKey:"+kev.shiftKey+
    "<br> --kev.altKey:"+kev.altKey +"  --kev.metaKey:"+kev.metaKey;  

  // RESET our g_timeStep min/max recorder on every key-down event:
  g_timeStepMin = g_timeStep;
  g_timeStepMax = g_timeStep;

  //===============================================================================
  var xd = g_EyeX - g_LookX;
  var yd = g_EyeY - g_LookY;
  var zd = g_EyeZ - g_LookZ;
  var lxy = Math.sqrt(xd * xd + yd * yd);
  var l = Math.sqrt(xd * xd + yd * yd + zd * zd);


  switch(kev.code) {
    case "Digit0":
			g_partA.runMode = 0;			// RESET!
			document.getElementById('KeyDown').innerHTML =  
			'myKeyDown() digit 0 key. Run Mode 0: RESET!';    // print on webpage,
			console.log("Run Mode 0: RESET!");                // print on console.
      break;
    case "Digit1":
			g_partA.runMode = 1;			// PAUSE!
			document.getElementById('KeyDown').innerHTML =  
			'myKeyDown() digit 1 key. Run Mode 1: PAUSE!';    // print on webpage,
			console.log("Run Mode 1: PAUSE!");                // print on console.
      break;
    case "Digit2":
			g_partA.runMode = 2;			// STEP!
			document.getElementById('KeyDown').innerHTML =  
			'myKeyDown() digit 2 key. Run Mode 2: STEP!';     // print on webpage,
			console.log("Run Mode 2: STEP!");                 // print on console.
      break;
    case "Digit3":
			g_partA.runMode = 3;			// RESET!
			document.getElementById('KeyDown').innerHTML =  
			'myKeyDown() digit 3 key. Run Mode 3: RUN!';      // print on webpage,
			console.log("Run Mode 3: RUN!");                  // print on console.
      break;
    case "KeyB":                // Toggle floor-bounce constraint type
			if(g_partA.bounceType==0) g_partA.bounceType = 1;   // impulsive vs simple
			else g_partA.bounceType = 0;
			document.getElementById('KeyDown').innerHTML =  
			'myKeyDown() b/B key: toggle bounce mode.';	      // print on webpage,
			console.log("b/B key: toggle bounce mode.");      // print on console. 
      break;
    case "KeyC":                // Toggle screen-clearing to show 'trails'
			g_isClear += 1;
			if(g_isClear > 1) g_isClear = 0;
			document.getElementById('KeyDown').innerHTML =  
			'myKeyDown() c/C key: toggle screen clear.';	 // print on webpage,
			console.log("c/C: toggle screen-clear g_isClear:",g_isClear); // print on console,
      break;
    case "KeyD":      // 'd'  INCREASE drag loss; 'D' to DECREASE drag loss
      if(kev.shiftKey==false) g_partA.drag *= 0.995; // permit less movement.
      else {
        g_partA.drag *= 1.0 / 0.995;
        if(g_partA.drag > 1.0) g_partA.drag = 1.0;  // don't let drag ADD energy!
        }
		document.getElementById('KeyDown').innerHTML =  
		'myKeyDown() d/D key: grow/shrink drag.';	 // print on webpage,
	  console.log("d/D: grow/shrink drag:", g_partA.drag); // print on console,
      break;
    case "KeyF":    // 'f' or 'F' to toggle particle fountain on/off
      g_partA.isFountain += 1;
      if(g_partA.isFountain > 1) g_partA.isFountain = 0;
	  document.getElementById('KeyDown').innerHTML =  
	  "myKeyDown() f/F key: toggle age constraint (fountain).";	// print on webpage,
			console.log("F: toggle age constraint (fountain)."); // print on console,
      break;
    case "KeyG":    // 'g' to REDUCE gravity; 'G' to increase.
      if(kev.shiftKey==false) 		g_partA.grav *= 0.99;		// shrink 1%
      else                        g_partA.grav *= 1.0/0.98; // grow 2%
	  document.getElementById('KeyDown').innerHTML =  
	  'myKeyDown() g/G key: shrink/grow gravity.';	 			// print on webpage,
	  console.log("g/G: shrink/grow gravity:", g_partA.grav); 	// print on console,
      break;
    case "KeyM":    // 'm' to REDUCE mass; 'M' to increase.
      if(kev.shiftKey==false)     g_partA.mass *= 0.98;   // shrink 2%
      else                        g_partA.mass *= 1.0/0.98; // grow 2%  
	  document.getElementById('KeyDown').innerHTML =  
	  'myKeyDown() m/M key: shrink/grow mass.';	 				      // print on webpage,
	  console.log("m/M: shrink/grow mass:", g_partA.mass); 		// print on console,
      break;
	case "KeyP":
	  if(g_partA.runMode == 3) g_partA.runMode = 1;		// if running, pause
						  else g_partA.runMode = 3;		          // if paused, run.
	  document.getElementById('KeyDown').innerHTML =  
			  'myKeyDown() p/P key: toggle Pause/unPause!';    // print on webpage
	  console.log("p/P key: toggle Pause/unPause!");   			// print on console,
			break;
    case "KeyR":    // r/R for RESET: 
      if(kev.shiftKey==false) {   // 'r' key: SOFT reset; boost velocity only
  		  g_partA.runMode = 3;  // RUN!
        var j=0; // array index for particle i
        for(var i = 0; i < g_partA.partCount; i += 1, j+= PART_MAXVAR) {
          g_partA.roundRand();  // make a spherical random var.
    			if(  g_partA.s2[j + PART_XVEL] > 0.0) // ADD to positive velocity, and 
    			     g_partA.s2[j + PART_XVEL] += 1.7 + 0.4*g_partA.randX*g_partA.INIT_VEL;
    			                                      // SUBTRACT from negative velocity: 
    			else g_partA.s2[j + PART_XVEL] -= 1.7 + 0.4*g_partA.randX*g_partA.INIT_VEL; 

    			if(  g_partA.s2[j + PART_YVEL] > 0.0) 
    			     g_partA.s2[j + PART_YVEL] += 1.7 + 0.4*g_partA.randY*g_partA.INIT_VEL; 
    			else g_partA.s2[j + PART_YVEL] -= 1.7 + 0.4*g_partA.randY*g_partA.INIT_VEL;

    			if(  g_partA.s2[j + PART_ZVEL] > 0.0) 
    			     g_partA.s2[j + PART_ZVEL] += 1.7 + 0.4*g_partA.randZ*g_partA.INIT_VEL; 
    			else g_partA.s2[j + PART_ZVEL] -= 1.7 + 0.4*g_partA.randZ*g_partA.INIT_VEL;
    			}
      }
      else {      // HARD reset: position AND velocity, BOTH state vectors:
  		  g_partA.runMode = 0;			// RESET!
        // Reset state vector s1 for ALL particles:
        var j=0; // array index for particle i
        for(var i = 0; i < g_partA.partCount; i += 1, j+= PART_MAXVAR) {
              g_partA.roundRand();
        			g_partA.s2[j + PART_XPOS] =  -0.9;      // lower-left corner of CVV
        			g_partA.s2[j + PART_YPOS] =  -0.9;      // with a 0.1 margin
        			g_partA.s2[j + PART_ZPOS] =  0.0;	
        			g_partA.s2[j + PART_XVEL] =  3.7 + 0.4*g_partA.randX*g_partA.INIT_VEL;	
        			g_partA.s2[j + PART_YVEL] =  3.7 + 0.4*g_partA.randY*g_partA.INIT_VEL; // initial velocity in meters/sec.
              g_partA.s2[j + PART_ZVEL] =  3.7 + 0.4*g_partA.randZ*g_partA.INIT_VEL;
              // do state-vector s2 as well: just copy all elements of the float32array.
              g_partA.s2.set(g_partA.s1);
        } // end for loop
      } // end HARD reset
	  document.getElementById('KeyDown').innerHTML =  
	  'myKeyDown() r/R key: soft/hard Reset.';	// print on webpage,
	  console.log("r/R: soft/hard Reset");      // print on console,
      break;
		case "KeyS":
			if(g_partA.solvType == SOLV_EULER) g_partA.solvType = SOLV_OLDGOOD;  
			else g_partA.solvType = SOLV_EULER;     
			document.getElementById('KeyDown').innerHTML =  
			'myKeyDown() found s/S key. Switch solvers!';       // print on webpage.
		  console.log("s/S: Change Solver:", g_partA.solvType); // print on console.
			break;
		case "Space":
      g_partA.runMode = 2;
	  document.getElementById('KeyDown').innerHTML =  
	  'myKeyDown() found Space key. Single-step!';   // print on webpage,
      console.log("SPACE bar: Single-step!");        // print on console.
      break;
		case "ArrowLeft": 	
			if (flag == -1) theta = -Math.acos(xd / lxy) + 0.1;
			else theta = theta + 0.1;
			g_LookX = g_EyeX + lxy * Math.cos(theta);
			g_LookY = g_EyeY + lxy * Math.sin(theta);
			flag = 1;
			break;
		case "ArrowRight":
			if (flag == -1) theta = -Math.acos(xd / lxy) - 0.1;
            else theta = theta - 0.1;
            g_LookX = g_EyeX + lxy * Math.cos(theta);
            g_LookY = g_EyeY + lxy * Math.sin(theta);
            flag = 1;
            break;	
		case "ArrowUp":		
			cg_AtX = g_LookX - 0.1 * (xd / l);
			g_AtY = g_LookY - 0.1 * (yd / l);
			g_AtZ = g_LookZ - 0.1 * (zd / l);

			g_EyeX = g_EyeX - 0.1 * (xd / l);
			g_EyeY = g_EyeY - 0.1 * (yd / l);
			g_EyeZ = g_EyeZ - 0.1 * (zd / l);
			break;
		case "ArrowDown":
			g_LookX = g_LookX + 0.1 * (xd / l);
            g_LookY = g_LookY + 0.1 * (yd / l);
            g_LookZ = g_LookZ + 0.1 * (zd / l);

            g_EyeX = g_EyeX + 0.1 * (xd / l);
            g_EyeY = g_EyeY + 0.1 * (yd / l);
            g_EyeZ = g_EyeZ + 0.1 * (zd / l);
            break;	
    default:
  		document.getElementById('KeyDown').innerHTML =
  			'myKeyDown():UNUSED,keyCode='+kev.keyCode;
  		console.log("UNUSED key:", kev.keyCode);
      break;
  }
}

function myKeyUp(kev) {
//=============================================================================
// Called when user releases ANY key on the keyboard.
// Rarely needed -- most code needs only myKeyDown().

	console.log("myKeyUp():\n--kev.code:",kev.code,"\t\t--kev.key:", kev.key);
}

function changeCamera(){
	//===============================================================================
	var dist_x = g_EyeX - g_LookX;
	var dist_y = g_EyeY - g_LookY;
	var dist_z = g_EyeZ - g_LookZ;

	var sq_xy = Math.sqrt(dist_x * dist_x + dist_y * dist_y);
	var sq_xyz = Math.sqrt(dist_x * dist_x + dist_y * dist_y + dist_z * dist_z);

	var thetax = theta + xMdragTot;
	var thetay = theta + yMdragTot;
	var thetaz = theta + Math.sqrt(xMdragTot * xMdragTot + yMdragTot * yMdragTot)

	g_LookX = g_EyeX + sq_xy * Math.cos(thetax);
    g_LookY = g_EyeY + sq_xy * Math.sin(thetax);
    g_LookZ = g_EyeZ + sq_xy * Math.sin(thetaz);
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
	g_partA.INIT_VEL *= 1.2;		// grow
	console.log('Initial velocity: '+g_partA.INIT_VEL);
}

function onMinusButton() {
//==============================================================================
	g_partA.INIT_VEL /= 1.2;		// shrink
	console.log('Initial velocity: '+g_partA.INIT_VEL);
}

