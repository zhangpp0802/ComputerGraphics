//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// built from RotatingTranslatedTriangle.js (c) 2012 matsuda
// and
// jtRotatingTranslatedTriangle.js  MODIFIED for CS 351-1, 
//									Northwestern Univ. Jack Tumblin
// Early Changes:
// -- converted to 2D->4D; 3 verts --> 6 verts, 2 triangles arranged as long 
//    rectangle with small gap fills one single Vertex Buffer Object (VBO);
// -- draw same rectangle over and over, but with different matrix tranforms
//    to construct a jointed 'robot arm'
// -- Make separately-numbered copies that build up arm step-by-step.
//
// LATER CHANGES: (2021)
//    Add global vars -- all will start with 'g', including: gl, g_canvasID,
//		g_vertCount, g_modelMatrix, uLoc_modelMatrix, etc.
// -- improve animation; better names, global vars, more time-varying values.
// -- simplify 'draw()': remove all args by using global vars;rename 'drawAll()'.
// -- create part-drawing functions that use current modelMatrix contents:
//		e.g. drawArm(), drawPincers(), to make 'instancing' easy. 
//

// Vertex shader program----------------------------------
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '}\n';
// Each instance computes all the on-screen attributes for just one VERTEX,
// specifying that vertex so that it can be used as part of a drawing primitive
// depicted in the CVV coord. system (+/-1, +/-1, +/-1) that fills our HTML5
// 'canvas' object.  The program gets all its info for that vertex through the
// 'attribute vec4' variable a_Position, which feeds us values for one vertex 
// taken from from the Vertex Buffer Object (VBO) we created inside the graphics
// hardware by calling the 'initVertexBuffers()' function.
//
//    ?What other vertex attributes can you set within a Vertex Shader? Color?
//    surface normal? reflectance? texture coordinates? texture ID#?
//    ?How could you set each of these attributes separately for each vertex in
//    our VBO?  Could you store them in the VBO? Use them in the Vertex Shader?

// Fragment shader program----------------------------------
var FSHADER_SOURCE =
  'void main() {\n' +
  '  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +
  '}\n';
//  Each instance computes all the on-screen attributes for just one PIXEL.
// Here we do the bare minimum: if we draw any part of any drawing primitive in 
// any pixel, we simply set that pixel to the constant color specified here.



// Global Variables  
//   (These are almost always a BAD IDEA, 
//		but here they eliminate lots of tedious function arguments. 
//    Later, collect them into just a few global, well-organized objects!)
// ============================================================================
// for WebGL usage:--------------------
var gl;													// WebGL rendering context -- the 'webGL' object
																// in JavaScript with all its member fcns & data
var g_canvasID;									// HTML-5 'canvas' element ID#. (was 'canvas')
var g_vertCount;								// # of vertices held by our VBO.(was 'n')
var g_modelMatrix;							// 4x4 matrix in JS; sets 'uniform' in GPU
var uLoc_modelMatrix;						// GPU location where this uniform is stored.

// For animation:---------------------
var g_lastMS = Date.now();			// Timestamp (in milliseconds) for our 
                                // most-recently-drawn WebGL screen contents.  
                                // Set & used by timerAll() fcn to update all
                                // time-varying params for our webGL drawings.
  // All of our time-dependent params (you can add more!)
                                //---------------
var g_angle0now  =   0.0;       // init Current rotation angle, in degrees
var g_angle0rate = -22.0;       // init Rotation angle rate, in degrees/second.
var g_angle0brake=	 1.0;				// init Speed control; 0=stop, 1=full speed.
var g_angle0min  =-140.0;       // init min, max allowed angle, in degrees.
var g_angle0max  =  40.0;
                                //---------------
var g_angle1now  =   0.0; 			// init Current rotation angle, in degrees > 0
var g_angle1rate =  64.0;				// init Rotation angle rate, in degrees/second.
var g_angle1brake=	 1.0;				// init Rotation start/stop. 0=stop, 1=full speed.
var g_angle1min  = -80.0;       // init min, max allowed angle, in degrees
var g_angle1max  =  80.0;
                                //---------------
