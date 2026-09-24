"use strict";

const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const COLLECTION = "message_board";
const MAX_LIST = 100;
const MAX_COMMENTS = 40;
const REPORT_HIDE_THRESHOLD = 3;
const POST_COOLDOWN_MS = 12000;

function cleanText(value, max) {
  return String(value == null ? "" : value).replace(/\s+/g, " ").trim().slice(0, max);
}

function publicComment(c, openid) {
  return {
    id: c.id,
    author: c.author || "匿名医学生",
    text: c.text || "",
    createdAt: Number(c.createdAt) || Date.now(),
    mine: c.ownerOpenId === openid
  };
}

function publicMessage(m, openid) {
  const likes = Array.isArray(m.likes) ? m.likes : [];
  const comments = Array.isArray(m.comments) ? m.comments : [];
  return {
    id: m._id,
    author: m.author || "匿名医学生",
    school: m.school || "未知起点",
    ending: m.ending || "医学人生",
    message: m.message || "",
    createdAt: Number(m.createdAt) || Date.now(),
    likesCount: likes.length,
    likedByMe: likes.indexOf(openid) >= 0,
    mine: m.ownerOpenId === openid,
    comments: comments.slice(-MAX_COMMENTS).map(c => publicComment(c, openid))
  };
}

async function contentPass(text, openid) {
  const content = cleanText(text, 300);
  if (!content) return false;

  // Fail closed: public UGC is not published when WeChat content security
  // cannot confirm that the text is safe.
  const result = await cloud.openapi.security.msgSecCheck({
    version: 2,
    scene: 2,
    openid,
    content
  });

  if (result && result.result && result.result.suggest) {
    return result.result.suggest === "pass";
  }
  if (result && typeof result.errCode === "number" && result.errCode !== 0) {
    throw new Error("content_security_unavailable");
  }
  return true;
}

async function listMessages(openid, limit) {
  const n = Math.max(1, Math.min(MAX_LIST, Number(limit) || 60));
  const res = await db.collection(COLLECTION)
    .orderBy("createdAt", "desc")
    .limit(n)
    .get();

  return (res.data || [])
    .filter(m => m && m.status === "approved" && m.hidden !== true)
    .map(m => publicMessage(m, openid));
}

async function createPending(openid, event) {
  const author = cleanText(event.author || "匿名医学生", 18) || "匿名医学生";
  const school = cleanText(event.school || "未知起点", 40) || "未知起点";
  const ending = cleanText(event.ending || "医学人生", 40) || "医学人生";
  const message = cleanText(event.message, 200);

  if (!message) return { ok: false, reason: "empty", message: "请先写下留言。" };

  const recent = await db.collection(COLLECTION)
    .where({ ownerOpenId: openid })
    .limit(10)
    .get();

  const last = (recent.data || []).sort((a,b) => Number(b.createdAt||0)-Number(a.createdAt||0))[0];
  if (last && Date.now() - Number(last.createdAt || 0) < POST_COOLDOWN_MS) {
    return { ok: false, reason: "too_fast", message: "留言太快啦，请稍等十几秒再发布。" };
  }

  const createdAt = Date.now();
  const add = await db.collection(COLLECTION).add({
    data: {
      ownerOpenId: openid,
      author,
      school,
      ending,
      message,
      createdAt,
      likes: [],
      comments: [],
      reports: [],
      status: "pending",
      hidden: true
    }
  });

  return { ok: true, id: add._id, createdAt, pending: true };
}

