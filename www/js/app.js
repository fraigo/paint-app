var canvas = document.getElementById("canvas");
var ctx=canvas.getContext("2d");
var canvas2 = document.getElementById("tools");
var ctx2=canvas2.getContext("2d");

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

var imageFiles=[
    "trash",
    "undo",
    "play",
    "camera",
    "fill",
    "splat",
    "square",
    "circle",
    "triangle",
    "triangle2",
    'heart',
    'diamond',
    "star"
]
var stamps=[
    'circle',
    'square',
    'splat',
    'triangle',
    'triangle2',
    'heart',
    'diamond',
    'star'
]
var continuous= {
    'circle' : true,
    'square' : true,
}
var stamp='circle';



var colorList=[
    "000",
    "888",
    "ccc",
    "ddd",
    "800",
    "c00",
    "e48",
    "fcd",
    "644",
    "930",
    "f60",
    "f90",
    "fc0",
    "ff4",
    "60c",
    "90f",
    "006",
    "008",
    "44c",
    "bef",
    "040",
    "080",
    "0c0",
    "fff"
];
var ncol=colorList.length;
var dx=(WIDTH)/ncol;
var imageCount = 0;
var stampTool = null;
var radius=8;
var color="#000";
var log=[];
var currentLog=[];


var images={

}

function loadImages(){
    imageCount++;
    if (imageCount==imageFiles.length){
        clearWindow();
    }
}

for (var idx in imageFiles){
    var img = new Image();
    img.src="img/"+imageFiles[idx]+".png";
    img.onload=loadImages;
    images[imageFiles[idx]]=img;
}

var tools=[
    {
        image: 'trash',
        height: 60,
        onclick: clearWindow,
        hint: 'Clear',
    },
    {
        image: 'undo',
        height: 60,
        onclick: unDo,
        hint: 'Undo'
    },
    {
        image: stamp,
        height: 60,
        onclick: function(){ 
            var next=(stamps.indexOf(stamp)+1) % stamps.length; 
            this.image = stamps[next]
            setStamp(stamps[next]);
        },
        hint: 'Stamp'
    },
    {
        radius: 4, 
        height: 60,
        onclick: function(){ setRadius(4) },
        background: '#ddd'
    },
    {
        radius: 8, 
        height: 60,
        onclick: function(){ setRadius(8) },
        background: '#ddd'
    },
    {
        radius: 16, 
        height: 60,
        onclick: function(){ setRadius(16) },
        background: '#ddd'
    },
    {
        radius: 32, 
        height: 60,
        onclick: function(){ setRadius(32) },
        background: '#ddd'
    },
    {
        image: 'fill',
        height: 60,
        onclick: fillCanvas,
        hint: 'Fill'
    },
    {
        image: 'play',
        height: 60,
        onclick: function(){ reDraw(8) },
        hint: 'Redo wrawing'
    }
]

if (!window.cordova){
    tools.push({
        image: 'camera',
        height: 60,
        onclick: function(){ getImage() },
        hint: 'Save drawing'
    })
}

var toolbar = document.getElementById('toolbar');

function drawToolbar(){
    console.log("drawToolbar",stamp);
    toolbar.innerHTML="";
    for(var i=0;i<tools.length;i++){
        var tool=tools[i];
        var div = document.createElement('div');
        div.className = "tool";
        div.style.cursor = "pointer";
        if (tool.image){
            var img = images[tool.image];
            if (tool.hint=='Stamp'){
                div.style.backgroundImage = "url("+images[stamp].src+")";
            } else {
                div.style.backgroundImage = "url("+img.src+")";
            }
        }
        if (tool.radius){
            var dot = document.createElement('div');
            dot.className = "dot";
            dot.style.width = tool.radius+"px";
            dot.style.height = tool.radius+"px";
            if (tool.radius==radius){
                div.setAttribute('selected',1)
            }
            var stm = images[stamp];
            if (stm){
                dot.style.backgroundImage = "url("+stm.src+")";
                dot.style.backgroundSize = "contain";
            } else {
                dot.style.backgroundColor = color;
                dot.style.borderRadius = "50%";
            }
            div.appendChild(dot);
        }
        if (tool.hint=='Stamp'){
            stampTool = div
        }
        div.setAttribute('index',i);
        var listener = function(ev){
            var idx = ev.target.getAttribute('index') * 1;
            console.log('tool',idx,tools[idx]);
            ev.preventDefault();
            if (ev.stopPropagation){
                ev.stopPropagation();
            } else {
                ev.cancelBubble = true;
            }
            tools[idx].onclick(ev);
            setTimeout(function(){
                
            },500);
        }
        div.addEventListener('mousedown', listener);
        toolbar.appendChild(div);
        tool.div = div;
    }
}

