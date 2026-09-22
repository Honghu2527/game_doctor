window.CAREER_DATA = {
  entryByProfile: {
    elite_research:"fresh_elite_research",
    elite_clinical:"fresh_elite_clinical",
    innovation:"fresh_innovation",
    strong_medical:"fresh_strong_medical",
    regional_clinical:"fresh_regional",
    growth:"fresh_growth"
  },

  order:[
    "fresh_elite_research","fresh_elite_clinical","fresh_innovation","fresh_strong_medical","fresh_regional","fresh_growth",
    "white_coat_oath","key_undergrad_identity","ug_research_route","ug_clinical_route","ug_balanced_route","ug_global_route",
    "ug_opportunity_fair","clinical_exposure","key_graduation","grad_exam_route","exam_fail_choice","recommended_postgrad",
    "specialty_select_clinical_master","specialty_select_academic_master","specialty_select_direct_phd","specialty_select_resident",
    "clinical_master","clinical_master_finish","academic_master","direct_phd","overseas_postgrad","master_opportunity_round","phd_decision",
    "phd_year1","phd_crisis","phd_global_round","phd_graduation","resident_entry","resident_night","resident_exam",
    "job_choice","young_attending","career_opportunity_round","key_midcareer","promotion","director","final"
  ],

  events: {
    fresh_elite_research:{
      stage:"大一 · 科研密集型平台",year:"18岁",title:"开学第二周，实验室招募邮件就来了",type:"main",
      text:"你还没认全宿舍楼，邮箱里已经躺着三个本科科研计划：基础实验、临床数据库、转化医学。身边同学有人已经在问导师论文方向。",
      choices:[
        {text:"先申请基础实验室轮转",sub:"早点摸清科研到底适不适合自己。",effects:{research:6,energy:-3},talentEffects:{researchSense:2},flags:["earlyResearch"],next:"white_coat_oath"},
        {text:"先稳住基础课，不急着进组",sub:"资源很多，但不是每个机会都必须立刻抓。",effects:{knowledge:5,mental:3},flags:["foundationFirst"],next:"white_coat_oath"},
        {text:"直接冲最热门课题组",sub:"竞争最激烈，也可能最早见到高水平项目。",effects:{research:8,mental:-4,energy:-4},chance:{p:.38,bonusBy:["researchSense","knowledge"],success:{reputation:5,research:4},fail:{mental:-3},successFlags:["hotLabAccepted"],failFlags:["hotLabRejected"]},next:"white_coat_oath"}
      ]
    },

    fresh_elite_clinical:{
      stage:"大一 · 顶级临床平台",year:"18岁",title:"附属医院开放了低年级观察名额",type:"main",
      text:"课程还没进入诊断学，但学校允许少量低年级学生去大型附属医院旁听病例讨论。名额不多，报名的人很多。",
      choices:[
        {text:"抢一个早期临床观察名额",sub:"会牺牲周末，但可能更早建立临床感。",effects:{knowledge:5,reputation:3,energy:-3},talentEffects:{communication:1,dexterity:1},flags:["earlyClinical"],next:"white_coat_oath"},
        {text:"先把解剖、生理打牢",sub:"先学会再上临床。",effects:{knowledge:6,mental:2},flags:["foundationFirst"],next:"white_coat_oath"},
        {text:"去技能中心报名志愿者",sub:"先从基本操作和模拟训练开始。",effects:{knowledge:4,reputation:2,energy:-2},talentEffects:{dexterity:2},flags:["skillsEarly"],next:"white_coat_oath"}
      ]
    },

    fresh_innovation:{
      stage:"大一 · 交叉创新型平台",year:"18岁",title:"医学、AI、工程联合新生项目招募",type:"main",
      text:"你第一次发现，医学院隔壁的计算机同学也在研究医学影像，工程学院在做手术机器人。一个跨学科新生项目正在组队。",
      choices:[
        {text:"加入医学AI小组",sub:"除了医学，还要补一点代码和数据思维。",effects:{research:6,knowledge:3,energy:-4},talentEffects:{researchSense:2,english:1},flags:["aiMedicine"],next:"white_coat_oath"},
        {text:"加入医学工程小组",sub:"更偏设备、传感器和临床问题。",effects:{research:5,knowledge:4,energy:-4},talentEffects:{dexterity:2},flags:["medEngineering"],next:"white_coat_oath"},
        {text:"先只学医学",sub:"交叉机会以后还有。",effects:{knowledge:6,mental:3},flags:["foundationFirst"],next:"white_coat_oath"}
      ]
    },

    fresh_strong_medical:{
      stage:"大一 · 强势医科大学",year:"18岁",title:"班主任把五年的培养路线摊在你面前",type:"main",
      text:"课程、见习、科研、竞赛、保研、考研，每一项都有相对清晰的时间表。你第一次意识到五年看起来很长，其实节点很多。",
      choices:[
        {text:"按路线表提前规划保研",sub:"从成绩、英语到科研都开始布局。",effects:{knowledge:5,research:2,mental:-2},flags:["planner"],next:"white_coat_oath"},
        {text:"临床能力优先，科研以后再说",sub:"目标更务实。",effects:{knowledge:5,reputation:2},talentEffects:{dexterity:1},flags:["clinicalFirst"],next:"white_coat_oath"},
        {text:"先适应大学生活",sub:"不把大一过成高四。",effects:{mental:6,energy:3},flags:["balanced"],next:"white_coat_oath"}
      ]
    },

    fresh_regional:{
      stage:"大一 · 区域临床强校",year:"18岁",title:"学长告诉你：本地附属医院资源很扎实",type:"main",
      text:"如果未来留在本省，学校和医院网络会很有帮助；如果想去更大的平台，成绩和考研会变得尤其重要。",
      choices:[
        {text:"尽早建立本地临床联系",sub:"先把区域优势吃透。",effects:{knowledge:4,reputation:4},flags:["localNetwork"],next:"white_coat_oath"},
        {text:"从大一开始准备平台跃迁",sub:"英语、绩点和信息搜集提前启动。",effects:{knowledge:5,mental:-2},talentEffects:{english:1,resilience:1},flags:["platformAmbition"],next:"white_coat_oath"},
        {text:"先观察几年再决定",sub:"给自己保留选择。",effects:{mental:4,knowledge:2},flags:["exploring"],next:"white_coat_oath"}
      ]
    },

    fresh_growth:{
      stage:"大一 · 逆风成长型",year:"18岁",title:"没有统一入口，你得自己找机会",type:"main",
      text:"科研、竞赛、见习机会并不会自动推到你面前。学长说得很直接：想要什么，就自己去问、去找、去争。",
      choices:[
        {text:"主动给老师发邮件找项目",sub:"可能被拒，但至少开始建立信息差。",effects:{research:3,mental:-2},chance:{p:.42,bonusBy:["communication","knowledge"],success:{research:6,reputation:3},fail:{mental:-2},successFlags:["selfMadeOpportunity"],failFlags:["firstRejection"]},next:"white_coat_oath"},
        {text:"先把成绩卷到年级前列",sub:"用成绩换未来选择权。",effects:{knowledge:7,energy:-3},flags:["gradeFirst"],next:"white_coat_oath"},
        {text:"找学长学姐搭建信息渠道",sub:"先解决不知道机会在哪里的问题。",effects:{reputation:4,knowledge:2},talentEffects:{communication:1},flags:["networkBuilder"],next:"white_coat_oath"}
      ]
    },

    white_coat_oath:{
      stage:"共同节点 · 白大褂宣誓",year:"18岁",title:"第一次穿上白大褂",type:"main",
      text:"不同学校、不同开局，最终都来到这一天。你站在人群里宣誓。下一次重大选择，会决定你本科阶段把最多时间投向哪里。",
      choices:[
        {text:"记住这一天",sub:"医学不是只有考试和履历。",effects:{mental:4,reputation:4},flags:["humanism"],next:"key_undergrad_identity"},
        {text:"我更在意未来能走多远",sub:"野心也可以是一种动力。",effects:{research:2,knowledge:2,mental:-1},flags:["ambitious"],next:"key_undergrad_identity"}
      ]
    },

    key_undergrad_identity:{
      stage:"⚠️ 关键节点 · 本科主线",year:"19岁",title:"你准备把大学最稀缺的时间押在哪里？",type:"key",critical:true,
      warning:"这个选择会改变本科中后期的大量事件、机会池和毕业时可见选项。你之后可以调整，但代价会更高。",
      text:"时间开始不够用了。课程、科研、技能、英语、社交都在抢你。你必须第一次真正做取舍。",
      choices:[
        {text:"科研优先：尽早做项目、论文、竞赛",sub:"更容易获得科研、保研、直博机会；临床技能成长会慢一些。",effects:{research:8,energy:-4},route:"本科·科研优先",flags:["ugResearch"],next:"ug_research_route"},
        {text:"临床优先：技能、见习、病例",sub:"更容易获得技能队、附院和临床导师机会；论文优势较弱。",effects:{knowledge:7,reputation:3,energy:-3},route:"本科·临床优先",flags:["ugClinical"],next:"ug_clinical_route"},
        {text:"均衡发展：成绩、科研、临床都保住",sub:"选择面最广，但最容易疲惫。",effects:{knowledge:4,research:4,energy:-6,mental:-3},route:"本科·均衡",flags:["ugBalanced"],next:"ug_balanced_route"},
        {text:"海外准备：英语、交流、国际项目",sub:"国际交换与海外研究机会明显增加，但国内竞赛投入减少。",effects:{knowledge:3,research:3,energy:-4},talentEffects:{english:4},route:"本科·海外准备",flags:["ugGlobal"],next:"ug_global_route"}
      ]
    },

    ug_research_route:{
      stage:"本科 · 科研线",year:"19-20岁",title:"第一份真正需要负责的科研任务",type:"main",
      text:"你不再只是帮忙，而是需要对一部分数据或实验结果负责。失败、返工和不确定性开始成为日常。",
      choices:[
        {text:"选小而完整的课题，争取自己做完",sub:"更容易形成独立成果。",effects:{research:8,knowledge:3,energy:-5},talentEffects:{researchSense:2},flags:["ownProject"],next:"ug_opportunity_fair"},
        {text:"加入大项目，先见识高水平团队",sub:"自主性少，但平台和规范更强。",effects:{research:7,reputation:4,energy:-4},flags:["bigProject"],next:"ug_opportunity_fair"},
        {text:"发现自己并不喜欢科研，及时转向",sub:"损失一些沉没成本，但不是失败。",effects:{knowledge:4,mental:5,research:-2},route:"本科·转向临床",flags:["researchDoubt"],next:"ug_clinical_route"}
      ]
    },

    ug_clinical_route:{
      stage:"本科 · 临床线",year:"19-20岁",title:"技能中心开始选拔长期训练队",type:"main",
      text:"入队以后会多很多训练和比赛机会，也意味着周末和晚上经常泡在技能中心。",
      choices:[
        {text:"参加选拔",sub:"动手和临床表达会快速成长。",effects:{knowledge:6,reputation:4,energy:-5},chance:{p:.56,bonusBy:["dexterity","communication"],success:{reputation:5,mental:4},fail:{mental:-2},successFlags:["skillTeam"],failFlags:["skillTeamMiss"]},next:"ug_opportunity_fair"},
        {text:"不进队，自己稳定练习",sub:"少一点竞赛，多一点自由。",effects:{knowledge:5,mental:3},talentEffects:{dexterity:2},flags:["selfTraining"],next:"ug_opportunity_fair"},
        {text:"临床之外补一点科研",sub:"避免以后升学时科研空白。",effects:{knowledge:4,research:4,energy:-4},route:"本科·临床+科研",flags:["clinicalResearchMix"],next:"ug_opportunity_fair"}
      ]
    },

    ug_balanced_route:{
      stage:"本科 · 均衡线",year:"19-20岁",title:"每一项都不错，但没有一项特别突出",type:"main",
      text:"你的成绩、科研、技能都在中上。问题是，真正的稀缺机会往往要求你在某一项上更突出。",
      choices:[
        {text:"后半程加码科研",sub:"为保研和升学制造硬成果。",effects:{research:7,energy:-4},flags:["lateResearchPush"],next:"ug_opportunity_fair"},
        {text:"后半程加码临床技能",sub:"把优势押在动手和病例上。",effects:{knowledge:6,reputation:3,energy:-4},talentEffects:{dexterity:1},flags:["lateClinicalPush"],next:"ug_opportunity_fair"},
        {text:"继续均衡，保留所有可能",sub:"风险低，但竞争顶级机会时可能不够尖。",effects:{knowledge:3,research:3,mental:2},flags:["keepBalanced"],next:"ug_opportunity_fair"}
      ]
    },

    ug_global_route:{
      stage:"本科 · 国际线",year:"19-20岁",title:"英语成绩够了，但真正的国际项目还要看科研和推荐",type:"main",
      text:"你发现“想出国”只是第一步。CV、推荐信、项目经历和面试表达都需要时间积累。",
      choices:[
        {text:"找国际合作课题组做项目",sub:"为后面的交流和暑研准备推荐信。",effects:{research:6,energy:-4,reputation:2},talentEffects:{english:2,researchSense:1},flags:["globalLab"],next:"ug_opportunity_fair"},
        {text:"主攻英语和面试表达",sub:"提高交流项目成功率。",effects:{knowledge:3,mental:-2},talentEffects:{english:5,communication:2},flags:["globalPrep"],next:"ug_opportunity_fair"},
        {text:"改回国内升学路线",sub:"减少不确定性。",effects:{knowledge:5,mental:3},route:"本科·国内升学",flags:["returnDomestic"],next:"ug_opportunity_fair"}
      ]
    },

    ug_opportunity_fair:{
      stage:"🎯 竞争机会 · 本科",year:"20岁",title:"四个机会同时开放，但你只能认真申请一个",type:"opportunity",exclusiveGroup:"ug_opportunity_20",
      warning:"本轮只能申请一个。提交后无论成功还是失败，其他三个机会都会关闭。",
      text:"时间和精力不允许你同时准备四套材料。你必须押一个最适合自己的机会。",
      choices:[
        {text:"申请国家/校级高额奖学金",sub:"成功率看知识、声望与综合表现。成功：金钱与声望提升。",effects:{energy:-2},chance:{p:.42,bonusBy:["knowledge","reputation"],success:{money:12,reputation:7,mental:5},fail:{mental:-2},successFlags:["majorScholarship"],failFlags:["scholarshipFailed"]},application:"奖学金",next:"clinical_exposure"},
        {text:"申请海外暑研 / 交换",sub:"成功率看英语、沟通和学校国际机会。",effects:{energy:-3,money:-2},chance:{p:.34,bonusBy:["english","communication"],success:{research:8,reputation:7,mental:6},fail:{mental:-3,money:-1},successFlags:["ugExchange"],failFlags:["ugExchangeFailed"]},application:"海外暑研/交换",next:"clinical_exposure"},
        {text:"申请本科生科研项目负责人",sub:"成功率看科研直觉、已有科研与知识。",effects:{energy:-4},chance:{p:.48,bonusBy:["researchSense","research","knowledge"],success:{research:11,reputation:5,mental:4},fail:{mental:-3},successFlags:["studentPI"],failFlags:["studentPIFailed"]},application:"本科生科研项目",next:"clinical_exposure"},
        {text:"申请临床技能竞赛队",sub:"成功率看动手、知识与抗压。",effects:{energy:-4},chance:{p:.46,bonusBy:["dexterity","knowledge","resilience"],success:{knowledge:8,reputation:7,mental:4},fail:{mental:-2},successFlags:["clinicalCompetition"],failFlags:["clinicalCompetitionFailed"]},application:"临床技能竞赛",next:"clinical_exposure"}
      ]
    },

    clinical_exposure:{
      stage:"本科 · 临床阶段",year:"21-22岁",title:"真正进入病房以后，你对医学的想象被改写了",type:"main",
      text:"患者不会按教材顺序生病，老师也不会把每个答案都提前告诉你。你开始理解临床判断、沟通和责任。",
      choices:[
        {text:"主动跟病例，抢每一次问诊机会",sub:"临床能力提升快，体力消耗也快。",effects:{knowledge:8,reputation:5,energy:-6},talentEffects:{communication:1},flags:["caseChaser"],next:"key_graduation"},
        {text:"保持稳健，先把每个病例复盘清楚",sub:"成长慢一点，但基础更扎实。",effects:{knowledge:7,mental:2},flags:["reflection"],next:"key_graduation"},
        {text:"发现自己更喜欢科研和数据",sub:"临床经历反而确认了科研方向。",effects:{research:6,knowledge:3},flags:["clinicalToResearch"],next:"key_graduation"}
      ]
    },

    key_graduation:{
      stage:"⚠️ 关键节点 · 本科毕业",year:"23岁",title:"五年结束：继续读、直接工作，还是去更远的地方？",type:"key",critical:true,
      warning:"这是第一场真正改变职业结构的选择。读研、直接就业规培、海外项目会进入完全不同的事件链；后面不会自动汇回同一条路。",
      text:"毕业证到手以后，你第一次真正面对路径选择。学校平台、成绩、科研、英语和家庭经济都会影响哪些选项值得赌。",
      choices:[
        {text:"申请保研 / 推免",sub:"适合成绩和综合表现较强的人；成功后可选临床专硕、学硕或部分直博路线。",effects:{energy:-3},requires:{stats:{knowledge:62}},chance:{p:.52,bonusBy:["knowledge","research","reputation"],success:{mental:7,reputation:5},fail:{mental:-5},successFlags:["recommended"],failFlags:["recommendFailed"]},successNext:"recommended_postgrad",failNext:"grad_exam_route",route:"升学·推免申请"},
        {text:"参加全国硕士研究生考试",sub:"可以通过一次考试重新选择平台和城市。",effects:{knowledge:5,energy:-7,mental:-5},flags:["gradExam"],route:"升学·考研",next:"grad_exam_route"},
        {text:"直接就业 / 进入规培",sub:"不读研，先选规培方向，再进入住院医师规范化培训。",effects:{money:5,reputation:2},flags:["noMaster","directResident"],route:"临床·本科后直接规培",next:"specialty_select_resident"},
        {text:"申请海外研究型项目",sub:"高英语/科研更有优势；费用和不确定性更高。",effects:{money:-5,energy:-4},requires:{talents:{english:58}},chance:{p:.36,bonusBy:["english","researchSense","research"],success:{reputation:7,research:7,mental:6},fail:{money:-3,mental:-5},successFlags:["overseasOffer"],failFlags:["overseasRejected"]},successNext:"overseas_postgrad",failNext:"grad_exam_route",route:"升学·海外申请"}
      ]
    },

    recommended_postgrad:{
      stage:"⚠️ 关键节点 · 推免去向",year:"23岁",title:"你拿到了继续升学的门票，但还要选培养类型",type:"key",critical:true,
      warning:"临床专硕、学硕、直博会改变是否同步规培、科研强度、毕业时间和之后是否容易继续读博。",
      text:"“读研”并不是一条路。不同培养类型会把未来三到五年的生活切成完全不同的形状。",
      choices:[
        {text:"临床医学专业型硕士",sub:"先选择专科方向；游戏中按专硕与规培并轨推进，临床任务重、科研时间更碎。",effects:{knowledge:6,reputation:3,energy:-4},flags:["clinicalMaster","integratedResidency"],route:"研究生·临床专硕（并轨规培）",next:"specialty_select_clinical_master"},
        {text:"学术型硕士",sub:"先选择研究学科；以科研训练为主，不自动完成规培。",effects:{research:8,mental:-2},flags:["academicMaster"],route:"研究生·学硕（科研训练）",next:"specialty_select_academic_master"},
        {text:"尝试直博 / 长学制科研路线",sub:"科研基础较强时可冲；直博先选学科方向，但不等于已经完成规培。",effects:{research:6,energy:-3},requires:{stats:{research:35}},chance:{p:.45,bonusBy:["research","researchSense","reputation"],success:{research:6,reputation:6,mental:5},fail:{mental:-4},successFlags:["directPhdOffer"],failFlags:["directPhdMiss"]},successNext:"specialty_select_direct_phd",failNext:"specialty_select_academic_master",route:"博士·直博申请"}
      ]
    },

    grad_exam_route:{
      stage:"升学 · 考研",year:"23岁",title:"目标院校越高，成功率越低，但平台跃迁越大",type:"main",
      text:"你可以稳妥，也可以赌一次更大的跃迁。不同本科平台在这里并不是终点。",
      choices:[
        {text:"冲顶级医学平台",sub:"高收益，高失败率。",effects:{knowledge:7,energy:-9,mental:-7},chance:{p:.32,bonusBy:["knowledge","resilience","english"],success:{reputation:10,mental:8},fail:{mental:-9},successFlags:["platformJumpBig"],failFlags:["examFailed"]},successNext:"recommended_postgrad",failNext:"exam_fail_choice",route:"考研·冲刺顶级平台"},
        {text:"报强势医学平台",sub:"风险与收益相对平衡。",effects:{knowledge:6,energy:-7,mental:-5},chance:{p:.54,bonusBy:["knowledge","resilience"],success:{reputation:6,mental:6},fail:{mental:-7},successFlags:["platformJump"],failFlags:["examFailed"]},successNext:"recommended_postgrad",failNext:"exam_fail_choice",route:"考研·稳中求进"},
        {text:"优先确保上岸",sub:"平台提升有限，但路径更稳。",effects:{knowledge:5,energy:-5,mental:-3},chance:{p:.72,bonusBy:["knowledge"],success:{mental:6,reputation:3},fail:{mental:-6},successFlags:["masterOffer"],failFlags:["examFailed"]},successNext:"recommended_postgrad",failNext:"exam_fail_choice",route:"考研·求稳"}
      ]
    },

    exam_fail_choice:{
      stage:"⚠️ 关键节点 · 考研失利",year:"23-24岁",title:"没有上岸。下一年怎么走？",type:"key",critical:true,
      warning:"二战会损失一年时间和心理资源；直接就业会关闭当前全日制硕士路线，但你会更早进入临床。",
      text:"成绩出来了。人生没有按照计划推进，但你仍然有选择。",
      choices:[
        {text:"二战，再来一次",sub:"再付出一年，下一次成功率略提高；再次失败后仍可直接规培。",effects:{mental:-7,money:-4,knowledge:5},chance:{p:.62,bonusBy:["knowledge","resilience"],success:{mental:8,reputation:4},fail:{mental:-10},successFlags:["secondTrySuccess"],failFlags:["secondTryFail"]},successNext:"recommended_postgrad",failNext:"specialty_select_resident",route:"升学·二战"},
        {text:"接受现实，直接进入规培/就业",sub:"先选规培科室，不再把下一年押在考研上。",effects:{money:4,mental:3},flags:["noMaster","directResident"],route:"临床·考研后直接规培",next:"specialty_select_resident"}
      ]
    },

    clinical_master:{
      stage:"研究生 · 临床专硕 / 并轨规培",year:"24-26岁",title:"白天轮转，晚上论文，周末还要准备考核",type:"main",
      text:"这条路线把专业学位研究生培养和住院医师规范化培训压在同一阶段。你一边完成科室轮转与临床训练，一边还要满足研究生毕业要求。",
      choices:[
        {text:"临床优先，论文够毕业即可",sub:"基本功更强，学术积累较慢。",effects:{knowledge:9,reputation:5,energy:-7,research:2},flags:["clinicalMasterClinical"],next:"master_opportunity_round"},
        {text:"硬挤时间做科研",sub:"临床和科研两头都压。",effects:{knowledge:5,research:9,energy:-11,mental:-6},flags:["clinicalMasterResearch"],next:"master_opportunity_round"},
        {text:"寻找临床数据型课题",sub:"尽量把临床和科研合在一起。",effects:{knowledge:6,research:7,energy:-7},flags:["clinicalDataResearch"],next:"master_opportunity_round"}
      ]
    },

    clinical_master_finish:{
      stage:"临床专硕毕业 · 并轨规培结业",year:"26-27岁",title:"硕士毕业和规培结业几乎同时来到",type:"main",
      text:"你没有再从头进入一遍规培。接下来真正的问题是：拿着专硕学历和已经完成的并轨临床训练，去哪里开始第一份正式工作？",
      choices:[
        {text:"进入正式求职阶段",sub:"开始比较医院平台、专科机会和生活城市。",effects:{knowledge:3,reputation:4,mental:3},flags:["integratedResidencyFinished"],next:"job_choice"}
      ]
    },

    academic_master:{
      stage:"研究生 · 学硕",year:"24-26岁",title:"你的生活开始按实验、数据和投稿节奏运转",type:"main",
      text:"学硕给了你更系统的科研训练，但临床熟练度不会自动增长。你开始真正考虑是否要继续读博。",
      choices:[
        {text:"冲高质量论文，为博士申请铺路",sub:"学术路线加速。",effects:{research:11,energy:-8,mental:-5},flags:["phdPrep"],next:"master_opportunity_round"},
        {text:"科研为主，同时保持临床联系",sub:"给未来回临床留一扇门。",effects:{research:7,knowledge:5,energy:-7},flags:["keepClinical"],next:"master_opportunity_round"},
        {text:"发现自己不想继续科研",sub:"准备毕业后转回临床训练。",effects:{knowledge:4,mental:6,research:-2},flags:["leaveAcademic"],next:"master_opportunity_round"}
      ]
    },

    overseas_postgrad:{
      stage:"海外升学",year:"24-26岁",title:"陌生体系、英文环境和新的科研规则",type:"main",
      text:"你得重新适应沟通、课程、科研节奏和生活成本。国际经历会打开一些门，也会让回国路径更复杂。",
      choices:[
        {text:"全力做研究，争取继续海外博士",sub:"科研上限更高，时间成本也更大。",effects:{research:10,energy:-7,money:-6},talentEffects:{english:3},flags:["overseasResearch"],next:"master_opportunity_round"},
        {text:"把重点放在国际临床/转化项目",sub:"尽量保持和临床问题的连接。",effects:{research:6,knowledge:6,reputation:4,money:-5},flags:["globalClinical"],next:"master_opportunity_round"},
        {text:"完成项目后计划回国",sub:"提前准备回国衔接。",effects:{knowledge:4,reputation:3,mental:3},flags:["returnPlan"],next:"master_opportunity_round"}
      ]
    },

    direct_phd:{
      stage:"博士 · 直博",year:"24-28岁",title:"你跳过了硕士终点，直接进入一场更长的科研耐力赛",type:"main",
      text:"直博给你时间做更完整的问题，也意味着几年里“毕业”会变成一个越来越具体的压力词。",
      choices:[
        {text:"押高风险高创新课题",sub:"如果成功，产出上限很高。",effects:{research:12,energy:-9,mental:-7},flags:["highRiskPhd"],next:"phd_crisis"},
        {text:"选择可控、连续的课题线",sub:"更稳妥地积累成果。",effects:{research:9,mental:-2,energy:-6},flags:["steadyPhd"],next:"phd_crisis"}
      ]
    },

    master_opportunity_round:{
      stage:"🎯 竞争机会 · 研究生",year:"25岁",title:"联合培养、奖学金、重点课题：你仍然只能押一个",type:"opportunity",exclusiveGroup:"master_opportunity",
      warning:"只能申请一个。成功与失败都会写入履历，并影响后面的博士/就业选项。",
      text:"你已经没有本科时那么多可试错的时间。每一个机会都可能改变下一阶段。",
      choices:[
        {text:"申请研究生国家奖学金",sub:"看科研、知识和综合声望。",effects:{energy:-2},chance:{p:.40,bonusBy:["research","knowledge","reputation"],success:{money:14,reputation:8,mental:5},fail:{mental:-2},successFlags:["masterScholarship"],failFlags:["masterScholarshipFail"]},application:"研究生奖学金",next:"phd_decision"},
        {text:"申请海外联合培养 / 交换",sub:"看英语、科研与推荐。",effects:{money:-3,energy:-3},chance:{p:.34,bonusBy:["english","research","reputation"],success:{research:9,reputation:8,mental:5},fail:{money:-2,mental:-3},successFlags:["jointTraining"],failFlags:["jointTrainingFail"]},application:"联合培养",next:"phd_decision"},
        {text:"申请重点科研项目核心成员",sub:"看科研直觉、已有研究和抗压。",effects:{energy:-5},chance:{p:.46,bonusBy:["researchSense","research","resilience"],success:{research:12,reputation:6},fail:{mental:-3},successFlags:["keyProject"],failFlags:["keyProjectFail"]},application:"重点科研项目",next:"phd_decision"},
        {text:"申请临床优秀学员 / 技能机会",sub:"更适合临床专硕，回报偏临床声望。",effects:{energy:-4},chance:{p:.48,bonusBy:["knowledge","dexterity","communication"],success:{knowledge:9,reputation:8},fail:{mental:-2},successFlags:["excellentResident"],failFlags:["excellentResidentFail"]},application:"临床优秀学员",next:"phd_decision"}
      ]
    },

    phd_decision:{
      stage:"⚠️ 关键节点 · 是否读博",year:"26-27岁",title:"硕士快结束了：读博，还是结束学生身份？",type:"key",critical:true,
      warning:"博士不是“硕士多读几年”。它会显著推迟稳定收入，但打开更高学术与部分高平台岗位；不读博会更早进入临床和职业晋升。",
      text:"导师、同学、家人给你的建议各不相同。真正要承担后果的是你自己。",
      choices:[
        {text:"国内读博",sub:"继续科研训练，未来学术和高平台岗位更有空间。",effects:{research:7,energy:-4,mental:-3},requires:{stats:{research:30}},flags:["phdDomestic"],route:"博士·国内",next:"phd_year1"},
        {text:"申请海外博士",sub:"英语、科研和推荐要求更高；成功率不确定。",effects:{money:-5,energy:-4},requires:{talents:{english:60}},chance:{p:.38,bonusBy:["english","researchSense","research","reputation"],success:{reputation:8,research:6,mental:6},fail:{mental:-5,money:-2},successFlags:["phdOverseas"],failFlags:["phdOverseasFail"]},successNext:"phd_year1",failNext:"resident_entry",route:"博士·海外申请"},
        {text:"不读博：临床专硕毕业直接求职",sub:"你已经在专硕阶段完成并轨规培，不再重复从规培第一年开始。",effects:{money:5,mental:5},showIfFlags:["clinicalMaster"],flags:["noPhd"],route:"临床·专硕毕业就业",next:"clinical_master_finish"},
        {text:"不读博：学硕毕业后回临床规培",sub:"学硕阶段没有自动完成规培；如果要继续临床，需要进入规范化培训。",effects:{money:3,mental:4},showIfFlags:["academicMaster"],flags:["noPhd"],route:"临床·学硕后规培",next:"resident_entry"},
        {text:"不读博：海外项目结束后回国衔接临床",sub:"需要重新衔接本地临床培训与岗位路径。",effects:{money:3,mental:4},showIfFlags:["overseasOffer"],flags:["noPhd"],route:"临床·海外项目后衔接",next:"specialty_select_resident"}
      ]
    },

    phd_year1:{
      stage:"博士阶段",year:"27-30岁",title:"博士第一年，你的课题终于属于你自己",type:"main",
      text:"没人再给你一张标准答案。课题设计、数据质量、论文和毕业节点开始同时压过来。",
      choices:[
        {text:"做难但真正有价值的问题",sub:"创新高，风险也高。",effects:{research:10,energy:-8,mental:-6},flags:["hardQuestion"],next:"phd_crisis"},
        {text:"优先保证可毕业的成果线",sub:"降低风险，牺牲一部分野心。",effects:{research:7,mental:2,energy:-5},flags:["graduationFirst"],next:"phd_crisis"},
        {text:"建立合作网络，多中心/交叉做",sub:"沟通成本高，但资源更广。",effects:{research:8,reputation:6,energy:-7},flags:["phdCollab"],next:"phd_crisis"}
      ]
    },

    phd_crisis:{
      stage:"博士阶段",year:"28-31岁",title:"实验失败、论文拒稿、毕业时间开始逼近",type:"main",
      text:"博士最危险的并不是一次失败，而是连续失败以后，你还要决定要不要继续。",
      choices:[
        {text:"重构课题，硬着头皮继续",sub:"科研韧性会被真正训练出来。",effects:{research:8,energy:-8,mental:-7},talentEffects:{resilience:3,researchSense:2},flags:["phdResilience"],next:"phd_global_round"},
        {text:"缩小问题，优先毕业",sub:"降低科研野心，换确定性。",effects:{research:4,mental:4,energy:-3},flags:["phdScopeDown"],next:"phd_global_round"},
        {text:"和导师谈清楚，调整方向",sub:"沟通可能改变整个博士后半程。",effects:{reputation:3,mental:-2},chance:{p:.58,bonusBy:["communication","reputation"],success:{research:5,mental:7},fail:{mental:-5},successFlags:["mentorReset"],failFlags:["mentorConflict"]},next:"phd_global_round"}
      ]
    },

    phd_global_round:{
      stage:"🎯 竞争机会 · 博士",year:"29-31岁",title:"博士期间的一次大机会：只能选一个方向投入",type:"opportunity",exclusiveGroup:"phd_opportunity",
      warning:"联合培养、国际会议、重点项目、留组冲论文，你只能把主要资源押在一个上。",
      text:"这个选择未必决定毕业，但会显著改变博士毕业后的履历结构。",
      choices:[
        {text:"申请海外联合培养一年",sub:"英语和科研要求高，成功后国际经历明显增强。",effects:{money:-4,energy:-3},chance:{p:.36,bonusBy:["english","research","reputation"],success:{research:9,reputation:9,mental:5},fail:{mental:-4},successFlags:["phdJoint"],failFlags:["phdJointFail"]},application:"博士联合培养",next:"phd_graduation"},
        {text:"冲一次重要国际会议口头报告",sub:"成功率看论文质量、英语和表达。",effects:{energy:-3},chance:{p:.40,bonusBy:["research","english","communication"],success:{reputation:9,research:5},fail:{mental:-2},successFlags:["oralPresentation"],failFlags:["oralPresentationFail"]},application:"国际会议口头报告",next:"phd_graduation"},
        {text:"加入国家级/大型重点项目",sub:"团队资源强，但个人自主性更低。",effects:{energy:-5},chance:{p:.48,bonusBy:["research","reputation"],success:{research:10,reputation:7},fail:{mental:-3},successFlags:["phdKeyProject"],failFlags:["phdKeyProjectFail"]},application:"博士重点项目",next:"phd_graduation"},
        {text:"不分心，全部资源压毕业论文",sub:"放弃额外机会，换毕业确定性。",effects:{research:7,mental:4},flags:["thesisFirst"],application:"毕业优先",next:"phd_graduation"}
      ]
    },

    phd_graduation:{
      stage:"博士毕业",year:"30-32岁",title:"你终于不再需要在姓名后面写“博士研究生”",type:"main",
      text:"毕业不是结束，而是你要决定把博士训练带回临床、留在学术系统，还是继续海外博后。",
      choices:[
        {text:"回医院，走临床+科研双线",sub:"需要重新把临床节奏接起来。",effects:{knowledge:5,research:5,reputation:4},flags:["phdToHospital"],route:"职业·博士回医院",next:"resident_entry"},
        {text:"继续博后 / 科研岗",sub:"学术积累继续，但临床路径进一步后移。",effects:{research:10,reputation:5,money:-2},flags:["postdoc"],route:"职业·博后科研",next:"young_attending"},
        {text:"海外博后再看",sub:"国际学术线继续延长。",effects:{research:8,reputation:6,money:-4},requires:{talents:{english:60}},flags:["overseasPostdoc"],route:"职业·海外博后",next:"young_attending"}
      ]
    },

    resident_entry:{
      stage:"规培 / 住院医师",year:"24-31岁",title:"真正进入规培：你开始按值班表生活",type:"main",
      text:"有没有硕士、有没有博士，会影响你进入这个阶段的年龄和履历，但夜班本身不会因此消失。",
      choices:[
        {text:"每个轮转科室都认真学",sub:"基本功最稳，体力消耗最大。",effects:{knowledge:9,reputation:5,energy:-8},flags:["solidResident"],next:"resident_night"},
        {text:"在已选科室争取更多核心轮转 / 操作机会",sub:"你已经完成择科，现在要把方向转化成真正的病例、操作与导师资源。",effects:{knowledge:6,reputation:6,research:2,energy:-3},flags:["specialtyFocus"],next:"resident_night"},
        {text:"优先保持可持续状态",sub:"避免过早 burnout。",effects:{mental:8,energy:5,knowledge:3},flags:["selfCare"],next:"resident_night"}
      ]
    },

    resident_night:{
      stage:"规培 / 住院医师",year:"25-32岁",title:"凌晨 3:17，急诊电话又响了",type:"main",
      text:"病人不会因为你明天还有考试就少来一个。你第一次感到职业责任和个人极限正面碰撞。",
      choices:[
        {text:"先处理病人，科研和睡眠都往后排",sub:"责任感提升，消耗很大。",effects:{knowledge:7,reputation:7,energy:-13,mental:-7},flags:["dutyFirst"],next:"resident_exam"},
        {text:"合理呼叫二线和团队协作",sub:"独立不是一个人扛所有事。",effects:{knowledge:5,reputation:5,energy:-7,mental:-2},flags:["teamResident"],next:"resident_exam"},
        {text:"开始认真评估自己是否适合高强度科室",sub:"这会影响之后择科。",effects:{mental:4,knowledge:3},flags:["specialtyReconsider"],next:"resident_exam"}
      ]
    },

    resident_exam:{
      stage:"规培结业 / 执业资格",year:"26-33岁",title:"考试、考核和工作同时压过来",type:"main",
      text:"你又一次回到“白天工作、晚上复习”的状态。",
      choices:[
        {text:"集中复习，争取一次通过",sub:"短期很累，但失败会拖慢后续。",effects:{knowledge:7,energy:-6,mental:-3},chance:{p:.70,bonusBy:["knowledge","resilience"],success:{reputation:5,mental:5},fail:{mental:-7},successFlags:["residentPassed"],failFlags:["residentExamFail"]},next:"job_choice"},
        {text:"边工作边准备",sub:"风险略高，但少影响轮转。",effects:{knowledge:5,energy:-8},chance:{p:.58,bonusBy:["knowledge","resilience"],success:{reputation:4},fail:{mental:-8},successFlags:["residentPassed"],failFlags:["residentExamFail"]},next:"job_choice"}
      ]
    },

    job_choice:{
      stage:"⚠️ 关键节点 · 第一份正式工作",year:"27-33岁",title:"留大平台、去区域中心，还是换一个生活方式？",type:"key",critical:true,
      warning:"这会影响病例量、科研资源、收入压力、晋升竞争和城市生活成本。",
      text:"你终于从“被培养的人”变成真正要对职业去向负责的人。",
      choices:[
        {text:"冲顶级三甲 / 大学附属医院",sub:"资源和竞争都最高。博士、科研和强履历更占优势。",effects:{reputation:7,research:5,mental:-6,energy:-5},chance:{p:.44,bonusBy:["reputation","research","knowledge"],success:{reputation:8,mental:5},fail:{mental:-5},successFlags:["topHospital"],failFlags:["topHospitalMiss"]},successNext:"young_attending",failNext:"young_attending",route:"职业·大平台医院"},
        {text:"去区域医疗中心",sub:"临床机会多，生活与竞争相对平衡。",effects:{knowledge:6,reputation:5,money:4,mental:-2},flags:["regionalHospital"],route:"职业·区域中心",next:"young_attending"},
        {text:"选择生活边界更好的岗位",sub:"资源可能少一些，但长期可持续。",effects:{mental:9,energy:6,money:3,research:-2},flags:["lifestyleJob"],route:"职业·生活优先",next:"young_attending"}
      ]
    },

    young_attending:{
      stage:"主治前后",year:"30-36岁",title:"临床、论文、家庭、职称第一次同时追着你跑",type:"main",
      text:"你已经不是学生，但学习并没有结束。现在每一次选择都会开始影响职称、收入和家庭关系。",
      choices:[
        {text:"冲科研和基金",sub:"为副高和学术平台积累。",effects:{research:10,reputation:5,energy:-9,mental:-6},flags:["researchTrack"],next:"career_opportunity_round"},
        {text:"把临床做成核心竞争力",sub:"病例、技术和患者口碑优先。",effects:{knowledge:10,reputation:8,energy:-8},flags:["clinicalTrack"],next:"career_opportunity_round"},
        {text:"明确设置生活边界",sub:"晋升可能慢一点，但希望走得更久。",effects:{mental:10,energy:7,reputation:2,research:-2},flags:["lifeTrack"],next:"career_opportunity_round"}
      ]
    },

    career_opportunity_round:{
      stage:"🎯 竞争机会 · 青年医生",year:"32-36岁",title:"青年基金、海外访问、人才项目、临床进修：只能重点冲一个",type:"opportunity",exclusiveGroup:"career_opportunity",
      warning:"你只有有限的时间和支持。几个项目都报名只会把每个材料都做差，所以本轮只能押一个。",
      text:"成功会显著改变后续晋升路线；失败也可能让你重新调整方向。",
      choices:[
        {text:"冲青年科研基金",sub:"科研和前期成果最重要。",effects:{energy:-6},chance:{p:.36,bonusBy:["research","researchSense","reputation"],success:{research:12,reputation:8,mental:6},fail:{mental:-5},successFlags:["youthGrant"],failFlags:["youthGrantFail"]},application:"青年基金",next:"key_midcareer"},
        {text:"申请海外访问学者 / 进修",sub:"英语和履历要求高。",effects:{money:-4,energy:-4},chance:{p:.34,bonusBy:["english","reputation","research"],success:{reputation:9,research:7,mental:5},fail:{mental:-3,money:-2},successFlags:["visitingScholar"],failFlags:["visitingScholarFail"]},application:"海外访问",next:"key_midcareer"},
        {text:"申请高水平临床进修",sub:"更偏临床技术和专科平台。",effects:{energy:-5},chance:{p:.48,bonusBy:["knowledge","dexterity","reputation"],success:{knowledge:10,reputation:8},fail:{mental:-2},successFlags:["clinicalFellowship"],failFlags:["clinicalFellowshipFail"]},application:"临床进修",next:"key_midcareer"},
        {text:"申报青年人才项目",sub:"综合要求最高，成功回报也大。",effects:{energy:-6,mental:-2},chance:{p:.26,bonusBy:["research","reputation","knowledge"],success:{research:10,reputation:12,money:6},fail:{mental:-5},successFlags:["youngTalent"],failFlags:["youngTalentFail"]},application:"青年人才项目",next:"key_midcareer"}
      ]
    },

    key_midcareer:{
      stage:"⚠️ 关键节点 · 中期职业",year:"36-42岁",title:"你的职业主航道终于必须确定",type:"key",critical:true,
      warning:"从这里开始，主任管理、临床专家、学术PI三条路线会使用不同的资源和晋升条件。",
      text:"前面十几年的学历、医院、科研、机会和生活选择都开始汇总。你不可能同时把三条路都走到极致。",
      choices:[
        {text:"科室管理 / 主任路线",sub:"需要临床、声望、协调和资源整合。",effects:{reputation:8,mental:-4},flags:["directorTrack"],route:"中期·管理主任",next:"promotion"},
        {text:"一线临床专家路线",sub:"技术、病例和口碑是核心。",effects:{knowledge:9,reputation:6,energy:-5},flags:["expertTrack"],route:"中期·临床专家",next:"promotion"},
        {text:"学术PI / 学科带头人路线",sub:"科研、基金和团队建设成为主线。",effects:{research:11,reputation:6,energy:-7},flags:["piTrack"],route:"中期·学术PI",next:"promotion"}
      ]
    },

    promotion:{
      stage:"高级职称",year:"40-48岁",title:"副高、正高与岗位竞争开始叠加",type:"main",
      text:"论文只是材料的一部分。临床量、教学、基金、团队、同行评价和医院政策一起决定你能走多快。",
      choices:[
        {text:"集中资源冲评审",sub:"短期压力很大。",effects:{energy:-8,mental:-5},chance:{p:.48,bonusBy:["knowledge","research","reputation"],success:{reputation:12,money:8,mental:5},fail:{mental:-8},successFlags:["promotionSuccess"],failFlags:["promotionDelayed"]},next:"director"},
        {text:"晚一点评，先补短板",sub:"延缓晋升，降低失败风险。",effects:{knowledge:4,research:4,mental:3},flags:["promotionDelayed"],next:"director"}
      ]
    },

    director:{
      stage:"职业成熟期",year:"48-58岁",title:"年轻医生开始叫你“老师”",type:"main",
      text:"你已经走过了从高考到医学职业的大部分训练。现在你影响的不只是患者，也包括下一代医生。",
      choices:[
        {text:"带团队、做管理和学科建设",sub:"适合主任/管理路线。",effects:{reputation:12,research:4,mental:-4},flags:["director"],next:"final"},
        {text:"继续守在复杂病例一线",sub:"适合临床专家路线。",effects:{knowledge:12,reputation:10,mental:2},flags:["expert"],next:"final"},
        {text:"继续做科研和学术共同体",sub:"适合PI/学术路线。",effects:{research:14,reputation:8,energy:-6},flags:["academicianTrack"],next:"final"}
      ]
    },

    final:{
      stage:"终章",year:"60岁+",title:"回看这条医学人生",type:"main",
      text:"真正决定结局的不是某一道选择，而是你在一次次关键节点上持续选择了什么。",
      choices:[{text:"查看人生结局",sub:"看看这条时间线最终留下了什么。",effects:{},next:"__END__"}]
    }
  }
};