const GeomShape = {
    // An endless 'ground plane' surface in xy plane
    GroundPlane: 0,
    // a circular disk in xy plane, radius 'diskRad'
    Disk: 1,
    // A sphere, radius 1, centered at origin
    Sphere: 2,
    // An axis-aligned cube, corners at (+/-1, +/-1,+/-1)
    Box: 3,
    // A cylinder with user-settable radius at each end
    // and user-settable length.  radius of 0 at either
    // end makes a cone; length of 0 with nonzero
    // radius at each end makes a disk
    Cylinder: 4,
    // a triangle with 3 vertices
    Triangle: 5,
    // Implicit surface:Blinn-style Gaussian 'blobbies'
    Blobby: 6,
    // Implicit sphere
    SphereImplicit: 7,
    // Implicit cube
    CubeImplicit: 8,
    // Implicit cylinder,
    CylinderImplicit: 9,
    // Implicit torus
    TorusImplicit: 10,
    // Sphere with a hole in it
    HoledSphereImplicit: 11,
    // Union exotica,
    UnionImplicit: 12,
}

function CGeom(shapeSelect)
{
    // Default shape.
    if(shapeSelect == undefined) shapeSelect = GeomShape.GroundPlane;
    this.shapeType = shapeSelect;

    this.material1 = new CMaterial(Materials.RedPlastic);
    this.material2 = new CMaterial(Materials.GreenPlastic);
    this.material1.K_diff;

    // Get clever:  create 'traceMe()' function that calls the tracing function
    // needed by the shape held in this CGeom object.
    switch(this.shapeType)
    {
        case GeomShape.GroundPlane:
            //set the ray-tracing function (so we call it using item[i].traceMe() )
            this.traceMe = function(inR,hit,bIsShadowRay) { return this.traceGrid(inR,hit, bIsShadowRay);   }; 
            // line-to-line spacing
            this.xgap = 1.0;
            this.ygap = 1.0;
            // fraction of xgap used for grid-line width
            this.lineWidth = 0.1;
            // RGBA green(A==opacity)
            this.lineColor = vec4.fromValues(0.1,0.5,0.1,1.0);
            // near-white
            this.gapColor = vec4.fromValues( 0.9,0.9,0.9,1.0);
            this.material1.setMatl(Materials.BluePlastic);
            this.material2.setMatl(Materials.GreenPlastic);
            break;
        case GeomShape.Disk:
            //set the ray-tracing function (so we call it using item[i].traceMe() )
            this.traceMe = function(inR,hit,bIsShadowRay) { return this.traceDisk(inR,hit, bIsShadowRay);   };
            this.diskRad = 2.0;
            this.xgap = 61/107;
            this.ygap = 61/107;
            // fraction of xgap used for grid-line width
            this.lineWidth = 0.1;
            // RGBA green(A==opacity)
            this.lineColor = vec4.fromValues(0.1,0.5,0.1,1.0);
            // near-white
            this.gapColor = vec4.fromValues( 0.9,0.9,0.9,1.0);
            this.material1.setMatl(Materials.RedPlastic);
            this.material2.setMatl(Materials.BluePlastic);
            break;
        case GeomShape.Sphere:
            // line-to-line spacing
            this.xgap = 0.5;
            this.ygap = 1.0;
            //set the ray-tracing function (so we call it using item[i].traceMe() )
            this.traceMe = function(inR,hit,bIsShadowRay) { return this.traceSphere(inR,hit, bIsShadowRay); }; 
            // RGBA blue(A==opacity)
            this.lineColor = vec4.fromValues(0.0,0.3,1.0,1.0);
            // Set some Material property
            this.material1.setMatl(Materials.GoldShiny);
            this.material2.setMatl(Materials.SilverShiny);
            break;
        case GeomShape.Box:
            //set the ray-tracing function (so we call it using item[i].traceMe() )
            this.traceMe = function(inR,hit) { this.traceBox(inR,hit);    }; 
            break;
        case GeomShape.Cylinder:
            //set the ray-tracing function (so we call it using item[i].traceMe() )
            // this.traceMe = function(inR,hit) { this.traceCyl(inR,hit);    }; 
            break;
        case GeomShape.Triangle:
            //set the ray-tracing function (so we call it using item[i].traceMe() )
            // this.traceMe = function(inR,hit) { this.traceTri(inR,hit);    }; 
            break;
        case GeomShape.Blobby:
            //set the ray-tracing function (so we call it using item[i].traceMe() )
            // this.traceMe = function(inR,hit) { this.traceBlobby(inR,hit); }; 
            break;
        case GeomShape.SphereImplicit:
            //set the ray-tracing function (so we call it using item[i].traceMe() )
            this.traceMe = function(inR,hit,bIsShadowRay) { return this.SphereTrace(inR,hit, bIsShadowRay); }; 
            this.lineColor = vec4.fromValues(1.0,0.0,0.0,1.0);
            // Set some Material property
            this.material1.setMatl(Materials.GoldShiny);
            this.material2.setMatl(Materials.GoldShiny);
            break;
        case GeomShape.CylinderImplicit:
            //set the ray-tracing function (so we call it using item[i].traceMe() )
            this.traceMe = function(inR,hit,bIsShadowRay) { return this.SphereTrace(inR,hit, bIsShadowRay); }; 
            this.lineColor = vec4.fromValues(0.5,0.5,0.5,1.0);
            break;
        case GeomShape.CubeImplicit:
            //set the ray-tracing function (so we call it using item[i].traceMe() )
            this.traceMe = function(inR,hit,bIsShadowRay) { return this.SphereTrace(inR,hit, bIsShadowRay); }; 
            this.lineColor = vec4.fromValues(0.5,0.5,0.5,1.0);
            break;
        case GeomShape.HoledSphereImplicit:
            //set the ray-tracing function (so we call it using item[i].traceMe() )
            this.traceMe = function(inR,hit,bIsShadowRay) { return this.SphereTrace(inR,hit, bIsShadowRay); }; 
            this.lineColor = vec4.fromValues(0.5,0.5,0.5,1.0);
            break;
        case GeomShape.UnionImplicit:
            //set the ray-tracing function (so we call it using item[i].traceMe() )
            this.traceMe = function(inR,hit,bIsShadowRay) { return this.SphereTrace(inR,hit, bIsShadowRay); }; 
            this.lineColor = vec4.fromValues(0.5,0.5,0.5,1.0);
            break;            
        default:
            console.log("CGeom() constructor: ERROR! INVALID shapeSelect:", shapeSelect);
            return;
            break;
	}

	// Ray transform matrices.
	// Functions setIdent, rayTranslate(), rayRotate(), rayScale()
    // set values for BOTH of these matrices

    // the matrix used to transform rays from world coord sys to model coord sys;
    // This matrix sets shape size, position, orientation, and squash/stretch amount.
	this.worldRay2model = mat4.create(); 

    // worldRay2model^T
    // This matrix transforms MODEL-space normals (where they're easy to find)
    // to WORLD-space coords (where we need them for lighting calculations)
    this.normal2world = mat4.create();
    // But, we need to premultiply by the above matrix to the vector
    // Let's just make the best use of glMatrix library and post multiply the matrix instead
    // this "Post" matrix will be just a transpose of the original matrix
    this.normal2worldPost = mat4.create();
}

