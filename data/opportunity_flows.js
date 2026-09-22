window.OPPORTUNITY_DATA = {
  byApplication: {
    "奖学金":"ug_scholarship",
    "海外暑研/交换":"ug_exchange",
    "本科生科研项目":"ug_student_project",
    "临床技能竞赛":"ug_skill_competition",
    "研究生奖学金":"master_scholarship",
    "联合培养":"master_joint",
    "重点科研项目":"master_key_project",
    "临床优秀学员":"master_clinical_honor",
    "博士联合培养":"phd_joint",
    "国际会议口头报告":"phd_oral",
    "博士重点项目":"phd_key_project",
    "青年基金":"career_youth_grant",
    "海外访问":"career_visit",
    "临床进修":"career_fellowship",
    "青年人才项目":"career_talent"
  },

  flows: {
    ug_scholarship:{
      name:"本科奖学金申请",returnNext:"clinical_exposure",start:"strategy",
      steps:{
        strategy:{stage:"申请 1/3 · 本科奖学金",year:"20岁",title:"评审更看重哪一张牌？",type:"application",
          text:"成绩、科研、志愿服务和学生工作都能写进材料，但你没有时间把每一项都补到顶。",
          choices:[
            {text:"主打成绩排名",sub:"把最后时间继续压在课程成绩上。",effects:{knowledge:4,energy:-3},flags:["scholarshipGrade"],nextStep:"materials"},
            {text:"主打科研与竞赛",sub:"把项目成果整理成核心材料。",effects:{research:4,energy:-3},flags:["scholarshipResearch"],nextStep:"materials"},
            {text:"主打综合表现",sub:"突出志愿、学生工作与团队经历。",effects:{reputation:4,energy:-2},talentEffects:{communication:1},flags:["scholarshipAllRound"],nextStep:"materials"}
          ]},
        materials:{stage:"申请 2/3 · 本科奖学金",year:"20岁",title:"最后一晚，你发现材料还可以继续改",type:"application",
          text:"再熬一晚可能让材料更完整，也可能让你第二天状态变差。",
          choices:[
            {text:"再精修一遍",sub:"材料更完整，消耗更多体力。",effects:{energy:-4,reputation:1},flags:["applicationPolished"],nextStep:"review"},
            {text:"到点提交，早点睡",sub:"不追求最后 5% 的完美。",effects:{mental:3,energy:2},flags:["applicationBalanced"],nextStep:"review"}
          ]},
        review:{stage:"申请 3/3 · 本科奖学金",year:"20岁",title:"评审结果即将公布",type:"application",
          text:"你的材料已经提交。现在成绩、科研、声望和一点点运气一起进入评审。",
          choices:[
            {text:"查看评审结果",sub:"综合积累会影响最终概率。",effects:{},chance:{p:.36,bonusBy:["knowledge","research","reputation"],success:{money:10,reputation:5,mental:4},fail:{mental:-2},successFlags:["majorScholarship"],failFlags:["scholarshipFailed"]},successStep:"success",failStep:"fail"}
          ]},
        success:{stage:"结果 · 本科奖学金",year:"20岁",title:"你拿到了奖学金",type:"resultSuccess",
          text:"名单里真的有你的名字。除了钱，这也是一次对前两年积累的确认。",
          choices:[
            {text:"把一部分钱留给未来考试和申请",sub:"增加经济缓冲。",effects:{money:5,mental:2},endFlow:true},
            {text:"把资源投到科研和课程",sub:"继续给履历加码。",effects:{research:4,knowledge:2,money:-2},endFlow:true},
            {text:"奖励自己一次旅行",sub:"人生不能只有履历。",effects:{mental:7,energy:4,money:-3},endFlow:true}
          ]},
        fail:{stage:"结果 · 本科奖学金",year:"20岁",title:"名单里没有你的名字",type:"resultFail",
          text:"你认真准备了，但这次没拿到。失败并不会把材料准备和经验全部清零。",
          choices:[
            {text:"去看评审反馈，明年再来",sub:"把失败变成下一次的信息。",effects:{knowledge:2,mental:-1},talentEffects:{resilience:2},flags:["scholarshipRetryMindset"],endFlow:true},
            {text:"算了，把精力转到其他机会",sub:"及时止损。",effects:{mental:4,energy:2},flags:["scholarshipMoveOn"],endFlow:true}
          ]}
      }
    },

    ug_exchange:{
      name:"本科海外暑研 / 交换",returnNext:"clinical_exposure",start:"target",
      steps:{
        target:{stage:"申请 1/4 · 海外研学",year:"20岁",title:"你到底想申请哪一种海外项目？",type:"application",
          text:"暑研、学期交换和临床观察看起来都叫“海外经历”，但评审逻辑和回来后的收益完全不同。",
          choices:[
            {text:"实验室暑研",sub:"科研与英语最重要，适合未来科研/读博。",effects:{research:2,energy:-2},flags:["exchangeLab"],nextStep:"recommendation"},
            {text:"一学期课程交换",sub:"更看成绩、英语与综合适应能力。",effects:{knowledge:2,money:-2},flags:["exchangeSemester"],nextStep:"recommendation"},
            {text:"医院/临床观察项目",sub:"更吃沟通、临床兴趣和推荐。",effects:{reputation:2,energy:-2},flags:["exchangeClinical"],nextStep:"recommendation"}
          ]},
        recommendation:{stage:"申请 2/4 · 海外研学",year:"20岁",title:"推荐信找谁写？",type:"application",
          text:"一封推荐信的分量不仅取决于老师名气，也取决于他是否真的了解你。",
          choices:[
            {text:"找最有影响力但不太熟的教授",sub:"抬头很强，但内容可能比较泛。",effects:{reputation:2,mental:-2},flags:["famousReferee"],nextStep:"materials"},
            {text:"找真正带过你的导师",sub:"推荐内容更具体。",effects:{research:2,reputation:2},flags:["closeReferee"],nextStep:"materials"},
            {text:"找临床老师强调沟通和责任感",sub:"临床观察项目更匹配。",effects:{knowledge:1,reputation:3},talentEffects:{communication:1},flags:["clinicalReferee"],nextStep:"materials"}
          ]},
        materials:{stage:"申请 3/4 · 海外研学",year:"20岁",title:"个人陈述怎么写？",type:"application",
          text:"你只有一页纸解释为什么是你、为什么是这个项目，以及这段经历以后要做什么。",
          choices:[
            {text:"写得稳妥：成绩、科研、目标清楚",sub:"减少风险，强调可靠。",effects:{knowledge:2},talentEffects:{english:1},flags:["safeStatement"],nextStep:"interview"},
            {text:"突出个人特色和长期目标",sub:"可能更打动评审，也更看表达。",effects:{mental:-2},talentEffects:{communication:2,english:2},flags:["boldStatement"],nextStep:"interview"},
            {text:"请很多人反复修改",sub:"文书更成熟，但耗时明显。",effects:{energy:-4,reputation:1},talentEffects:{english:2},flags:["editedStatement"],nextStep:"interview"}
          ]},
        interview:{stage:"申请 4/4 · 海外研学",year:"20岁",title:"视频面试：Tell me about yourself.",type:"application",
          text:"镜头亮起。前面的项目方向、推荐信和文书都已经交出去，现在轮到你自己说话。",
          choices:[
            {text:"结构化回答，稳妥展示准备",sub:"看英语、知识与沟通。",effects:{mental:-2},chance:{p:.30,bonusBy:["english","knowledge","communication","globalAccess"],success:{mental:5,reputation:3},fail:{mental:-3},successFlags:["ugExchange"],failFlags:["ugExchangeFailed"]},successStep:"success",failStep:"fail"},
            {text:"重点讲自己的科研/临床故事",sub:"如果经历匹配，会更有辨识度。",effects:{mental:-2},chance:{p:.28,bonusBy:["english","communication","research","reputation","globalAccess"],success:{mental:6,reputation:4},fail:{mental:-4},successFlags:["ugExchange"],failFlags:["ugExchangeFailed"]},successStep:"success",failStep:"fail"}
          ]},
        success:{stage:"结果 · 海外研学",year:"20-21岁",title:"Offer 来了：你被录取了",type:"resultSuccess",
          text:"邮件标题里写着 Congratulations。现在真正的问题变成：你准备怎么使用这次机会？",
          choices:[
            {text:"把主要时间泡在实验室",sub:"为未来科研与博士路线积累。",effects:{research:9,reputation:5,energy:-4,money:-3},talentEffects:{english:2,researchSense:2},flags:["exchangeResearchOutcome"],endFlow:true},
            {text:"主动争取临床观察和病例讨论",sub:"建立不同医疗体系的临床视角。",effects:{knowledge:7,reputation:5,money:-3},talentEffects:{english:2,communication:2},flags:["exchangeClinicalOutcome"],endFlow:true},
            {text:"兼顾学习与国际社交",sub:"履历增益略少，但视野和关系网络更广。",effects:{reputation:6,mental:6,money:-4},talentEffects:{english:3,communication:2},flags:["exchangeNetworkOutcome"],endFlow:true}
          ]},
        fail:{stage:"结果 · 海外研学",year:"20岁",title:"We regret to inform you...",type:"resultFail",
          text:"你没有拿到这次名额。前面几周的材料、推荐信和面试准备并没有自动变成一张 Offer。",
          choices:[
            {text:"申请下一批项目，再试一次",sub:"失败经验会提高下一次准备质量。",effects:{mental:-2,knowledge:2},talentEffects:{resilience:2,english:1},flags:["exchangeRetry"],endFlow:true},
            {text:"把准备好的材料转投国内暑研",sub:"国际线失败，但科研线还能继续。",effects:{research:5,mental:3},flags:["domesticSummerResearch"],endFlow:true},
            {text:"暂停海外计划",sub:"把资源拉回国内主线。",effects:{mental:5,money:2},flags:["pauseGlobal"],endFlow:true}
          ]}
      }
    },

    ug_student_project:{
      name:"本科生科研项目申请",returnNext:"clinical_exposure",start:"topic",
      steps:{
        topic:{stage:"申请 1/3 · 本科科研项目",year:"20岁",title:"选题：创新，还是可完成？",type:"application",
          text:"你第一次要用一个题目说服评审：这个问题值得做，而且你真的做得出来。",
          choices:[
            {text:"选高创新、高风险题目",sub:"上限高，但评审会质疑可行性。",effects:{research:3,mental:-2},flags:["projectBold"],nextStep:"mentor"},
            {text:"选已有基础上的稳妥题目",sub:"创新一般，但完成概率高。",effects:{knowledge:2,research:2},flags:["projectSafe"],nextStep:"mentor"},
            {text:"选临床真实问题",sub:"强调实际价值和数据来源。",effects:{knowledge:2,reputation:2},flags:["projectClinical"],nextStep:"mentor"}
          ]},
        mentor:{stage:"申请 2/3 · 本科科研项目",year:"20岁",title:"导师愿意给你多少空间？",type:"application",
          text:"导师可以帮你把项目包装得更成熟，也可能让项目逐渐变成“导师的项目”。",
          choices:[
            {text:"跟着强导师把方案打磨成熟",sub:"申请更稳，但自主性少。",effects:{research:3,reputation:2,energy:-3},flags:["projectStrongMentor"],nextStep:"defense"},
            {text:"坚持自己主导设计",sub:"更考验科研直觉和答辩。",effects:{research:2,mental:-2},talentEffects:{researchSense:2},flags:["projectIndependent"],nextStep:"defense"}
          ]},
        defense:{stage:"申请 3/3 · 本科科研项目",year:"20岁",title:"五分钟答辩，评委开始追问",type:"application",
          text:"“样本量够吗？”“创新在哪里？”“如果结果不显著怎么办？”",
          choices:[
            {text:"正面回答，承认局限并解释方案",sub:"看科研、知识和表达。",effects:{mental:-2},chance:{p:.34,bonusBy:["researchSense","research","knowledge","communication","schoolOpportunity"],success:{reputation:4,research:3},fail:{mental:-3},successFlags:["studentPI"],failFlags:["studentPIFailed"]},successStep:"success",failStep:"fail"}
          ]},
        success:{stage:"结果 · 本科科研项目",year:"20岁",title:"项目立项了，你第一次成了负责人",type:"resultSuccess",
          text:"拿到项目只是开始。你现在得真的把它做完。",
          choices:[
            {text:"以论文为目标推进",sub:"更强调完整数据和投稿。",effects:{research:8,energy:-5},flags:["studentProjectPaper"],endFlow:true},
            {text:"以解决实际问题为目标",sub:"成果未必是论文，但能力更扎实。",effects:{knowledge:5,research:5,reputation:3},flags:["studentProjectImpact"],endFlow:true}
          ]},
        fail:{stage:"结果 · 本科科研项目",year:"20岁",title:"评审没有通过",type:"resultFail",
          text:"评委认为创新性或可行性还不够。你的题目没有消失，只是没有拿到这次资源。",
          choices:[
            {text:"缩小题目，自己继续做",sub:"没有经费也可以做一个小项目。",effects:{research:5,energy:-3},talentEffects:{resilience:1},flags:["projectBootstrapped"],endFlow:true},
            {text:"加入别人的成熟项目",sub:"先学会怎么把研究做完。",effects:{research:4,reputation:2,mental:2},flags:["joinProject"],endFlow:true}
          ]}
      }
    },

    ug_skill_competition:{
      name:"本科临床技能竞赛",returnNext:"clinical_exposure",start:"role",
      steps:{
        role:{stage:"申请 1/3 · 临床技能竞赛",year:"20岁",title:"你想在队里承担什么角色？",type:"application",
          text:"技能队不仅看操作，也看沟通、临场和团队配合。",
          choices:[
            {text:"主攻操作项目",sub:"穿刺、缝合、急救等动手训练。",effects:{knowledge:2,energy:-3},talentEffects:{dexterity:2},flags:["skillOperator"],nextStep:"training"},
            {text:"主攻问诊与沟通站",sub:"更看表达、结构和患者沟通。",effects:{reputation:2,energy:-2},talentEffects:{communication:2},flags:["skillCommunicator"],nextStep:"training"},
            {text:"做全能型队员",sub:"什么都练，最累但选择面广。",effects:{knowledge:3,energy:-5,mental:-2},talentEffects:{dexterity:1,communication:1},flags:["skillAllRound"],nextStep:"training"}
          ]},
        training:{stage:"申请 2/3 · 临床技能竞赛",year:"20岁",title:"训练进入最后两周",type:"application",
          text:"每天晚上都能加练，但你的课程和身体也在消耗。",
          choices:[
            {text:"每天加练到闭馆",sub:"能力增长快，疲劳明显。",effects:{knowledge:4,energy:-6},talentEffects:{dexterity:2,resilience:1},flags:["skillHardTrain"],nextStep:"selection"},
            {text:"高质量训练，保证睡眠",sub:"成长稍慢但状态稳定。",effects:{knowledge:3,mental:3},talentEffects:{dexterity:1},flags:["skillSmartTrain"],nextStep:"selection"}
          ]},
        selection:{stage:"申请 3/3 · 临床技能竞赛",year:"20岁",title:"校队最终选拔",type:"application",
          text:"模拟患者、操作台、计时器全部摆好。你只有一次完整表现。",
          choices:[
            {text:"上场",sub:"看动手、沟通、知识和抗压。",effects:{mental:-2},chance:{p:.35,bonusBy:["dexterity","communication","knowledge","resilience","clinicalAccess"],success:{reputation:5,mental:4},fail:{mental:-2},successFlags:["clinicalCompetition"],failFlags:["clinicalCompetitionFailed"]},successStep:"success",failStep:"fail"}
          ]},
        success:{stage:"结果 · 临床技能竞赛",year:"20-21岁",title:"你进了校队",type:"resultSuccess",
          text:"真正的比赛训练现在才开始。",
          choices:[
            {text:"冲名次",sub:"继续高强度训练。",effects:{knowledge:6,reputation:6,energy:-5},talentEffects:{dexterity:2},flags:["skillCompetitionAwardTrack"],endFlow:true},
            {text:"把重点放在临床基本功",sub:"不为奖牌过度消耗。",effects:{knowledge:5,mental:4},flags:["skillCompetitionLearning"],endFlow:true}
          ]},
        fail:{stage:"结果 · 临床技能竞赛",year:"20岁",title:"差一点，但你没进最终名单",type:"resultFail",
          text:"失败很具体：某个站超时、某个动作不规范，或者当天状态不够好。",
          choices:[
            {text:"继续跟队训练，当替补",sub:"保留下一次机会。",effects:{knowledge:4,energy:-2},talentEffects:{resilience:1,dexterity:1},flags:["skillAlternate"],endFlow:true},
            {text:"回到课程和见习",sub:"不把一次选拔看得太重。",effects:{mental:5,knowledge:2},flags:["skillMoveOn"],endFlow:true}
          ]}
      }
    },

    master_scholarship:{
      name:"研究生国家奖学金",returnNext:"phd_decision",start:"portfolio",
      steps:{
        portfolio:{stage:"申请 1/2 · 研究生奖学金",year:"25岁",title:"论文、成绩、临床表现，材料主轴选什么？",type:"application",
          text:"研究生阶段的评审更看硬成果。你的材料不能只是“很努力”。",
          choices:[
            {text:"论文和科研成果",sub:"适合科研积累较强。",effects:{research:3,energy:-2},flags:["masterAwardResearch"],nextStep:"review"},
            {text:"临床与综合表现",sub:"适合专硕和临床路线。",effects:{knowledge:3,reputation:2},flags:["masterAwardClinical"],nextStep:"review"}
          ]},
        review:{stage:"申请 2/2 · 研究生奖学金",year:"25岁",title:"学院评审会",type:"application",
          text:"你的材料和同年级最强的一批人放在一起比较。",
          choices:[
            {text:"等待结果",sub:"科研、知识与声望共同影响。",effects:{},chance:{p:.34,bonusBy:["research","knowledge","reputation"],success:{money:12,reputation:6,mental:4},fail:{mental:-2},successFlags:["masterScholarship"],failFlags:["masterScholarshipFail"]},successStep:"success",failStep:"fail"}
          ]},
        success:{stage:"结果 · 研究生奖学金",year:"25岁",title:"获奖",type:"resultSuccess",text:"你拿到了这次国家/高额奖学金。",
          choices:[{text:"继续下一阶段",sub:"把这项经历写进你的履历。",effects:{mental:3},endFlow:true}]},
        fail:{stage:"结果 · 研究生奖学金",year:"25岁",title:"没有获奖",type:"resultFail",text:"差距可能只是一个成果、一次排名或评审偏好。",
          choices:[{text:"继续下一阶段",sub:"研究生生涯不会被一次评审定义。",effects:{mental:2},talentEffects:{resilience:1},endFlow:true}]}
      }
    },

    master_joint:{
      name:"研究生海外联合培养",returnNext:"phd_decision",start:"host",
      steps:{
        host:{stage:"申请 1/3 · 联合培养",year:"25岁",title:"找什么样的海外合作导师？",type:"application",text:"顶级组名气大，但竞争强；熟悉的合作组更稳。",
          choices:[
            {text:"冲顶级课题组",sub:"收益高，录取更难。",effects:{research:2,mental:-2},flags:["jointTopLab"],nextStep:"proposal"},
            {text:"选已有合作基础的课题组",sub:"成功率更稳定。",effects:{reputation:2,research:2},flags:["jointPartnerLab"],nextStep:"proposal"}
          ]},
        proposal:{stage:"申请 2/3 · 联合培养",year:"25岁",title:"联合培养计划书",type:"application",text:"你需要证明出去以后能完成一段独立工作，而不是只换一个地点。",
          choices:[
            {text:"做明确可执行的研究计划",sub:"可行性更强。",effects:{research:3,energy:-3},flags:["jointFeasible"],nextStep:"review"},
            {text:"提出高创新合作方向",sub:"更亮眼，也更冒险。",effects:{research:4,mental:-2},talentEffects:{researchSense:1},flags:["jointBold"],nextStep:"review"}
          ]},
        review:{stage:"申请 3/3 · 联合培养",year:"25岁",title:"导师与项目双重审核",type:"application",text:"英语、科研、推荐和项目匹配度一起决定结果。",
          choices:[{text:"查看结果",sub:"学校国际资源也会参与概率。",effects:{},chance:{p:.30,bonusBy:["english","research","reputation","globalAccess"],success:{research:5,reputation:5,mental:4},fail:{mental:-3},successFlags:["jointTraining"],failFlags:["jointTrainingFail"]},successStep:"success",failStep:"fail"}]},
        success:{stage:"结果 · 联合培养",year:"25-26岁",title:"你获得联合培养名额",type:"resultSuccess",text:"下一年，你将在另一套科研体系里工作一段时间。",
          choices:[
            {text:"重点做论文和合作",sub:"最大化科研产出。",effects:{research:8,reputation:5,money:-3},talentEffects:{english:2},endFlow:true},
            {text:"重点建立国际合作网络",sub:"为未来博士/博后铺路。",effects:{reputation:7,research:4,money:-3},talentEffects:{english:2,communication:1},endFlow:true}
          ]},
        fail:{stage:"结果 · 联合培养",year:"25岁",title:"申请未通过",type:"resultFail",text:"海外导师、资助或项目名额中的某一环没有通过。",
          choices:[
            {text:"继续申请下一批",sub:"保留国际路线。",effects:{mental:-2},talentEffects:{resilience:2,english:1},flags:["jointRetry"],endFlow:true},
            {text:"把时间投入国内项目",sub:"不再等待名额。",effects:{research:5,mental:3},flags:["jointDomesticPivot"],endFlow:true}
          ]}
      }
    },

    master_key_project:{
      name:"研究生重点科研项目",returnNext:"phd_decision",start:"role",
      steps:{
        role:{stage:"申请 1/2 · 重点项目",year:"25岁",title:"项目组需要的是核心执行者，不是旁观者",type:"application",text:"你可以争取数据分析、实验核心或项目协调中的一个位置。",
          choices:[
            {text:"争取核心实验/分析",sub:"最吃科研能力。",effects:{research:3,energy:-3},flags:["keyProjectCore"],nextStep:"selection"},
            {text:"争取临床数据和协调角色",sub:"更吃沟通与声望。",effects:{reputation:3,energy:-2},flags:["keyProjectClinical"],nextStep:"selection"}
          ]},
        selection:{stage:"申请 2/2 · 重点项目",year:"25岁",title:"PI 最终选人",type:"application",text:"他要判断你能不能在高压团队里真正把事情交付出来。",
          choices:[{text:"接受评估",sub:"科研、抗压和声望共同影响。",effects:{},chance:{p:.38,bonusBy:["researchSense","research","resilience","reputation"],success:{research:6,reputation:4},fail:{mental:-3},successFlags:["keyProject"],failFlags:["keyProjectFail"]},successStep:"success",failStep:"fail"}]},
        success:{stage:"结果 · 重点项目",year:"25岁",title:"你进入核心团队",type:"resultSuccess",text:"接下来你会获得更强资源，也会承担更明确的交付责任。",
          choices:[{text:"接下任务",sub:"高压也意味着高成长。",effects:{research:8,energy:-5,reputation:3},endFlow:true}]},
        fail:{stage:"结果 · 重点项目",year:"25岁",title:"这次没有被选中",type:"resultFail",text:"团队认为你的经历还不够匹配。",
          choices:[{text:"去补缺口",sub:"把反馈变成下一次准备。",effects:{research:3,mental:2},talentEffects:{resilience:1},endFlow:true}]}
      }
    },

    master_clinical_honor:{
      name:"临床优秀学员",returnNext:"phd_decision",start:"focus",
      steps:{
        focus:{stage:"申请 1/2 · 临床优秀学员",year:"25岁",title:"考核前，你最后强化哪一块？",type:"application",text:"操作、病例汇报、沟通和理论都有评分。",
          choices:[
            {text:"补操作短板",sub:"把动手稳定性拉上来。",effects:{energy:-3,knowledge:2},talentEffects:{dexterity:2},nextStep:"assessment"},
            {text:"补病例汇报和沟通",sub:"提升表达与临床思路。",effects:{knowledge:2,reputation:2},talentEffects:{communication:2},nextStep:"assessment"}
          ]},
        assessment:{stage:"申请 2/2 · 临床优秀学员",year:"25岁",title:"综合考核",type:"application",text:"你需要在多个站点连续保持稳定表现。",
          choices:[{text:"进入考核",sub:"知识、动手、沟通共同影响。",effects:{},chance:{p:.40,bonusBy:["knowledge","dexterity","communication","clinicalAccess"],success:{knowledge:5,reputation:5},fail:{mental:-2},successFlags:["excellentResident"],failFlags:["excellentResidentFail"]},successStep:"success",failStep:"fail"}]},
        success:{stage:"结果 · 临床优秀学员",year:"25岁",title:"你被评为优秀学员",type:"resultSuccess",text:"这项经历让临床导师和科室更早记住了你。",
          choices:[{text:"继续下一阶段",sub:"临床声望增加。",effects:{reputation:4,mental:3},endFlow:true}]},
        fail:{stage:"结果 · 临床优秀学员",year:"25岁",title:"没有进入优秀名单",type:"resultFail",text:"你的表现合格，但还没到最突出的一档。",
          choices:[{text:"继续训练",sub:"临床能力本来就不是一次考核决定的。",effects:{knowledge:3,mental:2},talentEffects:{dexterity:1},endFlow:true}]}
      }
    },

    phd_joint:{
      name:"博士海外联合培养",returnNext:"phd_graduation",start:"plan",
      steps:{
        plan:{stage:"申请 1/3 · 博士联合培养",year:"29-31岁",title:"出去一年，你准备完成什么？",type:"application",text:"博士联合培养需要明确产出：方法、数据、论文或合作网络。",
          choices:[
            {text:"主攻一篇合作论文",sub:"目标明确，科研导向强。",effects:{research:3,energy:-2},flags:["phdJointPaper"],nextStep:"host"},
            {text:"主攻新技术/方法学习",sub:"短期论文少，但能力增量大。",effects:{knowledge:3,research:2},flags:["phdJointMethod"],nextStep:"host"}
          ]},
        host:{stage:"申请 2/3 · 博士联合培养",year:"29-31岁",title:"海外导师回信了",type:"application",text:"他愿意考虑，但要求你解释为什么他的组适合你的博士课题。",
          choices:[
            {text:"针对课题深度定制回复",sub:"耗时，但匹配度更高。",effects:{energy:-3,research:2},talentEffects:{english:1},nextStep:"review"},
            {text:"强调已有成果和执行能力",sub:"用履历证明可靠。",effects:{reputation:2},talentEffects:{english:1},nextStep:"review"}
          ]},
        review:{stage:"申请 3/3 · 博士联合培养",year:"29-31岁",title:"资助与导师双重结果",type:"application",text:"导师接受并不等于资助一定通过。",
          choices:[{text:"查看最终结果",sub:"英语、科研、声望与国际资源共同影响。",effects:{},chance:{p:.32,bonusBy:["english","research","reputation","globalAccess"],success:{research:5,reputation:5},fail:{mental:-4},successFlags:["phdJoint"],failFlags:["phdJointFail"]},successStep:"success",failStep:"fail"}]},
        success:{stage:"结果 · 博士联合培养",year:"29-31岁",title:"联合培养获批",type:"resultSuccess",text:"你获得了一段真正属于博士阶段的海外科研窗口。",
          choices:[{text:"出发",sub:"把这段经历转化为合作和成果。",effects:{research:8,reputation:7,money:-3},talentEffects:{english:2},endFlow:true}]},
        fail:{stage:"结果 · 博士联合培养",year:"29-31岁",title:"项目未获批",type:"resultFail",text:"可能是名额、资助或匹配度问题。",
          choices:[
            {text:"转投国际会议与短期合作",sub:"缩短国际经历目标。",effects:{research:3,reputation:2,mental:2},flags:["phdJointPivot"],endFlow:true},
            {text:"专心毕业论文",sub:"减少不确定性。",effects:{research:4,mental:4},flags:["thesisFirst"],endFlow:true}
          ]}
      }
    },

    phd_oral:{
      name:"国际会议口头报告",returnNext:"phd_graduation",start:"abstract",
      steps:{
        abstract:{stage:"申请 1/2 · 国际会议",year:"29-31岁",title:"摘要只允许 300 词",type:"application",text:"你必须把博士工作压缩成一个足够清楚、足够有意思的故事。",
          choices:[
            {text:"突出创新性",sub:"更抢眼，也更容易被追问。",effects:{research:2,energy:-2},flags:["oralNovelty"],nextStep:"review"},
            {text:"突出完整性和临床意义",sub:"更稳妥。",effects:{knowledge:2,reputation:1},flags:["oralClinical"],nextStep:"review"}
          ]},
        review:{stage:"申请 2/2 · 国际会议",year:"29-31岁",title:"摘要评审",type:"application",text:"你可能被选为口头报告，也可能只拿到壁报，或者未录用。",
          choices:[{text:"查看结果",sub:"科研质量、英语和表达影响结果。",effects:{},chance:{p:.34,bonusBy:["research","english","communication","reputation"],success:{reputation:6,research:3},fail:{mental:-2},successFlags:["oralPresentation"],failFlags:["oralPresentationFail"]},successStep:"success",failStep:"fail"}]},
        success:{stage:"结果 · 国际会议",year:"29-31岁",title:"你被选为口头报告",type:"resultSuccess",text:"下一步不是旅游，是在台上把自己的工作讲清楚。",
          choices:[
            {text:"认真训练演讲和问答",sub:"把机会真正兑现。",effects:{reputation:7,research:3,energy:-3},talentEffects:{english:2,communication:2},endFlow:true}
          ]},
        fail:{stage:"结果 · 国际会议",year:"29-31岁",title:"没有拿到口头报告",type:"resultFail",text:"你可能拿到壁报，也可能没有录用。",
          choices:[
            {text:"如果有壁报就去交流",sub:"结果不是只有 0 和 1。",effects:{reputation:3,research:2,mental:2},flags:["conferencePoster"],endFlow:true},
            {text:"把精力留给论文",sub:"下一次用更完整的数据再来。",effects:{research:4,mental:3},endFlow:true}
          ]}
      }
    },

    phd_key_project:{
      name:"博士重点项目",returnNext:"phd_graduation",start:"position",
      steps:{
        position:{stage:"申请 1/2 · 博士重点项目",year:"29-31岁",title:"你要争取什么位置？",type:"application",text:"重点项目里“参与”与“核心负责”差别很大。",
          choices:[
            {text:"争取核心子课题负责人",sub:"要求高，但能真正留下成果。",effects:{research:3,energy:-3},flags:["phdSubPI"],nextStep:"selection"},
            {text:"先进入核心执行团队",sub:"更稳妥。",effects:{research:2,reputation:2},flags:["phdCoreTeam"],nextStep:"selection"}
          ]},
        selection:{stage:"申请 2/2 · 博士重点项目",year:"29-31岁",title:"项目负责人评估",type:"application",text:"科研能力、既往成果和团队信任决定你的位置。",
          choices:[{text:"接受评估",sub:"科研与声望影响结果。",effects:{},chance:{p:.40,bonusBy:["research","researchSense","reputation"],success:{research:6,reputation:5},fail:{mental:-3},successFlags:["phdKeyProject"],failFlags:["phdKeyProjectFail"]},successStep:"success",failStep:"fail"}]},
        success:{stage:"结果 · 博士重点项目",year:"29-31岁",title:"进入重点项目核心",type:"resultSuccess",text:"资源变多了，交付压力也同步增加。",
          choices:[{text:"接下责任",sub:"让项目成为博士后半程主轴。",effects:{research:8,reputation:5,energy:-5},endFlow:true}]},
        fail:{stage:"结果 · 博士重点项目",year:"29-31岁",title:"没有进核心名单",type:"resultFail",text:"你仍然可以继续自己的博士课题。",
          choices:[{text:"回到自己的论文线",sub:"把可控的事做好。",effects:{research:4,mental:3},endFlow:true}]}
      }
    },

    career_youth_grant:{
      name:"青年基金",returnNext:"key_midcareer",start:"question",
      steps:{
        question:{stage:"申请 1/3 · 青年基金",year:"32-36岁",title:"你要押哪个科学问题？",type:"application",text:"创新性太低没竞争力，太高又可能缺乏前期基础。",
          choices:[
            {text:"押高创新问题",sub:"亮眼，但评审会盯可行性。",effects:{research:3,mental:-2},flags:["grantBold"],nextStep:"prelim"},
            {text:"沿已有成果稳步推进",sub:"前期基础更扎实。",effects:{research:2,knowledge:2},flags:["grantSolid"],nextStep:"prelim"}
          ]},
        prelim:{stage:"申请 2/3 · 青年基金",year:"32-36岁",title:"截止前一周：前期数据还差一张图",type:"application",text:"你可以熬夜补实验，也可以用已有数据提交。",
          choices:[
            {text:"补最后一组数据",sub:"提高完整度，消耗明显。",effects:{research:3,energy:-5,mental:-2},flags:["grantLastData"],nextStep:"review"},
            {text:"用现有数据，集中打磨逻辑",sub:"减少实验风险。",effects:{knowledge:2,energy:-2},flags:["grantLogic"],nextStep:"review"}
          ]},
        review:{stage:"申请 3/3 · 青年基金",year:"32-36岁",title:"评审结果",type:"application",text:"标书现在和成百上千份申请放在一起。",
          choices:[{text:"查看结果",sub:"科研、前期基础、科研直觉和声望影响概率。",effects:{},chance:{p:.28,bonusBy:["research","researchSense","reputation"],success:{research:7,reputation:6,mental:5},fail:{mental:-5},successFlags:["youthGrant"],failFlags:["youthGrantFail"]},successStep:"success",failStep:"fail"}]},
        success:{stage:"结果 · 青年基金",year:"32-36岁",title:"立项",type:"resultSuccess",text:"你第一次真正拥有一笔以自己为负责人使用的科研经费。",
          choices:[
            {text:"组建小团队推进",sub:"开始从自己做转向带人做。",effects:{research:9,reputation:6,energy:-4},flags:["grantTeam"],endFlow:true},
            {text:"自己盯紧核心实验",sub:"质量可控，但个人负担更大。",effects:{research:8,energy:-6},flags:["grantHandsOn"],endFlow:true}
          ]},
        fail:{stage:"结果 · 青年基金",year:"32-36岁",title:"未获资助",type:"resultFail",text:"评审意见回来了。你需要决定这些意见是垃圾，还是下一版标书的免费咨询。",
          choices:[
            {text:"逐条拆解，明年再投",sub:"失败转化为经验。",effects:{research:4,mental:-2},talentEffects:{resilience:2},flags:["grantRetry"],endFlow:true},
            {text:"把重心先拉回临床",sub:"不让基金吞掉全部职业节奏。",effects:{knowledge:5,mental:4},flags:["grantClinicalPivot"],endFlow:true}
          ]}
      }
    },

    career_visit:{
      name:"海外访问学者 / 进修",returnNext:"key_midcareer",start:"purpose",
      steps:{
        purpose:{stage:"申请 1/3 · 海外访问",year:"32-36岁",title:"你为什么要出去？",type:"application",text:"同样是一年海外经历，科研合作、临床技术和人才履历的目标完全不同。",
          choices:[
            {text:"科研合作与论文",sub:"适合科研主线。",effects:{research:3},flags:["visitResearch"],nextStep:"host"},
            {text:"学习专科技术",sub:"适合临床主线。",effects:{knowledge:3},flags:["visitClinical"],nextStep:"host"},
            {text:"建立国际网络",sub:"综合收益，结果更难量化。",effects:{reputation:3},flags:["visitNetwork"],nextStep:"host"}
          ]},
        host:{stage:"申请 2/3 · 海外访问",year:"32-36岁",title:"接收单位怎么选？",type:"application",text:"名气、匹配度、生活成本和现有合作关系需要同时考虑。",
          choices:[
            {text:"冲最强平台",sub:"竞争最高。",effects:{mental:-2,money:-2},flags:["visitTopHost"],nextStep:"review"},
            {text:"选合作基础最好的平台",sub:"匹配度和成功率更稳。",effects:{reputation:2},flags:["visitPartnerHost"],nextStep:"review"}
          ]},
        review:{stage:"申请 3/3 · 海外访问",year:"32-36岁",title:"单位与资助审核",type:"application",text:"医院支持、外方接收和资助缺一不可。",
          choices:[{text:"查看结果",sub:"英语、声望、科研和国际资源共同影响。",effects:{},chance:{p:.28,bonusBy:["english","reputation","research","globalAccess"],success:{reputation:6,mental:4},fail:{mental:-3,money:-2},successFlags:["visitingScholar"],failFlags:["visitingScholarFail"]},successStep:"success",failStep:"fail"}]},
        success:{stage:"结果 · 海外访问",year:"32-37岁",title:"访问获批",type:"resultSuccess",text:"你获得了一段暂时离开原有医院节奏的窗口。",
          choices:[
            {text:"重点产出合作成果",sub:"科研增益最大。",effects:{research:8,reputation:5,money:-4},talentEffects:{english:2},endFlow:true},
            {text:"重点学习临床技术",sub:"临床能力增益最大。",effects:{knowledge:9,reputation:4,money:-4},talentEffects:{communication:1},endFlow:true}
          ]},
        fail:{stage:"结果 · 海外访问",year:"32-36岁",title:"没有成行",type:"resultFail",text:"可能卡在名额、资助、科室排班或接收单位。",
          choices:[
            {text:"申请国内高水平进修",sub:"保留学习目标，换路线。",effects:{knowledge:5,reputation:3,mental:2},flags:["visitDomesticPivot"],endFlow:true},
            {text:"下一年再申",sub:"保留国际路线。",effects:{mental:-1},talentEffects:{resilience:2,english:1},flags:["visitRetry"],endFlow:true}
          ]}
      }
    },

    career_fellowship:{
      name:"高水平临床进修",returnNext:"key_midcareer",start:"specialty",
      steps:{
        specialty:{stage:"申请 1/2 · 临床进修",year:"32-36岁",title:"你要补哪一块临床能力？",type:"application",text:"进修不是为了多一张证，而是为了把某个能力真正带回科室。",
          choices:[
            {text:"高难度操作/技术",sub:"更吃动手和既往病例量。",effects:{knowledge:2,energy:-3},talentEffects:{dexterity:1},flags:["fellowshipTechnique"],nextStep:"review"},
            {text:"复杂病例与亚专科",sub:"更吃知识和临床声望。",effects:{knowledge:3,reputation:2},flags:["fellowshipSubspecialty"],nextStep:"review"}
          ]},
        review:{stage:"申请 2/2 · 临床进修",year:"32-36岁",title:"接收科室审核",type:"application",text:"接收方希望你有基础，也希望你回去以后真能开展相关工作。",
          choices:[{text:"查看结果",sub:"知识、动手、声望和临床资源影响。",effects:{},chance:{p:.40,bonusBy:["knowledge","dexterity","reputation","clinicalAccess"],success:{knowledge:6,reputation:5},fail:{mental:-2},successFlags:["clinicalFellowship"],failFlags:["clinicalFellowshipFail"]},successStep:"success",failStep:"fail"}]},
        success:{stage:"结果 · 临床进修",year:"32-37岁",title:"你拿到了进修名额",type:"resultSuccess",text:"几个月后，你将暂时离开原科室去系统学习。",
          choices:[{text:"把技术真正学回来",sub:"临床能力与声望明显提升。",effects:{knowledge:10,reputation:6,energy:-4},talentEffects:{dexterity:2},endFlow:true}]},
        fail:{stage:"结果 · 临床进修",year:"32-36岁",title:"这次没有名额",type:"resultFail",text:"接收科室名额有限。",
          choices:[{text:"先在本院继续积累病例",sub:"等待下一次窗口。",effects:{knowledge:4,mental:3},endFlow:true}]}
      }
    },

    career_talent:{
      name:"青年人才项目",returnNext:"key_midcareer",start:"positioning",
      steps:{
        positioning:{stage:"申请 1/3 · 青年人才",year:"32-36岁",title:"你要把自己包装成什么样的人？",type:"application",text:"人才项目不是单纯数论文，还要让评审相信你未来能形成独立方向。",
          choices:[
            {text:"科研独立性",sub:"突出自己的科学问题与成果线。",effects:{research:3},flags:["talentResearch"],nextStep:"recommend"},
            {text:"临床+科研转化能力",sub:"强调解决临床问题。",effects:{knowledge:2,research:2,reputation:2},flags:["talentTranslational"],nextStep:"recommend"}
          ]},
        recommend:{stage:"申请 2/3 · 青年人才",year:"32-36岁",title:"需要强推荐和单位支持",type:"application",text:"你必须让科室和医院相信，把资源放在你身上值得。",
          choices:[
            {text:"主动争取单位资源",sub:"沟通和声望很重要。",effects:{reputation:3,mental:-2},talentEffects:{communication:1},nextStep:"review"},
            {text:"靠硬成果说话",sub:"减少人情沟通，把材料做到最硬。",effects:{research:3,energy:-3},nextStep:"review"}
          ]},
        review:{stage:"申请 3/3 · 青年人才",year:"32-36岁",title:"最终评审",type:"application",text:"这是高竞争机会，成功率不会因为你努力就自动变高。",
          choices:[{text:"查看结果",sub:"科研、声望、知识和沟通共同影响。",effects:{},chance:{p:.20,bonusBy:["research","reputation","knowledge","communication"],success:{research:7,reputation:8,money:4},fail:{mental:-5},successFlags:["youngTalent"],failFlags:["youngTalentFail"]},successStep:"success",failStep:"fail"}]},
        success:{stage:"结果 · 青年人才",year:"32-36岁",title:"入选",type:"resultSuccess",text:"资源、平台和期待一起增加。之后你会被当作“要做出东西的人”。",
          choices:[{text:"接住资源，也接住压力",sub:"学术路线显著加速。",effects:{research:10,reputation:8,energy:-5},flags:["talentTrackBoost"],endFlow:true}]},
        fail:{stage:"结果 · 青年人才",year:"32-36岁",title:"未入选",type:"resultFail",text:"高竞争项目的失败并不罕见。",
          choices:[
            {text:"继续走自己的科研线",sub:"头衔不是科研的唯一价值。",effects:{research:4,mental:2},talentEffects:{resilience:2},endFlow:true},
            {text:"减少人才项目投入，回临床",sub:"重构职业资源分配。",effects:{knowledge:5,mental:4},flags:["talentClinicalPivot"],endFlow:true}
          ]}
      }
    }
  }
};