function animate(timeStep) {
    //==============================================================================
    // Calculate the elapsed time
    var now = Date.now();   
    var elapsed = now - g_last;   
    g_last = now;
    // Return the amount of time passed.
    return elapsed;
}