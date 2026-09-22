window.GAME_DATA = {
  difficulties: {
    easy:{name:"温和模式",desc:"资源更宽裕，适合体验剧情。",start:{knowledge:58,energy:82,mental:82,money:55,research:8,reputation:5},negativeScale:.82},
    normal:{name:"真实模式",desc:"推荐。努力、选择与运气缺一不可。",start:{knowledge:52,energy:72,mental:68,money:42,research:5,reputation:3},negativeScale:1},
    hard:{name:"地狱模式",desc:"更像“为什么我当初要学医”。",start:{knowledge:46,energy:62,mental:57,money:30,research:2,reputation:1},negativeScale:1.22}
  },

  order:["orientation","oath","anatomy","cet4","finals","lab","pathology","clinic","skills","internship","postgrad","examPrep","mentor","paper","residentExam","nightShift","conflict","license","specialty","career","grant","familyChoice","promotion","director","final"],

  events:{
    orientation:{
      stage:"临床医学 · 大一",year:"18岁",title:"九月，你拖着行李走进医学院",type:"main",
      text:"录取通知书真的把你带到了这里。新生群里已经有人在问保研政策，也有人只关心食堂哪一层最好吃。你的医学人生正式开始。",
      sideChance:.72,sidePool:["side_roommate","side_club"],
      choices:[
        {text:"先研究培养方案和保研规则",sub:"目标感很强，但焦虑也来得更早。",effects:{knowledge:4,mental:-2,research:1},flags:["ambitious","planner"],next:"oath"},
        {text:"先认识室友和同学",sub:"关系也是大学里重要的资源。",effects:{mental:6,reputation:3},flags:["social"],next:"oath"},
        {text:"先去校园里转一圈",sub:"医学很长，先记住自己十八岁的样子。",effects:{energy:4,mental:5},flags:["balanced"],next:"oath"}
      ]
    },

    oath:{
      stage:"临床医学 · 大一",year:"18岁",title:"第一次穿上白大褂",type:"main",
      text:"宣誓那天，你站在人群里。理想、责任、生命和职业尊严这些词，第一次变得具体。",
      choices:[
        {text:"把誓言记在心里",sub:"患者永远不是一个病例号。",effects:{mental:4,reputation:5},flags:["humanism"],next:"anatomy"},
        {text:"拍照发朋友圈",sub:"白大褂确实挺帅。",effects:{mental:5,reputation:1},flags:["social"],next:"anatomy"},
        {text:"既认真宣誓，也悄悄想：以后会不会后悔",sub:"现实感并不等于没有理想。",effects:{knowledge:1,mental:2},flags:["pragmatic"],next:"anatomy"}
      ]
    },

    anatomy:{
      stage:"基础医学",year:"19岁",title:"系统解剖学：第一次大考",type:"main",
      text:"标本、神经、血管、骨点像一张没有尽头的地图。室友已经背到凌晨两点。",
      sideChance:.52,sidePool:["side_love","side_parttime"],
      choices:[
        {text:"熬夜硬背三天",sub:"成绩上去，体力下去。",effects:{knowledge:10,energy:-13,mental:-5},flags:["crammer"],next:"cet4"},
        {text:"按计划复习，睡够七小时",sub:"涨得慢，但更稳。",effects:{knowledge:7,energy:-3,mental:3},flags:["steady"],next:"cet4"},
        {text:"临时抱佛脚",sub:"赌老师不出偏题。",effects:{knowledge:2,mental:-2},chance:{p:.38,success:{knowledge:8,mental:4},fail:{knowledge:-7,mental:-7}},next:"cet4"}
      ]
    },

    cet4:{
      stage:"大学英语",year:"19岁",title:"四六级报名开始了",type:"main",
      text:"有人说医学以后读文献离不开英语，有人说先过线再说。你看着单词书，又看了看解剖图谱。",
      choices:[
        {text:"每天固定背单词",sub:"慢，但稳定。",effects:{knowledge:5,energy:-3},flags:["englishSteady"],next:"finals"},
        {text:"考前一个月突击",sub:"熟悉的医学生节奏。",effects:{knowledge:3,mental:-2},chance:{p:.62,bonusBy:["knowledge"],success:{reputation:2,mental:2},fail:{mental:-4}},next:"finals"},
        {text:"先不考，主课更重要",sub:"短期减压，未来还得补。",effects:{mental:4,knowledge:1},flags:["delayCET"],next:"finals"}
      ]
    },

    finals:{
      stage:"基础医学",year:"20岁",title:"期末周：六门一起考",type:"main",
      text:"你第一次理解了什么叫“背不完，根本背不完”。朋友圈里的其他专业已经开始放假。",
      sideChance:.65,sidePool:["side_health","side_student_job"],
      choices:[
        {text:"关闭社交软件，全天自习室",sub:"短期高强度冲刺。",effects:{knowledge:9,energy:-9,mental:-6},next:"lab"},
        {text:"和同学组队互相提问",sub:"效率与情绪都更稳定。",effects:{knowledge:7,mental:4,reputation:2},flags:["teamPlayer"],next:"lab"},
        {text:"战略放弃两章",sub:"学会接受不可能全会。",effects:{knowledge:4,mental:5},flags:["prioritize"],next:"lab"}
      ]
    },

    lab:{
      stage:"科研启蒙",year:"20岁",title:"导师问：要不要进实验室？",type:"main",
      text:"学长告诉你：想保研，最好早点进组。你第一次认真听见影响因子、SCI和通讯作者。",
      sideChance:.7,sidePool:["side_competition","side_lab_failure"],
      choices:[
        {text:"进组做科研",sub:"科研线提前开启。",effects:{research:10,energy:-7,mental:-3},flags:["earlyResearch"],next:"pathology"},
        {text:"先把临床基础学扎实",sub:"科研晚点再说。",effects:{knowledge:8,research:-1},flags:["clinicalFirst"],next:"pathology"},
        {text:"两边都要",sub:"经典医学生答案。",effects:{knowledge:5,research:6,energy:-10,mental:-5},flags:["doubleTrack"],next:"pathology"}
      ]
    },

    pathology:{
      stage:"桥梁课程",year:"20岁",title:"病理学：开始把知识连起来",type:"main",
      text:"你终于不只是背结构，而是开始理解为什么人会生病。老师说：从这里开始，你们要学会把基础和临床连起来。",
      choices:[
        {text:"认真做病例讨论",sub:"知识开始从碎片变成网络。",effects:{knowledge:9,reputation:2},flags:["caseThinking"],next:"clinic"},
        {text:"主攻考试重点",sub:"短期效率更高。",effects:{knowledge:6,mental:2},flags:["examOriented"],next:"clinic"},
        {text:"把大量时间继续投给科研",sub:"病理先保证不挂。",effects:{research:7,knowledge:3,energy:-5},requires:{flags:["earlyResearch"]},next:"clinic"}
      ]
    },

    clinic:{
      stage:"临床见习",year:"21岁",title:"第一次真正面对患者",type:"main",
      text:"老师让你去问病史。患者看着你胸牌上的“见习”二字，明显犹豫了一下。",
      sideChance:.62,sidePool:["side_volunteer","side_love"],
      choices:[
        {text:"认真沟通，慢慢取得信任",sub:"慢，但患者愿意告诉你更多。",effects:{knowledge:5,reputation:8,mental:3},requires:{stats:{mental:40}},flags:["communication"],next:"skills"},
        {text:"快速按模板问完",sub:"效率优先。",effects:{knowledge:4,reputation:1},next:"skills"},
        {text:"先观察老师怎么问，再自己尝试",sub:"稳健学习。",effects:{knowledge:6,reputation:3,mental:1},flags:["observer"],next:"skills"}
      ]
    },

    skills:{
      stage:"临床技能",year:"21岁",title:"技能中心 OSCE 模拟考",type:"main",
      text:"心肺复苏、查体、穿刺、问诊，一个站接一个站。手抖的时候，你突然理解为什么临床需要反复训练。",
      sideChance:.45,sidePool:["side_competition"],
      choices:[
        {text:"主动加练到晚上",sub:"熟练度来自重复。",effects:{knowledge:8,energy:-8,reputation:3},flags:["skillsPractice"],next:"internship"},
        {text:"跟同学互相纠错",sub:"团队学习效率更高。",effects:{knowledge:6,reputation:4,mental:2},flags:["teamPlayer"],next:"internship"},
        {text:"先过线，实习再练",sub:"把资源留给其他课程。",effects:{knowledge:3,mental:4},next:"internship"}
      ]
    },

    internship:{
      stage:"临床实习",year:"22岁",title:"凌晨的第一次抢救",type:"main",
      text:"监护仪报警。你站在老师旁边，忽然发现课本上的每一个数字，现在都对应一个真实的人。",
      sideChance:.62,sidePool:["side_patient_thanks","side_health"],
      choices:[
        {text:"主动参与，在老师指导下完成任务",sub:"紧张，但这是成长最快的时候。",effects:{knowledge:9,energy:-7,mental:-3,reputation:5},flags:["clinicalCourage"],next:"postgrad"},
        {text:"先观察，确保不添乱",sub:"更稳妥，但参与感较少。",effects:{knowledge:5,mental:1},next:"postgrad"},
        {text:"抢救结束后复盘整个病例",sub:"把一次经历变成真正的能力。",effects:{knowledge:10,energy:-5,reputation:3},flags:["reflection"],next:"postgrad"}
      ]
    },

    postgrad:{
      stage:"毕业分岔口",year:"23岁",title:"五年后，你要去哪里？",type:"main",
      text:"本科毕业不是终点，而是第一次真正分流。考研、保研、就业、规培，每条路都意味着另一套难题。",
      choices:[
        {text:"考研 / 临床专硕",sub:"继续临床，同时进入规培体系。",effects:{knowledge:7,mental:-6,money:-6},flags:["master","clinicalPostgrad"],next:"examPrep"},
        {text:"学硕 / 科研路线",sub:"论文和项目会成为新的硬通货。",effects:{research:12,mental:-5,money:-5},flags:["master","academic"],next:"examPrep"},
        {text:"直接就业并参加规培",sub:"提前进入医院现实。",effects:{money:5,energy:-5,reputation:3},flags:["directResident"],next:"residentExam"}
      ]
    },

    examPrep:{
      stage:"升学考试",year:"23岁",title:"考研倒计时 100 天",type:"main",
      text:"白天实习，晚上复习。你开始精确计算每天还能睡几个小时。",
      sideChance:.55,sidePool:["side_health","side_love_distance"],
      choices:[
        {text:"全力冲目标院校",sub:"高风险高投入。",effects:{knowledge:10,energy:-11,mental:-8},chance:{p:.56,bonusBy:["knowledge","mental"],success:{reputation:4,mental:7},fail:{mental:-9}},flags:["examAllIn"],next:"mentor"},
        {text:"选择更稳妥的目标",sub:"减少不确定性。",effects:{knowledge:7,mental:-3},chance:{p:.75,bonusBy:["knowledge"],success:{mental:5},fail:{mental:-6}},flags:["examStable"],next:"mentor"},
        {text:"边准备边留就业后路",sub:"不把人生压在一次考试上。",effects:{knowledge:5,money:2,mental:3},flags:["backupPlan"],next:"mentor"}
      ]
    },

    mentor:{
      stage:"研究生",year:"24岁",title:"第一次真正选择导师",type:"main",
      text:"有人论文多但管理严格，有人临床强但科研资源一般，还有老师强调自由成长。你发现“选导师”本身就是一门课。",
      sideChance:.7,sidePool:["side_mentor_dinner","side_lab_failure"],
      choices:[
        {text:"选高产科研型导师",sub:"资源多，压力也大。",effects:{research:10,energy:-7,mental:-5},flags:["productiveMentor"],next:"paper"},
        {text:"选临床能力强的导师",sub:"临床成长更快。",effects:{knowledge:9,reputation:5,research:2},flags:["clinicalMentor"],next:"paper"},
        {text:"选相对放养的导师",sub:"自由多，但一切更靠自己。",effects:{mental:7,research:3,knowledge:3},flags:["freeMentor"],next:"paper"}
      ]
    },

    paper:{
      stage:"研究生",year:"25岁",title:"你的第一篇论文",type:"main",
      text:"数据做完了，结果“不显著”。师兄问你：要不要换个分析方法再看看？",
      sideChance:.72,sidePool:["side_authorship","side_rejection"],
      choices:[
        {text:"如实报告阴性结果",sub:"慢一点，但心里踏实。",effects:{research:5,reputation:7,mental:3},flags:["integrity"],next:"residentExam"},
        {text:"继续探索合理亚组",sub:"可以探索，但守住统计边界。",effects:{research:8,energy:-6},flags:["exploratory"],next:"residentExam"},
        {text:"为了发文章，想办法“做显著”",sub:"短期可能有收益，长期可能埋雷。",effects:{research:11,reputation:-8,mental:-8},flags:["questionableResearch"],next:"residentExam"}
      ]
    },

    residentExam:{
      stage:"住院医师规范化培训",year:"26岁",title:"规培第一年",type:"main",
      text:"工资不高、轮转很多、考试不少。你开始真正体会“学生”和“医生”之间那段漫长的灰色地带。",
      sideChance:.68,sidePool:["side_night_food","side_patient_thanks"],
      choices:[
        {text:"每个科室都认真轮转",sub:"累，但基本功会留下来。",effects:{knowledge:9,reputation:5,energy:-10},flags:["solidResident"],next:"nightShift"},
        {text:"重点经营未来想去的科室",sub:"更早建立方向和人脉。",effects:{knowledge:5,reputation:7,research:2},flags:["specialtyFocus"],next:"nightShift"},
        {text:"先保证别被榨干",sub:"学习重要，但活着也重要。",effects:{mental:9,energy:7,knowledge:2},flags:["selfCare"],next:"nightShift"}
      ]
    },

    nightShift:{
      stage:"规培",year:"27岁",title:"凌晨 3:17，又来一个急诊",type:"main",
      text:"你已经连续工作十多个小时。手机里还有导师催的数据，家人问你国庆回不回家。",
      sideChance:.62,sidePool:["side_health","side_night_food"],
      choices:[
        {text:"先处理患者，再补科研",sub:"今晚注定睡不了了。",effects:{knowledge:7,reputation:7,energy:-15,mental:-8,research:2},flags:["dutyFirst"],next:"conflict"},
        {text:"找同事合理分担",sub:"团队合作也是能力。",effects:{reputation:4,energy:-7,mental:-3},flags:["teamPlayer"],next:"conflict"},
        {text:"所有事情都自己扛",sub:"你觉得必须证明自己能扛。",effects:{knowledge:5,reputation:5,energy:-20,mental:-12},flags:["burnoutRisk"],next:"conflict"}
      ]
    },

    conflict:{
      stage:"规培",year:"28岁",title:"医患冲突",type:"main",
      text:"一次沟通不充分后，家属情绪激动，在走廊里质问你：你们到底会不会看病？",
      choices:[
        {text:"耐心解释并请上级共同沟通",sub:"慢一点，但风险更低。",effects:{reputation:8,mental:-5,knowledge:2},flags:["communication"],next:"license"},
        {text:"据理力争",sub:"你说的也许没错，但场面更僵。",effects:{reputation:-5,mental:-8},flags:["confrontational"],next:"license"},
        {text:"把问题完全交给上级",sub:"安全，但你没有真正处理这次冲突。",effects:{reputation:-1,mental:-2},next:"license"}
      ]
    },

    license:{
      stage:"职业资格",year:"28岁",title:"考试与结业一起压过来",type:"main",
      text:"执业资格、规培结业、科室考核同时出现。你突然又回到了学生时代，只是这次白天还要正常上班。",
      choices:[
        {text:"请假集中复习",sub:"短期收入和科室存在感下降。",effects:{knowledge:9,money:-4,reputation:-2,mental:-3},chance:{p:.72,bonusBy:["knowledge"],success:{reputation:5,mental:4},fail:{mental:-9}},next:"specialty"},
        {text:"边上班边准备",sub:"典型医生做法：全都要。",effects:{knowledge:6,energy:-11,mental:-5},chance:{p:.62,bonusBy:["knowledge","energy"],success:{reputation:4},fail:{mental:-8}},next:"specialty"}
      ]
    },

    specialty:{
      stage:"职业方向",year:"29岁",title:"你真正想留在哪个科？",type:"main",
      text:"不同科室意味着完全不同的作息、收入、技术路径、科研方向和生活方式。没有哪个选项只有优点。",
      choices:[
        {text:"偏内科方向",sub:"知识密度高，长期积累型。",effects:{knowledge:8,research:3,energy:-4},flags:["internalMedicine"],next:"career"},
        {text:"偏外科方向",sub:"技术成长快，体力消耗也大。",effects:{knowledge:6,reputation:5,energy:-8},flags:["surgery"],next:"career"},
        {text:"影像 / 核医学等平台科室",sub:"技术、影像与交叉科研并重。",effects:{knowledge:6,research:6,mental:1},flags:["imaging"],next:"career"},
        {text:"先不锁死方向",sub:"继续观察自己的适配度。",effects:{mental:4,knowledge:3},flags:["undecidedSpecialty"],next:"career"}
      ]
    },

    career:{
      stage:"主治医师阶段",year:"32岁",title:"临床、科研和生活只能三选二？",type:"main",
      text:"门诊、手术、值班、课题、论文、家庭同时涌来。你终于明白，时间才是医生最贵的资源。",
      sideChance:.65,sidePool:["side_grant_reject","side_parent_health"],
      choices:[
        {text:"冲科研与职称",sub:"博士、基金、论文，全都要。",effects:{research:15,reputation:7,energy:-14,mental:-9,money:5},flags:["researchTrack"],next:"grant"},
        {text:"做强临床能力",sub:"成为科室里真正能解决问题的人。",effects:{knowledge:13,reputation:10,energy:-11,mental:-4,money:6},flags:["clinicalTrack"],next:"grant"},
        {text:"保住生活边界",sub:"不一定最快，但希望走得更久。",effects:{mental:12,energy:10,reputation:2,research:-3},flags:["lifeTrack"],next:"grant"}
      ]
    },

    grant:{
      stage:"科研考核",year:"34岁",title:"青年基金截止前 72 小时",type:"main",
      text:"标书还差最后两张图，科里又临时加了值班。你开始理解为什么很多医生把“写本子”当成季节性疾病。",
      sideChance:.55,sidePool:["side_grant_reject"],
      choices:[
        {text:"熬夜把标书打磨到极致",sub:"科研提升明显，身体会记账。",effects:{research:12,energy:-12,mental:-6},chance:{p:.46,bonusBy:["research","knowledge"],success:{reputation:9,research:5,mental:6},fail:{mental:-7}},flags:["grantTry"],next:"familyChoice"},
        {text:"找团队合作完善",sub:"共同署名，也共同承担。",effects:{research:8,reputation:5,energy:-6},chance:{p:.52,bonusBy:["research","reputation"],success:{reputation:6,mental:4},fail:{mental:-4}},flags:["collabGrant"],next:"familyChoice"},
        {text:"这一年先不投",sub:"保住生活，但晋升节奏会慢。",effects:{mental:8,energy:6,research:-3},flags:["skipGrant"],next:"familyChoice"}
      ]
    },

    familyChoice:{
      stage:"人生并行线",year:"35岁",title:"工作之外的人生也在往前走",type:"main",
      text:"家人、伴侣、孩子、父母健康，和你的职业发展并不会排队出现。它们总是同时发生。",
      sideChance:.5,sidePool:["side_parent_health","side_love_distance"],
      choices:[
        {text:"给家庭留下固定时间",sub:"晋升慢一点，但生活不是附属品。",effects:{mental:12,energy:5,reputation:-2},flags:["familyTime"],next:"promotion"},
        {text:"关键几年先冲事业",sub:"把压力推迟到未来。",effects:{research:7,reputation:6,money:5,mental:-9},flags:["careerFirst"],next:"promotion"},
        {text:"努力维持两边",sub:"现实里最常见，也最累。",effects:{reputation:3,money:2,energy:-8,mental:-4},flags:["juggling"],next:"promotion"}
      ]
    },

    promotion:{
      stage:"高级职称",year:"40岁",title:"副高评审前夜",type:"main",
      text:"材料摆在桌上：临床量、教学、论文、基金、同行评价。十几年的选择都在这一刻汇总。",
      choices:[
        {text:"提交评审",sub:"结果由积累与一点运气共同决定。",effects:{},chance:{p:.52,bonusBy:["research","reputation","knowledge"],success:{reputation:12,money:8,mental:4},fail:{mental:-10,reputation:-2}},next:"director"}
      ]
    },

    director:{
      stage:"职业巅峰分岔",year:"48岁",title:"你想成为怎样的医生？",type:"main",
      text:"你已经不再是当年那个刚穿白大褂的学生。现在，年轻医生开始叫你“老师”。",
      choices:[
        {text:"冲击科主任与学科带头人",sub:"管理、资源和责任同时增加。",effects:{reputation:12,research:6,mental:-6},flags:["director"],next:"final"},
        {text:"继续做一线临床专家",sub:"把最难的病例留给自己。",effects:{knowledge:12,reputation:9,mental:2},flags:["expert"],next:"final"},
        {text:"全力做科研与学术",sub:"冲基金、大奖与更高学术平台。",effects:{research:18,reputation:8,energy:-10},flags:["academicianTrack"],next:"final"}
      ]
    },

    final:{
      stage:"终章",year:"60岁",title:"白大褂的最后一页",type:"main",
      text:"几十年过去。你回头看见的不是一条直线，而是一串由选择组成的人生记录。",
      choices:[{text:"查看人生结局",sub:"看看这条时间线里，你最终成为了谁。",effects:{},next:"__END__"}]
    }
  },

  sideEvents:{
    side_roommate:{
      stage:"支线 · 宿舍",year:"18岁",title:"室友凌晨两点还在打游戏",type:"side",
      text:"第二天早八是高数和细胞生物学。你盯着天花板，第一次意识到大学人际关系也是一门必修课。",
      choices:[
        {text:"直接沟通作息",sub:"说清楚边界。",effects:{mental:4,reputation:2},flags:["boundary"],next:"__RETURN__"},
        {text:"戴耳塞忍了",sub:"避免冲突，但不一定解决问题。",effects:{mental:-3,energy:-2},next:"__RETURN__"},
        {text:"一起打到两点",sub:"室友关系好了，早八完了。",effects:{reputation:3,mental:3,knowledge:-3,energy:-5},next:"__RETURN__"}
      ]
    },
    side_club:{
      stage:"支线 · 校园",year:"18岁",title:"社团招新：要不要加入？",type:"side",
      text:"学生会、志愿者协会、篮球队、辩论队都在招新。你只有二十四小时一天。",
      choices:[
        {text:"加入志愿服务",sub:"认识更多人，也更早接触医院。",effects:{reputation:5,mental:2,energy:-3},flags:["volunteer"],next:"__RETURN__"},
        {text:"加入体育社团",sub:"体力和情绪是长期资产。",effects:{energy:7,mental:5,knowledge:-1},flags:["sport"],next:"__RETURN__"},
        {text:"一个都不加",sub:"把时间留给学习。",effects:{knowledge:4,mental:1},next:"__RETURN__"}
      ]
    },
    side_love:{
      stage:"支线 · 青春",year:"19-21岁",title:"有人开始频繁给你占座",type:"side",
      text:"医学课表很满，但青春并不会因为你学医就暂停。",
      choices:[
        {text:"试着开始一段关系",sub:"甜和麻烦通常一起出现。",effects:{mental:8,energy:-3,money:-3},flags:["campusLove"],next:"__RETURN__"},
        {text:"婉拒，暂时专注学习",sub:"目标明确。",effects:{knowledge:3,mental:-1},flags:["singleFocus"],next:"__RETURN__"},
        {text:"先做朋友",sub:"给关系一点时间。",effects:{reputation:2,mental:3},flags:["slowLove"],next:"__RETURN__"}
      ]
    },
    side_parttime:{
      stage:"支线 · 生活",year:"19岁",title:"有人介绍你去做家教",type:"side",
      text:"每周六下午四小时，收入对学生来说很香，但你的周末也会被切走一块。",
      choices:[
        {text:"接下家教",sub:"经济宽松一点。",effects:{money:8,energy:-5,knowledge:1},flags:["partTime"],next:"__RETURN__"},
        {text:"拒绝，周末要复习",sub:"时间比钱更值钱。",effects:{knowledge:4,mental:2},next:"__RETURN__"}
      ]
    },
    side_student_job:{
      stage:"支线 · 校园组织",year:"20岁",title:"辅导员问你要不要竞选学生干部",type:"side",
      text:"这意味着组织活动、写材料、开会，也可能意味着更广的人际网络。",
      choices:[
        {text:"竞选",sub:"社会能力提升，时间减少。",effects:{reputation:6,energy:-6,knowledge:-1},flags:["studentLeader"],next:"__RETURN__"},
        {text:"不竞选",sub:"保持简单。",effects:{mental:3,knowledge:2},next:"__RETURN__"}
      ]
    },
    side_health:{
      stage:"随机 · 身体",year:"随机年份",title:"连续熬夜后，你发烧了",type:"random",
      text:"身体用一种非常直接的方式告诉你：它也有投票权。",
      choices:[
        {text:"请假休息一天",sub:"进度会落一点，但人要先恢复。",effects:{energy:10,mental:5,knowledge:-2},flags:["restWhenSick"],next:"__RETURN__"},
        {text:"吃药继续上课 / 值班",sub:"短期不掉队。",effects:{energy:-8,mental:-4,knowledge:2},flags:["pushThrough"],next:"__RETURN__"}
      ]
    },
    side_competition:{
      stage:"支线 · 竞赛",year:"20-21岁",title:"创新创业 / 临床技能比赛开始报名",type:"side",
      text:"获奖可以丰富履历，但准备过程可能吞掉几个周末。",
      choices:[
        {text:"组队参加",sub:"赌一次成长和结果。",effects:{research:5,reputation:3,energy:-6},chance:{p:.48,bonusBy:["knowledge","research"],success:{reputation:7,mental:5},fail:{mental:-2}},flags:["competition"],next:"__RETURN__"},
        {text:"不参加",sub:"把时间留给主线。",effects:{knowledge:2,mental:2},next:"__RETURN__"}
      ]
    },
    side_lab_failure:{
      stage:"支线 · 实验室",year:"20-25岁",title:"连续三次实验失败",type:"side",
      text:"对照组不对、细胞状态不好、仪器还在排队。实验室第一次让你怀疑自己是不是适合科研。",
      choices:[
        {text:"从头排查流程",sub:"科研能力往往来自失败。",effects:{research:7,energy:-5,mental:-3},flags:["researchResilience"],next:"__RETURN__"},
        {text:"先放两天再回来",sub:"恢复判断力。",effects:{mental:6,energy:4,research:2},next:"__RETURN__"},
        {text:"开始认真考虑纯临床路线",sub:"及时认识自己也很重要。",effects:{knowledge:3,research:-3,mental:3},flags:["researchDoubt"],next:"__RETURN__"}
      ]
    },
    side_volunteer:{
      stage:"支线 · 医院",year:"21岁",title:"周末志愿服务",type:"side",
      text:"你负责引导一位不太会使用自助机的老人。十分钟后，你突然发现医疗系统的难，不只在诊断。",
      choices:[
        {text:"耐心帮他走完整个流程",sub:"医学人文不是选修课。",effects:{reputation:6,mental:4,energy:-2},flags:["humanism"],next:"__RETURN__"},
        {text:"快速教会操作就离开",sub:"效率更高。",effects:{reputation:2,knowledge:1},next:"__RETURN__"}
      ]
    },
    side_patient_thanks:{
      stage:"支线 · 临床",year:"22-28岁",title:"患者家属塞给你一袋水果",type:"side",
      text:"他们只是想表达感谢。你突然有点不知道该怎么处理这份朴素的善意。",
      choices:[
        {text:"感谢后婉拒",sub:"把感谢留在话里。",effects:{reputation:5,mental:4},flags:["professionalBoundary"],next:"__RETURN__"},
        {text:"请护士站大家一起吃",sub:"把个人感谢变成团队感谢。",effects:{reputation:4,mental:5},flags:["teamPlayer"],next:"__RETURN__"}
      ]
    },
    side_love_distance:{
      stage:"支线 · 关系",year:"23-35岁",title:"异地与职业选择撞在一起",type:"side",
      text:"对方在另一座城市有自己的机会，而你刚好也到了不能轻易离开的阶段。",
      choices:[
        {text:"认真讨论长期方案",sub:"没有完美答案，但至少一起决定。",effects:{mental:5,reputation:1,energy:-2},flags:["relationshipPlan"],next:"__RETURN__"},
        {text:"先以事业为主",sub:"关系成本被推迟。",effects:{research:3,reputation:2,mental:-6},flags:["careerFirst"],next:"__RETURN__"},
        {text:"为关系调整城市计划",sub:"职业路径会变化。",effects:{mental:8,reputation:-1,money:-2},flags:["relationshipFirst"],next:"__RETURN__"}
      ]
    },
    side_mentor_dinner:{
      stage:"支线 · 导师",year:"24岁",title:"组会后导师把你留下来",type:"side",
      text:"导师问你：你以后到底想做临床、科研，还是两边都做？这个问题你其实也没答案。",
      choices:[
        {text:"明确说想走学术路线",sub:"资源可能向你倾斜，要求也会更高。",effects:{research:7,reputation:3,mental:-2},flags:["academic"],next:"__RETURN__"},
        {text:"明确说临床优先",sub:"方向更清楚。",effects:{knowledge:6,reputation:2},flags:["clinicalFirst"],next:"__RETURN__"},
        {text:"坦白还没想清楚",sub:"诚实，但需要继续探索。",effects:{mental:4,knowledge:2},flags:["exploring"],next:"__RETURN__"}
      ]
    },
    side_authorship:{
      stage:"支线 · 科研伦理",year:"25岁",title:"论文署名突然变了",type:"side",
      text:"你做了大部分实验和分析，但投稿前发现作者顺序和之前说的不一样。",
      choices:[
        {text:"直接和导师沟通贡献",sub:"可能尴尬，但边界要说清楚。",effects:{reputation:3,mental:-4,research:2},chance:{p:.58,bonusBy:["reputation"],success:{reputation:5,mental:5},fail:{mental:-6}},flags:["authorshipSpeakUp"],next:"__RETURN__"},
        {text:"忍下来，先把文章发出去",sub:"短期平稳，心里可能一直有刺。",effects:{research:5,mental:-7},flags:["authorshipSilent"],next:"__RETURN__"}
      ]
    },
    side_rejection:{
      stage:"支线 · 投稿",year:"25岁",title:"Reject without review",type:"side",
      text:"你刷新邮箱，看到编辑拒稿。整个过程只用了四天。",
      choices:[
        {text:"当天改格式转投",sub:"科研人的基本技能之一。",effects:{research:5,energy:-3,mental:-2},flags:["resubmitFast"],next:"__RETURN__"},
        {text:"先难受一晚",sub:"人不是机器。",effects:{mental:4,energy:2,research:1},next:"__RETURN__"},
        {text:"认真重构文章再投",sub:"慢，但也许会更好。",effects:{research:7,energy:-6,mental:-2},flags:["reviseDeep"],next:"__RETURN__"}
      ]
    },
    side_night_food:{
      stage:"随机 · 夜班",year:"26-30岁",title:"凌晨一点，值班室只剩泡面",type:"random",
      text:"你盯着自动售货机，认真思考医生到底算不算一种耐力运动员。",
      choices:[
        {text:"泡面加蛋，继续干",sub:"朴素但有效。",effects:{energy:3,money:-1,mental:2},next:"__RETURN__"},
        {text:"不吃了，抓紧睡二十分钟",sub:"睡眠也是硬通货。",effects:{energy:5,mental:1},next:"__RETURN__"}
      ]
    },
    side_grant_reject:{
      stage:"支线 · 科研",year:"32-40岁",title:"基金评审意见回来了",type:"side",
      text:"“创新性不足。”“前期基础有限。”“建议进一步凝练科学问题。”你已经能背出这些句式。",
      choices:[
        {text:"逐条拆解，明年再投",sub:"科研是一场长期复利。",effects:{research:7,mental:-2,energy:-3},flags:["grantPersistence"],next:"__RETURN__"},
        {text:"暂时把重心转回临床",sub:"换一个增长曲线。",effects:{knowledge:5,reputation:3,research:-2,mental:3},next:"__RETURN__"}
      ]
    },
    side_parent_health:{
      stage:"支线 · 家庭",year:"32-45岁",title:"父母的体检报告发到了你手机上",type:"side",
      text:"你每天在医院里处理别人的健康问题，但轮到家人时，你突然发现自己也会慌。",
      choices:[
        {text:"请假陪家人进一步检查",sub:"职业重要，家人也不会永远等你。",effects:{mental:5,money:-3,reputation:-1},flags:["familyTime"],next:"__RETURN__"},
        {text:"先远程安排好检查流程",sub:"尽量两边兼顾。",effects:{mental:-2,knowledge:2,energy:-3},flags:["juggling"],next:"__RETURN__"}
      ]
    }
  }
};