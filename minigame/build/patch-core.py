from pathlib import Path
import sys

path = Path(sys.argv[1])
src = path.read_text(encoding="utf-8")

def replace_once(old, new, label):
    global src
    if old not in src:
        raise RuntimeError("Patch target not found: " + label)
    src = src.replace(old, new, 1)

replace_once(
'''  function grantItem(id,count){
    var item=itemById(id);
    if(!item||!state)return false;
    setItemCount(id,itemCount(id)+(count||1));
    addLog("人生道具","获得「"+item.name+"」×"+(count||1)+"。");
    return true;
  }
''',
'''  function grantItem(id,count){
    var item=itemById(id);
    if(!item||!state)return false;
    setItemCount(id,itemCount(id)+(count||1));
    addLog("人生道具","获得「"+item.name+"」×"+(count||1)+"。");
    return true;
  }

  function hasRealRewardAd(){
    return !!(AD_SERVICE&&AD_SERVICE.isRealAdAvailable&&AD_SERVICE.isRealAdAvailable());
  }

  function grantStarterItems(){
    if(!state||state.starterItemsGranted)return;
    state.starterItemsGranted=true;
    state.milestoneItemRewards=state.milestoneItemRewards||{};
    if(state.scene)state.milestoneItemRewards[state.scene]="starter";
    /* 初始体力恢复卡固定为 1 张，避免与首个关键节点奖励叠加成 2 张。 */
    setItemCount("energy_card",1);
    grantItem("mental_card",1);
    grantItem("hint_card",1);
    addLog("入学补给","完成入学，获得体力恢复卡 ×1、心理恢复卡 ×1、决策提示卡 ×1。后续关键人生节点仍可继续获得道具。");
  }

  function grantMilestoneItem(scene){
    if(!state||!scene)return;
    state.milestoneItemRewards=state.milestoneItemRewards||{};
    if(state.milestoneItemRewards[scene])return;
    var claimed=Object.keys(state.milestoneItemRewards).length;
    var pool=["energy_card","mental_card","english_card","hint_card","rewind_card"];
    var id=pool[claimed%pool.length];
    var item=itemById(id);
    if(item&&itemCount(id)>=(item.max||99)){
      id=state.stats.energy<=state.stats.mental?"energy_card":"mental_card";
    }
    state.milestoneItemRewards[scene]=id;
    grantItem(id,1);
    addLog("关键节点奖励","走到新的关键人生节点，获得一份阶段奖励。");
  }

  function admissionCelebrationInfo(a){
    if(!state||!a)return null;
    var isMaster=a.level==="master"||a.level==="overseas_master";
    var isPhd=a.level==="phd";
    if(!isMaster&&!isPhd)return null;
    var flag=isPhd?"phdAdmissionCelebration":"masterAdmissionCelebration";
    if(state.flags.has(flag))return null;
    var energyGain=Math.max(0,Math.min(20,100-Number(state.stats.energy||0)));
    var mentalGain=Math.max(0,Math.min(20,100-Number(state.stats.mental||0)));
    return {
      flag:flag,
      label:isPhd?"博士研究生":"硕士研究生",
      energyGain:energyGain,
      mentalGain:mentalGain
    };
  }

  function claimAdmissionCelebration(a){
    var reward=admissionCelebrationInfo(a);
    if(!reward)return null;
    state.flags.add(reward.flag);
    state.stats.energy=clamp(Number(state.stats.energy||0)+20,0,100);
    state.stats.mental=clamp(Number(state.stats.mental||0)+20,0,100);
    addLog("毕业旅行","恭喜考上"+reward.label+"。毕业旅行让你暂时从备考压力中恢复：体力 +"+reward.energyGain+"，心理 +"+reward.mentalGain+"。");
    return reward;
  }
''',
"item reward helpers"
)

replace_once(
'''    state.lastCheckpointScene=state.scene;
    addLog("关键节点","已记录可回溯节点：「"+state.checkpoint.title+"」。");
  }
''',
'''    state.lastCheckpointScene=state.scene;
    addLog("关键节点","已记录可回溯节点：「"+state.checkpoint.title+"」。");
    grantMilestoneItem(state.scene);
  }
''',
"milestone item reward"
)

