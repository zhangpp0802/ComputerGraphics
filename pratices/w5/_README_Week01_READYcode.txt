Week01_RESCUE README.txt
=============================
Try 'change scene' button.

This is ‘ready’ code -- it extends the raw Week01 'starter code' to create
our very first ray-traced image.  Please compare the week01 ‘starter’ code
to this ‘ready’ code, and then complete it:
Can you make the ray-traced image on the right match the WebGL preview on the left?


1) use a file-comparison tool 
(e.g. WinMerge (my favorite graphical Windows-based free tool), or 
Apple's FileMerge or opendiff tools built into Xcode, or anything you like:
https://en.wikipedia.org/wiki/Comparison_of_file_comparison_tools )
to COMPARE the week01 starter code and this 'rescue' code.

You'll find that:
a) the html file is identical except for JS filenames 
(appended _READY) and the fact that I now include the 
	'Week01_traceSupplement.js' file. 
b) This added file holds all the ray-tracing objects I recommend, including:
 -- CImgBuf object (holds RGB image in both a floating-point & integer array), 
 -- CRay object (holds one ray you're using for ray-tracing)
 -- CCamera (ray-tracing camera, mostly complete), and 
 -- CGeom object (ray-traced shape-description object; you'll make one of 
	these for each 3D shape (later you'll make an array of these)
 -- CScene object (commented out; at bottom) This will eventually hold all the 
	mechanisms of your ray-tracer in one nice neat global object.

2) Use the file-comparison tool to look at the Week01_lineGrid_RESCUE.js file.  
Start here: it contains our main() function, but above main() it also contains 
the global variables for each major part of our program, including:
 -- global object 'gl', the one-and-only webGL rendering context made in main(),
 -- global objects 'preView' and 'rayView', our 2 VBObox objects 
	(find their prototypes in JT_VBObox-Lib_RESCUE.js) 
	that hold what we need for drawing two halves of our on-screen display,
 -- global object 'gui', our one-and-only GUIbox object which holds everything 
	we need & use for graphical user interface, such as mouse and keyboard 
	callbacks (find its prototypes in JT_GUIbox-Lib_RESCUE.js).

3) Starting from main(), note how we initialize everything, then draw the 
on-screen image ONCE. There is no animation loop that tirelessly re-draws the
screen, nor should there be: instead we only re-draw (e.g. call drawAll() ) 
when user interactions need to update the browser window due to re-size, user 
pressing the 'T' key or others, by dragging the mouse, etc. (see GUIbox methods)...

3) MAJOR CHANGES TO NOTICE:
ver 22:
---------------
 a) Commented out all the verbose console.log() calls in GUIbox-Lib.js
 b) Above main(), created global CImgBuf object named 'g_myPic' with (fixed)
	image size of 256x256. CImgBuf prototypes are in the
	 Week01_traceSupplement_RESCUE.js file.
     --In VBObox1.init(), filled g_myPic with a simple test-pattern,
     --In VBObox1.init(), replaced the VBObox1 member 'myImg' (held the texture
	image displayed by VBObox1) with g_myPic.iBuf as the texture map image.
  c) Set HTML 'Change Scene' button to switch among different test-patterns:
     --in Week01_LineGrid_RESCUE.js, onSceneButton(), call g_myPic.setTestPattern()
	to change the displayed test pattern on each button-push.
	SURPRISE! No change on-screen!  WHY? because VBObox1.init() transferred
	contents of g_myPic object to the GPU for use as a texture map.
 	The onSceneButton() function changed g_myPic, but didn't transfer its new
	contents to the GPU. The VBObox1.reload() function can fix that. 
	(note we had to update 'reload' to use CImgBuf object 'g_myPic'.
     --Expand the CImgBuf.setTestPattern() function to draw new test patterns
	in VBObox1.init() for 'myImg' that we commented-out along with myImg.
ver 23:
--------------
  a) In Week01_LineGrid.js, updated/improved the test_glMatrix() function to
	explore the matrix-multiplication order used in translate(), rotate()
	and scale() functions for mat4 objects. Added re-usable print_mat4() to
	pretty-print mat4 matrices. 
  b) Completed transition to glMatrix.js library for all JS vectors & matrices.
	Deleted the cuon-matrix library files from /lib directory
	(cuon-matrix.js, cuon-matrix-mod.js, cuon-matrix-quat03.js)
  c) Replaced triangles with colorful x/y line-grid to VBObox0 (preView)
	created by the VBObox0.appendGroundGrid() function.  Each line in this
	grid is made of 4 shorter line-segments (easier to customize).
  d) In VBObox0 object (preView), added u_mvpMatrix (ModelViewProjection)
	uniform. In VBObox0 'adjust' function we construct a projection matrix
	that matches the default ray-tracing camera, a 'view' matrix using the
	GUIbox camera-navigation values camEyePt, camAimPt, camUpVec, and
	 used it along with GUIbox object 'gui' for interactive preview. 
  e) In GUIbox object, added functions & calls to implement 'yaw-pitch sphere'
	navigation for a perspective camera that matches the CCamera object.
	Camera aiming point stays on a unit-radius sphere centered at the 
	camera's eye point, specified by:
     --'yaw' angle(longitude) increasing CCW in xy plane measured from +x axis;
     --'pitch' angle(latitude) increasing upwards above horizon.
  	 This is BETTER than 'glass tube' because camera can pitch up/down
 	in equal-angle increments, and even go past +/-90 degrees if we wish.
	Yaw/Pitch also lets us construct a 'view up vector' that is NEVER
	collinear with the aiming angle: we simply add 90 degrees more pitch
	to the camera's aiming angle.
  	I limited 'pitch' to +/- 90 deg (+/- PI/2 radians) to avoid confusing
	counter-intuitive images possible with past-vertical pitch.
   f) Corrected 1st line in GUIbox.keyPress() function that prevented the fcn's
	proper operation with FireFox browsers.
