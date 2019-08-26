var canvas = document.getElementById("canvas");
var ctx=canvas.getContext("2d");
var x0 = -1;
var y0 = -1;
var lx = 0;
var ly = 0;
var colors = [];
var COLORBAR = 50;
var TOOLBAR=80;
var WIDTH=1024;
var HEIGHT=768;
var isPlaying = false;
var stamp=null;

if (document.body.clientHeight && document.body.clientWidth){
    WIDTH = document.body.clientWidth;
    HEIGHT = document.body.clientHeight ;
    console.log("resize to",WIDTH,HEIGHT)
}
canvas.setAttribute("width",WIDTH);
canvas.setAttribute("height",HEIGHT);

var cols=["2","a","f"];
var ncol=cols.length*cols.length*cols.length;
var dx=WIDTH/ncol;
var images = 0;
function loadImages(){
    images++;
    console.log("Images",images);
    if (images==4){
        clearWindow();
    }
}

var trashIcon = new Image();
trashIcon.src="img/trash.png";
trashIcon.onload=loadImages;
var undoIcon = new Image();
undoIcon.src="img/undo.png";
undoIcon.onload=loadImages;
var playIcon = new Image();
playIcon.src="img/play.png";
playIcon.onload=loadImages;
var splatIcon = new Image();
splatIcon.src="img/splat.png";
splatIcon.onload=loadImages;

var tools=[
    {
        image: trashIcon,
        height: 60,
        onclick: clearWindow
    },
    {
        image: undoIcon,
        height: 60,
        onclick: unDo
    },
    {
        image: splatIcon,
        height: 60,
        onclick: function(){ setStamp(splat) }
    },
    {
        circle: 4, 
        height: 60,
        onclick: function(){ setRadius(null,4) }
    },
    {
        circle: 8, 
        height: 60,
        onclick: function(){ setRadius(null,8) }
    },
    {
        circle: 16, 
        height: 60,
        onclick: function(){ setRadius(null,16) }
    },
    {
        circle: 22, 
        height: 60,
        onclick: function(){ setRadius(null,22) }
    },
    {
        image: playIcon,
        height: 60,
        onclick: function(){ reDraw(null,10) }
    },

]


document.addEventListener("mousedown",function(ev){
    if (ev.button==0 && !isPlaying){
        pointerStart(ev.clientX,ev.clientY);
    }
}, false);

document.addEventListener("mousemove",function(ev){
    if (x0 == -1 || isPlaying){
        return;
    }
    pointerMove(ev.clientX,ev.clientY);
}, false);

document.addEventListener("mouseup",function(ev){
    if (x0 == -1 || isPlaying){
        return;
    }
    pointerEnd(ev.clientX,ev.clientY);
    drawBar();
}, false);

document.addEventListener("touchstart",function(ev){
    if (isPlaying){
        return false;
    }
    pointerStart(ev.touches[0].clientX,ev.touches[0].clientY);
}, false);

document.addEventListener("touchmove",function(ev){
    if (x0 == -1 || isPlaying){
        return;
    }
    pointerMove(ev.touches[0].clientX,ev.touches[0].clientY);
}, false);

document.addEventListener("touchend",function(ev){
    if (x0 == -1 || isPlaying){
        return;
    }
    pointerEnd(ev.changedTouches[0].clientX,ev.changedTouches[0].clientY);
    drawBar();
}, false);


function translatedX(x){
    var rect = canvas.getBoundingClientRect();
    var factor = WIDTH / rect.width;
    return factor * (x - rect.left);
}

function translatedY(y){
    var rect = canvas.getBoundingClientRect();
    var factor = WIDTH / rect.width;
    return factor * (y - rect.top);
}


function pointerStart(x,y){
    var tx = translatedX(x);
    var ty = translatedY(y)
    if (ty>HEIGHT-COLORBAR){
        var pos = Math.floor(tx / dx);
        setColor(colors[pos]);
        return;
    }
    if (tx>WIDTH-TOOLBAR){
        for(var i=0;i<tools.length;i++){
            var tool=tools[i];
            if (tool.x0<=ty && tool.x0+tool.currentHeight>ty){
                tool.onclick();
                break;
            }
        }
        return;
    }
    if (stamp !=null){
        stamp(tx,ty);
        return;
    }
    x0 = tx;
    y0 = ty;
    drawPoint(x0, y0);

}

function setColor(col){
    console.log(col);
    color = col;
    currentLog=[];
    currentLog.push(['setColor',col]);
    log.push(currentLog);
    drawBar();
}

function pointerMove(x,y){
    if (x0>0 && y0>0){
        var x1 = translatedX(x)
        var y1 = translatedY(y)
        lineToPoint(x1, y1);
        if (y1>HEIGHT-COLORBAR){
            drawBar();
        }
        if (x1>WIDTH-TOOLBAR){
            drawBar();
        }
    }
}

function pointerEnd(x,y){
    console.log("end")
    lastX = x0;
    lastY = y0;
    x0 = -1;
    y0 = -1;
    endLine();
}

var radius=8;
var color="#000";
var log=[];
var currentLog=[];

function drawPoint(x,y){
    lx = x;
    ly = y;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = radius*2;
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    ctx.fill();
    currentLog=[];
    currentLog.push(['drawPoint',x,y]);
}

function lineToPoint(x,y){
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = radius*2;
    ctx.moveTo(lx, ly);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    ctx.fill();
    lx = x;
    ly = y;
    currentLog.push(['lineToPoint',x,y]);
}

function endLine(){
    if (currentLog.length){
        log.push(currentLog);
    }
    currentLog=[];
}

