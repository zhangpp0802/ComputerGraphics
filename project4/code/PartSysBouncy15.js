var gl;
var g_canvas
var g_digits = 5;

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

var rad = 20;
var theta = 0;
var delta_z = 0;

var camMatrix = new Matrix4();
var current_rotation = 0;
var g_EyeX = -20;
var g_EyeY = 1.5;
var g_EyeZ = 3.5;
var currentSolver = -1;
var numberSolvers = 5;


var g_LookX = g_EyeX + rad;
var g_LookY = g_EyeY;
var g_LookZ = g_EyeZ-3;

var g_rotAngle = 0.0;
var updateRotAngle = false;
var updateRotAngleSign = 1;
var g_angleRate = 10.0;

solverType = SOLV_BACK_EULER;

// bouncy vars
var bouncyballCount = 300;
var bouncyGravity = true;

// boids vars
var partcount = 100;
var vel = 1;
var ka = 3;
var kv = 1;
var kc = 4;
var rad = 1.5;

// flame vars
var firecount = 600;

// spring vars
var kspring = 5.0;
var kdamp = 0.4;
var restL = 0.02;
var width = 10;
var height = 15;
var windForce = 0.1;
var springmeshGravity = false;

bouncyball = new PartSys(0.0,6.0,0.0);
boids = new PartSys(0.0,3.0,0.0);
flame = new PartSys(0.0,0.0,0.0);
springmesh = new PartSys(0.0, -3.0, 0.0);

grid = new gridVBO();
cubeBouncyBall = new cubeVBO(1.0, 0.0, 6.0, 0.0);
cubeBoids      = new cubeVBO(1.0, 0.0, 3.0, 0.0);
cubeSpringMesh = new cubeVBO(1.0, 0.0, -3.0, 0.0);
cubeFlame      = new cubeVBO(1.0, 0.0, 0.0, 0.0);

