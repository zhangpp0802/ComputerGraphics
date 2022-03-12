function draw() {
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    bMode = 0
    gl.uniform1i(ballMode, bMode);

    gl.viewport(0,						
				0, 		
  				g_canvas.width, 			
  				g_canvas.height);		

    var vpAspect = g_canvas.width /			// On-screen aspect ratio for
								(g_canvas.height);		// this camera: width/height.

    // For this viewport, set camera's eye point and the viewing volume:
    projMatrix.setPerspective(35.0,vpAspect,1.0,100.0); 

    // but use a different 'view' matrix:
    modelMatrix.setLookAt(g_EyeX, g_EyeY, g_EyeZ, // eye position
                        g_AtX, g_AtY, g_AtZ,                  // look-at point 
                        0, 0, 1);                 // up vector

    

    // Pass the view projection matrix to our shaders:
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

    drawMyScene();
}

function drawMyScene() {
    // draw grid
    pushMatrix(modelMatrix);

    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();

    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.LINES,            
                  gndStart / floatsPerVertex,
                  gndVerts.length / floatsPerVertex); 

    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);

    //Cube linked above
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    gl.drawArrays(gl.LINES, cubeStart / floatsPerVertex, cubVerts.length / floatsPerVertex);

    modelMatrix = popMatrix();
}