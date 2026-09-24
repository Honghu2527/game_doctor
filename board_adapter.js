(function(){
  "use strict";

  var CACHE_KEY="doctor-life-public-wall-cache-v1";
  var USER_KEY="doctor-life-community-user-v1";
  var listeners=[];
  var cache=[];
  var syncTimer=null;
  var cloudReady=false;
  var cloudError="";
  var config={};

  try{
    if(typeof require==="function")config=require("./src/config.js")||{};
  }catch(e){config={};}

  function now(){return Date.now();}
  function uid(prefix){
    return (prefix||"id")+"_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,9);
  }
  function safeParse(raw,fallback){
    try{return raw?JSON.parse(raw):fallback;}catch(e){return fallback;}
  }
  function getUserId(){
    try{
      var id=localStorage.getItem(USER_KEY);
      if(!id){
        id=uid("user");
        localStorage.setItem(USER_KEY,id);
      }
      return id;
    }catch(e){
      return "local_user";
    }
  }
  function saveCache(){
    try{localStorage.setItem(CACHE_KEY,JSON.stringify(cache.slice(0,100)));}catch(e){}
  }
  function loadCache(){
    try{
      var raw=safeParse(localStorage.getItem(CACHE_KEY),[]);
      return Array.isArray(raw)?raw:[];
    }catch(e){return [];}
  }
  function syntheticLikes(count,likedByMe){
    var out=[],me=getUserId();
    if(likedByMe)out.push(me);
    for(var i=out.length;i<Math.max(0,Number(count)||0);i++)out.push("remote_"+i);
    return out;
  }
  function normalizeComment(c){
    return {
      id:c.id||uid("c"),
      ownerId:c.mine?getUserId():"remote",
      author:String(c.author||"匿名医学生").slice(0,18),
      text:String(c.text||"").slice(0,120),
      createdAt:Number(c.createdAt)||now()
    };
  }
  function normalizeMessage(m){
    return {
      id:m.id||m._id||uid("m"),
      ownerId:m.mine?getUserId():"remote",
      author:String(m.author||"匿名医学生").slice(0,18),
      school:String(m.school||"未知起点").slice(0,40),
      ending:String(m.ending||"医学人生").slice(0,40),
      message:String(m.message||"").slice(0,200),
      createdAt:Number(m.createdAt)||now(),
      likes:syntheticLikes(m.likesCount!==undefined?m.likesCount:(m.likes||[]).length,!!m.likedByMe),
      comments:Array.isArray(m.comments)?m.comments.map(normalizeComment):[]
    };
  }
  function emit(){
    listeners.slice().forEach(function(fn){
      try{fn(cache.slice());}catch(e){}
    });
  }
  function sortList(list,sort){
    list=list.slice();
    if(sort==="liked"){
      list.sort(function(a,b){
        var d=(b.likes||[]).length-(a.likes||[]).length;
        return d||b.createdAt-a.createdAt;
      });
    }else{
      list.sort(function(a,b){return b.createdAt-a.createdAt;});
    }
    return list;
  }
  function setCloudError(err){
    cloudError=String(err&&err.message||err||"");
  }
  function callCloud(action,data){
    if(!cloudReady||typeof wx==="undefined"||!wx.cloud||!wx.cloud.callFunction){
      return Promise.reject(new Error("online_board_unavailable"));
    }
    var options={
      name:"messageBoard",
      data:Object.assign({action:action},data||{})
    };
    if(config.cloudEnvId)options.config={env:config.cloudEnvId};
    return wx.cloud.callFunction(options).then(function(res){
      var body=res&&res.result||{};
      if(body&&body.ok===false){
        var err=new Error(body.message||body.reason||"留言服务暂不可用");
        err.code=body.reason||"cloud_error";
        throw err;
      }
      return body;
    });
  }
  function sync(){
    if(!cloudReady)return Promise.resolve(cache);
    return callCloud("list",{limit:100}).then(function(body){
      var list=body&&body.messages||[];
      cache=list.map(normalizeMessage);
      saveCache();
      cloudError="";
      emit();
      return cache;
    }).catch(function(err){
      setCloudError(err);
      emit();
      throw err;
    });
  }
  function initCloud(){
    cache=loadCache().map(normalizeMessage);
    if(typeof wx==="undefined"||!wx.cloud||config.messageBoardEnabled===false){
      cloudReady=false;
      cloudError="cloud_not_enabled";
      return;
    }
    try{
      var opt={traceUser:true};
      if(config.cloudEnvId)opt.env=config.cloudEnvId;
      wx.cloud.init(opt);
      cloudReady=true;

      function retrySync(delays,index){
        sync().catch(function(err){
          try{console.warn("[public-wall] sync failed",err);}catch(e){}
          if(index<delays.length){
            setTimeout(function(){retrySync(delays,index+1);},delays[index]);
          }
        });
      }
      retrySync([1000,3000,8000],0);
      syncTimer=setInterval(function(){sync().catch(function(){});},12000);
    }catch(e){
      cloudReady=false;
      setCloudError(e);
    }
  }

  var api={
    mode:"cloud",
    currentUserId:getUserId,
    get modeLabel(){
      if(cloudReady&&!cloudError)return "全体留言 · 在线";
      if(cloudReady){
        var shortErr=String(cloudError||"").replace(/\s+/g," ").slice(0,46);
        return "全体留言 · 重连中"+(shortErr?" · "+shortErr:"");
      }
      return "全体留言 · 云服务未连接";
    },
    isOnline:function(){return !!cloudReady&&!cloudError;},
    lastError:function(){return cloudError;},
    refresh:function(){return sync();},
    list:function(sort){return sortList(cache,sort);},
    latest:function(limit){return sortList(cache,"newest").slice(0,limit||10);},

    createMessage:function(payload){
      payload=payload||{};
      if(!cloudReady)return Promise.reject(new Error("请先连接在线留言服务"));
      return callCloud("create",{
        author:String(payload.author||"匿名医学生").slice(0,18),
        school:String(payload.school||"未知起点").slice(0,40),
        ending:String(payload.ending||"医学人生").slice(0,40),
        message:String(payload.message||"").trim().slice(0,200)
      }).then(function(){return sync();});
    },

    deleteMessage:function(messageId){
      if(!cloudReady)return Promise.reject(new Error("在线留言服务未连接"));
      return callCloud("deleteMessage",{messageId:messageId}).then(function(){return sync();});
    },

    toggleLike:function(messageId){
      if(!cloudReady)return Promise.reject(new Error("在线留言服务未连接"));
      return callCloud("toggleLike",{messageId:messageId}).then(function(body){
        return sync().then(function(){return body;});
      });
    },

    addComment:function(messageId,payload){
      payload=payload||{};
      if(!cloudReady)return Promise.reject(new Error("在线留言服务未连接"));
      return callCloud("addComment",{
        messageId:messageId,
        author:String(payload.author||"匿名医学生").slice(0,18),
        text:String(payload.text||"").trim().slice(0,120)
      }).then(function(){return sync();});
    },

    deleteComment:function(messageId,commentId){
      if(!cloudReady)return Promise.reject(new Error("在线留言服务未连接"));
      return callCloud("deleteComment",{messageId:messageId,commentId:commentId}).then(function(){return sync();});
    },

    reportMessage:function(messageId){
      if(!cloudReady)return Promise.reject(new Error("在线留言服务未连接"));
      return callCloud("report",{messageId:messageId}).then(function(body){
        return sync().then(function(){return body;});
      });
    },

    canDeleteMessage:function(m){
      return !!m&&m.ownerId===getUserId();
    },
    canDeleteComment:function(m,c){
      var me=getUserId();
      return !!m&&!!c&&(c.ownerId===me||m.ownerId===me);
    },
    subscribe:function(fn){
      listeners.push(fn);
      try{fn(cache.slice());}catch(e){}
      return function(){listeners=listeners.filter(function(x){return x!==fn;});};
    }
  };

  initCloud();
  window.MESSAGE_BOARD=api;
})();