async function moderateMessage(openid, messageId) {
  const m = await getMessage(messageId);
  if (!m) return { ok: false, reason: "not_found", message: "留言不存在。" };
  if (m.ownerOpenId !== openid) {
    return { ok: false, reason: "forbidden", message: "不能审核其他玩家的留言。" };
  }
  if (m.status === "approved" && m.hidden !== true) {
    return { ok: true, approved: true, id: messageId };
  }
  if (m.status === "rejected") {
    return { ok: true, approved: false, id: messageId, message: "这条留言未通过内容安全检查，请修改后再试。" };
  }

  let safe = false;
  try {
    safe = await contentPass((m.author || "匿名医学生") + "\n" + (m.message || ""), openid);
  } catch (e) {
    console.error("msgSecCheck failed", e);
    return { ok: false, reason: "security_unavailable", message: "内容安全检查暂时不可用，请稍后再试。" };
  }

  if (!safe) {
    await db.collection(COLLECTION).doc(messageId).update({
      data: { status: "rejected", hidden: true, moderatedAt: Date.now() }
    });
    return { ok: true, approved: false, id: messageId, message: "这条留言未通过内容安全检查，请修改后再试。" };
  }

  await db.collection(COLLECTION).doc(messageId).update({
    data: { status: "approved", hidden: false, moderatedAt: Date.now() }
  });
  return { ok: true, approved: true, id: messageId };
}

async function getMessage(messageId) {
  if (!messageId) return null;
  try {
    const res = await db.collection(COLLECTION).doc(messageId).get();
    return res && res.data || null;
  } catch (e) {
    return null;
  }
}

async function toggleLike(openid, messageId) {
  const m = await getMessage(messageId);
  if (!m || m.hidden || m.status !== "approved") {
    return { ok: false, reason: "not_found", message: "这条留言已经不存在。" };
  }

  const likes = Array.isArray(m.likes) ? m.likes.slice() : [];
  const idx = likes.indexOf(openid);
  let liked;
  if (idx >= 0) {
    likes.splice(idx, 1);
    liked = false;
  } else {
    likes.push(openid);
    liked = true;
  }

  await db.collection(COLLECTION).doc(messageId).update({ data: { likes } });
  return { ok: true, liked, count: likes.length };
}

async function addComment(openid, event) {
  const messageId = cleanText(event.messageId, 80);
  const author = cleanText(event.author || "匿名医学生", 18) || "匿名医学生";
  const text = cleanText(event.text, 120);
  if (!text) return { ok: false, reason: "empty", message: "回复不能为空。" };

  const m = await getMessage(messageId);
  if (!m || m.hidden || m.status !== "approved") {
    return { ok: false, reason: "not_found", message: "这条留言已经不存在。" };
  }

  let safe = false;
  try {
    safe = await contentPass(author + "\n" + text, openid);
  } catch (e) {
    console.error("comment msgSecCheck failed", e);
    return { ok: false, reason: "security_unavailable", message: "内容安全检查暂时不可用，请稍后再试。" };
  }
  if (!safe) {
    return { ok: false, reason: "content_rejected", message: "这条回复未通过内容安全检查，请修改后再试。" };
  }

  const comments = Array.isArray(m.comments) ? m.comments.slice(-MAX_COMMENTS + 1) : [];
  const comment = {
    id: "c_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8),
    ownerOpenId: openid,
    author,
    text,
    createdAt: Date.now()
  };
  comments.push(comment);
  await db.collection(COLLECTION).doc(messageId).update({ data: { comments } });
  return { ok: true, comment: publicComment(comment, openid) };
}

async function deleteMessage(openid, messageId) {
  const m = await getMessage(messageId);
  if (!m) return { ok: false, reason: "not_found", message: "留言不存在。" };
  if (m.ownerOpenId !== openid) return { ok: false, reason: "forbidden", message: "只能删除自己的留言。" };
  await db.collection(COLLECTION).doc(messageId).remove();
  return { ok: true };
}