replace_once(
'''  function renderInventory(){
    if(!state||!ITEM_DATA||!el("inventoryItems"))return;
    var locked=itemUseLocked();
    el("inventoryLockNote").textContent=locked?"当前为升学/申博/求职竞争流程，道具与广告补给锁定":"广告只提供资源和容错，不改变录取或录用结果";
    el("openSupplyBtn").disabled=locked;
    el("openSupplyBtn").textContent=locked?"竞争流程中不可补给":"获取补给";
    var ids=["energy_card","mental_card","english_card","hint_card","rewind_card"];
''',
'''  function renderInventory(){
    if(!state||!ITEM_DATA||!el("inventoryItems"))return;
    var locked=itemUseLocked();
    var realAd=hasRealRewardAd();
    el("inventoryLockNote").textContent=locked
      ?"当前为升学 / 申博 / 求职竞争流程，道具暂不可使用"
      :(realAd?"道具可通过人生节点奖励获得；激励视频仅提供额外补给":"道具通过入学与关键人生节点奖励获得");
    el("openSupplyBtn").hidden=!realAd;
    el("openSupplyBtn").disabled=locked||!realAd;
    el("openSupplyBtn").textContent=locked?"竞争流程中不可补给":"获取额外补给";
    var ids=["energy_card","mental_card","english_card","hint_card","rewind_card"];
''',
"inventory adless copy"
)

replace_once(
'''  function openSupply(){
    if(!state||itemUseLocked()||rewardBusy)return;
''',
'''  function openSupply(){
    if(!state||itemUseLocked()||rewardBusy||!hasRealRewardAd())return;
''',
"hide unconfigured supply"
)

replace_once(
'''  function requestRewardItem(id,autoUse,button){
    if(rewardBusy||itemUseLocked()||!AD_SERVICE)return;
''',
'''  function requestRewardItem(id,autoUse,button){
    if(rewardBusy||itemUseLocked()||!AD_SERVICE||!hasRealRewardAd())return;
''',
"guard reward ad"
)

replace_once(
'''    el("crisisTitle").textContent=(stat==="energy"?"体力":"心理")+"即将见底";
    el("crisisText").textContent=locked
      ?("当前"+statNames[stat]+"只剩 "+state.stats[stat]+"。你正处于考研、申博或求职竞争流程，道具与广告补给已锁定，只能依靠后续选择继续。")
      :("当前"+statNames[stat]+"只剩 "+state.stats[stat]+"。继续高消耗选择可能提前结束这条人生路线。你可以使用已有恢复卡，或自愿获取一张恢复卡。");
    el("crisisUseBtn").hidden=locked;
    el("crisisAdBtn").hidden=locked;
    el("crisisUseBtn").disabled=itemCount(id)<=0;
    el("crisisUseBtn").textContent=itemCount(id)>0?"使用"+item.name+"（现有 ×"+itemCount(id)+"）":"暂无"+item.name;
    el("crisisAdBtn").textContent=(AD_SERVICE?AD_SERVICE.label():"获取")+" · "+item.name;
''',
'''    el("crisisTitle").textContent=(stat==="energy"?"体力":"心理")+"即将见底";
    var realAd=hasRealRewardAd();
    el("crisisText").textContent=locked
      ?("当前"+statNames[stat]+"只剩 "+state.stats[stat]+"。你正处于升学、申博或求职竞争流程，道具已锁定，只能依靠后续选择继续。")
      :("当前"+statNames[stat]+"只剩 "+state.stats[stat]+"。继续高消耗选择可能提前结束这条人生路线。"+(itemCount(id)>0?"你可以使用已有的"+item.name+"。":"当前没有恢复卡，请谨慎选择下一步。"));
    el("crisisUseBtn").hidden=locked;
    el("crisisAdBtn").hidden=locked||!realAd;
    el("crisisUseBtn").disabled=itemCount(id)<=0;
    el("crisisUseBtn").textContent=itemCount(id)>0?"使用"+item.name+"（现有 ×"+itemCount(id)+"）":"暂无"+item.name;
    if(realAd)el("crisisAdBtn").textContent=AD_SERVICE.label()+" · "+item.name;
''',
"low crisis without ad copy"
)

replace_once(
'''  function enterUniversity(){
    if(!state)return;
    showOnly("gameScreen");el("restartBtn").hidden=false;render();
    scrollAfterRender();
  }
''',
'''  function enterUniversity(){
    if(!state)return;
    grantStarterItems();
    showOnly("gameScreen");el("restartBtn").hidden=false;render();
    saveState();
    scrollAfterRender();
  }
''',
"starter kit on enrollment"
)