function drawBar(){
    colors = [];
    var c =0;
    for(var r=0;r<cols.length;r++){
        for(var g=0;g<cols.length;g++){
            for(var b=0;b<cols.length;b++){                
                var col = "#"+(cols[r]+cols[g]+cols[b]);
                var px = c*dx;
                ctx.fillStyle = col;
                ctx.fillRect(px,HEIGHT-COLORBAR,dx,COLORBAR);
                colors.push(col);    
                if (col==color){
                    ctx.beginPath();
                    ctx.fillStyle = "#ddd";
                    ctx.arc(px+(dx/2), HEIGHT-(COLORBAR/2), dx/2, 0, 2 * Math.PI, false);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.beginPath();
                    ctx.fillStyle = "#fff";
                    ctx.arc(px+(dx/2), HEIGHT-(COLORBAR/2), dx/2.5, 0, 2 * Math.PI, false);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.fillStyle = color;
                    ctx.arc(px+(dx/2), HEIGHT-(COLORBAR/2), dx/3, 0, 2 * Math.PI, false);
                    ctx.fill();
                }
                c++;
            }
        }
    }
    ctx.fillStyle = "#ddd";
    ctx.fillRect(WIDTH-TOOLBAR,0,TOOLBAR,HEIGHT-COLORBAR);
    var h0 = 10;
    var tbHeight =0;
    for(var i=0;i<tools.length;i++){
        tbHeight+= tools[i].height;
    }
    var factor=(HEIGHT-COLORBAR-tools.length*10)/tbHeight;
    console.log("factor",factor)
    for(var i=0;i<tools.length;i++){
        var tool=tools[i];
        var fHeight = tool.height * factor;
        ctx.fillStyle = "#fff";
        if (radius == tool.circle){
            ctx.fillStyle = "#ffd";
        }
        ctx.fillRect(WIDTH-TOOLBAR + 5,h0,TOOLBAR-10,fHeight);
        tool.x0 = h0;
        if (tool.circle){
            ctx.beginPath();
            ctx.fillStyle = "#444";
            ctx.arc(WIDTH-TOOLBAR/2, h0 + fHeight/2, tool.circle*factor+3, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.arc(WIDTH-TOOLBAR/2, h0 + fHeight/2, tool.circle*factor, 0, 2 * Math.PI, false);
            ctx.fill();
        }
        if (tool.text){
            ctx.fillStyle = "#222";
            ctx.textAlign = "center";
            ctx.font = "20px Arial";
            ctx.fillText(tool.text, WIDTH-TOOLBAR/2, h0+ fHeight/2);
        }
        if(tool.image){
            ctx.drawImage(tool.image,WIDTH-TOOLBAR+5+(TOOLBAR-fHeight)/2, h0+5, fHeight-10, fHeight-10);
        }
        tool.currentHeight = fHeight;
        h0+=fHeight+5;
    }

}

function clearWindow(ev){
    console.log('clear');
    setColor("#000");
    log=[];
    currentLog=[];
    ctx.fillStyle = "#eee";
    ctx.fillRect(0,0,WIDTH,HEIGHT);
    drawBar();
    if (ev){
        ev.preventDefault();
        ev.stopPropagation();    
    }
}

function logger(msg){
    return;
    ctx.fillStyle = "#eee";
    ctx.fillRect(0,0,WIDTH,30);
    ctx.fillStyle = "#000";
    ctx.font = "14px Arial";
    ctx.fillText(msg, 50, 15);
}

function setStamp(obj){
    stamp = obj;
    currentLog=[];
    currentLog.push(['setStamp',obj]);
    log.push(currentLog);
}

function setRadius(ev,rad){
    radius=rad;
    stamp = null;
    if (ev){
        ev.preventDefault();
        ev.stopPropagation();    
    }
    currentLog=[];
    currentLog.push(['setRadius',null,rad]);
    log.push(currentLog);
    drawBar();
}

function unDo(ev){
    var last=log.pop();
    console.log(last);
    reDraw(ev,0);
}

function splat(x,y){
    var c=document.createElement("canvas");
    c.setAttribute("width",splatIcon.width);
    c.setAttribute("height",splatIcon.height);
    document.body.appendChild(c);
    ctx2 = c.getContext("2d");
    ctx2.fillStyle = color;
    ctx2.fillRect(0, 0, c.width, c.height);
    ctx2.globalCompositeOperation = "destination-in";
    ctx2.drawImage(splatIcon, 0,0);
    ctx.drawImage(c,x-splatIcon.width/2,y-splatIcon.height/2);
    currentLog=[];
    currentLog.push(['splat',x,y]);
    log.push(currentLog);
}



function reDraw(ev,dt){
    if (ev){
        ev.preventDefault();
        ev.stopPropagation();    
    }
    isPlaying = true;
    if (typeof(dt)=="undefined"){
        dt = 0;
    }
    var dlog=JSON.parse(JSON.stringify(log));
    clearWindow();
    var t=100;
    for(var index in dlog){
        var log1=dlog[index];
        for(var index1 in log1){
            var func=log1[index1][0];
            var p1=log1[index1][1];
            var p2=log1[index1][2];
            setTimeout(window[func],t,p1,p2);
            t+=dt;
        }
        if (!isPlaying){
            break;
        }
    }
    t+=100;
    setTimeout(function(){ 
        log=dlog;
        isPlaying = false;
        drawBar();
    } ,t);
}

window.onerror=function(e){
    alert(e)
}

document.addEventListener('deviceready',function(){
    console.log("deviceready")
    if (window.screen && window.screen.orientation){
        console.log("orientation", window.screen.orientation)
        window.screen.orientation.lock('landscape');
    }
},false)