
function myKeyDown(ev) {
    //===============================================================================
    var xd = g_EyeX - g_AtX;
    var yd = g_EyeY - g_AtY;
    var zd = g_EyeZ - g_AtZ;

    var lxy = Math.sqrt(xd * xd + yd * yd);

    var l = Math.sqrt(xd * xd + yd * yd + zd * zd);

    switch (ev.keyCode) {      
        case 65:   
            if (flag == -1) theta = -Math.acos(xd / lxy) + 0.1;
            else theta = theta + 0.1;
            g_AtX = g_EyeX + lxy * Math.cos(theta);
            g_AtY = g_EyeY + lxy * Math.sin(theta);
            flag = 1;
            break;
        case 87: 
            g_AtZ = g_AtZ + 0.1;
            break;
        case 68:  
            if (flag == -1) theta = -Math.acos(xd / lxy) - 0.1;
            else theta = theta - 0.1;
            g_AtX = g_EyeX + lxy * Math.cos(theta);
            g_AtY = g_EyeY + lxy * Math.sin(theta);
            flag = 1;
            break;
        case 83:   
            g_AtZ = g_AtZ - 0.1;
            break;

        case 38:    
            g_AtX = g_AtX - 0.1 * (xd / l);
            g_AtY = g_AtY - 0.1 * (yd / l);
            g_AtZ = g_AtZ - 0.1 * (zd / l);

            g_EyeX = g_EyeX - 0.1 * (xd / l);
            g_EyeY = g_EyeY - 0.1 * (yd / l);
            g_EyeZ = g_EyeZ - 0.1 * (zd / l);
            break;

        case 40:   
            g_AtX = g_AtX + 0.1 * (xd / l);
            g_AtY = g_AtY + 0.1 * (yd / l);
            g_AtZ = g_AtZ + 0.1 * (zd / l);

            g_EyeX = g_EyeX + 0.1 * (xd / l);
            g_EyeY = g_EyeY + 0.1 * (yd / l);
            g_EyeZ = g_EyeZ + 0.1 * (zd / l);

            break;

        case 72: 
            if (headlightOn)
                headlightOn = false;
            else
                headlightOn = true;
            break;

        case 73:
            if (worldLightOn)
                worldLightOn = false;
            else
                worldLightOn = true;
            break;

        case 77: //m
            switchModes();
            break;
    }
}
function myKeyUp(ev) {
}
function myKeyPress(ev) {
}
function switchModes() {
    var mood;
    if (lMode == maxModes) {
        lMode = 1;
    }
    else{
        lMode++;
    }
    if(lMode == 1){
        mood = "Phong lighting with Phong Shading";
    }
    else if(lMode == 2){
        mood = "Blinn-Phong lighting with Phong Shading";
    }
    else if(lMode == 3){
        mood = "Phong lighting with Gouraud Shading";
    }
    else{
        mood = "Blinn-Phong lighting with Gouraud Shading";
    }
    document.getElementById("lMode").innerHTML = "Light Mode: " + mood; 
}