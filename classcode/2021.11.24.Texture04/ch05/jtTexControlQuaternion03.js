//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// From 2013 book "WebGL Programming Guide"
// Chapter 5: ColoredTriangle.js (c) 2012 matsuda  AND
// Chapter 4: RotatingTriangle_withButtons.js (c) 2012 matsuda AND
//	Lengyel 2012 book:"Mathematics for 3D Game Programming and Computer Graphics
// 										," 3rd Ed. Chapter 4 on quaternions,
// merged and modified to became:
//
// ControlQuaternion.js for EECS 351-1, 
//									Northwestern Univ. Jack Tumblin

//		--demonstrate several different user I/O methods: 
//				--Webpage pushbuttons and 'innerHTML' for text display
//				--Mouse click & drag within our WebGL-hosting 'canvas'
//		--demonstrate use of quaternions for user-controlled rotation
// -------------------------------------------------------
// 21016.03.04:  ADD TEXTURE to the tetrahedron; simple-as-possible texture,
//							borrow code from the Chap05 starter code TexturedQuadFILE.js
//					NOTE! Project B Starter Code page has useful diagrams of the
//								tetrahedron in '2016.02.17.HowToBuildTetrahedron01.pdf'
//					NOTE! On that same page, StarterCode_Week06_Shading1.zip file
//								adds surface-normals attributes to the tetrahedrons; you
//								will need something similar when you add texture coords. 
//	Ver01: Add texture coordinates to each vertex in the Vertex Buffer Object;
//					update the gl.vertexAttributePointer() calls to ensure we correctly 
//					access the new Vertex Buffer Object contents.
//	Ver02: Comment out call to 'testQuaternions()' that fills console w/ text. 
//					Delete old commented-out code in initVertexBufferObjects(); create
//					new vertex attribute for texture coords in shaders.
//	Ver03: Create 'texture sampler' uniforms for Fragment shader to find texel
//					addresses for each fragment (each on-screen pixel); texture2D()
//					retrieves actual texel color we use for each fragment. Test--OK. 		
//					Create 'initTexture()' fcn to set up callbacks for file loading,
//					Create 'loadTexture() to properly xfer texture image to GPU buffer

// Vertex shader program----------------------------------
var VSHADER_SOURCE = 
  'uniform mat4 u_ModelMatrix;\n' +		// uniform values sent from JavaScript
	//
  'attribute vec4 a_Position;\n' +		// vertex attribute values sent from VBO
  'attribute vec4 a_Color;\n' +
	'attribute vec2 a_TexCoord;\n' +
	//
  'varying vec4 v_Color;\n' +					// values to interpolate for Frag Shaders
	'varying vec2 v_TexCoord;\n' +
	//
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '  v_Color = a_Color;\n' +				// set up interpolation between vertices for
  '  v_TexCoord = a_TexCoord;\n' +	// both color and texture coordinates.
  '}\n';

// Fragment shader program----------------------------------
var FSHADER_SOURCE = 
//  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
//  '#endif GL_ES\n' +
  'varying vec4 v_Color;\n' +		// the interpolated vertex color for this pixel
	'varying vec2 v_TexCoord;\n' + // interpolated texture coords for this pixel
  'uniform sampler2D u_Sampler;\n' +	// claim a perspective-texture-addr calc
  'void main() {\n' +			
			// set pixel color to avg of texture color and (interpolated) vertex color
  '  gl_FragColor = 0.5*(v_Color + texture2D(u_Sampler, v_TexCoord));\n' +
  '}\n';

// Global Variables for the spinning tetrahedron:
var ANGLE_STEP = 45.0;  // default rotation angle rate (deg/sec)

// Global vars for mouse click-and-drag for rotation.
var isDrag=false;		// mouse-drag: true when user holds down mouse button
var xMclik=0.0;			// last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;  

var qNew = new Quaternion(0,0,0,1); // most-recent mouse drag's rotation
var qTot = new Quaternion(0,0,0,1);	// 'current' orientation (made from qNew)
var quatMatrix = new Matrix4();				// rotation matrix, made from latest qTot

