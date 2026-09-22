(function(){
  "use strict";

  var BOARD_KEY="doctor-life-message-wall-v2";
  var LEGACY_KEY="doctor-life-message-wall-v1";
  var USER_KEY="doctor-life-community-user-v1";
  var MAX_MESSAGES=500;
  var listeners=[];

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
  function normalizeComment(c){
    return {
      id:c.id||uid("c"),
      ownerId:c.ownerId||"legacy",
      author:c.author||"匿名医学生",
      text:String(c.text||"").slice(0,120),
      createdAt:c.createdAt||now()
    };
  }
  function normalizeMessage(m){
    return {
      id:m.id||uid("m"),
      ownerId:m.ownerId||"legacy",
      author:m.author||"匿名医学生",
      school:m.school||"未知起点",
      ending:m.ending||"医学人生",
      message:String(m.message||"").slice(0,200),
      createdAt:m.createdAt||now(),
      likes:Array.isArray(m.likes)?m.likes:[],
      comments:Array.isArray(m.comments)?m.comments.map(normalizeComment):[]
    };
  }
  function read(){
    try{
      var raw=localStorage.getItem(BOARD_KEY);
      if(raw){
        return safeParse(raw,[]).map(normalizeMessage);
      }
      var legacy=safeParse(localStorage.getItem(LEGACY_KEY),[]);
      if(legacy.length){
        var migrated=legacy.map(normalizeMessage);
        write(migrated);
        return migrated;
      }
    }catch(e){}
    return [];
  }
  function write(list){
    var trimmed=list.slice(0,MAX_MESSAGES);
    try{localStorage.setItem(BOARD_KEY,JSON.stringify(trimmed));}catch(e){}
    emit(trimmed);
    return trimmed;
  }
  function emit(list){
    listeners.forEach(function(fn){
      try{fn(list||read());}catch(e){}
    });
  }
  function findMessage(list,id){
    return list.find(function(m){return m.id===id;});
  }

  var api={
    mode:"local",
    modeLabel:"本地演示",
    currentUserId:getUserId,
    list:function(sort){
      var list=read().slice();
      if(sort==="liked"){
        list.sort(function(a,b){
          var d=(b.likes||[]).length-(a.likes||[]).length;
          return d||b.createdAt-a.createdAt;
        });
      }else{
        list.sort(function(a,b){return b.createdAt-a.createdAt;});
      }
      return list;
    },
    latest:function(limit){
      return api.list("newest").slice(0,limit||10);
    },
    createMessage:function(payload){
      var list=read();
      var item=normalizeMessage({
        id:uid("m"),
        ownerId:getUserId(),
        author:payload.author,
        school:payload.school,
        ending:payload.ending,
        message:payload.message,
        createdAt:now(),
        likes:[],
        comments:[]
      });
      list.unshift(item);
      write(list);
      return item;
    },
    deleteMessage:function(messageId){
      var me=getUserId(),list=read(),m=findMessage(list,messageId);
      if(!m||m.ownerId!==me)return {ok:false,reason:"forbidden"};
      list=list.filter(function(x){return x.id!==messageId;});
      write(list);
      return {ok:true};
    },
    toggleLike:function(messageId){
      var me=getUserId(),list=read(),m=findMessage(list,messageId);
      if(!m)return {ok:false,reason:"not_found"};
      var idx=m.likes.indexOf(me);
      if(idx>=0)m.likes.splice(idx,1);else m.likes.push(me);
      write(list);
      return {ok:true,liked:idx<0,count:m.likes.length};
    },
    addComment:function(messageId,payload){
      var list=read(),m=findMessage(list,messageId);
      if(!m)return {ok:false,reason:"not_found"};
      var text=String(payload.text||"").trim().slice(0,120);
      if(!text)return {ok:false,reason:"empty"};
      var c=normalizeComment({
        id:uid("c"),
        ownerId:getUserId(),
        author:payload.author||"匿名医学生",
        text:text,
        createdAt:now()
      });
      m.comments.push(c);
      write(list);
      return {ok:true,comment:c};
    },
    deleteComment:function(messageId,commentId){
      var me=getUserId(),list=read(),m=findMessage(list,messageId);
      if(!m)return {ok:false,reason:"not_found"};
      var c=m.comments.find(function(x){return x.id===commentId;});
      if(!c)return {ok:false,reason:"not_found"};
      if(c.ownerId!==me&&m.ownerId!==me)return {ok:false,reason:"forbidden"};
      m.comments=m.comments.filter(function(x){return x.id!==commentId;});
      write(list);
      return {ok:true};
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
      return function(){listeners=listeners.filter(function(x){return x!==fn;});};
    }
  };

  window.addEventListener("storage",function(e){
    if(e.key===BOARD_KEY)emit();
  });

  window.MESSAGE_BOARD=api;
})();