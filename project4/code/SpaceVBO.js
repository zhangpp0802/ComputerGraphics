  function drawGrid(){
    var floatsPerVertex = 7;
    var xcount = 1000;			// # of lines to draw in x,y to make the grid.
    var ycount = 1000;		
    var xymax	= 700.0;			// grid size; extends to cover +/-xymax in x and y.
    var xColr = new Float32Array([200/255, 186/255, 239/255]);	// gray
    //var yColr = new Float32Array([0.0, 1.0, 1.0]);	// bright blue
    var yColr = new Float32Array([0.1, 0.7, 0.7]);	// purple
    
    // Create an (global) array to hold this ground-plane's vertices:
    gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
    // draw a grid made of xcount+ycount lines; 2 vertices per line.
        
    var xgap = xymax/(xcount-1);		// HALF-spacing between lines in x,y;
    var ygap = xymax/(ycount-1);		// (why half? because v==(0line number/2))
    
    // First, step thru x values as we make vertical lines of constant-x:
    for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
    if(v%2==0) {	// put even-numbered vertices at (xnow, -xymax, 0)
      gndVerts[j  ] = -xymax + (v  )*xgap;	// x
      gndVerts[j+1] = -xymax;								// y
      gndVerts[j+2] = -1.0;									// z
      gndVerts[j+3] = 1.0;
    }
    else {				// put odd-numbered vertices at (xnow, +xymax, 0).
      gndVerts[j  ] = -xymax + (v-1)*xgap;	// x
      gndVerts[j+1] = xymax;								// y
      gndVerts[j+2] = -1.0;									// z
      gndVerts[j+3] = 1.0;
    }
    gndVerts[j+4] = xColr[0];			// red
    gndVerts[j+5] = xColr[1];			// grn
    gndVerts[j+6] = xColr[2];			// blu
    }
    // Second, step thru y values as wqe make horizontal lines of constant-y:
    // (don't re-initialize j--we're adding more vertices to the array)
    for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
    if(v%2==0) {		// put even-numbered vertices at (-xymax, ynow, 0)
      gndVerts[j  ] = -xymax;								// x
      gndVerts[j+1] = -xymax + (v  )*ygap;	// y
      gndVerts[j+2] = -1.0;									// z
      gndVerts[j+3] = 1.0;
    }
    else {					// put odd-numbered vertices at (+xymax, ynow, 0).
      gndVerts[j  ] = xymax;								// x
      gndVerts[j+1] = -xymax + (v-1)*ygap;	// y
      gndVerts[j+2] = -1.0;									// z
      gndVerts[j+3] = 1.0;
    }
    gndVerts[j+4] = yColr[0];			// red
    gndVerts[j+5] = yColr[1];			// grn
    gndVerts[j+6] = yColr[2];			// blu
    }

  }
  function gridVBO() {
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
    'attribute vec4 a_Position;\n' +
    'attribute vec3 a_Color;\n' +
    'uniform mat4 u_ModelMat;\n' +
    'varying vec3 v_Color;\n' +
    'void main() {\n' +
    '  gl_Position = u_ModelMat * a_Position;\n' +
    '  v_Color = a_Color;\n' +
    '}\n';
    
    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'varying vec3 v_Color;\n' +
    'void main() {\n' +
    '  gl_FragColor = vec4(v_Color,1.0);\n' +
    '}\n';
    
    drawGrid();

    this.vboContents =  gndVerts;
    
    this.vboVerts = gndVerts.length/7;						// # of vertices held in 'vboContents' array
    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
    this.vboBytes = this.vboContents.length * this.FSIZE;               
    this.vboStride = this.vboBytes/this.vboVerts;
    this.vboFcount_a_Pos0 =  4;   
    this.vboFcount_a_Colr0 = 3;  
    console.assert((this.vboFcount_a_Pos0 +     // check the size of each and
            this.vboFcount_a_Colr0) *   // every attribute in our VBO
            this.FSIZE == this.vboStride, // for agreeement with'stride'
            "Uh oh! VBObox0.vboStride disagrees with attribute-size values!");
    
    //----------------------Attribute offsets  
    this.vboOffset_a_Pos0 = 0;    
    this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;    
    //-----------------------GPU memory locations:
    this.vboLoc;								
    this.shaderLoc;							
    //------Attribute locations in our shaders:
    this.a_PosLoc;							
    this.a_ColrLoc;						
    
    //---------------------- Uniform locations &values in our shaders
    this.ModelMat = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_ModelMat;							// GPU location for u_ModelMat uniform


    this.Tx = 0.0;
    this.Ty = 0.0;
    this.Tz = -1.5;
  
    };
   
 gridVBO.prototype.init = function() {
  // Compile,link,upload shaders-----------------------------------------------
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
    console.log(this.constructor.name + 
          '.init() create executable Shaders on the GPU. Bye!');
    return;
    }
    gl.program = this.shaderLoc;
  
  // Create VBO on GPU, fill it------------------------------------------------
    this.vboLoc = gl.createBuffer();	
    if (!this.vboLoc) {
    console.log(this.constructor.name + 
          '.init() failed to create VBO in GPU. Bye!'); 
    return;
    }
    // Specify the purpose of our newly-created VBO on the GPU.  
    gl.bindBuffer(gl.ARRAY_BUFFER,	     
            this.vboLoc);				  
    console.log(this.vboLoc+ 
      'first bufferid for gridVBO');
    gl.bufferData(gl.ARRAY_BUFFER, 			
            this.vboContents, 		
            gl.STATIC_DRAW);			

    this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Position');
    if(this.a_PosLoc < 0) {
    console.log(this.constructor.name + 
          '.init() Failed to get GPU location of attribute a_Position');
    return -1;
    }
    this.a_ColrLoc = gl.getAttribLocation(this.shaderLoc, 'a_Color');
    if(this.a_ColrLoc < 0) {
    console.log(this.constructor.name + 
          '.init() failed to get the GPU location of attribute a_Color');
    return -1;
    }
  
   this.u_ModelMat = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat');
   if (!this.u_ModelMat) { 
     console.log('Failed to get the storage location of u_ModelMat');
     return;
   } 
  }

  gridVBO.prototype.switchToMe = function() {

    // We must also first complete these steps:
    //  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
    //  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
    //  c) tell the GPU to connect the shader program's attributes to that VBO.
      gl.useProgram(this.shaderLoc);
      gl.bindBuffer(gl.ARRAY_BUFFER,	    
                        this.vboLoc);			
      gl.vertexAttribPointer(
        this.a_PosLoc,
        this.vboFcount_a_Pos0,
        gl.FLOAT,		
        false,			
        this.vboStride,
        this.vboOffset_a_Pos0);						
      gl.vertexAttribPointer(this.a_ColrLoc, this.vboFcount_a_Colr0, 
                  gl.FLOAT, false, 
                  this.vboStride, this.vboOffset_a_Colr0);
      gl.enableVertexAttribArray(this.a_PosLoc);
      gl.enableVertexAttribArray(this.a_ColrLoc);

  }
  
  gridVBO.prototype.render = function() {
    // draw
    gl.drawArrays(gl.LINES,						
    0,	
    this.vboVerts);	
  
  }

  gridVBO.prototype.adjust = function(){


    this.ModelMat.setIdentity();
    this.ModelMat.set(camMatrix);	
    gl.uniformMatrix4fv(this.u_ModelMat, false, this.ModelMat.elements);

  }

  function cubeVBO(width,offset_x,offset_y,offset_z){
    this.VERT_SRC = 
    'precision highp float;                 \n' +        
    //
    'uniform mat4 u_ModelMat0;              \n' +
    'attribute vec4 a_Pos0;                 \n' +
    'attribute vec3 a_Colr0;                \n' +
    'varying vec3 v_Colr0;                  \n' +
    //
    'void main() {                          \n' +
    '  gl_Position = u_ModelMat0 * a_Pos0;  \n' +
    '  v_Colr0 = a_Colr0;                   \n' +
    ' }                                     \n';

    this.FRAG_SRC = 
    'precision mediump float;               \n' +
    'varying vec3 v_Colr0;                  \n' +
    'void main() {                          \n' +
    '  gl_FragColor = vec4(v_Colr0, 1.0);   \n' + 
    '}                                      \n';

    this.buildVertice(width,offset_x,offset_y,offset_z)
    this.drawCube();
    this.vboVerts = this.vboContents.length / 7;

    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
    console.log("F_Size :: ", this.FSIZE);

    this.vboBytes = this.vboContents.length * this.FSIZE;
    this.vboStride = this.vboBytes / this.vboVerts;
    this.vboFcount_a_Pos0 = 4;    
    this.vboFcount_a_Colr0 = 3;  
    console.assert((this.vboFcount_a_Pos0 +    
        this.vboFcount_a_Colr0) *   
        this.FSIZE == this.vboStride, 
        "Uh oh! VBObox0.vboStride disagrees with attribute-size values!");

    this.vboOffset_a_Pos0 = 0;  
    this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;
    this.vboLoc;                 
    this.shaderLoc;              
    this.a_PosLoc;               
    this.a_ColrLoc;             

    this.ModelMat = new Matrix4();  
    this.u_ModelMatLoc;             

  }
  cubeVBO.prototype.buildVertice = function(width,offset_x,offset_y,offset_z){
    this.V1 = new Vector3([width + offset_x, width + offset_y, width + offset_z]);
    this.V2 = new Vector3([width + offset_x, -width + offset_y, width + offset_z]);
    this.V3 = new Vector3([width + offset_x, -width + offset_y, -width + offset_z]);
    this.V4 = new Vector3([width + offset_x, width + offset_y, -width + offset_z]);
    this.V5 = new Vector3([-width + offset_x, width + offset_y, -width + offset_z]);
    this.V6 = new Vector3([-width + offset_x, width + offset_y, width + offset_z]);
    this.V7 = new Vector3([-width + offset_x, -width + offset_y, width + offset_z]);
    this.V8 = new Vector3([-width + offset_x, -width + offset_y, -width + offset_z]);
  }
  cubeVBO.prototype.drawCube = function(){
    this.vboContents = new Float32Array(
      [
        this.V1.elements[0], this.V1.elements[1], this.V1.elements[2], 1.0, 139/255, 184/255, 250/255,         
        this.V2.elements[0], this.V2.elements[1], this.V2.elements[2], 1.0, 139/255, 184/255, 250/255,          

        this.V2.elements[0], this.V2.elements[1], this.V2.elements[2], 1.0, 139/255, 184/255, 250/255,          
        this.V3.elements[0], this.V3.elements[1], this.V3.elements[2], 1.0, 139/255, 184/255, 250/255,          

        this.V3.elements[0], this.V3.elements[1], this.V3.elements[2], 1.0, 139/255, 184/255, 250/255,         
        this.V4.elements[0], this.V4.elements[1], this.V4.elements[2], 1.0, 139/255, 184/255, 250/255,          

        this.V4.elements[0], this.V4.elements[1], this.V4.elements[2], 1.0, 139/255, 184/255, 250/255,         
        this.V1.elements[0], this.V1.elements[1], this.V1.elements[2], 1.0, 139/255, 184/255, 250/255, 


        this.V4.elements[0], this.V4.elements[1], this.V4.elements[2], 1.0, 139/255, 184/255, 250/255,       
        this.V5.elements[0], this.V5.elements[1], this.V5.elements[2], 1.0, 139/255, 184/255, 250/255,        

        this.V5.elements[0], this.V5.elements[1], this.V5.elements[2], 1.0, 139/255, 184/255, 250/255,         
        this.V6.elements[0], this.V6.elements[1], this.V6.elements[2], 1.0, 139/255, 184/255, 250/255,          

        this.V6.elements[0], this.V6.elements[1], this.V6.elements[2], 1.0, 139/255, 184/255, 250/255,        
        this.V7.elements[0], this.V7.elements[1], this.V7.elements[2], 1.0, 139/255, 184/255, 250/255,        

        this.V7.elements[0], this.V7.elements[1], this.V7.elements[2], 1.0, 139/255, 184/255, 250/255,       
        this.V8.elements[0], this.V8.elements[1], this.V8.elements[2], 1.0, 139/255, 184/255, 250/255,        

        this.V8.elements[0], this.V8.elements[1], this.V8.elements[2], 1.0, 139/255, 184/255, 250/255,        
        this.V5.elements[0], this.V5.elements[1], this.V5.elements[2], 1.0, 139/255, 184/255, 250/255,        

        this.V8.elements[0], this.V8.elements[1], this.V8.elements[2], 1.0, 139/255, 184/255, 250/255,     
        this.V3.elements[0], this.V3.elements[1], this.V3.elements[2], 1.0, 139/255, 184/255, 250/255,         

        this.V7.elements[0], this.V7.elements[1], this.V7.elements[2], 1.0, 139/255, 184/255, 250/255,        
        this.V2.elements[0], this.V2.elements[1], this.V2.elements[2], 1.0, 139/255, 184/255, 250/255,      

        this.V6.elements[0], this.V6.elements[1], this.V6.elements[2], 1.0, 139/255, 184/255, 250/255,         
        this.V1.elements[0], this.V1.elements[1], this.V1.elements[2], 1.0, 139/255, 184/255, 250/255, 
      ]
    );
  }
  cubeVBO.prototype.init = function(){
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
        console.log(this.constructor.name +
            '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
    }

    gl.program = this.shaderLoc;   
    this.vboLoc = gl.createBuffer();
    if (!this.vboLoc) {
        console.log(this.constructor.name +
            '.init() failed to create VBO in GPU. Bye!');
        return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER,      
        this.vboLoc);       

    gl.bufferData(gl.ARRAY_BUFFER,        
        this.vboContents,     
        gl.STATIC_DRAW);      

    this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos0');
    if (this.a_PosLoc < 0) {
        console.log(this.constructor.name +
            '.init() Failed to get GPU location of attribute a_Pos0');
        return -1;  
    }

    this.a_ColrLoc = gl.getAttribLocation(this.shaderLoc, 'a_Colr0');
    if (this.a_ColrLoc < 0) {
        console.log(this.constructor.name +
            '.init() failed to get the GPU location of attribute a_Colr0');
        return -1;  
    }

    this.u_ModelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat0');
    if (!this.u_ModelMatLoc) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_ModelMat1 uniform');
        return;
    }
  }

  cubeVBO.prototype.switchToMe = function(){
    gl.useProgram(this.shaderLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER,         
        this.vboLoc);       

    gl.vertexAttribPointer(
        this.a_PosLoc,
        this.vboFcount_a_Pos0,
        gl.FLOAT,
        false,

        this.vboStride,

        this.vboOffset_a_Pos0);

    gl.vertexAttribPointer(this.a_ColrLoc, this.vboFcount_a_Colr0,
        gl.FLOAT, false,
        this.vboStride, this.vboOffset_a_Colr0);

    gl.enableVertexAttribArray(this.a_PosLoc);
    gl.enableVertexAttribArray(this.a_ColrLoc);
  }

  cubeVBO.prototype.isReady = function(){
    var isOK = true;

    if (gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc) {
        console.log(this.constructor.name +
            '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
    }
    if (gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name +
            '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
    }
    return isOK;
  }

  cubeVBO.prototype.adjust = function(){
    this.ModelMat.setIdentity();
    this.ModelMat.set(camMatrix);	
    gl.uniformMatrix4fv(this.u_ModelMatLoc, false, this.ModelMat.elements);
  }

  cubeVBO.prototype.render = function(){
    if (this.isReady() == false) {
      console.log('ERROR! before' + this.constructor.name +
          '.draw() call you needed to call this.switchToMe()!!');
  }

  gl.drawArrays(gl.LINES,
      0,
      this.vboVerts);
  }

  cubeVBO.prototype.reload = function(){
    gl.bufferSubData(gl.ARRAY_BUFFER,  
        0,                  
        this.vboContents);  
  }