function main() {
//==============================================================================
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Initialize a Vertex Buffer in the graphics system to hold our vertices
  var n = initVertexBuffer(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information.');
    return;
  }
  // Load textures into GPU buffer & link it to our texture coords.
  if (!initTextures(gl, n)) {
    console.log('Failed to properly load texture(s) into GPU memory buffer!');
    return;
  }
	// Register the Mouse & Keyboard Event-handlers-------------------------------
	// If users press any keys on the keyboard or move, click or drag the mouse,
	// the operating system records them as 'events' (small text strings that 
	// can trigger calls to functions within running programs). JavaScript 
	// programs running within HTML webpages can respond to these 'events' if we:
	//		1) write an 'event handler' function (called when event happens) and
	//		2) 'register' that function--connect it to the desired HTML page event. //
	// Here's how to 'register' all mouse events found within our HTML-5 canvas:
  canvas.onmousedown	=	function(ev){myMouseDown( ev, gl, canvas) }; 
  					// when user's mouse button goes down, call mouseDown() function
  canvas.onmousemove = 	function(ev){myMouseMove( ev, gl, canvas) };
											// when the mouse moves, call mouseMove() function					
  canvas.onmouseup = 		function(ev){myMouseUp(   ev, gl, canvas)};
  					// NOTE! 'onclick' event is SAME as on 'mouseup' event
  					// in Chrome Brower on MS Windows 7, and possibly other 
  					// operating systems; thus I use 'mouseup' instead.
  
	// END Mouse & Keyboard Event-Handlers-----------------------------------
	
  // Specify the color for clearing <canvas>
  gl.clearColor(0.3, 0.3, 0.3, 1.0);		// dark grey

	// NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
	// unless the new Z value is closer to the eye than the old one..
	gl.depthFunc(gl.LEQUAL);			// default value--just so you know it's there.
	gl.enable(gl.DEPTH_TEST); 	  
	
  // Get GPU storage location for for the u_ModelMatrix uniform
  var uLoc_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!uLoc_ModelMatrix) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
  // Create our JavaScript 'model' matrix: 
  var modelMatrix = new Matrix4();

  // Create, init current rotation angle value in JavaScript
  var currentAngle = 0.0;
  
//====================================
//	testQuaternions();		// test fcn at end of file; prints plenty in console
//=====================================

  // ANIMATION: create 'tick' variable whose value is this function:
  //----------------- 
  var tick = function() {
    currentAngle = animate(currentAngle);  // Update the rotation angle
    draw(gl, n, currentAngle, modelMatrix, uLoc_ModelMatrix);   // Draw shapes
//    console.log('currentAngle=',currentAngle); // put text in console.
    requestAnimationFrame(tick, canvas);   
    									// Request that the browser re-draw the webpage
    									// (causes webpage to endlessly re-draw itself)
  };
  tick();							// start (and continue) animation: draw current image
	
}

