(function(){
  "use strict";

  var CONFIG={
    // 开发版按当前玩法开启。正式微信小程序提审前可一键关闭。
    shareReviveEnabled:true
  };

  function defaultPayload(){
    return {
      title:"医学生养成记录｜这一局我走到了这里",
      text:"从高考、医学院、升学、规培到职业选择，我刚走完一段医学人生。你也来试试自己的路线。",
      url:(typeof location!=="undefined"?location.href.split("?")[0]+"?share=1":"")
    };
  }

  function share(payload){
    payload=Object.assign(defaultPayload(),payload||{});
    if(typeof navigator!=="undefined"&&navigator.share){
      return navigator.share({title:payload.title,text:payload.text,url:payload.url})
        .then(function(){return {ok:true,mode:"native"};});
    }
    if(typeof navigator!=="undefined"&&navigator.clipboard&&navigator.clipboard.writeText){
      return navigator.clipboard.writeText(payload.text+"\n"+payload.url)
        .then(function(){return {ok:true,mode:"clipboard"};});
    }
    return Promise.resolve({ok:false,mode:"unsupported"});
  }

  function prepareWechatMenu(){
    if(typeof wx!=="undefined"&&wx&&typeof wx.showShareMenu==="function"){
      try{wx.showShareMenu({menus:["shareAppMessage","shareTimeline"]});}catch(e){}
      return true;
    }
    return false;
  }

  window.SHARE_SERVICE={
    config:CONFIG,
    share:share,
    prepareWechatMenu:prepareWechatMenu,
    payload:defaultPayload,
    note:"正式原生微信小程序迁移时，用 open-type=share / onShareAppMessage 接入。shareReviveEnabled 可在提审前关闭分享复活。"
  };
})();