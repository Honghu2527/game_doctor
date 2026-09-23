"use strict";

var G=GameGlobal;
var wxapi=wx;
var vdom=require("./dom-adapter.js");
var E=vdom.elements;
var body=vdom.body;

var info=wxapi.getWindowInfo?wxapi.getWindowInfo():wxapi.getSystemInfoSync();
var W=info.windowWidth||375;
var H=info.windowHeight||667;
var DEVICE_DPR=info.pixelRatio||1;
/* 全程高清：滚动和静止都按接近设备原生 DPR 绘制，不再使用低清滚动帧。 */
var STATIC_DPR=Math.min(3,Math.max(1,DEVICE_DPR));
var DPR=STATIC_DPR;
var SAFE_TOP=(info.safeArea&&info.safeArea.top)||0;
var canvas=G.__SCREEN_CANVAS__||wxapi.createCanvas();
canvas.width=Math.round(W*STATIC_DPR);
canvas.height=Math.round(H*STATIC_DPR);
var mainCtx=canvas.getContext("2d");
var ctx=mainCtx;
G.canvas=canvas;

var C={
  bg:"#ece7dc",paper:"#fffdf7",paper2:"#fffdf8",ink:"#17282d",muted:"#687779",
  line:"#d9d2c6",accent:"#9b3c44",green:"#17675d",gold:"#b58b45",
  navy:"#142b30",navy2:"#1d3c41",softGreen:"#e5f0eb",softRed:"#f7e9e7"
};
var shellX=14,shellW=W-28;
var scrollY=0,maxScroll=0,contentHeight=H;
var hits=[];
var touchStart=null,touchLastY=0,touchMoved=false;
var activeInput=null;
var animTimer=null;
var imageCache={};
var lastScreen="";
var textLineCache=Object.create(null);
var textWidthCache=Object.create(null);
var plainCache=Object.create(null);
var cacheEntryCount=0;
var fastScrolling=false;
var scrollRenderPending=false;
/* Full-resolution scroll cache: scrolling crops a pre-rendered high-DPI strip instead of repainting the whole UI every frame. */
var scrollBuffer=null;
var scrollBufferCtx=null;
var scrollBufferTop=0;
var scrollBufferHeight=0;
var scrollBufferValid=false;
var scrollBufferScreen="";
var scrollTargetY=0;
var scrollVelocity=0;
var scrollFrameId=0;
var scrollFrameRunning=false;
var lastTouchTime=0;
var bufferWarmTimer=null;

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function docVisible(y,h,margin){
  margin=margin==null?90:margin;
  return y+h>=scrollY-margin&&y<=scrollY+H+margin;
}

var stageAssets={
  undergrad:"assets/bg-mobile/undergrad.jpg",
  internal:"assets/bg-mobile/internal.jpg",
  surgery:"assets/bg-mobile/surgery.jpg",
  pediatrics:"assets/bg-mobile/pediatrics.jpg",
  radiology:"assets/bg-mobile/radiology.jpg",
  nuclear:"assets/bg-mobile/nuclear.jpg",
  pathology:"assets/bg-mobile/pathology.jpg",
  research:"assets/bg-mobile/research.jpg",
  overseas:"assets/bg-mobile/overseas.jpg",
  hospital:"assets/bg-mobile/hospital.jpg",
  ending:"assets/bg-mobile/ending.jpg",
  obgyn:"assets/bg-mobile/surgery.jpg",
  emergency:"assets/bg-mobile/hospital.jpg",
  anesthesia:"assets/bg-mobile/surgery.jpg",
  psychiatry:"assets/bg-mobile/internal.jpg",
  general:"assets/bg-mobile/internal.jpg",
  oncology:"assets/bg-mobile/research.jpg",
  ophthalmology:"assets/bg-mobile/radiology.jpg",
  dermatology:"assets/bg-mobile/pathology.jpg"
};
var fallbackStageAsset="assets/bg/medical_stage_ai.jpg";

function img(path){
  if(imageCache[path])return imageCache[path];
  var im;
  try{im=canvas.createImage?canvas.createImage():wxapi.createImage();}catch(e){return null;}
  im.__ready=false;
  im.__failed=false;
  imageCache[path]=im;
  im.onload=function(){
    im.__ready=true;
    im.__failed=false;
    render();
  };
  im.onerror=function(err){
    try{console.warn("[medical-life] image failed",path,err||"");}catch(e){}
    if(!im.__retried){
      im.__retried=true;
      try{im.src="./"+path;return;}catch(e){}
    }
    im.__failed=true;
    render();
  };
  im.src=path;
  return im;
}
/* 只预载 Logo；背景按当前人生阶段懒加载，避免真机一次解码全部大图。 */
var logo=img("assets/ui/medical-logo.png");

function rr(x,y,w,h,r,fill,stroke,lineW){
  if(w<=0||h<=0)return;
  var q=Math.min(r||0,w/2,h/2);
  ctx.beginPath();
  ctx.moveTo(x+q,y);
  ctx.arcTo(x+w,y,x+w,y+h,q);
  ctx.arcTo(x+w,y+h,x,y+h,q);
  ctx.arcTo(x,y+h,x,y,q);
  ctx.arcTo(x,y,x+w,y,q);
  ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill();}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lineW||1;ctx.stroke();}
}
function withShadow(color,blur,oy,fn){
  if(fastScrolling){fn();return;}
  ctx.save();
  ctx.shadowColor=color||"rgba(20,35,38,.12)";
  ctx.shadowBlur=blur||20;ctx.shadowOffsetY=oy||8;
  fn();
  ctx.restore();
}
function gradient(x1,y1,x2,y2,stops){
  var g=ctx.createLinearGradient(x1,y1,x2,y2);
  stops.forEach(function(s){g.addColorStop(s[0],s[1]);});
  return g;
}
function radial(x,y,r,stops){
  var g=ctx.createRadialGradient(x,y,0,x,y,r);
  stops.forEach(function(s){g.addColorStop(s[0],s[1]);});
  return g;
}
function decode(s){
  return String(s==null?"":s)
    .replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<")
    .replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#039;/g,"'");
}
function plain(html){
  var raw=String(html||"");
  if(raw.length<1800&&plainCache[raw]!==undefined)return plainCache[raw];
  var out=decode(raw
    .replace(/<br\s*\/?>/gi,"\n")
    .replace(/<\/p>/gi,"\n")
    .replace(/<\/div>/gi,"\n")
    .replace(/<[^>]+>/g,"")
    .replace(/\n{3,}/g,"\n\n")
    .trim());
  if(raw.length<1800){
    plainCache[raw]=out;
    cacheEntryCount++;
  }
  return out;
}
function extractTag(html,tag){
  var m=String(html||"").match(new RegExp("<"+tag+"[^>]*>([\\s\\S]*?)<\\/"+tag+">","i"));
  return m?plain(m[1]):"";
}
function extractClass(html,cls){
  var re=new RegExp("<[^>]+class=[\"'][^\"']*\\b"+cls+"\\b[^\"']*[\"'][^>]*>([\\s\\S]*?)<\\/[^>]+>","i");
  var m=String(html||"").match(re);
  return m?plain(m[1]):"";
}
function extractAllClass(html,cls){
  var out=[];
  var re=new RegExp("<[^>]+class=[\"'][^\"']*\\b"+cls+"\\b[^\"']*[\"'][^>]*>([\\s\\S]*?)<\\/[^>]+>","gi"),m;
  while((m=re.exec(String(html||""))))out.push(plain(m[1]));
  return out;
}
function lines(textValue,maxW,font,maxLines){
  var f=font||"14px sans-serif";
  var s=String(textValue==null?"":textValue);
  var key=f+"|"+Math.round(maxW*10)/10+"|"+(maxLines||0)+"|"+s;
  var cached=textLineCache[key];
  if(cached)return cached;

  ctx.font=f;
  var out=[],line="";
  var chunks=s.split("\n");
  for(var p=0;p<chunks.length;p++){
    var part=chunks[p];
    for(var i=0;i<part.length;i++){
      var test=line+part[i];
      var widthKey=f+"|"+test;
      var tw=textWidthCache[widthKey];
      if(tw===undefined){
        tw=ctx.measureText(test).width;
        if(test.length<80)textWidthCache[widthKey]=tw;
      }
      if(tw>maxW&&line){out.push(line);line=part[i];}
      else line=test;
      if(maxLines&&out.length>=maxLines)break;
    }
    if(line){out.push(line);line="";}
    if(maxLines&&out.length>=maxLines)break;
  }
  if(maxLines&&out.length>maxLines)out=out.slice(0,maxLines);

  /* Avoid unbounded growth during very long sessions. */
  if(cacheEntryCount>1400){
    textLineCache=Object.create(null);
    textWidthCache=Object.create(null);
    plainCache=Object.create(null);
    cacheEntryCount=0;
  }
  textLineCache[key]=out;
  cacheEntryCount++;
  return out;
}
function text(t,x,y,maxW,lineH,opt){
  opt=opt||{};
  ctx.save();
  ctx.font=opt.font||"14px sans-serif";
  ctx.fillStyle=opt.color||C.ink;
  ctx.textAlign=opt.align||"left";
  ctx.textBaseline="top";
  if(opt.alpha!=null)ctx.globalAlpha=opt.alpha;
  var arr=lines(t,maxW,ctx.font,opt.maxLines);
  arr.forEach(function(line,i){ctx.fillText(line,x,y+i*lineH);});
  ctx.restore();
  return arr.length*lineH;
}
function measureTextHeight(t,w,font,lineH,maxLines){return lines(t,w,font,maxLines).length*lineH;}
function pill(x,y,label,opt){
  opt=opt||{};
  var font=opt.font||"700 10px sans-serif";
  ctx.font=font;
  var w=Math.min(opt.maxW||999,ctx.measureText(label).width+(opt.padX||10)*2);
  var h=opt.h||25;
  rr(x,y,w,h,h/2,opt.fill||"#efe4d3",opt.stroke||null);
  text(label,x+w/2,y+(h-(opt.lineH||14))/2,w-8,opt.lineH||14,{font:font,color:opt.color||"#654b30",align:"center",maxLines:1});
  return w;
}
function addHit(node,x,y,w,h,action,fixed){
  hits.push({node:node,x:x,y:fixed?y:y-scrollY,w:w,h:h,action:action});
}
function rectFor(node,x,docY,w,h){
  if(node)node._rect={x:x,docY:docY,w:w,h:h};
}
function panel(x,y,w,h,r){
  withShadow("rgba(16,37,41,.13)",28,10,function(){
    var g=gradient(x,y,x+w,y+h,[[0,"rgba(255,254,250,.985)"],[1,"rgba(249,245,237,.97)"]]);
    rr(x,y,w,h,r||20,g,"rgba(92,73,52,.14)");
  });
}
function primaryButton(node,x,y,w,label,sub){
  var lh=measureTextHeight(label,w-28,"800 14px sans-serif",19);
  var sh=sub?measureTextHeight(sub,w-28,"11px sans-serif",16):0;
  var contentH=lh+(sub?5+sh:0);
  var h=Math.max(48,14+contentH+13);
  var disabled=node&&node.disabled;
  var fill=disabled?"#b7aaa9":gradient(x,y,x+w,y+h,[[0,"#a0444b"],[1,"#843139"]]);
  withShadow(disabled?"rgba(0,0,0,0)":"rgba(132,49,57,.20)",16,6,function(){rr(x,y,w,h,14,fill,disabled?"#c7bcbc":"rgba(93,26,31,.15)");});
  var ty=y+(h-contentH)/2;
  text(label,x+w/2,ty,w-28,19,{font:"800 14px sans-serif",color:"#fff",align:"center"});
  if(sub)text(sub,x+w/2,ty+lh+5,w-28,16,{font:"11px sans-serif",color:"rgba(255,255,255,.82)",align:"center"});
  if(node&&!disabled)addHit(node,x,y,w,h,function(){node.click();});
  return h;
}
function ghostButton(node,x,y,w,label,sub,opt){
  opt=opt||{};
  var lh=measureTextHeight(label,w-28,"700 14px sans-serif",19);
  var sh=sub?measureTextHeight(sub,w-28,"11px sans-serif",16):0;
  var contentH=lh+(sub?4+sh:0);
  var h=Math.max(46,13+contentH+12);
  var disabled=node&&node.disabled;
  rr(x,y,w,h,14,disabled?"#f0ece6":"#fffdf8",disabled?"#ddd5ca":(opt.stroke||C.line));
  var ty=y+(h-contentH)/2;
  text(label,x+w/2,ty,w-28,19,{font:"700 14px sans-serif",color:disabled?"#a49d94":(opt.color||C.ink),align:"center"});
  if(sub)text(sub,x+w/2,ty+lh+4,w-28,16,{font:"11px sans-serif",color:disabled?"#b1aaa1":C.muted,align:"center"});
  if(node&&!disabled)addHit(node,x,y,w,h,function(){node.click();});
  return h;
}
function rawNodeMeta(node){
  var raw=node.rawHTML||node.innerHTML||"";
  if(node.__rawNodeMeta&&node.__rawNodeMeta.raw===raw)return node.__rawNodeMeta;
  var m={
    raw:raw,
    label:extractTag(raw,"b")||plain(raw)||node.textContent||"选择",
    sub:extractTag(raw,"small"),
    route:extractClass(raw,"route-chip"),
    meta:extractClass(raw,"choice-meta")
  };
  node.__rawNodeMeta=m;
  return m;
}
function measureRawNodeButtonHeight(node,w,opt){
  opt=opt||{};
  var data=rawNodeMeta(node);
  var label=data.label;
  var sub=data.sub;
  var route=data.route;
  var meta=data.meta;
  var lh=measureTextHeight(label,w-30,opt.titleFont||"700 14px sans-serif",20);
  var sh=sub?measureTextHeight(sub,w-30,"11px sans-serif",16):0;
  var extra=(route||meta)?24:0;
  return Math.max(58,14+lh+(sub?5+sh:0)+extra+14);
}
function rawNodeButton(node,x,y,w,opt){
  opt=opt||{};
  var data=rawNodeMeta(node);
  var label=data.label;
  var sub=data.sub;
  var route=data.route;
  var meta=data.meta;
  var lh=measureTextHeight(label,w-30,opt.titleFont||"700 14px sans-serif",20);
  var sh=sub?measureTextHeight(sub,w-30,"11px sans-serif",16):0;
  var h=measureRawNodeButtonHeight(node,w,opt);
  var disabled=node.disabled;
  var fill=disabled?"#f2efe9":(opt.fill||"#fffdf8");
  rr(x,y,w,h,15,fill,disabled?"#ded8ce":(opt.stroke||C.line));
  if(opt.accent)rr(x,y,3,h,2,opt.accent);
  text(label,x+15,y+13,w-30,20,{font:opt.titleFont||"700 14px sans-serif",color:disabled?"#99948d":C.ink});
  var yy=y+13+lh+5;
  if(sub){text(sub,x+15,yy,w-30,16,{font:"11px sans-serif",color:disabled?"#aaa49d":C.muted});yy+=sh+4;}
  if(route)pill(x+15,yy,route,{fill:"#f3e9dd",color:"#6e5132",font:"700 9px sans-serif",h:20,padX:7,lineH:12});
  else if(meta)pill(x+15,yy,meta,{fill:"#edf2ff",color:"#405b9b",font:"700 9px sans-serif",h:20,padX:7,lineH:12});
  if(!disabled)addHit(node,x,y,w,h,function(){node.click();});
  return h;
}
function sectionLabel(label,x,y){text(label,x,y,shellW-36,18,{font:"800 13px sans-serif",color:C.ink});return y+25;}