function initVertexBuffer(gl) {
//==============================================================================
	var c30 = Math.sqrt(0.75);					// == cos(30deg) == sqrt(3) / 2
	var sq2	= Math.sqrt(2.0);						 

  var colorShapes = new Float32Array([
  // Vertex coordinates(x,y,z,w) and color (R,G,B) for a new color tetrahedron:
	//		Apex on +z axis; equilateral triangle base at z=0
/*	Nodes:
		 0.0,	 0.0, sq2, 1.0,			0.0, 	0.0,	1.0,	// Node 0 (apex, +z axis;  blue)
     c30, -0.5, 0.0, 1.0, 		1.0,  0.0,  0.0, 	// Node 1 (base: lower rt; red)
     0.0,  1.0, 0.0, 1.0,  		0.0,  1.0,  0.0,	// Node 2 (base: +y axis;  grn)
    -c30, -0.5, 0.0, 1.0, 		1.0,  1.0,  1.0, 	// Node 3 (base:lower lft; white
*/
// ADD TEXTURE COORDINATES TO EACH VERTEX:
//My Chosen pair of faces: f0,f1--------------------------------
// Face 0: (right side).  Face0, Face1 share edge between Node0 and Node 2.
//												Assign Node0 to tex coords (0,0); Node2 to (1,1);
//												   other 2 nodes: Node1 to (1,0); Node3 to (0,1).
     // Node 0 (apex, +z axis; 			color--blue, 				tex coord
          0.0,	 0.0, sq2, 1.0,			0.0, 	0.0,	1.0,		0.0, 0.0,
     // Node 1 (base: lower rt; red)
     			c30, -0.5, 0.0, 1.0, 			1.0,  0.0,  0.0,		1.0, 0.0,
     // Node 2 (base: +y axis;  grn)
     			0.0,  1.0, 0.0, 1.0,  		0.0,  1.0,  0.0,		1.0, 1.0, 
// Face 1: (left side). 	Face1, Face0 share edge between Node0 and Node 2.
//												Assign Node0 to tex coords (0,0); Node2 to (1,1);
//												   other 2 nodes: Node1 to (1,0); Node3 to (0,1).
		 // Node 0 (apex, +z axis;  blue)
		 			0.0,	 0.0, sq2, 1.0,			0.0, 	0.0,	1.0,		0.0, 0.0,
     // Node 2 (base: +y axis;  grn)
     			0.0,  1.0, 0.0, 1.0,  		0.0,  1.0,  0.0,		1.0, 1.0,
     // Node 3 (base:lower lft; white)
    			-c30, -0.5, 0.0, 1.0, 		1.0,  1.0,  1.0,		0.0, 1.0,
// The other pair of faces:-----------------------------
// Face 2: (lower side) Face2, Face3 share edge between Node1 and Node 3.
//												Assign Node1 to tex coords (0,0); Node3 to (1,1);
//												   other 2 nodes: Node0 to (0,1); Node2 to (1,0).
		 // Node 0 (apex, +z axis;  blue) 
		 			0.0,	 0.0, sq2, 1.0,			0.0, 	0.0,	1.0,		0.0, 1.0,
		// Node 3 (base:lower lft; white)
    			-c30, -0.5, 0.0, 1.0, 		1.0,  1.0,  1.0, 		1.0, 1.0,	
     // Node 1 (base: lower rt; red) 
     			c30, -0.5, 0.0, 1.0, 			1.0,  0.0,  0.0, 		0.0, 0.0,
// Face 3: (base side)  Face3, Face2 share edge between Node1 and Node 3.
//												Assign Node1 to tex coords (0,0); Node3 to (1,1);
//												   other 2 nodes: Node0 to (0,1); Node2 to (1,0).
    // Node 3 (base:lower lft; white)
    			-c30, -0.5, 0.0, 1.0, 		1.0,  1.0,  1.0, 		1.0, 1.0,
    // Node 2 (base: +y axis;  grn)
     			0.0,  1.0, 0.0, 1.0,  		0.0,  1.0,  0.0,		1.0, 0.0,
    // Node 1 (base: lower rt; red)
     			c30, -0.5, 0.0, 1.0, 			1.0,  0.0,  0.0, 		0.0, 0.0,
     
     	// Drawing Axes: Draw them using gl.LINES drawing primitive;
     	//--------------------------------------------------------------
     	// +x axis RED; +y axis GREEN; +z axis BLUE; origin: GRAY
		 	// (I added 'texture coords' to stay compatible with tetrahedron verts)
// X axis line 	(origin: gray -- endpoint: red. 			Texture Coords
		 0.0,  0.0,  0.0, 1.0,			0.3,  0.3,  0.3,			0.0, 	0.0, 
		 1.3,  0.0,  0.0, 1.0,			1.0,  0.3,  0.3,			0.0, 	0.0,
// Y axis line:	(origin: gray -- endpoint: green			Texture Coords
		 0.0,  0.0,  0.0, 1.0,    	0.3,  0.3,  0.3,			0.0,	0.0,
		 0.0,  1.3,  0.0, 1.0,			0.3,  1.0,  0.3,			0.0, 	0.0,
// Z axis line: (origin: gray -- endpoint: blue				Texture Coords
		 0.0,  0.0,  0.0, 1.0,			0.3,  0.3,  0.3,			0.0,	0.0,
		 0.0,  0.0,  1.3, 1.0,			0.3,  0.3,  1.0,			0.0,	0.0,
  ]);
  var nn = 18;		// 12 tetrahedron vertices, +  6 vertices for 'coord axes'.
  								// we can also draw any subset of verts we may want,
  								// such as the last 2 tetra faces.(onscreen at upper right)
//----------------------------------------
  // Create a buffer object to hold these vertices inside the graphics system
  var shapeBufferHandle = gl.createBuffer();  
  if (!shapeBufferHandle) {
    console.log('Failed to create the shape buffer object');
    return false;
  }
  // Bind the the buffer object to target:
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
  // Transfer data from Javascript array colorShapes to Graphics system VBO
  // (Use sparingly--may be slow if you transfer large shapes stored in files)
  gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);
  // gl.STATIC_DRAW?  a 'usage hint' for OpenGL/WebGL memory usage: says we 
  // won't change these stored buffer values, and use them solely for drawing.

  var FSIZE = colorShapes.BYTES_PER_ELEMENT; // how many bytes per stored value?
    
	// Connect POSITION attribute of vertices in our Vertex Buffer Object (VBO) 
	// to the 'a_Position' attribute variable in our Vertex Shader program:
	//--------------------------------------------------------------------------
	// Get the GPU memory location for the Shader attribute variable 'a_Position':
  var aLoc_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (aLoc_Position < 0) {
    console.log('Failed to get storage location of shader var: a_Position \n');
    return -1;
  }
  // Use that location to specify how to retrieve POSITION data from our VBO:
  gl.vertexAttribPointer(
  		aLoc_Position,// Location of Vertex Shader attribute to fill with data
  		4, 						// how many values? 1,2,3 or 4.  (we're using x,y,z,w)
  		gl.FLOAT, 		// data type for each value: usually gl.FLOAT
  		false, 				// did we supply fixed-point data + it needs normalizing?
  		FSIZE * 9, 		// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w,  r,g,b,  s,t) * bytes/value
  		0);						// Offset -- now many bytes from START of buffer to the
  									// first value we will actually use?
  gl.enableVertexAttribArray(aLoc_Position);  
  									// Enable assignment of vertex buffer object's position data
										//----------------------------------------------------------
	// Connect COLOR attribute of vertices in our Vertex Buffer Object (VBO) 
	// to the 'a_Position' attribute variable in our Vertex Shader program:
	//--------------------------------------------------------------------------
	// Get the GPU memory location for the Shader attribute variable 'a_Color':
  var aLoc_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(aLoc_Color < 0) {
    console.log('Failed to get storage location of shader var: a_Color\n');
    return -1;
  }
  // Use that location to specify how to retrieve COLOR data from our VBO:
  gl.vertexAttribPointer(
  		aLoc_Color, 		// Location of Vertex Shader attribute to fill with data
  		3, 							// how many values? 1,2,3 or 4. (we're using R,G,B)
  		gl.FLOAT, 			// data type for each value: usually gl.FLOAT
  		false, 					// did we supply fixed-point data + it needs normalizing?
  		FSIZE * 9, 			// Stride -- how many bytes used to store each vertex?
  										// (x,y,z,w,  r,g,b,  s,t) * bytes/value
  		FSIZE * 4);			// Offset -- how many bytes from START of buffer to the
  									// 1st value we will actually use? Need to skip over x,y,z,w
  gl.enableVertexAttribArray(aLoc_Color);  
  									// Enable assignment of vertex buffer object's position data
										// ---------------------------------------------------------
	// Connect TEXCOORD attribute of vertices in our Vertex Buffer Object(VBO) 
	// to the 'a_TexCoord' attribute variable in our Vertex Shader program:
	//--------------------------------------------------------------------------
	// Get GPU' memory location for the Shader attribute variable 'a_TexCoord'
	var aLoc_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
	if(aLoc_TexCoord < 0) {
		console.log('Failed to get storage location of shader var: a_TexCoord\n');
		return -1;
	}
	// Use that location to specify how to retrieve TEX COORD data from our VBO:
	gl.vertexAttribPointer(
			aLoc_TexCoord,	// Location of Vertex Shader attribute to fill with data
			2,							// How many values? 1,2,3 or 4. (we're using s,t coords)
			gl.FLOAT,				// data type for each value: usually gl.FLOAT
			false,					// did we supply fixed-point data + it needs normalizing?
			FSIZE * 9,			// Stride -- how many bytes used to store each vertex?
											// (x,y,z,w  r,g,b,  s,t) * bytes/value
			FSIZE * 7);			// Offset -- how many bytes from START of buffer to the
											// 1st value we actually use? Need to skip x,y,z,w,r,g,b 
	gl.enableVertexAttribArray(aLoc_TexCoord);
											// Enable assignment of VBO's TexCoord data
											//--------------------------------------------------------
	//--------------------------------DONE!
  // Unbind the vertex buffer object 
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return nn;
}

