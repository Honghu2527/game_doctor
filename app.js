(function(){
  "use strict";

  var DATA=window.GAME_DATA;
  var BACKGROUND_DATA=window.BACKGROUND_DATA;
  var SCHOOL_DATA=window.SCHOOL_DATA;
  var SCHOOL_SYSTEM=window.SCHOOL_SYSTEM;
  var CAREER_DATA=window.CAREER_DATA;
  var COLLEGE_DATA=window.COLLEGE_DATA;
  var OPPORTUNITY_DATA=window.OPPORTUNITY_DATA;
  var DIFFICULTIES=DATA.difficulties;
  var CAREER_EVENTS=CAREER_DATA.events;
  var SIDE_EVENTS=DATA.sideEvents;
  var ECO_EVENTS=SCHOOL_SYSTEM.ecoEvents;
  var ORDER=CAREER_DATA.order.concat(COLLEGE_DATA?COLLEGE_DATA.order:[]);
  var SAVE_KEY="doctor-life-sim-v06";
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
  function profileIdForSchool(school){return school.profileId||SCHOOL_SYSTEM.schoolProfiles[school.id]||"growth";}
  function profileForSchool(school){return SCHOOL_SYSTEM.profiles[profileIdForSchool(school)];}
  function currentSchool(){return state?schoolById(state.schoolId):null;}
  function currentProfile(){var s=currentSchool();return s?profileForSchool(s):SCHOOL_SYSTEM.profiles.growth;}

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
    window.scrollTo({top:0,behavior:"smooth"});
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
    Array.prototype.forEach.call(document.querySelectorAll(".filter-btn"),function(btn){
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
    var allowed=allowedEducationLevels(rollingScore);
    if(allowed.indexOf(school.educationLevel||"本科")<0)return;
    var stats=Object.assign({},d.start);
    var bg=pendingBackground||compileBackground(readBirthSelection());
    directApply(stats,bg.mods);
    directApply(stats,school.mods);
    var profileId=profileIdForSchool(school);

    state={
      version:6,
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
    Object.keys(SIDE_EVENTS).forEach(function(k){merged[k]=SIDE_EVENTS[k];});
    Object.keys(ECO_EVENTS).forEach(function(k){merged[k]=ECO_EVENTS[k];});
    var sig=signatureEventForSchool();
    if(sig)merged.__SIGNATURE__=sig;
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

    if(current.type==="key"||current.type==="opportunity")return false;

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
        window.scrollTo({top:0,behavior:"smooth"});
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
      window.scrollTo({top:0,behavior:"smooth"});
      return;
    }

    var next=choice.next;
    if(success===true&&choice.successNext)next=choice.successNext;
    if(success===false&&choice.failNext)next=choice.failNext;

    if(next==="__END__"){showEnding();return;}

    if(next==="__RETURN__"){
      state.scene=state.pendingNext||((currentSchool()&&currentSchool().educationLevel==="专科"&&COLLEGE_DATA)?COLLEGE_DATA.entry:(CAREER_DATA.entryByProfile[state.profileId]||"fresh_growth"));
      state.pendingNext=null;
    }else if(!maybeEnterDetour(current,next)){
      state.scene=next;
    }

    saveState();render();
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function sceneProgress(){
    var e=allEvents()[state.scene];
    if(state.activeOpportunity){
      var anchor=ORDER.indexOf(state.activeOpportunity.returnNext);
      return Math.round((Math.max(1,anchor)/ORDER.length)*100);
    }
    if(e&&["side","random","school"].indexOf(e.type)>=0&&state.pendingNext){
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
    });

    el("metaSchool").textContent=school?school.name:"—";
    el("metaScore").textContent=state.score||"—";
    el("metaDifficulty").textContent=DIFFICULTIES[state.difficulty].name;
    el("metaProfile").textContent=profile.name;
    el("metaRoute").textContent=state.route||"本科·未分流";
    el("metaBackground").textContent=backgroundShort(state.background);

    el("stageChip").textContent=e.stage;
    el("yearText").textContent=e.year;
    el("sceneTitle").textContent=e.title;
    el("sceneText").textContent=e.text;
    el("progressBar").style.width=sceneProgress()+"%";

    var typeName=e.type==="side"?"支线任务":e.type==="random"?"随机事件":e.type==="school"?"院校专属":e.type==="key"?"关键节点":e.type==="opportunity"?"竞争机会":e.type==="application"?"申请进行中":e.type==="resultSuccess"?"申请成功":e.type==="resultFail"?"申请未通过":"主线";
    el("typeChip").textContent=typeName;
    el("typeChip").className="type-chip"+(e.type==="side"?" side":e.type==="random"?" random":e.type==="school"?" school":e.type==="key"?" key":e.type==="opportunity"?" opportunity":e.type==="application"?" application":e.type==="resultSuccess"?" success":e.type==="resultFail"?" fail":"");

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
    else if(["side","random"].indexOf(e.type)>=0)el("effectHint").textContent="完成支线后会回到原来的主线，但留下的属性和隐藏经历会继续影响后面。";
    else el("effectHint").textContent="不同学校、早期路线和过去的关键选择，会让后面的可选项逐渐不同。";

    var box=el("choices");
    box.innerHTML="";
    e.choices.forEach(function(c){
      var ok=requirementsMet(c.requires);
      var b=document.createElement("button");
      b.className="choice-btn";
      b.disabled=!ok;
      var sub=ok?c.sub:"条件不足："+requirementText(c.requires);
      var meta="";
      if(c.route)meta+="<span class=\"route-chip\">→ "+escapeHtml(c.route)+"</span>";
      if(c.application)meta+="<span class=\"choice-meta\">只能申请一个 · "+escapeHtml(c.application)+"</span>";
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
      ["起点",school?school.name:"—"],
      ["学历层级",highestEducationLabel()],
      ["主要路线",state.route||"—"],
      ["关键机会",wins.length?wins.join("、"):"本轮没有拿到稀缺机会，但人生仍继续"],
      ["培养生态",currentProfile().name],
      ["高考",String(state.score||"—")+" 分"]
    ];
    el("endingJourney").innerHTML=items.map(function(x){
      return "<div class=\"journey-item\"><span>"+escapeHtml(x[0])+"</span><strong>"+escapeHtml(x[1])+"</strong></div>";
    }).join("");
  }

  function loadWall(){
    try{
      var raw=localStorage.getItem(BOARD_KEY);
      return raw?JSON.parse(raw):[];
    }catch(e){return [];}
  }

  function saveWall(list){
    try{localStorage.setItem(BOARD_KEY,JSON.stringify(list.slice(0,30)));}catch(e){}
  }

  function renderWall(){
    var list=loadWall().slice(0,10);
    if(!list.length){
      el("messageWall").innerHTML="<div class=\"wall-card\"><p>还没有留言。你可以成为这个设备上的第一位留言者。</p><div class=\"wall-meta\">网页版本地留言墙</div></div>";
      return;
    }
    el("messageWall").innerHTML=list.map(function(m){
      return "<div class=\"wall-card\"><p>"+escapeHtml(m.message)+"</p><div class=\"wall-meta\"><span>"+escapeHtml(m.author)+"</span><span>"+escapeHtml(m.school)+"</span><span>"+escapeHtml(m.ending)+"</span><span>"+escapeHtml(m.date)+"</span></div></div>";
    }).join("");
  }

  function postLegacyMessage(){
    if(!state||!state.finished)return;
    var input=el("legacyMessage"),msg=input.value.trim();
    if(!msg){
      el("messageFeedback").hidden=false;
      el("messageFeedback").textContent="先写下一句话再提交。";
      return;
    }
    var school=currentSchool();
    var list=loadWall();
    list.unshift({
      message:msg.slice(0,200),
      author:state.name||"匿名医学生",
      school:school?school.name:"未知起点",
      ending:el("endingTitle").textContent||"医学人生",
      date:new Date().toLocaleDateString("zh-CN")
    });
    saveWall(list);
    input.value="";
    el("messageCount").textContent="0 / 200";
    el("messageFeedback").hidden=false;
    el("messageFeedback").textContent="这句话已经留在当前设备的留言墙上。小程序版接入云数据库后，可以升级为所有玩家共享。";
    renderWall();
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
    renderWall();
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
    state.applications=raw.applications||{};
    state.activeOpportunity=raw.activeOpportunity||null;
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
    window.scrollTo({top:0,behavior:"smooth"});
  }

  el("schoolSearch").addEventListener("input",function(){
    schoolSearchQuery=this.value.trim();
    renderSchoolGrid();
  });
  Array.prototype.forEach.call(document.querySelectorAll(".filter-btn"),function(btn){
    btn.addEventListener("click",function(){
      schoolLevelFilter=btn.getAttribute("data-level")||"all";
      Array.prototype.forEach.call(document.querySelectorAll(".filter-btn"),function(x){
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
  el("postMessageBtn").addEventListener("click",postLegacyMessage);

  el("toggleLogBtn").addEventListener("click",function(){
    var log=el("lifeLog"),hidden=log.style.display==="none";
    log.style.display=hidden?"grid":"none";
    el("toggleLogBtn").textContent=hidden?"收起":"展开";
  });

  initBirthSelectors();renderDifficulty();resetGaokao();refreshContinue();
})();