var g_angle2now  =   0.0; 			// init Current rotation angle, in degrees.
var g_angle2rate =  89.0;				// init Rotation angle rate, in degrees/second.
var g_angle2brake=	 1.0;				// init Speed control; 0=stop, 1=full speed.
var g_angle2min  = -40.0;       // init min, max allowed angle, in degrees
var g_angle2max  = -20.0;			

var g_angle3now  =   0.0; 			// init Current rotation angle, in degrees.
var g_angle3rate =  31.0;				// init Rotation angle rate, in degrees/second.
var g_angle3brake=	 1.0;				// init Speed control; 0=stop, 1=full speed.
var g_angle3min  = -40.0;       // init min, max allowed angle, in degrees
var g_angle3max  =  40.0;			


// YOU can add more time-varying params of your own here -- try it!
// For example, could you add angle3, have it run without limits, and
// use sin(angle3) to slowly translate the robot-arm base horizontally,
// moving back-and-forth smoothly and sinusoidally?


function main() {
//==============================================================================
  // Retrieve the HTML-5 <canvas> element where webGL will draw our pictures:
  g_canvasID = document.getElementById('webgl');	
  // Create the the WebGL rendering context 'gl'. This huge JavaScript object 
  // contains the WebGL state machine adjusted by large sets of WebGL functions,
  // built-in variables & parameters, and member data. Every WebGL function call
  // will follow this format:  gl.WebGLfunctionName(args);
  //SIMPLE VERSION:  gl = getWebGLContext(g_canvasID); 
  // Here's a BETTER version:
  gl = g_canvasID.getContext("webgl", { preserveDrawingBuffer: true});
	// NOTE: we could just use:  gl = g_canvasID.getContext("webgl");
	// but this fancier-looking version disables HTML-5's default screen-clearing,
	// so that our draw() functions will over-write previous on-screen results 
	// until we call the gl.clear(COLOR_BUFFER_BIT); function. Try it! can you
	// make an on-screen button to enable/disable screen clearing? )
				 
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL. Bye!');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Write the positions of vertices into an array, transfer array contents into 
  // a Vertex Buffer Object created in the graphics hardware.
  initVertexBuffers(); // sets global var 'g_vertCount' (was local var 'n')
  if (g_vertCount < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(0, 0, 0, 1); // R,G,B, A==opacity)

  // Create our (global) model matrix; we will send its contents to GPU to
  // set the value of the uniform named 'u_modelMatrix'.
  g_modelMatrix = new Matrix4();
  // Get GPU storage location for u_ModelMatrix uniform 
  // (now a global var declared above main().  was 'u_ModelMatrix )
  uLoc_modelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!uLoc_modelMatrix) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

/*
  // ==============ANIMATION=============
  // Quick tutorials on synchronous, real-time animation in JavaScript/HTML-5: 
  //    https://webglfundamentals.org/webgl/lessons/webgl-animation.html
  //  or
  //  	http://creativejs.com/resources/requestanimationframe/
  //		--------------------------------------------------------
  // Why use 'requestAnimationFrame()' instead of the simpler-to-use
  //	fixed-time setInterval() or setTimeout() functions?  Because:
  //		1) it draws the next animation frame 'at the next opportunity' instead 
  //			of a fixed time interval. It allows your browser and operating system
  //			to manage its own processes, power, & computing loads, and to respond 
  //			to on-screen window placement (to skip battery-draining animation in 
  //			any window that was hidden behind others, or was scrolled off-screen)
  //		2) it helps your program avoid 'stuttering' or 'jittery' animation
  //			due to delayed or 'missed' frames.  Your program can read and respond 
  //			to the ACTUAL time interval between displayed frames instead of fixed
  //		 	fixed-time 'setInterval()' calls that may take longer than expected.
*/
  //------------------------------------  Define & run our animation:
  var tick = function() {		    // locally (within main() only), define our 
                                // self-calling animation function. 
    requestAnimationFrame(tick, g_canvasID); // browser callback request; wait
                                // til browser is ready to re-draw canvas, then
    timerAll();  				// Update all our time-varying params, and
    drawAll();          // Draw all parts using transformed VBObox contents
    };
  //------------------------------------
  tick();                       // do it again!  (endless loop)

}

