window.GAME_DATA = {
  difficulties: {
    easy: {
      name: "温和模式",
      desc: "资源更宽裕，适合体验剧情。",
      start: {knowledge:58,energy:82,mental:82,money:55,research:8,reputation:5},
      negativeScale: 0.82
    },
    normal: {
      name: "真实模式",
      desc: "推荐。努力、选择与运气缺一不可。",
      start: {knowledge:52,energy:72,mental:68,money:42,research:5,reputation:3},
      negativeScale: 1
    },
    hard: {
      name: "地狱模式",
      desc: "更像“为什么我当初要学医”。",
      start: {knowledge:46,energy:62,mental:57,money:30,research:2,reputation:1},
      negativeScale: 1.22
    }
  },

  order: [
    "entrance","oath","anatomy","finals","lab","clinic","internship","postgrad",
    "paper","residentExam","nightShift","conflict","license","career","familyChoice",
    "promotion","director","final"
  ],

  events: {
    entrance: {
      stage:"临床医学 · 大一", year:"18岁", title:"录取通知书到了",
      text:"你被临床医学专业录取。家里很高兴，亲戚说：以后家里看病就靠你了。\n你隐约觉得，事情没有这么简单。",
      choices:[
        {text:"立志成为名医",sub:"从今天开始认真卷。",effects:{knowledge:6,mental:-3,reputation:2},flags:["ambitious"],next:"oath"},
        {text:"先享受大学生活",sub:"医学很长，青春也很短。",effects:{energy:6,mental:7,knowledge:-2},flags:["balanced"],next:"oath"},
        {text:"先研究就业、收入和培养路线",sub:"先看清终点，再决定怎么走。",effects:{money:2,knowledge:2,mental:-1},flags:["pragmatic"],next:"oath"}
      ]
    },

    oath: {
      stage:"临床医学 · 大一",year:"18岁",title:"第一次穿上白大褂",
      text:"宣誓那天，你站在人群里。理想、责任、生命和职业尊严这些词，第一次变得具体。",
      choices:[
        {text:"把誓言记在心里",sub:"患者永远不是一个病例号。",effects:{mental:4,reputation:5},flags:["humanism"],next:"anatomy"},
        {text:"拍照发朋友圈",sub:"白大褂确实挺帅。",effects:{mental:5,reputation:1},flags:["social"],next:"anatomy"}
      ]
    },

    anatomy: {
      stage:"基础医学",year:"19岁",title:"系统解剖学：第一次大考",
      text:"标本、神经、血管、骨点像一张没有尽头的地图。室友已经背到凌晨两点。",
      choices:[
        {text:"熬夜硬背三天",sub:"成绩上去，体力下去。",effects:{knowledge:10,energy:-13,mental:-5},flags:["crammer"],next:"finals"},
        {text:"按计划复习，睡够七小时",sub:"涨得慢，但更稳。",effects:{knowledge:7,energy:-3,mental:3},flags:["steady"],next:"finals"},
        {text:"临时抱佛脚",sub:"赌老师不出偏题。",effects:{knowledge:2,mental:-2},chance:{p:0.38,success:{knowledge:8,mental:4},fail:{knowledge:-7,mental:-7}},next:"finals"}
      ]
    },

    finals: {
      stage:"基础医学",year:"20岁",title:"期末周：六门一起考",
      text:"你第一次理解了什么叫“背不完，根本背不完”。朋友圈里的其他专业已经开始放假。",
      choices:[
        {text:"关闭社交软件，全天自习室",sub:"短期高强度冲刺。",effects:{knowledge:9,energy:-9,mental:-6},next:"lab"},
        {text:"和同学组队互相提问",sub:"效率与情绪都更稳定。",effects:{knowledge:7,mental:4,reputation:2},flags:["teamPlayer"],next:"lab"},
        {text:"战略放弃两章",sub:"学会接受不可能全会。",effects:{knowledge:4,mental:5},flags:["prioritize"],next:"lab"}
      ]
    },

    lab: {
      stage:"基础医学",year:"20岁",title:"导师问：要不要进实验室？",
      text:"学长告诉你：想保研，最好早点进组。你第一次认真听见影响因子、SCI和通讯作者。",
      choices:[
        {text:"进组做科研",sub:"科研线提前开启。",effects:{research:10,energy:-7,mental:-3},flags:["earlyResearch"],next:"clinic"},
        {text:"先把临床基础学扎实",sub:"科研晚点再说。",effects:{knowledge:8,research:-1},flags:["clinicalFirst"],next:"clinic"},
        {text:"两边都要",sub:"经典医学生答案。",effects:{knowledge:5,research:6,energy:-10,mental:-5},flags:["doubleTrack"],next:"clinic"}
      ]
    },

    clinic: {
      stage:"临床见习",year:"21岁",title:"第一次真正面对患者",
      text:"老师让你去问病史。患者看着你胸牌上的“见习”二字，明显犹豫了一下。",
      choices:[
        {text:"认真沟通，慢慢取得信任",sub:"慢，但患者愿意告诉你更多。",effects:{knowledge:5,reputation:8,mental:3},requires:{stats:{mental:45}},flags:["communication"],next:"internship"},
        {text:"快速按模板问完",sub:"效率优先。",effects:{knowledge:4,reputation:1},next:"internship"}
      ]
    },

    internship: {
      stage:"临床实习",year:"22岁",title:"凌晨的第一次抢救",
      text:"监护仪报警。你站在老师旁边，忽然发现课本上的每一个数字，现在都对应一个真实的人。",
      choices:[
        {text:"主动参与，在老师指导下完成任务",sub:"紧张，但这是成长最快的时候。",effects:{knowledge:9,energy:-7,mental:-3,reputation:5},flags:["clinicalCourage"],next:"postgrad"},
        {text:"先观察，确保不添乱",sub:"更稳妥，但参与感较少。",effects:{knowledge:5,mental:1},next:"postgrad"}
      ]
    },

    postgrad: {
      stage:"毕业分岔口",year:"23岁",title:"毕业去哪里？",
      text:"五年过去了。你发现本科毕业不是终点，而只是第一次真正分流。",
      choices:[
        {text:"考研 / 读专业型硕士",sub:"继续临床，同时进入规培体系。",effects:{knowledge:7,mental:-6,money:-6},flags:["master","clinicalPostgrad"],next:"paper"},
        {text:"学术型硕士 / 科研路线",sub:"论文和项目会成为新的硬通货。",effects:{research:12,mental:-5,money:-5},flags:["master","academic"],next:"paper"},
        {text:"直接就业并参加规培",sub:"提前进入医院现实。",effects:{money:5,energy:-5,reputation:3},flags:["directResident"],next:"residentExam"}
      ]
    },

    paper: {
      stage:"研究生",year:"25岁",title:"你的第一篇论文",
      text:"数据做完了，结果“不显著”。师兄问你：要不要换个分析方法再看看？",
      choices:[
        {text:"如实报告阴性结果",sub:"慢一点，但心里踏实。",effects:{research:5,reputation:7,mental:3},flags:["integrity"],next:"residentExam"},
        {text:"继续探索合理亚组",sub:"可以探索，但守住统计边界。",effects:{research:8,energy:-6},flags:["exploratory"],next:"residentExam"},
        {text:"为了发文章，想办法“做显著”",sub:"短期可能有收益，长期可能埋雷。",effects:{research:11,reputation:-8,mental:-8},flags:["questionableResearch"],next:"residentExam"}
      ]
    },

    residentExam: {
      stage:"住院医师规范化培训",year:"26岁",title:"规培第一年",
      text:"工资不高、轮转很多、考试不少。你开始真正体会“学生”和“医生”之间那段漫长的灰色地带。",
      choices:[
        {text:"每个科室都认真轮转",sub:"累，但基本功会留下来。",effects:{knowledge:9,reputation:5,energy:-10},flags:["solidResident"],next:"nightShift"},
        {text:"重点经营未来想去的科室",sub:"更早建立方向和人脉。",effects:{knowledge:5,reputation:7,research:2},flags:["specialtyFocus"],next:"nightShift"},
        {text:"先保证别被榨干",sub:"学习重要，但活着也重要。",effects:{mental:9,energy:7,knowledge:2},flags:["selfCare"],next:"nightShift"}
      ]
    },

    nightShift: {
      stage:"规培",year:"27岁",title:"凌晨 3:17，又来一个急诊",
      text:"你已经连续工作十多个小时。手机里还有导师催的数据，家人问你国庆回不回家。",
      choices:[
        {text:"先处理患者，再补科研",sub:"今晚注定睡不了了。",effects:{knowledge:7,reputation:7,energy:-15,mental:-8,research:2},flags:["dutyFirst"],next:"conflict"},
        {text:"找同事合理分担",sub:"团队合作也是能力。",effects:{reputation:4,energy:-7,mental:-3},flags:["teamPlayer"],next:"conflict"},
        {text:"所有事情都自己扛",sub:"你觉得必须证明自己能扛。",effects:{knowledge:5,reputation:5,energy:-20,mental:-12},flags:["burnoutRisk"],next:"conflict"}
      ]
    },

    conflict: {
      stage:"规培",year:"28岁",title:"医患冲突",
      text:"一次沟通不充分后，家属情绪激动，在走廊里质问你：你们到底会不会看病？",
      choices:[
        {text:"耐心解释并请上级共同沟通",sub:"慢一点，但风险更低。",effects:{reputation:8,mental:-5,knowledge:2},flags:["communication"],next:"license"},
        {text:"据理力争",sub:"你说的也许没错，但场面更僵。",effects:{reputation:-5,mental:-8},flags:["confrontational"],next:"license"},
        {text:"把问题完全交给上级",sub:"安全，但你没有真正处理这次冲突。",effects:{reputation:-1,mental:-2},next:"license"}
      ]
    },

    license: {
      stage:"职业资格",year:"28岁",title:"考试与结业一起压过来",
      text:"执业资格、规培结业、科室考核同时出现。你突然又回到了学生时代，只是这次白天还要正常上班。",
      choices:[
        {text:"请假集中复习",sub:"短期收入和科室存在感下降。",effects:{knowledge:9,money:-4,reputation:-2,mental:-3},chance:{p:0.72,bonusBy:["knowledge"],success:{reputation:5,mental:4},fail:{mental:-9}},next:"career"},
        {text:"边上班边准备",sub:"典型医生做法：全都要。",effects:{knowledge:6,energy:-11,mental:-5},chance:{p:0.62,bonusBy:["knowledge","energy"],success:{reputation:4},fail:{mental:-8}},next:"career"}
      ]
    },

    career: {
      stage:"主治医师阶段",year:"32岁",title:"临床、科研和生活只能三选二？",
      text:"门诊、手术、值班、课题、论文、家庭同时涌来。你终于明白，时间才是医生最贵的资源。",
      choices:[
        {text:"冲科研与职称",sub:"博士、基金、论文，全都要。",effects:{research:15,reputation:7,energy:-14,mental:-9,money:5},flags:["researchTrack"],next:"familyChoice"},
        {text:"做强临床能力",sub:"成为科室里真正能解决问题的人。",effects:{knowledge:13,reputation:10,energy:-11,mental:-4,money:6},flags:["clinicalTrack"],next:"familyChoice"},
        {text:"保住生活边界",sub:"不一定最快，但希望走得更久。",effects:{mental:12,energy:10,reputation:2,research:-3},flags:["lifeTrack"],next:"familyChoice"}
      ]
    },

    familyChoice: {
      stage:"人生并行线",year:"35岁",title:"工作之外的人生也在往前走",
      text:"家人、伴侣、孩子、父母健康，和你的职业发展并不会排队出现。它们总是同时发生。",
      choices:[
        {text:"给家庭留下固定时间",sub:"晋升慢一点，但生活不是附属品。",effects:{mental:12,energy:5,reputation:-2},flags:["familyTime"],next:"promotion"},
        {text:"关键几年先冲事业",sub:"把压力推迟到未来。",effects:{research:7,reputation:6,money:5,mental:-9},flags:["careerFirst"],next:"promotion"},
        {text:"努力维持两边",sub:"现实里最常见，也最累。",effects:{reputation:3,money:2,energy:-8,mental:-4},flags:["juggling"],next:"promotion"}
      ]
    },

    promotion: {
      stage:"高级职称",year:"40岁",title:"副高评审前夜",
      text:"材料摆在桌上：临床量、教学、论文、基金、同行评价。十几年的选择都在这一刻汇总。",
      choices:[
        {text:"提交评审",sub:"结果由积累与一点运气共同决定。",effects:{},chance:{p:0.52,bonusBy:["research","reputation","knowledge"],success:{reputation:12,money:8,mental:4},fail:{mental:-10,reputation:-2}},next:"director"}
      ]
    },

    director: {
      stage:"职业巅峰分岔",year:"48岁",title:"你想成为怎样的医生？",
      text:"你已经不再是当年那个刚穿白大褂的学生。现在，年轻医生开始叫你“老师”。",
      choices:[
        {text:"冲击科主任与学科带头人",sub:"管理、资源和责任同时增加。",effects:{reputation:12,research:6,mental:-6},flags:["director"],next:"final"},
        {text:"继续做一线临床专家",sub:"把最难的病例留给自己。",effects:{knowledge:12,reputation:9,mental:2},flags:["expert"],next:"final"},
        {text:"全力做科研与学术",sub:"冲基金、大奖与更高学术平台。",effects:{research:18,reputation:8,energy:-10},flags:["academicianTrack"],next:"final"}
      ]
    },

    final: {
      stage:"终章",year:"60岁",title:"白大褂的最后一页",
      text:"几十年过去。你回头看见的不是一条直线，而是一串由选择组成的人生记录。",
      choices:[
        {text:"查看人生结局",sub:"看看这条时间线里，你最终成为了谁。",effects:{},next:"__END__"}
      ]
    }
  }
};