function stageKey(){return body.getAttribute("data-stage-bg")||"undergrad";}
function drawBackdrop(){
  /* 只需要覆盖当前视口，Canvas 本身会裁剪；避免真机在长页面上做超大 fill。 */
  ctx.fillStyle="#f3eee5";ctx.fillRect(0,scrollY,W,H);
  var heroH=560+SAFE_TOP;
  ctx.fillStyle="#183033";ctx.fillRect(0,0,W,heroH);
  var key=stageKey();
  var path=stageAssets[key]||stageAssets.undergrad;
  var primary=img(path);
  var im=(primary&&primary.__ready)?primary:null;
  if(!im&&primary&&primary.__failed){
    var fallback=img(fallbackStageAsset);
    if(fallback&&fallback.__ready)im=fallback;
  }
  if(im){
    try{
      var iw=Number(im.width||im.naturalWidth||0);
      var ih=Number(im.height||im.naturalHeight||0);
      if(iw>0&&ih>0){
        /* CSS background-size: cover + mobile background-position≈58% center */
        var scale=Math.max(W/iw,heroH/ih);
        var sw=W/scale,sh=heroH/scale;
        var sx=Math.max(0,(iw-sw)*0.58);
        var sy=Math.max(0,(ih-sh)*0.50);
        ctx.drawImage(im,sx,sy,sw,sh,0,0,W,heroH);
      }else{
        ctx.drawImage(im,0,0,W,heroH);
      }
    }catch(e){
      try{ctx.drawImage(im,0,0,W,heroH);}catch(_){}
    }
  }
  var hg=ctx.createLinearGradient(0,0,W,0);
  hg.addColorStop(0,"rgba(14,27,30,.57)");hg.addColorStop(1,"rgba(14,27,30,.15)");
  ctx.fillStyle=hg;ctx.fillRect(0,0,W,heroH);
  var vg=ctx.createLinearGradient(0,0,0,heroH);
  vg.addColorStop(0,"rgba(14,27,30,.02)");vg.addColorStop(.52,"rgba(14,27,30,.08)");
  vg.addColorStop(.74,"#183033");vg.addColorStop(1,"#eee8dd");
  ctx.fillStyle=vg;ctx.fillRect(0,0,W,heroH);
}
function screenId(){
  var order=["startScreen","gaokaoScreen","schoolScreen","letterScreen","gameScreen","endingScreen"];
  for(var i=0;i<order.length;i++)if(E[order[i]]&&!E[order[i]].hidden)return order[i];
  return "startScreen";
}
function journeySteps(){
  var html=E.journeySteps.rawHTML||E.journeySteps.innerHTML||"";
  var out=[],re=/<div class="journey-step\s+([^"]+)"><b>([\s\S]*?)<\/b><span>([\s\S]*?)<\/span><\/div>/gi,m;
  while((m=re.exec(html)))out.push({state:m[1],num:plain(m[2]),label:plain(m[3])});
  return out;
}
function drawTopbar(){
  var blockBottom=SAFE_TOP+235;
  if(!docVisible(0,blockBottom,80))return blockBottom;
  var y=SAFE_TOP+18;
  if(logo&&logo.__ready){
    try{ctx.drawImage(logo,shellX,y,54,54);}catch(e){}
  }else{rr(shellX,y,54,54,17,"#214f4b");text("⚕",shellX+27,y+10,40,34,{font:"28px serif",color:"#fff8ea",align:"center"});}
  var tx=shellX+64,tw=shellW-64;
  text("MED STUDENT LIFE SIMULATOR",tx,y+1,tw,13,{font:"800 8px sans-serif",color:"#d9bd82",maxLines:1});
  text("医学生养成记录",tx,y+16,tw,35,{font:"800 31px serif",color:"#fffdf7",maxLines:1});
  text("从出生条件、高考与择校，到升学、规培、科研、职称与职业终章。你走过的每一步都会留下痕迹。",
    tx,y+52,tw,16,{font:"10px sans-serif",color:"#c8d6d5",maxLines:3});
  var actionY=y+112,ax=shellX;
  if(!E.continueBtn.hidden){
    var w=128;rr(ax,actionY,w,34,11,"rgba(255,255,255,.10)","rgba(255,255,255,.22)");
    text(E.continueBtn.textContent||"继续上次人生",ax+w/2,actionY+8,w-12,16,{font:"700 11px sans-serif",color:"#eef7f5",align:"center"});
    addHit(E.continueBtn,ax,actionY,w,34,function(){E.continueBtn.click();});
    ax+=w+8;
  }
  if(!E.restartBtn.hidden){
    var rw=92;rr(ax,actionY,rw,34,11,"rgba(255,255,255,.10)","rgba(255,255,255,.22)");
    text(E.restartBtn.textContent||"重新开始",ax+rw/2,actionY+8,rw-12,16,{font:"700 11px sans-serif",color:"#eef7f5",align:"center"});
    addHit(E.restartBtn,ax,actionY,rw,34,function(){E.restartBtn.click();});
  }
  return SAFE_TOP+235;
}
function drawJourney(y){
  var steps=journeySteps();
  var h=steps.length?105:74;
  if(!docVisible(y,h,80))return y+h+20;
  rr(shellX,y,shellW,h,16,"rgba(25,39,42,.75)","rgba(255,255,255,.20)");
  text("CURRENT STAGE",shellX+14,y+11,shellW-28,12,{font:"800 8px sans-serif",color:"#e0c78f"});
  text(E.journeyCurrent.textContent||"出生档案",shellX+14,y+26,shellW-28,21,{font:"800 16px sans-serif",color:"#fffdf6"});
  text(E.journeyNext.textContent||"",shellX+14,y+49,shellW-28,15,{font:"9px sans-serif",color:"#c9d8d6",maxLines:2});
  if(steps.length){
    var x=shellX+14,sy=y+72;
    steps.slice(0,4).forEach(function(s){
      ctx.font="700 9px sans-serif";var ww=Math.max(58,ctx.measureText(s.label).width+36);
      var fill=s.state.indexOf("current")>=0?"rgba(181,139,69,.24)":(s.state.indexOf("done")>=0?"rgba(49,92,88,.58)":"rgba(255,255,255,.04)");
      var stroke=s.state.indexOf("current")>=0?"rgba(225,195,136,.36)":"rgba(255,255,255,.08)";
      rr(x,sy,ww,25,10,fill,stroke);
      text(s.num||"01",x+13,sy+6,18,12,{font:"700 7px sans-serif",color:s.state.indexOf("current")>=0?"#203133":"#dbe6e3",align:"center"});
      text(s.label,x+29,sy+6,ww-34,12,{font:"700 8px sans-serif",color:s.state.indexOf("future")>=0?"#91a2a0":"#fffaf0",maxLines:1});
      x+=ww+6;
    });
  }
  return y+h+20;
}
function drawShellStart(){
  drawBackdrop();
  return drawJourney(drawTopbar());
}
function htmlTextBox(html,x,y,w,opt){
  opt=opt||{};
  var p=plain(html);
  var h=measureTextHeight(p,w-(opt.pad||14)*2,opt.font||"11px sans-serif",opt.lineH||17)+(opt.pad||14)*2;
  rr(x,y,w,h,opt.r||14,opt.fill||"#fffaf2",opt.stroke||C.line);
  text(p,x+(opt.pad||14),y+(opt.pad||14),w-(opt.pad||14)*2,opt.lineH||17,{font:opt.font||"11px sans-serif",color:opt.color||"#5d5b57"});
  return h;
}
function drawField(label,node,x,y,w){
  text(label,x,y,w,17,{font:"800 11px sans-serif",color:"#5e554c"});
  var fy=y+22;
  rr(x,fy,w,43,13,"#fff",C.line);
  text(node.value||"—",x+12,fy+12,w-40,18,{font:"12px sans-serif",color:C.ink,maxLines:1});
  text("⌄",x+w-22,fy+11,14,18,{font:"14px sans-serif",color:C.muted,align:"center"});
  return {h:65,boxY:fy};
}
function actionSheetFor(node,label,source){
  var keys=Object.keys(source||{});
  wxapi.showActionSheet({
    itemList:keys.map(function(k){return source[k].name;}),
    success:function(res){
      var key=keys[res.tapIndex];if(key==null)return;
      node.value=key;node.dispatchEvent({type:"change",target:node});
    }
  });
}
function drawStart(y){
  var panelY=y, x=shellX,w=shellW;
  var birthRows=[
    ["成长环境",E.birthHometown,G.BACKGROUND_DATA.hometowns],
    ["独生子女",E.birthOnlyChild,G.BACKGROUND_DATA.onlyChild],
    ["家庭经济",E.birthEconomy,G.BACKGROUND_DATA.economy],
    ["家庭教育资源",E.birthEducation,G.BACKGROUND_DATA.education],
    ["医学家庭背景",E.birthMedical,G.BACKGROUND_DATA.medicalFamily]
  ];
  var diffChildren=E.difficultyGrid.children||[];
  var introH=114,fieldsH=65*6+12*5,previewH=Math.max(74,measureTextHeight(plain(E.birthPreview.innerHTML),w-56,"11px sans-serif",17)+28);
  var diffsH=diffChildren.reduce(function(sum,n){
    var name=extractTag(n.rawHTML,"strong"),desc=extractTag(n.rawHTML,"span");
    return sum+Math.max(64,14+measureTextHeight(name,w-56,"700 13px sans-serif",18)+4+measureTextHeight(desc,w-56,"10px sans-serif",15)+14)+9;
  },0);
  var ph=34+introH+54+fieldsH+previewH+75+diffsH+100;
  panel(x,panelY,w,ph,20);
  var cy=panelY+24;
  pill(x+22,cy,"中国医学生人生模拟器 · v0.11.4",{fill:"#efe4d3",stroke:"#dfceb2",color:"#685139",font:"800 10px sans-serif",h:26,padX:10,lineH:13});cy+=45;
  var title="一张录取通知书之前，人生已经写下了很多变量。";
  cy+=text(title,x+22,cy,w-44,29,{font:"800 24px serif",color:C.ink})+8;
  cy+=text("这一次，人生从出生条件开始：成长城市、家庭经济、是否独生子女、教育资源和医学家庭背景都会改变资源与机会成本。然后你再亲手“停下”高考分数，进入对应的本科或医学专科路线。",
    x+22,cy,w-44,21,{font:"12px sans-serif",color:C.muted})+20;
  cy=sectionLabel("角色姓名",x+22,cy);
  rr(x+22,cy,w-44,43,13,"#fff",C.line);
  text(E.playerName.value||"小张",x+34,cy+12,w-68,18,{font:"12px sans-serif",color:C.ink});
  addHit(E.playerName,x+22,cy,w-44,43,function(){focusInput(E.playerName,12,false);});cy+=60;
  cy=sectionLabel("出生档案",x+22,cy);
  birthRows.forEach(function(r){
    var f=drawField(r[0],{value:(r[2][r[1].value]||{}).name||r[1].value},x+22,cy,w-44);
    addHit(r[1],x+22,f.boxY,w-44,43,function(){actionSheetFor(r[1],r[0],r[2]);});
    cy+=f.h+8;
  });
  cy+=htmlTextBox(E.birthPreview.innerHTML,x+22,cy,w-44,{fill:"#f8f1e5",stroke:"#d8d0c2",color:"#5d5b57"})+8;
  cy+=text("出生条件只影响游戏中的资源、信息差和机会成本，不代表现实中任何群体的能力或价值。",
    x+22,cy,w-44,16,{font:"10px sans-serif",color:"#8b8175"})+18;
  cy=sectionLabel("人生难度",x+22,cy);
  diffChildren.forEach(function(n){
    var active=n.classList.contains("active"),name=extractTag(n.rawHTML,"strong"),desc=extractTag(n.rawHTML,"span");
    var hh=Math.max(64,14+measureTextHeight(name,w-56,"700 13px sans-serif",18)+4+measureTextHeight(desc,w-56,"10px sans-serif",15)+14);
    var fill=active?gradient(x+22,cy,x+w-22,cy+hh,[[0,"#fffaf3"],[1,"#f4e9e6"]]):gradient(x+22,cy,x+w-22,cy+hh,[[0,"#fffdf8"],[1,"#f7f2e8"]]);
    rr(x+22,cy,w-44,hh,16,fill,active?C.accent:C.line,active?1.4:1);
    text(name,x+36,cy+13,w-72,18,{font:"700 13px sans-serif",color:C.ink});
    text(desc,x+36,cy+35,w-72,15,{font:"10px sans-serif",color:C.muted});
    addHit(n,x+22,cy,w-44,hh,function(){n.click();});cy+=hh+9;
  });
  cy+=text("出生条件、学校生态与人生难度会叠加，但任何开局都保留后续升学和路线转换机会。",
    x+22,cy,w-44,16,{font:"10px sans-serif",color:C.muted})+16;
  cy+=primaryButton(E.startBtn,x+22,cy,w-44,E.startBtn.textContent||"确认出生档案 · 进入高考放榜日","");
  rectFor(E.startScreen,x,panelY,w,cy-panelY+24);
  return Math.max(panelY+ph,cy+24);
}
function drawGaokao(y){
  var x=shellX,w=shellW,panelY=y;
  var resultVisible=!E.scoreResult.hidden,eligibleVisible=!E.scoreEligibility.hidden;
  var ph=620+(resultVisible?130:0)+(eligibleVisible?85:0);
  panel(x,panelY,w,ph,20);
  var cy=panelY+24;
  pill(x+22,cy,"第一关 · 高考放榜",{fill:"#efe4d3",stroke:"#dfceb2",color:"#685139",font:"800 10px sans-serif",h:26});cy+=46;
  cy+=text("750 分，总有一个数字会停在你面前。",x+22,cy,w-44,30,{font:"800 25px serif"})+10;
  cy+=text("点击“开始滚动”，分数会在更广的 280–745 游戏区间内快速变化；当你觉得就是现在，点击“停止”。出生资源只会产生小幅度影响，不会直接决定结果。",
    x+22,cy,w-44,21,{font:"12px sans-serif",color:C.muted})+24;
  var smX=x+22,smW=w-44,smH=190;
  var sg=radial(smX+smW/2,cy+15,smW*.7,[[0,"#27474c"],[.56,"#14262b"],[1,"#0c171b"]]);
  withShadow("rgba(12,23,27,.25)",28,10,function(){rr(smX,cy,smW,smH,24,sg,"rgba(217,189,130,.17)");});
  text("高考总分",smX+smW/2,cy+22,smW-30,18,{font:"700 10px sans-serif",color:"#d6c28f",align:"center"});
  text(E.scoreDisplay.textContent||"---",smX+smW/2,cy+52,smW-30,72,{font:"800 64px sans-serif",color:"#fff8e7",align:"center",maxLines:1});
  text("/ 750",smX+smW/2,cy+137,smW-30,18,{font:"700 12px sans-serif",color:"#d6c28f",align:"center"});cy+=smH+20;
  var gap=10,bw=(smW-gap)/2;
  cy+=Math.max(primaryButton(E.rollBtn,smX,cy,bw,E.rollBtn.textContent||"开始滚动",""),primaryButton(E.stopBtn,smX+bw+gap,cy,bw,E.stopBtn.textContent||"停止！",""));
  cy+=18;
  if(resultVisible){
    cy+=htmlTextBox(E.scoreResult.innerHTML,smX,cy,smW,{fill:"#fffaf1",stroke:"#d8cbb9",font:"12px sans-serif",lineH:18,color:"#5d5550"})+10;
    if(E.goSchoolBtn.listeners.click&&E.goSchoolBtn.listeners.click.length)cy+=primaryButton(E.goSchoolBtn,smX,cy,smW,"查看可选择的医学院校","");
  }
  if(eligibleVisible){
    cy+=12;cy+=htmlTextBox(E.scoreEligibility.innerHTML,smX,cy,smW,{fill:"#eef4f1",stroke:"#c7ddd6",font:"11px sans-serif",lineH:17,color:"#365d55"});
  }
  rectFor(E.gaokaoScreen,x,panelY,w,cy-panelY+24);
  return Math.max(panelY+ph,cy+28);
}
function schoolCardMeta(n){
  var raw=n.rawHTML||"";
  if(n.__schoolMeta&&n.__schoolMeta.raw===raw)return n.__schoolMeta;
  var m={
    raw:raw,
    city:extractClass(raw,"school-city"),
    profile:extractClass(raw,"profile-label"),
    title:extractTag(raw,"h3"),
    desc:extractTag(raw,"p"),
    op:extractClass(raw,"school-opportunity")
  };
  n.__schoolMeta=m;
  return m;
}
function drawSchools(y){
  var x=shellX,w=shellW,panelY=y,children=E.schoolGrid.children||[];
  var ph=260+children.reduce(function(sum,n){
    var meta=schoolCardMeta(n);
    return sum+Math.max(120,78+measureTextHeight(meta.title,w-72,"700 16px sans-serif",21)+measureTextHeight(meta.desc,w-72,"11px sans-serif",16))+10;
  },0);
  panel(x,panelY,w,ph,20);
  var cy=panelY+22;
  text("VOLUNTEER APPLICATION",x+22,cy,w-44,14,{font:"800 9px sans-serif",color:C.accent});cy+=20;
  text("选择你的医学院校",x+22,cy,w-130,30,{font:"800 25px serif"}); 
  rr(x+w-102,cy-5,80,48,14,"#162429");
  text("高考",x+w-62,cy+3,70,14,{font:"9px sans-serif",color:"rgba(255,255,255,.65)",align:"center"});
  text(E.schoolScore.textContent||"0",x+w-62,cy+17,70,25,{font:"800 23px sans-serif",color:"#fff",align:"center"});cy+=56;
  cy+=htmlTextBox(E.bandCard.innerHTML,x+22,cy,w-44,{fill:"#f3f7f4",stroke:"#ceddd8",font:"11px sans-serif",lineH:17,color:"#52645f"})+8;
  cy+=text("以下分数仅用于游戏难度分层，不代表真实录取线。真实高考录取取决于省份、年份、位次、选科与专业组；专科院校的具体招生专业也以当年官方招生计划为准。",
    x+22,cy,w-44,16,{font:"9px sans-serif",color:"#756f67"})+14;
  rr(x+22,cy,w-44,42,13,"#fff",C.line);
  text(E.schoolSearch.value||"搜索学校或城市，例如：山东、重庆、医科大学",x+34,cy+12,w-68,17,{font:"11px sans-serif",color:E.schoolSearch.value?C.ink:"#9a948b"});
  addHit(E.schoolSearch,x+22,cy,w-44,42,function(){focusInput(E.schoolSearch,30,false);});cy+=52;
  var fx=x+22;
  vdom.levelButtons.forEach(function(n){
    if(n.classList.contains("locked"))return;
    var label=n.getAttribute("data-level")||"全部";
    ctx.font="700 10px sans-serif";var fw=ctx.measureText(label).width+24;
    var active=n.classList.contains("active");
    rr(fx,cy,fw,29,15,active?C.ink:"#fff",active?C.ink:C.line);
    text(label,fx+fw/2,cy+7,fw-10,15,{font:"700 10px sans-serif",color:active?"#fff":C.ink,align:"center"});
    if(!n.disabled)addHit(n,fx,cy,fw,29,function(){n.click();});
    fx+=fw+7;
  });
  text(E.schoolResultCount.textContent||"",x+w-22,cy+8,w/2,14,{font:"9px sans-serif",color:C.muted,align:"right"});cy+=42;
  children.forEach(function(n){
    var meta=schoolCardMeta(n);
    var city=meta.city,profile=meta.profile,title=meta.title,desc=meta.desc,op=meta.op;
    var titleH=measureTextHeight(title,w-72,"700 16px sans-serif",21);
    var descH=measureTextHeight(desc,w-72,"11px sans-serif",16);
    var ch=Math.max(132,68+titleH+descH+(op?22:0));
    if(docVisible(cy,ch,100)){
      withShadow("rgba(24,55,57,.07)",14,6,function(){rr(x+22,cy,w-44,ch,18,gradient(x+22,cy,x+w-22,cy+ch,[[0,"#fffdf8"],[1,"#f8f4ec"]]),C.line);});
      text(city,x+36,cy+13,w-72,15,{font:"9px sans-serif",color:C.muted});
      if(profile)pill(x+36,cy+32,profile,{fill:"#eee8dc",color:"#654f38",font:"700 9px sans-serif",h:21,padX:7,lineH:12});
      text(title,x+36,cy+59,w-72,21,{font:"700 16px sans-serif",color:C.ink});
      var ddy=cy+59+titleH+5;
      text(desc,x+36,ddy,w-72,16,{font:"11px sans-serif",color:C.muted});ddy+=descH+6;
      if(op)text(op,x+36,ddy,w-72,15,{font:"700 9px sans-serif",color:C.green});
      addHit(n,x+22,cy,w-44,ch,function(){n.click();});
    }
    cy+=ch+10;
  });
  rectFor(E.schoolScreen,x,panelY,w,cy-panelY+20);
  return Math.max(panelY+ph,cy+24);
}
function drawLetter(y){
  var x=shellX,w=shellW,panelY=y;
  var prof=E.profileName.textContent||"培养生态";
  var ph=1030;
  panel(x,panelY,w,ph,20);
  var cy=panelY+22;
  var lx=x+22,lw=w-44,lh=390;
  withShadow("rgba(78,52,30,.13)",24,8,function(){rr(lx,cy,lw,lh,4,"#fffdf7","#9a2f32",5);rr(lx+8,cy+8,lw-16,lh-16,2,null,"#9a2f32",2);});
  text("GAME SIMULATION",lx+lw-18,cy+13,lw-40,13,{font:"700 8px sans-serif",color:"#b8a48e",align:"right"});
  text(E.letterSchool.textContent,lx+lw/2,cy+43,lw-40,25,{font:"800 20px serif",color:"#7f2e35",align:"center"});
  text("录 取 通 知 书",lx+lw/2,cy+91,lw-30,42,{font:"800 32px serif",color:"#971f2b",align:"center"});
  var bodyText=(E.letterName.textContent||"")+" 同学：\n\n祝贺你在本轮人生模拟中被 "+(E.letterSchoolInline.textContent||"")+" "+(E.letterProgramInline.textContent||"临床医学专业")+"录取。\n\n你的高考成绩为 "+(E.letterScore.textContent||"")+" 分。愿你从今天起，真正开始理解“医学”这两个字的重量。";
  text(bodyText,lx+24,cy+155,lw-48,24,{font:"14px serif",color:"#342d27"});
  text((E.letterProgram.textContent||"")+"   "+(E.letterLevel.textContent||"")+"   "+(E.letterDuration.textContent||""),lx+24,cy+330,lw-48,17,{font:"10px sans-serif",color:"#6f6256"});
  ctx.save();ctx.translate(lx+lw-65,cy+lh-68);ctx.rotate(-.18);rr(-36,-36,72,72,36,null,"#b4272f",4);rr(-29,-29,58,58,29,null,"#b4272f",1.5);text("录取",0,-14,55,28,{font:"800 20px sans-serif",color:"#b4272f",align:"center"});ctx.restore();
  cy+=lh+16;
  cy+=htmlTextBox(E.birthSummaryCard.innerHTML,x+22,cy,w-44,{fill:"#fffaf2",stroke:C.line,font:"10px sans-serif",lineH:16,color:"#5b5e5e"})+10;
  cy+=htmlTextBox(E.schoolEffectSummary.innerHTML,x+22,cy,w-44,{fill:"#fffaf2",stroke:C.line,font:"10px sans-serif",lineH:16,color:"#5b5e5e"})+10;
  var ecoH=112;
  rr(x+22,cy,w-44,ecoH,18,"#fffdf8",C.line);
  text("SCHOOL ECOSYSTEM",x+36,cy+14,w-72,13,{font:"800 8px sans-serif",color:C.accent});
  text(prof,x+36,cy+31,w-72,22,{font:"700 17px sans-serif"});
  text(E.profileDesc.textContent||"",x+36,cy+58,w-72,16,{font:"10px sans-serif",color:C.muted,maxLines:3});cy+=ecoH+10;
  var talentText=plain(E.talentGrid.innerHTML);
  var th=Math.max(90,measureTextHeight(talentText,w-72,"10px sans-serif",16)+48);
  rr(x+22,cy,w-44,th,18,"#fffdf8",C.line);
  text("INITIAL TALENTS · 入学天赋",x+36,cy+14,w-72,18,{font:"800 10px sans-serif",color:"#9a7540"});
  text(talentText,x+36,cy+39,w-72,16,{font:"10px sans-serif",color:C.muted,maxLines:8});cy+=th+12;
  cy+=primaryButton(E.enterUniversityBtn,x+22,cy,w-44,E.enterUniversityBtn.textContent||"确认入学 · 开启医学人生","");
  rectFor(E.letterScreen,x,panelY,w,cy-panelY+22);
  return Math.max(panelY+ph,cy+24);
}
function drawCareerStrip(y){
  var fields=[
    ["当前院校",E.metaSchool],["高考",E.metaScore],["模式",E.metaDifficulty],["培养生态",E.metaProfile],
    ["当前路线",E.metaRoute],["科室 / 学科",E.metaSpecialty],["当前单位",E.metaEmployer],["出生条件",E.metaBackground]
  ];
  var x=shellX,w=shellW,pad=12,gap=8,colW=(w-pad*2-gap)/2;
  var heights=[];
  fields.forEach(function(f,i){
    var ww=i===0?w-pad*2:colW;
    heights.push(Math.max(54,34+measureTextHeight(f[1].textContent||"—",ww-22,"11px sans-serif",15,3)));
  });
  var cy=y+12;
  rr(x,y,w,0,20,"#f7f3ea",C.line);
  fields.forEach(function(f,i){
    var full=i===0,idx=full?0:i-1,row=full?0:Math.floor(idx/2)+1,col=full?0:idx%2;
    var yy=full?cy:cy+heights[0]+gap+(row-1)*68;
    var xx=full?x+pad:x+pad+col*(colW+gap);
    var ww=full?w-pad*2:colW,hh=full?heights[0]:60;
    rr(xx,yy,ww,hh,14,"#fffdf8","#e3dbce");
    text(f[0],xx+11,yy+9,ww-22,13,{font:"800 8px sans-serif",color:"#748082"});
    text(f[1].textContent||"—",xx+11,yy+26,ww-22,15,{font:"700 11px sans-serif",color:"#22363a",maxLines:2});
  });
  var rows=Math.ceil((fields.length-1)/2),h=pad+heights[0]+gap+rows*68+pad;
  rr(x,y,w,h,20,null,C.line);
  return y+h+14;
}
function parseEducation(){
  var html=E.educationTimeline.rawHTML||E.educationTimeline.innerHTML||"",out=[];
  var re=/<div class="education-stop"><b>([\s\S]*?)<\/b><strong>([\s\S]*?)<\/strong><span>([\s\S]*?)<\/span>/gi,m;
  while((m=re.exec(html)))out.push({level:plain(m[1]),school:plain(m[2]),detail:plain(m[3])});
  return out;
}
function drawEducation(y){
  var x=shellX,w=shellW,items=parseEducation(),h=items.length?128:82;
  rr(x,y,w,h,18,"rgba(255,253,248,.97)",C.line);
  text("EDUCATION RECORD",x+14,y+12,w-28,12,{font:"800 8px sans-serif",color:"#9b7a43"});
  text("教育经历",x+14,y+27,w-28,19,{font:"800 14px sans-serif",color:"#20363a"});
  text("录取成功后自动写入，不覆盖之前学历",x+w-14,y+14,w/2,13,{font:"8px sans-serif",color:"#89908e",align:"right"});
  ctx.strokeStyle="#eee7dc";ctx.beginPath();ctx.moveTo(x+14,y+52);ctx.lineTo(x+w-14,y+52);ctx.stroke();
  if(items.length){
    var ix=x+14,iy=y+64;
    items.slice(0,2).forEach(function(it){
      var iw=(w-36)/2;
      rr(ix,iy,iw,52,13,"#faf7f0","#e1d9ce");
      pill(ix+8,iy+9,it.level,{fill:"#e4efeb",color:"#2d6259",font:"700 8px sans-serif",h:21,padX:6,lineH:11});
      text(it.school,ix+72,iy+8,iw-80,15,{font:"700 9px sans-serif",color:"#25383c",maxLines:2});
      text(it.detail,ix+72,iy+31,iw-80,13,{font:"8px sans-serif",color:"#7c8685",maxLines:1});
      ix+=iw+8;
    });
  }
  rectFor(null,x,y,w,h);
  return y+h+14;
}
function drawStatus(y){
  var data=[
    ["Knowledge","知识","📚",E.statKnowledge,E.meterKnowledge,"#2d7b70"],
    ["Energy","体力","⚡",E.statEnergy,E.meterEnergy,"#2d7b70"],
    ["Mental","心理","🧠",E.statMental,E.meterMental,"#5b6ea6"],
    ["Money","金钱","¥",E.statMoney,E.meterMoney,"#a37d3d"],
    ["Research","科研","🧪",E.statResearch,E.meterResearch,"#7c528d"],
    ["Reputation","声望","✦",E.statReputation,E.meterReputation,"#a1474b"],
    ["English","英语","EN",E.statEnglish,E.meterEnglish,"#4f6fa4"]
  ];
  var gap=8,colW=(shellW-gap)/2,x=shellX;
  data.forEach(function(d,i){
    var row=Math.floor(i/2),col=i%2,xx=x+col*(colW+gap),yy=y+row*68;
    var val=Number(d[3].textContent||0),low=val<=25;
    rr(xx,yy,colW,58,15,low?"#fff8f6":"#fffdf9",low?"#e5a6a2":"#ddd5c9");
    rr(xx+10,yy+10,34,34,11,d[0]==="English"?"#e8eef8":"#edf3f0");
    text(d[2],xx+27,yy+19,30,16,{font:d[0]==="English"?"700 9px sans-serif":"14px sans-serif",color:"#315c55",align:"center",maxLines:1});
    text(d[1],xx+54,yy+10,colW-64,13,{font:"8px sans-serif",color:C.muted});
    text(String(val),xx+54,yy+25,colW-64,22,{font:"800 18px sans-serif",color:C.ink});
    rr(xx+10,yy+49,colW-20,4,2,"#e7e1d6");
    rr(xx+10,yy+49,(colW-20)*clamp(val/100,0,1),4,2,low?"#b94848":d[5]);
  });
  return y+Math.ceil(data.length/2)*68+14;
}
function drawInventory(y){
  var x=shellX,w=shellW,children=E.inventoryItems.children||[];
  var cols=2,gap=8,pad=14,cardH=48;
  var rows=Math.max(0,Math.ceil(children.length/cols));
  var gridH=rows?rows*cardH+(rows-1)*gap:0;
  var h=78+(gridH?gridH+14:0);
  rr(x,y,w,h,18,"rgba(255,253,248,.97)",C.line);
  text("TOOLKIT",x+14,y+11,w-28,12,{font:"800 8px sans-serif",color:"#9a7540"});
  text("🎒 人生道具",x+14,y+27,w-28,18,{font:"800 13px sans-serif",color:"#22373b"});
  text(E.inventoryLockNote.textContent||"",x+14,y+49,w-108,13,{font:"8px sans-serif",color:"#87908f",maxLines:2});

  var realAd=G.AD_SERVICE&&G.AD_SERVICE.isRealAdAvailable&&G.AD_SERVICE.isRealAdAvailable();
  if(realAd&&!E.openSupplyBtn.hidden){
    var bx=x+w-92,by=y+18;rr(bx,by,78,30,10,"#fff",C.line);
    text(E.openSupplyBtn.textContent||"获取补给",bx+39,by+8,68,14,{font:"700 9px sans-serif",color:C.ink,align:"center"});
    if(!E.openSupplyBtn.disabled)addHit(E.openSupplyBtn,bx,by,78,30,function(){E.openSupplyBtn.click();});
  }

  if(children.length){
    var cw=(w-pad*2-gap)/2;
    children.forEach(function(n,idx){
      var row=Math.floor(idx/cols),col=idx%cols;
      var ix=x+pad+col*(cw+gap),iy=y+78+row*(cardH+gap);
      var name=extractTag(n.rawHTML,"b");
      var count=extractTag(n.rawHTML,"small");
      var icon=extractClass(n.rawHTML,"inventory-icon")||"•";
      var action=extractTag(n.rawHTML,"em")||(n.disabled?"暂无":"使用");
      rr(ix,iy,cw,cardH,12,n.disabled?"#f1ede7":"#fffdf8","#ded6ca");
      rr(ix+7,iy+8,29,29,9,n.disabled?"#e8e5df":"#e8f1ed");
      text(icon,ix+21.5,iy+15,24,14,{font:"11px sans-serif",color:n.disabled?"#9b9993":"#315f57",align:"center"});
      text(name,ix+43,iy+7,cw-51,14,{font:"700 9px sans-serif",color:n.disabled?"#99948d":"#304347",maxLines:1});
      text(count+" · "+action,ix+43,iy+25,cw-51,12,{font:"8px sans-serif",color:n.disabled?"#aaa59e":"#6f7d7b",maxLines:1});
      if(!n.disabled)addHit(n,ix,iy,cw,cardH,function(){E.inventoryItems.dispatchEvent({type:"click",target:n});});
    });
  }
  return y+h+14;
}
function drawStory(y){
  var x=shellX,w=shellW,choices=E.choices.children||[];
  var innerW=w-40;
  var titleH=measureTextHeight(E.sceneTitle.textContent,innerW,"800 25px serif",31);
  var sceneTextH=measureTextHeight(E.sceneText.textContent,innerW,"14px sans-serif",24);
  var effectH=measureTextHeight(E.effectHint.textContent,innerW,"10px sans-serif",17);
  var criticalBlock=!E.criticalBanner.hidden?76:0;
  var opportunityBlock=!E.opportunityBanner.hidden?70:0;
  var hintBlock=0;
  if(!E.decisionHintPanel.hidden){
    var measuredHint=Math.max(64,measureTextHeight(plain(E.decisionHintContent.innerHTML),w-68,"9px sans-serif",15)+36);
    hintBlock=measuredHint+12;
  }
  var choicesH=choices.reduce(function(sum,n){
    return sum+measureRawNodeButtonHeight(n,innerW,{})+10;
  },0);

  /* This mirrors every cy increment below exactly, plus 20px bottom padding. */
  var ph=20+42+18+criticalBlock+opportunityBlock+
    (titleH+10)+(sceneTextH+12)+(effectH+18)+hintBlock+choicesH+20;

  var fill=gradient(x,y,x+w,y+ph,[[0,"rgba(255,254,250,.99)"],[1,"rgba(249,245,237,.98)"]]);
  withShadow("rgba(31,48,50,.08)",24,9,function(){rr(x,y,w,ph,20,fill,C.line);});
  vdom.storyPanel._rect={x:x,docY:y,w:w,h:ph};

  var cy=y+20;
  var chipW=pill(x+20,cy,E.stageChip.textContent||"当前阶段",{fill:"#e0eee9",color:"#214d46",font:"800 9px sans-serif",h:25,padX:9,lineH:12});
  pill(x+20+chipW+7,cy,E.typeChip.textContent||"主线",{fill:"#f3e4d5",color:"#79522e",font:"800 9px sans-serif",h:25,padX:9,lineH:12});
  text(E.yearText.textContent||"",x+w-20,cy+6,w/3,13,{font:"9px sans-serif",color:C.muted,align:"right"});cy+=42;

  rr(x+20,cy,w-40,4,2,"#e9e1d6");
  var pct=parseFloat(E.progressBar.style.width||"0")||0;
  rr(x+20,cy,(w-40)*clamp(pct/100,0,1),4,2,C.green);cy+=18;

  if(!E.criticalBanner.hidden){
    var hh=68;rr(x+20,cy,w-40,hh,16,"#fff0ea","#e5a497");
    text(E.criticalTitle.textContent||"⚠️ 关键人生选择",x+34,cy+11,w-68,18,{font:"800 12px sans-serif",color:"#7d2f2f"});
    text(E.criticalText.textContent||"",x+34,cy+31,w-68,16,{font:"10px sans-serif",color:"#7d2f2f",maxLines:2});cy+=hh+8;
  }
  if(!E.opportunityBanner.hidden){
    var oh=62;rr(x+20,cy,w-40,oh,16,"#eef5ff","#a9c4e8");
    text("🎯 竞争性机会",x+34,cy+10,w-68,18,{font:"800 12px sans-serif",color:"#345b84"});
    text(E.opportunityText.textContent||"",x+34,cy+30,w-68,15,{font:"9px sans-serif",color:"#345b84",maxLines:2});cy+=oh+8;
  }

  cy+=text(E.sceneTitle.textContent||"",x+20,cy,w-40,31,{font:"800 25px serif",color:"#1b3034"})+10;
  cy+=text(E.sceneText.textContent||"",x+20,cy,w-40,24,{font:"14px sans-serif",color:"#48595b"})+12;
  cy+=text(E.effectHint.textContent||"",x+20,cy,w-40,17,{font:"10px sans-serif",color:"#6e7d7e"})+18;

  if(!E.decisionHintPanel.hidden){
    var dh=Math.max(64,measureTextHeight(plain(E.decisionHintContent.innerHTML),w-68,"9px sans-serif",15)+36);
    rr(x+20,cy,w-40,dh,15,"#fff9e8","#d8ca9d");
    text("💡 决策提示",x+34,cy+11,w-68,17,{font:"800 11px sans-serif",color:"#745922"});
    text(plain(E.decisionHintContent.innerHTML),x+34,cy+31,w-68,15,{font:"9px sans-serif",color:"#8b8069",maxLines:6});cy+=dh+12;
  }

  choices.forEach(function(n){
    var accent=vdom.storyPanel.classList.contains("opportunity-scene")?"rgba(52,91,132,.32)":null;
    var hh=measureRawNodeButtonHeight(n,w-40,{accent:accent});
    if(docVisible(cy,hh,100))rawNodeButton(n,x+20,cy,w-40,{accent:accent});
    cy+=hh+10;
  });

  return y+ph+14;
}
function parseLogs(){
  var html=E.lifeLog.rawHTML||E.lifeLog.innerHTML||"",out=[];
  var re=/<div class="log-item">([\s\S]*?)<\/div>/gi,m;
  while((m=re.exec(html)))out.push(plain(m[1]));
  return out;
}
function drawLog(y){
  var x=shellX,w=shellW,hidden=E.lifeLog.style.display==="none",logs=parseLogs();
  var count=hidden?0:Math.min(4,logs.length),h=66+count*52;
  panel(x,y,w,h,20);
  text("YOUR MEDICAL LIFE",x+20,y+16,w-40,12,{font:"800 8px sans-serif",color:C.accent});
  text("人生记录",x+20,y+31,w-40,19,{font:"800 14px sans-serif"});
  rr(x+w-74,y+16,54,28,9,"#fff",C.line);
  text(E.toggleLogBtn.textContent||"收起",x+w-47,y+23,48,13,{font:"700 9px sans-serif",color:C.ink,align:"center"});
  addHit(E.toggleLogBtn,x+w-74,y+16,54,28,function(){E.toggleLogBtn.click();});
  if(!hidden){
    var cy=y+62;
    logs.slice(0,4).forEach(function(l){
      ctx.fillStyle="#c8b8a2";ctx.fillRect(x+21,cy+2,3,40);
      text(l,x+33,cy,w-55,16,{font:"10px sans-serif",color:"#4f5b5e",maxLines:3});cy+=52;
    });
  }
  return y+h+14;
}
function drawGame(y){
  y=drawCareerStrip(y);
  y=drawEducation(y);
  y=drawStatus(y);
  if(!E.reviveShareBanner.hidden){
    var h=82;rr(shellX,y,shellW,h,16,"#edf6f1","#cfded7");
    text("你已经重新站起来了",shellX+14,y+12,shellW-28,17,{font:"800 11px sans-serif",color:"#264f47"});
    text(E.reviveShareText.textContent||"",shellX+14,y+32,shellW-28,15,{font:"9px sans-serif",color:"#6c7f7a",maxLines:2});
    rr(shellX+14,y+56,shellW-28,22,8,"#fff",C.line);text("分享这一局",W/2,y+61,shellW-40,12,{font:"700 8px sans-serif",color:C.ink,align:"center"});
    addHit(E.reviveShareBtn,shellX+14,y+56,shellW-28,22,function(){E.reviveShareBtn.click();});y+=h+14;
  }
  y=drawInventory(y);
  y=drawStory(y);
  y=drawLog(y);
  rectFor(E.gameScreen,shellX,y,shellW,0);
  return y;
}
function parseStructuredRows(html,className){
  var out=[];
  var source=String(html||"");
  var marker='<div class="'+className+'">';
  var pos=0;
  while(true){
    var start=source.indexOf(marker,pos);
    if(start<0)break;
    var close=source.indexOf("</div>",start+marker.length);
    if(close<0)break;
    var block=source.slice(start+marker.length,close);
    var s1=block.indexOf("<span>");
    var s2=s1>=0?block.indexOf("</span>",s1+6):-1;
    var b1=block.indexOf("<strong>");
    var b2=b1>=0?block.indexOf("</strong>",b1+8):-1;
    if(s1>=0&&s2>=0&&b1>=0&&b2>=0){
      out.push({
        label:plain(block.slice(s1+6,s2)),
        value:plain(block.slice(b1+8,b2))
      });
    }
    pos=close+6;
  }
  return out;
}
function parseEndingStats(){
  return parseStructuredRows(E.endingStats.rawHTML||E.endingStats.innerHTML||"","ending-stat");
}
function parseEndingJourney(){
  return parseStructuredRows(E.endingJourney.rawHTML||E.endingJourney.innerHTML||"","journey-item");
}
G.__ENDING_PARSE__=parseStructuredRows;
function parseSpanList(html){
  var out=[],m,re=new RegExp("<span[^>]*>([\\\\s\\\\S]*?)</span>","gi");
  while((m=re.exec(String(html||""))))out.push(plain(m[1]));
  return out;
}
function drawEnding(y){
  var x=shellX,w=shellW,panelY=y;
  var stats=parseEndingStats();
  var tags=extractAllClass(E.endingTags.innerHTML,"ending-tag");
  var journey=parseEndingJourney();
  var research=parseSpanList(E.endingResearchSummary.innerHTML);

  var statsGap=8,statsCols=3,statsW=(w-44-statsGap*(statsCols-1))/statsCols;
  var statsRows=Math.max(1,Math.ceil(Math.max(stats.length,1)/statsCols));
  var statsH=statsRows*58+(statsRows-1)*8;

  var tagRows=1,tagX=0;
  ctx.font="700 8px sans-serif";
  tags.slice(0,14).forEach(function(t){
    var tw=Math.min(w-44,ctx.measureText(t).width+20);
    if(tagX&&tagX+tw>w-44){tagRows++;tagX=0;}
    tagX+=tw+6;
  });
  var tagsH=tags.length?tagRows*25+(tagRows-1)*5:0;

  var journeyRows=Math.max(1,Math.ceil(Math.max(journey.length,1)/2));
  var journeyCardsH=journeyRows*62+(journeyRows-1)*8;
  var archiveH=62+journeyCardsH+18;

  var boardH=210;
  var ph=24+26+20+95+18+132+14+statsH+18+tagsH+(tags.length?18:0)+archiveH+14+boardH+12+46+10+54+28;
  panel(x,panelY,w,ph,20);
  var cy=panelY+24;

  pill(x+22,cy,"人生结局",{fill:"#efe4d3",stroke:"#dfceb2",color:"#685139",font:"800 10px sans-serif",h:26});cy+=46;
  cy+=text(E.endingTitle.textContent||"这一段医学人生结束了",x+22,cy,w-44,31,{font:"800 26px serif",color:"#1e3236"})+8;
  cy+=text(E.endingText.textContent||"",x+22,cy,w-44,20,{font:"11px sans-serif",color:C.muted})+16;

  var statusH=132;
  rr(x+22,cy,w-44,statusH,18,gradient(x+22,cy,x+w-22,cy+statusH,[[0,"#fffdf8"],[1,"#f4ede2"]]),"#d7cdbd");
  text("FINAL STATUS · 本局终止时身份",x+36,cy+14,w-72,13,{font:"800 8px sans-serif",color:"#9a7540"});
  text(E.endingStatusHeadline.textContent||"—",x+36,cy+35,w-72,27,{font:"800 21px sans-serif",color:"#21373b"});
  text(E.endingStatusMeta.textContent||"",x+36,cy+68,w-72,16,{font:"10px sans-serif",color:"#697676",maxLines:2});
  var rx=x+36,ry=cy+102;
  research.slice(0,4).forEach(function(item){
    var pw=pill(rx,ry,item,{fill:"#e7f0ec",color:"#315f55",font:"700 8px sans-serif",h:21,padX:7,lineH:11});
    rx+=pw+6;
  });
  cy+=statusH+14;

  stats.forEach(function(s,idx){
    var row=Math.floor(idx/statsCols),col=idx%statsCols;
    var xx=x+22+col*(statsW+statsGap),yy=cy+row*66;
    rr(xx,yy,statsW,58,13,"#fffdf9","#ddd5c9");
    text(s.label,xx+11,yy+9,statsW-22,13,{font:"8px sans-serif",color:"#7b817d"});
    text(s.value,xx+11,yy+25,statsW-22,24,{font:"800 19px sans-serif",color:"#1d3034"});
  });
  cy+=statsH+16;

  if(tags.length){
    var tx=x+22,ty=cy;
    tags.slice(0,14).forEach(function(t){
      ctx.font="700 8px sans-serif";
      var tw=Math.min(w-44,ctx.measureText(t).width+20);
      if(tx>x+22&&tx+tw>x+w-22){tx=x+22;ty+=30;}
      var pw=pill(tx,ty,t,{fill:"#e7efeb",color:"#36554d",font:"700 8px sans-serif",h:23,padX:8,lineH:12});
      tx+=pw+6;
    });
    cy+=tagsH+18;
  }

  var archiveY=cy;
  rr(x+22,archiveY,w-44,archiveH,18,"rgba(255,253,248,.95)",C.line);
  text("CAREER ARCHIVE",x+36,archiveY+13,w-72,12,{font:"800 8px sans-serif",color:C.accent});
  text("本轮生涯档案",x+36,archiveY+30,w-72,19,{font:"800 14px sans-serif",color:"#21373b"});
  var cardGap=8,cardW=(w-72-cardGap)/2;
  journey.forEach(function(it,idx){
    var row=Math.floor(idx/2),col=idx%2;
    var xx=x+36+col*(cardW+cardGap),yy=archiveY+58+row*70;
    rr(xx,yy,cardW,62,12,"#fff","#e2d9cd");
    text(it.label,xx+10,yy+9,cardW-20,12,{font:"7px sans-serif",color:"#8b8e89",maxLines:1});
    text(it.value,xx+10,yy+25,cardW-20,15,{font:"700 9px sans-serif",color:"#26393d",maxLines:2});
  });
  cy+=archiveH+14;

  var boardY=cy;
  rr(x+22,boardY,w-44,boardH,18,"rgba(255,253,248,.95)",C.line);
  vdom.legacyBoard._rect={x:x+22,docY:boardY,w:w-44,h:boardH};
  text("MESSAGE TO THE NEXT STUDENT",x+36,boardY+13,w-72,12,{font:"800 8px sans-serif",color:C.accent});
  text("给下一位医学生的一句话",x+36,boardY+31,w-72,19,{font:"800 14px sans-serif"});
  text("当前版本留言保存在本机。后续开启在线留言墙后，可与其他玩家互动。",
    x+36,boardY+56,w-72,15,{font:"9px sans-serif",color:C.muted,maxLines:2});
  rr(x+36,boardY+108,w-72,46,13,"#fff",C.line);
  text(E.legacyMessage.value||"例如：别只盯着结果，先想清楚自己想成为什么样的医生。",x+48,boardY+120,w-96,15,{font:"9px sans-serif",color:E.legacyMessage.value?C.ink:"#99948d",maxLines:2});
  addHit(E.legacyMessage,x+36,boardY+108,w-72,46,function(){focusInput(E.legacyMessage,200,true);});
  rr(x+36,boardY+164,w-72,32,10,gradient(x+36,boardY+164,x+w-36,boardY+196,[[0,"#a0444b"],[1,"#843139"]]));
  text("留下这句话",W/2,boardY+172,w-90,14,{font:"800 10px sans-serif",color:"#fff",align:"center"});
  addHit(E.postMessageBtn,x+36,boardY+164,w-72,32,function(){E.postMessageBtn.click();});
  cy+=boardH+12;

  cy+=ghostButton(E.endingShareBtn,x+22,cy,w-44,E.endingShareBtn.textContent||"分享我的医学人生","")+10;
  cy+=primaryButton(E.endingRestartBtn,x+22,cy,w-44,E.endingRestartBtn.textContent||"重新开启一局","");
  rectFor(E.endingScreen,x,panelY,w,cy-panelY+24);
  return Math.max(panelY+ph,cy+24);
}
function drawOverlayBase(){
  ctx.save();ctx.fillStyle="rgba(15,24,27,.70)";ctx.fillRect(0,0,W,H);ctx.restore();
}
function fixedButton(node,x,y,w,label,primary){
  var h=44,fill=primary?gradient(x,y,x+w,y+h,[[0,"#a0444b"],[1,"#843139"]]):"#fff";
  rr(x,y,w,h,13,fill,primary?null:C.line);
  text(label,x+w/2,y+12,w-20,18,{font:"800 12px sans-serif",color:primary?"#fff":C.ink,align:"center",maxLines:1});
  if(node&&!node.disabled&&!node.hidden)addHit(node,x,y,w,h,function(){node.click();},true);
}
function drawAdmissionOverlay(){
  if(E.admissionOverlay.hidden)return false;
  drawOverlayBase();
  var x=20,w=W-40,h=Math.min(520,H-50),y=(H-h)/2;
  withShadow("rgba(0,0,0,.30)",40,12,function(){rr(x,y,w,h,25,"#fffdf8","rgba(255,255,255,.24)");});
  if(!E.admissionSearching.hidden){
    var cx=W/2,cy=y+68,r=32,ang=(Date.now()/220)%6.28;
    ctx.save();ctx.lineWidth=5;ctx.strokeStyle="#ece7dc";ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle="#936d3d";ctx.beginPath();ctx.arc(cx,cy,r,ang,ang+2.2);ctx.stroke();ctx.restore();
    text("ADMISSION RESULT",cx,y+118,w-50,13,{font:"800 8px sans-serif",color:C.accent,align:"center"});
    text("查询录取结果中",cx,y+139,w-50,29,{font:"800 24px sans-serif",color:"#1c3034",align:"center"});
    text(E.admissionQuerySchool.textContent||"正在连接招生系统…",cx,y+178,w-60,18,{font:"11px sans-serif",color:"#6c797a",align:"center",maxLines:2});
    text(E.admissionCountdown.textContent||"3",cx,y+228,w-80,60,{font:"800 52px sans-serif",color:"#8b6940",align:"center"});
    rr(x+55,y+310,w-110,5,3,"#ebe5d9");
    var pct=parseFloat(E.admissionQueryBar.style.width||"8")||8;rr(x+55,y+310,(w-110)*clamp(pct/100,0,1),5,3,gradient(x+55,y+310,x+w-55,y+315,[[0,"#b08a4c"],[1,"#5d8e82"]]));
    scheduleAnim();
  }else{
    var success=(E.admissionResultIcon.textContent||"")==="✓";
    rr(W/2-41,y+44,82,82,41,success?"#e5f2eb":"#f6e8e6");
    text(E.admissionResultIcon.textContent||"✓",W/2,y+60,70,50,{font:"700 43px sans-serif",color:success?"#347452":"#a24c4e",align:"center"});
    text("OFFICIAL RESULT · GAME",W/2,y+142,w-60,13,{font:"800 8px sans-serif",color:C.accent,align:"center"});
    text(E.admissionResultTitle.textContent||"",W/2,y+163,w-60,29,{font:"800 24px sans-serif",color:"#1c3034",align:"center"});
    text(E.admissionResultText.textContent||"",W/2,y+202,w-64,18,{font:"11px sans-serif",color:"#6c797a",align:"center",maxLines:3});

    var rewardText=E.admissionRewardText&&E.admissionRewardText.textContent||"";
    if(rewardText){
      var rewardY=y+244,rewardH=78;
      rr(x+32,rewardY,w-64,rewardH,15,"#edf6f1","#bdd8cd");
      text("GRADUATION TRIP · 升学奖励",x+46,rewardY+11,w-92,12,{font:"800 8px sans-serif",color:"#3c7568"});
      text(rewardText,x+46,rewardY+30,w-92,16,{font:"10px sans-serif",color:"#315b53",maxLines:3});
      text(plain(E.admissionResultMeta.innerHTML),W/2,y+336,w-64,15,{font:"8px sans-serif",color:"#536466",align:"center",maxLines:3});
    }else{
      text(plain(E.admissionResultMeta.innerHTML),W/2,y+260,w-64,16,{font:"9px sans-serif",color:"#536466",align:"center",maxLines:4});
    }
    fixedButton(E.admissionResultBtn,x+36,y+h-70,w-72,E.admissionResultBtn.textContent||"确认结果",true);
  }
  return true;
}
function drawRewardOverlay(){
  var type=null;
  if(!E.supplyOverlay.hidden)type="supply";
  if(!E.crisisOverlay.hidden)type="crisis";
  if(!type)return false;
  drawOverlayBase();
  var x=20,w=W-40,h=type==="crisis"?400:500,y=(H-h)/2;
  rr(x,y,w,h,24,gradient(x,y,x+w,y+h,[[0,"#fffdf8"],[1,"#f5efe5"]]),"rgba(255,255,255,.26)");
  if(type==="crisis"){
    text(E.crisisIcon.textContent||"⚠️",W/2,y+30,w-60,48,{font:"36px sans-serif",align:"center"});
    text("STATUS WARNING",W/2,y+88,w-50,13,{font:"800 8px sans-serif",color:C.accent,align:"center"});
    text(E.crisisTitle.textContent||"状态告急",W/2,y+108,w-50,29,{font:"800 24px sans-serif",color:"#1e3438",align:"center"});
    text(E.crisisText.textContent||"",W/2,y+150,w-64,19,{font:"11px sans-serif",color:"#6c7978",align:"center",maxLines:6});
    var by=y+250;
    if(!E.crisisUseBtn.hidden){fixedButton(E.crisisUseBtn,x+34,by,w-68,E.crisisUseBtn.textContent||"使用恢复卡",true);by+=53;}
    if(!E.crisisAdBtn.hidden){fixedButton(E.crisisAdBtn,x+34,by,w-68,E.crisisAdBtn.textContent||"获取恢复卡",false);by+=53;}
    fixedButton(E.crisisContinueBtn,x+34,by,w-68,E.crisisContinueBtn.textContent||"我知道了，继续",false);
  }else{
    text("🎒",W/2,y+30,w-60,44,{font:"34px sans-serif",align:"center"});
    text("OPTIONAL REWARD",W/2,y+82,w-50,13,{font:"800 8px sans-serif",color:C.accent,align:"center"});
    text("人生补给",W/2,y+103,w-50,29,{font:"800 24px sans-serif",color:"#1e3438",align:"center"});
    text("广告只提供资源型道具，不改变考研、申博或医院求职的录取/录用结果。",W/2,y+143,w-60,17,{font:"10px sans-serif",color:"#6c7978",align:"center",maxLines:3});
    var cy=y+205;
    (E.supplyOptions.children||[]).slice(0,4).forEach(function(n){
      var name=extractTag(n.rawHTML,"b")||"人生道具",desc=extractTag(n.rawHTML,"small");
      rr(x+30,cy,w-60,54,14,n.disabled?"#f1ede7":"#fffdfa","#ded5c7");
      text(name,x+44,cy+9,w-88,15,{font:"700 10px sans-serif",color:"#2c4145"});
      text(desc,x+44,cy+27,w-88,14,{font:"8px sans-serif",color:"#7a8685",maxLines:2});
      if(!n.disabled)addHit(n,x+30,cy,w-60,54,function(){E.supplyOptions.dispatchEvent({type:"click",target:n});},true);
      cy+=62;
    });
    fixedButton(E.closeSupplyBtn,x+34,y+h-58,w-68,E.closeSupplyBtn.textContent||"暂时不用",false);
  }
  return true;
}
function drawBlessing(){
  if(E.endingBlessingOverlay.hidden)return false;
  drawOverlayBase();
  var x=20,w=W-40,h=410,y=(H-h)/2;
  rr(x,y,w,h,26,gradient(x,y,x+w,y+h,[[0,"#fffdf7"],[1,"#f6f1e8"]]),"rgba(255,255,255,.28)");
  rr(W/2-35,y+30,70,70,24,gradient(W/2-35,y+30,W/2+35,y+100,[[0,"#b68d4e"],[1,"#8a6841"]]));
  text("✦",W/2,y+47,55,38,{font:"31px serif",color:"#fff4d8",align:"center"});
  text("A NOTE FOR YOUR JOURNEY",W/2,y+122,w-50,13,{font:"800 8px sans-serif",color:C.accent,align:"center"});
  text("这一段路，走到这里了",W/2,y+145,w-50,29,{font:"800 23px sans-serif",color:"#1c3034",align:"center"});
  text(E.endingBlessingText.textContent||"",W/2,y+190,w-62,20,{font:"11px sans-serif",color:"#5e6c6e",align:"center",maxLines:5});
  fixedButton(E.blessingMessageBtn,x+34,y+h-112,w-68,E.blessingMessageBtn.textContent||"留一句给后来的人",true);
  fixedButton(E.blessingCloseBtn,x+34,y+h-58,w-68,E.blessingCloseBtn.textContent||"看看我的结局",false);
  return true;
}
function scheduleAnim(){
  if(animTimer)return;
  animTimer=setTimeout(function(){animTimer=null;render();},60);
}
function drawFatalError(err){
  ctx.save();
  ctx.setTransform&&ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.fillStyle="#f3eee5";ctx.fillRect(0,0,W,H);
  rr(18,SAFE_TOP+24,W-36,Math.min(300,H-SAFE_TOP-48),22,"#fffdf8","#d9d2c6");
  text("小游戏启动失败",36,SAFE_TOP+48,W-72,28,{font:"800 23px sans-serif",color:"#8d332d"});
  text("已经捕获到运行时错误，请把这个画面截图发给我。",36,SAFE_TOP+88,W-72,20,{font:"12px sans-serif",color:"#687779"});
  var msg=String(err&&(err.stack||err.message||err)||"unknown error");
  text(msg,36,SAFE_TOP+130,W-72,18,{font:"10px monospace",color:"#303638",maxLines:8});
  ctx.restore();
}
function prepareContext(targetCtx,targetCanvas,targetDpr){
  if(targetCtx.setTransform)targetCtx.setTransform(1,0,0,1,0,0);
  targetCtx.clearRect(0,0,targetCanvas.width,targetCanvas.height);
  if(targetCtx.setTransform)targetCtx.setTransform(targetDpr,0,0,targetDpr,0,0);
  else targetCtx.scale(targetDpr,targetDpr);
}
function renderScene(targetCtx,targetCanvas,targetDpr,collectHits,opts){
  opts=opts||{};
  var prevCtx=ctx,prevDpr=DPR,prevH=H,prevScroll=scrollY,prevMax=maxScroll;
  var prevContent=contentHeight,prevHits=hits,prevLastScreen=lastScreen,prevGlobalScroll=G.__scrollY;
  ctx=targetCtx;
  DPR=targetDpr;
  if(opts.logicalH)H=opts.logicalH;
  if(collectHits!==false)hits=[];
  prepareContext(ctx,targetCanvas,DPR);

  if(G.__MINI_FATAL_ERROR__){
    drawFatalError(G.__MINI_FATAL_ERROR__);
    ctx=prevCtx;DPR=prevDpr;H=prevH;
    return;
  }

  var sid=screenId();
  if(opts.forcedScroll!=null){
    scrollY=opts.forcedScroll;
    G.__scrollY=scrollY;
  }else{
    if(lastScreen&&lastScreen!==sid&&G.__scrollY===0)scrollY=0;
    lastScreen=sid;
    scrollY=clamp(G.__scrollY||scrollY,0,maxScroll);
  }

  ctx.save();ctx.translate(0,-scrollY);
  contentHeight=Math.max(H+scrollY,900);
  drawBackdrop();
  var y=drawJourney(drawTopbar());
  if(sid==="startScreen")contentHeight=drawStart(y)+40;
  else if(sid==="gaokaoScreen")contentHeight=drawGaokao(y)+40;
  else if(sid==="schoolScreen")contentHeight=drawSchools(y)+40;
  else if(sid==="letterScreen")contentHeight=drawLetter(y)+40;
  else if(sid==="gameScreen")contentHeight=drawGame(y)+40;
  else if(sid==="endingScreen")contentHeight=drawEnding(y)+40;
  ctx.restore();

  maxScroll=Math.max(0,contentHeight-H+24);
  if(scrollY>maxScroll){scrollY=maxScroll;G.__scrollY=scrollY;}

  if(!opts.skipOverlays){
    drawAdmissionOverlay();
    drawRewardOverlay();
    drawBlessing();
  }

  if(opts.preserveMetrics){
    H=prevH;
    scrollY=prevScroll;
    maxScroll=prevMax;
    contentHeight=prevContent;
    hits=prevHits;
    lastScreen=prevLastScreen;
    G.__scrollY=prevGlobalScroll;
  }
  ctx=prevCtx;
  DPR=prevDpr;
}
function buildScrollBuffer(){
  if(!wxapi.createOffscreenCanvas||maxScroll<=0)return false;
  var docBottom=maxScroll+H;
  var desired=Math.min(docBottom,Math.ceil(H*3));
  if(desired<=H)return false;
  var maxTop=Math.max(0,docBottom-desired);
  var top=clamp(scrollY-(desired-H)/2,0,maxTop);
  var pw=Math.round(W*STATIC_DPR),ph=Math.round(desired*STATIC_DPR);
  try{
    if(!scrollBuffer||scrollBuffer.width!==pw||scrollBuffer.height!==ph){
      scrollBuffer=wxapi.createOffscreenCanvas({type:"2d",width:pw,height:ph});
      scrollBuffer.width=pw;
      scrollBuffer.height=ph;
      scrollBufferCtx=scrollBuffer.getContext("2d");
    }
    if(!scrollBufferCtx)return false;
    renderScene(scrollBufferCtx,scrollBuffer,STATIC_DPR,false,{
      logicalH:desired,
      forcedScroll:top,
      skipOverlays:true,
      preserveMetrics:true
    });
    scrollBufferTop=top;
    scrollBufferHeight=desired;
    scrollBufferScreen=screenId();
    scrollBufferValid=true;
    return true;
  }catch(e){
    scrollBufferValid=false;
    return false;
  }
}
function presentScrollBuffer(){
  if(!scrollBufferValid||scrollBufferScreen!==screenId()||
     scrollY<scrollBufferTop||scrollY+H>scrollBufferTop+scrollBufferHeight){
    return false;
  }
  var sy=Math.round((scrollY-scrollBufferTop)*STATIC_DPR);
  var sh=Math.round(H*STATIC_DPR);
  if(sy<0||sy+sh>scrollBuffer.height)return false;
  if(mainCtx.setTransform)mainCtx.setTransform(1,0,0,1,0,0);
  mainCtx.clearRect(0,0,canvas.width,canvas.height);
  try{mainCtx.imageSmoothingEnabled=false;}catch(e){}
  mainCtx.drawImage(
    scrollBuffer,
    0,sy,canvas.width,sh,
    0,0,canvas.width,canvas.height
  );
  if(mainCtx.setTransform)mainCtx.setTransform(STATIC_DPR,0,0,STATIC_DPR,0,0);
  return true;
}
function render(){
  /* 滑动时只裁切高分辨率缓存，不降低 DPR，也不重算整页文字/卡片。 */
  if(fastScrolling&&presentScrollBuffer())return;
  scrollBufferValid=false;
  renderScene(mainCtx,canvas,STATIC_DPR,true);
  if(!fastScrolling)scheduleScrollBufferWarm();
}
function setScroll(v){
  scrollY=clamp(Number(v)||0,0,maxScroll||999999);
  scrollTargetY=scrollY;
  G.__scrollY=scrollY;render();
}
G.__MINI_RENDER__=render;
G.__MINI_SCROLL_TO__=setScroll;