function timerAll() {
//=============================================================================
// Find new values for all time-varying parameters used for on-screen drawing.
// HINT: this is ugly, repetive code!  Could you write a better version?
// 			 would it make sense to create a 'timer' or 'animator' class? Hmmmm...
//
  // use local variables to find the elapsed time:
  var nowMS = Date.now();             // current time (in milliseconds)
  var elapsedMS = nowMS - g_lastMS;   // 
  g_lastMS = nowMS;                   // update for next webGL drawing.
  if(elapsedMS > 1000.0) {            
    // Browsers won't re-draw 'canvas' element that isn't visible on-screen 
    // (user chose a different browser tab, etc.); when users make the browser
    // window visible again our resulting 'elapsedMS' value has gotten HUGE.
    // Instead of allowing a HUGE change in all our time-dependent parameters,
    // let's pretend that only a nominal 1/30th second passed:
    elapsedMS = 1000.0/30.0;
    }
  // Find new time-dependent parameters using the current or elapsed time:
  g_angle0now += g_angle0rate * g_angle0brake * (elapsedMS * 0.001);	// update.
  g_angle1now += g_angle1rate * g_angle1brake * (elapsedMS * 0.001);
  g_angle2now += g_angle2rate * g_angle2brake * (elapsedMS * 0.001);
  // apply angle limits:  going above max, or below min? reverse direction!
  // (!CAUTION! if max < min, then these limits do nothing...)
  if((g_angle0now >= g_angle0max && g_angle0rate > 0) || // going over max, or
  	 (g_angle0now <= g_angle0min && g_angle0rate < 0)  ) // going under min ?
  	 g_angle0rate *= -1;	// YES: reverse direction.
  if((g_angle1now >= g_angle1max && g_angle1rate > 0) || // going over max, or
  	 (g_angle1now <= g_angle1min && g_angle1rate < 0) )	 // going under min ?
  	 g_angle1rate *= -1;	// YES: reverse direction.
  if((g_angle2now >= g_angle2max && g_angle2rate > 0) || // going over max, or
  	 (g_angle2now <= g_angle2min && g_angle2rate < 0) )	 // going under min ?
  	 g_angle2rate *= -1;	// YES: reverse direction.
  if((g_angle3now >= g_angle3max && g_angle3rate > 0) || // going over max, or
  	 (g_angle3now <= g_angle3min && g_angle3rate < 0) )	 // going under min ?
  	 g_angle3rate *= -1;	// YES: reverse direction.
	// *NO* limits? Don't let angles go to infinity! cycle within -180 to +180.
	if(g_angle0min > g_angle0max)	
	{// if min and max don't limit the angle, then
		if(     g_angle0now < -180.0) g_angle0now += 360.0;	// go to >= -180.0 or
		else if(g_angle0now >  180.0) g_angle0now -= 360.0;	// go to <= +180.0
	}
	if(g_angle1min > g_angle1max)
	{
		if(     g_angle1now < -180.0) g_angle1now += 360.0;	// go to >= -180.0 or
		else if(g_angle1now >  180.0) g_angle1now -= 360.0;	// go to <= +180.0
	}
	if(g_angle2min > g_angle2max)
	{
		if(     g_angle2now < -180.0) g_angle2now += 360.0;	// go to >= -180.0 or
		else if(g_angle2now >  180.0) g_angle2now -= 360.0;	// go to <= +180.0
	}
	if(g_angle3min > g_angle3max)
	{
		if(     g_angle3now < -180.0) g_angle3now += 360.0;	// go to >= -180.0 or
		else if(g_angle3now >  180.0) g_angle3now -= 360.0;	// go to <= +180.0
	}
}