document.addEventListener("mousedown",function(ev){
    if (ev){
        ev.preventDefault();
        ev.stopPropagation();    
    }
    if (ev.button==0 && !isPlaying){
        pointerStart(ev.clientX,ev.clientY);
    }
}, false);

document.addEventListener("mousemove",function(ev){
    if (ev){
        ev.preventDefault();
        ev.stopPropagation();    
    }
    if (x0 == -1 || isPlaying){
        return;
    }
    pointerMove(ev.clientX,ev.clientY);
}, false);

document.addEventListener("mouseup",function(ev){
    if (ev){
        ev.preventDefault();
        ev.stopPropagation();    
    }
    if (x0 == -1 || isPlaying){
        return;
    }
    pointerEnd(ev.clientX,ev.clientY);
}, false);

document.addEventListener("touchstart",function(ev){
    if (ev){
        ev.preventDefault();
        ev.stopPropagation();    
    }
    if (isPlaying){
        return false;
    }
    pointerStart(ev.touches[0].clientX,ev.touches[0].clientY);
}, false);

document.addEventListener("touchmove",function(ev){
    if (ev){
        ev.preventDefault();
        ev.stopPropagation();    
    }
    if (x0 == -1 || isPlaying){
        return;
    }
    pointerMove(ev.touches[0].clientX,ev.touches[0].clientY);
}, false);

document.addEventListener("touchend",function(ev){
    if (ev){
        ev.preventDefault();
        ev.stopPropagation();    
    }
    if (x0 == -1 || isPlaying){
        return;
    }
    pointerEnd(ev.changedTouches[0].clientX,ev.changedTouches[0].clientY);
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
    if (tx>WIDTH){
        for(var i=0;i<tools.length;i++){
            var tool=tools[i];
            if (tool.x0<=ty && tool.x0+tool.currentHeight>ty){
                tool.onclick();
                break;
            }
        }
        return;
    }
    if (ty>HEIGHT-COLORBAR){
        var pos = Math.floor(tx / dx);
        setColor(colors[pos]);
        return;
    }
    x0 = tx;
    y0 = ty;
    if (stamp !='circle'){
        drawStamp(tx,ty);
    }else{
        drawPoint(x0, y0);
    }

}

function setColor(col){
    console.log("Color",col);
    color = col;
    currentLog=[];
    currentLog.push(['setColor',col]);
    log.push(currentLog);
    drawToolbar();
    drawBar();
}

function pointerMove(x,y){
    if (x0>0 && y0>0){
        var x1 = translatedX(x)
        var y1 = translatedY(y)
        if (stamp !='circle' ){
            if (continuous[stamp]){
                drawStamp(x1,y1);
            }
        }else{
            lineToPoint(x1, y1);
        }
    }
}

function pointerEnd(x,y){
    lastX = x0;
    lastY = y0;
    x0 = -1;
    y0 = -1;
    endLine();
}


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
        if (currentLog[0][0]=="drawPoint"){
            log.push(currentLog);
        }
    }
    currentLog=[];
}