CGeom.prototype.setIdent = function()
{
    // Discard worldRay2model contents, replace with identity matrix (world==model).
    mat4.identity(this.worldRay2model);  
    mat4.identity(this.normal2world);
    mat4.transpose(this.normal2worldPost, this.normal2world);
}

CGeom.prototype.rayTranslate = function(x,y,z)
{
    // Translate ray-tracing's current drawing axes (defined by worldRay2model),
    // by the vec3 'offV3' vector amount
    // construct INVERSE translation matrix [T^-1]
    var a = mat4.create();
    a[12] = -x; // x
    a[13] = -y; // y
    a[14] = -z; // z.
    // print_mat4(a,'translate()');
    // [new] = [T^-1]*[OLD]
    mat4.multiply(this.worldRay2model, a, this.worldRay2model);
    // model normals->world
    mat4.transpose(this.normal2world, this.worldRay2model);
    mat4.transpose(this.normal2worldPost, this.normal2world);
}

CGeom.prototype.rayRotate = function(rad, ax, ay, az)
{
    // Rotate ray-tracing's current drawing axes (defined by worldRay2model) around
    // the vec3 'axis' vector by 'rad' radians.
    // (almost all of this copied directly from glMatrix mat4.rotate() function)
    var x = ax, y = ay, z = az;
    var len = Math.sqrt(x * x + y * y + z * z);
    var s, c, t;
    var b00, b01, b02;
    var b10, b11, b12;
    var b20, b21, b22;
    if (Math.abs(len) < glMatrix.GLMAT_EPSILON)
    { 
        console.log("CGeom.rayRotate() ERROR!!! zero-length axis vector!!");
        return null; 
    }
    len = 1 / len;
    x *= len;
    y *= len;
    z *= len;

    // INVERSE rotation; use -rad, not rad
    s = Math.sin(-rad);
    c = Math.cos(-rad);
    t = 1 - c;

    // Construct the elements of the 3x3 rotation matrix. b_rowCol
    // CAREFUL!  I changed something!!
    /// glMatrix mat4.rotate() function constructed the TRANSPOSE of the
    // matrix we want (probably because they used these b_rowCol values for a
    // built-in matrix multiply).
    // What we want is given in https://en.wikipedia.org/wiki/Rotation_matrix at
    // the section "Rotation Matrix from Axis and Angle", and thus
    // I swapped the b10, b01 values; the b02,b20 values, the b21,b12 values.
    b00 = x * x * t + c;     b01 = x * y * t - z * s; b02 = x * z * t + y * s; 
    b10 = y * x * t + z * s; b11 = y * y * t + c;     b12 = y * z * t - x * s; 
    b20 = z * x * t - y * s; b21 = z * y * t + x * s; b22 = z * z * t + c;
    var b = mat4.create();  // build 4x4 rotation matrix from these
    b[0] = b00; b[4] = b01; b[ 8] = b02; b[12] = 0.0; // row0
    b[1] = b10; b[5] = b11; b[ 9] = b12; b[13] = 0.0; // row1
    b[2] = b20; b[6] = b21; b[10] = b22; b[14] = 0.0; // row2
    b[3] = 0.0; b[7] = 0.0; b[11] = 0.0; b[15] = 1.0; // row3
    // print_mat4(b,'rotate()');
    // [new] = [R^-1][old]
    mat4.multiply(this.worldRay2model, b, this.worldRay2model);
    // model normals->world
    mat4.transpose(this.normal2world, this.worldRay2model);
    mat4.transpose(this.normal2worldPost, this.normal2world);
    //mat4.copy(this.normal2worldPost, this.normal2world);
}