function initVertexBuffers() {
//==============================================================================
  var vertices = new Float32Array ([
     0.00, 0.00, 0.00, 1.00,		// first triangle   (x,y,z,w==1)
     0.19, 0.00, 0.00, 1.00,  
     0.0,  0.49, 0.00, 1.00,
     0.20, 0.01, 0.00, 1.00,		// second triangle
     0.20, 0.50, 0.00, 1.00,
     0.01, 0.50, 0.00, 1.00,
  ]);
  g_vertCount = 6;   // The number of vertices (now a global var; was 'n')

  // Create a buffer object in GPU; get its ID:
  var vertexBufferID = gl.createBuffer();
  if (!vertexBufferID) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // In GPU, bind the buffer object to target for reading vertices;
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferID);
  // Write JS vertex array contents into the buffer object on the GPU:
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  // On GPU, get location of vertex shader's 'a_position' attribute var
  var aLoc_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if(aLoc_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(aLoc_Position, 4, gl.FLOAT, false, 0, 0);
	// websearch yields OpenGL version: 
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml
				//	glVertexAttributePointer (
				//			index == which attribute variable will we use?
				//			size == how many dimensions for this attribute: 1,2,3 or 4?
				//			type == what data type did we use for those numbers?
				//			isNormalized == are these fixed-point values that we need
				//						normalize before use? true or false
				//			stride == #bytes (of other, interleaved data) between OUR values?
				//			pointer == offset; how many (interleaved) values to skip to reach
				//					our first value?
				//				)
  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(aLoc_Position);

	//  return n; // not needed anymore! using global 'g_vertCount'.
}

