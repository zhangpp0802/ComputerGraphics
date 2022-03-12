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

    // bounce the ball
    // gl.uniform1i(u_ballMode, bMode);
    bMode = 1;
    gl.uniform1i(u_ballMode, bMode);

    yvelNow -= g_grav*(timeStep*0.001);
        // -- apply drag: attenuate current velocity:
    xvelNow *= Math.max(0,g_drag);
    yvelNow *= Math.max(0,g_drag);
        // -- move our particle using current velocity:
        // CAREFUL! must convert timeStep from milliseconds to seconds!
    xposNow += xvelNow * (timeStep * 0.001);
    yposNow += yvelNow * (timeStep * 0.001); 
    zposNow += zvelNow * (timeStep * 0.001); 
        
    if(      xposNow < -6.0 && xvelNow < 0.0
        ) {     // bounce on left wall.
            xvelNow = -xvelNow;
        }
    else if (xposNow > 10.0 && xvelNow > 0.0
        ) {     // bounce on right wall
            xvelNow = -xvelNow;
        }
    if(      yposNow < -6.0 && yvelNow < 0.0
        ) {     // bounce on floor
            yvelNow = -yvelNow;
        }
    else if( yposNow > 3.0 && yvelNow > 0.0
        ) {     // bounce on ceiling
            yvelNow = -yvelNow;
        }
        //  -- hard limit on 'floor' keeps y position >= 0;
    if(yposNow < 0.0) yposNow = 0.0;

    if(      zposNow < -6.0 && zvelNow < 0.0
        ) {     // bounce on floor
            zvelNow = -zvelNow;
        }
    else if( zposNow > 3.0 && zvelNow > 0.0
        ) {     // bounce on ceiling
            zvelNow = -zvelNow;
        }
        //  -- hard limit on 'floor' keeps y position >= 0;
    if(zposNow < 0.0) zposNow = 0.0;

    //Sphere at (0,0,0)
    modelMatrix.translate(-0.5, -2, -2);
    modelMatrix.scale(0.2, 0.2, 0.2);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    // gl.uniformMatrix3fv(program.uTranslation, u_ballShiftID);
    // gl.uniformMatrix4fv(u_ModelMatrix, false,u_ballShiftID);
    gl.uniform4f(u_ballShiftID, xposNow, yposNow, zposNow, 0.0);

    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
 
    gl.uniform3f(u_Ke, 0,0,0);
    gl.uniform3f(u_Ka, 255/255, 194/255, 12/255);
    gl.uniform3f(u_Kd, 0.3, 0.3, 0.3);
    gl.uniform3f(u_Ks,0.5,     0.5,    0.5);
    gl.drawArrays(gl.TRIANGLE_STRIP, sphereStart / floatsPerVertex, sphVerts.length / floatsPerVertex);

    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);

    // gl.uniform1i(u_ballMode, bMode);
    bMode = 0;
    gl.uniform1i(u_ballMode, bMode);

    //Cube linked above
    modelMatrix.translate(0, -3, 0);
    // modelMatrix.rotate(currentAngle, 0, 1, 0);
    pushMatrix(modelMatrix);
    modelMatrix.scale(2, 2, 2);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    gl.uniform3f(u_Ke, 0.0, 0.0, 0.0);
    gl.uniform3f(u_Ka, 0.1, 0.01, 0);
    gl.uniform3f(u_Kd, 0.6, 0.3, 0.6);
    gl.uniform3f(u_Ks, 0.7, 0.6, 0.6);
    gl.uniform1i(u_KShiny, 40);
    gl.drawArrays(gl.LINES, cubeStart / floatsPerVertex, cubVerts.length / floatsPerVertex);

    modelMatrix = popMatrix();
}