CGeom.prototype.rayScale = function(sx,sy,sz)
{
    //  Scale ray-tracing's current drawing axes (defined by worldRay2model),
    //  by the vec3 'scl' vector amount
    if(Math.abs(sx) < glMatrix.GLMAT_EPSILON ||
    Math.abs(sy) < glMatrix.GLMAT_EPSILON ||
    Math.abs(sz) < glMatrix.GLMAT_EPSILON)
    {
        console.log("CGeom.rayScale() ERROR!! zero-length scale!!!");
        return null;
    }
    var c = mat4.create();   // construct INVERSE scale matrix [S^-1]
    c[ 0] = 1/sx; // x  
    c[ 5] = 1/sy; // y
    c[10] = 1/sz; // z.
    // print_mat4(c, 'scale()')'
    // [new] = =[S^-1]*[OLD]
    mat4.multiply(this.worldRay2model, c, this.worldRay2model);
    // model normals->world
    mat4.transpose(this.normal2world, this.worldRay2model);
    mat4.transpose(this.normal2worldPost, this.normal2world);
}

CGeom.prototype.traceGrid = function(inRay, myHit, bIsShadowRay)
{
    // Find intersection of CRay object 'inRay' with grid-plane at z== 0, and
    // if we find a ray/grid intersection CLOSER than CHit object 'hitMe', update
    // the contents of 'hitMe' with all the new hit-point information.
    // No return value
    // (old versions returned an integer 0,1, or -1: see hitMe.hitNum)
    // Set CHit.hitNum:
    // == -1 if ray MISSES the disk
    // ==  0 if ray hits the disk BETWEEN lines
    // ==  1 if ray hits the disk ON the lines

    // HOW TO TRACE A GROUND-PLANE
    // 1) we parameterize the ray by 't', so that we can find any point on the
    // ray by:
    //          Ray(t) = ray.orig + t*ray.dir
    // To find where the ray hit the plane, solve for t where Ray(t) = x,y,zGrid:
    // Re-write:
    //      Ray(t0).x = ray.orig[0] + t0*ray.dir[0] = x-value at hit-point (UNKNOWN!)
    //      Ray(t0).y = ray.orig[1] + t0*ray.dir[1] = y-value at hit-point (UNKNOWN!)
    //      Ray(t0).z = ray.orig[2] + t0*ray.dir[2] = zGrid    (we KNOW this one!)
    //
    //  solve for t0:   t0 = (zGrid - ray.orig[2]) / ray.dir[2]
    //  From t0 we can find x,y value at the hit-point too.
    //  Wait wait wait --- did we consider ALL possibilities?  No, not really:
    //  If t0 <0, we can only hit the plane at points BEHIND our camera;
    //  thus the ray going FORWARD through the camera MISSED the plane!.
    //
    // 2) Our grid-plane exists for all x,y, at the value z=zGrid, and is covered by
    //    a grid of lines whose width is set by 'linewidth'.  The repeated lines of 
    //    constant-x have spacing (repetition period) of xgap, and the lines of
    //    constant-y have spacing of ygap.
    //    GIVEN a hit-point (x,y,zGrid) on the grid-plane, find the color by:
    //         if((x/xgap) has fractional part < linewidth  *OR*
    //            (y/ygap) has fractional part < linewidth), you hit a line on
    //            the grid. Use 'lineColor'.
    //        otherwise, the ray hit BETWEEN the lines; use 'gapColor'

    //------------------ Transform 'inRay' by this.worldRay2model matrx to make rayT
    var rayT = new CRay();    // create a local transformed-ray variable.
    /*
    //  FOR TESTING ONLY:
    vec4.copy(rayT.orig, inRay.orig);   // copy (if we're NOT going to transform grid)
    vec4.copy(rayT.dir, inRay.dir);
    */ 
    vec4.transformMat4(rayT.orig, inRay.orig, this.worldRay2model);
    vec4.transformMat4(rayT.dir,  inRay.dir,  this.worldRay2model);

    // Now use transformed ray 'rayT' for our ray-tracing.
    //------------------End ray-transform.

    // find ray/grid-plane intersection: t0 == value where ray hits plane at z=0.
    var t0 = (-rayT.orig[2])/rayT.dir[2];

    // The BIG QUESTION:  ? Did we just find a hit-point for inRay 
    // =================  ? that is CLOSER to camera than myHit?
    // if(t0 < 0 || t0 > myHit.t0)
    if(t0 < 0 || (!bIsShadowRay && t0 > myHit.t0))
    {
        // NO. Hit-point is BEHIND us, or it's further away than myHit.
        // Leave myHit unchanged. Don't do any further calcs.
        // Bye!
        return false;
    }

    // ***IF*** you're tracing a shadow ray you can stop right here: we know
    // that this ray's path to the light-source is blocked by this CGeom object.
    if (true == bIsShadowRay) return true;

    // YES! we found a better hit-point!
    // Update myHit to describe it
    // record ray-length, and
    myHit.t0 = t0;
    // record the CGeom object that we hit, and
    myHit.hitGeom = this;
    
    // Compute the x,y,z,w point where rayT hit the grid-plane in MODEL coords:
    // vec4.scaleAndAdd(out,a,b,scalar) sets out = a + b*scalar
    vec4.scaleAndAdd(myHit.modelHitPt, rayT.orig, rayT.dir, myHit.t0); 
    // (this is ALSO the world-space hit-point, because we have no transforms)
    // copy world-space hit-point.
    vec4.copy(myHit.hitPt, myHit.modelHitPt);
    
    /* or if you wish:
    // COMPUTE the world-space hit-point:
    vec4.scaleAndAdd(myHit.HitPt, inRay.orig, inRay.dir, myHit.t0);
    */
    
    // reversed, normalized inRay.dir:
    vec4.negate(myHit.viewN, inRay.dir);
    // ( CAREFUL! vec4.negate() changes sign of ALL components: x,y,z,w !!
    // inRay.dir MUST be a vector, not a point, to ensure w sign has no effect)

    // make view vector unit-length.
    vec4.normalize(myHit.viewN, myHit.viewN);
    // surface normal FIXED at world +Z.
    vec4.set(myHit.surfNorm, 0,0,1,0);
    
    // COMPUTE the surface normal:  (needed if you transformed the gnd-plane grid)
    // in model space we know it's always +z,
    // but we need to TRANSFORM the normal to world-space, & re-normalize it.
    vec4.transformMat4(myHit.surfNorm, vec4.fromValues(0,0,1,0), this.normal2worldPost);
    vec4.normalize(myHit.surfNorm, myHit.surfNorm);

    // FIND COLOR at model-space hit-point---------------------------------                        
    var locX = myHit.modelHitPt[0] / this.xgap; // how many 'xgaps' from the origin?
    locX = Math.floor(locX);

    // how many 'ygaps' from origin?
    var locY = myHit.modelHitPt[1] / this.ygap;
    locY = Math.floor(locY);

    if ((locX + locY)%2 != 0)
    {
        myHit.hitNum =  1;
        return true;
    }
    else
    {
        myHit.hitNum = 0;
        return true;
    }
}

