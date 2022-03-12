function VBObox1() {
    //=============================================================================
    //=============================================================================
    // CONSTRUCTOR for one re-usable 'VBObox0' object that holds all data and fcns
    // needed to render vertices from one Vertex Buffer Object (VBO) using one 
    // separate shader program (a vertex-shader & fragment-shader pair) and one
    // set of 'uniform' variables.
    
    // Constructor goal: 
    // Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
    // written into code) in all other VBObox functions. Keeping all these (initial)
    // values here, in this one coonstrutor function, ensures we can change them 
    // easily WITHOUT disrupting any other code, ever!
        this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
        'uniform mat4 u_ModelMatrix;\n' +
        'uniform mat4 u_ProjMatrix;\n' +      // Proj matrix
        'attribute vec4 a_Position;\n' +
        'attribute vec4 a_Color;\n' +
        'varying vec4 v_Color;\n' +
        'void main() {\n' +
        '  gl_Position = u_ProjMatrix * u_ModelMatrix * a_Position;\n' +
        '  gl_PointSize = 10.0;\n' +
        '  v_Color = a_Color;\n' +
        '}\n';
    
        this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
        //  '#ifdef GL_ES\n' +					
        'precision mediump float;\n' +
        //  '#endif GL_ES\n' +
        'varying vec4 v_Color;\n' +
        'void main() {\n' +
        '  gl_FragColor = v_Color;\n' +
        '}\n';


        makeGroundGrid();
        makeCube();

        this.mySize = gndVerts.length + cubVerts.length;
        this.vertices = new Float32Array(mySize);


        this.gndStart = 0;
        for (i = 0, j = 0; j < this.gndVerts.length; i++, j++) {
            this.vertices[i] = this.vertices[j];
        }
        this.cubeStart = i;
        for(j = 0; j < this.cubVerts.length;j ++, i ++){
          this.vertices[i] = this.cubVerts[j];
        }
        // console.log(this.wallStart);
    
        this.vboVerts = this.mySize / 6;	// 4800 of vertices held in 'vboContents' array
        this.FSIZE = this.vertices.BYTES_PER_ELEMENT; // 4
                                        // bytes req'd by 1 vboContents array element;
                                        // (why? used to compute stride and offset 
                                        // in bytes for vertexAttribPointer() calls)
        this.vboBytes = this.vertices.length * this.FSIZE;  // 4800 * 4             
                                        // total number of bytes stored in vboContents
                                        // (#  of floats in vboContents array) * 
                                        // (# of bytes/float).
        // console.log("vboBytes",this.vboBytes);
        this.vboStride = this.vboBytes / this.vboVerts; // 4800 * 4 / 4800 = 4
                                        // (== # of bytes to store one complete vertex).
                                        // From any attrib in a given vertex in the VBO, 
                                        // move forward by 'vboStride' bytes to arrive 
                                        // at the same attrib for the next vertex.  
        // console.log("vboStride",this.vboStride);
                            //----------------------Attribute sizes
        this.vboFcount_a_Position =  3;    // # of floats in the VBO needed to store the
        // attribute named a_Position. (3: x,y,z values)
        this.vboFcount_a_Color =  3;   // # of floats for this attrib (r,g,b values) 
        
        // console.log("vboVerts",this.vboVerts)
    
        console.assert((this.vboFcount_a_Position +     // check the size of each and
            this.vboFcount_a_Color) *   // every attribute in our VBO
            this.FSIZE == this.vboStride, // for agreeement with'stride'
            "Uh oh! VBObox0.vboStride disagrees with attribute-size values!");

        // console.log((this.vboFcount_a_Position +     // check the size of each and
        //     this.vboFcount_a_Color) * this.FSIZE)
    
                    //----------------------Attribute offsets  
        this.vboOffset_a_Position = 0;    // # of bytes from START of vbo to the START
        // of 1st a_Position attrib value in vboContents[]
        this.vboOffset_a_Color = this.vboFcount_a_Position * this.FSIZE;    
                                // (3floats * bytes/float) 
                                // # of bytes from START of vbo to the START
                                // of 1st a_Color attrib value in vboContents[]
        
                    //-----------------------GPU memory locations:
        this.vboLoc;						// GPU Location for Vertex Buffer Object, 
                                            // returned by gl.createBuffer() function call
        this.shaderLoc;						// GPU Location for compiled Shader-program  
                                            // set by compile/link of VERT_SRC and FRAG_SRC.
    
        this.a_Position;				    // GPU location for 'a_Position' attribute
        this.a_Color;				    // GPU location for 'a_Color' attribute
        
        /** ********************************* Here to add more uniforms **/
        /** ***********************************/
        this.modelMatrix = new Matrix4();
        this.u_ModelMatrix;
        this.projMatrix = new Matrix4();
        this.u_ProjMatrix;
        /** ***********************************/
        /** ********************************* **/
}

