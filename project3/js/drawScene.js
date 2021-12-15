function draw() {

    // Clear <canvas> color AND DEPTH buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    //Set the lights
    if (headlightOn) {
        //Set the position of headlight and uniform
        gl.uniform3f(u_HeadlightPosition, g_EyeX, g_EyeY, g_EyeZ);
        gl.uniform3f(u_HeadlightAmbient, usrAmbiR, usrAmbiG, usrAmbiB);
        gl.uniform3f(u_HeadlightDiffuse, usrDiffR, usrDiffG, usrDiffB);
        gl.uniform3f(u_HeadlightSpecular, usrSpecR, usrSpecG, usrSpecB);
        gl.uniform1i(hlOn, 1);
    }
    else {
        gl.uniform3f(u_HeadlightAmbient, 0, 0, 0);
        gl.uniform3f(u_HeadlightDiffuse, 0, 0, 0);
        gl.uniform3f(u_HeadlightSpecular, 0, 0, 0);
        gl.uniform3f(u_HeadlightPosition, 0, 0, 0);
        gl.uniform1i(hlOn, 0);
    }

    if (worldLightOn) {
        gl.uniform1i(wLOn, 1);
        gl.uniform3f(u_AmbientLight, usrAmbiR, usrAmbiG, usrAmbiB);
        gl.uniform3f(u_LightDiffuse, usrDiffR, usrDiffG, usrDiffB);
        gl.uniform3f(u_Specular, usrSpecR, usrSpecG, usrSpecB);
        gl.uniform3f(u_LightPosition, usrPosX, usrPosY, usrPosZ);
    }
    else {
        gl.uniform1i(wLOn, 0);
        gl.uniform3f(u_AmbientLight, 0,0,0);
        gl.uniform3f(u_LightDiffuse, 0,0,0);
        gl.uniform3f(u_Specular, 0,0,0);
        gl.uniform3f(u_LightPosition, 0,0,0);
    }

    gl.viewport(0,						
				0, 		
  				canvas.width, 			
  				canvas.height);		

    var vpAspect = canvas.width /			// On-screen aspect ratio for
								(canvas.height);		// this camera: width/height.

    // For this viewport, set camera's eye point and the viewing volume:
    projMatrix.setPerspective(35.0,vpAspect,1.0,100.0); 

    // but use a different 'view' matrix:
    modelMatrix.setLookAt(g_EyeX, g_EyeY, g_EyeZ, // eye position
                        g_AtX, g_AtY, g_AtZ,                  // look-at point 
                        0, 0, 1);                 // up vector

    

    // Pass the view projection matrix to our shaders:
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
    gl.uniform3f(u_HeadlightPosition, g_EyeX, g_EyeY, g_EyeZ);

    drawMyScene();
}