replace_once(
'''    if(locked){
      el("crisisText").textContent="这次选择让"+statNames[stat]+"降到了 0。你正处于考研、申博或求职竞争流程，复活机制不会介入这一竞争结果；确认后本局结束。";
      el("crisisUseBtn").hidden=true;
      el("crisisAdBtn").hidden=true;
    }else{
      var canShareRevive=shareReviveAllowed();
      el("crisisText").textContent=canShareRevive
        ?("这次选择让"+statNames[stat]+"降到了 0。本局只有 1 次复活机会：你可以选择「分享复活」或「看激励视频复活」，二选一。复活后如果再次死亡，将直接进入结局。")
        :("这次选择让"+statNames[stat]+"降到了 0。本局只有 1 次复活机会：完整观看激励视频可复活一次。复活后如果再次死亡，将直接进入结局。普通分享不会增加复活次数。");
      el("crisisUseBtn").hidden=!canShareRevive;
      el("crisisUseBtn").disabled=!canShareRevive;
      el("crisisUseBtn").textContent="分享复活 · 本局唯一一次";
      el("crisisAdBtn").hidden=false;
      el("crisisAdBtn").disabled=false;
      var realRewarded=!!(AD_SERVICE&&AD_SERVICE.isRealAdAvailable&&AD_SERVICE.isRealAdAvailable());
      el("crisisAdBtn").textContent=(realRewarded?(AD_SERVICE?AD_SERVICE.label():"观看视频"):"首发免费复活")+" · 本局唯一一次";
    }
''',
'''    var realAd=hasRealRewardAd();
    if(locked){
      el("crisisText").textContent="这次选择让"+statNames[stat]+"降到了 0。你正处于升学、申博或求职竞争流程，复活机制不介入竞争结果；确认后本局结束。";
      el("crisisUseBtn").hidden=true;
      el("crisisAdBtn").hidden=true;
    }else if(realAd){
      el("crisisText").textContent="这次选择让"+statNames[stat]+"降到了 0。本局只有 1 次复活机会。完整观看激励视频后可以继续；复活后如果再次死亡，将直接进入结局。";
      el("crisisUseBtn").hidden=true;
      el("crisisAdBtn").hidden=false;
      el("crisisAdBtn").disabled=false;
      el("crisisAdBtn").textContent="看完整视频复活 · 本局唯一一次";
    }else{
      el("crisisText").textContent="这次选择让"+statNames[stat]+"降到了 0。本局只有 1 次复活机会。当前版本可免费复活一次；复活后如果再次死亡，将直接进入结局。";
      el("crisisUseBtn").hidden=false;
      el("crisisUseBtn").disabled=false;
      el("crisisUseBtn").textContent="免费复活 · 本局唯一一次";
      el("crisisAdBtn").hidden=true;
    }
''',
"fatal crisis first-release behavior"
)

replace_once(
'''  el("crisisUseBtn").addEventListener("click",function(){
    if(!currentCrisisStat)return;
    if(pendingChoiceContinuation){
      requestShareRevive(this);
      return;
    }
    useItem(currentCrisisStat==="energy"?"energy_card":"mental_card",{closeCrisis:true});
  });
''',
'''  el("crisisUseBtn").addEventListener("click",function(){
    if(!currentCrisisStat)return;
    if(pendingChoiceContinuation){
      if(!hasRealRewardAd())performRevive("free");
      return;
    }
    useItem(currentCrisisStat==="energy"?"energy_card":"mental_card",{closeCrisis:true});
  });
''',
"fatal free revive button"
)

replace_once(
'''    state.adRewardsClaimed=raw.adRewardsClaimed||0;
    state.reviveCount=Math.min(1,raw.reviveCount||0);
''',
'''    state.adRewardsClaimed=raw.adRewardsClaimed||0;
    state.starterItemsGranted=!!raw.starterItemsGranted;
    state.milestoneItemRewards=raw.milestoneItemRewards||{};
    state.reviveCount=Math.min(1,raw.reviveCount||0);
''',
"restore item reward state"
)

replace_once(
'''    el("admissionResultText").textContent=r.success
      ?("你已被 "+r.school.name+" "+admissionProgramLabel(a)+" 录取。")
      :("这一次，"+r.school.name+" 没有向你发出录取通知。");
    el("admissionResultMeta").innerHTML=
''',
'''    el("admissionResultText").textContent=r.success
      ?("你已被 "+r.school.name+" "+admissionProgramLabel(a)+" 录取。")
      :("这一次，"+r.school.name+" 没有向你发出录取通知。");
    var celebration=r.success?admissionCelebrationInfo(a):null;
    el("admissionRewardText").textContent=celebration
      ?("🎉 恭喜你考上"+celebration.label+"！毕业旅行后：体力 +"+celebration.energyGain+" · 心理 +"+celebration.mentalGain)
      :"";
    el("admissionResultMeta").innerHTML=
''',
"admission celebration preview"
)

replace_once(
'''    if(r.success){
      if(a.level==="master"){
''',
'''    if(r.success){
      claimAdmissionCelebration(a);
      if(a.level==="master"){
''',
"claim admission celebration reward"
)