function main(){
    g_canvas = document.getElementById('webgl');
    gl = g_canvas.getContext('webgl',{preserveDrawingBuffer: true})
    if (!gl) {
        console.log('main() Failed to get the rendering context for WebGL');
        return;
      }

    window.addEventListener("keydown", myKeyDown, false);
    window.addEventListener("keyup", myKeyUp, false);
    window.addEventListener("mousedown", myMouseDown);
    window.addEventListener("mousemove", myMouseMove);
    window.addEventListener("mouseup", myMouseUp);
    window.addEventListener("click", myMouseClick);
    window.addEventListener("dblclick", myMouseDblClick);
    window.onload = Params();
    gl.clear(gl.COLOR_BUFFER_BIT);		  // clear it once to set that color as bkgnd.
    gl.enable(gl.DEPTH_TEST);

    grid.init();
    cubeBouncyBall.init();
    cubeSpringMesh.init();
    cubeBoids.init();
    cubeFlame.init();

    bouncyball.initBouncy3D(bouncyballCount,bouncyGravity,solverType);
    bouncyball.vboInit();

    springmesh.initSpringMesh(kspring, kdamp, height, width, restL, windForce/2, springmeshGravity, solverType);
    springmesh.vboInit();

    boids.initFlocking(partcount,ka,kv,kc,rad,vel,solverType);
    boids.vboInit();

    flame.initFireReeves(firecount,solverType);
    flame.vboInit();

    var tick = function() {
        g_timeStep = animate();
                          
        if(g_timeStep > 200) {   
          g_timeStep = 1000/60;
          }
        // Update min/max for timeStep:
        if     (g_timeStep < g_timeStepMin) g_timeStepMin = g_timeStep;
        else if(g_timeStep > g_timeStepMax) g_timeStepMax = g_timeStep;
        drawAll(); // compute new particle state at current time
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

      if (updateRotAngle == true) {
        g_rotAngle += g_angleRate * updateRotAngleSign * g_timeStep * 0.001;
      }
      return elapsed;
    }

function drawAll(){
    if (g_isClear == 1) gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    setCamera();
        grid.switchToMe();
        grid.adjust();
        grid.render();

        cubeBouncyBall.switchToMe();
        cubeBouncyBall.adjust();
        cubeBouncyBall.render();

        cubeBoids.switchToMe();
        cubeBoids.adjust();
        cubeBoids.render();

        cubeFlame.switchToMe();
        cubeFlame.adjust();
        cubeFlame.render();

        cubeSpringMesh.switchToMe();
        cubeSpringMesh.adjust();
        cubeSpringMesh.render();

        bouncyball.switchToMe();
        bouncyball.adjust(false);
        bouncyball.applyForces(bouncyball.s1,bouncyball.forceList);
        bouncyball.dotFinder(bouncyball.s1dot, bouncyball.s1);
        bouncyball.solver();
        bouncyball.doConstraints(bouncyball.s1,bouncyball.s2,bouncyball.limitList);
        bouncyball.render();
        bouncyball.swap();

        boids.switchToMe();
        boids.adjust(false);
        boids.applyForces(boids.s1,boids.forceList);
        boids.dotFinder(boids.s1dot,boids.s1);
        boids.solver();
        boids.doConstraints(boids.s1,boids.s2,boids.limitList);
        boids.render();
        boids.swap();

        flame.switchToMe();
        flame.adjust(true);
        flame.applyForces(flame.s1,flame.forceList);
        flame.dotFinder(flame.s1dot,flame.s1);
        flame.solver();
        flame.doConstraints(flame.s1,flame.s2,flame.limitList);
        flame.render();
        flame.swap();

        springmesh.switchToMe();
        springmesh.adjust(false);
        springmesh.applyForces(springmesh.s1,springmesh.forceList);
        springmesh.dotFinder(springmesh.s1dot, springmesh.s1);
        springmesh.solver();
        springmesh.doConstraints(springmesh.s1,springmesh.s2,springmesh.limitList);
        springmesh.render();
        springmesh.swap();



}
function setCamera() {

        camMatrix.setIdentity();
        camMatrix.perspective(35.0,  
                          1.0,   
                          1.0,  
                          100.0);  

        camMatrix.lookAt(  g_EyeX,   g_EyeY,   g_EyeZ,
						g_LookX,       g_LookY,  		g_LookZ,
						0,  			0,      		1);

    }
function moveForwardBackward(sign){
    var moveVel = 0.2;
    
    Dx = g_LookX - g_EyeX;
    Dy = g_LookY - g_EyeY;
    Dz = g_LookZ - g_EyeZ;
    var D = rad * moveVel;
    g_EyeX += sign * Dx * moveVel;
    g_EyeY += sign * Dy * moveVel;
    g_EyeZ += sign * Dz * moveVel;
    g_LookX += sign * Dx * moveVel;
    g_LookY += sign * Dy * moveVel;
    g_LookZ += sign * Dz * moveVel;
}

function moveLeftRight(sign){
    var moveVel = 0.1;

    v1 = new Vector3([g_LookX-g_EyeX,g_LookY-g_EyeY,g_LookZ-g_EyeZ]);
    v2 = new Vector3([0,0,1]);

    res = cross(v2,v1);
    dir = res[2];
    g_EyeX += sign * dir.elements[0] * moveVel;
    g_EyeY += sign * dir.elements[1] * moveVel;
    g_EyeZ += sign * dir.elements[2] * moveVel;
    g_LookX += sign * dir.elements[0] * moveVel;
    g_LookY += sign * dir.elements[1] * moveVel;
    g_LookZ += sign * dir.elements[2] * moveVel;
    
}

function moveAimLeftRight(sign){
    rotAngle = 0.05;
    theta += rotAngle * sign;
    g_LookX = g_EyeX + Math.cos(theta) * rad;
    g_LookY = g_EyeY + Math.sin(theta) * rad;
}

function moveAimUpDown(sign){
    rotAngle = 0.05;
    delta_z += rotAngle * sign;
    //console.log(delta_z)
    g_LookZ = g_EyeZ + Math.sin(delta_z) * rad;
    g_LookX = g_EyeX + Math.cos(delta_z) * rad;
}

function cross(v1,v2){
    x1 = v1.elements[0];
    y1 = v1.elements[1];
    z1 = v1.elements[2];

    x2 = v2.elements[0];
    y2 = v2.elements[1];
    z2 = v2.elements[2];

    normal = new Vector3([(y1*z2-y2*z1),-(x1*z2-x2*z1),(x1*y2-x2*y1)]);
    mag = Math.sqrt(Math.pow(normal.elements[0],2)+Math.pow(normal.elements[1],2)+Math.pow(normal.elements[2],2));
    dir = new Vector3([normal.elements[0]/mag,normal.elements[1]/mag,normal.elements[2]/mag]);
    return [normal,mag,dir]


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
    //   var xp = g_canvas.width-(ev.clientX - rect.left);									  // x==0 at canvas left edge
    //   var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge

      var xp = ev.clientX - rect.left;									  // x==0 at canvas left edge
      var yp = ev.clientY - rect.top;	// y==0 at canvas bottom edge
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
        //	document.getElementById('MouseResult1').innerHTML =
        //'myMouseDown() at CVV coords x,y = '+x.toFixed(g_digits)+
        //                                ', '+y.toFixed(g_digits)+'<br>';
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
    // var xp = g_canvas.width-(ev.clientX - rect.left);									  // x==0 at canvas left edge
    // var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge

    var xp = ev.clientX - rect.left;									  // x==0 at canvas left edge
    var yp = ev.clientY - rect.top;	// y==0 at canvas bottom edge
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
    var xp = g_canvas.width-(ev.clientX - rect.left);									  // x==0 at canvas left edge
    var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge

    var xp = ev.clientX - rect.left;									  // x==0 at canvas left edge
    var yp = ev.clientY - rect.top;	// y==0 at canvas bottom edge
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
    //document.getElementById('MouseResult1').innerHTML =
    //'myMouseUp() at CVV coords x,y = '+x+', '+y+'<br>';
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
    g_timeStepMin = g_timeStep;
    g_timeStepMax = g_timeStep;

    switch(kev.code) {
        case "KeyW":
            //translationOnCamera(1, false);
            moveForwardBackward(1);
        break;
        case "KeyS":
            moveForwardBackward(-1);
        break;
        case "KeyA":
            moveLeftRight(1);
            //StrafingOnCamera(-1);
        break;
        case "KeyD":
            moveLeftRight(-1);
            //StrafingOnCamera(1);
        break;
        case "ArrowUp":
            //rotationOnCamera(1, true);
            moveAimUpDown(1);
            break;
        case "ArrowDown":
            moveAimUpDown(-1);
            //rotationOnCamera(-1, true);
            break;
        case "ArrowLeft" :
            /*
            updateRotAngle = true;
            updateRotAngleSign = 1;
            rotationOnCamera(1, false);
            */
            moveAimLeftRight(1);
            break;
        case "ArrowRight":
            moveAimLeftRight(-1);
            /*
            updateRotAngle = true;
            updateRotAngleSign = -1;
            rotationOnCamera(1, false);
            */
            break;
    case "KeyP":
	  if(bouncyball.runMode == 3) bouncyball.runMode = 1;		// if running, pause
						  else bouncyball.runMode = 3;		          // if paused, run.
	  document.getElementById('KeyDown').innerHTML =
			  'myKeyDown() p/P key: toggle Pause/unPause!';    // print on webpage
	  console.log("p/P key: toggle Pause/unPause!");   			// print on console,
		break;
    case "KeyR":    // r/R for RESET:
        if(kev.shiftKey==false) {   // 'r' key: SOFT reset; boost velocity only
            bouncyball.runMode = 3;  // RUN!
        } // end HARD reset
        document.getElementById('KeyDown').innerHTML =
        'myKeyDown() r/R key: soft/hard Reset.';	// print on webpage,
        console.log("r/R: soft/hard Reset");      // print on console,
        break;
    case "KeyP":
        // console.log(currentSolver);
        // ChangeSolvers();
        document.getElementById('KeyDown').innerHTML =
			  'myKeyDown() space bar: single step!';    // print on webpage
        break;
    case "ShiftLeft":
            verticalMovement(1);
            break;
    case "ControlLeft":
            verticalMovement(-1);
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

    switch(kev.code) {
    case 'ArrowLeft' :
    updateRotAngle = false;
    break;

    case 'ArrowRight' :
    updateRotAngle = false;
    break;
    }
}

function ChangeSolvers() {
    if (currentSolver >= numberSolvers-1){
        currentSolver = -1;
    }
    var solvers = new Uint8Array([SOLV_EULER, SOLV_MIDPOINT, SOLV_OLDGOOD, SOLV_BACK_EULER, SOLV_BACK_MIDPT]);
    currentSolver += 1;
    bouncyball.solvType = solvers[currentSolver];
    boids.solvType = solvers[currentSolver];
    flame.solvType = solvers[currentSolver];
    springmesh.solvType = solvers[currentSolver];
    console.log(currentSolver);
}

//Control panel using google dat.gui
var bouncyballGui = function(){
    this.particles = bouncyballCount;
    this.AddGravity = bouncyGravity;
    //var solvers = new Uint8Array([SOLV_EULER, SOLV_MIDPOINT, SOLV_ADAMS_BASH, SOLV_RUNGEKUTTA, SOLV_OLDGOOD, SOLV_BACK_EULER, SOLV_BACK_MIDPT, SOLV_BACK_ADBASH, SOLV_VERLET]);
    this.ChangeSolver= solverType;

    this.reload = function(){
        bouncyballCount = this.particles;
        bouncyGravity = this.AddGravity;
        var solvers = new Uint8Array([SOLV_EULER, SOLV_MIDPOINT, SOLV_ADAMS_BASH, SOLV_RUNGEKUTTA, SOLV_OLDGOOD, SOLV_BACK_EULER, SOLV_BACK_MIDPT, SOLV_BACK_ADBASH, SOLV_VERLET]);
        solverType = solvers[this.ChangeSolver];
        console.log(solverType);

        bouncyball = new VBOPartSys();
        bouncyball.initBouncy3D(bouncyballCount,0.0,-6.0,0.0,bouncyGravity,solverType);
        bouncyball.vboInit();
    }   
}

var boidsGui = function(){
    this.particles = partcount;
    this.Init_Velocity = vel;
    this.K_avoidence = ka;
    this.K_velocity = kv;
    this.K_centering = kc;
    this.Radius = rad;
    this.ChangeSolver= solverType;
    this.reload = function(){
        partcount = this.particles;
        ka = this.K_avoidence;
        kv = this.K_velocity;
        kc = this.K_centering;
        rad = this.Radius;
        vel = this.Init_Velocity;
        var solvers = new Uint8Array([SOLV_EULER, SOLV_MIDPOINT, SOLV_ADAMS_BASH, SOLV_RUNGEKUTTA, SOLV_OLDGOOD, SOLV_BACK_EULER, SOLV_BACK_MIDPT, SOLV_BACK_ADBASH, SOLV_VERLET]);
        solverType = solvers[this.ChangeSolver];
        
        boids = new VBOPartSys();
        boids.initFlocking(partcount,0.0,-3.0,0.0,ka,kv,kc,rad,vel,solverType);
        boids.vboInit();
    }
}

var springmeshGui = function(){
    this.Height = height;
    this.Width = width;
    this.K_Spring = kspring;
    this.K_Damp = kdamp;
    this.Rest_Length = restL;
    this.Wind_Strength = windForce;
    this.AddGravity = springmeshGravity;
    this.ChangeSolver= solverType;
    this.reload = function(){
        kspring = this.K_Spring;
        kdamp = this.K_Damp;
        height = this.Height;
        width = this.Width;
        restL = this.Rest_Length;
        windForce = this.Wind_Strength;
        springmeshGravity = this.AddGravity;
        var solvers = new Uint8Array([SOLV_EULER, SOLV_MIDPOINT, SOLV_ADAMS_BASH, SOLV_RUNGEKUTTA, SOLV_OLDGOOD, SOLV_BACK_EULER, SOLV_BACK_MIDPT, SOLV_BACK_ADBASH, SOLV_VERLET]);
        solverType = solvers[this.ChangeSolver];

        springmesh = new VBOPartSys();
        springmesh.initSpringMesh(0.0, 8.0, 0.0, kspring, kdamp, height, width, restL, windForce, springmeshGravity, solverType);
        springmesh.vboInit();
    } 

}

var flameGui = function(){
    this.particles = firecount;
    this.ChangeSolver= solverType;
    this.reload = function(){
        firecount = this.particles;
        var solvers = new Uint8Array([SOLV_EULER, SOLV_MIDPOINT, SOLV_ADAMS_BASH, SOLV_RUNGEKUTTA, SOLV_OLDGOOD, SOLV_BACK_EULER, SOLV_BACK_MIDPT, SOLV_BACK_ADBASH, SOLV_VERLET]);
        solverType = solvers[this.ChangeSolver];

        flame = new VBOPartSys();
        flame.initFireReeves(firecount,0.0,0.0,0.0,solverType);
        flame.vboInit();
    }
}


function Params(){
    var bouncyballFolder = new bouncyballGui();
    var springmeshFolder = new springmeshGui();
    var boidsFolder = new boidsGui();
    var flameFolder = new flameGui();
    // var gui = new dat.GUI();

    // var normalSpringMesh = gui.addFolder('Spring Mesh #2');
    // normalSpringMesh.add(springmeshFolder,'Height');
    springmeshFolder.Height = 15;
    springmeshFolder.Width = 10;
    springmeshFolder.Rest_Length = 0.02;
    springmeshFolder.K_Spring = 15;
    springmeshFolder.K_Damp = 2.5;
    springmeshFolder.Wind_Strength = 0.1;
    // normalSpringMesh.add(springmeshFolder,'ChangeSolver',{'SOLV_EULER':SOLV_EULER,'SOLV_MIDPOINT':SOLV_MIDPOINT,'SOLV_BACK_EULER':SOLV_BACK_EULER,'SOLV_BACK_MIDPT':SOLV_BACK_MIDPT});

    // var normalflame = gui.addFolder('Flame #4');
    flameFolder.particles = 600;
    // normalflame.add(flameFolder,'particles');
    // normalflame.add(flameFolder,'ChangeSolver',{'SOLV_EULER':SOLV_EULER,'SOLV_MIDPOINT':SOLV_MIDPOINT,'SOLV_BACK_EULER':SOLV_BACK_EULER,'SOLV_BACK_MIDPT':SOLV_BACK_MIDPT})
    // normalflame.add(flameFolder,'reload');
    //normalflame.open();


    // var normalboids = gui.addFolder('Boids #5');
    boidsFolder.particles = 100;
    boidsFolder.Init_Velocity = 1;
    boidsFolder.K_avoidence = 3;
    boidsFolder.K_velocity = 1;
    boidsFolder.K_centering = 4;
    boidsFolder.Radius = 1.5;
    // normalboids.add(boidsFolder,'particles');
    // normalboids.add(boidsFolder,'Init_Velocity');
    // normalboids.add(boidsFolder,'K_avoidence',0.5,10);
    // normalboids.add(boidsFolder,'K_velocity',0.5,10);
    // normalboids.add(boidsFolder,'K_centering',0.5,10);
    // normalboids.add(boidsFolder,'Radius',0.1,2);
    // normalboids.add(boidsFolder,'ChangeSolver',{'SOLV_EULER':SOLV_EULER,'SOLV_MIDPOINT':SOLV_MIDPOINT,'SOLV_BACK_EULER':SOLV_BACK_EULER,'SOLV_BACK_MIDPT':SOLV_BACK_MIDPT})
    // normalboids.add(boidsFolder,'reload');
    //normalboids.open();

    // var normalBouncyball = gui.addFolder('Bouncy Balls #6');
    bouncyballFolder.particles = 300;
    bouncyballFolder.AddGravity = true;
    // normalBouncyball.add(bouncyballFolder, 'particles');
    // normalBouncyball.add(bouncyballFolder,'AddGravity');
    // normalBouncyball.add(bouncyballFolder,'ChangeSolver',{'SOLV_EULER':SOLV_EULER,'SOLV_MIDPOINT':SOLV_MIDPOINT,'SOLV_BACK_EULER':5,'SOLV_BACK_MIDPT':SOLV_BACK_MIDPT});
    // normalBouncyball.add(bouncyballFolder, 'reload');
    //normalBouncyball.open();
}