function initTextures(gl, n) {
//==============================================================================
// Initialize texture maps: load texture image from file into a texture buffer
	// in GPU memory, and connect that buffer to GPU's texture-map machinery:
  var texLoc = gl.createTexture();   // Create, save location of texture-buffer
											// object that will hold our texture image in GPU memory. 
  if (!texLoc) {
    console.log('Failed to create the texture-buffer object in GPU memory');
    return false;
  }

  // Get the GPU memory location of the Fragment Shader uniform 'u_Sampler'
  var uLoc_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
  if (!uLoc_Sampler) {
    console.log('Failed to get the GPU storage location of u_Sampler');
    return false;
  }
  var texImg = new Image();  						// Create a JavaScript image object:
  texImg.crossOrigin = "anonymous";			// Apply hack to get around security 
		//	prohibitions of loading image files from web-browser's machine (yours).
		// for details, see: https://hacks.mozilla.org/2011/11/using-cors-to-load-webgl-textures-from-cross-domain-images/
  if (!texImg) {
    console.log('Failed to create the JavaScript texture-image object');
    return false;
  }
  // Register an HTML event handler that gets called each time the web-browser 
	// loads or re-loads webpage (and re-reads the texture image texImg from 
	// file).   When that happens, this line ensures that we call 'loadTexture()':
  texImg.onload = function(){ loadTexture(gl,n,texLoc, uLoc_Sampler, texImg); };
	// set the filename used by loadTexture():
  texImg.src = '../resources/sky.jpg';
  return true;
}