CGeom.prototype.traceDisk = function(inRay, myHit, bIsShadowRay)
{ 
    // Find intersection of CRay object 'inRay' with a flat, circular disk in the
    // xy plane, centered at the origin, with radius this.diskRad,
    // and store the ray/disk intersection information on CHit object 'hitMe'.

    // Set CHit.hitNum ==  -1 if ray MISSES the disk
    //                 ==   0 if ray hits the disk BETWEEN lines
    //                 ==   1 if ray hits the disk ON the lines

    
    // Transform 'inRay' by this.worldRay2model matrix;
    
    // create a local transformed-ray variable
    var rayT = new CRay();

    // memory-to-memory copy
    vec4.copy(rayT.orig, inRay.orig);
    vec4.copy(rayT.dir, inRay.dir);

    vec4.transformMat4(rayT.orig, inRay.orig, this.worldRay2model);
    vec4.transformMat4(rayT.dir,  inRay.dir,  this.worldRay2model);

    
    // (disk is in z==0 plane)
    var t0 = -rayT.orig[2]/rayT.dir[2];

    if(t0 < 0 || (!bIsShadowRay && t0 > myHit.t0))
    {
        return false;
    }

    var modelHit = vec4.create();
    vec4.scaleAndAdd(modelHit, rayT.orig, rayT.dir, t0);

    if(modelHit[0]*modelHit[0] + modelHit[1]*modelHit[1] > this.diskRad*this.diskRad)
    {
        return false;
    }

    // ***IF*** you're tracing a shadow ray you can stop right here: we know
    // that this ray's path to the light-source is blocked by this CGeom object.
    if (true == bIsShadowRay) return true;

    // record ray-length
    myHit.t0 = t0;
    // record this CGeom object as the one we hit
    myHit.hitGeom = this;
    // record the model-space hit-pt
    vec4.copy(myHit.modelHitPt, modelHit);

    // compute the x,y,z,w point where inRay hit in WORLD coords
    vec4.scaleAndAdd(myHit.hitPt, inRay.orig, inRay.dir, myHit.t0);

    // set 'viewN' member to the reversed, normalized inRay.dir vector:
    vec4.negate(myHit.viewN, inRay.dir);
    // ( CAREFUL! vec4.negate() changes sign of ALL components: x,y,z,w !!
    // inRay.dir MUST be a vector, not a point, to ensure w sign has no effect)
    
    // ensure a unit-length vector.
    vec4.normalize(myHit.viewN, myHit.viewN);
    
    // Now find surface normal: 
    // in model space we know it's always +z,
    // but we need to TRANSFORM the normal to world-space, & re-normalize it.
    vec4.transformMat4(myHit.surfNorm, vec4.fromValues(0,0,1,0), this.normal2worldPost);
    vec4.normalize(myHit.surfNorm, myHit.surfNorm);
  
    // Hit point color:    
    // how many 'xgaps' from the origin?
    var loc = myHit.modelHitPt[0] / this.xgap;
    // keep >0 to form double-width line at yaxis.
    if(myHit.modelHitPt[0] < 0) loc = -loc;

    // fractional part of loc < linewidth? 
    if(loc%1 < this.lineWidth)
    {
        // YES. rayT hit a line of constant-x
        myHit.hitNum =  0;
        return true;
    }
    // how many 'ygaps' from origin?
    loc = myHit.modelHitPt[1] / this.ygap;
    // keep >0 to form double-width line at xaxis.
    if(myHit.modelHitPt[1] < 0) loc = -loc;

    // fractional part of loc < linewidth? 
    if(loc%1 < this.lineWidth)
    {
        // YES. rayT hit a line of constant-y
        myHit.hitNum = 0;
        return true;
    }

    // No.
    myHit.hitNum = 1;
    return true;
}