function drawMyScene() {
    modelMatrix.scale(0.2, 0.2, 0.2);
    // draw grid
    pushMatrix(modelMatrix);

    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();

    gl.uniform3f(u_Ke, 0.0, 0.0, 0.0);
    gl.uniform3f(u_Ka, 0.19225, 0.19225, 0.19225);
    gl.uniform3f(u_Kd, 0.50754, 0.50754, 0.507543);
    gl.uniform3f(u_Ks, 0.508273, 0.508273, 0.508273);

    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.LINES,            
                  gndStart / floatsPerVertex,
                  gndVerts.length / floatsPerVertex); 

    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);

    //Sphere at (0,0,0)
    modelMatrix.translate(0.0, 0.0, 0.0);
    modelMatrix.rotate(currentAngle, 1, 1, 0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
 
    gl.uniform3f(u_Ke, 0,0,0);
    gl.uniform3f(u_Ka, 255/255, 194/255, 12/255);
    gl.uniform3f(u_Kd, 0.3, 0.3, 0.3);
    gl.uniform3f(u_Ks,0.5,     0.5,    0.5);
    gl.drawArrays(gl.TRIANGLE_STRIP, sphereStart / floatsPerVertex, sphVerts.length / floatsPerVertex);

    //Sphere linked above
    modelMatrix.translate(1.0, 0.0, 0.0);
    modelMatrix.rotate(currentAngle, 1, 1, 0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    gl.uniform3f(u_Ke, 0,0,0);
    gl.uniform3f(u_Ka, 219/255, 218/255, 20/255);
    gl.uniform3f(u_Kd, 0.4, 0.4, 0.4);
    gl.uniform3f(u_Ks, 0.8, 0.8, 0.8);
    gl.drawArrays(gl.TRIANGLE_STRIP, sphereStart / floatsPerVertex, sphVerts.length / floatsPerVertex);

    //Sphere linked above
    modelMatrix.translate(1.0, 0.0, 0.0);
    modelMatrix.rotate(currentAngle, 1, 1, 0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    gl.uniform3f(u_Ke, 0,0,0);
    gl.uniform3f(u_Ka, 81/255, 202/255, 251/255);
    gl.uniform3f(u_Kd, 0.6, 0.6, 0.6);
    gl.uniform3f(u_Ks, 0.8, 0.8, 0.8);
    gl.drawArrays(gl.TRIANGLE_STRIP, sphereStart / floatsPerVertex, sphVerts.length / floatsPerVertex);

    //Sphere linked above
    modelMatrix.translate(1.0, 0.0, 0.0);
    modelMatrix.rotate(currentAngle, 1, 1, 0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    gl.uniform3f(u_Ke, 0,0,0);
    gl.uniform3f(u_Ka, 170/255, 244/255, 140/255);
    gl.uniform3f(u_Kd, 0.5, 0.5, 0.5);
    gl.uniform3f(u_Ks, 0.8, 0.8, 0.8);
    gl.drawArrays(gl.TRIANGLE_STRIP, sphereStart / floatsPerVertex, sphVerts.length / floatsPerVertex);

    //Sphere linked above
    modelMatrix.translate(1.0, 0.0, 0.0);
    modelMatrix.rotate(currentAngle, 1, 1, 0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    gl.uniform3f(u_Ke, 0,0,0);
    gl.uniform3f(u_Ka, 130/255, 20/255, 100/255);
    gl.uniform3f(u_Kd, 0.6, 0.6, 0.6);
    gl.uniform3f(u_Ks, 0.8, 0.8, 0.8);
    gl.drawArrays(gl.TRIANGLE_STRIP, sphereStart / floatsPerVertex, sphVerts.length / floatsPerVertex);

    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);

    //Tet
    modelMatrix.translate(-5, 0, 3);
    modelMatrix.rotate(currentAngle, 1, 0, 1);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    gl.uniform3f(u_Ke, 0,0,0);
    gl.uniform3f(u_Ka, 65/255, 242/255, 34/255);
    gl.uniform3f(u_Kd, 0.7, 0.6, 0.1);
    gl.uniform3f(u_Ks, 0.8, 0.8, 0.8);
    gl.uniform1i(u_KShiny, 50);
    gl.drawArrays(gl.TRIANGLES, tetrahedronStart / floatsPerVertex, tetVerts.length / floatsPerVertex);

    //Tet linked above
    modelMatrix.translate(-5, 0, 3);
    modelMatrix.rotate(currentAngle, 1, 0, 1);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    gl.uniform3f(u_Ke, 0.0, 0.0, 0.0);
    gl.uniform3f(u_Ka, 0.3, 0.3, 0.2);
    gl.uniform3f(u_Kd, 0.2, 0.2, 0.2);
    gl.uniform3f(u_Ks, 0.8, 0.8, 0.8);
    gl.uniform1i(u_KShiny, 40);
    gl.drawArrays(gl.TRIANGLES, tetrahedronStart / floatsPerVertex, tetVerts.length / floatsPerVertex);

    //Tet linked above
    modelMatrix.translate(-5, 0, 3);
    modelMatrix.rotate(currentAngle, 1, 0, 1);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    gl.uniform3f(u_Ke, 0.0, 0.0, 0.0);
    gl.uniform3f(u_Ka, 0.02, 0.2, 0.02);
    gl.uniform3f(u_Kd, 0.07, 0.6, 0.08);
    gl.uniform3f(u_Ks, 0.6, 0.7, 0.6);
    gl.uniform1i(u_KShiny, 40.0);
    gl.drawArrays(gl.TRIANGLES, tetrahedronStart / floatsPerVertex, tetVerts.length / floatsPerVertex);

    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);

    //Cube
    modelMatrix.translate(5, 3, 0);
    modelMatrix.rotate(currentAngle, 0, 1, 0);
    pushMatrix(modelMatrix);
    modelMatrix.scale(0.5, 0.5, 1);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    gl.uniform3f(u_Ke, 0.0, 0.0, 0.0);
    gl.uniform3f(u_Ka, 0.1, 0.1,0.1);
    gl.uniform3f(u_Kd, 0.3, 0.0, 0.0);
    gl.uniform3f(u_Ks, 0.6, 0.6, 0.6);
    gl.uniform1i(u_KShiny, 100);
    gl.drawArrays(gl.TRIANGLES, cubeStart / floatsPerVertex, cubVerts.length / floatsPerVertex);

    //Cube linked above
    modelMatrix.translate(5, 3, 0);
    modelMatrix.rotate(currentAngle, 0, 1, 0);
    pushMatrix(modelMatrix);
    modelMatrix.scale(0.5, 0.5, 1);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    gl.uniform3f(u_Ke, 0.0, 0.0, 0.0);
    gl.uniform3f(u_Ka, 0.1, 0.01,0);
    gl.uniform3f(u_Kd, 0.6, 0.3, 0.6);
    gl.uniform3f(u_Ks, 0.7, 0.6, 0.6);
    gl.uniform1i(u_KShiny, 100);
    gl.drawArrays(gl.TRIANGLES, cubeStart / floatsPerVertex, cubVerts.length / floatsPerVertex);

    //Cube linked above
    modelMatrix.translate(5, 3, 0);
    modelMatrix.rotate(currentAngle, 0, 1, 0);
    pushMatrix(modelMatrix);
    modelMatrix.scale(0.5, 0.5, 1);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    gl.uniform3f(u_Ke, 0.0, 0.0, 0.0);
    gl.uniform3f(u_Ka, 0.1, 0.01,0);
    gl.uniform3f(u_Kd, 0.6, 0.3, 0.6);
    gl.uniform3f(u_Ks, 0.7, 0.6, 0.6);
    gl.uniform1i(u_KShiny, 100);
    gl.drawArrays(gl.TRIANGLES, cubeStart / floatsPerVertex, cubVerts.length / floatsPerVertex);

    //Cube linked above
    modelMatrix.translate(5, 3, 0);
    modelMatrix.rotate(currentAngle, 0, 1, 0);
    pushMatrix(modelMatrix);
    modelMatrix.scale(0.5, 0.5, 1);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    gl.uniform3f(u_Ke, 0.0, 0.0, 0.0);
    gl.uniform3f(u_Ka, 0.1, 0.01, 0);
    gl.uniform3f(u_Kd, 0.6, 0.3, 0.6);
    gl.uniform3f(u_Ks, 0.7, 0.6, 0.6);
    gl.uniform1i(u_KShiny, 100);
    gl.drawArrays(gl.TRIANGLES, cubeStart / floatsPerVertex, cubVerts.length / floatsPerVertex);

    modelMatrix = popMatrix();
}