VBObox1.prototype.init = function() {
    //==============================================================================
    // Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
    // kept in this VBObox. (This function usually called only once, within main()).
    // Specifically:
    // a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
    //  executable 'program' stored and ready to use inside the GPU.  
    // b) create a new VBO object in GPU memory and fill it by transferring in all
    //  the vertex data held in our Float32array member 'VBOcontents'. 
    // c) Find & save the GPU location of all our shaders' attribute-variables and 
    //  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
    // -------------------
    // CAREFUL!  before you can draw pictures using this VBObox contents, 
    //  you must call this VBObox object's switchToMe() function too!
    //--------------------
    // a) Compile,link,upload shaders-----------------------------------------------
        this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
        if (!this.shaderLoc) {
        console.log(this.constructor.name + 
                                '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
      }
    // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
    //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}
    
        gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())
    
    // b) Create VBO on GPU, fill it------------------------------------------------
        this.vboLoc = gl.createBuffer();	
      if (!this.vboLoc) {
        console.log(this.constructor.name + 
                                '.init() failed to create VBO in GPU. Bye!'); 
        return;
      }
      
      // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
      //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
      // (positions, colors, normals, etc), or 
      //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
      // that each select one vertex from a vertex array stored in another VBO.
      gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
                                      this.vboLoc);				  // the ID# the GPU uses for this buffer.
                                                  
      // Fill the GPU's newly-created VBO object with the vertex data we stored in
      //  our 'vboContents' member (JavaScript Float32Array object).
      //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
      //	 use gl.bufferSubData() to modify VBO contents without changing VBO size)
      gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
                                          this.vboContents, 		// JavaScript Float32Array
                                       gl.STATIC_DRAW);			// Usage hint.  
      //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
      //	(see OpenGL ES specification for more info).  Your choices are:
      //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
      //				contents rarely or never change.
      //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
      //				contents may change often as our program runs.
      //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
      // 			times and then discarded; for rapidly supplied & consumed VBOs.
    
    // c1) Find All Attributes:-----------------------------------------------------
    //  Find & save the GPU location of all our shaders' attribute-variables and 
    //  uniform-variables (for switchToMe(), adjust(), draw(), reload(), etc.)
      this.a_Position = gl.getAttribLocation(this.shaderLoc, 'a_Position');
      if(this.a_Position < 0) {
        console.log(this.constructor.name + 
                                '.init() Failed to get GPU location of attribute a_Position');
        return -1;	// error exit.
      }

      this.a_Color = gl.getAttribLocation(this.shaderLoc, 'a_Color');
      if(this.a_Color < 0) {
        console.log(this.constructor.name + 
                                '.init() Failed to get GPU location of attribute a_Color');
        return -1;	// error exit.
      }

      // c2) Find All Uniforms:-----------------------------------------------------
      //Get GPU storage location for each uniform var used in our shader programs: 

      /** ********************************* Here to add more uniforms **/
     /** ***********************************/

     this.u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if(!this.u_ModelMatrix) {
  	    console.log('Failed to get u_ModelMatrix variable location');
  	    return;
    }
	this.u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
	if(!this.u_ProjMatrix) {
		console.log('Failed to get u_ProjMatrix variable location');
		return;
    }
      /** ***********************************/
      /** ********************************* **/
}

