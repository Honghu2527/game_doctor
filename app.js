(function(){
  "use strict";

  var DATA=window.GAME_DATA;
  var BACKGROUND_DATA=window.BACKGROUND_DATA;
  var SCHOOL_DATA=window.SCHOOL_DATA;
  var SCHOOL_SYSTEM=window.SCHOOL_SYSTEM;
  var CAREER_DATA=window.CAREER_DATA;
  var COLLEGE_DATA=window.COLLEGE_DATA;
  var SPECIALTY_DATA=window.SPECIALTY_DATA;
  var EDUCATION_DATA=window.EDUCATION_DATA;
  var OPPORTUNITY_DATA=window.OPPORTUNITY_DATA;
  var BOARD=window.MESSAGE_BOARD;
  var DIFFICULTIES=DATA.difficulties;
  var CAREER_EVENTS=CAREER_DATA.events;
  var SIDE_EVENTS=DATA.sideEvents;
  var ECO_EVENTS=SCHOOL_SYSTEM.ecoEvents;
  var ORDER=CAREER_DATA.order.concat(COLLEGE_DATA?COLLEGE_DATA.order:[]);
  var SAVE_KEY="doctor-life-sim-v09";
  var BOARD_KEY="doctor-life-message-wall-v1";

  var state=null;
  var selectedDifficulty="normal";
  var rollTimer=null;
  var rollingScore=null;
  var scoreLocked=false;
  var pendingName="";
  var pendingBackground=null;
  var schoolLevelFilter="all";
  var schoolSearchQuery="";
  var boardSort="newest";

  var statKeys=["knowledge","energy","mental","money","research","reputation"];
  var statNames={knowledge:"知识",energy:"体力",mental:"心理",money:"金钱",research:"科研",reputation:"声望"};

  var Storage={
    save:function(payload){try{localStorage.setItem(SAVE_KEY,JSON.stringify(payload));}catch(e){}},
    load:function(){try{var raw=localStorage.getItem(SAVE_KEY);return raw?JSON.parse(raw):null;}catch(e){return null;}},
    clear:function(){try{localStorage.removeItem(SAVE_KEY);}catch(e){}}
  };

  function el(id){return document.getElementById(id);}
  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
  function rand(min,max){return Math.floor(Math.random()*(max-min+1))+min;}
  function escapeHtml(v){
    return String(v).replace(/[&<>"']/g,function(ch){
      return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[ch];
    });
  }
  function showOnly(id){
    ["startScreen","gaokaoScreen","schoolScreen","letterScreen","gameScreen","endingScreen"].forEach(function(x){
      el(x).hidden=x!==id;
    });
    renderJourneyRibbon(id);
  }

  function schoolById(id){return SCHOOL_DATA.schools.find(function(s){return s.id===id;});}
  function profileIdForSchool(school){return school.profileId||SCHOOL_SYSTEM.schoolProfiles[school.id]||"growth";}
  function profileForSchool(school){return SCHOOL_SYSTEM.profiles[profileIdForSchool(school)];}
  function currentSchool(){return state?schoolById(state.schoolId):null;}
  function currentProfile(){var s=currentSchool();return s?profileForSchool(s):SCHOOL_SYSTEM.profiles.growth;}
  function currentSpecialty(){
    return state&&state.specialtyId&&SPECIALTY_DATA?SPECIALTY_DATA.specialties[state.specialtyId]:null;
  }
  function currentSpecialtyName(){
    var s=currentSpecialty();
    return s?s.name:"尚未选择";
  }

  function currentInstitutionName(){
    if(!state)return "—";
    var h=state.educationHistory||{};
    if((state.flags.has("phdDomestic")||state.flags.has("phdOverseas")||state.flags.has("directPhdOffer"))&&h.phd)return h.phd.schoolName;
    if((state.flags.has("clinicalMaster")||state.flags.has("academicMaster")||state.flags.has("overseasOffer"))&&h.master)return h.master.schoolName;
    return h.undergrad?h.undergrad.schoolName:(currentSchool()?currentSchool().name:"—");
  }

  function scrollAfterRender(){
    window.requestAnimationFrame(function(){
      var game=el("gameScreen");
      if(game&&!game.hidden){
        var panel=document.querySelector(".story-panel");
        if(panel){
          var top=window.scrollY+panel.getBoundingClientRect().top-12;
          window.scrollTo({top:Math.max(0,top),behavior:"smooth"});
          return;
        }
      }
      window.scrollTo({top:0,behavior:"smooth"});
    });
  }

  function stageBackgroundKey(){
    if(!state)return "undergrad";
    var scene=state.scene||"";
    var spec=state.specialtyId||"";
    if(/^fresh_|white_coat|key_undergrad|ug_|clinical_exposure|key_graduation/.test(scene))return "undergrad";
    if(/^edu_|grad_exam|exam_fail|recommended/.test(scene))return "undergrad";
    if(state.flags.has("academicMaster")||/^phd_|direct_phd/.test(scene))return "research";
    if(spec==="surgery"||spec==="obgyn")return "surgery";
    if(spec==="radiology")return "radiology";
    if(spec==="nuclear")return "nuclear";
    if(spec==="pathology")return "research";
    if(state.flags.has("clinicalMaster")||/^resident_|job_choice|young_attending|career_|key_midcareer|promotion|director/.test(scene)){
      return spec==="internal"?"internal":"hospital";
    }
    return "undergrad";
  }

  function applyStageBackground(){
    document.body.setAttribute("data-stage-bg",stageBackgroundKey());
  }

  function renderEducationTimeline(){
    if(!state||!el("educationTimeline"))return;
    var h=state.educationHistory||{};
    var items=[];
    if(h.undergrad)items.push({level:h.undergrad.level||"本科",school:h.undergrad.schoolName,detail:h.undergrad.major||"临床医学"});
    if(h.master)items.push({level:"硕士",school:h.master.schoolName,detail:[h.master.type,h.master.specialty].filter(Boolean).join(" · ")});
    if(h.phd)items.push({level:"博士",school:h.phd.schoolName,detail:[h.phd.type,h.phd.specialty,h.phd.direction].filter(Boolean).join(" · ")});
    (h.overseas||[]).forEach(function(x){
      if(!items.some(function(i){return i.level===x.level&&i.school===x.schoolName;})){
        items.push({level:x.level||"海外经历",school:x.schoolName,detail:x.detail||x.region||""});
      }
    });
    el("educationTimeline").innerHTML=items.map(function(x,index){
      return "<div class=\"education-stop\"><b>"+escapeHtml(x.level)+"</b><strong>"+escapeHtml(x.school)+"</strong><span>"+escapeHtml(x.detail)+"</span>"+(index<items.length-1?"<i>→</i>":"")+"</div>";
    }).join("");
  }

  function journeyPhaseForState(){
    if(!state)return {current:"出生档案",next:"高考放榜",steps:[["出生","current"],["高考","future"],["志愿录取","future"]]};
    if(state.finished)return {current:"人生结局",next:"留言与回顾",steps:[["医学院","done"],["升学/规培","done"],["职业","done"],["结局","current"]]};

    var scene=state.scene||"";
    var school=currentSchool();
    var college=school&&school.educationLevel==="专科";
    var baseLabel=college?"医学专科":"本科医学";

    if(/^fresh_|white_coat|key_undergrad|ug_|clinical_exposure/.test(scene)){
      return {current:baseLabel+"培养",next:"毕业分流：升学 / 规培 / 海外",steps:[["出生","done"],["高考","done"],["医学院","done"],[baseLabel,"current"],["毕业分流","future"]]};
    }
    if(/^college_/.test(scene)){
      var collegeNext=/upgrade/.test(scene)?"本科衔接 / 实践就业":"专升本 / 基层实践";
      return {current:"医学专科路线",next:collegeNext,steps:[["出生","done"],["高考","done"],["医学专科","current"],["升学/实践","future"]]};
    }
    if(/key_graduation|grad_exam|exam_fail|recommended_postgrad|specialty_select/.test(scene)){
      return {current:"升学与科室分流",next:"专硕并轨 / 学硕科研 / 直博 / 直接规培",steps:[["本科","done"],["毕业","done"],["升学分流","current"],["科室选择","future"]]};
    }
    if(state.flags.has("clinicalMaster")&&!/^phd_|direct_phd/.test(scene)&&!/job_choice|young_attending|career_|key_midcareer|promotion|director|final/.test(scene)){
      return {current:"临床专硕 · "+currentSpecialtyName()+" · 并轨规培",next:"毕业求职 / 继续读博",steps:[["医学院","done"],["择科","done"],["专硕+规培","current"],["就业/读博","future"]]};
    }
    if(state.flags.has("academicMaster")&&!/^phd_|direct_phd/.test(scene)&&!/resident_|job_choice|young_attending|career_|key_midcareer|promotion|director|final/.test(scene)){
      return {current:"学硕 · "+currentSpecialtyName()+" · 科研训练",next:"继续读博 / 毕业后规培",steps:[["医学院","done"],["择科","done"],["学硕科研","current"],["读博/规培","future"]]};
    }
    if(/^phd_|direct_phd/.test(scene)||state.flags.has("phdDomestic")||state.flags.has("phdOverseas")||state.flags.has("directPhdOffer")){
      if(!/resident_|job_choice|young_attending|career_|key_midcareer|promotion|director|final/.test(scene)){
        return {current:"博士阶段 · "+currentSpecialtyName(),next:"医院 / 博后 / 海外",steps:[["研究生/直博","done"],["学科方向","done"],["博士","current"],["毕业去向","future"]]};
      }
    }
    if(/^resident_/.test(scene)||state.flags.has("directResident")){
      if(!/job_choice|young_attending|career_|key_midcareer|promotion|director|final/.test(scene)){
        return {current:"规培 · "+currentSpecialtyName(),next:"结业 / 医院选择",steps:[["医学院","done"],["择科","done"],["规培","current"],["正式工作","future"]]};
      }
    }
    if(/job_choice|young_attending|career_|key_midcareer|promotion|director/.test(scene)){
      return {current:"职业发展 · "+currentSpecialtyName(),next:"晋升 / 专家 / 管理 / 学术",steps:[["培养","done"],["规培/学历","done"],["职业发展","current"],["职业终章","future"]]};
    }
    return {current:"医学人生进行中",next:"由当前选择决定",steps:[["出生","done"],["高考","done"],["医学院","done"],["当前路线","current"]]};
  }

  function renderJourneyRibbon(screenId){
    if(!el("journeySteps"))return;
    var model;
    if(screenId==="startScreen"){
      model={current:"出生档案",next:"高考放榜",steps:[["出生","current"],["高考","future"],["志愿录取","future"]]};
    }else if(screenId==="gaokaoScreen"){
      model={current:"高考放榜",next:"根据分数开放本科 / 专科院校池",steps:[["出生","done"],["高考","current"],["志愿录取","future"]]};
    }else if(screenId==="schoolScreen"||screenId==="letterScreen"){
      model={current:screenId==="schoolScreen"?"志愿填报":"录取确认",next:"进入对应院校培养路线",steps:[["出生","done"],["高考","done"],["志愿录取","current"],["医学院","future"]]};
    }else if(screenId==="endingScreen"){
      model={current:"人生结局",next:"留言、回顾或重新开始",steps:[["培养","done"],["升学/规培","done"],["职业","done"],["结局","current"]]};
    }else{
      model=journeyPhaseForState();
    }
    el("journeyCurrent").textContent=model.current;
    el("journeyNext").textContent="下一阶段："+model.next;
    el("journeySteps").innerHTML=model.steps.map(function(item,index){
      var cls=item[1]==="done"?"done":item[1]==="current"?"current":"future";
      return "<div class=\"journey-step "+cls+"\"><b>"+String(index+1).padStart(2,"0")+"</b><span>"+escapeHtml(item[0])+"</span></div>";
    }).join("");
  }

  function fillSelect(id,obj,defaultKey){
    var select=el(id);
    select.innerHTML=Object.keys(obj).map(function(k){
      return "<option value=\""+k+"\">"+escapeHtml(obj[k].name)+"</option>";
    }).join("");
    if(defaultKey&&obj[defaultKey])select.value=defaultKey;
  }

  function initBirthSelectors(){
    fillSelect("birthHometown",BACKGROUND_DATA.hometowns,"city");
    fillSelect("birthOnlyChild",BACKGROUND_DATA.onlyChild,"yes");
    fillSelect("birthEconomy",BACKGROUND_DATA.economy,"ordinary");
    fillSelect("birthEducation",BACKGROUND_DATA.education,"college");
    fillSelect("birthMedical",BACKGROUND_DATA.medicalFamily,"none");
    ["birthHometown","birthOnlyChild","birthEconomy","birthEducation","birthMedical"].forEach(function(id){
      el(id).addEventListener("change",renderBirthPreview);
    });
    renderBirthPreview();
  }

  function readBirthSelection(){
    return {
      hometown:el("birthHometown").value,
      onlyChild:el("birthOnlyChild").value,
      economy:el("birthEconomy").value,
      education:el("birthEducation").value,
      medicalFamily:el("birthMedical").value
    };
  }

  function compileBackground(sel){
    var parts=[
      BACKGROUND_DATA.hometowns[sel.hometown],
      BACKGROUND_DATA.onlyChild[sel.onlyChild],
      BACKGROUND_DATA.economy[sel.economy],
      BACKGROUND_DATA.education[sel.education],
      BACKGROUND_DATA.medicalFamily[sel.medicalFamily]
    ];
    var mods={},resources={infoAccess:3,finance:3,familySupport:3,familyPressure:3,medicalInfo:1,cost:3},scoreShift=0;
    parts.forEach(function(p){
      Object.keys(p.mods||{}).forEach(function(k){mods[k]=(mods[k]||0)+p.mods[k];});
      scoreShift+=p.scoreShift||0;
    });
    var home=parts[0],only=parts[1],eco=parts[2],edu=parts[3],med=parts[4];
    resources.infoAccess=clamp((home.resources.info||3)+(edu.resources.infoBonus||0),1,5);
    resources.finance=clamp(eco.resources.finance||3,1,5);
    resources.familySupport=clamp(only.resources.familySupport||3,1,5);
    resources.familyPressure=clamp((only.resources.familyPressure||3)+(edu.resources.familyPressure||0)+(med.resources.familyPressure||0)-2,1,5);
    resources.medicalInfo=clamp(med.resources.medicalInfo||1,1,5);
    resources.cost=clamp(home.resources.cost||3,1,5);
    return {
      selection:sel,
      mods:mods,
      resources:resources,
      scoreShift:clamp(scoreShift,-14,14),
      labels:{
        hometown:home.name,onlyChild:only.name,economy:eco.name,education:edu.name,medicalFamily:med.name
      }
    };
  }

  function resourceWord(v){
    return v>=5?"很高":v>=4?"较高":v>=3?"中等":v>=2?"较低":"很低";
  }

  function renderBirthPreview(){
    var bg=compileBackground(readBirthSelection());
    el("birthPreview").innerHTML=
      "<strong>这一开局的资源画像：</strong> "+
      "信息获取 "+resourceWord(bg.resources.infoAccess)+" · "+
      "经济缓冲 "+resourceWord(bg.resources.finance)+" · "+
      "家庭支持 "+resourceWord(bg.resources.familySupport)+" · "+
      "医学职业信息 "+resourceWord(bg.resources.medicalInfo)+" · "+
      "家庭期待 "+resourceWord(bg.resources.familyPressure)+
      "<br><span style=\"color:#8a8178\">这些只改变游戏资源和部分机会成本；高考仍会大范围随机。</span>";
  }

  function backgroundShort(bg){
    if(!bg||!bg.labels)return "—";
    return bg.labels.hometown+" · "+bg.labels.economy;
  }

  function renderDifficulty(){
    var grid=el("difficultyGrid");
    grid.innerHTML="";
    Object.keys(DIFFICULTIES).forEach(function(key){
      var d=DIFFICULTIES[key];
      var b=document.createElement("button");
      b.className="difficulty-card"+(key===selectedDifficulty?" active":"");
      b.innerHTML="<strong>"+d.name+"</strong><span>"+d.desc+"</span>";
      b.addEventListener("click",function(){selectedDifficulty=key;renderDifficulty();});
      grid.appendChild(b);
    });
  }

  function resetGaokao(){
    if(rollTimer){clearInterval(rollTimer);rollTimer=null;}
    rollingScore=null;scoreLocked=false;
    el("scoreDisplay").textContent="---";
    el("scoreDisplay").classList.remove("rolling");
    el("rollBtn").disabled=false;
    el("stopBtn").disabled=true;
    el("scoreResult").hidden=true;
    el("scoreResult").innerHTML="";
    el("scoreEligibility").hidden=true;
    el("scoreEligibility").innerHTML="";
  }

  function beginGaokao(){
    pendingName=el("playerName").value.trim()||"无名医学生";
    pendingBackground=compileBackground(readBirthSelection());
    resetGaokao();showOnly("gaokaoScreen");el("restartBtn").hidden=false;
    scrollAfterRender();
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
    var triangular=(Math.random()+Math.random())/2;
    var base=min+Math.round((max-min)*triangular);
    var shift=pendingBackground?pendingBackground.scoreShift:0;
    return Math.round(clamp(base+shift,280,745));
  }

  function startRolling(){
    if(scoreLocked||rollTimer)return;
    el("rollBtn").disabled=true;el("stopBtn").disabled=false;
    el("scoreDisplay").classList.add("rolling");
    rollingScore=broadScore();el("scoreDisplay").textContent=rollingScore;
    rollTimer=setInterval(function(){
      rollingScore=broadScore();
      el("scoreDisplay").textContent=rollingScore;
    },72);
  }

  function getBand(score){
    return SCHOOL_DATA.bands.find(function(b){return score>=b.min&&score<=b.max;})||SCHOOL_DATA.bands[SCHOOL_DATA.bands.length-1];
  }

  function allowedEducationLevels(score){
    if(score>=530)return ["本科"];
    if(score>=450)return ["本科","专科"];
    return ["专科"];
  }

  function educationRuleText(score){
    var levels=allowedEducationLevels(score);
    if(levels.length===1&&levels[0]==="本科")return "本局规则：当前分数只开放本科医学路线。专科入口已锁定。";
    if(levels.length===1&&levels[0]==="专科")return "本局规则：当前分数只开放医学专科路线。可通过专升本等节点继续向上。";
    return "本局规则：当前分数处于本科冲刺 / 医学专科并存区间，最终可选学校仍由游戏门槛决定。";
  }

  function stopRolling(){
    if(!rollTimer||scoreLocked)return;
    clearInterval(rollTimer);rollTimer=null;scoreLocked=true;
    el("scoreDisplay").classList.remove("rolling");el("stopBtn").disabled=true;
    var band=getBand(rollingScore);
    var box=el("scoreResult");
    box.hidden=false;
    box.innerHTML="<strong>"+rollingScore+" 分 · "+escapeHtml(band.label)+"</strong><br>"+escapeHtml(band.note)+
      "<br><button id=\"goSchoolBtn\" class=\"primary-btn next-score-btn\">查看可选择的医学院校</button>";
    el("scoreEligibility").hidden=false;
    el("scoreEligibility").innerHTML="<strong>可报层级："+allowedEducationLevels(rollingScore).join(" / ")+"</strong><br>"+educationRuleText(rollingScore);
    el("goSchoolBtn").addEventListener("click",showSchoolSelection);
  }

  function eligibleSchools(score){
    var allowed=allowedEducationLevels(score);
    var all=SCHOOL_DATA.schools.filter(function(s){
      var level=s.educationLevel||"本科";
      return score>=s.minScore&&allowed.indexOf(level)>=0;
    });
    all.sort(function(a,b){
      if((a.educationLevel||"本科")!==(b.educationLevel||"本科")){
        return (a.educationLevel||"本科")==="本科"?-1:1;
      }
      return b.minScore-a.minScore;
    });
    return all;
  }

  function stars(n){
    var out="";
    for(var i=0;i<5;i++)out+=i<n?"★":"☆";
    return out;
  }

  function renderSchoolGrid(){
    var list=eligibleSchools(rollingScore).filter(function(s){
      var level=s.educationLevel||"本科";
      if(schoolLevelFilter!=="all"&&level!==schoolLevelFilter)return false;
      if(!schoolSearchQuery)return true;
      var hay=(s.name+" "+s.city+" "+(s.program||"")+" "+(s.traits||[]).join(" ")).toLowerCase();
      return hay.indexOf(schoolSearchQuery.toLowerCase())>=0;
    });

    el("schoolResultCount").textContent="符合当前分数："+list.length+" 所";
    if(!list.length){
      el("schoolGrid").innerHTML="<div class=\"school-empty\">没有匹配的学校。可以切换本科/专科筛选或修改搜索词。</div>";
      return;
    }

    el("schoolGrid").innerHTML=list.map(function(s){
      var p=profileForSchool(s);
      var level=s.educationLevel||"本科";
      return "<button class=\"school-card\" data-school=\""+s.id+"\">"+
        "<div class=\"school-city\"><span class=\"education-badge "+(level==="专科"?"college":"")+"\">"+escapeHtml(level)+"</span>"+escapeHtml(s.city)+" · 游戏门槛 "+s.minScore+"+</div>"+
        "<div class=\"profile-label\">"+escapeHtml(p.name)+"</div>"+
        "<h3>"+escapeHtml(s.name)+"</h3>"+
        "<p>"+escapeHtml(s.flavor)+"</p>"+
        "<div class=\"school-tags\">"+p.tags.slice(0,3).map(function(t){return "<span>"+escapeHtml(t)+"</span>";}).join("")+"</div>"+
        "<div class=\"school-opportunity\">"+escapeHtml(s.program||"临床医学")+" · 机会密度 "+stars(p.opportunity)+" · 临床入口 "+stars(p.clinicalAccess)+"</div>"+
        "<div class=\"school-bottom\"><small>综合压力 "+stars(s.level)+"</small><b>选择这所学校 →</b></div>"+
      "</button>";
    }).join("");

    Array.prototype.forEach.call(document.querySelectorAll(".school-card"),function(card){
      card.addEventListener("click",function(){selectSchool(card.getAttribute("data-school"));});
    });
  }

  function showSchoolSelection(){
    if(!scoreLocked)return;
    showOnly("schoolScreen");
    var allowed=allowedEducationLevels(rollingScore);
    schoolLevelFilter=allowed.length===1?allowed[0]:"all";
    schoolSearchQuery="";
    el("schoolSearch").value="";
    Array.prototype.forEach.call(document.querySelectorAll("[data-level]"),function(btn){
      var level=btn.getAttribute("data-level");
      var valid=level==="all"?allowed.length>1:allowed.indexOf(level)>=0;
      btn.disabled=!valid;
      btn.classList.toggle("locked",!valid);
      btn.classList.toggle("active",valid&&level===schoolLevelFilter);
    });
    el("schoolScore").textContent=rollingScore;
    var band=getBand(rollingScore);
    el("bandCard").innerHTML="<strong>"+escapeHtml(band.label)+" · 可报："+allowedEducationLevels(rollingScore).join(" / ")+"</strong><span>"+escapeHtml(band.note)+" "+escapeHtml(educationRuleText(rollingScore))+"</span>";
    renderSchoolGrid();
    scrollAfterRender();
  }

  function directApply(stats,effects){
    Object.keys(effects||{}).forEach(function(k){
      if(statKeys.indexOf(k)>=0)stats[k]=(stats[k]||0)+effects[k];
    });
    statKeys.forEach(function(k){stats[k]=clamp(Math.round(stats[k]),0,100);});
  }

  function generateTalents(score,school,profile){
    var academic=45+(score-530)/8.8;
    var selectivity=(school.level-3)*1.5;
    var talents={
      memory:academic+selectivity+rand(-9,9),
      resilience:50+rand(-12,12)-(profile.competition-3),
      communication:50+rand(-14,14),
      dexterity:48+profile.clinicalAccess*2+rand(-12,12),
      researchSense:43+profile.opportunity*2.2+school.research*1.3+rand(-10,10),
      english:academic-2+profile.global*1.7+rand(-10,10)
    };
    Object.keys(talents).forEach(function(k){talents[k]=clamp(Math.round(talents[k]),28,88);});
    return talents;
  }

  function talentLabel(value){
    if(value>=76)return "天赋突出";
    if(value>=65)return "明显优势";
    if(value>=54)return "中上";
    if(value>=43)return "普通";
    return "需要后天补";
  }

  function renderTalents(){
    if(!state||!state.talents)return;
    el("talentGrid").innerHTML=Object.keys(SCHOOL_SYSTEM.talents).map(function(k){
      var meta=SCHOOL_SYSTEM.talents[k],v=state.talents[k];
      return "<div class=\"talent-card\">"+
        "<div class=\"talent-top\"><span>"+escapeHtml(meta.name)+"</span><strong>"+v+"</strong></div>"+
        "<div class=\"talent-track\"><div class=\"talent-fill\" style=\"width:"+v+"%\"></div></div>"+
        "<small>"+talentLabel(v)+" · "+escapeHtml(meta.desc)+"</small>"+
      "</div>";
    }).join("");
  }

  function selectSchool(id){
    var school=schoolById(id);
    if(!school)return;
    var d=DIFFICULTIES[selectedDifficulty],profile=profileForSchool(school);
    var allowed=allowedEducationLevels(rollingScore);
    if(allowed.indexOf(school.educationLevel||"本科")<0)return;
    var stats=Object.assign({},d.start);
    var bg=pendingBackground||compileBackground(readBirthSelection());
    directApply(stats,bg.mods);
    directApply(stats,school.mods);
    var profileId=profileIdForSchool(school);

    state={
      version:9,
      name:pendingName,
      background:bg,
      difficulty:selectedDifficulty,
      score:rollingScore,
      schoolId:id,
      profileId:profileId,
      talents:generateTalents(rollingScore,school,profile),
      stats:stats,
      flags:new Set(),
      scene:"__SIGNATURE__",
      pendingNext:(school.educationLevel==="专科"&&COLLEGE_DATA)?COLLEGE_DATA.entry:(CAREER_DATA.entryByProfile[profileId]||"fresh_growth"),
      visitedSide:new Set(),
      applications:{},
      educationHistory:{
        undergrad:{schoolId:school.id,schoolName:school.name,level:school.educationLevel||"本科",major:school.program||"临床医学"},
        master:null,phd:null,overseas:[]
      },
      eduApplication:null,
      pendingAdmissionResult:null,
      specialtyId:null,
      specialtyReturnNext:null,
      route:(school.educationLevel==="专科"?"专科·未分流":"本科·未分流"),
      signaturePending:false,
      log:[],
      finished:false
    };

    state.flags.add("schoolLevel"+school.level);
    state.flags.add("birthHometown_"+bg.selection.hometown);
    state.flags.add("birthEconomy_"+bg.selection.economy);
    state.flags.add("birthMedical_"+bg.selection.medicalFamily);
    state.flags.add("birthOnlyChild_"+bg.selection.onlyChild);
    state.flags.add("profile_"+profileId);
    if(state.score>=710)state.flags.add("gaokaoTop");
    if(state.score<575)state.flags.add("underdogStart");

    addLog("高考放榜",state.name+" 高考 "+state.score+" 分。");
    addLog("录取",state.name+" 选择了 "+school.name+" 临床医学专业。");
    addLog("培养生态","你的学校生态为「"+profile.name+"」，第一章将按该生态进入不同剧情。");

    el("letterSchool").textContent=school.name;
    el("letterSchoolInline").textContent=school.name;
    el("letterName").textContent=state.name;
    el("letterScore").textContent=state.score;
    el("letterProgram").textContent="专业："+(school.program||"临床医学");
    el("letterProgramInline").textContent=school.program||"临床医学";
    el("letterLevel").textContent="层次："+(school.educationLevel||"本科");
    el("letterDuration").textContent="学制："+(school.duration||"游戏模拟");
    el("birthSummaryCard").innerHTML=
      "<strong>出生档案：</strong><br>"+
      escapeHtml(bg.labels.hometown)+" · "+escapeHtml(bg.labels.onlyChild)+" · "+escapeHtml(bg.labels.economy)+" · "+
      escapeHtml(bg.labels.education)+" · "+escapeHtml(bg.labels.medicalFamily)+
      "<br>资源：信息 "+resourceWord(bg.resources.infoAccess)+" · 经济 "+resourceWord(bg.resources.finance)+" · 家庭支持 "+resourceWord(bg.resources.familySupport)+" · 医学信息 "+resourceWord(bg.resources.medicalInfo);
    el("schoolEffectSummary").innerHTML=
      "<strong>学校会改变实际事件树：</strong><br>"+
      "综合压力 ×"+(school.pressure*profile.negativeScale).toFixed(2)+
      " · 机会密度 "+stars(profile.opportunity)+
      " · 临床入口 "+stars(profile.clinicalAccess)+
      " · 国际/交叉 "+stars(profile.global)+
      "<br>你进入大学后的第一道题将由「"+escapeHtml(profile.name)+"」决定。"+
      "<br><span style=\"color:#8a7d70\">"+escapeHtml(SCHOOL_SYSTEM.disclaimer)+"</span>";

    el("profileName").textContent=profile.name;
    el("profileDesc").textContent=profile.desc;
    el("profileTags").innerHTML=profile.tags.map(function(t){return "<span>"+escapeHtml(t)+"</span>";}).join("");
    renderTalents();

    showOnly("letterScreen");saveState();
    scrollAfterRender();
  }

  function enterUniversity(){
    if(!state)return;
    showOnly("gameScreen");el("restartBtn").hidden=false;render();
    scrollAfterRender();
  }

  function schoolPressure(){
    var s=currentSchool(),p=currentProfile();
    return s?s.pressure*p.negativeScale:1;
  }

  function specialtyPressure(){
    var s=currentSpecialty();
    if(!s||!s.metrics)return 1;
    var stage=(allEvents()[state.scene]&&allEvents()[state.scene].stage)||"";
    if(!/研究生|临床|规培|住院|博士|职业|高级职称|主治|科室/.test(stage))return 1;
    return 0.96+(s.metrics.pressure||3)*0.018+(s.metrics.night||3)*0.010;
  }

  function clampStats(){
    statKeys.forEach(function(k){state.stats[k]=clamp(Math.round(state.stats[k]),0,100);});
  }

  function applyEffects(effects){
    effects=effects||{};
    var scale=DIFFICULTIES[state.difficulty].negativeScale*schoolPressure()*specialtyPressure();
    Object.keys(effects).forEach(function(k){
      if(statKeys.indexOf(k)<0)return;
      var v=effects[k],delta=v<0?v*scale:v;
      state.stats[k]=(state.stats[k]||0)+delta;
    });
    clampStats();
  }

  function applyTalentEffects(effects){
    if(!effects||!state.talents)return;
    Object.keys(effects).forEach(function(k){
      if(state.talents[k]===undefined)return;
      state.talents[k]=clamp(Math.round(state.talents[k]+effects[k]),20,95);
    });
  }

  function effectText(effects){
    effects=effects||{};
    return Object.keys(effects).filter(function(k){return statKeys.indexOf(k)>=0;}).map(function(k){
      var v=effects[k];
      return statNames[k]+" "+(v>0?"+":"")+v;
    }).join(" · ");
  }

  function metricValue(k){
    if(state.stats&&state.stats[k]!==undefined)return state.stats[k];
    if(state.talents&&state.talents[k]!==undefined)return state.talents[k];
    var p=currentProfile();
    if(k==="globalAccess")return (p.global||1)*18;
    if(k==="schoolOpportunity")return (p.opportunity||1)*18;
    if(k==="clinicalAccess")return (p.clinicalAccess||1)*18;
    if(k==="schoolCompetition")return (p.competition||1)*18;
    if(state.background&&state.background.resources){
      var br=state.background.resources;
      if(k==="finance")return (br.finance||3)*18;
      if(k==="infoAccess")return (br.infoAccess||3)*18;
      if(k==="familySupport")return (br.familySupport||3)*18;
      if(k==="medicalInfo")return (br.medicalInfo||1)*18;
      if(k==="familyPressure")return (br.familyPressure||3)*18;
    }
    return 50;
  }

  function requirementsMet(req){
    if(!req)return true;
    if(req.stats){
      if(!Object.keys(req.stats).every(function(k){return metricValue(k)>=req.stats[k];}))return false;
    }
    if(req.talents){
      if(!Object.keys(req.talents).every(function(k){return metricValue(k)>=req.talents[k];}))return false;
    }
    if(req.flags&&!req.flags.every(function(f){return state.flags.has(f);})){return false;}
    if(req.schoolLevel){
      var school=currentSchool();
      if(!school||school.level<req.schoolLevel)return false;
    }
    return true;
  }

  function choiceVisible(choice){
    if(choice.showIfFlags&&!choice.showIfFlags.every(function(f){return state.flags.has(f);})){return false;}
    if(choice.hideIfFlags&&choice.hideIfFlags.some(function(f){return state.flags.has(f);})){return false;}
    return true;
  }

  function requirementText(req){
    if(!req)return "";
    var parts=[];
    if(req.stats)Object.keys(req.stats).forEach(function(k){parts.push((statNames[k]||k)+"≥"+req.stats[k]);});
    if(req.talents)Object.keys(req.talents).forEach(function(k){
      var m=SCHOOL_SYSTEM.talents[k];parts.push((m?m.name:k)+"≥"+req.talents[k]);
    });
    if(req.flags)parts.push("需要前置经历");
    if(req.schoolLevel)parts.push("需要院校等级 "+req.schoolLevel+"+");
    return parts.join("、");
  }

  function resolveChance(chance){
    if(!chance)return null;
    var p=chance.p;
    if(chance.bonusBy&&chance.bonusBy.length){
      var avg=chance.bonusBy.reduce(function(sum,k){return sum+metricValue(k);},0)/chance.bonusBy.length;
      p+=(avg-50)/220;
    }
    p=clamp(p,.08,.92);
    var success=Math.random()<p;
    applyEffects(success?chance.success:chance.fail);
    (success?(chance.successFlags||[]):(chance.failFlags||[])).forEach(function(f){state.flags.add(f);});
    addLog(success?"申请成功 / 幸运事件":"申请失败 / 挫折事件",
      success?"这一次，能力、准备和运气都站在了你这边。":"结果没有如愿。这个失败会留下痕迹，但不会直接结束人生。");
    return success;
  }

  function addLog(title,text){state.log.unshift({title:title,text:text});}

  function signatureOptions(kind){
    var research=["open_research","academic_seminar","research_track","research_winter"];
    var clinical=["hospital_network","case_center","clinical_round","multi_hospital","city_rotation","clinical_foundation","specialty_exposure","clinical_city","clinical_skill","clinical_ground"];
    var regional=["regional_center","regional_service"];
    if(kind==="college_skill"){
      return [
        {text:"报名高强度技能实训",sub:"动手会涨得很快，但三年制时间本来就紧。",effects:{knowledge:4,energy:-4},talentEffects:{dexterity:3},flags:["collegeSignatureSkill"],next:"__RETURN__"},
        {text:"把更多时间留给专升本准备",sub:"技能保证过关，理论和英语优先。",effects:{knowledge:5,mental:-1},talentEffects:{english:1},flags:["collegeSignatureUpgrade"],next:"__RETURN__"}
      ];
    }
    if(kind==="college_clinic"){
      return [
        {text:"争取更早进临床实践",sub:"病例和沟通经验会提前积累。",effects:{knowledge:4,reputation:4,energy:-3},talentEffects:{communication:2,dexterity:1},flags:["collegeSignatureClinic"],next:"__RETURN__"},
        {text:"先稳住理论与升学基础",sub:"三年很短，考试准备也不能掉。",effects:{knowledge:6,mental:2},flags:["collegeSignatureFoundation"],next:"__RETURN__"}
      ];
    }
    if(kind==="college_service"){
      return [
        {text:"参加基层医疗实践",sub:"更早理解真实医疗需求和资源限制。",effects:{knowledge:4,reputation:5,energy:-2},talentEffects:{communication:2,resilience:1},flags:["collegeSignatureService"],next:"__RETURN__"},
        {text:"优先准备学历提升",sub:"先争取下一张入场券。",effects:{knowledge:5,mental:-1},talentEffects:{english:1},flags:["collegeSignatureUpgrade"],next:"__RETURN__"}
      ];
    }
    if(kind==="cross_ai"||kind==="innovation_eye"){
      return [
        {text:"抓住交叉机会",sub:"补技术短板，进入新赛道。",effects:{research:7,knowledge:4,energy:-5},talentEffects:{researchSense:2,english:1},flags:["signatureOpportunity","crossDiscipline"],next:"__RETURN__"},
        {text:"先把医学基础打牢",sub:"暂时不让新方向打乱节奏。",effects:{knowledge:6,mental:2},flags:["foundationFirst"],next:"__RETURN__"}
      ];
    }
    if(kind==="exam_jump"){
      return [
        {text:"现在就开始规划平台跃迁",sub:"提前准备英语和专业课。",effects:{knowledge:6,energy:-3,mental:-2},talentEffects:{resilience:1},flags:["examEarly"],next:"__RETURN__"},
        {text:"本科先做到年级前列",sub:"用成绩换未来选择权。",effects:{knowledge:7,energy:-4},flags:["gradeFirst"],next:"__RETURN__"}
      ];
    }
    if(kind==="resource_hunt"){
      return [
        {text:"主动敲门争取资源",sub:"机会不会自动出现。",effects:{research:4,reputation:3,mental:-2},chance:{p:.5,bonusBy:["communication","knowledge"],success:{research:5,mental:4},fail:{mental:-2},successFlags:["selfMadeOpportunity"],failFlags:["resourceMiss"]},next:"__RETURN__"},
        {text:"先把成绩做起来",sub:"以后用硬成绩换机会。",effects:{knowledge:7,energy:-3},flags:["gradeFirst"],next:"__RETURN__"}
      ];
    }
    if(research.indexOf(kind)>=0){
      return [
        {text:"立即报名",sub:"早点进科研环境，早点知道自己适不适合。",effects:{research:8,energy:-5,mental:-2},talentEffects:{researchSense:2},flags:["signatureOpportunity","earlyResearch"],next:"__RETURN__"},
        {text:"先旁听和观察",sub:"不急着绑定导师。",effects:{knowledge:3,research:3,mental:2},flags:["researchObserver"],next:"__RETURN__"}
      ];
    }
    if(clinical.indexOf(kind)>=0){
      return [
        {text:"争取进入",sub:"临床机会多，但名额通常也很抢。",effects:{knowledge:7,reputation:4,energy:-4},talentEffects:{dexterity:2,communication:1},flags:["signatureOpportunity","earlyClinical"],next:"__RETURN__"},
        {text:"先把基础课打牢",sub:"等自己准备得更好再上。",effects:{knowledge:6,mental:2},flags:["foundationFirst"],next:"__RETURN__"}
      ];
    }
    if(regional.indexOf(kind)>=0){
      return [
        {text:"参加实践",sub:"从真实医疗需求里学。",effects:{knowledge:5,reputation:5,energy:-3},talentEffects:{communication:2,resilience:1},flags:["regionalClinical"],next:"__RETURN__"},
        {text:"把时间留给升学准备",sub:"下一次考试也很关键。",effects:{knowledge:5,mental:1},flags:["platformAmbition"],next:"__RETURN__"}
      ];
    }
    return [
      {text:"抓住这个机会",sub:"学校生态会把你推向新的方向。",effects:{knowledge:4,research:4,reputation:3,energy:-4},flags:["signatureOpportunity"],next:"__RETURN__"},
      {text:"保持自己的节奏",sub:"不是所有机会都必须抓。",effects:{mental:5,knowledge:3},flags:["selfPaced"],next:"__RETURN__"}
    ];
  }

  function signatureEventForSchool(){
    var s=currentSchool();
    if(!s)return null;
    var sig=SCHOOL_SYSTEM.signatures[s.id];
    if(!sig&&s.signatureKind){
      sig={kind:s.signatureKind,title:s.signatureTitle||"你的第一项院校机会",desc:s.signatureDesc||"这所学校给了你一个不同于其他平台的开局机会。"};
    }
    if(!sig)return null;
    return {
      stage:"院校专属 · "+s.name,
      year:(s.educationLevel==="专科"?"18-19岁":"18-21岁"),
      title:sig.title,type:"school",
      text:sig.desc,choices:signatureOptions(sig.kind)
    };
  }

  function specialtySelectionEvent(){
    if(!state||!SPECIALTY_DATA||state.scene.indexOf("specialty_select_")!==0)return null;
    var modeId=state.scene.replace("specialty_select_","");
    var mode=SPECIALTY_DATA.selectionModes[modeId];
    if(!mode)return null;
    return {
      stage:mode.stage,year:mode.year,title:mode.title,type:"specialtySelect",critical:true,warning:mode.warning,
      text:"这不是装饰性选择。不同科室会改变夜班、操作、科研、生活节奏和后续专属事件。",
      choices:Object.keys(SPECIALTY_DATA.specialties).map(function(id){
        var s=SPECIALTY_DATA.specialties[id];
        return {
          text:s.icon+" "+s.name,
          sub:s.desc,
          specialtyId:id,
          specialtyMode:modeId,
          next:mode.next,
          specialtyMetrics:s.metrics,
          route:mode.routePrefix+"·"+s.name+(modeId==="clinical_master"?"（并轨规培）":"")
        };
      })
    };
  }


  function findEduSchool(id){
    if(!EDUCATION_DATA)return null;
    var pools=["masterDomestic","masterOverseas","phdDomestic","phdOverseas"];
    for(var i=0;i<pools.length;i++){
      var found=(EDUCATION_DATA[pools[i]]||[]).find(function(s){return s.id===id;});
      if(found)return found;
    }
    return null;
  }

  function eduSchoolChoices(list,nextScene){
    return (list||[]).map(function(s){
      return {
        text:s.name,
        sub:(s.city||s.region||"")+" · 申请难度 "+stars(s.difficulty||3)+(s.tags?" · "+s.tags.join(" / "):""),
        eduSchoolId:s.id,
        next:nextScene
      };
    });
  }

  function eduSpecialtyChoices(nextScene){
    return Object.keys(SPECIALTY_DATA.specialties).map(function(id){
      var s=SPECIALTY_DATA.specialties[id];
      return {
        text:s.icon+" "+s.name,
        sub:s.desc,
        eduSpecialtyId:id,
        next:nextScene,
        specialtyMetrics:s.metrics
      };
    });
  }

  function educationApplicationEvent(){
    if(!state||!EDUCATION_DATA||state.scene.indexOf("edu_")!==0)return null;
    var scene=state.scene;
    var a=state.eduApplication||{};

    if(scene==="edu_master_recommend_type"||scene==="edu_master_exam_type"){
      var source=scene==="edu_master_recommend_type"?"recommend":"exam";
      return {
        stage:source==="recommend"?"推免申请 · 选择培养类型":"考研申请 · 选择培养类型",year:"23岁",title:"先决定你申请哪一种硕士",type:"educationApply",critical:true,
        warning:"临床专硕与规培并轨；学硕以科研训练为主。两者后面的生活完全不同。",
        text:"录取不是一个按钮。你还需要选择学校、专业/科室，完成准备与复试，然后等待最终结果。",
        choices:[
          {text:"临床医学专业型硕士",sub:"研究生培养与规培并轨，临床训练和毕业要求同时推进。",eduStart:{level:"master",source:source},eduMasterType:"clinical_master",effects:{knowledge:2},next:"edu_master_school"},
          {text:"学术型硕士",sub:"科研训练优先，不自动完成规培；以后回临床需要再衔接规培。",eduStart:{level:"master",source:source},eduMasterType:"academic_master",effects:{research:2},next:"edu_master_school"},
          {text:"直博 / 长学制科研申请",sub:"仅在推免路线开放；仍然要选博士院校、学科、研究方向、准备材料和面试。",showIfFlags:["recommendApplicant"],requires:{stats:{research:35}},flags:["directPhdCandidate"],effects:{research:3,energy:-2},next:"edu_phd_direct_school"}
        ]
      };
    }

    if(scene==="edu_master_school"){
      return {stage:"硕士申请 1/5 · 目标院校",year:"23岁",title:"选择你的目标硕士院校",type:"educationSchool",
        text:"学校越难，录取概率越低，但平台和后续机会也可能更强。以下难度仅用于游戏。",
        choices:eduSchoolChoices(EDUCATION_DATA.masterDomestic,"edu_master_specialty")};
    }

    if(scene==="edu_master_specialty"){
      return {stage:"硕士申请 2/5 · 专业方向",year:"23岁",title:"选择报考专业 / 科室",type:"educationApply",
        text:"这一步不仅影响复试，也会在录取后决定你的专属训练事件池。",
        choices:eduSpecialtyChoices("edu_master_prepare")};
    }

    if(scene==="edu_master_prepare"){
      var rec=a.source==="recommend";
      return {stage:"硕士申请 3/5 · "+(rec?"材料准备":"初试备考"),year:"23岁",title:rec?"推免材料最后怎么准备？":"备考进入最后阶段",type:"educationApply",
        text:rec?"成绩、科研、推荐和面试材料都要在有限时间里完成。":"专业课、英语和临床实习同时抢你的时间。",
        choices:[
          {text:rec?"集中打磨科研与个人陈述":"全力冲刺，压缩实习和社交",sub:"准备增益最高，但消耗最大。",effects:{knowledge:rec?2:7,research:rec?5:1,energy:-6,mental:-3},eduPrepAdd:22,next:"edu_master_interview"},
          {text:rec?"突出综合表现与推荐":"课程、实习和备考保持平衡",sub:"更稳健，但峰值准备略低。",effects:{knowledge:4,reputation:3,energy:-4},eduPrepAdd:15,next:"edu_master_interview"},
          {text:rec?"主打临床经历":"保住状态，重点抓高频内容",sub:"消耗最低，结果更依赖已有基础。",effects:{knowledge:3,reputation:2,mental:2},eduPrepAdd:9,next:"edu_master_interview"}
        ]
      };
    }

    if(scene==="edu_master_interview"){
      return {stage:"硕士申请 4/5 · 复试 / 面试",year:"23岁",title:"老师开始问你：为什么选择这个专业？",type:"educationApply",
        text:"目标学校、专业、前期准备和现场表达都会影响最后的录取概率。",
        choices:[
          {text:"结构化回答：临床兴趣 + 未来规划",sub:"知识与沟通更加重要。",effects:{mental:-2,reputation:2},talentEffects:{communication:1},eduPrepAdd:10,next:"edu_master_result"},
          {text:"重点讲科研经历和问题意识",sub:"科研型履历更占优势。",effects:{mental:-2,research:2},talentEffects:{researchSense:1},eduPrepAdd:10,next:"edu_master_result"},
          {text:"诚实回答不足，但说明如何补齐",sub:"抗压和表达决定效果。",effects:{mental:-1},talentEffects:{resilience:1,communication:1},eduPrepAdd:7,next:"edu_master_result"}
        ]
      };
    }

    if(scene==="edu_master_result"){
      return {stage:"硕士申请 5/5 · 录取查询",year:"23岁",title:"招生系统开放了",type:"educationResult",
        text:"你的目标学校、专业和前面每一步准备已经锁定。现在只剩最后一件事：查询结果。",
        choices:[{text:"查询硕士录取结果",sub:"点击后会进入 3 秒查询窗口，结果不会在倒计时期间重新抽取。",admissionQuery:"master"}]};
    }

    if(scene==="edu_master_overseas_school"){
      if(!state.eduApplication||state.eduApplication.level!=="overseas_master")state.eduApplication={level:"overseas_master",source:"overseas",prep:0};
      return {stage:"海外申请 1/5 · 目标院校",year:"23岁",title:"选择你要申请的海外院校",type:"educationSchool",
        text:"不同国家和学校的实际项目设置差异很大；这里是游戏化研究型升学池。",
        choices:eduSchoolChoices(EDUCATION_DATA.masterOverseas,"edu_master_overseas_specialty")};
    }

    if(scene==="edu_master_overseas_specialty"){
      return {stage:"海外申请 2/5 · 医学方向",year:"23岁",title:"你希望围绕哪个医学方向申请？",type:"educationApply",
        text:"方向会写入你的教育档案，并影响后续科研/职业事件。",
        choices:eduSpecialtyChoices("edu_master_overseas_direction")};
    }

    if(scene==="edu_master_overseas_direction"){
      return {stage:"海外申请 3/5 · 研究方向",year:"23岁",title:"选择更具体的研究方向",type:"educationApply",
        text:"海外研究型项目更看重研究匹配度、英语、推荐与既往经历。",
        choices:EDUCATION_DATA.researchDirections.map(function(d){
          return {text:d.name,sub:d.desc,eduDirectionId:d.id,effects:{research:2},next:"edu_master_overseas_prepare"};
        })
      };
    }

    if(scene==="edu_master_overseas_prepare"){
      return {stage:"海外申请 4/5 · 材料与面试",year:"23岁",title:"CV、推荐信和个人陈述怎么分配精力？",type:"educationApply",
        text:"你不可能把所有材料都做到无限精细。",
        choices:[
          {text:"强推研究匹配与已有成果",sub:"科研和导师匹配优先。",effects:{research:4,energy:-5},eduPrepAdd:20,next:"edu_master_overseas_result"},
          {text:"重点打磨英语表达和面试",sub:"提高现场表现。",effects:{energy:-4},talentEffects:{english:2,communication:2},eduPrepAdd:18,next:"edu_master_overseas_result"},
          {text:"平衡准备，减少经济和时间消耗",sub:"更稳但峰值略低。",effects:{money:-2,mental:2},eduPrepAdd:11,next:"edu_master_overseas_result"}
        ]
      };
    }

    if(scene==="edu_master_overseas_result"){
      return {stage:"海外申请 5/5 · Offer 查询",year:"23岁",title:"申请门户状态更新了",type:"educationResult",
        text:"目标院校已经完成评审。现在查询最终结果。",
        choices:[{text:"查询海外项目录取结果",sub:"3 秒后显示 Offer 或未录取。",admissionQuery:"overseas_master"}]};
    }

    if(scene==="edu_phd_domestic_school"||scene==="edu_phd_overseas_school"||scene==="edu_phd_direct_school"){
      var sourcePhd=scene==="edu_phd_overseas_school"?"overseas":scene==="edu_phd_direct_school"?"direct":"domestic";
      if(!state.eduApplication||state.eduApplication.level!=="phd"||state.eduApplication.source!==sourcePhd){
        state.eduApplication={level:"phd",source:sourcePhd,prep:0};
      }
      var pool=sourcePhd==="overseas"?EDUCATION_DATA.phdOverseas:EDUCATION_DATA.phdDomestic;
      return {stage:"博士申请 1/5 · 目标院校",year:sourcePhd==="direct"?"23-24岁":"26-28岁",
        title:sourcePhd==="direct"?"选择直博目标院校":sourcePhd==="overseas"?"选择海外博士目标院校":"选择国内博士目标院校",type:"educationSchool",
        text:"博士录取不会直接发生。学校难度、导师/方向匹配、科研积累、材料和面试都会参与最终判定。",
        choices:eduSchoolChoices(pool,"edu_phd_specialty")};
    }

    if(scene==="edu_phd_specialty"){
      return {stage:"博士申请 2/5 · 学科方向",year:"博士申请阶段",title:"博士阶段准备在哪个医学学科继续？",type:"educationApply",
        text:"你可以沿用硕士方向，也可以在申博时改变学科。",
        choices:eduSpecialtyChoices("edu_phd_direction")};
    }

    if(scene==="edu_phd_direction"){
      return {stage:"博士申请 3/5 · 研究方向",year:"博士申请阶段",title:"你准备把博士几年押在哪类问题上？",type:"educationApply",
        text:"研究方向会影响导师匹配、申请概率和之后博士事件。",
        choices:EDUCATION_DATA.researchDirections.map(function(d){
          return {text:d.name,sub:d.desc,eduDirectionId:d.id,effects:{research:3,energy:-1},eduPrepAdd:6,next:"edu_phd_prepare"};
        })
      };
    }

    if(scene==="edu_phd_prepare"){
      return {stage:"博士申请 4/5 · 导师与材料",year:"博士申请阶段",title:"联系导师以后，对方回复：请发一份研究计划",type:"educationApply",
        text:"论文只是材料之一。导师匹配、研究计划、推荐和既往成果共同决定你能不能进入面试。",
        choices:[
          {text:"针对导师方向重写研究计划",sub:"匹配度最高，也最耗时间。",effects:{research:4,energy:-5,mental:-2},eduPrepAdd:22,next:"edu_phd_interview"},
          {text:"突出自己已有成果与独立性",sub:"已有科研越强越有利。",effects:{research:3,reputation:2,energy:-4},eduPrepAdd:17,next:"edu_phd_interview"},
          {text:"强调临床问题与转化价值",sub:"知识、临床和沟通更重要。",effects:{knowledge:3,reputation:3,energy:-3},eduPrepAdd:14,next:"edu_phd_interview"}
        ]
      };
    }

    if(scene==="edu_phd_interview"){
      return {stage:"博士申请 5/6 · 面试",year:"博士申请阶段",title:"面试老师问：如果你的核心假设错了怎么办？",type:"educationApply",
        text:"博士面试更看问题意识、科研独立性和应对不确定性的能力。",
        choices:[
          {text:"解释替代假设和备选实验",sub:"科研直觉与逻辑优先。",effects:{research:2,mental:-2},talentEffects:{researchSense:2},eduPrepAdd:11,next:"edu_phd_result"},
          {text:"承认风险，并说明如何缩小问题",sub:"强调可行性与韧性。",effects:{mental:-1},talentEffects:{resilience:2},eduPrepAdd:9,next:"edu_phd_result"},
          {text:"把问题重新拉回临床意义",sub:"适合转化/临床研究方向。",effects:{knowledge:2,reputation:2},talentEffects:{communication:1},eduPrepAdd:8,next:"edu_phd_result"}
        ]
      };
    }

    if(scene==="edu_phd_result"){
      return {stage:"博士申请 6/6 · 录取查询",year:"博士申请阶段",title:"博士申请系统状态变成：Decision Available",type:"educationResult",
        text:"导师、院校、研究方向、科研积累和面试已经全部进入最终结果。",
        choices:[{text:"查询博士录取结果",sub:"3 秒后显示正式结果。",admissionQuery:"phd"}]};
    }

    if(scene==="edu_phd_fail"){
      return {stage:"博士申请 · 未录取后",year:"博士申请阶段",title:"这一次没有拿到博士录取",type:"key",critical:true,
        warning:"申博失败不会自动让你失去硕士学历和已有临床/科研积累。",
        text:"你可以换学校再申请，也可以结束学生身份进入下一阶段。",
        choices:[
          {text:"换一所学校再申请",sub:"保留原来的科研积累，但重新选择目标院校。",effects:{mental:-2,energy:-2},flags:["phdRetry"],next:(a.source==="overseas"?"edu_phd_overseas_school":"edu_phd_domestic_school")},
          {text:"停止申博，临床专硕毕业去工作",sub:"已经完成并轨规培，直接进入求职。",showIfFlags:["clinicalMaster"],effects:{mental:4,money:3},flags:["noPhd"],next:"clinical_master_finish"},
          {text:"停止申博，学硕毕业回临床规培",sub:"先选/沿用科室，再进入规培。",showIfFlags:["academicMaster"],effects:{mental:4,money:2},flags:["noPhd"],next:"resident_entry"},
          {text:"转向科研助理 / 研究岗位",sub:"先积累成果，未来仍可再次申请。",effects:{research:5,money:2,mental:2},flags:["researchJob"],next:"young_attending"}
        ]
      };
    }

    return null;
  }

  function educationAdmissionProbability(){
    var a=state.eduApplication||{},school=a.school||{},difficulty=school.difficulty||3;
    var p=0.68-difficulty*0.075;
    if(a.level==="master"){
      p+=(metricValue("knowledge")-50)/250;
      p+=(metricValue("english")-50)/520;
      p+=(metricValue("reputation")-50)/650;
      if(a.masterType==="academic_master")p+=(metricValue("research")-50)/380;
      if(a.source==="recommend")p+=0.08;
      if(state.flags.has("secondTry"))p+=0.05;
    }else if(a.level==="overseas_master"){
      p=0.59-difficulty*0.065;
      p+=(metricValue("english")-50)/250;
      p+=(metricValue("research")-50)/360;
      p+=(metricValue("communication")-50)/600;
    }else if(a.level==="phd"){
      p=0.57-difficulty*0.067;
      p+=(metricValue("research")-50)/210;
      p+=(metricValue("researchSense")-50)/330;
      p+=(metricValue("reputation")-50)/500;
      if(a.source==="overseas")p+=(metricValue("english")-50)/270;
      if(a.source==="direct")p-=0.04;
      if(state.flags.has("phdRetry"))p+=0.04;
    }
    p+=(a.prep||0)/260;
    return clamp(p,.10,.90);
  }

  function admissionProgramLabel(a){
    if(a.level==="master")return a.masterType==="clinical_master"?"临床医学专业型硕士":"学术型硕士";
    if(a.level==="overseas_master")return "海外研究型硕士 / 研究项目";
    if(a.level==="phd")return a.source==="direct"?"直博项目":a.source==="overseas"?"海外博士":"国内博士";
    return "研究生项目";
  }

  function admissionSpecialtyLabel(a){
    var s=a.specialtyId&&SPECIALTY_DATA.specialties[a.specialtyId];
    return s?s.name:"医学相关方向";
  }

  function admissionDirectionLabel(a){
    var d=(EDUCATION_DATA.researchDirections||[]).find(function(x){return x.id===a.directionId;});
    return d?d.name:"";
  }

  function startAdmissionQuery(){
    var a=state.eduApplication;
    if(!a||!a.school)return;
    var probability=educationAdmissionProbability();
    var success=Math.random()<probability;
    state.pendingAdmissionResult={
      success:success,
      probability:probability,
      level:a.level,
      source:a.source,
      school:a.school,
      masterType:a.masterType||null,
      specialtyId:a.specialtyId||null,
      directionId:a.directionId||null
    };
    saveState();

    el("admissionOverlay").hidden=false;
    el("admissionSearching").hidden=false;
    el("admissionResult").hidden=true;
    el("admissionQuerySchool").textContent="正在查询 "+a.school.name+" · "+admissionProgramLabel(a);
    el("admissionCountdown").textContent="3";
    el("admissionQueryBar").style.width="8%";
    document.body.classList.add("modal-open");

    var remaining=3;
    var step=0;
    var timer=setInterval(function(){
      remaining-=1;step+=1;
      el("admissionCountdown").textContent=Math.max(0,remaining);
      el("admissionQueryBar").style.width=(8+step*30)+"%";
      if(remaining<=0){
        clearInterval(timer);
        el("admissionQueryBar").style.width="100%";
        setTimeout(revealAdmissionResult,260);
      }
    },900);
  }

  function revealAdmissionResult(){
    var r=state.pendingAdmissionResult;
    if(!r)return;
    el("admissionSearching").hidden=true;
    el("admissionResult").hidden=false;
    var a=state.eduApplication||r;
    var spec=admissionSpecialtyLabel(a);
    var direction=admissionDirectionLabel(a);
    el("admissionResult").classList.toggle("is-success",r.success);
    el("admissionResult").classList.toggle("is-fail",!r.success);
    el("admissionResultIcon").textContent=r.success?"✓":"×";
    el("admissionResultTitle").textContent=r.success?"恭喜录取":"很遗憾，未被录取";
    el("admissionResultText").textContent=r.success
      ?("你已被 "+r.school.name+" "+admissionProgramLabel(a)+" 录取。")
      :("这一次，"+r.school.name+" 没有向你发出录取通知。");
    el("admissionResultMeta").innerHTML=
      "<span>目标院校<strong>"+escapeHtml(r.school.name)+"</strong></span>"+
      "<span>方向<strong>"+escapeHtml(spec+(direction?" · "+direction:""))+"</strong></span>"+
      "<span>本局估算竞争概率<strong>"+Math.round(r.probability*100)+"%</strong></span>";
    el("admissionResultBtn").textContent=r.success?"确认录取 · 写入教育档案":"确认结果 · 继续下一步";
  }

  function confirmAdmissionResult(){
    var r=state&&state.pendingAdmissionResult;
    if(!r)return;
    var a=state.eduApplication||r;
    var specObj=a.specialtyId&&SPECIALTY_DATA.specialties[a.specialtyId];
    var specName=specObj?specObj.name:"医学相关方向";
    var dirName=admissionDirectionLabel(a);

    if(r.success){
      if(a.level==="master"){
        state.specialtyId=a.specialtyId;
        state.flags.add("masterOffer");
        if(a.source==="recommend")state.flags.add("recommended");
        if(a.masterType==="clinical_master"){
          state.flags.add("clinicalMaster");state.flags.add("integratedResidency");
          state.route="研究生·"+r.school.name+"·"+specName+"临床专硕（并轨规培）";
        }else{
          state.flags.add("academicMaster");
          state.route="研究生·"+r.school.name+"·"+specName+"学硕";
        }
        state.educationHistory.master={
          schoolId:r.school.id,schoolName:r.school.name,type:a.masterType==="clinical_master"?"临床专硕（并轨规培）":"学术型硕士",
          specialty:specName,region:r.school.city||"",source:a.source
        };
        addLog("硕士录取","被 "+r.school.name+" "+specName+" "+(a.masterType==="clinical_master"?"临床专硕":"学硕")+" 录取。");
        state.specialtyReturnNext=a.masterType==="clinical_master"?"clinical_master":"academic_master";
        state.scene=specObj?specObj.intro:(a.masterType==="clinical_master"?"clinical_master":"academic_master");
      }else if(a.level==="overseas_master"){
        state.specialtyId=a.specialtyId;
        state.flags.add("overseasOffer");
        state.route="海外升学·"+r.school.name+"·"+specName;
        state.educationHistory.master={schoolId:r.school.id,schoolName:r.school.name,type:"海外研究型项目",specialty:specName,region:r.school.region||"",source:"overseas"};
        state.educationHistory.overseas.push({level:"硕士/研究项目",schoolName:r.school.name,region:r.school.region||"",detail:specName+(dirName?" · "+dirName:"")});
        addLog("海外录取","收到 "+r.school.name+" 的录取 Offer。");
        state.scene="overseas_postgrad";
      }else if(a.level==="phd"){
        state.specialtyId=a.specialtyId;
        if(a.source==="overseas")state.flags.add("phdOverseas");
        else if(a.source==="direct")state.flags.add("directPhdOffer");
        else state.flags.add("phdDomestic");
        state.route="博士·"+r.school.name+"·"+specName;
        state.educationHistory.phd={
          schoolId:r.school.id,schoolName:r.school.name,type:a.source==="direct"?"直博":a.source==="overseas"?"海外博士":"国内博士",
          specialty:specName,direction:dirName,region:r.school.city||r.school.region||""
        };
        if(a.source==="overseas")state.educationHistory.overseas.push({level:"博士",schoolName:r.school.name,region:r.school.region||"",detail:specName+(dirName?" · "+dirName:"")});
        addLog("博士录取","被 "+r.school.name+" "+specName+" 博士项目录取。");
        state.specialtyReturnNext=a.source==="direct"?"direct_phd":"phd_year1";
        state.scene=specObj?specObj.intro:(a.source==="direct"?"direct_phd":"phd_year1");
      }
    }else{
      if(a.level==="master"){
        if(a.source==="recommend"){state.flags.add("recommendFailed");state.scene="edu_master_exam_type";}
        else{state.flags.add("examFailed");state.scene="exam_fail_choice";}
        applyEffects({mental:-5});
        addLog("硕士未录取",r.school.name+" 本轮未录取。");
      }else if(a.level==="overseas_master"){
        state.flags.add("overseasRejected");
        applyEffects({mental:-4,money:-2});
        state.scene="edu_master_exam_type";
        addLog("海外申请未录取",r.school.name+" 本轮未发出 Offer。");
      }else if(a.level==="phd"){
        if(a.source==="direct")state.flags.add("directPhdMiss");
        else if(a.source==="overseas")state.flags.add("phdOverseasFail");
        else state.flags.add("phdDomesticFail");
        applyEffects({mental:-6});
        state.scene=a.source==="direct"?"edu_master_exam_type":"edu_phd_fail";
        addLog("博士未录取",r.school.name+" 本轮博士申请未录取。");
      }
    }

    state.pendingAdmissionResult=null;
    if(state.scene.indexOf("edu_")!==0)state.eduApplication=null;
    el("admissionOverlay").hidden=true;
    document.body.classList.remove("modal-open");
    saveState();render();scrollAfterRender();
  }

  function activeOpportunityEvent(){
    if(!state||!state.activeOpportunity||!OPPORTUNITY_DATA)return null;
    var flow=OPPORTUNITY_DATA.flows[state.activeOpportunity.id];
    if(!flow)return null;
    return flow.steps[state.activeOpportunity.step]||null;
  }

  function allEvents(){
    var merged={};
    Object.keys(CAREER_EVENTS).forEach(function(k){merged[k]=CAREER_EVENTS[k];});
    if(COLLEGE_DATA)Object.keys(COLLEGE_DATA.events).forEach(function(k){merged[k]=COLLEGE_DATA.events[k];});
    if(SPECIALTY_DATA)Object.keys(SPECIALTY_DATA.events).forEach(function(k){merged[k]=SPECIALTY_DATA.events[k];});
    Object.keys(SIDE_EVENTS).forEach(function(k){merged[k]=SIDE_EVENTS[k];});
    Object.keys(ECO_EVENTS).forEach(function(k){merged[k]=ECO_EVENTS[k];});
    var sig=signatureEventForSchool();
    if(sig)merged.__SIGNATURE__=sig;
    var specialtySelect=specialtySelectionEvent();
    if(specialtySelect)merged[state.scene]=specialtySelect;
    var educationEvent=educationApplicationEvent();
    if(educationEvent)merged[state.scene]=educationEvent;
    var opp=activeOpportunityEvent();
    if(opp)merged.__OPPORTUNITY_FLOW__=opp;
    return merged;
  }

  function genericSidePool(){
    var e=allEvents()[state.scene];
    var stage=(e&&e.stage)||"";
    if(/本科|大一|白大褂|医学专科|专科/.test(stage))return ["side_love","side_health","side_competition","side_volunteer","side_parttime"];
    if(/研究生|博士|海外升学/.test(stage))return ["side_lab_failure","side_authorship","side_rejection","side_love_distance","side_health"];
    if(/规培|住院|主治|职业|高级职称/.test(stage))return ["side_health","side_patient_thanks","side_night_food","side_parent_health","side_grant_reject"];
    return [];
  }

  function maybeEnterDetour(current,next){
    if(state.signaturePending&&/^fresh_/.test(state.scene)&&signatureEventForSchool()){
      state.pendingNext=next;
      state.scene="__SIGNATURE__";
      state.signaturePending=false;
      state.visitedSide.add("__SIGNATURE__");
      addLog("院校专属","触发 "+currentSchool().name+" 的独立院校事件。");
      return true;
    }

    if(current.type==="key"||current.type==="opportunity"||current.type==="specialtySelect"||current.type==="educationApply"||current.type==="educationSchool"||current.type==="educationResult")return false;

    if(SPECIALTY_DATA&&state.specialtyId&&current.type!=="specialty"&&/研究生|博士|规培|住院|主治|职业|高级职称|临床专硕|学硕/.test(current.stage||"")){
      var spec=SPECIALTY_DATA.specialties[state.specialtyId];
      var specPool=(spec&&spec.pool||[]).filter(function(id){
        return SPECIALTY_DATA.events[id]&&!state.visitedSide.has(id);
      });
      if(specPool.length&&Math.random()<.34){
        var specId=specPool[Math.floor(Math.random()*specPool.length)];
        state.pendingNext=next;
        state.scene=specId;
        state.visitedSide.add(specId);
        addLog("科室专属","进入 "+spec.name+" 后触发《"+SPECIALTY_DATA.events[specId].title+"》。");
        return true;
      }
    }

    var profile=currentProfile();
    var ecoPool=(profile.eventPool||[]).filter(function(id){return ECO_EVENTS[id]&&!state.visitedSide.has(id);});
    if(ecoPool.length&&Math.random()<(0.16+profile.eventChanceBonus/2)){
      var eco=ecoPool[Math.floor(Math.random()*ecoPool.length)];
      state.pendingNext=next;state.scene=eco;state.visitedSide.add(eco);
      addLog("院校生态","你的学校环境触发了《"+ECO_EVENTS[eco].title+"》。");
      return true;
    }

    var sidePool=genericSidePool().filter(function(id){return SIDE_EVENTS[id]&&!state.visitedSide.has(id);});
    if(sidePool.length&&Math.random()<.30){
      var sid=sidePool[Math.floor(Math.random()*sidePool.length)];
      state.pendingNext=next;state.scene=sid;state.visitedSide.add(sid);
      addLog("人生支线","触发《"+SIDE_EVENTS[sid].title+"》。");
      return true;
    }
    return false;
  }

  function choose(choice){
    var current=allEvents()[state.scene];
    if(!current)return;

    applyEffects(choice.effects);
    applyTalentEffects(choice.talentEffects);
    (choice.flags||[]).forEach(function(f){state.flags.add(f);});
    if(choice.route)state.route=choice.route;

    if(choice.eduStart){
      state.eduApplication={level:choice.eduStart.level,source:choice.eduStart.source,prep:0};
    }
    if(choice.eduMasterType){
      state.eduApplication=state.eduApplication||{level:"master",source:"exam",prep:0};
      state.eduApplication.masterType=choice.eduMasterType;
    }
    if(choice.eduSchoolId){
      state.eduApplication=state.eduApplication||{prep:0};
      state.eduApplication.school=findEduSchool(choice.eduSchoolId);
    }
    if(choice.eduSpecialtyId){
      state.eduApplication=state.eduApplication||{prep:0};
      state.eduApplication.specialtyId=choice.eduSpecialtyId;
    }
    if(choice.eduDirectionId){
      state.eduApplication=state.eduApplication||{prep:0};
      state.eduApplication.directionId=choice.eduDirectionId;
    }
    if(choice.eduPrepAdd){
      state.eduApplication=state.eduApplication||{prep:0};
      state.eduApplication.prep=(state.eduApplication.prep||0)+choice.eduPrepAdd;
    }
    if(choice.admissionQuery){
      addLog("录取查询","开始查询 "+((state.eduApplication&&state.eduApplication.school&&state.eduApplication.school.name)||"目标院校")+" 的录取结果。");
      startAdmissionQuery();
      return;
    }

    if(choice.specialtyId&&SPECIALTY_DATA){
      var selectedSpec=SPECIALTY_DATA.specialties[choice.specialtyId];
      if(selectedSpec){
        state.specialtyId=choice.specialtyId;
        state.specialtyReturnNext=choice.next;
        state.flags.add("specialty_"+choice.specialtyId);
        applyEffects(selectedSpec.mods||{});
        applyTalentEffects(selectedSpec.talentEffects||{});
        addLog("科室分流","你选择了「"+selectedSpec.name+"」。从现在起，后续事件池会按科室变化。");
        state.scene=selectedSpec.intro;
        saveState();render();
        scrollAfterRender();
        return;
      }
    }

    if(current.exclusiveGroup&&choice.application){
      state.applications=state.applications||{};
      state.applications[current.exclusiveGroup]=choice.application;
      addLog("机会押注","你把本轮唯一申请名额用在了「"+choice.application+"」。其他选项关闭。");
    }

    var mappedFlow=choice.application&&OPPORTUNITY_DATA&&OPPORTUNITY_DATA.byApplication[choice.application];
    if(mappedFlow){
      var flow=OPPORTUNITY_DATA.flows[mappedFlow];
      if(flow){
        addLog("申请启动","「"+choice.application+"」不会立刻判定结果，你将进入完整申请流程。");
        state.activeOpportunity={
          id:mappedFlow,
          step:flow.start,
          returnNext:flow.returnNext||choice.next
        };
        state.scene="__OPPORTUNITY_FLOW__";
        saveState();render();
        scrollAfterRender();
        return;
      }
    }

    var success=null;
    if(choice.chance)success=resolveChance(choice.chance);

    var effects=effectText(choice.effects);
    addLog(current.stage,current.title+" → "+choice.text+(effects?"（"+effects+"）":""));

    if(state.stats.mental<=0||state.stats.energy<=0){showEnding("burnout");return;}

    if(state.scene==="__OPPORTUNITY_FLOW__"&&state.activeOpportunity){
      var flowState=state.activeOpportunity;
      if(choice.endFlow){
        var returnNext=flowState.returnNext;
        addLog("机会流程结束","这次申请经历结束，人生继续向前。");
        state.activeOpportunity=null;
        state.scene=returnNext;
      }else{
        var nextStep=choice.nextStep;
        if(success===true&&choice.successStep)nextStep=choice.successStep;
        if(success===false&&choice.failStep)nextStep=choice.failStep;
        if(nextStep){
          state.activeOpportunity.step=nextStep;
          state.scene="__OPPORTUNITY_FLOW__";
        }
      }
      saveState();render();
      scrollAfterRender();
      return;
    }

    var next=choice.next;
    if(success===true&&choice.successNext)next=choice.successNext;
    if(success===false&&choice.failNext)next=choice.failNext;

    if(next==="__END__"){showEnding();return;}

    if(next==="resident_entry"&&state.flags.has("clinicalMaster")&&state.flags.has("integratedResidency")){
      next="clinical_master_finish";
    }

    if(next==="__SPECIALTY_RETURN__"){
      state.scene=state.specialtyReturnNext||"resident_entry";
      state.specialtyReturnNext=null;
    }else if(next==="__RETURN__"){
      state.scene=state.pendingNext||((currentSchool()&&currentSchool().educationLevel==="专科"&&COLLEGE_DATA)?COLLEGE_DATA.entry:(CAREER_DATA.entryByProfile[state.profileId]||"fresh_growth"));
      state.pendingNext=null;
    }else if(!maybeEnterDetour(current,next)){
      state.scene=next;
    }

    saveState();render();
    scrollAfterRender();
  }

  function sceneProgress(){
    var e=allEvents()[state.scene];
    if(state.activeOpportunity){
      var anchor=ORDER.indexOf(state.activeOpportunity.returnNext);
      return Math.round((Math.max(1,anchor)/ORDER.length)*100);
    }
    if(state.specialtyReturnNext&&e&&e.type==="specialty"){
      var sp=ORDER.indexOf(state.specialtyReturnNext);
      return Math.round((Math.max(1,sp)/ORDER.length)*100);
    }
    if(e&&["side","random","school","specialty"].indexOf(e.type)>=0&&state.pendingNext){
      var p=ORDER.indexOf(state.pendingNext);
      return Math.round((Math.max(1,p)/ORDER.length)*100);
    }
    var i=ORDER.indexOf(state.scene);
    if(i<0)return 5;
    return Math.round(((i+1)/ORDER.length)*100);
  }

  function render(){
    if(!state)return;
    var e=allEvents()[state.scene];
    if(!e){
      state.scene=(currentSchool()&&currentSchool().educationLevel==="专科"&&COLLEGE_DATA)?COLLEGE_DATA.entry:(CAREER_DATA.entryByProfile[state.profileId]||"fresh_growth");
      e=allEvents()[state.scene];
    }
    var school=currentSchool(),profile=currentProfile();

    statKeys.forEach(function(k){
      var id="stat"+k.charAt(0).toUpperCase()+k.slice(1);
      el(id).textContent=state.stats[k];
      var meterId="meter"+k.charAt(0).toUpperCase()+k.slice(1);
      if(el(meterId))el(meterId).style.width=state.stats[k]+"%";
      var card=document.querySelector('[data-stat="'+k+'"]');
      if(card)card.classList.toggle("is-low",state.stats[k]<=25);
    });

    el("metaSchool").textContent=currentInstitutionName();
    el("metaScore").textContent=state.score||"—";
    el("metaDifficulty").textContent=DIFFICULTIES[state.difficulty].name;
    el("metaProfile").textContent=profile.name;
    el("metaRoute").textContent=state.route||"本科·未分流";
    el("metaSpecialty").textContent=currentSpecialtyName();
    el("metaBackground").textContent=backgroundShort(state.background);
    renderJourneyRibbon("gameScreen");
    renderEducationTimeline();
    applyStageBackground();

    el("stageChip").textContent=e.stage;
    el("yearText").textContent=e.year;
    el("sceneTitle").textContent=e.title;
    el("sceneText").textContent=e.text;
    el("progressBar").style.width=sceneProgress()+"%";

    var typeName=e.type==="side"?"支线任务":e.type==="random"?"随机事件":e.type==="school"?"院校专属":e.type==="key"?"关键节点":e.type==="opportunity"?"竞争机会":e.type==="application"?"申请进行中":e.type==="resultSuccess"?"申请成功":e.type==="resultFail"?"申请未通过":e.type==="specialtySelect"?"科室分流":e.type==="specialty"?"科室专属":e.type==="educationSchool"?"选择院校":e.type==="educationApply"?"升学申请":e.type==="educationResult"?"录取查询":"主线";
    el("typeChip").textContent=typeName;
    el("typeChip").className="type-chip"+(e.type==="side"?" side":e.type==="random"?" random":e.type==="school"?" school":e.type==="key"?" key":e.type==="opportunity"?" opportunity":e.type==="application"?" application":e.type==="resultSuccess"?" success":e.type==="resultFail"?" fail":e.type==="specialtySelect"?" specialty-select":e.type==="specialty"?" specialty":e.type==="educationSchool"||e.type==="educationApply"?" education":e.type==="educationResult"?" education-result":"");

    var panel=document.querySelector(".story-panel");
    panel.classList.toggle("key-scene",!!e.critical);
    panel.classList.toggle("opportunity-scene",["opportunity","application","resultSuccess","resultFail"].indexOf(e.type)>=0);

    el("criticalBanner").hidden=!e.critical;
    if(e.critical){
      el("criticalTitle").textContent="⚠️ 关键人生选择";
      el("criticalText").textContent=e.warning||"这个选择会改变后续路线。";
    }

    var isOpp=["opportunity","application","resultSuccess","resultFail"].indexOf(e.type)>=0;
    el("opportunityBanner").hidden=!isOpp;
    if(e.type==="opportunity")el("opportunityText").textContent=e.warning||"本轮只能选择一个机会申请。";
    if(e.type==="application")el("opportunityText").textContent="申请不会一步出结果。你的每一步准备都会影响后续属性、材料质量和最终成功率。";
    if(e.type==="resultSuccess")el("opportunityText").textContent="申请成功只是新的分岔口：你接下来如何使用这个机会，会带来不同收益。";
    if(e.type==="resultFail")el("opportunityText").textContent="申请失败不会把之前的准备清零。你可以调整、转投、重试或改变路线。";

    if(e.type==="school")el("effectHint").textContent="这是 "+school.name+" 的院校专属事件；换学校可能完全不会出现。";
    else if(e.type==="key")el("effectHint").textContent="关键节点不会随机替你做决定。请根据你的当前属性、天赋和想走的路线选择。";
    else if(e.type==="opportunity")el("effectHint").textContent="先选择申请哪一个机会；选定后会进入多步骤申请流程，不会立刻出结果。";
    else if(e.type==="application")el("effectHint").textContent="你的项目选择、推荐信、材料准备和面试策略会改变后面的成功率与结果。";
    else if(e.type==="resultSuccess"||e.type==="resultFail")el("effectHint").textContent="结果已经确定，但你对成功或失败的后续处理仍然会改变人生路线。";
    else if(e.type==="specialtySelect")el("effectHint").textContent="择科是长期分流：不同科室拥有不同的夜班强度、操作要求、科研机会和专属剧情。";
    else if(e.type==="specialty")el("effectHint").textContent="这是 "+currentSpecialtyName()+" 的专属事件；换一个科室，后续问题会完全不同。";
    else if(e.type==="educationSchool")el("effectHint").textContent="院校选择会真实参与本局录取概率，录取成功后写入教育档案。";
    else if(e.type==="educationApply")el("effectHint").textContent="前面每一步准备都会累积到最终录取概率，不是最后一刻纯随机。";
    else if(e.type==="educationResult")el("effectHint").textContent="结果已经在点击查询时锁定；倒计时只模拟招生系统查询过程。";
    else if(["side","random"].indexOf(e.type)>=0)el("effectHint").textContent="完成支线后会回到原来的主线，但留下的属性和隐藏经历会继续影响后面。";
    else el("effectHint").textContent="不同学校、早期路线和过去的关键选择，会让后面的可选项逐渐不同。";

    var box=el("choices");
    box.innerHTML="";
    e.choices.filter(choiceVisible).forEach(function(c){
      var ok=requirementsMet(c.requires);
      var b=document.createElement("button");
      b.className="choice-btn"+((c.specialtyId||c.eduSpecialtyId)?" specialty-choice":"")+(c.eduSchoolId?" education-school-choice":"");
      b.disabled=!ok;
      var sub=ok?c.sub:"条件不足："+requirementText(c.requires);
      var meta="";
      if(c.route)meta+="<span class=\"route-chip\">→ "+escapeHtml(c.route)+"</span>";
      if(c.application)meta+="<span class=\"choice-meta\">只能申请一个 · "+escapeHtml(c.application)+"</span>";
      if(c.specialtyMetrics){
        var sm=c.specialtyMetrics;
        meta+="<span class=\"specialty-metrics\"><em>压力 "+stars(sm.pressure)+"</em><em>夜班 "+stars(sm.night)+"</em><em>科研 "+stars(sm.research)+"</em><em>操作 "+stars(sm.procedure)+"</em><em>生活 "+stars(sm.lifestyle)+"</em></span>";
      }
      b.innerHTML="<b>"+escapeHtml(c.text)+"</b><small>"+escapeHtml(sub)+"</small>"+meta;
      b.addEventListener("click",function(){choose(c);});
      box.appendChild(b);
    });

    renderLog();saveState();
  }

  function renderLog(){
    el("lifeLog").innerHTML=state.log.map(function(x){
      return "<div class=\"log-item\"><strong>"+escapeHtml(x.title)+"</strong><br>"+escapeHtml(x.text)+"</div>";
    }).join("");
  }

  function evaluateEnding(){
    var s=state.stats,school=currentSchool(),prefix=school?"从 "+school.name+" 出发，":"";
    if(currentSpecialty())prefix+="你最终选择了"+currentSpecialtyName()+"；";
    if(state.flags.has("phdOverseas")||state.flags.has("phdDomestic")||state.flags.has("directPhdOffer"))prefix+="你完成了博士阶段；";
    else if(state.flags.has("clinicalMaster")||state.flags.has("academicMaster"))prefix+="你完成了硕士阶段；";
    else if(state.flags.has("noMaster"))prefix+="你选择本科后更早进入临床；";

    if(state.flags.has("academicianTrack")&&s.research>=76&&s.reputation>=68)
      return ["学术带头人 / 顶尖学者路线",prefix+"你最终把科研、团队和学术共同体建设成职业核心。"];
    if(state.flags.has("director")&&s.reputation>=68)
      return ["科主任 / 管理与学科建设路线",prefix+"你从一个被培养的医学生，走到开始培养别人、配置资源和承担组织责任的位置。"];
    if(state.flags.has("expert")&&s.knowledge>=72)
      return ["一线临床专家",prefix+"复杂病例和关键技术最终成为你的职业标签。"];
    if(state.flags.has("lifeTrack")&&s.mental>=62)
      return ["长期主义医生",prefix+"你的晋升不是最快，但你保住了职业、生活和自我。"];
    if(s.research>=65)return ["研究型医生",prefix+"科研成为你职业中最明显的第二条主线。"];
    if(s.reputation>=60)return ["口碑型临床医生",prefix+"你未必拥有最耀眼的头衔，但患者和同事长期记得你的可靠。"];
    return ["普通但真实的医生",prefix+"你没有成为传奇，也没有失败。医学人生最终由许多普通而重要的决定组成。"];
  }

  function humanFlag(flag){
    var map={
      gaokaoTop:"高考高分局",underdogStart:"逆风开局",humanism:"人文关怀",earlyResearch:"早期科研",earlyClinical:"早临床",
      ugResearch:"本科科研线",ugClinical:"本科临床线",ugBalanced:"本科均衡线",ugGlobal:"本科国际线",
      majorScholarship:"本科奖学金",ugExchange:"本科海外交流",studentPI:"本科项目负责人",clinicalCompetition:"临床技能竞赛",
      recommended:"推免成功",gradExam:"考研路线",platformJump:"平台跃迁",platformJumpBig:"大幅平台跃迁",secondTrySuccess:"二战上岸",
      clinicalMaster:"临床专硕",academicMaster:"学硕",directPhdOffer:"直博",overseasOffer:"海外升学",
      phdDomestic:"国内博士",phdOverseas:"海外博士",noPhd:"未读博",noMaster:"本科后就业",postdoc:"博后",
      masterScholarship:"研究生奖学金",jointTraining:"联合培养",keyProject:"重点项目",phdJoint:"博士联合培养",
      youthGrant:"青年基金",visitingScholar:"海外访问",clinicalFellowship:"临床进修",youngTalent:"青年人才项目",
      researchTrack:"科研晋升",clinicalTrack:"临床专家",lifeTrack:"长期主义",director:"管理路线",expert:"临床专家",academicianTrack:"学术路线"
    };
    return map[flag]||null;
  }

  function highestEducationLabel(){
    if(state.flags.has("phdDomestic")||state.flags.has("phdOverseas")||state.flags.has("directPhdOffer"))return "博士路线";
    if(state.flags.has("clinicalMaster")||state.flags.has("academicMaster")||state.flags.has("recommended")||state.flags.has("masterOffer"))return "硕士路线";
    if(state.flags.has("collegeUpgradeSuccess")||state.flags.has("collegeUpgradeSecondSuccess")||state.flags.has("lateUpgradeSuccess"))return "专科 → 本科衔接";
    var s=currentSchool();
    return s&&s.educationLevel==="专科"?"医学专科路线":"本科路线";
  }

  function successfulApplications(){
    var map=[
      ["majorScholarship","本科奖学金"],["ugExchange","海外暑研/交换"],["studentPI","本科科研项目"],["clinicalCompetition","临床技能竞赛"],
      ["collegeScholarship","专科奖学金"],["collegePremiumIntern","优质医院实习"],["collegeUpgradeProgram","专升本强化计划"],["collegePrimaryProject","基层实践项目"],
      ["masterScholarship","研究生奖学金"],["jointTraining","联合培养"],["keyProject","重点科研项目"],["excellentResident","临床优秀学员"],
      ["phdJoint","博士联合培养"],["oralPresentation","国际会议口头报告"],["phdKeyProject","博士重点项目"],
      ["youthGrant","青年基金"],["visitingScholar","海外访问"],["clinicalFellowship","临床进修"],["youngTalent","青年人才项目"]
    ];
    return map.filter(function(x){return state.flags.has(x[0]);}).map(function(x){return x[1];});
  }

  function renderJourney(){
    var school=currentSchool(),wins=successfulApplications();
    var items=[
      ["出生环境",backgroundShort(state.background)],
      ["本科",state.educationHistory&&state.educationHistory.undergrad?state.educationHistory.undergrad.schoolName:(school?school.name:"—")],
      ["硕士",state.educationHistory&&state.educationHistory.master?state.educationHistory.master.schoolName+" · "+state.educationHistory.master.type:"—"],
      ["博士",state.educationHistory&&state.educationHistory.phd?state.educationHistory.phd.schoolName+" · "+state.educationHistory.phd.type:"—"],
      ["学历层级",highestEducationLabel()],
      ["主要路线",state.route||"—"],
      ["科室 / 学科",currentSpecialtyName()],
      ["关键机会",wins.length?wins.join("、"):"本轮没有拿到稀缺机会，但人生仍继续"],
      ["培养生态",currentProfile().name],
      ["高考",String(state.score||"—")+" 分"]
    ];
    el("endingJourney").innerHTML=items.map(function(x){
      return "<div class=\"journey-item\"><span>"+escapeHtml(x[0])+"</span><strong>"+escapeHtml(x[1])+"</strong></div>";
    }).join("");
  }

  function boardDate(ts){
    var d=new Date(ts||Date.now());
    return d.toLocaleDateString("zh-CN",{month:"numeric",day:"numeric"})+" "+d.toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit",hour12:false});
  }

  function emptyBoardHtml(){
    return "<div class=\"wall-card wall-empty\"><p>还没有留言。完成这一局以后，你可以成为第一位留言者。</p><div class=\"wall-meta\"><span>等待第一句话</span></div></div>";
  }

  function tickerCard(m){
    return "<article class=\"ticker-card\">"+
      "<div class=\"ticker-quote\">“</div>"+
      "<p>"+escapeHtml(m.message)+"</p>"+
      "<div class=\"ticker-meta\"><strong>"+escapeHtml(m.author)+"</strong><span>"+escapeHtml(m.school)+"</span><span>♡ "+(m.likes||[]).length+" · 💬 "+(m.comments||[]).length+"</span></div>"+
    "</article>";
  }

  function renderTicker(){
    if(!BOARD)return;
    var list=BOARD.latest(10);
    var track=el("messageTickerTrack");
    if(!list.length){
      track.innerHTML=emptyBoardHtml();
      track.classList.remove("is-scrolling");
      return;
    }
    var cards=list.map(tickerCard).join("");
    track.innerHTML=list.length>2?cards+cards:cards;
    track.classList.toggle("is-scrolling",list.length>2);
  }

  function commentHtml(message,comment){
    var canDelete=BOARD.canDeleteComment(message,comment);
    return "<div class=\"comment-item\">"+
      "<div class=\"comment-copy\"><strong>"+escapeHtml(comment.author)+"</strong><p>"+escapeHtml(comment.text)+"</p><span>"+boardDate(comment.createdAt)+"</span></div>"+
      (canDelete?"<button class=\"comment-delete\" data-action=\"delete-comment\" data-message=\""+message.id+"\" data-comment=\""+comment.id+"\">删除</button>":"")+
    "</div>";
  }

  function wallCard(m){
    var me=BOARD.currentUserId();
    var liked=(m.likes||[]).indexOf(me)>=0;
    var canDelete=BOARD.canDeleteMessage(m);
    var comments=(m.comments||[]).slice().sort(function(x,y){return x.createdAt-y.createdAt;});
    return "<article class=\"wall-card community-card\" data-message-id=\""+m.id+"\">"+
      "<div class=\"community-head\">"+
        "<div class=\"avatar-dot\">"+escapeHtml((m.author||"医").slice(0,1))+"</div>"+
        "<div><strong>"+escapeHtml(m.author)+"</strong><span>"+escapeHtml(m.school)+" · "+escapeHtml(m.ending)+"</span></div>"+
        "<time>"+boardDate(m.createdAt)+"</time>"+
      "</div>"+
      "<p class=\"community-message\">"+escapeHtml(m.message)+"</p>"+
      "<div class=\"community-actions\">"+
        "<button class=\"social-btn "+(liked?"liked":"")+"\" data-action=\"like\" data-message=\""+m.id+"\">"+(liked?"♥":"♡")+" <span>"+(m.likes||[]).length+"</span></button>"+
        "<button class=\"social-btn\" data-action=\"focus-comment\" data-message=\""+m.id+"\">💬 <span>"+comments.length+"</span></button>"+
        (canDelete?"<button class=\"social-btn danger-link\" data-action=\"delete-message\" data-message=\""+m.id+"\">删除留言</button>":"")+
      "</div>"+
      "<div class=\"comment-section\">"+
        "<div class=\"comment-list\">"+(comments.length?comments.map(function(x){return commentHtml(m,x);}).join(""):"<div class=\"no-comment\">还没有评论，留下第一条回复。</div>")+"</div>"+
        "<div class=\"comment-composer\"><input maxlength=\"120\" data-comment-input=\""+m.id+"\" placeholder=\"回复这条留言…\"><button data-action=\"add-comment\" data-message=\""+m.id+"\">发送</button></div>"+
      "</div>"+
    "</article>";
  }

  function renderWall(){
    if(!BOARD)return;
    var list=BOARD.list(boardSort);
    el("allMessageCount").textContent="共 "+list.length+" 条";
    el("messageWall").innerHTML=list.length?list.map(wallCard).join(""):emptyBoardHtml();
    renderTicker();
  }

  function postLegacyMessage(){
    if(!state||!state.finished||!BOARD)return;
    var input=el("legacyMessage"),msg=input.value.trim();
    if(!msg){
      el("messageFeedback").hidden=false;
      el("messageFeedback").textContent="先写下一句话再提交。";
      return;
    }
    var school=currentSchool();
    BOARD.createMessage({
      message:msg,
      author:state.name||"匿名医学生",
      school:school?school.name:"未知起点",
      ending:el("endingTitle").textContent||"医学人生"
    });
    input.value="";
    el("messageCount").textContent="0 / 200";
    el("messageFeedback").hidden=false;
    el("messageFeedback").textContent="已发布。当前网页版会立即更新本地留言墙；接入云数据库后，同样的界面会实时同步其他玩家的新留言。";
    renderWall();
  }

  function handleBoardAction(target){
    if(!BOARD)return;
    var action=target.getAttribute("data-action");
    var messageId=target.getAttribute("data-message");
    if(!action||!messageId)return;

    if(action==="like"){
      BOARD.toggleLike(messageId);
      renderWall();
      return;
    }
    if(action==="focus-comment"){
      var input=document.querySelector('[data-comment-input="'+messageId+'"]');
      if(input)input.focus();
      return;
    }
    if(action==="add-comment"){
      var commentInput=document.querySelector('[data-comment-input="'+messageId+'"]');
      if(!commentInput)return;
      var text=commentInput.value.trim();
      if(!text)return;
      BOARD.addComment(messageId,{text:text,author:(state&&state.name)||"匿名医学生"});
      commentInput.value="";
      renderWall();
      return;
    }
    if(action==="delete-message"){
      if(window.confirm("确定删除你自己的这条留言吗？")){
        BOARD.deleteMessage(messageId);
        renderWall();
      }
      return;
    }
    if(action==="delete-comment"){
      var commentId=target.getAttribute("data-comment");
      if(window.confirm("确定删除这条评论吗？")){
        BOARD.deleteComment(messageId,commentId);
        renderWall();
      }
    }
  }

  function showEnding(type){
    state.finished=true;
    var ending=type==="burnout"
      ?["提前离开当前医学路径","长期透支超过了承受范围。这个结局不是对人的评价，只代表这条游戏时间线在这里改变了方向。"]
      :evaluateEnding();
    showOnly("endingScreen");
    el("endingTitle").textContent=ending[0];
    el("endingText").textContent=ending[1];
    el("endingStats").innerHTML=statKeys.map(function(k){
      return "<div class=\"ending-stat\"><span>"+statNames[k]+"</span><strong>"+state.stats[k]+"</strong></div>";
    }).join("");
    var tags=Array.from(state.flags).map(humanFlag).filter(Boolean).slice(0,14);
    el("endingTags").innerHTML=tags.map(function(tag){return "<span class=\"ending-tag\">"+escapeHtml(tag)+"</span>";}).join("");
    renderJourney();
    if(BOARD&&el("boardModeLabel"))el("boardModeLabel").textContent=BOARD.modeLabel||"留言板";
    renderWall();
    saveState();scrollAfterRender();
  }

  function serializableState(){
    if(!state)return null;
    var copy=Object.assign({},state);
    copy.flags=Array.from(state.flags);
    copy.visitedSide=Array.from(state.visitedSide);
    return copy;
  }

  function saveState(){if(state)Storage.save(serializableState());}

  function restoreState(raw){
    if(!raw||!raw.schoolId)return false;
    state=raw;
    state.flags=new Set(raw.flags||[]);
    state.visitedSide=new Set(raw.visitedSide||[]);
    state.pendingNext=raw.pendingNext||null;
    state.profileId=raw.profileId||profileIdForSchool(schoolById(raw.schoolId));
    state.applications=raw.applications||{};
    state.activeOpportunity=raw.activeOpportunity||null;
    state.educationHistory=raw.educationHistory||{
      undergrad:{schoolId:raw.schoolId,schoolName:(schoolById(raw.schoolId)||{}).name||"本科院校",level:(schoolById(raw.schoolId)||{}).educationLevel||"本科",major:(schoolById(raw.schoolId)||{}).program||"临床医学"},
      master:null,phd:null,overseas:[]
    };
    state.eduApplication=raw.eduApplication||null;
    state.pendingAdmissionResult=null;
    state.specialtyId=raw.specialtyId||null;
    state.specialtyReturnNext=raw.specialtyReturnNext||null;
    state.route=raw.route||"本科·未分流";
    state.background=raw.background||null;
    state.signaturePending=!!raw.signaturePending;
    if(!raw.talents)state.talents=generateTalents(raw.score||620,schoolById(raw.schoolId),currentProfile());
    selectedDifficulty=state.difficulty||"normal";
    pendingName=state.name||"";
    el("playerName").value=pendingName;
    el("restartBtn").hidden=false;
    if(state.finished)showEnding();
    else{showOnly("gameScreen");render();}
    return true;
  }

  function refreshContinue(){
    var raw=Storage.load();
    el("continueBtn").hidden=!(raw&&raw.schoolId);
  }

  function reset(){
    if(rollTimer){clearInterval(rollTimer);rollTimer=null;}
    Storage.clear();state=null;pendingName="";pendingBackground=null;selectedDifficulty="normal";
    renderDifficulty();resetGaokao();showOnly("startScreen");
    el("restartBtn").hidden=true;refreshContinue();
    scrollAfterRender();
  }

  el("schoolSearch").addEventListener("input",function(){
    schoolSearchQuery=this.value.trim();
    renderSchoolGrid();
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-level]"),function(btn){
    btn.addEventListener("click",function(){
      schoolLevelFilter=btn.getAttribute("data-level")||"all";
      Array.prototype.forEach.call(document.querySelectorAll("[data-level]"),function(x){
        x.classList.toggle("active",x===btn);
      });
      renderSchoolGrid();
    });
  });

  el("startBtn").addEventListener("click",beginGaokao);
  el("rollBtn").addEventListener("click",startRolling);
  el("stopBtn").addEventListener("click",stopRolling);
  el("enterUniversityBtn").addEventListener("click",enterUniversity);
  el("restartBtn").addEventListener("click",reset);
  el("endingRestartBtn").addEventListener("click",reset);
  el("continueBtn").addEventListener("click",function(){restoreState(Storage.load());});
  el("legacyMessage").addEventListener("input",function(){
    el("messageCount").textContent=this.value.length+" / 200";
  });
  el("admissionResultBtn").addEventListener("click",confirmAdmissionResult);

  el("postMessageBtn").addEventListener("click",postLegacyMessage);
  el("viewAllMessagesBtn").addEventListener("click",function(){
    el("allMessagesPanel").hidden=false;
    renderWall();
    el("allMessagesPanel").scrollIntoView({behavior:"smooth",block:"start"});
  });
  el("closeAllMessagesBtn").addEventListener("click",function(){
    el("allMessagesPanel").hidden=true;
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-board-sort]"),function(btn){
    btn.addEventListener("click",function(){
      boardSort=btn.getAttribute("data-board-sort")||"newest";
      Array.prototype.forEach.call(document.querySelectorAll("[data-board-sort]"),function(x){x.classList.toggle("active",x===btn);});
      renderWall();
    });
  });
  el("messageWall").addEventListener("click",function(e){
    var target=e.target.closest("[data-action]");
    if(target)handleBoardAction(target);
  });
  el("messageWall").addEventListener("keydown",function(e){
    if(e.key==="Enter"&&!e.shiftKey&&e.target.matches("[data-comment-input]")){
      e.preventDefault();
      var btn=e.target.parentElement.querySelector('[data-action="add-comment"]');
      if(btn)handleBoardAction(btn);
    }
  });
  if(BOARD)BOARD.subscribe(function(){
    if(state&&state.finished)renderWall();
  });

  el("toggleLogBtn").addEventListener("click",function(){
    var log=el("lifeLog"),hidden=log.style.display==="none";
    log.style.display=hidden?"grid":"none";
    el("toggleLogBtn").textContent=hidden?"收起":"展开";
  });

  initBirthSelectors();renderDifficulty();resetGaokao();refreshContinue();renderJourneyRibbon("startScreen");
})();