CGeom.prototype.traceSphere = function(inRay, myHit, bIsShadowRay)
{ 
    var rayT = new CRay();
    vec4.copy(rayT.orig, inRay.orig);
    vec4.copy(rayT.dir, inRay.dir);
    vec4.transformMat4(rayT.orig, inRay.orig, this.worldRay2model);
    vec4.transformMat4(rayT.dir,  inRay.dir,  this.worldRay2model);
  
    // Step 2: Test 1st triangle. Did ray MISS sphere entirely?
    var r2s = vec4.create();
    vec4.subtract(r2s, vec4.fromValues(0,0,0,1), rayT.orig);
    // Find L2, the squared length of r2s, by dot-product with itself:
    // NOTE: vec3.dot() IGNORES the 'w' values when 
    var L2 = vec3.dot(r2s,r2s);

    // if L2 <=1.0, ray starts AT or INSIDE the unit sphere surface (!). 
    if(L2 <= 1.0)
    {
        return true;
    }

    // tcaS == SCALED tca;
    var tcaS = vec3.dot(rayT.dir, r2s);
  
    // Is the chord mid-point BEHIND the camera(where t<0)?
    if(tcaS < 0.0)
    {
        return false;
    }

    // STEP 3: Measure 1st triangle
    var DL2 = vec3.dot(rayT.dir, rayT.dir);
    var tca2 = tcaS*tcaS / DL2;

    var LM2 = L2 - tca2;
    // if LM2 > radius^2, then chord mid-point is OUTSIDE the
    // sphere entirely. Once again, our ray MISSED the sphere.
    // DON'T change myHit, don't do any further calcs. Bye!
    if(LM2 > 1.0)
    {
        return false;
    }
    // ***IF*** you're tracing a shadow ray you can stop right here: we know
    // that this ray's path to the light-source is blocked by this CGeom object.

    if (true == bIsShadowRay)
    {
        // console.log("Sphere intersected");
        return true;
    }

    // STEP 4: Measure 2nd triangle
    // SQUARED half-chord length.
    var L2hc = (1.0 - LM2);
  
    // STEP 5: Measure RAY using 2nd triangle
    //      ====================================
    //      t0hit = tcaS/DL2 - sqrt(L2hc/DL2)
    //      t1hit = tcaS/DL2 + sqrt(L2hc/DL2)
    //      ====================================
    //  We know both hit-points are in front of ray, thus t0hit >0 and t1hit >0.
    //  We also know that Math.sqrt() always returns values >=0, and thus
    // we know the hit-point NEAREST the ray's origin MUST be t0hit. 
    var t0hit = tcaS/DL2 -Math.sqrt(L2hc/DL2);  // closer of the 2 hit-points.
    // is this new hit-point CLOSER than 'myHit'?
    if(t0hit > myHit.t0)
    {
        // NO.  DON'T change myHit, don't do any further calcs. Bye!
        return true;
    }
    // YES! we found a better hit-point!
    
    // Update myHit to describe it
    // record ray-length, and
    myHit.t0 = t0hit;
    // record this CGeom object as the one we hit, and
    myHit.hitGeom = this;
    
    // Compute the point where rayT hit the sphere in MODEL coords:
    // vec4.scaleAndAdd(out,a,b,scalar) sets out = a + b*scalar
    vec4.scaleAndAdd(myHit.modelHitPt, rayT.orig, rayT.dir, myHit.t0); 
    
    // Compute the point where inRay hit the grid-plane in WORLD coords:
    vec4.scaleAndAdd(myHit.hitPt, inRay.orig, inRay.dir, myHit.t0);
    
    // set 'viewN' member to the reversed, normalized inRay.dir vector:
    // ( CAREFUL! vec4.negate() changes sign of ALL components: x,y,z,w !!
    // inRay.dir MUST be a vector, not a point, to ensure w sign has no effect)
    vec4.negate(myHit.viewN, inRay.dir); 
    
    // ensure a unit-length vector
    vec4.normalize(myHit.viewN, myHit.viewN);
    
    // Now find surface normal: 
    // normal to sphere is the line from its origin to the point of intersection on surface
    // but we need to TRANSFORM the normal to world-space, & re-normalize it.
    vec4.subtract(myHit.surfNorm, myHit.modelHitPt, vec4.fromValues(0.0,0.0,0.0,1.0));
    vec4.transformMat4(myHit.surfNorm, myHit.surfNorm, this.normal2worldPost);
    vec4.normalize(myHit.surfNorm, myHit.surfNorm);

    var x = myHit.modelHitPt[0];
    var y = myHit.modelHitPt[1];
    var z = myHit.modelHitPt[2];
    var tot = Math.floor(x/this.xgap) + Math.floor(y/this.xgap) + Math.floor(z/this.xgap);
    // if (tot < 0) tot = -tot;
    if (tot%2 == 0)
    {
        myHit.hitNum = 0;
    }
    else
    {
        // TEMPORARY: sphere color-setting
        // in CScene.makeRayTracedImage, use 'this.gapColor'
        myHit.hitNum = 1;
    }    

    /*
    // DIAGNOSTIC
    if(g_myScene.pixFlag ==1)
    {
        // did we reach the one 'flagged' pixel
        // chosen in CScene.makeRayTracedImage()?
        console.log("r2s:", r2s, "L2", L2, "tcaS", tcaS, "tca2", tca2,
        "LM2", LM2, "L2hc", L2hc, "t0hit", t0hit, );  // YES!
    }
    // END DIAGNOSTIC
    */
    

    // FOR LATER:
    // If the ray begins INSIDE the sphere (because L2 < radius^2),
    //      ====================================
    //      t0 = tcaS/DL2 - sqrt(L2hc/DL2)  // NEGATIVE; behind the ray start pt
    //      t1 = tcaS/DL2 + sqrt(L2hc/DL2)  // POSITIVE: in front of ray origin.
    //      ====================================
    //  Use the t1 hit point, as only t1 is AHEAD of the ray's origin.

    return true;
}