ver 24:
-------------
  Begin ray-tracing:
   a) Set GUIbox.keyPress() to respond to 'c' or 'C' button by filling our 
	global CImgBuf object g_myPic (declared above main() ) with the
	solid-orange 'test pattern' made by CImgBuf.setTestPattern(1).
	(HOW? see 'onScene()' function in Week01_LineGrid.js)
   b) Fix small error in GUIbox.CamStrafe_L,R() functions 
	(old this.camTheta --> this.camYaw)
   c) Set GUIbox.keyPress() to respond 't' or 'T' key by calling the 	
	CImgBuf.makeRayTracedImg() method (in traceSupplement.js) for our
	global 'g_myPic' CImgBuf object (declared above main() ).
   d) improve makeRayTracedImg() method to include a 'skyColor'. Even though
	we fill CImgBuf object with a new image, it's not shown on-screen.
	-- ook at the onScene() function and/or GUIbox.keyPress() function for 
	'c' or 'c' to see why.  (after the 't' or 'T' key calls makeRayTracedImg()
	we needed to re-load contents of the VBObox object 'rayView', & draw it)
   e)  write our CGeom.traceGrid() function to figure out ray/grid intersection
    	In makeRayTracedImage(), add 'sky color' for use with rays that DON'T 
	hit the ground-plane grid.
   f) 	update the preView's camera to match our ray-tracer.  
	In VBObox0.adjust() move eyepoint to origin: eyePt = 0,0,0;
	add a model matrix to translate WebGL ground-plane to (0,0,-5); 
	change perspective() camera-making function to frustum() so we can use 
	the same parameters as our ray-tracer (left,right,bottom,top,near,far).
    --RAY-TRACING THE GRID!--
     --ROTATE THE RAY's CCAMERA 90deg to look at horizon: (see its constructor)
	    and I see sky, horizon, and a strong need for antialiasing!
   g) Add CCamera.rayPerspective(), CCamera.rayFrustum(), rayLookAt() functions;
	test them by comparison to WebGL result.

ver 25: (5/20/2019)
--------------
   a) update GUIbox.js to eliminate keyPress() because this event is now 
	deprecated and obsolete; replace all vec3 usage with vec4 & test;
	import/refine the 'test_glMatrix()' & assoc'd print_mat4() fcn from the
	Week2_Sphere project.  Misc small corrections