function loadTexture(gl, n, texLoc, u_Sampler, texImg) {
//==============================================================================
// HTML event handler: this function gets called when browser re-loads webpage.
// It specifies HOW texture image file contents in JavaScript 'texImg' object  
// (created in initTextures() from the filename string in texImg.src member)
// will get its particular format read into the GPU for use as a texture.
// Nice step-by-step explanation: http://learningwebgl.com/blog/?p=507 
	// 
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis when
																							// you transfer it to the GPU.
  // Select, enable GPU's texture unit0 (there are more available) for our use:
  gl.activeTexture(gl.TEXTURE0);
  // Select the texLoc texture-buffer object we created in initTextures() as
	// the 'current' texture-object for use by texture unit 0:
  gl.bindTexture(gl.TEXTURE_2D, texLoc);
  // Specify how to the texture unit will 'filter' the texture (how to best 
	// approx texture color when the texture is greatly enlarged or reduced in 
	// size on-screen):
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // COPY the texture image held in JavaScript object 'texImg' to the GPU's
	// current texture-buffer object, found there at location 'texLoc'. 

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, texImg);
  
  // Set the value of the 'u_Sampler' uniform variable to indicate we are using 
	// texture-unit 0:
  gl.uniform1i(u_Sampler, 0);
	// WE'RE READY!  Now when we call 'draw()', it will apply the our texture to
	// the surfaces it draws on-screen.
}

function draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix) {
//==============================================================================
  // Clear <canvas>  colors AND the depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
// Great question from student:
// "?How can I get the screen-clearing color (or any of the many other state
//		variables of OpenGL)?  'glGet()' doesn't seem to work..."
// ANSWER: from WebGL specification page: 
//							https://www.khronos.org/registry/webgl/specs/1.0/
//	search for 'glGet()' (ctrl-f) yields:
//  OpenGL's 'glGet()' becomes WebGL's 'getParameter()'. Use it like this:
/*
	clrColr = new Float32Array(4);
	clrColr = gl.getParameter(gl.COLOR_CLEAR_VALUE);
	console.log("clear value:", clrColr);
*/

  //-------Draw Spinning Tetrahedron
  modelMatrix.setTranslate(-0.4,-0.4, 0.0);  // 'set' means DISCARD old matrix,
  						// (drawing axes centered in CVV), and then make new
  						// drawing axes moved to the lower-left corner of CVV. 
  modelMatrix.scale(1,1,-1);							// convert to left-handed coord sys
  																				// to match WebGL display canvas.
  modelMatrix.scale(0.5, 0.5, 0.5);
  						// if you DON'T scale, tetra goes outside the CVV; clipped!
  modelMatrix.rotate(currentAngle, 0, 1, 0);  // spin drawing axes on Y axis;

  //-----DRAW TETRA:  Use this matrix to transform & draw 
  //						the first set of vertices stored in our VBO:
  		// Pass our current matrix to the vertex shaders:
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  		// Draw triangles: start at vertex 0 and draw 12 vertices
  gl.drawArrays(gl.TRIANGLES, 0, 12);

  // NEXT, create different drawing axes, and...
  modelMatrix.setTranslate(0.3, 0.3, 0.0);  // 'set' means DISCARD old matrix,
  						// (drawing axes centered in CVV), and then make new
  						// drawing axes moved to the upper-left corner of CVV.
  modelMatrix.scale(1,1,-1);							// convert to left-handed coord sys
  																				// to match WebGL display canvas.
  modelMatrix.scale(0.3, 0.3, 0.3);				// Make it smaller.
  
  // Mouse-Dragging for Rotation:
	//-----------------------------
	// Attempt 1:  X-axis, then Y-axis rotation:
/*  						// First, rotate around x-axis by the amount of -y-axis dragging:
  modelMatrix.rotate(-yMdragTot*150.0, 1, 0, 0); // drag +/-1 to spin -/+120 deg.
  						// Then rotate around y-axis by the amount of x-axis dragging
	modelMatrix.rotate( xMdragTot*150.0, 0, 1, 0); // drag +/-1 to spin +/-120 deg.
				// Acts SENSIBLY if I always drag mouse to turn on Y axis, then X axis.
				// Acts WEIRDLY if I drag mouse to spin on X axis first, then Y axis.
				// ? Why is is 'backwards'? Duality again!
*/
	//-----------------------------
/*
	// Attempt 2: perp-axis rotation:
							// rotate on axis perpendicular to the mouse-drag direction:
	var dist = Math.sqrt(xMdragTot*xMdragTot + yMdragTot*yMdragTot);
							// why add 0.001? avoids divide-by-zero in next statement
							// in cases where user didn't drag the mouse.)
	modelMatrix.rotate(dist*150.0, -yMdragTot+0.0001, xMdragTot+0.0001, 0.0);
							// why axis (x,y,z) = (-yMdrag,+xMdrag,0)? 
							// -- to rotate around +x axis, drag mouse in -y direction.
							// -- to rotate around +y axis, drag mouse in +x direction.
				// Acts weirdly as rotation amounts get far from 0 degrees.
				// ?why does our intuition fail so quickly here? ANS: 'Gimbal lock'
*/
	//-------------------------------
	// Attempt 3: Quaternions:
	// DON'T use accumulate mouse-dragging to describe current rotation: 
	// accumulate quaternions instead.  See the mouse-drag callback function,
	// where each mouse-drag event creates a quaternion (qNew) that gets applied
	// to our current rotation qTot by quaternion-multiply. Here we convert
	// qTot to a rotation matrix, and use it to adjust current drawing axes:

	quatMatrix.setFromQuat(qTot.x, qTot.y, qTot.z, qTot.w);	// Quaternion-->Matrix
	modelMatrix.concat(quatMatrix);													// apply that matrix.

	
	//-------------------------------
	// Drawing:
	// Use the current ModelMatrix to transform & draw something new from our VBO:
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  // Draw the last 2 faces of our tetrahedron: starting at vertex #6,
  // draw the next 6 vertices using the 'gl.TRIANGLES' drawing primitive
  gl.drawArrays(gl.TRIANGLES, 6,6);
  // Next, use the gl.LINES drawing primitive on vertices 12 thru 18 to 
  // depict our current 'drawing axes' onscreen:
  gl.drawArrays(gl.LINES,12,6);				// start at vertex #12; draw 6 vertices

}