VBObox1.prototype.switchToMe = function () {
    //==============================================================================
    // Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
    //
    // We only do this AFTER we called the init() function, which does the one-time-
    // only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
    // even then, you are STILL not ready to draw our VBObox's contents onscreen!
    // We must also first complete these steps:
    //  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
    //  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
    //  c) tell the GPU to connect the shader program's attributes to that VBO.
    
    // a) select our shader program:
      gl.useProgram(this.shaderLoc);	
    //		Each call to useProgram() selects a shader program from the GPU memory,
    // but that's all -- it does nothing else!  Any previously used shader program's 
    // connections to attributes and uniforms are now invalid, and thus we must now
    // establish new connections between our shader program's attributes and the VBO
    // we wish to use.  
      
    // b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
    //  instead connect to our own already-created-&-filled VBO.  This new VBO can 
    //    supply values to use as attributes in our newly-selected shader program:
        gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer 
                                            this.vboLoc);			// the ID# the GPU uses for our VBO.
    
    // c) connect our newly-bound VBO to supply attribute variable values for each
    // vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
    // this sets up data paths from VBO to our shader units:
      // 	Here's how to use the almost-identical OpenGL version of this function:
        //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
      gl.vertexAttribPointer(
            this.a_Position,//index == ID# for the attribute var in GLSL shader pgm;
            this.vboFcount_a_Position, // # of floats used by this attribute: 1,2,3 or 4?
            gl.FLOAT,		  // type == what data type did we use for those numbers?
            false,				// isNormalized == are these fixed-point values that we need
                                        //									normalize before use? true or false
            this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
                          // stored attrib for this vertex to the same stored attrib
                          //  for the next vertex in our VBO.  This is usually the 
                                        // number of bytes used to store one complete vertex.  If set 
                                        // to zero, the GPU gets attribute values sequentially from 
                                        // VBO, starting at 'Offset'.	
                                        // (Our vertex size in bytes: 4 floats for pos + 3 for color)
            this.vboOffset_a_Position);						
                          // Offset == how many bytes from START of buffer to the first
                                      // value we will actually use?  (we start with position).
        gl.vertexAttribPointer(this.a_Color, this.vboFcount_a_Color, 
                        gl.FLOAT, false, 
                        this.vboStride, this.vboOffset_a_Color);
      //-- Enable this assignment of the attribute to its' VBO source:
      gl.enableVertexAttribArray(this.a_Position);
      gl.enableVertexAttribArray(this.a_Color);
}

VBObox1.prototype.isReady = function() {
    //==============================================================================
    // Returns 'true' if our WebGL rendering context ('gl') is ready to render using
    // this objects VBO and shader program; else return false.
    // see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter
    
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

VBObox1.prototype.adjust = function() {
    //==============================================================================
    // Update the GPU to newer, current values we now store for 'uniform' vars on 
    // the GPU; and (if needed) update each attribute's stride and offset in VBO.
    
      // check: was WebGL context set to use our VBO & shader program?
      if(this.isReady()==false) {
            console.log('ERROR! before' + this.constructor.name + 
                              '.adjust() call you needed to call this.switchToMe()!!');
      }
}

VBObox1.prototype.draw = function() {
    //=============================================================================
    // Send commands to GPU to select and render current VBObox contents.
    
      // check: was WebGL context set to use our VBO & shader program?
      if(this.isReady()==false) {
            console.log('ERROR! before' + this.constructor.name + 
                              '.draw() call you needed to call this.switchToMe()!!');
      }
      var vpAspect = g_canvas.width / (g_canvas.height);
	this.projMatrix.setPerspective(40, vpAspect, 1, 100);
	this.modelMatrix.setLookAt(g_EyeX, g_EyeY, g_EyeZ,        // eye position
		g_LookX, g_LookY, g_LookZ,   // look-at point 
		0, 0, 1);                    // up vector
	gl.uniformMatrix4fv(this.u_ModelMatrix, false, this.modelMatrix.elements);
	gl.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);

    //   var vpAspect = canvas.width / (canvas.height);
    //---------Pass the modified model matrix to our shaders:
    // gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    // Now, using these drawing axes, draw our ground plane: 
    gl.drawArrays(gl.LINES,             // use this drawing primitive, and
        0, // start at this vertex number, and
        this.gndVerts.length / 6);   // draw this many vertices

    gl.drawArrays(gl.LINE_LOOP,             // use this drawing primitive, and
          this.floorStart / 6, // start at this vertex number, and
          4);   // draw this many vertices

    gl.drawArrays(gl.LINES,             // use this drawing primitive, and
          this.floorStart / 6 + 4, // start at this vertex number, and
          8);   // draw this many vertices
    
    gl.drawArrays(gl.LINE_LOOP,             // use this drawing primitive, and
          this.floorStart / 6 + 4 + 8, // start at this vertex number, and
          4);   // draw this many vertices
    // console.log(this.wallVerts.length / 6);

}

VBObox1.prototype.reload = function() {
    //=============================================================================
    // Over-write current values in the GPU for our already-created VBO: use 
    // gl.bufferSubData() call to re-transfer some or all of our Float32Array 
    // contents to our VBO without changing any GPU memory allocations.
    
     gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                      0,                  // byte offset to where data replacement
                                          // begins in the VBO.
                    this.vboContents);   // the JS source-data array used to fill VBO
}

