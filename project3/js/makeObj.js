function makeGroundGrid() {
    //==============================================================================
    // Create a list of vertices that create a large grid of lines in the x,y plane
    // centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

    var xcount = 200;     // # of lines to draw in x,y to make the grid.
    var ycount = 200;
    var xymax = 80.0;     // grid size; extends to cover +/-xymax in x and y.
    var xColr = Math.random()*0.5;  
    var yColr = Math.random() * 0.5; 

    // Create an (global) array to hold this ground-plane's vertices:
    gndVerts = new Float32Array(floatsPerVertex * 2 * (xcount + ycount));
    // draw a grid made of xcount+ycount lines; 2 vertices per line.

    var xgap = xymax / (xcount - 1);    // HALF-spacing between lines in x,y;
    var ygap = xymax / (ycount - 1);    // (why half? because v==(0line number/2))

    // First, step thru x values as we make vertical lines of constant-x:
    for (v = 0, j = 0; v < 2 * xcount; v++, j += floatsPerVertex) {
        if (v % 2 == 0) {  // put even-numbered vertices at (xnow, -xymax, 0)
            gndVerts[j] = -xymax + (v) * xgap;  // x
            gndVerts[j + 1] = -xymax;               // y
            gndVerts[j + 2] = 0.0;                  // z
        }
        else {        // put odd-numbered vertices at (xnow, +xymax, 0).
            gndVerts[j] = -xymax + (v - 1) * xgap;  // x
            gndVerts[j + 1] = xymax;                // y
            gndVerts[j + 2] = 0.0;                  // z
        }
        gndVerts[j + 3] = xColr;     // red
        gndVerts[j + 4] = yColr;     // grn
        gndVerts[j + 5] = 1;     // blu
    }
    // Second, step thru y values as wqe make horizontal lines of constant-y:
    // (don't re-initialize j--we're adding more vertices to the array)
    for (v = 0; v < 2 * ycount; v++, j += floatsPerVertex) {
        if (v % 2 == 0) {    // put even-numbered vertices at (-xymax, ynow, 0)
            gndVerts[j] = -xymax;               // x
            gndVerts[j + 1] = -xymax + (v) * ygap;  // y
            gndVerts[j + 2] = 0.0;                  // z
        }
        else {          // put odd-numbered vertices at (+xymax, ynow, 0).
            gndVerts[j] = xymax;                // x
            gndVerts[j + 1] = -xymax + (v - 1) * ygap;  // y
            gndVerts[j + 2] = 0.0;                  // z
        }
        gndVerts[j + 3] = xColr;     // red
        gndVerts[j + 4] = yColr;     // grn
        gndVerts[j + 5] = 1;     // blu
    }
}

function makeSphere() {
    var slices = 41;
    var sliceVerts = 41;	
    var topColr = new Float32Array([0.5, 0.5, 0.5]);	
    var equColr = new Float32Array([.3, .3, .3]);	 
    var botColr = new Float32Array([1, 1, 1]);
    var sliceAngle = Math.PI / slices;
    sphVerts = new Float32Array(((slices * 2 * sliceVerts) - 2) * floatsPerVertex);
    var cos0 = 0.0;			
    var sin0 = 0.0;
    var cos1 = 0.0;
    var sin1 = 0.0;
    var j = 0;			
    var isLast = 0;
    var isFirst = 1;
    for (s = 0; s < slices; s++) {
        if (s == 0) {
            isFirst = 1;	
            cos0 = 1.0; 	
            sin0 = 0.0;
        }
        else {					
            isFirst = 0;
            cos0 = cos1;
            sin0 = sin1;
        }							
        cos1 = Math.cos((s + 1) * sliceAngle);
        sin1 = Math.sin((s + 1) * sliceAngle);
        if (s == slices - 1) isLast = 1;
        for (v = isFirst; v < 2 * sliceVerts - isLast; v++, j += floatsPerVertex) {
            if (v % 2 == 0) {			
                sphVerts[j] = sin0 * Math.cos(Math.PI * (v) / sliceVerts);
                sphVerts[j + 1] = sin0 * Math.sin(Math.PI * (v) / sliceVerts);
                sphVerts[j + 2] = cos0;
            }
            else { 	
                sphVerts[j] = sin1 * Math.cos(Math.PI * (v - 1) / sliceVerts);		
                sphVerts[j + 1] = sin1 * Math.sin(Math.PI * (v - 1) / sliceVerts);
                sphVerts[j + 2] = cos1;			
            }
            if (s == 0) {	

                sphVerts[j + 3] = sin1 * Math.cos(Math.PI * (v - 1) / sliceVerts);
                sphVerts[j + 4] = sin1 * Math.sin(Math.PI * (v - 1) / sliceVerts);
                sphVerts[j + 5] = cos1;
            }
            else if (s == slices - 1) {
                sphVerts[j + 3] = sin1 * Math.cos(Math.PI * (v - 1) / sliceVerts);
                sphVerts[j + 4] = sin1 * Math.sin(Math.PI * (v - 1) / sliceVerts);
                sphVerts[j + 5] = cos1;
            }
            else {
                sphVerts[j + 3] = sin1 * Math.cos(Math.PI * (v - 1) / sliceVerts);
                sphVerts[j + 4] = sin1 * Math.sin(Math.PI * (v - 1) / sliceVerts);
                sphVerts[j + 5] = cos1;
            }

        }
    }
}