// Record the last time we called 'animate()':  (used for animation timing)
var g_last = Date.now();

function animate(angle) {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  
  // Update the current rotation angle (adjusted by the elapsed time)
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  if(newAngle > 180.0) newAngle = newAngle - 360.0;
  if(newAngle <-180.0) newAngle = newAngle + 360.0;
  return newAngle;
}

//==================HTML Button Callbacks======================
function spinUp() {
// Called when user presses the 'Spin >>' button on our webpage.
// ?HOW? Look in the HTML file (e.g. ControlMulti.html) to find
// the HTML 'button' element with onclick='spinUp()'.
  ANGLE_STEP += 25; 
}

function spinDown() {
// Called when user presses the 'Spin <<' button
 ANGLE_STEP -= 25; 
}

function runStop() {
// Called when user presses the 'Run/Stop' button
  if(ANGLE_STEP*ANGLE_STEP > 1) {
    myTmp = ANGLE_STEP;
    ANGLE_STEP = 0;
  }
  else {
  	ANGLE_STEP = myTmp;
  }
}

function clearMouse() {
// Called when user presses 'Clear' button on our webpage, just below the 
// 'xMdragTot,yMdragTot' display.
	xMdragTot = 0.0;
	yMdragTot = 0.0;
	document.getElementById('MouseText').innerHTML=
			'Mouse Drag totals (CVV x,y coords):\t'+
			 xMdragTot.toFixed(5)+', \t'+
			 yMdragTot.toFixed(5);	
}

function resetQuat() {
// Called when user presses 'Reset' button on our webpage, just below the 
// 'Current Quaternion' display.
  var res=5;
	qTot.clear();
	document.getElementById('QuatValue').innerHTML= 
														 '\t X=' +qTot.x.toFixed(res)+
														'i\t Y=' +qTot.y.toFixed(res)+
														'j\t Z=' +qTot.z.toFixed(res)+
														'k\t W=' +qTot.w.toFixed(res)+
														'<br>length='+qTot.length().toFixed(res);
}
//===================Mouse and Keyboard event-handling Callbacks

function myMouseDown(ev, gl, canvas) {
//==============================================================================
// Called when user PRESSES down any mouse button;
// 									(Which button?    console.log('ev.button='+ev.button);   )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
	
	isDrag = true;											// set our mouse-dragging flag
	xMclik = x;													// record where mouse-dragging began
	yMclik = y;
};


