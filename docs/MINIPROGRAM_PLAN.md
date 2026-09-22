# 微信小程序迁移规划

## 目标

网页版从现在开始按“数据层 / 游戏引擎 / 界面层”分离，后续迁移微信小程序时尽量不重写剧情与判定逻辑。

## 当前结构

- `data/schools.js`：高考分段、医学院校、学校压力与初始修正
- `data/events.js`：主线事件与随机支线事件
- `app.js`：状态机、随机事件、属性结算、存档、页面流程
- `index.html + styles.css`：Web UI

## 小程序对应关系

### Web
- DOM 页面切换
- localStorage
- click 事件
- HTML/CSS

### 微信小程序
- pages/index：角色与难度
- pages/gaokao：高考抽分
- pages/school：院校选择
- pages/letter：录取通知书
- pages/game：主线与支线
- pages/ending：结局
- wx.setStorageSync / wx.getStorageSync
- WXML / WXSS

剧情数据与大部分纯 JS 判定可以直接复用。

## 必须继续保持的架构原则

1. 剧情数据不写死在页面代码里。
2. 学校数据单独维护。
3. 每个事件只描述条件、选项、效果和跳转。
4. 存档层独立，未来只替换 Storage Adapter。
5. 不依赖浏览器专属第三方框架。
6. 每个功能优先考虑手机竖屏操作。
7. 分数与真实高考录取数据严格区分；正式版如加入真实志愿功能，必须按省份、年份、选科、位次单独建数据源。

## 0.3 计划

- 省份 / 高考模式选择
- 更真实的“分数 + 位次”开局
- 学校搜索和收藏
- 专业方向系统
- 本科五年按学期推进
- GPA / 排名 / 保研资格
- 四六级、奖学金、竞赛、科研成果
- 恋爱 / 家庭 / 社交独立关系值
- 成就系统
- 随机事件权重
- 周目统计

## 0.4 计划

- 研究生导师人格与课题组系统
- 专硕 / 学硕 / 直博
- 规培医院层级
- 科室系统
- 医师资格与规培结业
- 收入、房租、城市生活成本
- 医患事件
- 论文投稿与基金系统

## 小程序上线前

需要单独处理：

- 微信小程序账号与主体
- 隐私政策
- 用户数据说明
- 内容审核
- 广告位与激励视频（如启用）
- 云开发 / 用户云存档（可选）
- 分享卡片与好友排行（可选）

当前版本不采集账号信息，网页存档只保存在用户本地浏览器。


## v0.5 留言墙迁移设计

网页版当前留言墙只使用本地存储，不向任何服务器上传内容。

微信小程序正式版建议增加 `MessageBoardAdapter`：
- Web: localStorage
- 小程序开发版: wx.setStorageSync / wx.getStorageSync
- 正式共享版: 微信云开发数据库或自建后端 API

建议云端字段：
- message_id
- anonymous_display_name
- message_text
- school_label
- education_path
- ending_label
- created_at
- moderation_status
- like_count

上线时必须加入：
- 200 字长度限制
- 敏感内容审核
- 举报 / 隐藏
- 频率限制
- 默认匿名或自定义昵称，避免公开真实姓名
- 隐私政策中明确留言属于公开用户生成内容

## 教育层级

当前游戏已同时支持：
- 医学本科
- 医学专科三年制游戏路线
- 专升本
- 硕士
- 博士
- 博后 / 临床职业路线

政策、招生专业和职业资格在正式版中应独立做成可更新的数据源，不写死在剧情引擎中。


## v0.7 社区留言墙正式版

当前 Web 版使用 `board_adapter.js`，UI 与数据层已经分离。正式微信小程序只需替换 Adapter，不应重写留言 UI 逻辑。

### 推荐数据表

messages:
- id
- owner_id
- display_name
- message_text
- school_label
- ending_label
- created_at
- like_count
- comment_count
- moderation_status

message_likes:
- message_id
- user_id
- created_at
- 唯一索引：(message_id, user_id)

message_comments:
- id
- message_id
- owner_id
- display_name
- comment_text
- created_at
- moderation_status

### 权限规则

- 创建留言：已获得匿名/登录用户标识即可
- 删除留言：仅 `message.owner_id == current_user.id`
- 点赞：任意用户；同一用户同一留言只能存在一条 like
- 创建评论：任意用户
- 删除评论：
  - `comment.owner_id == current_user.id`
  - 或 `parent_message.owner_id == current_user.id`
- 任何人不能直接修改别人留言正文
- 后台管理员保留审核、隐藏、封禁权限

### 实时更新

小程序正式版建议监听 messages / likes / comments 变化：
1. 最新 10 条查询按 created_at desc
2. 收到新留言事件后插入滚动队列首部
3. 保留最多 10 条并重新开始滚动
4. 全部留言分页加载，避免用户量大后一次加载所有数据
5. 点赞数与评论数使用服务端计数或事务，避免并发覆盖

### 规模化要求

- 最新 10 条：实时订阅
- 全部留言：分页 20 条/页
- 评论：按需展开与分页
- 文本内容审核
- 举报
- 频率限制
- 删除采用软删除更利于审计
- 热门排序需对 like_count 建索引
