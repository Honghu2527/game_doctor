"use strict";

var G = GameGlobal;
var wxapi = wx;
var elements = Object.create(null);
var allNodes = [];
var renderQueued = false;

function scheduleRender(){
  if(renderQueued)return;
  renderQueued=true;
  setTimeout(function(){
    renderQueued=false;
    if(typeof G.__MINI_RENDER__==="function")G.__MINI_RENDER__();
  },0);
}

function ClassList(owner){
  this.owner=owner;
  this.set={};
}
ClassList.prototype._fromString=function(s){
  this.set={};
  String(s||"").split(/\s+/).filter(Boolean).forEach(function(x){this.set[x]=true;},this);
};
ClassList.prototype.toString=function(){return Object.keys(this.set).filter(function(k){return this.set[k];},this).join(" ");};
ClassList.prototype.add=function(){
  for(var i=0;i<arguments.length;i++)this.set[arguments[i]]=true;
  scheduleRender();
};
ClassList.prototype.remove=function(){
  for(var i=0;i<arguments.length;i++)delete this.set[arguments[i]];
  scheduleRender();
};
ClassList.prototype.contains=function(k){return !!this.set[k];};
ClassList.prototype.toggle=function(k,force){
  if(force===undefined)force=!this.contains(k);
  if(force)this.set[k]=true;else delete this.set[k];
  scheduleRender();
  return !!force;
};

function makeStyle(){
  if(typeof Proxy!=="undefined"){
    return new Proxy({},{
      set:function(obj,key,val){obj[key]=val;scheduleRender();return true;}
    });
  }
  return {};
}

function VirtualElement(tag,id){
  this.tagName=(tag||"div").toUpperCase();
  this.id=id||"";
  this.attributes={};
  this.dataset={};
  this.children=[];
  this.parentElement=null;
  this.listeners={};
  this.classList=new ClassList(this);
  this.style=makeStyle();
  this._text="";
  this._html="";
  this._hidden=false;
  this._value="";
  this._disabled=false;
  this.rawHTML="";
  allNodes.push(this);
  if(id)elements[id]=this;
}
Object.defineProperty(VirtualElement.prototype,"className",{
  get:function(){return this.classList.toString();},
  set:function(v){this.classList._fromString(v);scheduleRender();}
});
Object.defineProperty(VirtualElement.prototype,"textContent",{
  get:function(){return this._text;},
  set:function(v){this._text=String(v==null?"":v);scheduleRender();}
});
Object.defineProperty(VirtualElement.prototype,"innerHTML",{
  get:function(){return this._html;},
  set:function(v){
    this._html=String(v==null?"":v);
    this.rawHTML=this._html;
    this.children=[];
    parseDynamicChildren(this);
    scheduleRender();
  }
});
Object.defineProperty(VirtualElement.prototype,"hidden",{
  get:function(){return this._hidden;},
  set:function(v){this._hidden=!!v;scheduleRender();}
});
Object.defineProperty(VirtualElement.prototype,"value",{
  get:function(){return this._value;},
  set:function(v){this._value=String(v==null?"":v);scheduleRender();}
});
Object.defineProperty(VirtualElement.prototype,"disabled",{
  get:function(){return this._disabled;},
  set:function(v){this._disabled=!!v;scheduleRender();}
});

VirtualElement.prototype.setAttribute=function(k,v){
  v=String(v);
  this.attributes[k]=v;
  if(k==="id"){this.id=v;elements[v]=this;}
  if(k==="class")this.className=v;
  if(k.indexOf("data-")===0){
    var key=k.slice(5).replace(/-([a-z])/g,function(_,c){return c.toUpperCase();});
    this.dataset[key]=v;
  }
  scheduleRender();
};
VirtualElement.prototype.getAttribute=function(k){
  if(k==="id")return this.id;
  if(k==="class")return this.className;
  if(k.indexOf("data-")===0){
    var key=k.slice(5).replace(/-([a-z])/g,function(_,c){return c.toUpperCase();});
    return this.dataset[key]!==undefined?this.dataset[key]:null;
  }
  return this.attributes[k]!==undefined?this.attributes[k]:null;
};
VirtualElement.prototype.appendChild=function(child){
  child.parentElement=this;
  this.children.push(child);
  scheduleRender();
  return child;
};
VirtualElement.prototype.addEventListener=function(type,fn){
  (this.listeners[type]||(this.listeners[type]=[])).push(fn);
};
VirtualElement.prototype.removeEventListener=function(type,fn){
  var a=this.listeners[type]||[],i=a.indexOf(fn);if(i>=0)a.splice(i,1);
};
VirtualElement.prototype.dispatchEvent=function(evt){
  if(typeof evt==="string")evt={type:evt};
  evt=evt||{};
  evt.type=evt.type||"click";
  evt.target=evt.target||this;
  evt.currentTarget=this;
  evt.preventDefault=evt.preventDefault||function(){};
  var list=(this.listeners[evt.type]||[]).slice();
  for(var i=0;i<list.length;i++){
    try{list[i].call(this,evt);}catch(e){if(console&&console.error)console.error(e);}
  }
  scheduleRender();
  return true;
};
VirtualElement.prototype.click=function(){
  if(this.disabled)return;
  return this.dispatchEvent({type:"click",target:this});
};
VirtualElement.prototype.focus=function(){
  if(typeof G.__MINI_FOCUS__==="function")G.__MINI_FOCUS__(this);
};
VirtualElement.prototype.blur=function(){
  try{if(wxapi.hideKeyboard)wxapi.hideKeyboard();}catch(e){}
};
VirtualElement.prototype.scrollIntoView=function(){
  if(typeof G.__MINI_SCROLL_TO__==="function")G.__MINI_SCROLL_TO__(999999);
};
VirtualElement.prototype.getBoundingClientRect=function(){
  return {top:0,left:0,width:0,height:0,right:0,bottom:0};
};
VirtualElement.prototype.matches=function(sel){
  return matchesNode(this,sel);
};
VirtualElement.prototype.closest=function(sel){
  var n=this;
  while(n){if(matchesNode(n,sel))return n;n=n.parentElement;}
  return null;
};
VirtualElement.prototype.querySelector=function(sel){
  var stack=this.children.slice();
  while(stack.length){
    var n=stack.shift();
    if(matchesNode(n,sel))return n;
    stack=stack.concat(n.children||[]);
  }
  return null;
};

