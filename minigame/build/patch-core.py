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
    grantItem("energy_card",1);
    grantItem("mental_card",1);
    grantItem("hint_card",1);
    addLog("入学补给","完成入学，获得基础道具补给。后续关键人生节点仍可继续获得道具。");
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
'''  function performRevive(method){
    if(!pendingChoiceContinuation||!currentCrisisStat||!state)return false;
    var rs=reviveStatus();
    if(rs.count>=1)return false;
    if(method==="share"&&rs.shareUsed)return false;
    if(method==="ad"&&rs.adUsed)return false;

    if(method==="share")state.shareReviveUsed=true;
    if(method==="ad")state.adReviveUsed=true;
    state.reviveCount=1;

    var stat=currentCrisisStat;
    state.stats[stat]=Math.max(Number(state.stats[stat]||0),25);
    if(state.stats.energy<=0)state.stats.energy=18;
    if(state.stats.mental<=0)state.stats.mental=18;
    state.crisisWarned=state.crisisWarned||{energy:false,mental:false};
    state.crisisWarned.energy=false;
    state.crisisWarned.mental=false;
    state.shareNudgeVisible=method==="ad";

    addLog("人生复活",(method==="share"?"完成分享后复活":"完整观看激励视频后复活")+"。本局唯一一次复活机会已经使用。");
    closeCrisis();
    saveState();
    resumePendingChoice();
    return true;
  }
''',
'''  function performRevive(method){
    if(!pendingChoiceContinuation||!currentCrisisStat||!state)return false;
    var rs=reviveStatus();
    if(rs.count>=1)return false;
    if(method==="share"&&rs.shareUsed)return false;
    if(method==="ad"&&rs.adUsed)return false;

    if(method==="share")state.shareReviveUsed=true;
    if(method==="ad")state.adReviveUsed=true;
    state.reviveCount=1;

    var stat=currentCrisisStat;
    state.stats[stat]=Math.max(Number(state.stats[stat]||0),25);
    if(state.stats.energy<=0)state.stats.energy=18;
    if(state.stats.mental<=0)state.stats.mental=18;
    state.crisisWarned=state.crisisWarned||{energy:false,mental:false};
    state.crisisWarned.energy=false;
    state.crisisWarned.mental=false;
    state.shareNudgeVisible=method==="ad";

    var reviveLabel=method==="free"?"首发版本免费复活":(method==="share"?"完成分享后复活":"完整观看激励视频后复活");
    addLog("人生复活",reviveLabel+"。本局唯一一次复活机会已经使用。");
    closeCrisis();
    saveState();
    resumePendingChoice();
    return true;
  }
''',
"free revive support"
)

replace_once(
'''    if(locked){
      el("crisisText").textContent="这次选择让"+statNames[stat]+"降到了 0。你正处于考研、申博或求职竞争流程，分享和广告复活不会介入这一竞争结果；确认后本局结束。";
      el("crisisUseBtn").hidden=true;
      el("crisisAdBtn").hidden=true;
    }else{
      el("crisisText").textContent="这次选择让"+statNames[stat]+"降到了 0。本局只有 1 次复活机会：你可以选择「分享复活」或「看激励视频复活」，二选一。复活后如果再次死亡，将直接进入结局。";
      el("crisisUseBtn").hidden=false;
      el("crisisUseBtn").disabled=false;
      el("crisisUseBtn").textContent="分享复活 · 本局唯一一次";
      el("crisisAdBtn").hidden=false;
      el("crisisAdBtn").disabled=false;
      el("crisisAdBtn").textContent=(AD_SERVICE?AD_SERVICE.label():"观看视频")+" · 复活";
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

path.write_text(src, encoding="utf-8")
print("Mini Game core behavior patches applied.")