function drawBar(){
    colors = [];
    var c =0;
    var ctx = canvas2.getContext("2d");
    for(var b=0;b<colorList.length;b++){                
        var col = "#"+(colorList[b]);
        var px = c*dx;
        ctx.fillStyle = col;
        ctx.strokeStyle = "#ccc";
        ctx.beginPath();
        ctx.arc(px+(dx/2), HEIGHT-(COLORBAR/2), dx/2, 0, 2 * Math.PI, false);
        ctx.stroke();
        ctx.fill();
        colors.push(col);    
        if (col==color){
            ctx.beginPath();
            ctx.fillStyle = "#ddd";
            ctx.arc(px+(dx/2), HEIGHT-(COLORBAR/2), dx/2, 0, 2 * Math.PI, false);
            ctx.fill();

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

    ctx.fillStyle = "#ddd";
    ctx.fillRect(WIDTH,0,TOOLBAR,HEIGHT);
    var h0 = 10;
}

function getImage(){
    var new_canvas = document.createElement('canvas');
    new_canvas.width = WIDTH;
    new_canvas.height = HEIGHT-COLORBAR;
    new_canvas.getContext('2d').drawImage(canvas, 0,0);
    var dataUrl = new_canvas.toDataURL("image/png");
    var lnk=document.createElement("a");
    lnk.href=dataUrl;
    lnk.download="image.png";
    lnk.style.display='';
    document.body.appendChild(lnk);
    lnk.click();
    setTimeout(function(){ document.body.removeChild(lnk)},1000);
}

function clearWindow(){
    console.log('clear');
    setColor("#000");
    setStamp('circle');
    setRadius(8);
    log=[];
    currentLog=[];
    ctx.fillStyle = "#eee";
    ctx.fillRect(0,0,WIDTH,HEIGHT);
    drawToolbar();
}

function logger(msg){
    return;
    ctx.fillStyle = "#eee";
    ctx.fillRect(0,0,WIDTH,30);
    ctx.fillStyle = "#000";
    ctx.font = "14px Arial";
    ctx.fillText(msg, 50, 15);
}

function setStamp(name){
    stamp = name;
    currentLog=[];
    currentLog.push(['setStamp',name]);
    log.push(currentLog);
    console.log("Stamp",name);
    if (stampTool){
        stampTool.style.backgroundImage = "url("+images[name].src+")";
    }
    drawToolbar();
}

function setRadius(rad){
    radius=rad;
    currentLog=[];
    currentLog.push(['setRadius',rad]);
    log.push(currentLog);
    console.log("Radius", rad, color);
    drawToolbar();
    drawBar();
}

function unDo(){
    var last=log.pop();
    //console.log("undo",last);
    while (last && last[0][0]!='drawPoint' && last[0][0]!='drawStamp'){
        last=log.pop();
        console.log("undo",last);
    }
    reDraw(0);
}

function getStamp(stamp){
    var c=document.createElement("canvas");
    var img=images[stamp]
    c.setAttribute("width",img.width);
    c.setAttribute("height",img.height);
    document.body.appendChild(c);
    ctx2 = c.getContext("2d");
    ctx2.fillStyle = color;
    ctx2.fillRect(0, 0, c.width, c.height);
    ctx2.globalCompositeOperation = "destination-in";
    ctx2.drawImage(img, 0,0);
    return c;
}

function drawStamp(x,y){
    console.log("Stamp",stamp);
    var c=getStamp(stamp);
    ctx.drawImage(c,x-radius*2,y-radius*2,radius*4,radius*4);
    document.body.removeChild(c);
    currentLog=[];
    currentLog.push(['drawStamp',x,y]);
    log.push(currentLog);
}



function reDraw(dt){
    isPlaying = true;
    if (typeof(dt)=="undefined"){
        dt = 0;
    }
    var dlog=JSON.parse(JSON.stringify(log));
    clearWindow();
    var t=0;
    if (dt>0){
        t=100;
    }
    for(var index in dlog){
        var log1=dlog[index];
        if (dt>0){
            t+=10;
        }
        for(var index1 in log1){
            var func=log1[index1][0];
            var p1=log1[index1][1];
            var p2=log1[index1][2];
            if (t>0){
                setTimeout(window[func],t,p1,p2);
            }else{
                window[func](p1,p2);
            }
            t+=dt;
        }
        if (!isPlaying){
            break;
        }
    }
    if (dt>0){
        t+=100;
    }
    if (t>0){
        setTimeout(function(){ 
            log=dlog;
            isPlaying = false;
        } ,t);    
    }else{
        log=dlog;
        isPlaying = false;
    }
}

function fillRoundedRect(x, y, w, h, r){
    this.beginPath();
    this.moveTo(x+r, y);
    this.arcTo(x+w, y,   x+w, y+h, r);
    this.arcTo(x+w, y+h, x,   y+h, r);
    this.arcTo(x,   y+h, x,   y,   r);
    this.arcTo(x,   y,   x+w, y,   r);
    ctx.fill();
}

function fillCanvas(){
    var color1 = color;
    var stamp1 = stamp;
    clearWindow();
    setColor(color1);
    setStamp(stamp1);
    fillColor();
}

function fillColor(){
    ctx.fillStyle = color;
    ctx.fillRect(0,0,WIDTH,HEIGHT-COLORBAR);
    currentLog=[];
    currentLog.push(['fillColor',null]);
    log.push(currentLog);
}

function resizeCanvas(){
    if (document.body.clientHeight && document.body.clientWidth){
        WIDTH = document.body.clientWidth;
        HEIGHT = document.body.clientHeight ;
        dx=(WIDTH)/ncol;
        console.log("resize to",WIDTH,HEIGHT)
    }
    canvas.setAttribute("width",WIDTH);
    canvas.setAttribute("height",HEIGHT);    
    canvas2.setAttribute("width",WIDTH);
    canvas2.setAttribute("height",HEIGHT);    
}

resizeCanvas();

if (window.cordova){
    canvas.style.display='none';
}

window.onerror=function(e){
    alert(e)
}

window.onresize=function(ev){
    clearTimeout(window.resizeProc);
    window.resizeProc=setTimeout(function (){
        resizeCanvas();
        reDraw(0);    
    },300);
}

drawToolbar()

document.addEventListener('deviceready',function(){
    console.log("deviceready")
    if (window.screen && window.screen.orientation){
        var orientation=(window.screen.orientation.type).split("-")[0];
        if (orientation!="landscape"){
            window.screen.orientation.lock('landscape');
            setTimeout(function(){
                canvas.style.display='';
                resizeCanvas();
                clearWindow();
            },1000);    
        }
        else {
            canvas.style.display='';
            resizeCanvas();
            clearWindow();
        }
    }
},false)