function myMouseMove(ev, gl, canvas) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

	if(isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'

	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);

	// find how far we dragged the mouse:
	xMdragTot += (x - xMclik);					// Accumulate change-in-mouse-position,&
	yMdragTot += (y - yMclik);
	// AND use any mouse-dragging we found to update quaternions qNew and qTot.
	//===================================================
	dragQuat(x - xMclik, y - yMclik);
	//===================================================
	xMclik = x;													// Make NEXT drag-measurement from here.
	yMclik = y;
	
	// Show it on our webpage, in the <div> element named 'MouseText':
	document.getElementById('MouseText').innerHTML=
			'Mouse Drag totals (CVV x,y coords):\t'+
			 xMdragTot.toFixed(5)+', \t'+
			 yMdragTot.toFixed(5);	
};

function myMouseUp(ev, gl, canvas) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
//	console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
	
	isDrag = false;											// CLEAR our mouse-dragging flag, and
	// accumulate any final bit of mouse-dragging we did:
	xMdragTot += (x - xMclik);
	yMdragTot += (y - yMclik);
//	console.log('myMouseUp: xMdragTot,yMdragTot =',xMdragTot,',\t',yMdragTot);

	// AND use any mouse-dragging we found to update quaternions qNew and qTot;
	dragQuat(x - xMclik, y - yMclik);

	// Show it on our webpage, in the <div> element named 'MouseText':
	document.getElementById('MouseText').innerHTML=
			'Mouse Drag totals (CVV x,y coords):\t'+
			 xMdragTot.toFixed(5)+', \t'+
			 yMdragTot.toFixed(5);	
};

function dragQuat(xdrag, ydrag) {
//==============================================================================
// Called when user drags mouse by 'xdrag,ydrag' as measured in CVV coords.
// We find a rotation axis perpendicular to the drag direction, and convert the 
// drag distance to an angular rotation amount, and use both to set the value of 
// the quaternion qNew.  We then combine this new rotation with the current 
// rotation stored in quaternion 'qTot' by quaternion multiply.  Note the 
// 'draw()' function converts this current 'qTot' quaternion to a rotation 
// matrix for drawing. 
	var res = 5;
	var qTmp = new Quaternion(0,0,0,1);
	
	var dist = Math.sqrt(xdrag*xdrag + ydrag*ydrag);
	// console.log('xdrag,ydrag=',xdrag.toFixed(5),ydrag.toFixed(5),'dist=',dist.toFixed(5));
	qNew.setFromAxisAngle(-ydrag + 0.0001, xdrag + 0.0001, 0.0, dist*150.0);
	// (why add tiny 0.0001? To ensure we never have a zero-length rotation axis)
							// why axis (x,y,z) = (-yMdrag,+xMdrag,0)? 
							// -- to rotate around +x axis, drag mouse in -y direction.
							// -- to rotate around +y axis, drag mouse in +x direction.
							
	qTmp.multiply(qNew,qTot);			// apply new rotation to current rotation. 
	//--------------------------
	// IMPORTANT! Why qNew*qTot instead of qTot*qNew? (Try it!)
	// ANSWER: Because 'duality' governs ALL transformations, not just matrices. 
	// If we multiplied in (qTot*qNew) order, we would rotate the drawing axes
	// first by qTot, and then by qNew--we would apply mouse-dragging rotations
	// to already-rotated drawing axes.  Instead, we wish to apply the mouse-drag
	// rotations FIRST, before we apply rotations from all the previous dragging.
	//------------------------
	// IMPORTANT!  Both qTot and qNew are unit-length quaternions, but we store 
	// them with finite precision. While the product of two (EXACTLY) unit-length
	// quaternions will always be another unit-length quaternion, the qTmp length
	// may drift away from 1.0 if we repeat this quaternion multiply many times.
	// A non-unit-length quaternion won't work with our quaternion-to-matrix fcn.
	// Matrix4.prototype.setFromQuat().
//	qTmp.normalize();						// normalize to ensure we stay at length==1.0.
	qTot.copy(qTmp);
	// show the new quaternion qTot on our webpage in the <div> element 'QuatValue'
	document.getElementById('QuatValue').innerHTML= 
														 '\t X=' +qTot.x.toFixed(res)+
														'i\t Y=' +qTot.y.toFixed(res)+
														'j\t Z=' +qTot.z.toFixed(res)+
														'k\t W=' +qTot.w.toFixed(res)+
														'<br>length='+qTot.length().toFixed(res);
};