VBObox1.prototype.makeGroundPlane = function() {
 //==============================================================================
    // Create a list of vertices that create a large grid of lines in the x,y plane
    // centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

    var xcount = 500;     // # of lines to draw in x,y to make the grid.
    var ycount = 500;
    var xymax = 40.0;     // grid size; extends to cover +/-xymax in x and y.
    var xColr = Math.random()*0.5;  
    var yColr = Math.random() * 0.5; 

    // Create an (global) array to hold this ground-plane's vertices:
    this.gndVerts = new Float32Array(6 * 2 * (xcount + ycount));
    // draw a grid made of xcount+ycount lines; 2 vertices per line.

    var xgap = xymax / (xcount - 1);    // HALF-spacing between lines in x,y;
    var ygap = xymax / (ycount - 1);    // (why half? because v==(0line number/2))

    // First, step thru x values as we make vertical lines of constant-x:
    for (v = 0, j = 0; v < 2 * xcount; v++, j += 6) {
        if (v % 2 == 0) {  // put even-numbered vertices at (xnow, -xymax, 0)
            this.gndVerts[j] = -xymax + (v) * xgap;  // x
            this.gndVerts[j + 1] = -xymax;               // y
            this.gndVerts[j + 2] = 0.0;                  // z
        }
        else {        // put odd-numbered vertices at (xnow, +xymax, 0).
            this.gndVerts[j] = -xymax + (v - 1) * xgap;  // x
            this.gndVerts[j + 1] = xymax;                // y
            this.gndVerts[j + 2] = 0.0;                  // z
        }
        this.gndVerts[j + 3] = xColr;     // red
        this.gndVerts[j + 4] = yColr;     // grn
        this.gndVerts[j + 5] = 1;     // blu
    }
    // Second, step thru y values as wqe make horizontal lines of constant-y:
    // (don't re-initialize j--we're adding more vertices to the array)
    for (v = 0; v < 2 * ycount; v++, j += 6) {
        if (v % 2 == 0) {    // put even-numbered vertices at (-xymax, ynow, 0)
            this.gndVerts[j] = -xymax;               // x
            this.gndVerts[j + 1] = -xymax + (v) * ygap;  // y
            this.gndVerts[j + 2] = 0.0;                  // z
        }
        else {          // put odd-numbered vertices at (+xymax, ynow, 0).
            this.gndVerts[j] = xymax;                // x
            this.gndVerts[j + 1] = -xymax + (v - 1) * ygap;  // y
            this.gndVerts[j + 2] = 0.0;                  // z
        }
        this.gndVerts[j + 3] = xColr;     // red
        this.gndVerts[j + 4] = yColr;     // grn
        this.gndVerts[j + 5] = 1;     // blu
    }
        //
}

VBObox1.prototype.makeWalls = function() {
  this.wallVerts = new Float32Array([
    -0.93, -0.92, 0.0, 1.0, 1.0, 0.0,
    -0.93, 0.92, 0.0, 1.0, 1.0, 0.0,
    0.93, 0.92, 0.0, 1.0, 1.0, 0.0,
    0.93, -0.92, 0.0, 1.0, 1.0, 0.0, // LOOP for the floor

    -0.93, -0.92, 0.0, 1.0, 1.0, 0.0,
    -0.93, -0.92, 0.8, 1.0, 1.0, 0.0,

    -0.93, 0.92, 0.8, 1.0, 1.0, 0.0,
    -0.93, 0.92, 0.0, 1.0, 1.0, 0.0,

    0.93, -0.92, 0.8, 1.0, 1.0, 0.0,
    0.93, -0.92, 0.0, 1.0, 1.0, 0.0,

    0.93, 0.92, 0.0, 1.0, 1.0, 0.0,
    0.93, 0.92, 0.8, 1.0, 1.0, 0.0, // Lines for the pillars

    -0.93, -0.92, 0.8, 1.0, 1.0, 0.0,
    -0.93, 0.92, 0.8, 1.0, 1.0, 0.0,
    0.93, 0.92, 0.8, 1.0, 1.0, 0.0,
    0.93, -0.92, 0.8, 1.0, 1.0, 0.0, // LOOP for the Roof
 

     
     

    //  -0.93, -0.92, 0.0, 1.0, 1.0, 0.0,
    //  0.93, 0.92, 0.0, 1.0, 1.0, 0.0,
    //  0.93, -0.92, 0.0, 1.0, 1.0, 0.0,
    //  0.93, 0.92, 0.0, 1.0, 1.0, 0.0,
    //  -0.93, 0.92, 0.0, 1.0, 1.0, 0.0,
  ]);
}