async function deleteComment(openid, messageId, commentId) {
  const m = await getMessage(messageId);
  if (!m) return { ok: false, reason: "not_found", message: "留言不存在。" };

  const comments = Array.isArray(m.comments) ? m.comments.slice() : [];
  const target = comments.find(c => c.id === commentId);
  if (!target) return { ok: false, reason: "not_found", message: "回复不存在。" };
  if (target.ownerOpenId !== openid && m.ownerOpenId !== openid) {
    return { ok: false, reason: "forbidden", message: "不能删除其他玩家的回复。" };
  }

  await db.collection(COLLECTION).doc(messageId).update({
    data: { comments: comments.filter(c => c.id !== commentId) }
  });
  return { ok: true };
}

async function reportMessage(openid, messageId) {
  const m = await getMessage(messageId);
  if (!m) return { ok: false, reason: "not_found", message: "留言不存在。" };
  if (m.ownerOpenId === openid) {
    return { ok: false, reason: "own_message", message: "自己的留言可以直接删除。" };
  }

  const reports = Array.isArray(m.reports) ? m.reports.slice() : [];
  if (reports.indexOf(openid) < 0) reports.push(openid);

  const hidden = reports.length >= REPORT_HIDE_THRESHOLD;
  await db.collection(COLLECTION).doc(messageId).update({
    data: { reports, hidden }
  });

  return {
    ok: true,
    hidden,
    message: hidden ? "已收到举报，这条留言已暂时隐藏。" : "已收到举报，谢谢你的反馈。"
  };
}

async function moderateStoredMessage(m) {
  if (!m || !m._id) return { ok: false, reason: "not_found" };
  if (m.status === "approved" && m.hidden !== true) {
    return { ok: true, approved: true, id: m._id };
  }
  if (m.status === "rejected") {
    return { ok: true, approved: false, id: m._id };
  }

  let safe = false;
  try {
    safe = await contentPass((m.author || "匿名医学生") + "\n" + (m.message || ""), m.ownerOpenId || "");
  } catch (e) {
    console.error("background msgSecCheck failed", m._id, e);
    return { ok: false, reason: "security_unavailable", id: m._id };
  }

  if (!safe) {
    await db.collection(COLLECTION).doc(m._id).update({
      data: { status: "rejected", hidden: true, moderatedAt: Date.now() }
    });
    return { ok: true, approved: false, id: m._id };
  }

  await db.collection(COLLECTION).doc(m._id).update({
    data: { status: "approved", hidden: false, moderatedAt: Date.now() }
  });
  return { ok: true, approved: true, id: m._id };
}

async function moderatePendingBatch() {
  const res = await db.collection(COLLECTION)
    .where({ status: "pending" })
    .limit(1)
    .get();

  const item = res.data && res.data[0];
  if (!item) return { ok: true, processed: 0 };

  const result = await moderateStoredMessage(item);
  return { ok: true, processed: 1, result };
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const action = cleanText(event && event.action, 40);

  try {
    /* 定时触发器不会传业务 action；此时只处理一条待审核留言，
       避免单次函数执行过久。 */
    if (!action || action === "processPending") {
      return await moderatePendingBatch();
    }
    if (action === "list") {
      return { ok: true, messages: await listMessages(openid, event.limit) };
    }
    if (action === "createPending") return await createPending(openid, event || {});
    if (action === "moderateMessage") return await moderateMessage(openid, cleanText(event.messageId, 80));
    if (action === "toggleLike") return await toggleLike(openid, cleanText(event.messageId, 80));
    if (action === "addComment") return await addComment(openid, event || {});
    if (action === "deleteMessage") return await deleteMessage(openid, cleanText(event.messageId, 80));
    if (action === "deleteComment") {
      return await deleteComment(openid, cleanText(event.messageId, 80), cleanText(event.commentId, 80));
    }
    if (action === "report") return await reportMessage(openid, cleanText(event.messageId, 80));
    return { ok: false, reason: "unknown_action", message: "未知留言操作。" };
  } catch (e) {
    console.error("messageBoard cloud function failed", action, e);
    return { ok: false, reason: "server_error", message: "留言服务暂时不可用，请稍后再试。" };
  }
};
