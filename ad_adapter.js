(function(){
  "use strict";

  var RUNTIME=(typeof window!=="undefined"&&window.__WECHAT_CONFIG__)||{};
  var CONFIG={
    // 小程序构建从 wechat-src/wechat.config.js 注入；网页版保持为空。
    rewardedAdUnitId:RUNTIME.rewardedAdUnitId||""
  };

  var rewardedAd=null;

  function hasWeChatRewarded(){
    return typeof wx!=="undefined"&&wx&&typeof wx.createRewardedVideoAd==="function"&&!!CONFIG.rewardedAdUnitId;
  }

  function getRewarded(){
    if(!hasWeChatRewarded())return null;
    if(!rewardedAd){
      rewardedAd=wx.createRewardedVideoAd({adUnitId:CONFIG.rewardedAdUnitId});
    }
    return rewardedAd;
  }

  function watchWechat(){
    return new Promise(function(resolve,reject){
      var ad=getRewarded();
      if(!ad){reject(new Error("rewarded ad unavailable"));return;}
      var settled=false;
      function done(res){
        if(settled)return;
        settled=true;
        if(ad.offClose)ad.offClose(done);
        resolve({completed:res===undefined||!!(res&&res.isEnded),provider:"wechat"});
      }
      if(ad.onClose)ad.onClose(done);
      Promise.resolve(ad.show()).catch(function(){
        return ad.load().then(function(){return ad.show();});
      }).catch(function(err){
        if(ad.offClose)ad.offClose(done);
        reject(err);
      });
    });
  }

  function isWechatRuntime(){
    return typeof wx!=="undefined"&&!!wx;
  }

  function watchWebSimulation(){
    // 仅网页预览使用模拟奖励；正式微信环境若没有广告位，绝不发放模拟奖励。
    return new Promise(function(resolve){
      window.setTimeout(function(){
        resolve({completed:true,provider:"web-sim",simulated:true});
      },900);
    });
  }

  window.AD_SERVICE={
    config:CONFIG,
    mode:hasWeChatRewarded()?"wechat":(isWechatRuntime()?"wechat-unconfigured":"web-sim"),
    isRealAdAvailable:hasWeChatRewarded,
    label:function(){
      if(hasWeChatRewarded())return "观看广告领取";
      return isWechatRuntime()?"广告暂未配置":"网页版测试领取";
    },
    watchRewarded:function(){
      if(hasWeChatRewarded())return watchWechat();
      if(isWechatRuntime())return Promise.reject(new Error("rewarded ad unit id is not configured"));
      return watchWebSimulation();
    }
  };
})();