function matchesNode(n,sel){
  if(!n)return false;
  if(sel.charAt(0)==="#")return n.id===sel.slice(1);
  if(sel.charAt(0)===".")return n.classList.contains(sel.slice(1));
  var m=sel.match(/^\[([^=\]]+)(?:=["']?([^"'\]]+)["']?)?\]$/);
  if(m){
    var val=n.getAttribute(m[1]);
    return m[2]===undefined?val!==null:String(val)===m[2];
  }
  return n.tagName.toLowerCase()===sel.toLowerCase();
}

function attrsFromString(node,s){
  var re=/([:\w-]+)(?:="([^"]*)")?/g,m;
  while((m=re.exec(s))){
    var k=m[1],v=m[2]===undefined?"":m[2];
    if(k==="class")node.className=v;
    else if(k==="disabled")node.disabled=true;
    else node.setAttribute(k,v);
  }
}

function parseButtons(html,parent,filterClass){
  var out=[],re=/<button\b([^>]*)>([\s\S]*?)<\/button>/gi,m;
  while((m=re.exec(html))){
    var n=new VirtualElement("button");
    attrsFromString(n,m[1]);
    n.rawHTML=m[2];
    n._html=m[2];
    n.parentElement=parent;
    if(!filterClass||n.classList.contains(filterClass))out.push(n);
  }
  return out;
}
function parseDynamicChildren(parent){
  var h=parent._html||"";
  if(parent.id==="schoolGrid"){
    parent.children=parseButtons(h,parent,"school-card");
  }else if(parent.id==="inventoryItems"){
    parent.children=parseButtons(h,parent,"inventory-chip");
  }else if(parent.id==="supplyOptions"){
    parent.children=parseButtons(h,parent,"supply-option");
  }else if(parent.id==="messageWall"){
    parent.children=parseButtons(h,parent,null);
  }else if(parent.id==="scoreResult" && /id="goSchoolBtn"/.test(h)){
    var g=elements.goSchoolBtn||new VirtualElement("button","goSchoolBtn");
    g.parentElement=parent;
    parent.children=[g];
  }
}

function create(id,tag,cls,hidden){
  var n=new VirtualElement(tag||"div",id);
  if(cls)n.className=cls;
  if(hidden)n._hidden=true;
  return n;
}

var ids = [
"startScreen","gaokaoScreen","schoolScreen","letterScreen","gameScreen","endingScreen",
"continueBtn","restartBtn","journeyCurrent","journeyNext","journeySteps",
"playerName","birthHometown","birthOnlyChild","birthEconomy","birthEducation","birthMedical","birthPreview",
"difficultyGrid","startBtn","rollBtn","stopBtn","scoreDisplay","scoreResult","scoreEligibility","goSchoolBtn",
"schoolScore","bandCard","schoolSearch","schoolResultCount","schoolGrid",
"letterSchool","letterSchoolInline","letterName","letterScore","letterProgram","letterProgramInline","letterLevel","letterDuration",
"birthSummaryCard","schoolEffectSummary","profileName","profileDesc","profileTags","talentGrid","enterUniversityBtn",
"metaSchool","metaScore","metaDifficulty","metaProfile","metaRoute","metaSpecialty","metaEmployer","metaBackground","educationTimeline",
"statKnowledge","statEnergy","statMental","statMoney","statResearch","statReputation","statEnglish",
"meterKnowledge","meterEnergy","meterMental","meterMoney","meterResearch","meterReputation","meterEnglish",
"reviveShareBanner","reviveShareText","reviveShareBtn",
"inventoryLockNote","inventoryItems","openSupplyBtn",
"stageChip","typeChip","yearText","progressBar","criticalBanner","criticalTitle","criticalText","opportunityBanner","opportunityText",
"sceneTitle","sceneText","effectHint","decisionHintPanel","decisionHintContent","choices",
"toggleLogBtn","lifeLog",
"endingTitle","endingText","endingStatusHeadline","endingStatusMeta","endingResearchSummary","endingStats","endingTags","endingJourney",
"boardModeLabel","legacyMessage","messageCount","postMessageBtn","messageFeedback","messageTickerTrack","viewAllMessagesBtn","allMessagesPanel","allMessageCount","closeAllMessagesBtn","messageWall",
"endingShareBtn","endingRestartBtn",
"endingBlessingOverlay","endingBlessingText","blessingMessageBtn","blessingCloseBtn",
"admissionOverlay","admissionSearching","admissionResult","admissionQuerySchool","admissionCountdown","admissionQueryBar","admissionResultIcon","admissionResultTitle","admissionResultText","admissionResultMeta","admissionResultBtn",
"supplyOverlay","supplyOptions","closeSupplyBtn",
"crisisOverlay","crisisIcon","crisisTitle","crisisText","crisisUseBtn","crisisAdBtn","crisisContinueBtn"
];
ids.forEach(function(id){create(id);});

