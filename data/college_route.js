window.COLLEGE_DATA = {
  entry:"college_fresh",
  order:[
    "college_fresh","college_key_track","college_skill_year","college_opportunity_round",
    "college_internship","college_key_graduation","college_upgrade_exam","college_upgrade_success",
    "college_upgrade_fail","college_practice_entry","college_practice_years","college_late_choice",
    "college_primary_career"
  ],
  events:{
    college_fresh:{
      stage:"医学专科 · 大一",year:"18岁",title:"三年，比你想象得短很多",type:"main",
      text:"课程表里基础医学、技能实训和职业课程排得很紧。老师第一天就提醒：三年制路线不会给你太多“以后再想”的时间。",
      choices:[
        {text:"先把技能练扎实",sub:"操作、问诊和基本临床能力优先。",effects:{knowledge:4,reputation:2,energy:-2},talentEffects:{dexterity:2},flags:["collegeSkillStart"],next:"college_key_track"},
        {text:"从第一学期就准备专升本",sub:"更早把英语和理论课拉起来。",effects:{knowledge:6,mental:-2},talentEffects:{english:1,resilience:1},flags:["collegeUpgradeEarly"],next:"college_key_track"},
        {text:"先了解就业和基层医疗路线",sub:"更早建立职业现实感。",effects:{reputation:3,knowledge:2},talentEffects:{communication:1},flags:["collegeCareerAware"],next:"college_key_track"}
      ]
    },

    college_key_track:{
      stage:"⚠️ 关键节点 · 专科主线",year:"18-19岁",title:"三年里，你最想押哪条主线？",type:"key",critical:true,
      warning:"专科阶段时间更短。这个选择会改变技能、实习、专升本和就业机会的权重。",
      text:"如果什么都想做，三年很容易被切碎。你需要更早确定自己主要想换到什么。",
      choices:[
        {text:"升学优先：为专升本和后续考研留路",sub:"理论、英语和考试投入更大。",effects:{knowledge:6,energy:-3},talentEffects:{english:2,resilience:1},flags:["collegeUpgradeTrack"],route:"专科·升学优先",next:"college_skill_year"},
        {text:"技能优先：实训、竞赛、临床实践",sub:"动手和临床适应会更快。",effects:{knowledge:4,reputation:3,energy:-3},talentEffects:{dexterity:3},flags:["collegeSkillTrack"],route:"专科·技能优先",next:"college_skill_year"},
        {text:"基层医疗优先：尽早接触真实一线",sub:"沟通和实际场景经验更多。",effects:{knowledge:3,reputation:4},talentEffects:{communication:2,resilience:1},flags:["collegePrimaryTrack"],route:"专科·基层实践",next:"college_skill_year"},
        {text:"均衡发展：升学和技能都保留",sub:"选择面更广，但时间最紧。",effects:{knowledge:4,reputation:2,energy:-5,mental:-2},flags:["collegeBalanced"],route:"专科·均衡",next:"college_skill_year"}
      ]
    },

    college_skill_year:{
      stage:"医学专科 · 实训年",year:"19岁",title:"技能考核第一次真正卡住了你",type:"main",
      text:"理论背会不代表手能做对。操作流程、无菌观念、沟通步骤和时间限制一起出现。",
      choices:[
        {text:"每天加练操作",sub:"动手能力提升最快。",effects:{knowledge:5,energy:-5},talentEffects:{dexterity:3},flags:["collegePracticeHard"],next:"college_opportunity_round"},
        {text:"和同学互相模拟患者与考官",sub:"沟通与团队一起提升。",effects:{knowledge:4,reputation:3,mental:2},talentEffects:{communication:2,dexterity:1},flags:["collegePeerPractice"],next:"college_opportunity_round"},
        {text:"升学线优先，技能保证过关",sub:"把更多时间留给理论和英语。",effects:{knowledge:6,energy:-3},talentEffects:{english:1},requires:{flags:["collegeUpgradeTrack"]},flags:["collegeExamFocus"],next:"college_opportunity_round"}
      ]
    },

    college_opportunity_round:{
      stage:"🎯 竞争机会 · 医学专科",year:"19岁",title:"四个机会同时出现，但你只能重点申请一个",type:"opportunity",exclusiveGroup:"college_opportunity",
      warning:"三年制时间有限，本轮只能重点申请一个。选定后会进入完整申请过程，而不是立刻抽结果。",
      text:"奖学金、优质实习、专升本强化计划、基层实践项目都能改变后续，但你不可能同时把四套准备做到最好。",
      choices:[
        {text:"申请专科阶段奖学金",sub:"成绩、技能与综合表现都会进入评审。",effects:{},application:"专科奖学金",next:"college_internship"},
        {text:"申请优质医院实习名额",sub:"更好的病例与带教，但竞争更激烈。",effects:{},application:"专科优质实习",next:"college_internship"},
        {text:"申请专升本强化计划",sub:"获得额外课程、资料或导师支持。",effects:{},application:"专升本强化计划",next:"college_internship"},
        {text:"申请基层医疗实践项目",sub:"更早进入真实基层场景。",effects:{},application:"专科基层实践",next:"college_internship"}
      ]
    },

    college_internship:{
      stage:"医学专科 · 实习",year:"20岁",title:"实习医院怎么选？",type:"main",
      text:"大医院病例复杂、学习机会多，但时间和通勤成本更高；区域医院上手机会可能更多；如果你准备专升本，还得给考试留时间。",
      choices:[
        {text:"去病例量大的大医院",sub:"临床见识更多，体力压力也更大。",effects:{knowledge:7,reputation:4,energy:-6},talentEffects:{dexterity:2,resilience:1},flags:["collegeBigHospitalIntern"],next:"college_key_graduation"},
        {text:"去区域医院争取更多上手机会",sub:"实际参与度更高。",effects:{knowledge:6,reputation:5,energy:-4},talentEffects:{dexterity:2,communication:1},flags:["collegeRegionalIntern"],next:"college_key_graduation"},
        {text:"选更利于专升本复习的实习点",sub:"临床增益略少，但考试准备更完整。",effects:{knowledge:6,mental:2},talentEffects:{english:1},requires:{flags:["collegeUpgradeTrack"]},flags:["collegeExamFriendlyIntern"],next:"college_key_graduation"}
      ]
    },

    college_key_graduation:{
      stage:"⚠️ 关键节点 · 专科毕业",year:"21岁",title:"毕业以后：继续升学，还是更早进入医疗一线？",type:"key",critical:true,
      warning:"专升本成功后可以重新进入本科—考研—读博的大路线；直接进入基层/临床相关岗位会更早积累实践，但学历路线不同。",
      text:"三年结束得很快。现在你要决定，是再赌一次考试换学历平台，还是开始把技能变成职业经验。",
      choices:[
        {text:"参加专升本考试",sub:"成功后进入本科衔接路线，再次打开考研、硕士与博士分支。",effects:{knowledge:5,energy:-5,mental:-3},flags:["collegeUpgradeAttempt"],route:"专科·专升本考试",next:"college_upgrade_exam"},
        {text:"进入基层/区域医疗相关岗位并准备职业资格",sub:"游戏按基层临床成长路线抽象；真实资格条件以当年官方规定为准。",effects:{money:4,reputation:3,knowledge:3},flags:["collegeDirectPractice"],route:"专科·基层医疗实践",next:"college_practice_entry"},
        {text:"先工作一年，再决定是否继续升学",sub:"先解决经济和职业认知，再做第二次选择。",effects:{money:6,knowledge:2,mental:3},flags:["collegeWorkFirst"],route:"专科·先工作再选择",next:"college_practice_entry"}
      ]
    },

    college_upgrade_exam:{
      stage:"升学 · 专升本",year:"21岁",title:"这是你第二次用考试改写学历路径",type:"key",critical:true,
      warning:"成功会进入本科衔接线；失败后可以再次准备、直接工作，或者在实践几年后重新考虑继续教育。",
      text:"你已经不是高考时那个完全不知道医学是什么的人。现在考试目标更具体，代价也更清楚。",
      choices:[
        {text:"全力冲一次",sub:"知识、英语、抗压和前期准备共同影响。",effects:{energy:-7,mental:-4},chance:{p:.50,bonusBy:["knowledge","english","resilience"],success:{mental:7,reputation:3},fail:{mental:-7},successFlags:["collegeUpgradeSuccess"],failFlags:["collegeUpgradeFail"]},successNext:"college_upgrade_success",failNext:"college_upgrade_fail",route:"专科→本科·冲刺"},
        {text:"稳妥准备，保留就业后路",sub:"成功概率稍稳，投入略低。",effects:{energy:-5,mental:-2},chance:{p:.58,bonusBy:["knowledge","resilience"],success:{mental:6,reputation:2},fail:{mental:-5},successFlags:["collegeUpgradeSuccess"],failFlags:["collegeUpgradeFail"]},successNext:"college_upgrade_success",failNext:"college_upgrade_fail",route:"专科→本科·稳妥"}
      ]
    },

    college_upgrade_success:{
      stage:"专升本成功",year:"21-23岁",title:"你重新拿到了本科阶段的入场券",type:"main",
      text:"这不是把前三年清零，而是把你已有的技能、实习经历和升学经验带进下一阶段。",
      choices:[
        {text:"本科阶段继续冲研究生",sub:"重新打开硕士和博士路线。",effects:{knowledge:6,research:3,energy:-4},flags:["collegeToBachelorAcademic"],route:"本科衔接·继续升学",next:"key_graduation"},
        {text:"本科阶段临床能力优先",sub:"先补平台和学历，再把技能做强。",effects:{knowledge:7,reputation:4,energy:-3},flags:["collegeToBachelorClinical"],route:"本科衔接·临床优先",next:"key_graduation"}
      ]
    },

    college_upgrade_fail:{
      stage:"专升本失利",year:"21岁",title:"这次没有上岸",type:"key",critical:true,
      warning:"失败不会自动结束升学路线，但继续考试意味着时间、经济和心理成本。",
      text:"你需要决定还要不要把下一年继续押在考试上。",
      choices:[
        {text:"再准备一次",sub:"经验会提高下一次准备质量。",effects:{money:-3,mental:-5,knowledge:4},chance:{p:.66,bonusBy:["knowledge","resilience"],success:{mental:8},fail:{mental:-8},successFlags:["collegeUpgradeSecondSuccess"],failFlags:["collegeUpgradeSecondFail"]},successNext:"college_upgrade_success",failNext:"college_practice_entry",route:"专科→本科·二战"},
        {text:"进入医疗实践，不再继续考试",sub:"更早积累职业经验。",effects:{money:5,mental:4,reputation:2},flags:["collegeStopUpgrade"],route:"专科·转入实践",next:"college_practice_entry"}
      ]
    },

    college_practice_entry:{
      stage:"专科毕业后 · 实践线",year:"21-23岁",title:"你开始真正靠技能和责任工作",type:"main",
      text:"基层与区域医疗场景不会因为学历不同而变得简单。沟通、基本功、转诊判断和持续学习变得非常重要。",
      choices:[
        {text:"把基层全科能力做扎实",sub:"知识面、沟通和可靠性优先。",effects:{knowledge:7,reputation:6,energy:-5},talentEffects:{communication:2,resilience:1},flags:["primaryCareGrowth"],next:"college_practice_years"},
        {text:"边工作边准备继续教育",sub:"收入、工作和学习三线并行。",effects:{knowledge:5,money:3,energy:-7,mental:-3},flags:["workStudy"],next:"college_practice_years"},
        {text:"寻找更强的区域医院平台",sub:"争取病例和带教资源。",effects:{knowledge:5,reputation:4,mental:-2},chance:{p:.48,bonusBy:["knowledge","reputation","communication"],success:{reputation:5,mental:4},fail:{mental:-2},successFlags:["collegePlatformMove"],failFlags:["collegePlatformMiss"]},next:"college_practice_years"}
      ]
    },

    college_practice_years:{
      stage:"实践成长",year:"23-26岁",title:"几年以后，你发现学历和能力都在影响天花板",type:"main",
      text:"工作经验让你更成熟，也让你更清楚哪些机会会受学历、资格和平台限制。",
      choices:[
        {text:"继续做基层/区域医疗骨干",sub:"把可靠性和本地口碑做成核心竞争力。",effects:{knowledge:6,reputation:8,money:5},flags:["primaryCareCore"],next:"college_late_choice"},
        {text:"重新准备学历提升",sub:"几年后再回到考试桌前。",effects:{knowledge:5,energy:-5,mental:-3},flags:["lateUpgrade"],next:"college_late_choice"},
        {text:"转向医疗管理/公共健康相关岗位",sub:"离开纯临床主线，但仍在医疗系统。",effects:{reputation:5,mental:4,money:4},flags:["collegeHealthAdmin"],next:"college_primary_career"}
      ]
    },

    college_late_choice:{
      stage:"⚠️ 关键节点 · 再次选择",year:"25-28岁",title:"你还要不要继续抬高学历平台？",type:"key",critical:true,
      warning:"继续升学会再次消耗时间；留在实践线则会形成另一种职业价值。",
      text:"现在的你已经不是为了“学历更好看”而考试，而是很清楚它能打开哪些门。",
      choices:[
        {text:"继续教育 / 再次冲本科衔接",sub:"游戏化简化为再次升学机会。",effects:{knowledge:4,energy:-5,mental:-2},chance:{p:.54,bonusBy:["knowledge","resilience"],success:{mental:6,reputation:3},fail:{mental:-5},successFlags:["lateUpgradeSuccess"],failFlags:["lateUpgradeFail"]},successNext:"college_upgrade_success",failNext:"college_primary_career",route:"实践后·继续升学"},
        {text:"不再追学历，把实践做深",sub:"形成基层/区域医疗长期路线。",effects:{knowledge:5,reputation:7,mental:5},flags:["primaryCareLongTerm"],route:"实践后·基层长期路线",next:"college_primary_career"}
      ]
    },

    college_primary_career:{
      stage:"基层 / 区域医疗成熟期",year:"30岁+",title:"你成为了当地患者熟悉的医疗工作者",type:"main",
      text:"这条路线没有走到博士和大医院主任，但稳定、连续的基层医疗同样构成医疗系统的重要部分。",
      choices:[
        {text:"成为基层医疗骨干",sub:"继续积累本地口碑与综合能力。",effects:{knowledge:7,reputation:10,mental:4},flags:["primaryCareLeader"],next:"final"},
        {text:"转向基层管理与公共健康协调",sub:"把经验转成系统能力。",effects:{reputation:9,knowledge:4,mental:3},flags:["primaryCareManager"],next:"final"}
      ]
    }
  }
};