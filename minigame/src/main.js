"use strict";

var config = require("./config.js");
var G = GameGlobal;
var wxapi = wx;

var info = wxapi.getWindowInfo ? wxapi.getWindowInfo() : wxapi.getSystemInfoSync();
var W = info.windowWidth || 375;
var H = info.windowHeight || 667;
var DPR = info.pixelRatio || 1;
var canvas = wxapi.createCanvas();
var ctx = canvas.getContext("2d");
canvas.width = Math.round(W * DPR);
canvas.height = Math.round(H * DPR);
ctx.scale(DPR, DPR);

var DATA = G.GAME_DATA;
var BG = G.BACKGROUND_DATA;
var SCHOOLS = G.SCHOOL_DATA;
var SYS = G.SCHOOL_SYSTEM;
var CAREER = G.CAREER_DATA;
var COLLEGE = G.COLLEGE_DATA;
var SPECIALTY = G.SPECIALTY_DATA;
var EDU = G.EDUCATION_DATA;
var LANG = G.LANGUAGE_DATA;
var JOB = G.JOB_DATA;
var OPP = G.OPPORTUNITY_DATA;

var SAVE_KEY = "medical-life-minigame-v1";
var statKeys = ["knowledge","energy","mental","money","research","reputation","english"];
var statNames = {knowledge:"知识",energy:"体力",mental:"心理",money:"金钱",research:"科研",reputation:"声望",english:"英语"};
var talentNames = {memory:"记忆",resilience:"抗压",communication:"沟通",dexterity:"操作",researchSense:"科研直觉",english:"英语"};

var screen = "home";
var state = null;
var birth = {
  difficulty:"normal",
  hometown:"city",
  onlyChild:"yes",
  economy:"ordinary",
  education:"college",
  medicalFamily:"none"
};
var rollingScore = null;
var uiButtons = [];
var scrollY = 0;
var maxScroll = 0;
var touchStart = null;
var touchLastY = 0;
var touchMoved = false;
var pendingFatal = null;
var notice = "";
var noticeTimer = null;
var rewardedAd = null;
var pendingAdCallback = null;

