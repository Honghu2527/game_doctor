(function(){
  "use strict";

  var CONFIG={
    // 微信小程序正式上线后填真实激励视频广告位 ID。
    rewardedAdUnitId:""
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
        resolve({completed:!!(res&&res.isEnded),provider:"wechat"});
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

  function watchWebSimulation(){
    // 网页版仅用于测试奖励机制，不展示商业广告。
    return new Promise(function(resolve){
      window.setTimeout(function(){
        resolve({completed:true,provider:"web-sim",simulated:true});
      },900);
    });
  }

  window.AD_SERVICE={
    config:CONFIG,
    mode:hasWeChatRewarded()?"wechat":"web-sim",
    isRealAdAvailable:hasWeChatRewarded,
    label:function(){
      return hasWeChatRewarded()?"观看广告领取":"网页版测试领取";
    },
    watchRewarded:function(){
      return hasWeChatRewarded()?watchWechat():watchWebSimulation();
    }
  };
})();