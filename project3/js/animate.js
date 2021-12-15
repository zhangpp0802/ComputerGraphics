var g_last = Date.now();
function animate() {
    //==============================================================================
    // Calculate the elapsed time
    var now = Date.now();
    var elapsed = now - g_last;
    g_last = now;

    currentAngle = currentAngle + (ANGLE_STEP * elapsed) / 1000.0;
    currentAngle %= 360;

    if (treeAngle > 30.0 && TREE_ANGLE_STEP > 0) TREE_ANGLE_STEP = -TREE_ANGLE_STEP;
    if (treeAngle < -65.0 && TREE_ANGLE_STEP < 0) TREE_ANGLE_STEP = -TREE_ANGLE_STEP;
    var newAngle = treeAngle + (TREE_ANGLE_STEP * elapsed) / 1000.0;
    treeAngle = newAngle %= 360;
}