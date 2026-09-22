(function(){
  "use strict";

  var DATA=window.GAME_DATA;
  var SCHOOL_DATA=window.SCHOOL_DATA;
  var SCHOOL_SYSTEM=window.SCHOOL_SYSTEM;
  var DIFFICULTIES=DATA.difficulties;
  var EVENTS=DATA.events;
  var SIDE_EVENTS=DATA.sideEvents;
  var ECO_EVENTS=SCHOOL_SYSTEM.ecoEvents;
  var ORDER=DATA.order;
  var SAVE_KEY="doctor-life-sim-v03";

  var state=null;
  var selectedDifficulty="normal";
  var rollTimer=null;
  var rollingScore=null;
  var scoreLocked=false;
  var pendingName="";

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
  }

  function schoolById(id){return SCHOOL_DATA.schools.find(function(s){return s.id===id;});}
  function profileIdForSchool(school){return SCHOOL_SYSTEM.schoolProfiles[school.id]||"growth";}
  function profileForSchool(school){return SCHOOL_SYSTEM.profiles[profileIdForSchool(school)];}
  function currentSchool(){return state?schoolById(state.schoolId):null;}
  function currentProfile(){var s=currentSchool();return s?profileForSchool(s):SCHOOL_SYSTEM.profiles.growth;}

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
  }

  function beginGaokao(){
    pendingName=el("playerName").value.trim()||"无名医学生";
    resetGaokao();showOnly("gaokaoScreen");el("restartBtn").hidden=false;
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function gaussianScore(){
    var u=0,v=0;
    while(u===0)u=Math.random();
    while(v===0)v=Math.random();
    var z=Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
    return Math.round(clamp(626+z*52,530,742));
  }

  function startRolling(){
    if(scoreLocked||rollTimer)return;
    el("rollBtn").disabled=true;el("stopBtn").disabled=false;
    el("scoreDisplay").classList.add("rolling");
    rollingScore=gaussianScore();el("scoreDisplay").textContent=rollingScore;
    rollTimer=setInterval(function(){
      rollingScore=gaussianScore();
      el("scoreDisplay").textContent=rollingScore;
    },72);
  }

  function getBand(score){
    return SCHOOL_DATA.bands.find(function(b){return score>=b.min&&score<=b.max;})||SCHOOL_DATA.bands[SCHOOL_DATA.bands.length-1];
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
    el("goSchoolBtn").addEventListener("click",showSchoolSelection);
  }

  function eligibleSchools(score){
    var all=SCHOOL_DATA.schools.filter(function(s){return score>=s.minScore;});
    all.sort(function(a,b){return b.minScore-a.minScore;});
    return all.slice(0,14);
  }

  function stars(n){
    var out="";
    for(var i=0;i<5;i++)out+=i<n?"★":"☆";
    return out;
  }

  function showSchoolSelection(){
    if(!scoreLocked)return;
    showOnly("schoolScreen");
    el("schoolScore").textContent=rollingScore;
    var band=getBand(rollingScore);
    el("bandCard").innerHTML="<strong>"+escapeHtml(band.label)+"</strong><span>"+escapeHtml(band.note)+"</span>";
    var list=eligibleSchools(rollingScore);

    el("schoolGrid").innerHTML=list.map(function(s){
      var p=profileForSchool(s);
      return "<button class=\"school-card\" data-school=\""+s.id+"\">"+
        "<div class=\"school-city\">"+escapeHtml(s.city)+" · 游戏门槛 "+s.minScore+"+</div>"+
        "<div class=\"profile-label\">"+escapeHtml(p.name)+"</div>"+
        "<h3>"+escapeHtml(s.name)+"</h3>"+
        "<p>"+escapeHtml(s.flavor)+"</p>"+
        "<div class=\"school-tags\">"+p.tags.slice(0,3).map(function(t){return "<span>"+escapeHtml(t)+"</span>";}).join("")+"</div>"+
        "<div class=\"school-opportunity\">机会密度 "+stars(p.opportunity)+" · 临床入口 "+stars(p.clinicalAccess)+"</div>"+
        "<div class=\"school-bottom\"><small>综合压力 "+stars(s.level)+"</small><b>选择这所学校 →</b></div>"+
      "</button>";
    }).join("");

    Array.prototype.forEach.call(document.querySelectorAll(".school-card"),function(card){
      card.addEventListener("click",function(){selectSchool(card.getAttribute("data-school"));});
    });
    window.scrollTo({top:0,behavior:"smooth"});
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
    var stats=Object.assign({},d.start);
    directApply(stats,school.mods);

    state={
      version:3,
      name:pendingName,
      difficulty:selectedDifficulty,
      score:rollingScore,
      schoolId:id,
      profileId:profileIdForSchool(school),
      talents:generateTalents(rollingScore,school,profile),
      stats:stats,
      flags:new Set(),
      scene:"orientation",
      pendingNext:null,
      visitedSide:new Set(),
      log:[],
      finished:false
    };

    state.flags.add("schoolLevel"+school.level);
    state.flags.add("profile_"+state.profileId);
    if(state.score>=710)state.flags.add("gaokaoTop");
    if(state.score<575)state.flags.add("underdogStart");

    addLog("高考放榜",state.name+" 高考 "+state.score+" 分。");
    addLog("录取",state.name+" 选择了 "+school.name+" 临床医学专业。");
    addLog("培养生态","你的学校生态为「"+profile.name+"」。");

    el("letterSchool").textContent=school.name;
    el("letterSchoolInline").textContent=school.name;
    el("letterName").textContent=state.name;
    el("letterScore").textContent=state.score;

    el("schoolEffectSummary").innerHTML=
      "<strong>学校不再只是数值修正：</strong><br>"+
      "综合压力 ×"+(school.pressure*profile.negativeScale).toFixed(2)+
      " · 机会密度 "+stars(profile.opportunity)+
      " · 临床入口 "+stars(profile.clinicalAccess)+
      " · 国际/交叉 "+stars(profile.global)+
      "<br>开局属性修正："+effectText(school.mods)+
      "<br><span style=\"color:#8a7d70\">"+escapeHtml(SCHOOL_SYSTEM.disclaimer)+"</span>";

    el("profileName").textContent=profile.name;
    el("profileDesc").textContent=profile.desc;
    el("profileTags").innerHTML=profile.tags.map(function(t){return "<span>"+escapeHtml(t)+"</span>";}).join("");
    renderTalents();

    showOnly("letterScreen");saveState();
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function enterUniversity(){
    if(!state)return;
    showOnly("gameScreen");el("restartBtn").hidden=false;render();
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function schoolPressure(){
    var s=currentSchool(),p=currentProfile();
    return s?s.pressure*p.negativeScale:1;
  }

  function clampStats(){
    statKeys.forEach(function(k){state.stats[k]=clamp(Math.round(state.stats[k]),0,100);});
  }

  function applyEffects(effects){
    effects=effects||{};
    var scale=DIFFICULTIES[state.difficulty].negativeScale*schoolPressure();
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
    return 50;
  }

  function requirementsMet(req){
    if(!req)return true;
    if(req.stats){
      var okStats=Object.keys(req.stats).every(function(k){return metricValue(k)>=req.stats[k];});
      if(!okStats)return false;
    }
    if(req.talents){
      var okTalents=Object.keys(req.talents).every(function(k){return metricValue(k)>=req.talents[k];});
      if(!okTalents)return false;
    }
    if(req.flags&&!req.flags.every(function(f){return state.flags.has(f);})){return false;}
    if(req.schoolLevel){
      var school=currentSchool();
      if(!school||school.level<req.schoolLevel)return false;
    }
    return true;
  }

  function requirementText(req){
    if(!req)return "";
    var parts=[];
    if(req.stats)Object.keys(req.stats).forEach(function(k){parts.push((statNames[k]||k)+"≥"+req.stats[k]);});
    if(req.talents)Object.keys(req.talents).forEach(function(k){
      var m=SCHOOL_SYSTEM.talents[k];
      parts.push((m?m.name:k)+"≥"+req.talents[k]);
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
    addLog(success?"幸运事件":"挫折事件",success?"这一次，积累、天赋和运气都站在了你这边。":"这一次结果没有如愿，但人生继续。");
    return success;
  }

  function addLog(title,text){state.log.unshift({title:title,text:text});}

  function signatureOptions(kind){
    var research=["open_research","academic_seminar","research_track","research_winter"];
    var clinical=["hospital_network","case_center","clinical_round","multi_hospital","city_rotation","clinical_foundation","specialty_exposure","clinical_city","clinical_skill","clinical_ground"];
    var regional=["regional_center","regional_service"];
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
        {text:"主动敲门争取资源",sub:"机会不会自动出现。",effects:{research:4,reputation:3,mental:-2},chance:{p:.5,bonusBy:["communication","knowledge"],success:{research:5,mental:4},fail:{mental:-2}},talentEffects:{communication:1,resilience:1},flags:["selfMadeOpportunity"],next:"__RETURN__"},
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
    if(!sig)return null;
    return {
      stage:"院校专属 · "+s.name,
      year:"18-21岁",
      title:sig.title,
      type:"school",
      text:sig.desc,
      choices:signatureOptions(sig.kind)
    };
  }

  function allEvents(){
    var merged={};
    Object.keys(EVENTS).forEach(function(k){merged[k]=EVENTS[k];});
    Object.keys(SIDE_EVENTS).forEach(function(k){merged[k]=SIDE_EVENTS[k];});
    Object.keys(ECO_EVENTS).forEach(function(k){merged[k]=ECO_EVENTS[k];});
    var sig=signatureEventForSchool();
    if(sig)merged.__SIGNATURE__=sig;
    return merged;
  }

  function getSchoolChoices(sceneId){
    var list=(SCHOOL_SYSTEM.schoolChoices[sceneId]||[]);
    var pid=state.profileId||profileIdForSchool(currentSchool());
    return list.filter(function(c){
      return !c.profile||c.profile.indexOf(pid)>=0;
    });
  }

  function ecologyCandidates(sceneId){
    var profile=currentProfile();
    return (profile.eventPool||[]).filter(function(id){
      var e=ECO_EVENTS[id];
      return e&&e.triggerScenes&&e.triggerScenes.indexOf(sceneId)>=0&&!state.visitedSide.has(id);
    });
  }

  function maybeEnterSide(current,next){
    if(state.scene==="orientation"&&!state.visitedSide.has("__SIGNATURE__")&&signatureEventForSchool()){
      state.pendingNext=next;
      state.scene="__SIGNATURE__";
      state.visitedSide.add("__SIGNATURE__");
      addLog("院校专属","触发 "+currentSchool().name+" 的专属开局事件。");
      return true;
    }

    var globalCandidates=(current.sidePool||[]).filter(function(id){
      return SIDE_EVENTS[id]&&!state.visitedSide.has(id);
    });
    var ecoCandidates=ecologyCandidates(state.scene);
    var profile=currentProfile();

    var chooseEco=ecoCandidates.length&&Math.random()<(0.22+profile.eventChanceBonus);
    var chooseGlobal=globalCandidates.length&&Math.random()<(current.sideChance||0);

    var pool=[];
    if(chooseEco)pool=ecoCandidates;
    else if(chooseGlobal)pool=globalCandidates;
    if(!pool.length)return false;

    var id=pool[Math.floor(Math.random()*pool.length)];
    state.pendingNext=next;
    state.scene=id;
    state.visitedSide.add(id);
    addLog(ECO_EVENTS[id]?"院校机会":"支线触发","触发《"+allEvents()[id].title+"》。");
    return true;
  }

  function choose(choice){
    var current=allEvents()[state.scene];
    applyEffects(choice.effects);
    applyTalentEffects(choice.talentEffects);
    (choice.flags||[]).forEach(function(f){state.flags.add(f);});
    if(choice.chance)resolveChance(choice.chance);

    var effects=effectText(choice.effects);
    addLog(current.stage,current.title+" → "+choice.text+(effects?"（"+effects+"）":""));

    if(state.stats.mental<=0||state.stats.energy<=0){showEnding("burnout");return;}
    if(choice.next==="__END__"){showEnding();return;}

    if(choice.next==="__RETURN__"){
      state.scene=state.pendingNext||"orientation";
      state.pendingNext=null;
    }else if(!maybeEnterSide(current,choice.next)){
      state.scene=choice.next;
    }

    saveState();render();
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function sceneProgress(){
    var e=allEvents()[state.scene];
    if(e&&e.type!=="main"&&state.pendingNext){
      var p=ORDER.indexOf(state.pendingNext);
      return Math.round((Math.max(1,p)/ORDER.length)*100);
    }
    var i=ORDER.indexOf(state.scene);
    if(i<0)return 0;
    return Math.round(((i+1)/ORDER.length)*100);
  }

  function render(){
    if(!state)return;
    var e=allEvents()[state.scene];
    var school=currentSchool(),profile=currentProfile();

    statKeys.forEach(function(k){
      var id="stat"+k.charAt(0).toUpperCase()+k.slice(1);
      el(id).textContent=state.stats[k];
    });

    el("metaSchool").textContent=school?school.name:"—";
    el("metaScore").textContent=state.score||"—";
    el("metaDifficulty").textContent=DIFFICULTIES[state.difficulty].name;
    el("metaProfile").textContent=profile.name;

    el("stageChip").textContent=e.stage;
    el("yearText").textContent=e.year;
    el("sceneTitle").textContent=e.title;
    el("sceneText").textContent=e.text;
    el("progressBar").style.width=sceneProgress()+"%";

    var typeName=e.type==="side"?"支线任务":e.type==="random"?"随机事件":e.type==="school"?"院校机会":"主线";
    el("typeChip").textContent=typeName;
    el("typeChip").className="type-chip"+(e.type==="side"?" side":e.type==="random"?" random":e.type==="school"?" school":"");

    if(e.type==="school"){
      el("effectHint").textContent="这是由你的学校培养生态触发的机会；换一所学校，本局可能根本不会出现。";
    }else if(e.type==="main"){
      el("effectHint").textContent="主线相同，但院校专属选项、机会池、天赋门槛和支线概率都可能不同。";
    }else{
      el("effectHint").textContent="完成这段支线后，你会回到原来的主线。";
    }

    var choices=e.choices.slice();
    if(e.type==="main")choices=choices.concat(getSchoolChoices(state.scene));

    var box=el("choices");
    box.innerHTML="";
    choices.forEach(function(c){
      var ok=requirementsMet(c.requires);
      var b=document.createElement("button");
      b.className="choice-btn";
      b.disabled=!ok;
      var sub=ok?c.sub:"条件不足："+requirementText(c.requires);
      var marker=(c.profile?"【院校专属】":"");
      b.innerHTML="<b>"+marker+escapeHtml(c.text)+"</b><small>"+escapeHtml(sub)+"</small>";
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
    if(state.flags.has("platformJump"))prefix+="你曾通过升学完成一次平台跃迁。";
    if(state.flags.has("academicianTrack")&&s.research>=78&&s.reputation>=70)
      return ["顶尖学者 / 院士路线",prefix+"你把大量人生投入到科研、团队和学术共同体。最终，你成为领域的重要坐标之一。"];
    if(state.flags.has("director")&&s.reputation>=72)
      return ["科主任 / 学科带头人",prefix+"你不只会看病，也开始决定一个科室怎样培养年轻医生、怎样分配资源、怎样承担责任。"];
    if(state.flags.has("expert")&&s.knowledge>=75)
      return ["一线临床专家",prefix+"复杂病例不断被送到你面前。你的价值不只是一串论文，而是那句：这个病人交给你，我放心。"];
    if(state.flags.has("lifeTrack")&&s.mental>=65)
      return ["长期主义医生",prefix+"你没有把全部人生献祭给职称表格。你依然是一名可靠的医生，也保住了生活、关系和自我。"];
    if(s.research>=65)return ["研究型主任医师",prefix+"你在临床之外建立了稳定科研方向。"];
    if(s.reputation>=60)return ["口碑型主任医师",prefix+"患者、学生和同事长期记得你的可靠。"];
    return ["普通但真实的医生",prefix+"你没有成为传奇，也没有失败。你完成了漫长训练，并承担一名医生每天该承担的工作。"];
  }

  function humanFlag(flag){
    var map={
      gaokaoTop:"高考高分局",underdogStart:"逆风开局",ambitious:"目标明确",balanced:"生活派",pragmatic:"现实派",
      humanism:"人文关怀",steady:"稳定学习",earlyResearch:"早期科研",clinicalFirst:"临床优先",doubleTrack:"双线发展",
      communication:"沟通能力",clinicalCourage:"临床勇气",academic:"学术路线",integrity:"科研诚信",teamPlayer:"团队协作",
      solidResident:"扎实规培",selfCare:"自我保护",dutyFirst:"责任优先",researchTrack:"科研晋升",clinicalTrack:"临床专家",
      lifeTrack:"长期主义",familyTime:"家庭优先",director:"管理路线",expert:"专家路线",academicianTrack:"学术巅峰",
      campusLove:"校园恋爱",studentLeader:"学生干部",competition:"竞赛经历",researchResilience:"科研韧性",
      authorshipSpeakUp:"维护署名权益",grantPersistence:"基金再战",surgery:"外科路线",internalMedicine:"内科路线",
      imaging:"影像平台科室",signatureOpportunity:"抓住院校机会",crossDiscipline:"交叉医学",earlyClinical:"早临床",
      platformJump:"平台跃迁",selfMadeOpportunity:"主动争取资源",researchRotation:"科研轮转",aiMedicine:"医学AI"
    };
    return map[flag]||null;
  }

  function showEnding(type){
    state.finished=true;
    var ending=type==="burnout"
      ?["提前离开临床","长期透支终于超过了承受范围。离开不等于失败——这是这条时间线的终点，也是另一条人生线的起点。"]
      :evaluateEnding();
    showOnly("endingScreen");
    el("endingTitle").textContent=ending[0];
    el("endingText").textContent=ending[1];
    el("endingStats").innerHTML=statKeys.map(function(k){
      return "<div class=\"ending-stat\"><span>"+statNames[k]+"</span><strong>"+state.stats[k]+"</strong></div>";
    }).join("");
    var tags=Array.from(state.flags).map(humanFlag).filter(Boolean).slice(0,12);
    el("endingTags").innerHTML=tags.map(function(tag){return "<span class=\"ending-tag\">"+escapeHtml(tag)+"</span>";}).join("");
    saveState();window.scrollTo({top:0,behavior:"smooth"});
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
    Storage.clear();state=null;pendingName="";selectedDifficulty="normal";
    renderDifficulty();resetGaokao();showOnly("startScreen");
    el("restartBtn").hidden=true;refreshContinue();
    window.scrollTo({top:0,behavior:"smooth"});
  }

  el("startBtn").addEventListener("click",beginGaokao);
  el("rollBtn").addEventListener("click",startRolling);
  el("stopBtn").addEventListener("click",stopRolling);
  el("enterUniversityBtn").addEventListener("click",enterUniversity);
  el("restartBtn").addEventListener("click",reset);
  el("endingRestartBtn").addEventListener("click",reset);
  el("continueBtn").addEventListener("click",function(){restoreState(Storage.load());});
  el("toggleLogBtn").addEventListener("click",function(){
    var log=el("lifeLog"),hidden=log.style.display==="none";
    log.style.display=hidden?"grid":"none";
    el("toggleLogBtn").textContent=hidden?"收起":"展开";
  });

  renderDifficulty();resetGaokao();refreshContinue();
})();