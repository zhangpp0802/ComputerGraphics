function initVertexBuffers(gl) {
    makeGroundGrid();
    makeCube();

    mySize = gndVerts.length + cubVerts.length;

    var nn = mySize / floatsPerVertex;
    // console.log('nn is', nn, 'mySize is', mySize, 'floatsPerVertex is', floatsPerVertex);

    var vertices = new Float32Array(mySize);
    //ground plane
    gndStart = 0;
    for (i = 0, j = 0; j < gndVerts.length; i++, j++) {
        vertices[i] = gndVerts[j];
    }
    //cube
    cubeStart = i;
    for (j = 0; j < cubVerts.length; i++, j++) {
        vertices[i] = cubVerts[j];
    }

    // Create a vertex buffer object (VBO)
    var vertexColorbuffer = gl.createBuffer();
    if (!vertexColorbuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    // Write vertex information to buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    var FSIZE = vertices.BYTES_PER_ELEMENT;
    // Assign the buffer object to a_Position and enable the assignment
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * floatsPerVertex, 0);
    gl.enableVertexAttribArray(a_Position);

    var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    if (a_Normal < 0) {
        console.log('Failed to get the storage location of a_Normal');
        return -1;
    }
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);


    return mySize / floatsPerVertex;	
}