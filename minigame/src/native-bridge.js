"use strict";

var config=require("./config.js");
var G=GameGlobal;
var wxapi=wx;

G.__WECHAT_CONFIG__={
  rewardedAdUnitId:config.rewardedAdUnitId||"",
  reviewSafe:true
};

var rewarded=null;
function realAdAvailable(){
  return !!(config.rewardedAdUnitId&&wxapi.createRewardedVideoAd);
}
function getAd(){
  if(!realAdAvailable())return null;
  if(!rewarded)rewarded=wxapi.createRewardedVideoAd({adUnitId:config.rewardedAdUnitId});
  return rewarded;
}
G.AD_SERVICE={
  config:{rewardedAdUnitId:config.rewardedAdUnitId||""},
  mode:realAdAvailable()?"wechat":"wechat-unconfigured",
  isRealAdAvailable:realAdAvailable,
  label:function(){return realAdAvailable()?"观看广告领取":"广告暂未配置";},
  watchRewarded:function(){
    return new Promise(function(resolve,reject){
      var ad=getAd();
      if(!ad){reject(new Error("rewarded ad unit id is not configured"));return;}
      var settled=false;
      function close(res){
        if(settled)return;settled=true;
        if(ad.offClose)ad.offClose(close);
        resolve({completed:res===undefined||!!(res&&res.isEnded),provider:"wechat"});
      }
      if(ad.onClose)ad.onClose(close);
      Promise.resolve(ad.show()).catch(function(){return ad.load().then(function(){return ad.show();});}).catch(function(err){
        if(ad.offClose)ad.offClose(close);
        reject(err);
      });
    });
  }
};

function sharePayload(payload){
  payload=payload||{};
  return {
    title:payload.title||"医学生养成记录｜这一局我走到了这里",
    query:"share=1"
  };
}
G.SHARE_SERVICE={
  config:{shareReviveEnabled:false},
  prepareWechatMenu:function(){
    try{if(wxapi.showShareMenu)wxapi.showShareMenu({menus:["shareAppMessage","shareTimeline"]});}catch(e){}
    return true;
  },
  share:function(payload){
    return new Promise(function(resolve){
      try{
        if(wxapi.shareAppMessage){
          wxapi.shareAppMessage(sharePayload(payload));
          resolve({ok:true,mode:"wechat-share"});
        }else{
          resolve({ok:false,mode:"unsupported"});
        }
      }catch(e){resolve({ok:false,mode:"error"});}
    });
  },
  payload:function(){return sharePayload();}
};

try{
  if(wxapi.showShareMenu)wxapi.showShareMenu({menus:["shareAppMessage","shareTimeline"]});
  if(wxapi.onShareAppMessage)wxapi.onShareAppMessage(function(){return sharePayload();});
}catch(e){}

module.exports={AD_SERVICE:G.AD_SERVICE,SHARE_SERVICE:G.SHARE_SERVICE};
