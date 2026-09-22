window.SCHOOL_SYSTEM = {
  disclaimer: "以下培养画像、机会池与事件为游戏机制，用来模拟不同类型医学教育生态，不等同于任何学校官方培养方案或现实评价。",

  profiles: {
    elite_research: {
      name:"科研密集型医学平台",
      desc:"科研机会密集、导师与课题组选择多、同伴竞争强。机会多，但需要主动争取。",
      opportunity:5, clinicalAccess:4, global:5, competition:5, autonomy:4,
      eventChanceBonus:.16,
      negativeScale:1.06,
      tags:["高密度科研机会","国际/交叉机会多","同伴竞争强"],
      eventPool:["eco_lab_rotation","eco_global_exchange","eco_peer_pressure","eco_big_project"]
    },
    elite_clinical: {
      name:"顶级临床平台型",
      desc:"大型附属医院与临床病例资源突出，技能、病例与导师机会更多，临床竞争同样激烈。",
      opportunity:5, clinicalAccess:5, global:4, competition:5, autonomy:3,
      eventChanceBonus:.15,
      negativeScale:1.05,
      tags:["大型临床平台","病例资源丰富","临床竞争强"],
      eventPool:["eco_early_clinic","eco_case_challenge","eco_peer_pressure","eco_specialty_center"]
    },
    innovation: {
      name:"交叉创新型",
      desc:"医学与AI、工程、数据科学等交叉机会更多，路线更开放，也更考验自我规划。",
      opportunity:5, clinicalAccess:4, global:5, competition:4, autonomy:5,
      eventChanceBonus:.15,
      negativeScale:1.03,
      tags:["医工交叉","AI/数据机会","路线自由度高"],
      eventPool:["eco_cross_discipline","eco_ai_project","eco_global_exchange","eco_big_project"]
    },
    strong_medical: {
      name:"强势医科大学型",
      desc:"医学培养体系完整，临床与科研路径都比较清晰，资源集中在医学本身。",
      opportunity:4, clinicalAccess:4, global:3, competition:4, autonomy:3,
      eventChanceBonus:.10,
      negativeScale:1.02,
      tags:["医学体系完整","临床科研均衡","升学路径清晰"],
      eventPool:["eco_early_clinic","eco_research_competition","eco_case_challenge","eco_scholarship"]
    },
    regional_clinical: {
      name:"区域临床强校型",
      desc:"区域医院网络与临床训练是主要优势。全国性科研资源相对有限，但临床成长路径清楚。",
      opportunity:3, clinicalAccess:4, global:2, competition:3, autonomy:3,
      eventChanceBonus:.06,
      negativeScale:1.00,
      tags:["区域医院网络","临床机会稳定","考研改变平台"],
      eventPool:["eco_regional_rotation","eco_local_network","eco_exam_jump","eco_scholarship"]
    },
    growth: {
      name:"逆风成长型",
      desc:"开局资源更有限，需要靠成绩、竞赛、考研和主动寻找导师完成平台跃迁。",
      opportunity:2, clinicalAccess:3, global:1, competition:2, autonomy:4,
      eventChanceBonus:.02,
      negativeScale:.98,
      tags:["资源需要争取","升学是关键跃迁","自主性高"],
      eventPool:["eco_resource_hunt","eco_exam_jump","eco_grassroots_rotation","eco_parttime_pressure"]
    }
  },

  schoolProfiles: {
    pkuhsc:"elite_research", sjtu_med:"elite_clinical", fudan_med:"elite_research", zju_med:"innovation",
    scu_huaxi:"elite_clinical", csu_xiangya:"elite_clinical", sysu_med:"elite_clinical", hust_tongji:"elite_clinical",
    ccmu:"elite_clinical", smu:"strong_medical", njmu:"elite_research", tmu:"strong_medical", cmu:"strong_medical",
    cqmu:"strong_medical", hrbmu:"strong_medical", gzhmu:"strong_medical", dmu:"regional_clinical", wmu:"innovation",
    ahmu:"regional_clinical", fjmu:"regional_clinical", hebmu:"regional_clinical", gxmu:"regional_clinical",
    kmmu:"regional_clinical", xzhmu:"regional_clinical", sxmu:"regional_clinical", zymu:"growth", swmu:"growth",
    nxmu:"growth", gannan:"growth", xinxiang:"growth", bengbu:"growth", regional_med:"growth"
  },

  signatures: {
    pkuhsc:{kind:"open_research",title:"高水平课题组开放日",desc:"多个实验室同时开放本科生轮转名额，你第一次面对“机会太多也要会选”的问题。"},
    sjtu_med:{kind:"hospital_network",title:"附属医院早期见习名额",desc:"学院放出一批早期临床观察机会，不同中心的方向完全不同。"},
    fudan_med:{kind:"academic_seminar",title:"青年PI午间学术会",desc:"你旁听了一场前沿医学研究分享，会后老师问本科生有没有兴趣加入项目。"},
    zju_med:{kind:"cross_ai",title:"医工交叉项目招募",desc:"一个医学+AI项目开始招本科生，队友来自计算机、工程和医学。"},
    scu_huaxi:{kind:"case_center",title:"大型病例讨论开放旁听",desc:"一个复杂病例MDT开放学生旁听，你第一次看见多个专科怎样共同做决定。"},
    csu_xiangya:{kind:"clinical_round",title:"传统临床教学查房",desc:"带教老师要求每个人都必须在床旁给出自己的鉴别诊断。"},
    sysu_med:{kind:"multi_hospital",title:"多个附属医院方向选择",desc:"不同附属医院的专科优势和科研氛围差异很大，你需要更早思考方向。"},
    hust_tongji:{kind:"skill_track",title:"临床技能强化训练",desc:"技能中心开放额外训练时段，优秀者可以加入竞赛队。"},
    ccmu:{kind:"city_rotation",title:"首都医院轮转机会",desc:"城市里临床平台很多，但每个机会都需要竞争。"},
    smu:{kind:"clinical_research",title:"临床科研联合小组",desc:"一个以真实病例为起点的学生科研小组正在招新。"},
    njmu:{kind:"research_track",title:"本科科研训练计划",desc:"你获得一次加入长期本科科研训练计划的机会。"},
    tmu:{kind:"structured_path",title:"清晰的升学路线说明会",desc:"老师把未来保研、考研、临床培养路径讲得很清楚，也让你第一次感到时间在倒计时。"},
    cmu:{kind:"clinical_foundation",title:"基础临床能力强化周",desc:"学院组织了一轮基础临床技能强化训练，要求很细。"},
    cqmu:{kind:"specialty_exposure",title:"特色专科体验周",desc:"你可以提前接触几个特色专科，选择比想象中更早到来。"},
    hrbmu:{kind:"research_winter",title:"寒假科研留校机会",desc:"假期实验室仍在运转，你要决定是回家还是留下。"},
    gzhmu:{kind:"clinical_city",title:"城市临床实践项目",desc:"一个面向真实医疗场景的实践项目开放报名。"},
    dmu:{kind:"balanced_growth",title:"临床与科研双选周",desc:"你可以选一个临床技能项目，也可以选一个科研训练项目。"},
    wmu:{kind:"innovation_eye",title:"特色专业创新项目",desc:"学院鼓励学生尽早进入特色方向与创新项目。"},
    ahmu:{kind:"regional_center",title:"省级中心见习名额",desc:"区域医疗中心开放一批见习名额，数量不多。"},
    fjmu:{kind:"regional_center",title:"区域附院见习计划",desc:"你可以提前进入附属医院观察真实临床流程。"},
    hebmu:{kind:"regional_center",title:"区域临床训练营",desc:"一批临床技能训练名额开始报名。"},
    gxmu:{kind:"regional_service",title:"区域医疗服务实践",desc:"你有机会跟随老师去基层开展医疗服务实践。"},
    kmmu:{kind:"regional_service",title:"高原与基层医疗实践",desc:"一次基层医疗实践让你看到教科书之外的医疗需求。"},
    xzhmu:{kind:"clinical_skill",title:"临床技能队招募",desc:"学院开始选拔临床技能竞赛队员。"},
    sxmu:{kind:"exam_jump",title:"跨校升学经验分享",desc:"高年级学长详细讲了如何通过考研完成平台跃迁。"},
    zymu:{kind:"resource_hunt",title:"校级科研名额争夺",desc:"科研名额有限，你需要主动联系老师并证明自己。"},
    swmu:{kind:"clinical_ground",title:"早期临床志愿机会",desc:"附属医院有一批面向低年级学生的志愿与观察机会。"},
    nxmu:{kind:"regional_service",title:"区域健康服务项目",desc:"你有机会跟随团队参与区域健康服务。"},
    gannan:{kind:"exam_jump",title:"考研跃迁路线分享",desc:"学长告诉你：本科只是起点，下一次考试可能改变平台。"},
    xinxiang:{kind:"clinical_ground",title:"本地医院实践机会",desc:"你可以在本地临床实践中提早积累经验。"},
    bengbu:{kind:"resource_hunt",title:"主动找导师",desc:"没有统一安排，你得自己发邮件、敲门、争取机会。"},
    regional_med:{kind:"resource_hunt",title:"你得自己找机会",desc:"学校不会把所有资源送到你面前，很多事情都要主动争取。"}
  },

  talents: {
    memory:{name:"记忆力",desc:"影响基础课与考试型任务"},
    resilience:{name:"抗压",desc:"影响高压事件与心理损耗"},
    communication:{name:"沟通",desc:"影响患者、导师与团队事件"},
    dexterity:{name:"动手",desc:"影响技能、外科与操作类事件"},
    researchSense:{name:"科研直觉",desc:"影响科研项目与论文事件"},
    english:{name:"英语",desc:"影响文献、交流与国际机会"}
  },

  schoolChoices: {
    lab:[
      {profile:["elite_research"],text:"申请本科生科研轮转",sub:"多课题组短轮转后再选方向。",effects:{research:10,energy:-5,mental:-2},flags:["researchRotation"],next:"pathology"},
      {profile:["innovation"],text:"加入医工交叉项目",sub:"医学之外还要补一点编程和数据。",effects:{research:8,knowledge:4,energy:-6},flags:["crossDiscipline"],next:"pathology"},
      {profile:["elite_clinical"],text:"先去附属医院做早期临床观察",sub:"把病例问题带回实验室。",effects:{knowledge:7,reputation:4,research:3},flags:["earlyClinical"],next:"pathology"},
      {profile:["regional_clinical"],text:"申请有限的校级科研名额",sub:"资源不多，需要主动争取。",effects:{research:6,reputation:2,energy:-4},chance:{p:.48,bonusBy:["knowledge","reputation"],success:{research:5,mental:4},fail:{mental:-3}},flags:["resourceCompete"],next:"pathology"},
      {profile:["growth"],text:"主动给老师发邮件找项目",sub:"没有统一入口，只能自己敲门。",effects:{research:4,mental:-2},chance:{p:.42,bonusBy:["knowledge","communication"],success:{research:7,reputation:3},fail:{mental:-2}},flags:["selfMadeOpportunity"],next:"pathology"}
    ],
    skills:[
      {profile:["elite_clinical","strong_medical"],text:"竞争临床技能队名额",sub:"训练强度高，但会接触更多操作。",effects:{knowledge:7,dexterity:0,energy:-7,reputation:3},chance:{p:.52,bonusBy:["knowledge"],success:{reputation:6,mental:4},fail:{mental:-2}},flags:["skillTeam"],next:"internship"},
      {profile:["innovation"],text:"做一个AI辅助临床技能项目",sub:"把技能训练变成数据项目。",effects:{research:7,knowledge:5,energy:-6},flags:["aiMedicine"],next:"internship"},
      {profile:["growth"],text:"自己约模拟中心空闲时段加练",sub:"没有额外资源，就自己挤时间。",effects:{knowledge:6,energy:-5,mental:2},flags:["selfTraining"],next:"internship"}
    ],
    postgrad:[
      {profile:["elite_research"],text:"尝试高强度科研衔接路线",sub:"更早进入课题组，但科研考核也提前。",effects:{research:12,mental:-6,energy:-5},requires:{stats:{research:25}},flags:["researchFastTrack"],next:"mentor"},
      {profile:["elite_clinical"],text:"争取留在强附属医院继续临床培养",sub:"平台强，名额也抢手。",effects:{knowledge:8,reputation:6,mental:-5},requires:{stats:{knowledge:55}},flags:["hospitalTrack"],next:"mentor"},
      {profile:["innovation"],text:"申请交叉方向研究生项目",sub:"医学+AI/工程成为主线。",effects:{research:10,knowledge:5,mental:-3},requires:{stats:{research:20}},flags:["crossPostgrad"],next:"mentor"},
      {profile:["regional_clinical","growth"],text:"跨校考研完成平台跃迁",sub:"下一次考试可能重新洗牌。",effects:{knowledge:9,mental:-7,energy:-6},chance:{p:.52,bonusBy:["knowledge","resilience"],success:{reputation:7,mental:7},fail:{mental:-8}},flags:["platformJump"],next:"examPrep"}
    ]
  },

  ecoEvents: {
    eco_lab_rotation:{stage:"院校生态 · 科研",year:"本科阶段",title:"多个实验室同时开放轮转",type:"school",triggerScenes:["orientation","lab","pathology"],text:"学校资源很多，但你不可能同时抓住所有机会。你必须在兴趣、产出和导师风格之间做选择。",choices:[
      {text:"选最前沿但最卷的组",sub:"机会大，压力也大。",effects:{research:8,energy:-6,mental:-5},flags:["highRiskLab"],next:"__RETURN__"},
      {text:"选导师风格更适合自己的组",sub:"成长速度可能更稳定。",effects:{research:6,mental:4,reputation:2},flags:["mentorFit"],next:"__RETURN__"}
    ]},
    eco_global_exchange:{stage:"院校生态 · 国际",year:"本科阶段",title:"海外暑研 / 交换名额出现了",type:"school",triggerScenes:["cet4","lab","clinic"],text:"这是一次扩大视野的机会，但英语、成绩和材料准备都会成为门槛。",choices:[
      {text:"冲一次申请",sub:"准备材料会占掉不少时间。",effects:{knowledge:3,research:4,energy:-5},chance:{p:.44,bonusBy:["knowledge"],success:{reputation:7,research:5,mental:5},fail:{mental:-3}},flags:["globalTry"],next:"__RETURN__"},
      {text:"先把国内课程和科研做好",sub:"机会不止一次。",effects:{knowledge:4,mental:3},next:"__RETURN__"}
    ]},
    eco_peer_pressure:{stage:"院校生态 · 竞争",year:"本科阶段",title:"身边的人怎么都这么强",type:"school",triggerScenes:["orientation","finals","lab"],text:"室友拿奖、同学发文章、学长进顶尖项目。资源越多，比较也越频繁。",choices:[
      {text:"把比较变成计划",sub:"只和昨天的自己比。",effects:{knowledge:4,research:3,mental:-2},flags:["healthyCompetition"],next:"__RETURN__"},
      {text:"开始疯狂加码",sub:"短期提升，长期有代价。",effects:{knowledge:6,research:5,energy:-7,mental:-7},flags:["overCompetition"],next:"__RETURN__"},
      {text:"主动退出无意义比较",sub:"保住节奏。",effects:{mental:7,energy:3},flags:["selfPaced"],next:"__RETURN__"}
    ]},
    eco_big_project:{stage:"院校生态 · 科研",year:"本科阶段",title:"大型课题需要一个本科生助手",type:"school",triggerScenes:["lab","pathology"],text:"项目规格很高，但你进去后可能只是团队里很小的一颗螺丝钉。",choices:[
      {text:"加入大项目",sub:"见世面，但自主性有限。",effects:{research:8,reputation:4,energy:-5},flags:["bigProject"],next:"__RETURN__"},
      {text:"选一个小而完整的课题",sub:"规模小，但能自己做完。",effects:{research:6,knowledge:3,mental:2},flags:["ownProject"],next:"__RETURN__"}
    ]},
    eco_early_clinic:{stage:"院校生态 · 临床",year:"本科阶段",title:"早期临床观察名额",type:"school",triggerScenes:["orientation","anatomy","clinic"],text:"你有机会比课表更早走进真正的临床环境。",choices:[
      {text:"报名",sub:"会牺牲一些周末。",effects:{knowledge:6,reputation:4,energy:-4},flags:["earlyClinical"],next:"__RETURN__"},
      {text:"先把基础课学扎实",sub:"等课程走到临床再说。",effects:{knowledge:4,mental:2},next:"__RETURN__"}
    ]},
    eco_case_challenge:{stage:"院校生态 · 临床",year:"本科阶段",title:"复杂病例挑战",type:"school",triggerScenes:["pathology","clinic","skills"],text:"带教老师给出一个复杂病例，要求团队在有限时间内完成鉴别诊断和汇报。",choices:[
      {text:"主动做主汇报",sub:"压力最大，成长也最快。",effects:{knowledge:7,reputation:5,mental:-3},flags:["caseLeader"],next:"__RETURN__"},
      {text:"负责查文献与证据",sub:"稳扎稳打。",effects:{knowledge:5,research:4},flags:["evidenceBased"],next:"__RETURN__"}
    ]},
    eco_specialty_center:{stage:"院校生态 · 专科",year:"本科阶段",title:"专科中心开放学生体验",type:"school",triggerScenes:["clinic","skills","internship"],text:"多个高水平专科同时开放体验，你第一次认真想象自己未来会在哪个科室。",choices:[
      {text:"选自己最感兴趣的",sub:"兴趣先行。",effects:{knowledge:5,mental:4},flags:["earlySpecialtyInterest"],next:"__RETURN__"},
      {text:"选竞争最激烈的",sub:"看看自己的上限。",effects:{knowledge:6,reputation:3,mental:-4},flags:["challengeSpecialty"],next:"__RETURN__"}
    ]},
    eco_cross_discipline:{stage:"院校生态 · 交叉",year:"本科阶段",title:"医工交叉项目招新",type:"school",triggerScenes:["lab","pathology","skills"],text:"队伍里有医学生、工程学生和计算机学生。每个人说的“模型”都不是一回事。",choices:[
      {text:"加入并补技术基础",sub:"学习曲线很陡。",effects:{research:8,knowledge:4,energy:-6},flags:["crossDiscipline"],next:"__RETURN__"},
      {text:"只做医学问题顾问",sub:"保留临床主线。",effects:{knowledge:5,research:3,reputation:3},next:"__RETURN__"}
    ]},
    eco_ai_project:{stage:"院校生态 · AI",year:"本科阶段",title:"医学AI项目需要临床标注与问题定义",type:"school",triggerScenes:["lab","skills"],text:"你发现AI不是“按一下按钮”，真正困难的是数据、标注、临床问题和验证。",choices:[
      {text:"深入做下去",sub:"走向交叉路线。",effects:{research:8,knowledge:4,energy:-5},flags:["aiMedicine"],next:"__RETURN__"},
      {text:"只参与短期项目",sub:"先体验，不改变主线。",effects:{research:4,reputation:2},next:"__RETURN__"}
    ]},
    eco_research_competition:{stage:"院校生态 · 竞赛",year:"本科阶段",title:"校级医学创新项目",type:"school",triggerScenes:["lab","pathology"],text:"项目名额有限，但导师和评审体系比较成熟。",choices:[
      {text:"认真准备申报",sub:"把科研做成一个完整项目。",effects:{research:7,energy:-5},chance:{p:.52,bonusBy:["research","knowledge"],success:{reputation:6,mental:4},fail:{mental:-2}},flags:["studentProject"],next:"__RETURN__"},
      {text:"加入别人项目积累经验",sub:"先学流程。",effects:{research:5,reputation:2},next:"__RETURN__"}
    ]},
    eco_scholarship:{stage:"院校生态 · 奖学金",year:"本科阶段",title:"奖学金评定开始",type:"school",triggerScenes:["finals","pathology"],text:"成绩、综合表现、科研与社会活动一起进入评定。",choices:[
      {text:"冲奖学金",sub:"最后一个月继续卷。",effects:{knowledge:4,energy:-4,mental:-2},chance:{p:.55,bonusBy:["knowledge","reputation"],success:{money:7,reputation:4,mental:4},fail:{mental:-2}},flags:["scholarshipTry"],next:"__RETURN__"},
      {text:"不为了排名额外消耗",sub:"保住自己的节奏。",effects:{mental:5,energy:3},next:"__RETURN__"}
    ]},
    eco_regional_rotation:{stage:"院校生态 · 临床",year:"本科阶段",title:"区域附属医院轮转",type:"school",triggerScenes:["clinic","skills","internship"],text:"病例量不小，老师也更希望学生真正上手。",choices:[
      {text:"主动跟诊和练基本功",sub:"临床成长很实在。",effects:{knowledge:7,reputation:4,energy:-4},flags:["regionalClinical"],next:"__RETURN__"},
      {text:"把时间分给考研准备",sub:"平台跃迁也很重要。",effects:{knowledge:5,mental:-2},flags:["examEarly"],next:"__RETURN__"}
    ]},
    eco_local_network:{stage:"院校生态 · 人脉",year:"本科阶段",title:"本地医院老师记住了你",type:"school",triggerScenes:["clinic","internship"],text:"区域医学网络的优势开始显现：如果留在本地，这段关系可能很有价值。",choices:[
      {text:"继续维护本地临床关系",sub:"留本地发展的路径更清楚。",effects:{reputation:6,knowledge:3},flags:["localNetwork"],next:"__RETURN__"},
      {text:"还是准备去更大的平台",sub:"不提前锁定城市。",effects:{knowledge:4,mental:1},flags:["platformAmbition"],next:"__RETURN__"}
    ]},
    eco_exam_jump:{stage:"院校生态 · 升学",year:"本科阶段",title:"“下一次考试可以重新洗牌”",type:"school",triggerScenes:["finals","lab","internship"],text:"身边越来越多同学开始把考研当成平台跃迁的关键节点。",choices:[
      {text:"提前一年规划考研",sub:"目标院校、英语和专业课一起布局。",effects:{knowledge:6,mental:-3,energy:-3},flags:["examEarly"],next:"__RETURN__"},
      {text:"先把本科能力做扎实",sub:"不让未来焦虑吃掉现在。",effects:{knowledge:4,mental:4},next:"__RETURN__"}
    ]},
    eco_resource_hunt:{stage:"院校生态 · 资源",year:"本科阶段",title:"机会不会自动送上门",type:"school",triggerScenes:["orientation","lab","clinic"],text:"想做科研、竞赛或提前见习，都需要你自己问老师、找学长、发邮件。",choices:[
      {text:"主动争取",sub:"被拒绝几次也继续问。",effects:{reputation:3,research:4,mental:-2},chance:{p:.48,bonusBy:["communication","knowledge"],success:{research:5,mental:5},fail:{mental:-2}},flags:["selfMadeOpportunity"],next:"__RETURN__"},
      {text:"先把成绩做到前面",sub:"用成绩换下一次机会。",effects:{knowledge:6,energy:-3},flags:["gradeFirst"],next:"__RETURN__"}
    ]},
    eco_grassroots_rotation:{stage:"院校生态 · 基层",year:"本科阶段",title:"基层医疗实践",type:"school",triggerScenes:["clinic","internship"],text:"设备和资源并不总是齐全，很多决定更依赖基本功和沟通。",choices:[
      {text:"认真跟完整个流程",sub:"重新理解什么叫“够用的医学”。",effects:{knowledge:5,reputation:5,mental:3},flags:["grassrootsMedicine"],next:"__RETURN__"},
      {text:"重点观察转诊和资源限制",sub:"理解医疗系统本身。",effects:{knowledge:4,research:2,reputation:3},flags:["systemThinking"],next:"__RETURN__"}
    ]},
    eco_parttime_pressure:{stage:"院校生态 · 现实",year:"本科阶段",title:"生活费和学习时间开始冲突",type:"school",triggerScenes:["anatomy","finals"],text:"你需要决定，有限的时间是换成绩、换钱，还是换休息。",choices:[
      {text:"接兼职缓解经济压力",sub:"金钱增加，时间减少。",effects:{money:7,energy:-5,knowledge:-1},flags:["partTime"],next:"__RETURN__"},
      {text:"压缩开支专注学习",sub:"短期更紧，但时间留下来了。",effects:{money:-2,knowledge:4,mental:-2},flags:["frugal"],next:"__RETURN__"}
    ]}
  }
};