function makeTetrahedron() {
    var c30 = Math.sqrt(0.75);         
    var sq2 = Math.sqrt(2.0);
    var sq6 = Math.sqrt(6.0);

    tetVerts = new Float32Array([
        // Face 0: (left side)  
       0.0, 0.0, sq2,  sq6, sq2, 1,//  blue
       c30, -0.5, 0.0,  sq6, sq2, 1,// red
       0.0, 1.0, 0.0,  sq6, sq2, 1,// green
        // Face 1: (right side)
       0.0, 0.0, sq2,  -sq6, sq2, 1,// blue
       0.0, 1.0, 0.0,  -sq6, sq2, 1,// green
      -c30, -0.5, 0.0,  -sq6, sq2, 1,// white
        // Face 2: (lower side)
       0.0, 0.0, sq2,  0, -2 * sq2, 1,// blue
      -c30, -0.5, 0.0,  0, -2 * sq2, 1,// white
       c30, -0.5, 0.0,  0, -2 * sq2, 1,// red 
        // Face 3: (base side)  
      -c30, -0.5, 0.0,  0, 0, -1,// white
       0.0, 1.0, 0.0,  0, 0, -1,// green
       c30, -0.5, 0.0,  0, 0, -1,// red

    ]);
}

function makeCube() {

    cubVerts = new Float32Array([
    // Vertex coordinates(x,y,z,w) and color (R,G,B) for a color tetrahedron:
    //    Apex on +z axis; equilateral triangle base at z=0

        // +x face: RED
        1.0, -0.0, -0.2,  1, 0, 0,// Node 3
        1.0, 2.0, -0.2, 1, 0, 0,// Node 2
        1.0, 2.0, 0.2, 1, 0, 0,// Node 4

        1.0, 2.0, 0.2, 1, 0, 0,// Node 4
        1.0, -0.0, 0.2, 1, 0, 0,// Node 7
        1.0, -0.0, -0.2, 1, 0, 0,// Node 3

      // +y face: GREEN
      -1.0, 2.0, -0.2, 0, 1, 0,// Node 1
      -1.0, 2.0, 0.2, 0, 1, 0,// Node 5
       1.0, 2.0, 0.2, 0, 1, 0,// Node 4

       1.0, 2.0, 0.2, 0, 1, 0,// Node 4
       1.0, 2.0, -0.2, 0, 1, 0,// Node 2 
      -1.0, 2.0, -0.2, 0, 1, 0,// Node 1

      // +z face: BLUE
      -1.0, 2.0, 0.2, 0, 0, 1,// Node 5
      -1.0, -0.0, 0.2, 0, 0, 1,// Node 6
       1.0, -0.0, 0.2, 0, 0, 1,// Node 7

       1.0, -0.0, 0.2, 0, 0, 1,// Node 7
       1.0, 2.0, 0.2,  0, 0, 1,// Node 4
      -1.0, 2.0, 0.2,  0, 0, 1,// Node 5

      // -x face: CYAN
      -1.0, -0.0, 0.2,-1, 0, 0,// Node 6 
      -1.0, 2.0, 0.2,  -1, 0, 0,// Node 5 
      -1.0, 2.0, -0.2, -1, 0, 0,// Node 1

      -1.0, 2.0, -0.2, -1, 0, 0,// Node 1
      -1.0, -0.0, -0.2, -1, 0, 0,// Node 0  
      -1.0, -0.0, 0.2, -1, 0, 0,// Node 6  

      // -y face: MAGENTA
       1.0, -0.0, -0.2, 0, -1, 0,// Node 3
       1.0, -0.0, 0.2, 0, -1, 0,// Node 7
      -1.0, -0.0, 0.2, 0, -1, 0,// Node 6

      -1.0, -0.0, 0.2, 0, -1, 0,// Node 6
      -1.0, -0.0, -0.2, 0, -1, 0,// Node 0
       1.0, -0.0, -0.2, 0, -1, 0,// Node 3

       // -z face: YELLOW
       1.0, 2.0, -0.2, 0, 0, -1,// Node 2
       1.0, -0.0, -0.2, 0, 0, -1,// Node 3
      -1.0, -0.0, -0.2,0, 0, -1,// Node 0   

      -1.0, -0.0, -0.2, 0, 0, -1,// Node 0
      -1.0, 2.0, -0.2,  0, 0, -1,// Node 1
       1.0, 2.0, -0.2,  0, 0, -1,// Node 2

    ]);

}