function drawAll() {
//==============================================================================
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Build our Robot Arm by successively moving our drawing axes
//=========================================
// REMINDER: keep Push/Pop matrix calls BALANCED!
// ?How? 	-- always introduce them in pairs, and
//				-- between them insert indented code for xforms & drawings, and
//				-- 'nest' them as deeply as necessary.
//				-- (cool! an orderly way to traverse scene graph, too!).
//				BUT
//				-- !!BEWARE!! never use any 'set' transform calls within them!
//						(you'll destroy your scene graph traversal!).
//				-- !!WARNING!! setIdentity(), setTranslate(), setRotate(), setScale()
//					 should NEVER be necessary in your code. NEVER!  However, they're
//					 quite convenient as a 'safety' at the start of the 'drawAll()' fcn,
//					 to ensure you're not affected by any previously set transforms.
// -----------------------------
/* EXAMPLES:
		g_modelMatrix.setIdentity();		// start with CVV drawing coords.
		pushMatrix(g_modelMatrix); 			// SAVE them,
				<INDENTED TRANSFORM & DRAWING CODE>;  
				<INDENTED TRANSFORM & DRAWING CODE>;  
		g_modelMatrix = popMatrix();		// RESTORE them.
-----------------
		pushMatrix(g_modelMatrix);
				<INDENTED TRANSFORM & DRAWING CODE>;  
				pushMatrix(g_modelMatrix);
						<INDENTED TRANSFORM & DRAWING CODE>;  
						<INDENTED TRANSFORM & DRAWING CODE>;  
				g_modelMatrix = popMatrix();
				<INDENTED TRANSFORM & DRAWING CODE>;
				pushMatrix(g_modelMatrix);
						<INDENTED TRANSFORM & DRAWING CODE>;  
						<INDENTED TRANSFORM & DRAWING CODE>;  
				g_modelMatrix = popMatrix();  
		g_modelMatrix = popMatrix();
---------------------
		pushMatrix(g_modelMatrix);
				<INDENTED TRANSFORM & DRAWING CODE>;  
				pushMatrix(g_modelMatrix);
						pushMatrix(g_modelMatrix);
								<INDENTED TRANSFORM & DRAWING CODE>;  
								<INDENTED TRANSFORM & DRAWING CODE>;  
						g_modelMatrix = popMatrix();
						pushMatrix(g_modelMatrix);
								<INDENTED TRANSFORM & DRAWING CODE>;  
								<INDENTED TRANSFORM & DRAWING CODE>;  
						g_modelMatrix = popMatrix(); 
						pushMatrix(g_modelMatrix);
								<INDENTED TRANSFORM & DRAWING CODE>;  
								<INDENTED TRANSFORM & DRAWING CODE>;  
						g_modelMatrix = popMatrix();
						<INDENTED TRANSFORM & DRAWING CODE>;  
				g_modelMatrix = popMatrix();
				<INDENTED TRANSFORM & DRAWING CODE>;
				pushMatrix(g_modelMatrix);
						<INDENTED TRANSFORM & DRAWING CODE>;  
						<INDENTED TRANSFORM & DRAWING CODE>;  
				g_modelMatrix = popMatrix();  
		g_modelMatrix = popMatrix();
--------------------------
*/

//========================================

  //-------Draw Lower Arm---------------
//	pushMatrix(g_modelMatrix);
		  g_modelMatrix.setTranslate(-0.4,-0.4, 0.0);  // 'set' means DISCARD old matrix,
		  						// (drawing axes centered in CVV), and then make new
		  						// drawing axes moved to the lower-left corner of CVV. 
		
		  g_modelMatrix.rotate(g_angle0now, 0, 0, 1);  // Make new drawing axes that
		  						// that spin around z axis (0,0,1) of the previous 
		  						// drawing axes, using the same origin.
		
		  //g_modelMatrix.rotate(3*g_angle0now, 0,1,0);  // SPIN ON Y AXIS!!!
			g_modelMatrix.translate(-0.1, 0,0);						// Move box so that we pivot
									// around the MIDDLE of it's lower edge, and not the left corner.
		
		  // DRAW BOX:  Use this matrix to transform & draw our VBO's contents:
		  		// Pass our current matrix to the vertex shaders:
		  gl.uniformMatrix4fv(uLoc_modelMatrix, false, g_modelMatrix.elements);
		  		// Draw the rectangle held in the VBO we created in initVertexBuffers().
		  gl.drawArrays(gl.TRIANGLES, 0, g_vertCount);	// draw all vertices.
//	g_modelMatrix = popMatrix();

  //-------Draw Upper Arm----------------
  g_modelMatrix.translate(0.1, 0.5, 0); 			// Make new drawing axes that
  						// we moved upwards (+y) measured in prev. drawing axes, and
  						// moved rightwards (+x) by half the width of the box we just drew.
  g_modelMatrix.scale(0.6,0.6,0.6);				// Make new drawing axes that
  						// are smaller that the previous drawing axes by 0.6.
  g_modelMatrix.rotate(g_angle1now, 0,0,1);	// Make new drawing axes that
  						// spin around Z axis (0,0,1) of the previous drawing 
  						// axes, using the same origin.
  g_modelMatrix.translate(-0.1, 0, 0);			// Make new drawing axes that
  						// move sideways by half the width of our rectangle model
  						// (REMEMBER! g_modelMatrix.scale() DIDN'T change the 
  						// the vertices of our model stored in our VBO; instead
  						// we changed the DRAWING AXES used to draw it. Thus
  						// we translate by the 0.1, not 0.1*0.6.)

  // DRAW BOX: Use this matrix to transform & draw our VBO's contents:
  gl.uniformMatrix4fv(uLoc_modelMatrix, false, g_modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 0, g_vertCount);	// draw all vertices.

  
  // DRAW PINCERS:====================================================
	g_modelMatrix.translate(0.1, 0.5, 0.0);	// Make new drawing axes at 
						  // the robot's "wrist" -- at the center top of upper arm
	
	// SAVE CURRENT DRAWING AXES HERE--------------------------
	//  copy current matrix so that we can return to these same drawing axes
	// later, when we draw the UPPER jaw of the robot pincer.  HOW?
	// Try a 'push-down stack'.  We want to 'push' our current g_modelMatrix
	// onto the stack to save it; then later 'pop' when we're ready to draw
	// the upper pincer.
	//----------------------------------------------------------
	pushMatrix(g_modelMatrix);
	//-----------------------------------------------------------
	// CAUTION!  Instead of our textbook's matrix library 
	//  (WebGL Programming Guide:  
	//
	//				lib/cuon-matrix.js
	//
	// be sure your HTML file loads this MODIFIED matrix library:
	//
	//				cuon-matrix-quat03.js
	// where Adrien Katsuya Tateno (former diligent classmate in EECS351)
	// has added push-down matrix-stack functions 'push' and 'pop'.
	//--------------------------------------------------------------
	//=========Draw lower jaw of robot pincer============================
	g_modelMatrix.rotate(g_angle2now, 0,0,1);		
						// make new drawing axes that rotate for lower-jaw

	g_modelMatrix.scale(0.4, 0.4, 0.4);		// Make new drawing axes that
						// have size of just 40% of previous drawing axes,
						// (Then translate? no need--we already have the box's 
						//	left corner at the wrist-point; no change needed.)

	// Draw inner lower jaw segment:				
  // DRAW BOX: Use this matrix to transform & draw our VBO's contents:
  gl.uniformMatrix4fv(uLoc_modelMatrix, false, g_modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 0, g_vertCount);	// draw all vertices.
	// Now move drawing axes to the centered end of that lower-jaw segment:
	g_modelMatrix.translate(0.1, 0.5, 0.0);
	g_modelMatrix.rotate(40.0, 0,0,1);		// make bend in the lower jaw
	g_modelMatrix.translate(-0.1, 0.0, 0.0);	// re-center the outer segment,
	// Draw outer lower jaw segment:				
  // DRAW BOX: Use this matrix to transform & draw our VBO's contents:
  gl.uniformMatrix4fv(uLoc_modelMatrix, false, g_modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 0, g_vertCount);	// draw all vertices.
  
  // RETURN to the saved drawing axes at the 'wrist':
	// RETRIEVE PREVIOUSLY-SAVED DRAWING AXES HERE:
// g_modelMatrix.printMe("before pop");
	//---------------------
	g_modelMatrix = popMatrix();
	//----------------------
// g_modelMatrix.printMe("AFTER");

	//=========Draw upper jaw of robot pincer============================
	// (almost identical to the way I drew the upper jaw)
	g_modelMatrix.rotate(-g_angle2now, 0,0,1);		
						// make new drawing axes that rotate upper jaw symmetrically
						// with lower jaw: changed sign of 15.0 and of 0.5
	g_modelMatrix.scale(0.4, 0.4, 0.4);		// Make new drawing axes that
						// have size of just 40% of previous drawing axes,
	g_modelMatrix.translate(-0.2, 0, 0);  // move box LEFT corner at wrist-point.
	
	// Draw inner upper jaw segment:				(same as for lower jaw)
  // DRAW BOX: Use this matrix to transform & draw our VBO's contents:
  gl.uniformMatrix4fv(uLoc_modelMatrix, false, g_modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 0, g_vertCount);	// draw all vertices.

	// Now move drawing axes to the centered end of that upper-jaw segment:
	g_modelMatrix.translate(0.1, 0.5, 0.0);
	g_modelMatrix.rotate(-40.0, 0,0,1);		// make bend in the upper jaw that
																			// is opposite of lower jaw (+/-40.0)
	g_modelMatrix.translate(-0.1, 0.0, 0.0);	// re-center the outer segment,
	 
	// Draw outer upper jaw segment:		(same as for lower jaw)		
  // DRAW BOX: Use this matrix to transform & draw our VBO's contents:
  gl.uniformMatrix4fv(uLoc_modelMatrix, false, g_modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 0, g_vertCount);	// draw all vertices.

}

