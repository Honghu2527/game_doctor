(function () {
  "use strict";

  var DATA = window.GAME_DATA;
  var DIFFICULTIES = DATA.difficulties;
  var EVENTS = DATA.events;
  var ORDER = DATA.order;

  var state = null;
  var selectedDifficulty = "normal";
  var statKeys = ["knowledge","energy","mental","money","research","reputation"];
  var statNames = {
    knowledge:"知识", energy:"体力", mental:"心理", money:"金钱", research:"科研", reputation:"声望"
  };

  function el(id){ return document.getElementById(id); }

  function renderDifficulty(){
    var grid = el("difficultyGrid");
    grid.innerHTML = "";
    Object.keys(DIFFICULTIES).forEach(function(key){
      var d = DIFFICULTIES[key];
      var b = document.createElement("button");
      b.className = "difficulty-card" + (key === selectedDifficulty ? " active" : "");
      b.innerHTML = "<strong>" + d.name + "</strong><span>" + d.desc + "</span>";
      b.addEventListener("click", function(){
        selectedDifficulty = key;
        renderDifficulty();
      });
      grid.appendChild(b);
    });
  }

  function newGame(){
    var d = DIFFICULTIES[selectedDifficulty];
    state = {
      name: el("playerName").value.trim() || "无名医学生",
      difficulty: selectedDifficulty,
      stats: Object.assign({}, d.start),
      flags: new Set(),
      scene: "entrance",
      log: []
    };
    el("startScreen").hidden = true;
    el("endingScreen").hidden = true;
    el("gameScreen").hidden = false;
    el("restartBtn").hidden = false;
    addLog("入学", state.name + " 进入临床医学专业。");
    render();
  }

  function clampStats(){
    statKeys.forEach(function(k){
      state.stats[k] = Math.max(0, Math.min(100, Math.round(state.stats[k])));
    });
  }

  function applyEffects(effects){
    effects = effects || {};
    var scale = DIFFICULTIES[state.difficulty].negativeScale;
    Object.keys(effects).forEach(function(k){
      var v = effects[k];
      var delta = v < 0 ? v * scale : v;
      state.stats[k] = (state.stats[k] || 0) + delta;
    });
    clampStats();
  }

  function effectText(effects){
    effects = effects || {};
    return Object.keys(effects).map(function(k){
      var v = effects[k];
      return statNames[k] + " " + (v > 0 ? "+" : "") + v;
    }).join(" · ");
  }

  function requirementsMet(req){
    if (!req) return true;
    if (req.stats) {
      var okStats = Object.keys(req.stats).every(function(k){
        return state.stats[k] >= req.stats[k];
      });
      if (!okStats) return false;
    }
    if (req.flags) {
      return req.flags.every(function(f){ return state.flags.has(f); });
    }
    return true;
  }

  function requirementText(req){
    if (!req) return "";
    var parts = [];
    if (req.stats) {
      Object.keys(req.stats).forEach(function(k){
        parts.push(statNames[k] + "≥" + req.stats[k]);
      });
    }
    if (req.flags) parts.push("需要前置经历");
    return parts.join("、");
  }

  function resolveChance(chance){
    if (!chance) return null;
    var p = chance.p;
    if (chance.bonusBy && chance.bonusBy.length) {
      var avg = chance.bonusBy.reduce(function(sum,k){ return sum + state.stats[k]; },0) / chance.bonusBy.length;
      p += (avg - 50) / 220;
    }
    p = Math.max(0.08, Math.min(0.92, p));
    var success = Math.random() < p;
    applyEffects(success ? chance.success : chance.fail);
    addLog(success ? "幸运事件" : "挫折事件",
      success ? "这一次，积累和运气都站在了你这边。" : "这一次结果没有如愿，但人生继续。");
    return success;
  }

  function addLog(title,text){
    state.log.unshift({title:title,text:text});
  }

  function choose(choice){
    var current = EVENTS[state.scene];
    applyEffects(choice.effects);
    (choice.flags || []).forEach(function(f){ state.flags.add(f); });
    if (choice.chance) resolveChance(choice.chance);

    var effects = effectText(choice.effects);
    addLog(current.stage, current.title + " → " + choice.text + (effects ? "（" + effects + "）" : ""));

    if (state.stats.mental <= 0 || state.stats.energy <= 0) {
      showEnding("burnout");
      return;
    }

    if (choice.next === "__END__") {
      showEnding();
      return;
    }

    state.scene = choice.next;
    render();
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function sceneProgress(){
    var i = ORDER.indexOf(state.scene);
    if (i < 0) return 0;
    return Math.round(((i + 1) / ORDER.length) * 100);
  }

  function render(){
    var e = EVENTS[state.scene];

    statKeys.forEach(function(k){
      var id = "stat" + k.charAt(0).toUpperCase() + k.slice(1);
      el(id).textContent = state.stats[k];
    });

    el("stageChip").textContent = e.stage;
    el("yearText").textContent = e.year;
    el("sceneTitle").textContent = e.title;
    el("sceneText").textContent = e.text;
    el("progressBar").style.width = sceneProgress() + "%";
    el("effectHint").textContent = "提示：部分选择会记录隐藏经历，并在多年后改变你的结局。";

    var box = el("choices");
    box.innerHTML = "";

    e.choices.forEach(function(c){
      var ok = requirementsMet(c.requires);
      var b = document.createElement("button");
      b.className = "choice-btn";
      b.disabled = !ok;
      var sub = ok ? c.sub : "条件不足：" + requirementText(c.requires);
      b.innerHTML = "<b>" + c.text + "</b><small>" + sub + "</small>";
      b.addEventListener("click", function(){ choose(c); });
      box.appendChild(b);
    });

    renderLog();
  }

  function renderLog(){
    var box = el("lifeLog");
    box.innerHTML = state.log.map(function(x){
      return "<div class=\"log-item\"><strong>" + x.title + "</strong><br>" + x.text + "</div>";
    }).join("");
  }

  function evaluateEnding(){
    var s = state.stats;

    if (state.flags.has("academicianTrack") && s.research >= 78 && s.reputation >= 70) {
      return ["顶尖学者 / 院士路线",
        "你把大量人生投入到科研、团队和学术共同体。最终，你成为领域的重要坐标之一。你也很清楚，每一个漂亮数字背后都有许多个凌晨。"];
    }
    if (state.flags.has("director") && s.reputation >= 72) {
      return ["科主任 / 学科带头人",
        "你不只会看病，也开始决定一个科室怎样培养年轻医生、怎样分配资源、怎样承担责任。"];
    }
    if (state.flags.has("expert") && s.knowledge >= 75) {
      return ["一线临床专家",
        "复杂病例不断被送到你面前。你的价值不只是一串论文，而是那句：这个病人交给你，我放心。"];
    }
    if (state.flags.has("lifeTrack") && s.mental >= 65) {
      return ["长期主义医生",
        "你没有把全部人生献祭给职称表格。你依然是一名可靠的医生，也保住了生活、关系和自我。"];
    }
    if (s.research >= 65) {
      return ["研究型主任医师",
        "你在临床之外建立了稳定科研方向，论文、项目和团队逐渐形成了自己的学术标签。"];
    }
    if (s.reputation >= 60) {
      return ["口碑型主任医师",
        "你未必是最会卷的那个，但患者、学生和同事长期记得你的可靠。"];
    }
    return ["普通但真实的医生",
      "你没有成为传奇，也没有失败。你完成漫长训练，在真实医院里承担着一名医生每天该承担的工作。"];
  }

  function humanFlag(flag){
    var map = {
      ambitious:"理想主义", balanced:"生活派", pragmatic:"现实派", humanism:"人文关怀",
      steady:"稳定学习", earlyResearch:"早期科研", clinicalFirst:"临床优先", doubleTrack:"双线发展",
      communication:"沟通能力", clinicalCourage:"临床勇气", academic:"学术路线",
      integrity:"科研诚信", teamPlayer:"团队协作", solidResident:"扎实规培",
      selfCare:"自我保护", dutyFirst:"责任优先", researchTrack:"科研晋升",
      clinicalTrack:"临床专家", lifeTrack:"长期主义", familyTime:"家庭优先",
      director:"管理路线", expert:"专家路线", academicianTrack:"学术巅峰"
    };
    return map[flag] || null;
  }

  function showEnding(type){
    el("gameScreen").hidden = true;
    el("endingScreen").hidden = false;

    var ending = type === "burnout"
      ? ["提前离开临床","长期透支终于超过了承受范围。离开不等于失败——这是这条时间线的终点，也是另一条人生线的起点。"]
      : evaluateEnding();

    el("endingTitle").textContent = ending[0];
    el("endingText").textContent = ending[1];
    el("endingStats").innerHTML = statKeys.map(function(k){
      return "<div class=\"ending-stat\"><span>" + statNames[k] + "</span><strong>" + state.stats[k] + "</strong></div>";
    }).join("");

    var tags = Array.from(state.flags).map(humanFlag).filter(Boolean).slice(0,8);
    el("endingTags").innerHTML = tags.map(function(tag){
      return "<span class=\"ending-tag\">" + tag + "</span>";
    }).join("");
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function reset(){
    state = null;
    el("startScreen").hidden = false;
    el("gameScreen").hidden = true;
    el("endingScreen").hidden = true;
    el("restartBtn").hidden = true;
    window.scrollTo({top:0,behavior:"smooth"});
  }

  el("startBtn").addEventListener("click",newGame);
  el("restartBtn").addEventListener("click",reset);
  el("endingRestartBtn").addEventListener("click",reset);
  el("toggleLogBtn").addEventListener("click",function(){
    var log = el("lifeLog");
    var hidden = log.style.display === "none";
    log.style.display = hidden ? "grid" : "none";
    el("toggleLogBtn").textContent = hidden ? "收起" : "展开";
  });

  renderDifficulty();
})();