replace_once(
'''    el("admissionResultBtn").textContent=r.success?"确认录取 · 写入教育档案":"确认结果 · 继续下一步";
''',
'''    el("admissionResultBtn").textContent=r.success
      ?(celebration?"结束毕业旅行 · 写入教育档案":"确认录取 · 写入教育档案")
      :"确认结果 · 继续下一步";
''',
"admission reward confirmation label"
)

replace_once(
'''    if(/医学专科|本科|大一|白大褂|见习|实训/.test(label))m=.56;
    else if(/本科衔接|专升本/.test(label))m=.62;
    else if(/研究生|硕士|临床专硕|学硕/.test(label))m=.72;
    else if(/博士后|科研职业|博士/.test(label))m=.78;
    else if(/规培|住院医师/.test(label))m=1.00;
    else if(/主治|高级职称|职业成熟|青年医生/.test(label))m=.82;
''',
'''    if(/医学专科|本科|大一|白大褂|见习|实训/.test(label))m=.56;
    else if(/本科衔接|专升本/.test(label))m=.62;
    /* 硕士与博士阶段压力更高：同样的学习/科研选择会消耗更多体力与心理。 */
    else if(/研究生|硕士|临床专硕|学硕/.test(label))m=.92;
    else if(/博士/.test(label)&&!/博士后/.test(label))m=1.06;
    else if(/博士后|科研职业/.test(label))m=.88;
    else if(/规培|住院医师/.test(label))m=1.00;
    else if(/主治|高级职称|职业成熟|青年医生/.test(label))m=.82;
''',
"higher master and phd pressure"
)

replace_once(
'''  function renderDecisionHint(e){
    if(!el("decisionHintPanel"))return;
    var show=!!(state&&state.hintScene===state.scene&&!isCompetitiveScene(state.scene,e));
    el("decisionHintPanel").hidden=!show;
    if(show)el("decisionHintContent").innerHTML=decisionHintHtml(e);
  }

''',
'''  function renderDecisionHint(e){
    if(!el("decisionHintPanel"))return;
    var show=!!(state&&state.hintScene===state.scene&&!isCompetitiveScene(state.scene,e));
    el("decisionHintPanel").hidden=!show;
    if(show)el("decisionHintContent").innerHTML=decisionHintHtml(e);
  }

  function studyRecoveryChoices(e){
    if(!state||!e||isCompetitiveScene(state.scene,e))return [];
    var label=((e.stage||"")+" "+(e.title||"")+" "+(state.route||""));
    var phase=null;
    if(/博士/.test(label)&&!/博士后/.test(label))phase="phd";
    else if(/研究生|硕士|临床专硕|学硕/.test(label))phase="master";
    if(!phase)return [];
    var flag="studyRecovery_"+state.scene;
    if(state.flags.has(flag))return [];
    if(state.stats.energy>58&&state.stats.mental>58)return [];

    var out=[];
    if(state.stats.energy<=58){
      out.push({
        text:"今晚不硬撑，早点睡一觉",
        sub:"暂时放下任务，恢复体力，也让情绪缓下来。",
        effects:{energy:14,mental:5},
        recoveryBreak:flag,
        recoveryLabel:"早点休息"
      });
    }
    if(state.stats.mental<=58){
      out.push({
        text:"周末出去走走，给自己放半天假",
        sub:"短暂离开实验室或病房，恢复心理，也补回一点体力。",
        effects:{energy:7,mental:14,money:-1},
        recoveryBreak:flag,
        recoveryLabel:"周末放松"
      });
    }
    return out;
  }

''',
"master phd recovery choice helper"
)

replace_once(
'''    var box=el("choices");
    box.innerHTML="";
    e.choices.filter(choiceVisible).forEach(function(c){
      var ok=requirementsMet(c.requires)&&(c.jobEligible!==false);
      var b=document.createElement("button");
''',
'''    var box=el("choices");
    box.innerHTML="";
    var visibleChoices=studyRecoveryChoices(e).concat(e.choices.filter(choiceVisible));
    visibleChoices.forEach(function(c){
      var ok=requirementsMet(c.requires)&&(c.jobEligible!==false);
      var b=document.createElement("button");
''',
"inject study recovery choices"
)

replace_once(
'''  function choose(choice){
    var current=allEvents()[state.scene];
    if(!current)return;

    applyEffects(choice.effects);
''',
'''  function choose(choice){
    var current=allEvents()[state.scene];
    if(!current)return;

    if(choice.recoveryBreak){
      applyEffects(choice.effects);
      state.flags.add(choice.recoveryBreak);
      addLog("恢复时间",(choice.recoveryLabel||"短暂休息")+" → "+effectText(choice.effects));
      saveState();render();scrollAfterRender();
      return;
    }

    applyEffects(choice.effects);
''',
"handle one-time study recovery choices"
)


path.write_text(src, encoding="utf-8")
print("Mini Game core behavior patches applied.")