//========================
//
// HTML BUTTON HANDLERS
//
//========================

function A0_runStop() {
//==============================================================================
  if(g_angle0brake > 0.5)	// if running,
  {
  	g_angle0brake = 0.0;	// stop, and change button label:
  	document.getElementById("A0button").value="Angle 0 OFF";
	}
  else 
  {
  	g_angle0brake = 1.0;	// Otherwise, go.
  	document.getElementById("A0button").value="Angle 0 ON-";
	}
}

function A1_runStop() {
//==============================================================================
  if(g_angle1brake > 0.5)	// if running,
  {
  	g_angle1brake = 0.0;	// stop, and change button label:
  	document.getElementById("A1button").value="Angle 1 OFF";
	}
  else 
  {
  	g_angle1brake = 1.0;	// Otherwise, go.
  	document.getElementById("A1button").value="Angle 1 ON-";
	}
}
function A2_runStop() {
//==============================================================================
  if(g_angle2brake > 0.5)	// if running,
  {
  	g_angle2brake = 0.0;	// stop, and change button label:
  	document.getElementById("A2button").value="Angle 2 OFF";
	}
  else 
  {
  	g_angle2brake = 1.0;	// Otherwise, go.
  	document.getElementById("A2button").value="Angle 2 ON-";
	}
}

function A3_runStop() {
//==============================================================================
  if(g_angle3brake > 0.5)	// if running,
  {
  	g_angle3brake = 0.0;	// stop, and change button label:
  	document.getElementById("A3button").value="Angle 3 OFF";
	}
  else 
  {
  	g_angle3brake = 1.0;	// Otherwise, go.
  	document.getElementById("A3button").value="Angle 3 ON-";
	}
}