/**
 * @param {CRay} inRay 
 * @param {CHit} myHit 
 * @param {boolean} bIsShadowRay 
 * @returns {boolean} true if in shadow, false otherwise
 * @description took help of pseduocode provided here:
 * https://www.scratchapixel.com/lessons/advanced-rendering/rendering-distance-fields/basic-sphere-tracer
 */
CGeom.prototype.SphereTrace = function(inRay, myHit, bIsShadowRay)
{ 
    // DIAGNOSTIC
    // did we reach the one 'flagged' pixel
    // chosen in CScene.makeRayTracedImage()?
    // if(g_myScene.pixFlag ==1)
    // {
    //     // YES!
    //     console.log("you called CGeom.traceSphere");
    // }
    // END DIAGNOSTIC
    
    vec4.normalize(inRay.dir, inRay.dir);
    
    var rayT = new CRay();
    vec4.copy(rayT.orig, inRay.orig);
    vec4.copy(rayT.dir, inRay.dir);
    vec4.transformMat4(rayT.orig, inRay.orig, this.worldRay2model);
    vec4.transformMat4(rayT.dir,  inRay.dir,  this.worldRay2model);

    var maxDistance = 100;
    var threshold = 1.0E-6;
    var numStpes = 0;
    var t = 0;

    while (t < maxDistance)
    {
        // get the current location from t, orig and dir
        var currPt = vec4.create();
        vec4.scaleAndAdd(currPt, rayT.orig, rayT.dir, t);


        // get the SDF for the given implicit surface
        var d = 0;
        var normDir = vec4.create();
        switch(this.shapeType)
        {
            case GeomShape.SphereImplicit:
                // d = Math.max(this.getSphereSDF(currPt), -this.getCylinderSDF(currPt));
                d = this.getSphereSDF(currPt);
                break;
            case GeomShape.CylinderImplicit:
                d = this.getCylinderSDF(currPt, normDir);
                break;
            case GeomShape.CubeImplicit:
                d = this.getCubeSDF(currPt, normDir);
                break;
            case GeomShape.HoledSphereImplicit:
                d = Math.max(this.getSphereSDF(currPt), -this.getCylinderSDF(currPt, normDir));
                break;
            case GeomShape.UnionImplicit:
                d = Math.min(this.getSphereSDF(currPt), this.getCylinderSDF(currPt, normDir));
                break;                
            default:
                break;
        }

        if (d < threshold*t) // we have an intersection!
        {
            {
            if(t > myHit.t0)
            {
                // NO.  DON'T change myHit, don't do any further calcs. Bye!
                return true;
            }
            // Update myHit to describe it
            // record ray-length, and
            myHit.t0 = t;
            // record this CGeom object as the one we hit, and
            myHit.hitGeom = this;
            
            // Compute the point where rayT hit the sphere in MODEL coords:
            // vec4.scaleAndAdd(out,a,b,scalar) sets out = a + b*scalar
            vec4.scaleAndAdd(myHit.modelHitPt, rayT.orig, rayT.dir, myHit.t0); 
            
            // Compute the point where inRay hit the grid-plane in WORLD coords:
            vec4.scaleAndAdd(myHit.hitPt, inRay.orig, inRay.dir, myHit.t0);
            
            // set 'viewN' member to the reversed, normalized inRay.dir vector:
            // ( CAREFUL! vec4.negate() changes sign of ALL components: x,y,z,w !!
            // inRay.dir MUST be a vector, not a point, to ensure w sign has no effect)
            vec4.negate(myHit.viewN, inRay.dir); 
            
            // ensure a unit-length vector
            vec4.normalize(myHit.viewN, myHit.viewN);
            
            // Now find surface normal: 
            // normal to sphere is the line from its origin to the point of intersection on surface
            // but we need to TRANSFORM the normal to world-space, & re-normalize it.
            vec4.subtract(myHit.surfNorm, myHit.modelHitPt, vec4.fromValues(0.0,0.0,0.0,1.0));
            if (this.shapeType == GeomShape.CylinderImplicit ||
                this.shapeType == GeomShape.CubeImplicit)
            {
                vec4.copy(myHit.surfNorm, normDir);
            }
            //mat4.transpose(this.normal2worldPost, this.normal2world);
            //vec4.transformMat4(myHit.surfNorm, myHit.surfNorm, this.normal2worldPost);
            vec4.normalize(myHit.surfNorm, myHit.surfNorm);
            
            // TEMPORARY: sphere color-setting
            // in CScene.makeRayTracedImage, use 'this.gapColor'
            myHit.hitNum = 1;
            // boolean return is for shadow ray:
            }
            return true;
        }

        t = t + d;
        numSteps = numStpes + 1;
    }

    // if it reaches outside the loop, then it has not intersected the sphere
    // So, no shadow also
    return false;

    

    // DIAGNOSTIC
    // if(g_myScene.pixFlag ==1)
    // {
    //     // did we reach the one 'flagged' pixel
    //     // chosen in CScene.makeRayTracedImage()?
    //     console.log("r2s:", r2s, "L2", L2, "tcaS", tcaS, "tca2", tca2,
    //     "LM2", LM2, "L2hc", L2hc, "t0hit", t0hit, );  // YES!
    // }
    // END DIAGNOSTIC
}

