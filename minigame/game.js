/* 微信小游戏入口：网页版同源逻辑 + 原生 Canvas 视觉复刻层 */
GameGlobal.window = GameGlobal;
GameGlobal.global = GameGlobal;

/* 必须抢在任何模块之前创建：微信小游戏第一次 createCanvas 才是上屏 Canvas。 */
GameGlobal.__SCREEN_CANVAS__ = wx.createCanvas();

try {
  require("./src/dom-adapter.js");

  require("./data/backgrounds.js");
  require("./data/schools.js");
  require("./data/events.js");
  require("./data/school_system.js");
  require("./data/schools_expansion.js");
  require("./data/career_tree.js");
  require("./data/college_route.js");
  require("./data/specialty_system.js");
  require("./data/education_system.js");
  require("./data/language_system.js");
  require("./data/job_system.js");
  require("./data/item_system.js");
  require("./data/opportunity_flows.js");
  require("./data/college_opportunities.js");

  require("./app-board.js");
  require("./src/native-bridge.js");

  /* 先挂载渲染器，让启动阶段也能立即上屏。 */
  require("./src/renderer.js");

  /* 最后加载已经审核过的网页版核心逻辑。 */
  require("./app-core.js");

  if (typeof GameGlobal.__MINI_RENDER__ === "function") {
    GameGlobal.__MINI_RENDER__();
  }
} catch (err) {
  GameGlobal.__MINI_FATAL_ERROR__ = err;
  try {
    if (typeof GameGlobal.__MINI_RENDER__ === "function") {
      GameGlobal.__MINI_RENDER__();
    } else {
      var c = GameGlobal.__SCREEN_CANVAS__;
      var x = c && c.getContext && c.getContext("2d");
      if (x) {
        x.fillStyle = "#f3eee5";
        x.fillRect(0,0,c.width||375,c.height||667);
        x.fillStyle = "#8d332d";
        x.font = "18px sans-serif";
        x.fillText("小游戏启动失败",24,52);
        x.fillStyle = "#333";
        x.font = "12px sans-serif";
        x.fillText(String(err && (err.message||err) || "unknown error").slice(0,80),24,82);
      }
    }
  } catch (_) {}
  try { console.error("[medical-life] boot failed", err); } catch (_) {}
}