// Initial HTML state.
elements.startScreen._hidden=false;
["gaokaoScreen","schoolScreen","letterScreen","gameScreen","endingScreen",
"continueBtn","restartBtn","scoreResult","scoreEligibility","reviveShareBanner","criticalBanner","opportunityBanner",
"decisionHintPanel","allMessagesPanel","messageFeedback","endingBlessingOverlay","admissionOverlay","admissionResult",
"supplyOverlay","crisisOverlay"].forEach(function(id){elements[id]._hidden=true;});
elements.playerName._value="小张";
elements.legacyMessage._value="";
elements.schoolSearch._value="";
elements.stopBtn._disabled=true;

var storyPanel=create("","section","panel story-panel",false);
var legacyBoard=create("","section","legacy-board",false);

var levelButtons=["all","本科","专科"].map(function(level){
  var b=new VirtualElement("button");
  b.className="filter-btn"+(level==="all"?" active":"");
  b.setAttribute("data-level",level);
  return b;
});
var boardSortButtons=["newest","liked"].map(function(sort){
  var b=new VirtualElement("button");
  b.className="filter-btn"+(sort==="newest"?" active":"");
  b.setAttribute("data-board-sort",sort);
  return b;
});

var body=new VirtualElement("body","__body__");

var documentObj={
  body:body,
  getElementById:function(id){return elements[id]||null;},
  createElement:function(tag){return new VirtualElement(tag);},
  querySelector:function(sel){
    if(sel===".story-panel")return storyPanel;
    if(sel===".legacy-board")return legacyBoard;
    for(var i=0;i<allNodes.length;i++)if(matchesNode(allNodes[i],sel))return allNodes[i];
    return null;
  },
  querySelectorAll:function(sel){
    if(sel===".school-card")return (elements.schoolGrid.children||[]).filter(function(n){return n.classList.contains("school-card");});
    if(sel==="[data-level]")return levelButtons;
    if(sel==="[data-board-sort]")return boardSortButtons;
    return allNodes.filter(function(n){return matchesNode(n,sel);});
  }
};

var localStorageObj={
  getItem:function(k){try{var v=wxapi.getStorageSync(k);return v===undefined||v===null||v===""?null:String(v);}catch(e){return null;}},
  setItem:function(k,v){try{wxapi.setStorageSync(k,String(v));}catch(e){}},
  removeItem:function(k){try{wxapi.removeStorageSync(k);}catch(e){}},
  clear:function(){try{wxapi.clearStorageSync();}catch(e){}}
};

G.document=documentObj;
G.localStorage=localStorageObj;
G.window=G;
G.navigator=G.navigator||{};
G.location=G.location||{href:""};
G.__scrollY=0;
try{
  Object.defineProperty(G,"scrollY",{configurable:true,get:function(){return G.__scrollY||0;}});
}catch(e){G.scrollY=0;}
G.scrollTo=function(arg){
  var top=typeof arg==="number"?arg:(arg&&arg.top)||0;
  G.__scrollY=Math.max(0,Number(top)||0);
  if(typeof G.__MINI_SCROLL_TO__==="function")G.__MINI_SCROLL_TO__(G.__scrollY);
};
G.requestAnimationFrame=function(fn){return setTimeout(function(){fn(Date.now());},16);};
G.cancelAnimationFrame=function(id){clearTimeout(id);};
G.addEventListener=G.addEventListener||function(){};
G.removeEventListener=G.removeEventListener||function(){};

G.__VDOM__={
  elements:elements,
  nodes:allNodes,
  body:body,
  storyPanel:storyPanel,
  legacyBoard:legacyBoard,
  levelButtons:levelButtons,
  boardSortButtons:boardSortButtons,
  scheduleRender:scheduleRender,
  VirtualElement:VirtualElement
};

module.exports=G.__VDOM__;