CGeom.prototype.getSphereSDF = function(fromPoint)
{
    // center = origin (0,0,0)
    // radius = 1.0
    var distP2C = vec4.create();
    vec4.subtract(distP2C, fromPoint, vec4.fromValues(0.0, 0.0, 0.0, 1.0));
    f = vec4.length(distP2C) - 1.0;
    return f;
}

CGeom.prototype.getCylinderSDF = function(fromPoint, normDir)
{
    // get the distance of the point from the z axis
    // subtract the value of radius from that distance
    // center = origin (0,0,0)
    // centre-axis = z-axis
    // radius = 1.0

    //if (fromPoint[3] < 1 || fromPoint >)

    // distance from axis
    // vec2.length(xyzw) -> sqrt(x^2 + y^2)
    f1 = vec2.length(fromPoint) - 0.5;

    // distance from end 1 (z = 1.0)
    f2 = fromPoint[2] - 1.0;

    // distance from end 2 (z = -1.0)
    f3 = -1.0 - fromPoint[2];

    // case 1: inside the length of cylinder
    if (f2 <= 0 && f3 <= 0)
    {
        normDir = vec4.fromValues(fromPoint[0], fromPoint[1], 0.0, 0.0);
        return f1;
    }
    // case 2: inside the radial distance
    var f = Math.max(f2, f3);
    if (f1 < 0)
    {
        // return the one which has positive value
        // (will also be max of the 2)
        return f;
    }
    // case 3: outside the radial and length both
    else
    {
        return Math.sqrt(f*f + f1*f1);
    }
}

