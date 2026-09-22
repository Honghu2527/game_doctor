(function(){
  "use strict";

  var DATA=window.GAME_DATA;
  var SCHOOL_DATA=window.SCHOOL_DATA;
  var DIFFICULTIES=DATA.difficulties;
  var EVENTS=DATA.events;
  var SIDE_EVENTS=DATA.sideEvents;
  var ORDER=DATA.order;
  var SAVE_KEY="doctor-life-sim-v02";

  var state=null;
  var selectedDifficulty="normal";
  var rollTimer=null;
  var rollingScore=null;
  var scoreLocked=false;
  var pendingName="";

  var statKeys=["knowledge","energy","mental","money","research","reputation"];
  var statNames={knowledge:"知识",energy:"体力",mental:"心理",money:"金钱",research:"科研",reputation:"声望"};

  var Storage={
    save:function(payload){
      try{ localStorage.setItem(SAVE_KEY,JSON.stringify(payload)); }catch(e){}
    },
    load:function(){
      try{
        var raw=localStorage.getItem(SAVE_KEY);
        return raw?JSON.parse(raw):null;
      }catch(e){ return null; }
    },
    clear:function(){ try{ localStorage.removeItem(SAVE_KEY); }catch(e){} }
  };

  function el(id){return document.getElementById(id);}
  function escapeHtml(v){
    return String(v).replace(/[&<>"']/g,function(ch){
      return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[ch];
    });
  }
  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
  function showOnly(id){
    ["startScreen","gaokaoScreen","schoolScreen","letterScreen","gameScreen","endingScreen"].forEach(function(x){
      el(x).hidden=x!==id;
    });
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
    rollingScore=null;
    scoreLocked=false;
    el("scoreDisplay").textContent="---";
    el("scoreDisplay").classList.remove("rolling");
    el("rollBtn").disabled=false;
    el("stopBtn").disabled=true;
    el("scoreResult").hidden=true;
    el("scoreResult").innerHTML="";
  }

  function beginGaokao(){
    pendingName=el("playerName").value.trim()||"无名医学生";
    resetGaokao();
    showOnly("gaokaoScreen");
    el("restartBtn").hidden=false;
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
    el("rollBtn").disabled=true;
    el("stopBtn").disabled=false;
    el("scoreDisplay").classList.add("rolling");
    rollingScore=gaussianScore();
    el("scoreDisplay").textContent=rollingScore;
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
    clearInterval(rollTimer);rollTimer=null;
    scoreLocked=true;
    el("scoreDisplay").classList.remove("rolling");
    el("stopBtn").disabled=true;
    var band=getBand(rollingScore);
    var box=el("scoreResult");
    box.hidden=false;
    box.innerHTML="<strong>"+rollingScore+" 分 · "+escapeHtml(band.label)+"</strong><br>"+
      escapeHtml(band.note)+
      "<br><button id=\"goSchoolBtn\" class=\"primary-btn next-score-btn\">查看可选择的医学院校</button>";
    el("goSchoolBtn").addEventListener("click",showSchoolSelection);
  }

  function eligibleSchools(score){
    var all=SCHOOL_DATA.schools.filter(function(s){return score>=s.minScore;});
    all.sort(function(a,b){return b.minScore-a.minScore;});
    return all.slice(0,12);
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
      return "<button class=\"school-card\" data-school=\""+s.id+"\">"+
        "<div class=\"school-city\">"+escapeHtml(s.city)+" · 游戏门槛 "+s.minScore+"+</div>"+
        "<h3>"+escapeHtml(s.name)+"</h3>"+
        "<p>"+escapeHtml(s.flavor)+"</p>"+
        "<div class=\"school-tags\">"+s.traits.slice(0,3).map(function(t){return "<span>"+escapeHtml(t)+"</span>";}).join("")+"</div>"+
        "<div class=\"school-bottom\"><small>培养压力 "+stars(s.level)+"</small><b>选择这所学校 →</b></div>"+
      "</button>";
    }).join("");

    Array.prototype.forEach.call(document.querySelectorAll(".school-card"),function(card){
      card.addEventListener("click",function(){selectSchool(card.getAttribute("data-school"));});
    });
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function schoolById(id){
    return SCHOOL_DATA.schools.find(function(s){return s.id===id;});
  }

  function directApply(stats,effects){
    Object.keys(effects||{}).forEach(function(k){
      stats[k]=(stats[k]||0)+effects[k];
    });
    statKeys.forEach(function(k){stats[k]=clamp(Math.round(stats[k]),0,100);});
  }

  function selectSchool(id){
    var school=schoolById(id);
    if(!school)return;
    var d=DIFFICULTIES[selectedDifficulty];
    var stats=Object.assign({},d.start);
    directApply(stats,school.mods);

    state={
      version:2,
      name:pendingName,
      difficulty:selectedDifficulty,
      score:rollingScore,
      schoolId:id,
      stats:stats,
      flags:new Set(),
      scene:"orientation",
      pendingNext:null,
      visitedSide:new Set(),
      log:[],
      finished:false
    };

    state.flags.add("schoolLevel"+school.level);
    if(state.score>=710)state.flags.add("gaokaoTop");
    if(state.score<575)state.flags.add("underdogStart");
    addLog("高考放榜",state.name+" 高考 "+state.score+" 分。");
    addLog("录取",state.name+" 选择了 "+school.name+" 临床医学专业。");

    el("letterSchool").textContent=school.name;
    el("letterSchoolInline").textContent=school.name;
    el("letterName").textContent=state.name;
    el("letterScore").textContent=state.score;
    el("schoolEffectSummary").innerHTML=
      "<strong>这所学校会改变后续难度：</strong><br>"+
      "院校压力系数 ×"+school.pressure.toFixed(2)+" · 科研环境 "+stars(school.research)+" · 临床环境 "+stars(school.clinical)+
      "<br>开局修正："+effectText(school.mods)+"<br><span style=\"color:#8a7d70\">以上均为游戏机制，不代表真实院校排名或评价。</span>";
    showOnly("letterScreen");
    saveState();
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function enterUniversity(){
    if(!state)return;
    showOnly("gameScreen");
    el("restartBtn").hidden=false;
    render();
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function schoolPressure(){
    var s=state?schoolById(state.schoolId):null;
    return s?s.pressure:1;
  }

  function clampStats(){
    statKeys.forEach(function(k){state.stats[k]=clamp(Math.round(state.stats[k]),0,100);});
  }

  function applyEffects(effects){
    effects=effects||{};
    var scale=DIFFICULTIES[state.difficulty].negativeScale*schoolPressure();
    Object.keys(effects).forEach(function(k){
      var v=effects[k];
      var delta=v<0?v*scale:v;
      state.stats[k]=(state.stats[k]||0)+delta;
    });
    clampStats();
  }

  function effectText(effects){
    effects=effects||{};
    return Object.keys(effects).map(function(k){
      var v=effects[k];
      return (statNames[k]||k)+" "+(v>0?"+":"")+v;
    }).join(" · ");
  }

  function requirementsMet(req){
    if(!req)return true;
    if(req.stats){
      var ok=Object.keys(req.stats).every(function(k){return state.stats[k]>=req.stats[k];});
      if(!ok)return false;
    }
    if(req.flags&&!req.flags.every(function(f){return state.flags.has(f);})){return false;}
    if(req.schoolLevel){
      var school=schoolById(state.schoolId);
      if(!school||school.level<req.schoolLevel)return false;
    }
    return true;
  }

  function requirementText(req){
    if(!req)return "";
    var parts=[];
    if(req.stats)Object.keys(req.stats).forEach(function(k){parts.push((statNames[k]||k)+"≥"+req.stats[k]);});
    if(req.flags)parts.push("需要前置经历");
    if(req.schoolLevel)parts.push("需要院校等级 "+req.schoolLevel+"+");
    return parts.join("、");
  }

  function resolveChance(chance){
    if(!chance)return null;
    var p=chance.p;
    if(chance.bonusBy&&chance.bonusBy.length){
      var avg=chance.bonusBy.reduce(function(sum,k){return sum+state.stats[k];},0)/chance.bonusBy.length;
      p+=(avg-50)/220;
    }
    p=clamp(p,.08,.92);
    var success=Math.random()<p;
    applyEffects(success?chance.success:chance.fail);
    addLog(success?"幸运事件":"挫折事件",success?"这一次，积累和运气都站在了你这边。":"这一次结果没有如愿，但人生继续。");
    return success;
  }

  function addLog(title,text){state.log.unshift({title:title,text:text});}

  function allEvents(){return Object.assign({},EVENTS,SIDE_EVENTS);}

  function maybeEnterSide(current,next){
    if(!current.sideChance||!current.sidePool||Math.random()>=current.sideChance)return false;
    var candidates=current.sidePool.filter(function(id){return SIDE_EVENTS[id]&&!state.visitedSide.has(id);});
    if(!candidates.length)return false;
    var id=candidates[Math.floor(Math.random()*candidates.length)];
    state.pendingNext=next;
    state.scene=id;
    state.visitedSide.add(id);
    addLog("支线触发","人生没有完全按计划前进：触发《"+SIDE_EVENTS[id].title+"》。");
    return true;
  }

  function choose(choice){
    var current=allEvents()[state.scene];
    applyEffects(choice.effects);
    (choice.flags||[]).forEach(function(f){state.flags.add(f);});
    if(choice.chance)resolveChance(choice.chance);

    var effects=effectText(choice.effects);
    addLog(current.stage,current.title+" → "+choice.text+(effects?"（"+effects+"）":""));

    if(state.stats.mental<=0||state.stats.energy<=0){
      showEnding("burnout");return;
    }
    if(choice.next==="__END__"){showEnding();return;}

    if(choice.next==="__RETURN__"){
      state.scene=state.pendingNext||"orientation";
      state.pendingNext=null;
    }else if(!maybeEnterSide(current,choice.next)){
      state.scene=choice.next;
    }

    saveState();
    render();
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function sceneProgress(){
    var current=allEvents()[state.scene];
    if(current&&current.type!=="main"&&state.pendingNext){
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
    var school=schoolById(state.schoolId);

    statKeys.forEach(function(k){
      var id="stat"+k.charAt(0).toUpperCase()+k.slice(1);
      el(id).textContent=state.stats[k];
    });
    el("metaSchool").textContent=school?school.name:"—";
    el("metaScore").textContent=state.score||"—";
    el("metaDifficulty").textContent=DIFFICULTIES[state.difficulty].name;

    el("stageChip").textContent=e.stage;
    el("yearText").textContent=e.year;
    el("sceneTitle").textContent=e.title;
    el("sceneText").textContent=e.text;
    el("progressBar").style.width=sceneProgress()+"%";
    el("typeChip").textContent=e.type==="side"?"支线任务":e.type==="random"?"随机事件":"主线";
    el("typeChip").className="type-chip"+(e.type==="side"?" side":e.type==="random"?" random":"");
    el("effectHint").textContent=e.type==="main"?"部分主线节点会随机触发支线；同一周目触发过的支线不会重复。":"完成这段支线后，你会回到原来的主线。";

    var box=el("choices");
    box.innerHTML="";
    e.choices.forEach(function(c){
      var ok=requirementsMet(c.requires);
      var b=document.createElement("button");
      b.className="choice-btn";
      b.disabled=!ok;
      var sub=ok?c.sub:"条件不足："+requirementText(c.requires);
      b.innerHTML="<b>"+escapeHtml(c.text)+"</b><small>"+escapeHtml(sub)+"</small>";
      b.addEventListener("click",function(){choose(c);});
      box.appendChild(b);
    });
    renderLog();
    saveState();
  }

  function renderLog(){
    el("lifeLog").innerHTML=state.log.map(function(x){
      return "<div class=\"log-item\"><strong>"+escapeHtml(x.title)+"</strong><br>"+escapeHtml(x.text)+"</div>";
    }).join("");
  }

  function evaluateEnding(){
    var s=state.stats;
    var school=schoolById(state.schoolId);
    var prefix=school?"从 "+school.name+" 出发，":"";
    if(state.flags.has("academicianTrack")&&s.research>=78&&s.reputation>=70)
      return ["顶尖学者 / 院士路线",prefix+"你把大量人生投入到科研、团队和学术共同体。最终，你成为领域的重要坐标之一。"];
    if(state.flags.has("director")&&s.reputation>=72)
      return ["科主任 / 学科带头人",prefix+"你不只会看病，也开始决定一个科室怎样培养年轻医生、怎样分配资源、怎样承担责任。"];
    if(state.flags.has("expert")&&s.knowledge>=75)
      return ["一线临床专家",prefix+"复杂病例不断被送到你面前。你的价值不只是一串论文，而是那句：这个病人交给你，我放心。"];
    if(state.flags.has("lifeTrack")&&s.mental>=65)
      return ["长期主义医生",prefix+"你没有把全部人生献祭给职称表格。你依然是一名可靠的医生，也保住了生活、关系和自我。"];
    if(s.research>=65)return ["研究型主任医师",prefix+"你在临床之外建立了稳定科研方向，论文、项目和团队逐渐形成了自己的学术标签。"];
    if(s.reputation>=60)return ["口碑型主任医师",prefix+"你未必是最会卷的那个，但患者、学生和同事长期记得你的可靠。"];
    return ["普通但真实的医生",prefix+"你没有成为传奇，也没有失败。你完成漫长训练，在真实医院里承担着一名医生每天该承担的工作。"];
  }

  function humanFlag(flag){
    var map={
      gaokaoTop:"高考高分局",underdogStart:"逆风开局",ambitious:"目标明确",balanced:"生活派",pragmatic:"现实派",
      humanism:"人文关怀",steady:"稳定学习",earlyResearch:"早期科研",clinicalFirst:"临床优先",doubleTrack:"双线发展",
      communication:"沟通能力",clinicalCourage:"临床勇气",academic:"学术路线",integrity:"科研诚信",teamPlayer:"团队协作",
      solidResident:"扎实规培",selfCare:"自我保护",dutyFirst:"责任优先",researchTrack:"科研晋升",clinicalTrack:"临床专家",
      lifeTrack:"长期主义",familyTime:"家庭优先",director:"管理路线",expert:"专家路线",academicianTrack:"学术巅峰",
      campusLove:"校园恋爱",studentLeader:"学生干部",competition:"竞赛经历",researchResilience:"科研韧性",
      authorshipSpeakUp:"维护署名权益",grantPersistence:"基金再战",surgery:"外科路线",internalMedicine:"内科路线",imaging:"影像平台科室"
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
    var tags=Array.from(state.flags).map(humanFlag).filter(Boolean).slice(0,10);
    el("endingTags").innerHTML=tags.map(function(tag){return "<span class=\"ending-tag\">"+escapeHtml(tag)+"</span>";}).join("");
    saveState();
    window.scrollTo({top:0,behavior:"smooth"});
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
    Storage.clear();
    state=null;
    pendingName="";
    selectedDifficulty="normal";
    renderDifficulty();
    resetGaokao();
    showOnly("startScreen");
    el("restartBtn").hidden=true;
    refreshContinue();
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
    var log=el("lifeLog");
    var hidden=log.style.display==="none";
    log.style.display=hidden?"grid":"none";
    el("toggleLogBtn").textContent=hidden?"收起":"展开";
  });

  renderDifficulty();
  resetGaokao();
  refreshContinue();
})();