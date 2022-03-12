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

function makeCube() {
  //       static const GLfloat cube_strip[] = {
  //     -1.0, 1.0, 1.0,     // 1 Front-top-left
  //     1.0, 1.0, 1.0,      // 2 Front-top-right
  //     -1.0, -1.0, 1.0,    // 3 Front-bottom-left
  //     1.0, -1.0, 1.0,     // 4 Front-bottom-right
  //     1.0, -1.0, -1.0,    // 5 Back-bottom-right
  //     1.0, 1.0, 1.0,      // 2 Front-top-right
  //     1.0, 1.0, -1.0,     // 6 Back-top-right
  //     -1.0, 1.0, 1.0,     // 1 Front-top-left
  //     -1.0, 1.0, -1.0,    // 7 Back-top-left
  //     -1.0, -1.0, 1.0,    // 3 Front-bottom-left
  //     -1.0, -1.0, -1.0,   // 8 Back-bottom-left
  //     1.0, -1.0, -1.0,    // 5 Back-bottom-right
  //     -1.0, 1.0, -1.0,    // 7 Back-top-left
  //     1.0, 1.0, -1.0      // 6 Back-top-right
  // };

    cubVerts = new Float32Array([
        // ceiling
        -1.0, 1.0, 1.0, 1, 0, 0, //1
        -1.0, 1.0, -1.0, 1, 0, 0,//7

        1.0, 1.0, -1.0, 1, 0, 0, //6
        -1.0, 1.0, -1.0, 1, 0, 0, //7

        1.0, 1.0, 1.0, 1, 0, 0, //2
        1.0, 1.0, -1.0, 1, 0, 0, //6

        -1.0, 1.0, 1.0, 1, 0, 0, //1
        1.0, 1.0, 1.0, 1, 0, 0, //2

        // floor
        -1.0, -1.0, 1.0, 1, 0, 0, //3
        -1.0, -1.0, -1.0, 1, 0, 0, //8

        -1.0, -1.0, -1.0, 1, 0, 0, //8
        1.0, -1.0, -1.0, 0, 0, 0, //5 

        1.0, -1.0, 1.0, 1, 0, 0, //4
        1.0, -1.0, -1.0, 0, 0, 0, //5

        -1.0, -1.0, 1.0, 1, 0, 0,//3
        1.0, -1.0, 1.0, 1, 0, 0,//4

        // left side
        -1.0, 1.0, 1.0, 1, 0, 0,//1
        -1.0, 1.0, -1.0, 1, 0, 0, //7

        -1.0, 1.0, -1.0, 1, 0, 0, //7
        -1.0, -1.0, -1.0,1, 0, 0, //8

        -1.0, -1.0, 1.0, 1, 0, 0, //3
        -1.0, -1.0, -1.0,1, 0, 0, //8

        -1.0, -1.0, 1.0, 1, 0, 0, //3
        -1.0, 1.0, 1.0, 1, 0, 0,//1

        //right side
        1.0, 1.0, 1.0, 1, 0, 0, //2
        1.0, 1.0, -1.0, 1, 0, 0, //6

        1.0, 1.0, -1.0, 1, 0, 0, //6
        1.0, -1.0, -1.0, 1, 0, 0, //5

        1.0, -1.0, -1.0, 1, 0, 0, //5
        1.0, -1.0, 1.0, 1, 0, 0, //4

        1.0, -1.0, 1.0, 1, 0, 0, //4
        1.0, 1.0, 1.0, 1, 0, 0, //2

    ]);

}