CGeom.prototype.getCubeSDF = function(fromPoint, normDir)
{
    // let us first transfer the fromPoint to +ve 1st Quadrant
    fromPoint[0] = Math.abs(fromPoint[0]);
    fromPoint[1] = Math.abs(fromPoint[1]);
    fromPoint[2] = Math.abs(fromPoint[2]);
    fromPoint[3] = Math.abs(fromPoint[3]);

    // take the difference vector from the corner
    var vCorner = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
    var vDiff = vec4.create();
    vec4.subtract(vDiff, fromPoint, vCorner);

    var vDiff2 = vec4.create();
    vec4.max(vDiff2, vDiff, vec4.fromValues(0,0,0,0));

    // var nearestDist = Math.max(vDiff[0], Math.max(vDiff[1], vDiff[2]));
    // nearestDist = Math.min(nearestDist, 0.0);

    // vec4.max(vDiff, vDiff, vec4.fromValues(0,0,0,0));
    // nearestDist += vec3.length(vDiff);

    var len = vec3.length(vDiff2);
    if (len > 0)
    {
        /*var largestDiff = 1E10;
        if (vDiff2[0] >0 && vDiff2[0]<largestDiff)
        {
            largestDiff = vDiff2[0];
            vec4.copy(normDir, vec4.fromValues(1.0, 0.0, 0.0, 1.0));
        }
        if (vDiff2[1] >0 && vDiff2[1]<largestDiff)
        {
            largestDiff = vDiff2[1];
            vec4.copy(normDir, vec4.fromValues(0.0, 1.0, 0.0, 1.0));
        }
        if (vDiff2[2] >0 && vDiff2[2]<largestDiff)
        {
            largestDiff = vDiff2[2];
            vec4.copy(normDir, vec4.fromValues(0.0, 0.0, 1.0, 1.0));
        }*/
        return len;
    }
    else
    {
        return vec3.length(vDiff);
    }
}