function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
function rand(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
function hasFlag(f){ return !!(state && state.flags && state.flags.indexOf(f)>=0); }
function addFlag(f){ if(state && state.flags.indexOf(f)<0) state.flags.push(f); }
function addFlags(list){ (list||[]).forEach(addFlag); }
function currentSchool(){ return state ? SCHOOLS.schools.find(function(s){return s.id===state.schoolId;}) : null; }
function profileId(s){ return (s&&s.profileId) || (SYS.schoolProfiles&&SYS.schoolProfiles[s.id]) || "growth"; }
function currentProfile(){ var s=currentSchool(); return (SYS.profiles&&SYS.profiles[profileId(s)]) || SYS.profiles.growth || {pressure:1,competition:3,eventPool:[]}; }
function currentSpec(){ return state&&state.specialtyId&&SPECIALTY ? SPECIALTY.specialties[state.specialtyId] : null; }

function toast(msg){
  notice = msg || "";
  if(noticeTimer) clearTimeout(noticeTimer);
  noticeTimer = setTimeout(function(){ notice=""; draw(); }, 2400);
  draw();
}

function save(){
  if(!state) return;
  try{ wxapi.setStorageSync(SAVE_KEY, JSON.stringify(state)); }catch(e){}
}
function load(){
  try{
    var raw=wxapi.getStorageSync(SAVE_KEY);
    if(raw){ state=typeof raw==="string"?JSON.parse(raw):raw; return !!state; }
  }catch(e){}
  return false;
}
function clearSave(){ try{wxapi.removeStorageSync(SAVE_KEY);}catch(e){} }

function compileBackground(){
  var parts=[
    BG.hometowns[birth.hometown],
    BG.onlyChild[birth.onlyChild],
    BG.economy[birth.economy],
    BG.education[birth.education],
    BG.medicalFamily[birth.medicalFamily]
  ];
  var mods={}, shift=0;
  parts.forEach(function(p){
    Object.keys(p.mods||{}).forEach(function(k){ mods[k]=(mods[k]||0)+p.mods[k]; });
    shift += p.scoreShift||0;
  });
  return {mods:mods,scoreShift:clamp(shift,-14,14),labels:parts.map(function(p){return p.name;})};
}
function broadScore(){
  var r=Math.random(),min,max;
  if(r<.08){min=280;max=379;}
  else if(r<.18){min=380;max=449;}
  else if(r<.32){min=450;max=529;}
  else if(r<.58){min=530;max=599;}
  else if(r<.83){min=600;max=669;}
  else if(r<.96){min=670;max=719;}
  else{min=720;max=745;}
  var bg=compileBackground();
  var tri=(Math.random()+Math.random())/2;
  return Math.round(clamp(min+Math.round((max-min)*tri)+bg.scoreShift,280,745));
}
function allowedLevels(score){ return score>=530?["本科"]:(score>=450?["本科","专科"]:["专科"]); }
function eligibleSchools(score){
  var allowed=allowedLevels(score);
  return SCHOOLS.schools.filter(function(s){
    return score>=s.minScore && allowed.indexOf(s.educationLevel||"本科")>=0;
  }).sort(function(a,b){
    if((a.educationLevel||"本科")!==(b.educationLevel||"本科")) return (a.educationLevel||"本科")==="本科"?-1:1;
    return b.minScore-a.minScore;
  });
}
function generateTalents(score,school,profile){
  var academic=45+(score-530)/8.8;
  var selectivity=((school.level||3)-3)*1.5;
  var p=profile||{};
  var t={
    memory:academic+selectivity+rand(-9,9),
    resilience:50+rand(-12,12)-((p.competition||3)-3),
    communication:50+rand(-14,14),
    dexterity:48+(p.clinicalAccess||3)*2+rand(-12,12),
    researchSense:43+(p.opportunity||3)*2.2+(school.research||2)*1.3+rand(-10,10),
    english:academic-2+(p.global||2)*1.7+rand(-10,10)
  };
  Object.keys(t).forEach(function(k){t[k]=clamp(Math.round(t[k]),28,88);});
  return t;
}
function directApply(stats,effects){
  Object.keys(effects||{}).forEach(function(k){
    if(statKeys.indexOf(k)>=0) stats[k]=(stats[k]||0)+effects[k];
  });
  statKeys.forEach(function(k){ stats[k]=clamp(Math.round(stats[k]||0),0,100); });
}

function startWithSchool(id){
  var school=SCHOOLS.schools.find(function(s){return s.id===id;});
  if(!school) return;
  var difficulty=DATA.difficulties[birth.difficulty];
  var prof=(SYS.profiles&&SYS.profiles[profileId(school)])||SYS.profiles.growth||{};
  var stats=Object.assign({},difficulty.start);
  var bg=compileBackground();
  directApply(stats,bg.mods);
  directApply(stats,school.mods||{});
  var talents=generateTalents(rollingScore,school,prof);
  stats.english=talents.english;

  state={
    version:1,
    name:"医学生",
    difficulty:birth.difficulty,
    score:rollingScore,
    schoolId:school.id,
    profileId:profileId(school),
    background:bg.labels,
    talents:talents,
    stats:stats,
    flags:[],
    scene:"__SIGNATURE__",
    pendingNext:(school.educationLevel==="专科"&&COLLEGE)?COLLEGE.entry:((CAREER.entryByProfile&&CAREER.entryByProfile[profileId(school)])||"fresh_growth"),
    pendingNextAfterSide:null,
    visitedSide:[],
    applications:{},
    activeOpportunity:null,
    eduApplication:null,
    jobApplication:null,
    job:null,
    jobFailures:0,
    specialtyId:null,
    specialtyReturnNext:null,
    educationHistory:{
      college:school.educationLevel==="专科"?{schoolId:school.id,schoolName:school.name,level:"专科",major:school.program||"医学相关专业"}:null,
      undergrad:school.educationLevel==="专科"?null:{schoolId:school.id,schoolName:school.name,level:"本科",major:school.program||"临床医学"},
      master:null,phd:null,overseas:[]
    },
    researchJob:null,
    reviveCount:0,
    finished:false,
    log:[]
  };
  addFlag("schoolLevel"+(school.level||2));
  addFlag("profile_"+profileId(school));
  if(state.score>=710)addFlag("gaokaoTop");
  if(state.score<575)addFlag("underdogStart");
  screen="game"; scrollY=0; save(); draw();
}

function metricValue(k){
  if(!state)return 0;
  if(state.stats && state.stats[k]!==undefined)return Number(state.stats[k]||0);
  if(state.talents && state.talents[k]!==undefined)return Number(state.talents[k]||0);
  return 0;
}
function applyTalentEffects(e){
  Object.keys(e||{}).forEach(function(k){
    state.talents[k]=clamp(Math.round((state.talents[k]||50)+e[k]),20,95);
    if(k==="english") state.stats.english=state.talents.english;
  });
}
function stageLoadMultiplier(stat,raw){
  if(raw>=0)return 1;
  var e=currentEvent()||{}, label=(e.stage||"")+" "+(e.title||"");
  var m=1;
  if(/医学专科|本科|大一|白大褂|见习|实训/.test(label))m=.56;
  else if(/本科衔接|专升本/.test(label))m=.62;
  else if(/研究生|硕士|临床专硕|学硕/.test(label))m=.72;
  else if(/博士后|科研职业|博士/.test(label))m=.78;
  else if(/规培|住院医师/.test(label))m=1;
  else if(/主治|高级职称|职业成熟|青年医生/.test(label))m=.82;
  if(/夜班|凌晨|急诊|抢救|连续值班/.test(label))m*=1.14;
  if(/考试|考研|专升本|复试|面试|竞争/.test(label))m*=.88;
  var a=Math.abs(raw);
  if(stat==="energy"){
    if(a<=2)return 0;
    if(a<=4)m*=.55; else if(a<=7)m*=.76;
  }else if(stat==="mental"){
    if(a<=1)return 0;
    if(a<=3)m*=.66; else if(a<=6)m*=.84;
  }
  return m;
}
function applyEffects(effects){
  var diff=(DATA.difficulties[state.difficulty]||DATA.difficulties.normal).negativeScale||1;
  Object.keys(effects||{}).forEach(function(k){
    if(statKeys.indexOf(k)<0)return;
    var v=effects[k], d=v;
    if(v<0){
      if(k==="energy"||k==="mental"){
        var m=stageLoadMultiplier(k,v);
        d=m===0?0:Math.round(v*diff*m);
        if(d===0&&Math.abs(v)>=3)d=-1;
      }else d=Math.round(v*diff);
    }
    state.stats[k]=clamp(Math.round((state.stats[k]||0)+d),0,100);
  });
}
function resolveChance(ch){
  if(!ch)return null;
  var p=ch.p||.5;
  if(ch.bonusBy&&ch.bonusBy.length){
    var avg=ch.bonusBy.reduce(function(s,k){return s+metricValue(k);},0)/ch.bonusBy.length;
    p+=(avg-50)/220;
  }
  p=clamp(p,.08,.92);
  var ok=Math.random()<p;
  applyEffects(ok?ch.success:ch.fail);
  addFlags(ok?(ch.successFlags||[]):(ch.failFlags||[]));
  toast(ok?"这一次结果不错。":"这一次没有如愿。");
  return ok;
}

function requirementMet(req){
  if(!req)return {ok:true,reason:""};
  var reasons=[];
  if(req.stats)Object.keys(req.stats).forEach(function(k){if(metricValue(k)<req.stats[k])reasons.push((statNames[k]||k)+"≥"+req.stats[k]);});
  if(req.talents)Object.keys(req.talents).forEach(function(k){if(metricValue(k)<req.talents[k])reasons.push((talentNames[k]||k)+"≥"+req.talents[k]);});
  if(req.flags)(req.flags||[]).forEach(function(f){if(!hasFlag(f))reasons.push("需要前置经历");});
  if(req.schoolLevel && ((currentSchool()&&currentSchool().level)||0)<req.schoolLevel)reasons.push("院校等级不足");
  return {ok:reasons.length===0,reason:reasons.join("、")};
}
function visibleChoice(c){
  if(c.showIfFlags && !c.showIfFlags.every(hasFlag))return false;
  if(c.hideIfFlags && c.hideIfFlags.some(hasFlag))return false;
  return true;
}

function signatureOptions(kind){
  if(kind==="college_skill")return [
    {text:"报名高强度技能实训",sub:"动手能力提升更快。",effects:{knowledge:4,energy:-4},talentEffects:{dexterity:3},next:"__RETURN__"},
    {text:"把时间留给专升本准备",sub:"理论和英语优先。",effects:{knowledge:5,mental:-1},talentEffects:{english:1},next:"__RETURN__"}
  ];
  if(kind==="college_clinic"||kind==="clinical_ground"||kind==="clinical_round")return [
    {text:"争取更早进临床实践",sub:"病例和沟通经验提前积累。",effects:{knowledge:5,reputation:4,energy:-3},talentEffects:{communication:2,dexterity:1},next:"__RETURN__"},
    {text:"先把基础课打牢",sub:"等自己准备更充分。",effects:{knowledge:6,mental:2},next:"__RETURN__"}
  ];
  if(kind==="college_service"||kind==="regional_service")return [
    {text:"参加基层医疗实践",sub:"从真实医疗需求中学习。",effects:{knowledge:4,reputation:5,energy:-2},talentEffects:{communication:2,resilience:1},next:"__RETURN__"},
    {text:"优先准备学历提升",sub:"先争取下一张入场券。",effects:{knowledge:5,mental:1},next:"__RETURN__"}
  ];
  if(kind==="cross_ai"||kind==="innovation_eye")return [
    {text:"抓住交叉机会",sub:"进入医学与技术交叉赛道。",effects:{research:7,knowledge:4,energy:-5},talentEffects:{researchSense:2,english:1},next:"__RETURN__"},
    {text:"先把医学基础打牢",sub:"暂时保持原节奏。",effects:{knowledge:6,mental:2},next:"__RETURN__"}
  ];
  return [
    {text:"抓住这个机会",sub:"学校生态会把你推向新的方向。",effects:{knowledge:4,research:4,reputation:3,energy:-4},next:"__RETURN__"},
    {text:"保持自己的节奏",sub:"不是所有机会都必须抓。",effects:{mental:5,knowledge:3},next:"__RETURN__"}
  ];
}
function signatureEvent(){
  var s=currentSchool(); if(!s)return null;
  var sig=(SYS.signatures&&SYS.signatures[s.id]) || (s.signatureKind?{kind:s.signatureKind,title:s.signatureTitle,desc:s.signatureDesc}:null);
  if(!sig)return {stage:"入学第一课",year:"18岁",title:"医学人生正式开始",type:"school",text:"不同的平台有不同节奏，但真正改变人生的仍然是后面的选择。",choices:[{text:"进入医学院",sub:"开始第一学年。",next:"__RETURN__"}]};
  return {stage:"院校专属 · "+s.name,year:s.educationLevel==="专科"?"18-19岁":"18-21岁",title:sig.title||"你的第一项院校机会",type:"school",text:sig.desc||"",choices:signatureOptions(sig.kind)};
}

function specialtySelectionEvent(){
  if(!state||!SPECIALTY||state.scene.indexOf("specialty_select_")!==0)return null;
  var modeId=state.scene.replace("specialty_select_","");
  var mode=SPECIALTY.selectionModes[modeId];
  if(!mode)return null;
  return {stage:mode.stage,year:mode.year,title:mode.title,type:"specialtySelect",warning:mode.warning,text:"不同科室会改变夜班、操作、科研和后续事件。",
    choices:Object.keys(SPECIALTY.specialties).map(function(id){
      var s=SPECIALTY.specialties[id];
      return {text:(s.icon||"")+" "+s.name,sub:s.desc,specialtyId:id,next:mode.next,route:(mode.routePrefix||"科室")+"·"+s.name};
    })
  };
}
function findEduSchool(id){
  var pools=["masterDomestic","masterOverseas","phdDomestic","phdOverseas"];
  for(var i=0;i<pools.length;i++){
    var f=(EDU[pools[i]]||[]).find(function(s){return s.id===id;});
    if(f)return f;
  }
  return null;
}
function eduSchoolChoices(list,next){
  return (list||[]).map(function(s){return {text:s.name,sub:(s.city||s.region||"")+" · 申请难度 "+(s.difficulty||3)+"/5",eduSchoolId:s.id,next:next};});
}
function eduSpecialtyChoices(next){
  return Object.keys(SPECIALTY.specialties).map(function(id){var s=SPECIALTY.specialties[id];return {text:(s.icon||"")+" "+s.name,sub:s.desc,eduSpecialtyId:id,next:next};});
}
function educationEvent(){
  if(!state||!EDU||state.scene.indexOf("edu_")!==0)return null;
  var sc=state.scene,a=state.eduApplication||{};
  if(sc==="edu_master_recommend_type"||sc==="edu_master_exam_type"){
    var source=sc==="edu_master_recommend_type"?"recommend":"exam";
    return {stage:source==="recommend"?"推免申请":"考研申请",year:"23岁",title:"先决定申请哪一种硕士",type:"educationApply",text:"临床专硕与规培并轨；学硕以科研训练为主。",
      choices:[
        {text:"临床医学专业型硕士",sub:"临床训练与研究生培养并轨。",eduStart:{level:"master",source:source},eduMasterType:"clinical_master",effects:{knowledge:2},next:"edu_master_school"},
        {text:"学术型硕士",sub:"科研训练优先。",eduStart:{level:"master",source:source},eduMasterType:"academic_master",effects:{research:2},next:"edu_master_school"},
        {text:"直博 / 长学制科研申请",sub:"推免路线且科研达到要求时开放。",showIfFlags:["recommendApplicant"],requires:{stats:{research:35}},flags:["directPhdCandidate"],effects:{research:3,energy:-2},next:"edu_phd_direct_school"}
      ]};
  }
  if(sc==="edu_master_school")return {stage:"硕士申请 1/5",year:"23岁",title:"选择目标硕士院校",type:"educationSchool",text:"学校越难，录取概率越低。",choices:eduSchoolChoices(EDU.masterDomestic,"edu_master_specialty")};
  if(sc==="edu_master_specialty")return {stage:"硕士申请 2/5",year:"23岁",title:"选择报考专业 / 科室",type:"educationApply",text:"专业会影响后续训练事件。",choices:eduSpecialtyChoices("edu_master_prepare")};
  if(sc==="edu_master_prepare"){
    var rec=a.source==="recommend";
    return {stage:"硕士申请 3/5",year:"23岁",title:rec?"推免材料最后怎么准备？":"备考进入最后阶段",type:"educationApply",text:"在有限时间里分配精力。",
      choices:[
        {text:rec?"集中打磨科研与个人陈述":"全力冲刺",sub:"准备增益最高，消耗最大。",effects:{knowledge:rec?2:7,research:rec?5:1,energy:-6,mental:-3},eduPrepAdd:22,next:"edu_master_interview"},
        {text:"保持平衡",sub:"稳健准备。",effects:{knowledge:4,reputation:3,energy:-4},eduPrepAdd:15,next:"edu_master_interview"},
        {text:"保住状态抓高频",sub:"消耗较低。",effects:{knowledge:3,reputation:2,mental:2},eduPrepAdd:9,next:"edu_master_interview"}]};
  }
  if(sc==="edu_master_interview")return {stage:"硕士申请 4/5",year:"23岁",title:"复试 / 面试",type:"educationApply",text:"目标学校、专业、准备和表达共同影响结果。",
    choices:[
      {text:"结构化回答临床兴趣与规划",sub:"知识与沟通更重要。",effects:{mental:-2,reputation:2},talentEffects:{communication:1},eduPrepAdd:10,next:"edu_master_result"},
      {text:"重点讲科研经历",sub:"科研履历更占优势。",effects:{mental:-2,research:2},talentEffects:{researchSense:1},eduPrepAdd:10,next:"edu_master_result"},
      {text:"诚实说明不足与补齐计划",sub:"抗压与表达更重要。",effects:{mental:-1},talentEffects:{resilience:1,communication:1},eduPrepAdd:7,next:"edu_master_result"}]};
  if(sc==="edu_master_result")return {stage:"硕士申请 5/5",year:"23岁",title:"招生系统开放了",type:"educationResult",text:"前面的选择已经锁定。",choices:[{text:"查询硕士录取结果",sub:"结果由履历、准备和随机性共同决定。",admissionQuery:"master"}]};

  if(sc==="edu_master_overseas_school"){
    if(!state.eduApplication||state.eduApplication.level!=="overseas_master")state.eduApplication={level:"overseas_master",source:"overseas",prep:0};
    return {stage:"海外申请 1/5",year:"23岁",title:"选择海外院校",type:"educationSchool",text:"这里是游戏化研究型升学池。",choices:eduSchoolChoices(EDU.masterOverseas,"edu_master_overseas_specialty")};
  }
  if(sc==="edu_master_overseas_specialty")return {stage:"海外申请 2/5",year:"23岁",title:"选择医学方向",type:"educationApply",text:"方向会写入教育档案。",choices:eduSpecialtyChoices("edu_master_overseas_direction")};
  if(sc==="edu_master_overseas_direction")return {stage:"海外申请 3/5",year:"23岁",title:"选择研究方向",type:"educationApply",text:"研究匹配度、英语和既往经历都重要.",choices:(EDU.researchDirections||[]).map(function(d){return {text:d.name,sub:d.desc,eduDirectionId:d.id,effects:{research:2},next:"edu_master_overseas_prepare"};})};
  if(sc==="edu_master_overseas_prepare")return {stage:"海外申请 4/5",year:"23岁",title:"材料与面试",type:"educationApply",text:"CV、推荐信和个人陈述都需要取舍.",
    choices:[
      {text:"强化研究匹配",sub:"科研优先。",effects:{research:4,energy:-5},eduPrepAdd:20,next:"edu_master_overseas_result"},
      {text:"强化英语与面试",sub:"表达优先。",effects:{energy:-4},talentEffects:{english:2,communication:2},eduPrepAdd:18,next:"edu_master_overseas_result"},
      {text:"平衡准备",sub:"减少经济与时间消耗。",effects:{money:-2,mental:2},eduPrepAdd:11,next:"edu_master_overseas_result"}]};
  if(sc==="edu_master_overseas_result")return {stage:"海外申请 5/5",year:"23岁",title:"Offer 查询",type:"educationResult",text:"目标院校已经完成评审。",choices:[{text:"查询海外项目结果",sub:"查看最终结果。",admissionQuery:"overseas_master"}]};

  if(sc==="edu_phd_domestic_school"||sc==="edu_phd_overseas_school"||sc==="edu_phd_direct_school"){
    var sourcePhd=sc==="edu_phd_overseas_school"?"overseas":(sc==="edu_phd_direct_school"?"direct":"domestic");
    if(!state.eduApplication||state.eduApplication.level!=="phd"||state.eduApplication.source!==sourcePhd)state.eduApplication={level:"phd",source:sourcePhd,prep:0};
    return {stage:"博士申请 1/6",year:"博士申请阶段",title:"选择博士目标院校",type:"educationSchool",text:"院校难度、科研积累、方向匹配都会影响结果。",choices:eduSchoolChoices(sourcePhd==="overseas"?EDU.phdOverseas:EDU.phdDomestic,"edu_phd_specialty")};
  }
  if(sc==="edu_phd_specialty")return {stage:"博士申请 2/6",year:"博士申请阶段",title:"选择医学学科",type:"educationApply",text:"可沿用硕士方向，也可改变学科。",choices:eduSpecialtyChoices("edu_phd_direction")};
  if(sc==="edu_phd_direction")return {stage:"博士申请 3/6",year:"博士申请阶段",title:"选择研究方向",type:"educationApply",text:"博士几年将围绕这个问题展开。",choices:(EDU.researchDirections||[]).map(function(d){return {text:d.name,sub:d.desc,eduDirectionId:d.id,effects:{research:3,energy:-1},eduPrepAdd:6,next:"edu_phd_prepare"};})};
  if(sc==="edu_phd_prepare")return {stage:"博士申请 4/6",year:"博士申请阶段",title:"导师与研究计划",type:"educationApply",text:"导师匹配、研究计划和既往成果共同决定是否进入面试。",
    choices:[
      {text:"针对导师重写研究计划",sub:"匹配度最高。",effects:{research:4,energy:-5,mental:-2},eduPrepAdd:22,next:"edu_phd_interview"},
      {text:"突出已有成果与独立性",sub:"已有科研越强越有利。",effects:{research:3,reputation:2,energy:-4},eduPrepAdd:17,next:"edu_phd_interview"},
      {text:"强调临床与转化价值",sub:"知识和沟通更重要。",effects:{knowledge:3,reputation:3,energy:-3},eduPrepAdd:14,next:"edu_phd_interview"}]};
  if(sc==="edu_phd_interview")return {stage:"博士申请 5/6",year:"博士申请阶段",title:"博士面试",type:"educationApply",text:"问题意识、独立性与应对不确定性都在被考察。",
    choices:[
      {text:"解释替代假设和备选方案",sub:"科研直觉优先。",effects:{research:2,mental:-2},talentEffects:{researchSense:2},eduPrepAdd:11,next:"edu_phd_result"},
      {text:"承认风险并缩小问题",sub:"强调可行性与韧性。",effects:{mental:-1},talentEffects:{resilience:2},eduPrepAdd:9,next:"edu_phd_result"},
      {text:"重新拉回临床意义",sub:"适合转化研究。",effects:{knowledge:2,reputation:2},talentEffects:{communication:1},eduPrepAdd:8,next:"edu_phd_result"}]};
  if(sc==="edu_phd_result")return {stage:"博士申请 6/6",year:"博士申请阶段",title:"Decision Available",type:"educationResult",text:"最终结果已经生成。",choices:[{text:"查询博士录取结果",sub:"查看正式结果。",admissionQuery:"phd"}]};
  if(sc==="edu_phd_fail")return {stage:"博士申请 · 未录取",year:"博士申请阶段",title:"这一次没有拿到博士录取",type:"key",text:"失败不会清空已有积累。",
    choices:[
      {text:"换一所学校再申请",sub:"保留科研积累。",effects:{mental:-2,energy:-2},flags:["phdRetry"],next:a.source==="overseas"?"edu_phd_overseas_school":"edu_phd_domestic_school"},
      {text:"停止申博，进入求职",sub:"结束学生身份。",showIfFlags:["clinicalMaster"],effects:{mental:4,money:3},next:"job_choice"},
      {text:"停止申博，学硕毕业后规培",sub:"回到临床路线。",showIfFlags:["academicMaster"],effects:{mental:4,money:2},next:"resident_entry"}]};
  return null;
}
function educationProbability(){
  var a=state.eduApplication||{}, s=a.school||{}, d=s.difficulty||3, p=.68-d*.075;
  if(a.level==="master"){
    p+=(metricValue("knowledge")-50)/250+(metricValue("english")-50)/520+(metricValue("reputation")-50)/650;
    if(a.masterType==="academic_master")p+=(metricValue("research")-50)/380;
    if(a.source==="recommend")p+=.08;
  }else if(a.level==="overseas_master"){
    p=.59-d*.065+(metricValue("english")-50)/250+(metricValue("research")-50)/360+(metricValue("communication")-50)/600;
  }else if(a.level==="phd"){
    p=.57-d*.067+(metricValue("research")-50)/210+(metricValue("researchSense")-50)/330+(metricValue("reputation")-50)/500;
    if(a.source==="overseas")p+=(metricValue("english")-50)/270;
    if(a.source==="direct")p-=.04;
    if(hasFlag("phdRetry"))p+=.04;
  }
  p+=(a.prep||0)/260;
  return clamp(p,.10,.90);
}
function directionName(a){
  var d=(EDU.researchDirections||[]).find(function(x){return x.id===a.directionId;});
  return d?d.name:"";
}
function resolveAdmission(){
  var a=state.eduApplication||{}; if(!a.school){toast("请先选择目标院校");return;}
  var p=educationProbability(), ok=Math.random()<p;
  var specObj=a.specialtyId&&SPECIALTY.specialties[a.specialtyId];
  var spec=specObj?specObj.name:"医学相关方向";
  if(ok){
    if(a.level==="master"){
      state.specialtyId=a.specialtyId; addFlag("masterOffer");
      if(a.source==="recommend")addFlag("recommended");
      if(a.masterType==="clinical_master"){addFlag("clinicalMaster");addFlag("integratedResidency");}
      else addFlag("academicMaster");
      state.educationHistory.master={schoolId:a.school.id,schoolName:a.school.name,type:a.masterType==="clinical_master"?"临床专硕（并轨规培）":"学术型硕士",specialty:spec};
      state.specialtyReturnNext=a.masterType==="clinical_master"?"clinical_master":"academic_master";
      state.scene=specObj?specObj.intro:state.specialtyReturnNext;
    }else if(a.level==="overseas_master"){
      state.specialtyId=a.specialtyId; addFlag("overseasOffer");
      state.educationHistory.master={schoolId:a.school.id,schoolName:a.school.name,type:"海外研究型项目",specialty:spec};
      state.educationHistory.overseas.push({level:"硕士/研究项目",schoolName:a.school.name,detail:spec});
      state.scene="overseas_postgrad";
    }else if(a.level==="phd"){
      state.specialtyId=a.specialtyId;
      if(a.source==="overseas")addFlag("phdOverseas"); else if(a.source==="direct")addFlag("directPhdOffer"); else addFlag("phdDomestic");
      state.educationHistory.phd={schoolId:a.school.id,schoolName:a.school.name,type:a.source==="direct"?"直博":a.source==="overseas"?"海外博士":"国内博士",specialty:spec,direction:directionName(a)};
      state.specialtyReturnNext=a.source==="direct"?"direct_phd":"phd_year1";
      state.scene=specObj?specObj.intro:state.specialtyReturnNext;
    }
    toast("录取成功 · "+a.school.name);
  }else{
    applyEffects({mental:-5});
    if(a.level==="master")state.scene=a.source==="recommend"?"edu_master_exam_type":"exam_fail_choice";
    else if(a.level==="overseas_master")state.scene="edu_master_exam_type";
    else state.scene=a.source==="direct"?"edu_master_exam_type":"edu_phd_fail";
    toast("本轮未录取");
  }
  if(state.scene.indexOf("edu_")!==0)state.eduApplication=null;
  save();scrollY=0;draw();
}

function cityById(id){return JOB.cities.find(function(c){return c.id===id;});}
function hospitalById(id){return JOB.hospitalTemplates.find(function(h){return h.id===id;});}
function educationRank(){var h=state.educationHistory||{};return h.phd?3:(h.master?2:(h.undergrad?1:0));}
function hasResidency(){return hasFlag("residentPassed")||hasFlag("integratedResidencyFinished")||hasFlag("integratedResidency");}
function publicationProxy(){
  var r=metricValue("research");
  return {q1:r>=80?3:(r>=68?2:(r>=56?1:0)),totalIF:Math.max(0,Math.round((r-35)/2))};
}
function jobRequirementCheck(h){
  var reasons=[],p=publicationProxy();
  if(educationRank()<(h.minEducation||1))reasons.push((h.minEducation===3?"博士":h.minEducation===2?"硕士":"本科")+"学历");
  if(h.requireResidency&&!hasResidency())reasons.push("规培结业");
  if(metricValue("research")<(h.minResearch||0))reasons.push("科研≥"+h.minResearch);
  if(p.q1<(h.minQ1||0))reasons.push("Q1成果≥"+h.minQ1);
  if(p.totalIF<(h.minIF||0))reasons.push("累计科研成果不足");
  return {ok:reasons.length===0,reasons:reasons};
}
function jobProbability(){
  var a=state.jobApplication||{},h=a.hospital||hospitalById(a.hospitalId),city=cityById(a.cityId);
  if(!h||!city)return .1;
  var p=h.baseChance||.4;
  p+=(metricValue("knowledge")-50)/100*(h.weightClinical||.25);
  p+=(metricValue("research")-50)/100*(h.weightResearch||.15);
  p+=(metricValue("reputation")-50)/100*(h.weightReputation||.15);
  p+=(metricValue("communication")-50)/350+(a.prep||0)/180;
  p-=Math.max(0,(city.competition||3)-2)*.018;
  return clamp(p,.08,.90);
}
function jobEvent(){
  if(!state||!JOB)return null;
  var sc=state.scene;
  if(["job_choice","job_city_select","job_hospital_select","job_application_prepare","job_interview","job_result","job_offer","job_rejected"].indexOf(sc)<0)return null;
  if(sc==="job_choice"||sc==="job_city_select")return {stage:"求职 1/5",year:"毕业后",title:"第一份正式工作，先决定城市",type:"jobMarket",text:"城市会改变竞争、生活成本和可见岗位。",choices:JOB.cities.map(function(c){return {text:c.name,sub:"竞争 "+c.competition+"/5 · 生活成本 "+c.cost+"/5",jobCityId:c.id,next:"job_hospital_select"};})};
  if(sc==="job_hospital_select"){
    var city=cityById(state.jobApplication&&state.jobApplication.cityId);
    if(!city){state.scene="job_city_select";return jobEvent();}
    var jobs=JOB.hospitalTemplates.filter(function(h){return city.tier>=h.minCityTier&&city.tier<=(h.maxCityTier||5);});
    return {stage:"求职 2/5",year:"毕业后",title:"在 "+city.name+"，把简历投向哪里？",type:"jobMarket",text:JOB.disclaimer,
      choices:jobs.map(function(h){var ck=jobRequirementCheck(h);return {text:h.name,sub:h.desc+(ck.ok?"":"｜当前缺少："+ck.reasons.join("、")),jobHospitalId:h.id,jobEligible:ck.ok,jobReason:ck.reasons.join("、"),next:"job_application_prepare"};}).concat([{text:"换一个城市",sub:"重新考虑。",next:"job_city_select"}])};
  }
  if(sc==="job_application_prepare")return {stage:"求职 3/5",year:"求职阶段",title:"简历筛选",type:"jobMarket",text:"学历只是第一层筛选。",
    choices:[
      {text:"突出临床与规培经历",sub:"适合临床导向岗位。",effects:{energy:-2},jobPrepAdd:12,next:"job_interview"},
      {text:"突出论文与科研能力",sub:"研究型岗位更受益。",effects:{energy:-3},jobPrepAdd:15,next:"job_interview"},
      {text:"针对目标岗位重写简历",sub:"最耗时间，但匹配度更高。",effects:{energy:-4,mental:-1},jobPrepAdd:20,next:"job_interview"}]};
  if(sc==="job_interview")return {stage:"求职 4/5",year:"求职阶段",title:"面试竞争",type:"jobMarket",text:"现在竞争的是一批都达到基本门槛的人。",
    choices:[
      {text:"用复杂病例和临床成长回答",sub:"知识与沟通更重要。",effects:{mental:-2},jobPrepAdd:10,next:"job_result"},
      {text:"用科研成果和课题计划回答",sub:"科研型岗位更受益。",effects:{mental:-2},jobPrepAdd:10,next:"job_result"},
      {text:"强调长期稳定计划",sub:"稳定性与表达更突出。",effects:{mental:-1},jobPrepAdd:7,next:"job_result"}]};
  if(sc==="job_result")return {stage:"求职 5/5",year:"求职阶段",title:"招聘系统状态更新了",type:"jobResult",text:"履历和面试准备已经全部计入结果。",choices:[{text:"查看招聘结果",sub:"结果不是必中的。",jobQuery:true}]};
  if(sc==="job_offer")return {stage:"招聘结果",year:"求职阶段",title:"你收到了录用通知",type:"jobResult",text:"目标医院向你发出了 Offer。",choices:[{text:"接受 Offer，办理入职",sub:"开始第一份医院工作。",jobAccept:true,next:"young_attending"},{text:"继续看看其他城市",sub:"放弃这份 Offer。",effects:{mental:-1},next:"job_city_select"}]};
  return {stage:"招聘结果",year:"求职阶段",title:"这一次没有拿到 Offer",type:"jobResult",text:"可以换目标继续投递。",choices:[{text:"换一家医院继续投",sub:"保持当前城市。",effects:{mental:1},next:"job_hospital_select"},{text:"换一个城市",sub:"重新进入求职市场。",effects:{mental:2},next:"job_city_select"}]};
}
function resolveJob(){
  var a=state.jobApplication||{},h=a.hospital||hospitalById(a.hospitalId);if(!h)return;
  var ck=jobRequirementCheck(h),ok=ck.ok&&Math.random()<jobProbability();
  if(ok){state.scene="job_offer";toast("收到 Offer");}
  else{state.scene="job_rejected";state.jobFailures=(state.jobFailures||0)+1;applyEffects({mental:-3});toast(ck.ok?"本轮未录用":"当前未达到岗位门槛");}
  save();scrollY=0;draw();
}
function acceptJob(){
  var a=state.jobApplication||{},c=cityById(a.cityId),h=a.hospital||hospitalById(a.hospitalId);
  if(!c||!h)return;
  state.job={cityId:c.id,cityName:c.name,hospitalId:h.id,hospitalName:h.name,startTitle:"住院医师 / 初级医师"};
  addFlag("employed");
  state.route="职业·"+c.name+"·"+h.name;
}

function activeOpportunityEvent(){
  if(!state||!state.activeOpportunity||!OPP)return null;
  var f=OPP.flows[state.activeOpportunity.id];
  return f&&f.steps[state.activeOpportunity.step]||null;
}
function currentEvent(){
  if(!state)return null;
  if(state.scene==="__SIGNATURE__")return signatureEvent();
  if(state.scene==="__OPPORTUNITY_FLOW__")return activeOpportunityEvent();
  var sp=specialtySelectionEvent(); if(sp)return sp;
  var ee=educationEvent(); if(ee)return ee;
  var je=jobEvent(); if(je)return je;
  var maps=[CAREER&&CAREER.events,COLLEGE&&COLLEGE.events,SPECIALTY&&SPECIALTY.events,LANG&&LANG.events,DATA&&DATA.events,DATA&&DATA.sideEvents,SYS&&SYS.ecoEvents];
  for(var i=0;i<maps.length;i++){if(maps[i]&&maps[i][state.scene])return maps[i][state.scene];}
  return null;
}

function ensureBachelorBridge(){
  var h=state.educationHistory;
  if(!h.undergrad)h.undergrad={schoolId:"college-upgrade-bridge",schoolName:"本科衔接院校（游戏模拟）",level:"本科",major:"临床医学本科衔接"};
}
function finishEnding(reason){
  state.finished=true; state.endReason=reason||"人生阶段完成"; save(); screen="ending";scrollY=0;draw();
}
function continueAfterChoice(choice,current,success){
  if(state.scene==="__OPPORTUNITY_FLOW__"&&state.activeOpportunity){
    if(choice.endFlow){
      var ret=state.activeOpportunity.returnNext;
      state.activeOpportunity=null;state.scene=ret;
    }else{
      var n=choice.nextStep;
      if(success===true&&choice.successStep)n=choice.successStep;
      if(success===false&&choice.failStep)n=choice.failStep;
      if(n)state.activeOpportunity.step=n;
    }
    save();scrollY=0;draw();return;
  }
  var next=choice.next;
  if(success===true&&choice.successNext)next=choice.successNext;
  if(success===false&&choice.failNext)next=choice.failNext;
  if(next==="college_bachelor_bridge")ensureBachelorBridge();
  if(next==="__END__"||!next){finishEnding("医学人生阶段完成");return;}
  if(next==="__SPECIALTY_RETURN__"){state.scene=state.specialtyReturnNext||"resident_entry";state.specialtyReturnNext=null;}
  else if(next==="__RETURN__"){state.scene=state.pendingNext||"fresh_growth";state.pendingNext=null;}
  else state.scene=next;
  save();scrollY=0;draw();
}

function choose(choice){
  var current=currentEvent(); if(!current)return;
  var req=requirementMet(choice.requires);
  if(!req.ok){toast("暂不可选："+req.reason);return;}
  if(choice.jobEligible===false){toast("当前缺少："+(choice.jobReason||"岗位条件"));return;}
  applyEffects(choice.effects||{});
  applyTalentEffects(choice.talentEffects||{});
  addFlags(choice.flags||[]);
  if(choice.route)state.route=choice.route;

  if(choice.eduStart)state.eduApplication={level:choice.eduStart.level,source:choice.eduStart.source,prep:0};
  if(choice.eduMasterType){state.eduApplication=state.eduApplication||{level:"master",source:"exam",prep:0};state.eduApplication.masterType=choice.eduMasterType;}
  if(choice.eduSchoolId){state.eduApplication=state.eduApplication||{prep:0};state.eduApplication.school=findEduSchool(choice.eduSchoolId);}
  if(choice.eduSpecialtyId){state.eduApplication=state.eduApplication||{prep:0};state.eduApplication.specialtyId=choice.eduSpecialtyId;}
  if(choice.eduDirectionId){state.eduApplication=state.eduApplication||{prep:0};state.eduApplication.directionId=choice.eduDirectionId;}
  if(choice.eduPrepAdd){state.eduApplication=state.eduApplication||{prep:0};state.eduApplication.prep=(state.eduApplication.prep||0)+choice.eduPrepAdd;}
  if(choice.jobCityId)state.jobApplication={cityId:choice.jobCityId,prep:0};
  if(choice.jobHospitalId){state.jobApplication=state.jobApplication||{prep:0};state.jobApplication.hospitalId=choice.jobHospitalId;state.jobApplication.hospital=hospitalById(choice.jobHospitalId);}
  if(choice.jobPrepAdd){state.jobApplication=state.jobApplication||{prep:0};state.jobApplication.prep=(state.jobApplication.prep||0)+choice.jobPrepAdd;}
  if(choice.jobQuery){resolveJob();return;}
  if(choice.jobAccept)acceptJob();
  if(choice.admissionQuery){resolveAdmission();return;}

  if(choice.specialtyId&&SPECIALTY){
    var spec=SPECIALTY.specialties[choice.specialtyId];
    if(spec){
      state.specialtyId=choice.specialtyId;state.specialtyReturnNext=choice.next;addFlag("specialty_"+choice.specialtyId);
      applyEffects(spec.mods||{});applyTalentEffects(spec.talentEffects||{});
      state.scene=spec.intro;save();scrollY=0;draw();return;
    }
  }
  if(current.exclusiveGroup&&choice.application)state.applications[current.exclusiveGroup]=choice.application;
  var flowId=choice.application&&OPP&&OPP.byApplication[choice.application];
  if(flowId&&OPP.flows[flowId]){
    var f=OPP.flows[flowId];
    state.activeOpportunity={id:flowId,step:f.start,returnNext:f.returnNext||choice.next};
    state.scene="__OPPORTUNITY_FLOW__";save();scrollY=0;draw();return;
  }
  var success=choice.chance?resolveChance(choice.chance):null;
  if(choice.researchEmployer){state.researchJob=choice.researchEmployer;state.job=null;}
  if(success===true&&choice.successResearchEmployer){state.researchJob=choice.successResearchEmployer;state.job=null;}
  if(success===false&&choice.failResearchEmployer){state.researchJob=choice.failResearchEmployer;state.job=null;}

  if(state.stats.energy<=0||state.stats.mental<=0){
    pendingFatal={choice:choice,current:current,success:success};
    if((state.reviveCount||0)>=1){finishEnding(state.stats.energy<=0?"体力耗尽":"心理压力耗尽");}
    else{screen="death";scrollY=0;save();draw();}
    return;
  }
  continueAfterChoice(choice,current,success);
}

function revive(){
  if(!state||!pendingFatal)return;
  state.reviveCount=1;
  if(state.stats.energy<=0)state.stats.energy=25;
  if(state.stats.mental<=0)state.stats.mental=25;
  var p=pendingFatal;pendingFatal=null;screen="game";
  continueAfterChoice(p.choice,p.current,p.success);
}
function setupAd(){
  if(!config.rewardedAdUnitId || !wxapi.createRewardedVideoAd)return;
  try{
    rewardedAd=wxapi.createRewardedVideoAd({adUnitId:config.rewardedAdUnitId});
    rewardedAd.onClose(function(res){
      var cb=pendingAdCallback;pendingAdCallback=null;
      if(cb)cb(!!(res&&res.isEnded));
    });
    rewardedAd.onError(function(){var cb=pendingAdCallback;pendingAdCallback=null;if(cb)cb(false);});
  }catch(e){rewardedAd=null;}
}
function requestRevive(){
  if(!rewardedAd){revive();return;}
  pendingAdCallback=function(ok){if(ok)revive();else toast("需要完整观看视频才能复活");};
  rewardedAd.show().catch(function(){return rewardedAd.load().then(function(){return rewardedAd.show();});}).catch(function(){pendingAdCallback=null;toast("广告暂不可用，请稍后再试");});
}

function shareGame(){
  if(wxapi.shareAppMessage)wxapi.shareAppMessage({title:"医学生养成记录｜你能走到哪一步？"});
}
try{
  if(wxapi.showShareMenu)wxapi.showShareMenu({menus:["shareAppMessage","shareTimeline"]});
  if(wxapi.onShareAppMessage)wxapi.onShareAppMessage(function(){return {title:"医学生养成记录｜你能走到哪一步？"};});
}catch(e){}

function rr(x,y,w,h,r,fill,stroke){
  ctx.beginPath();
  var q=Math.min(r,w/2,h/2);
  ctx.moveTo(x+q,y);ctx.arcTo(x+w,y,x+w,y+h,q);ctx.arcTo(x+w,y+h,x,y+h,q);ctx.arcTo(x,y+h,x,y,q);ctx.arcTo(x,y,x+w,y,q);
  if(fill){ctx.fillStyle=fill;ctx.fill();}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
}
function textLines(text,maxWidth,font){
  ctx.font=font||"14px sans-serif";
  var s=String(text||""), out=[],line="";
  for(var i=0;i<s.length;i++){
    var test=line+s[i];
    if(ctx.measureText(test).width>maxWidth && line){out.push(line);line=s[i];}
    else line=test;
  }
  if(line)out.push(line);
  return out;
}
function drawText(text,x,y,maxWidth,lineH,style){
  style=style||{};ctx.font=style.font||"14px sans-serif";ctx.fillStyle=style.color||"#2b2a28";ctx.textAlign=style.align||"left";ctx.textBaseline="top";
  var lines=textLines(text,maxWidth,ctx.font);
  lines.forEach(function(line,i){ctx.fillText(line,x,y+i*lineH);});
  return lines.length*lineH;
}
function button(x,y,w,label,sub,action,opt){
  opt=opt||{};var pad=12;
  ctx.font="600 15px sans-serif";
  var lh=textLines(label,w-pad*2,"600 15px sans-serif").length*21;
  var sh=sub?textLines(sub,w-pad*2,"12px sans-serif").length*17:0;
  var h=Math.max(48,pad+lh+(sub?5+sh:0)+pad);
  rr(x,y,w,h,12,opt.disabled?"#e7e3dc":"#ffffff",opt.disabled?"#d7d1c8":"#d9d2c8");
  drawText(label,x+pad,y+pad,w-pad*2,21,{font:"600 15px sans-serif",color:opt.disabled?"#99948d":"#222"});
  if(sub)drawText(sub,x+pad,y+pad+lh+5,w-pad*2,17,{font:"12px sans-serif",color:opt.disabled?"#aaa49d":"#6e6861"});
  if(!opt.disabled)uiButtons.push({x:x,y:y,w:w,h:h,action:action});
  return h;
}
function header(){
  ctx.fillStyle="#efe9df";ctx.fillRect(0,0,W,H);
  rr(12,12,W-24,52,14,"#1f6f5f");
  drawText(config.title,28,27,W-56,24,{font:"700 20px sans-serif",color:"#fff"});
}
function footerNotice(){
  if(!notice)return;
  var h=52;rr(18,H-h-18,W-36,h,14,"rgba(20,20,20,.88)");
  drawText(notice,32,H-h-5,W-64,20,{font:"14px sans-serif",color:"#fff",align:"left"});
}
function beginScrollable(top){
  ctx.save();ctx.beginPath();ctx.rect(0,top,W,H-top);ctx.clip();ctx.translate(0,-scrollY);
  return top;
}
function endScrollable(contentBottom,top){
  ctx.restore();
  maxScroll=Math.max(0,contentBottom-(H-top)+20);
  scrollY=clamp(scrollY,0,maxScroll);
}
function drawHome(){
  header();
  var y=96;
  drawText("从高考开始，走过医学院、升学、规培、求职与职业选择。",24,y,W-48,24,{font:"16px sans-serif",color:"#49443f"});y+=76;
  y+=button(24,y,W-48,"开始新的人生","每一局的高考、机会与结果都会不同。",function(){state=null;rollingScore=null;screen="birth";scrollY=0;draw();});y+=12;
  if(load()){
    y+=button(24,y,W-48,"继续上一次人生","读取本机存档。",function(){screen=state.finished?"ending":"game";scrollY=0;draw();});y+=12;
  }
  y+=button(24,y,W-48,"分享小游戏","普通分享，不提供额外复活次数。",shareGame);
  drawText("游戏内容为模拟体验，不代表真实院校招生、招聘或职业结果。",24,H-54,W-48,18,{font:"11px sans-serif",color:"#817a72"});
}
function cycle(obj,key){
  var keys=Object.keys(obj),i=keys.indexOf(birth[key]);birth[key]=keys[(i+1)%keys.length];draw();
}
function drawBirth(){
  header();var top=76,y=beginScrollable(top)+14-scrollY*0;
  drawText("出生条件与难度",22,y,W-44,26,{font:"700 21px sans-serif"});y+=40;
  var d=DATA.difficulties[birth.difficulty];
  y+=button(22,y,W-44,"难度："+d.name,d.desc,function(){var keys=["easy","normal","hard"],i=keys.indexOf(birth.difficulty);birth.difficulty=keys[(i+1)%3];draw();});y+=10;
  var rows=[
    ["hometown","成长地区",BG.hometowns],
    ["onlyChild","家庭结构",BG.onlyChild],
    ["economy","家庭经济",BG.economy],
    ["education","家庭教育背景",BG.education],
    ["medicalFamily","医学职业信息",BG.medicalFamily]
  ];
  rows.forEach(function(r){var item=r[2][birth[r[0]]];y+=button(22,y,W-44,r[1]+"："+item.name,item.desc,function(){cycle(r[2],r[0]);});y+=9;});
  y+=button(22,y,W-44,"开始高考","生成这一局的高考成绩。",function(){rollingScore=broadScore();screen="gaokao";scrollY=0;draw();});
  endScrollable(y+30,top);footerNotice();
}
function drawGaokao(){
  header();var y=105;
  drawText("高考放榜",24,y,W-48,28,{font:"700 24px sans-serif"});y+=58;
  rr(24,y,W-48,118,18,"#fff","#d9d2c8");
  drawText(String(rollingScore),W/2,y+20,W-60,54,{font:"700 48px sans-serif",color:"#1f6f5f",align:"center"});
  drawText("可报层级："+allowedLevels(rollingScore).join(" / "),W/2,y+78,W-60,22,{font:"14px sans-serif",color:"#6f6860",align:"center"});y+=142;
  y+=button(24,y,W-48,"查看可选择的医学院校","根据本局分数和游戏门槛筛选。",function(){screen="schools";scrollY=0;draw();});
  y+=12;
  y+=button(24,y,W-48,"重新放榜一次","重新生成本局高考分数。",function(){rollingScore=broadScore();draw();});
}
function drawSchools(){
  header();var top=76,y=beginScrollable(top)+12;
  drawText("选择医学院校",20,y,W-40,28,{font:"700 22px sans-serif"});y+=34;
  drawText(rollingScore+" 分 · 符合条件 "+eligibleSchools(rollingScore).length+" 所",20,y,W-40,20,{font:"13px sans-serif",color:"#6b655e"});y+=34;
  eligibleSchools(rollingScore).forEach(function(s){
    var level=s.educationLevel||"本科";
    y+=button(20,y,W-40,(level==="专科"?"【专科】":"【本科】")+s.name,(s.city||"")+" · "+(s.program||"临床医学")+" · 游戏门槛 "+s.minScore+"+",function(){startWithSchool(s.id);});y+=9;
  });
  endScrollable(y+24,top);footerNotice();
}
function drawStats(y){
  var labels=[["knowledge","知识"],["energy","体力"],["mental","心理"],["research","科研"],["reputation","声望"],["english","英语"]];
  var gap=6,w=(W-40-gap*2)/3;
  labels.forEach(function(it,i){
    var row=Math.floor(i/3),col=i%3,x=20+col*(w+gap),yy=y+row*42;
    rr(x,yy,w,34,9,"#f8f5ef","#ddd5ca");
    drawText(it[1]+" "+Math.round(state.stats[it[0]]||0),x+w/2,yy+8,w-8,18,{font:"12px sans-serif",color:"#514b44",align:"center"});
  });
  return y+84;
}
function drawGame(){
  header();var top=76,y=beginScrollable(top)+12;
  var e=currentEvent();
  if(!e){ctx.restore();finishEnding("当前路线已完成");return;}
  y=drawStats(y);y+=8;
  var school=currentSchool();
  drawText((school?school.name:"")+" · "+(state.route||"医学人生"),20,y,W-40,18,{font:"11px sans-serif",color:"#746d65"});y+=26;
  drawText(e.stage||"当前阶段",20,y,W-40,20,{font:"600 13px sans-serif",color:"#1f6f5f"});y+=24;
  drawText(e.title||"",20,y,W-40,29,{font:"700 22px sans-serif",color:"#24211e"});y+=textLines(e.title||"",W-40,"700 22px sans-serif").length*29+8;
  if(e.year){drawText(e.year,20,y,W-40,18,{font:"12px sans-serif",color:"#8b837a"});y+=22;}
  if(e.warning){rr(20,y,W-40,Math.max(50,textLines(e.warning,W-64,"12px sans-serif").length*18+24),10,"#fff2dc","#e8c98e");var wh=drawText(e.warning,32,y+12,W-64,18,{font:"12px sans-serif",color:"#725225"});y+=wh+36;}
  y+=drawText(e.text||"",20,y,W-40,22,{font:"15px sans-serif",color:"#4d4842"});y+=24;

  var choices=(e.choices||[]).filter(visibleChoice);
  choices.forEach(function(c){
    var req=requirementMet(c.requires),disabled=!req.ok||c.jobEligible===false;
    var sub=c.sub||"";
    if(!req.ok)sub+="｜需要："+req.reason;
    if(c.jobEligible===false)sub+="｜缺少："+(c.jobReason||"岗位条件");
    y+=button(20,y,W-40,c.text,sub,function(){choose(c);},{disabled:disabled});y+=10;
  });
  y+=button(20,y,W-40,"分享这一局","普通分享，不增加复活次数。",shareGame);y+=10;
  y+=button(20,y,W-40,"返回首页","当前进度会自动保存。",function(){save();screen="home";scrollY=0;draw();});
  endScrollable(y+30,top);footerNotice();
}
function drawDeath(){
  header();var y=116;
  drawText("这一段人生撑不住了",24,y,W-48,32,{font:"700 25px sans-serif"});y+=58;
  var reason=state.stats.energy<=0?"体力耗尽":"心理压力耗尽";
  drawText(reason+"。本局只有一次复活机会；复活后再次死亡将直接进入结局。",24,y,W-48,24,{font:"15px sans-serif",color:"#5c554e"});y+=92;
  var label=config.rewardedAdUnitId?"看完整视频复活":"首发版本免费复活";
  y+=button(24,y,W-48,label,"恢复最低生存状态并继续刚才的选择。",requestRevive);y+=12;
  y+=button(24,y,W-48,"结束这一局","直接查看本局结局。",function(){finishEnding(reason);});
  footerNotice();
}
function highestEducation(){
  var h=state.educationHistory||{};
  return h.phd?"博士":(h.master?"硕士":(h.undergrad?"本科":(h.college?"专科":"医学院阶段")));
}
function drawEnding(){
  header();var top=76,y=beginScrollable(top)+18;
  drawText("人生结局",22,y,W-44,32,{font:"700 26px sans-serif"});y+=48;
  rr(20,y,W-40,160,16,"#fff","#d9d2c8");
  drawText(state.endReason||"医学人生阶段完成",34,y+20,W-68,28,{font:"700 20px sans-serif",color:"#1f6f5f"});
  drawText("学历："+highestEducation(),34,y+62,W-68,20,{font:"14px sans-serif"});
  drawText("院校："+((currentSchool()&&currentSchool().name)||"—"),34,y+88,W-68,20,{font:"13px sans-serif",color:"#625b54"});
  drawText("路线："+(state.route||"—"),34,y+114,W-68,20,{font:"13px sans-serif",color:"#625b54"});y+=184;
  y+=button(22,y,W-44,"再来一局","重新生成出生条件、高考和人生选择。",function(){clearSave();state=null;rollingScore=null;screen="birth";scrollY=0;draw();});y+=10;
  y+=button(22,y,W-44,"分享我的医学人生","普通分享结局。",shareGame);y+=10;
  y+=button(22,y,W-44,"返回首页","保留当前结局存档。",function(){screen="home";scrollY=0;draw();});
  endScrollable(y+30,top);footerNotice();
}
function draw(){
  uiButtons=[];ctx.clearRect(0,0,W,H);
  if(screen==="home")drawHome();
  else if(screen==="birth")drawBirth();
  else if(screen==="gaokao")drawGaokao();
  else if(screen==="schools")drawSchools();
  else if(screen==="game")drawGame();
  else if(screen==="death")drawDeath();
  else if(screen==="ending")drawEnding();
}

function hitButton(x,y){
  for(var i=uiButtons.length-1;i>=0;i--){
    var b=uiButtons[i];
    if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h)return b;
  }
  return null;
}
wxapi.onTouchStart(function(ev){
  var t=ev.touches&&ev.touches[0];if(!t)return;
  touchStart={x:t.clientX,y:t.clientY};touchLastY=t.clientY;touchMoved=false;
});
wxapi.onTouchMove(function(ev){
  var t=ev.touches&&ev.touches[0];if(!t||!touchStart)return;
  var dy=t.clientY-touchLastY;touchLastY=t.clientY;
  if(Math.abs(t.clientY-touchStart.y)>5)touchMoved=true;
  if(["birth","schools","game","ending"].indexOf(screen)>=0 && maxScroll>0){
    scrollY=clamp(scrollY-dy,0,maxScroll);draw();
  }
});
wxapi.onTouchEnd(function(ev){
  if(!touchStart)return;
  var changed=ev.changedTouches&&ev.changedTouches[0];
  var x=changed?changed.clientX:touchStart.x,y=changed?changed.clientY:touchStart.y;
  if(!touchMoved){var b=hitButton(x,y);if(b&&b.action)b.action();}
  touchStart=null;
});

setupAd();
draw();