function focusInput(node,maxLength,multiple){
  activeInput=node;
  try{
    wxapi.showKeyboard({defaultValue:node.value||"",maxLength:maxLength||140,multiple:!!multiple,confirmType:"done"});
  }catch(e){}
}
G.__MINI_FOCUS__=function(node){
  if(node===E.playerName)focusInput(node,12,false);
  else if(node===E.schoolSearch)focusInput(node,30,false);
  else if(node===E.legacyMessage)focusInput(node,200,true);
};
if(wxapi.onKeyboardInput)wxapi.onKeyboardInput(function(res){
  if(!activeInput)return;
  activeInput.value=res.value||"";
  activeInput.dispatchEvent({type:"input",target:activeInput});
});
if(wxapi.onKeyboardConfirm)wxapi.onKeyboardConfirm(function(res){
  if(activeInput){
    activeInput.value=(res&&res.value!==undefined)?res.value:activeInput.value;
    activeInput.dispatchEvent({type:"input",target:activeInput});
  }
  activeInput=null;
  try{if(wxapi.hideKeyboard)wxapi.hideKeyboard();}catch(e){}
});
if(wxapi.onKeyboardComplete)wxapi.onKeyboardComplete(function(){activeInput=null;});

function hitAt(x,y){
  for(var i=hits.length-1;i>=0;i--){
    var h=hits[i];
    if(x>=h.x&&x<=h.x+h.w&&y>=h.y&&y<=h.y+h.h)return h;
  }
  return null;
}
function requestDisplayFrame(fn){
  if(canvas&&typeof canvas.requestAnimationFrame==="function")return canvas.requestAnimationFrame(fn);
  if(typeof G.__RAF__==="function")return G.__RAF__(fn);
  return setTimeout(function(){fn(Date.now());},16);
}
function cancelDisplayFrame(id){
  if(!id)return;
  if(canvas&&typeof canvas.cancelAnimationFrame==="function"){
    try{canvas.cancelAnimationFrame(id);return;}catch(e){}
  }
  if(typeof G.__CAF__==="function"){G.__CAF__(id);return;}
  clearTimeout(id);
}
function scheduleScrollBufferWarm(){
  if(bufferWarmTimer){clearTimeout(bufferWarmTimer);bufferWarmTimer=null;}
  if(fastScrolling||maxScroll<=0)return;
  var modal=!E.admissionOverlay.hidden||!E.supplyOverlay.hidden||!E.crisisOverlay.hidden||!E.endingBlessingOverlay.hidden;
  if(modal)return;
  bufferWarmTimer=setTimeout(function(){
    bufferWarmTimer=null;
    if(!fastScrolling&&maxScroll>0)buildScrollBuffer();
  },70);
}
function finishSmoothScroll(){
  scrollFrameRunning=false;
  scrollFrameId=0;
  fastScrolling=false;
  scrollVelocity=0;
  scrollY=clamp(scrollTargetY,0,maxScroll);
  G.__scrollY=scrollY;
  scrollBufferValid=false;
  render();
}
function smoothScrollFrame(){
  scrollFrameId=0;
  if(!scrollFrameRunning)return;

  scrollTargetY=clamp(scrollTargetY,0,maxScroll);
  var diff=scrollTargetY-scrollY;
  var touching=!!touchStart;
  var ease=touching?0.52:0.20;

  if(Math.abs(diff)>0.08)scrollY+=diff*ease;
  else scrollY=scrollTargetY;

  scrollY=clamp(scrollY,0,maxScroll);
  G.__scrollY=scrollY;
  fastScrolling=true;
  render();

  if(touching||Math.abs(scrollTargetY-scrollY)>0.35){
    scrollFrameId=requestDisplayFrame(smoothScrollFrame);
  }else{
    finishSmoothScroll();
  }
}
function ensureSmoothScroll(){
  if(scrollFrameRunning)return;
  scrollFrameRunning=true;
  scrollFrameId=requestDisplayFrame(smoothScrollFrame);
}