function testQuaternions() {
//==============================================================================
// Test our little "quaternion-mod.js" library with simple rotations for which 
// we know the answers; print results to make sure all functions work as 
// intended.
// 1)  Test constructors and value-setting functions:

	var res = 5;
	var myQuat = new Quaternion(1,2,3,4);		
		console.log('constructor: myQuat(x,y,z,w)=', 
		myQuat.x, myQuat.y, myQuat.z, myQuat.w);
	myQuat.clear();
		console.log('myQuat.clear()=', 
		myQuat.x.toFixed(res), myQuat.y.toFixed(res), 
		myQuat.z.toFixed(res), myQuat.w.toFixed(res));
	myQuat.set(1,2, 3,4);
		console.log('myQuat.set(1,2,3,4)=', 
		myQuat.x.toFixed(res), myQuat.y.toFixed(res), 
		myQuat.z.toFixed(res), myQuat.w.toFixed(res));
		console.log('myQuat.length()=', myQuat.length().toFixed(res));
	myQuat.normalize();
		console.log('myQuat.normalize()=', 
		myQuat.x.toFixed(res), myQuat.y.toFixed(res), myQuat.z.toFixed(res), myQuat.w.toFixed(res));
		// Simplest possible quaternions:
	myQuat.setFromAxisAngle(1,0,0,0);
		console.log('Set myQuat to 0-deg. rot. on x axis=',
		myQuat.x.toFixed(res), myQuat.y.toFixed(res), myQuat.z.toFixed(res), myQuat.w.toFixed(res));
	myQuat.setFromAxisAngle(0,1,0,0);
		console.log('set myQuat to 0-deg. rot. on y axis=',
		myQuat.x.toFixed(res), myQuat.y.toFixed(res), myQuat.z.toFixed(res), myQuat.w.toFixed(res));
	myQuat.setFromAxisAngle(0,0,1,0);
		console.log('set myQuat to 0-deg. rot. on z axis=',
		myQuat.x.toFixed(res), myQuat.y.toFixed(res), myQuat.z.toFixed(res), myQuat.w.toFixed(res), '\n');
		
	myQmat = new Matrix4();
	myQuat.setFromAxisAngle(1,0,0, 90.0);	
		console.log('set myQuat to +90-deg rot. on x axis =',
		myQuat.x.toFixed(res), myQuat.y.toFixed(res), myQuat.z.toFixed(res), myQuat.w.toFixed(res));
	myQmat.setFromQuat(myQuat.x, myQuat.y, myQuat.z, myQuat.w);
		console.log('myQuat as matrix: (+y axis <== -z axis)(+z axis <== +y axis)');
		myQmat.printMe();
	
	myQuat.setFromAxisAngle(0,1,0, 90.0);	
		console.log('set myQuat to +90-deg rot. on y axis =',
		myQuat.x.toFixed(res), myQuat.y.toFixed(res), myQuat.z.toFixed(res), myQuat.w.toFixed(res));
	myQmat.setFromQuat(myQuat.x, myQuat.y, myQuat.z, myQuat.w);
		console.log('myQuat as matrix: (+x axis <== +z axis)(+z axis <== -x axis)');
		myQmat.printMe();

	myQuat.setFromAxisAngle(0,0,1, 90.0);	
		console.log('set myQuat to +90-deg rot. on z axis =',
		myQuat.x.toFixed(res), myQuat.y.toFixed(res), myQuat.z.toFixed(res), myQuat.w.toFixed(res));
	myQmat.setFromQuat(myQuat.x, myQuat.y, myQuat.z, myQuat.w);
		console.log('myQuat as matrix: (+x axis <== -y axis)(+y axis <== +x axis)');
		myQmat.printMe();

	// Test quaternion multiply: 
	// (q1*q2) should rotate drawing axes by q1 and then by q2;  it does!
	var qx90 = new Quaternion;
	var qy90 = new Quaternion;
	qx90.setFromAxisAngle(1,0,0,90.0);			// +90 deg on x axis
	qy90.setFromAxisAngle(0,1,0,90.0);			// +90 deg on y axis.
	myQuat.multiply(qx90,qy90);
		console.log('set myQuat to (90deg x axis) * (90deg y axis) = ',
		myQuat.x.toFixed(res), myQuat.y.toFixed(res), myQuat.z.toFixed(res), myQuat.w.toFixed(res));
	myQmat.setFromQuat(myQuat.x, myQuat.y, myQuat.z, myQuat.w);
	console.log('myQuat as matrix: (+x <== +z)(+y <== +x )(+z <== +y');
	myQmat.printMe();
}