wxapi.onTouchStart(function(ev){
  var t=ev.touches&&ev.touches[0];if(!t)return;
  touchStart={x:t.clientX,y:t.clientY};
  touchLastY=t.clientY;
  touchMoved=false;
  lastTouchTime=Date.now();
  scrollTargetY=scrollY;
  scrollVelocity=0;
});
wxapi.onTouchMove(function(ev){
  var t=ev.touches&&ev.touches[0];if(!t||!touchStart)return;
  var now=Date.now();
  var dy=t.clientY-touchLastY;
  var dt=Math.max(8,Math.min(50,now-lastTouchTime||16));
  touchLastY=t.clientY;
  lastTouchTime=now;
  if(Math.abs(t.clientY-touchStart.y)>5)touchMoved=true;

  var modal=!E.admissionOverlay.hidden||!E.supplyOverlay.hidden||!E.crisisOverlay.hidden||!E.endingBlessingOverlay.hidden;
  if(!modal&&maxScroll>0){
    var delta=-dy;
    scrollTargetY=clamp(scrollTargetY+delta,0,maxScroll);
    var instantaneous=delta/dt;
    scrollVelocity=scrollVelocity*.68+instantaneous*.32;
    fastScrolling=true;
    ensureSmoothScroll();
  }
});
wxapi.onTouchEnd(function(ev){
  if(!touchStart)return;
  var t=ev.changedTouches&&ev.changedTouches[0],x=t?t.clientX:touchStart.x,y=t?t.clientY:touchStart.y;
  var wasMoved=touchMoved;
  if(!wasMoved){
    var h=hitAt(x,y);
    if(h){
      try{if(h.action)h.action();else if(h.node)h.node.click();}catch(e){if(console&&console.error)console.error(e);}
    }
  }
  touchStart=null;

  if(wasMoved&&maxScroll>0){
    /* 浏览器式惯性：速度来自最后几次 touchmove，但最终位置仍限制在页面范围内。 */
    var projected=scrollVelocity*170;
    projected=clamp(projected,-H*.72,H*.72);
    scrollTargetY=clamp(scrollTargetY+projected,0,maxScroll);
    fastScrolling=true;
    ensureSmoothScroll();
  }else if(fastScrolling){
    finishSmoothScroll();
  }
});

module.exports={render:render,canvas:canvas};
render();
