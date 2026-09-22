(function(){
  "use strict";
  var O=window.OPPORTUNITY_DATA;
  if(!O)return;

  Object.assign(O.byApplication,{
    "专科奖学金":"college_scholarship",
    "专科优质实习":"college_internship_slot",
    "专升本强化计划":"college_upgrade_program",
    "专科基层实践":"college_primary_project"
  });

  Object.assign(O.flows,{
    college_scholarship:{
      name:"专科奖学金",returnNext:"college_internship",start:"focus",
      steps:{
        focus:{stage:"申请 1/2 · 专科奖学金",year:"19岁",title:"评审材料主打哪一项？",type:"application",text:"成绩、技能、实践和综合表现都能加分，但你需要突出一个核心。",
          choices:[
            {text:"主打理论成绩",sub:"知识提升，但会占用实训时间。",effects:{knowledge:4,energy:-2},flags:["collegeAwardGrade"],nextStep:"review"},
            {text:"主打技能与实践",sub:"突出实训和临床表现。",effects:{reputation:3,energy:-2},talentEffects:{dexterity:1},flags:["collegeAwardSkill"],nextStep:"review"}
          ]},
        review:{stage:"申请 2/2 · 专科奖学金",year:"19岁",title:"综合评审",type:"application",text:"材料进入最终评审。",
          choices:[{text:"查看结果",sub:"知识、声望和技能共同影响。",effects:{},chance:{p:.38,bonusBy:["knowledge","reputation","dexterity"],success:{money:8,reputation:4,mental:4},fail:{mental:-2},successFlags:["collegeScholarship"],failFlags:["collegeScholarshipFail"]},successStep:"success",failStep:"fail"}]},
        success:{stage:"结果 · 专科奖学金",year:"19岁",title:"你拿到了奖学金",type:"resultSuccess",text:"这笔钱和这项荣誉都能缓解一点现实压力。",
          choices:[{text:"留作升学与考试预算",sub:"为后面保留资源。",effects:{money:5,mental:2},endFlow:true},{text:"投入技能和课程",sub:"继续强化能力。",effects:{knowledge:3,money:-2},talentEffects:{dexterity:1},endFlow:true}]},
        fail:{stage:"结果 · 专科奖学金",year:"19岁",title:"这次没拿到",type:"resultFail",text:"评审很看综合排序，一次失败不代表你前面的训练白费。",
          choices:[{text:"继续下一阶段",sub:"把注意力拉回实习和升学。",effects:{mental:3},talentEffects:{resilience:1},endFlow:true}]}
      }
    },

    college_internship_slot:{
      name:"优质医院实习",returnNext:"college_internship",start:"target",
      steps:{
        target:{stage:"申请 1/3 · 优质实习",year:"19岁",title:"你想申请哪类实习医院？",type:"application",text:"大医院病例多，区域医院上手机会多，基层机构能看到完整连续的患者管理。",
          choices:[
            {text:"大型综合医院",sub:"竞争最高，病例复杂。",effects:{knowledge:2,mental:-2},flags:["collegeInternTop"],nextStep:"prep"},
            {text:"区域中心医院",sub:"上手机会和病例量相对平衡。",effects:{reputation:2},flags:["collegeInternRegional"],nextStep:"prep"},
            {text:"基层实践基地",sub:"沟通和综合处理机会多。",effects:{reputation:2},talentEffects:{communication:1},flags:["collegeInternPrimary"],nextStep:"prep"}
          ]},
        prep:{stage:"申请 2/3 · 优质实习",year:"19岁",title:"带教老师面试前怎么准备？",type:"application",text:"老师会问基础知识，也会看你是否真的愿意干活。",
          choices:[
            {text:"补理论和病例知识",sub:"提高专业问答表现。",effects:{knowledge:4,energy:-3},nextStep:"review"},
            {text:"练操作和沟通",sub:"突出实操适配度。",effects:{reputation:2,energy:-3},talentEffects:{dexterity:2,communication:1},nextStep:"review"}
          ]},
        review:{stage:"申请 3/3 · 优质实习",year:"19岁",title:"实习名额最终选拔",type:"application",text:"名额有限，学校表现和临床适配度一起进入判断。",
          choices:[{text:"参加选拔",sub:"知识、动手、沟通和临床资源影响。",effects:{},chance:{p:.40,bonusBy:["knowledge","dexterity","communication","clinicalAccess"],success:{reputation:5,mental:4},fail:{mental:-2},successFlags:["collegePremiumIntern"],failFlags:["collegePremiumInternFail"]},successStep:"success",failStep:"fail"}]},
        success:{stage:"结果 · 优质实习",year:"19-20岁",title:"你拿到了优质实习名额",type:"resultSuccess",text:"这意味着更好的病例、带教和推荐，但也会更忙。",
          choices:[{text:"把实习机会用到极致",sub:"临床成长明显。",effects:{knowledge:7,reputation:5,energy:-4},talentEffects:{dexterity:2},endFlow:true}]},
        fail:{stage:"结果 · 优质实习",year:"19岁",title:"没有进入首选实习点",type:"resultFail",text:"你仍然会实习，只是平台没有那么理想。",
          choices:[{text:"在现有实习点争取上手机会",sub:"平台不是全部。",effects:{knowledge:4,reputation:2,mental:3},talentEffects:{resilience:1},endFlow:true}]}
      }
    },

    college_upgrade_program:{
      name:"专升本强化计划",returnNext:"college_internship",start:"commit",
      steps:{
        commit:{stage:"申请 1/3 · 专升本强化计划",year:"19岁",title:"强化计划要求固定晚自习和周末课程",type:"application",text:"加入以后，技能竞赛和兼职时间都会明显减少。",
          choices:[
            {text:"接受高强度安排",sub:"升学准备更完整。",effects:{knowledge:4,energy:-4,mental:-2},talentEffects:{english:1,resilience:1},flags:["collegeUpgradeCommit"],nextStep:"test"},
            {text:"申请弹性安排",sub:"保留一些实训时间，但竞争力略低。",effects:{knowledge:3,energy:-2},flags:["collegeUpgradeFlexible"],nextStep:"test"}
          ]},
        test:{stage:"申请 2/3 · 专升本强化计划",year:"19岁",title:"入选测试",type:"application",text:"测试更看理论基础、英语和持续学习能力。",
          choices:[{text:"参加测试",sub:"知识、英语和抗压影响结果。",effects:{},chance:{p:.46,bonusBy:["knowledge","english","resilience"],success:{mental:4},fail:{mental:-2},successFlags:["collegeUpgradeProgram"],failFlags:["collegeUpgradeProgramFail"]},successStep:"success",failStep:"fail"}]},
        success:{stage:"结果 · 专升本强化计划",year:"19岁",title:"你进入了强化计划",type:"resultSuccess",text:"后面的考试准备会更系统，但你的时间也会更紧。",
          choices:[{text:"坚持到毕业",sub:"显著提高升学准备质量。",effects:{knowledge:6,energy:-3},talentEffects:{english:2,resilience:1},flags:["collegeUpgradePrepared"],endFlow:true}]},
        fail:{stage:"结果 · 专升本强化计划",year:"19岁",title:"没有进入强化班",type:"resultFail",text:"你仍然可以自学准备专升本。",
          choices:[{text:"自己制定复习计划",sub:"自主性更高。",effects:{knowledge:4,mental:2},talentEffects:{resilience:1},flags:["collegeUpgradeSelfStudy"],endFlow:true}]}
      }
    },

    college_primary_project:{
      name:"基层医疗实践",returnNext:"college_internship",start:"site",
      steps:{
        site:{stage:"申请 1/2 · 基层实践",year:"19岁",title:"你更想去哪里？",type:"application",text:"社区、乡镇和区域基层实践看到的问题并不一样。",
          choices:[
            {text:"社区卫生服务场景",sub:"慢病管理和沟通更重要。",effects:{reputation:2},talentEffects:{communication:2},flags:["collegeCommunity"],nextStep:"selection"},
            {text:"乡镇/基层医疗场景",sub:"资源限制和综合判断更突出。",effects:{knowledge:2},talentEffects:{resilience:2},flags:["collegeRural"],nextStep:"selection"}
          ]},
        selection:{stage:"申请 2/2 · 基层实践",year:"19岁",title:"实践项目选拔",type:"application",text:"项目更看责任感、沟通和适应能力。",
          choices:[{text:"参加选拔",sub:"沟通、抗压和声望影响结果。",effects:{},chance:{p:.50,bonusBy:["communication","resilience","reputation"],success:{reputation:4,mental:3},fail:{mental:-1},successFlags:["collegePrimaryProject"],failFlags:["collegePrimaryProjectFail"]},successStep:"success",failStep:"fail"}]},
        success:{stage:"结果 · 基层实践",year:"19-20岁",title:"你进入了基层实践项目",type:"resultSuccess",text:"你会更早看到患者从第一次就诊到长期随访的完整过程。",
          choices:[{text:"认真跟完整个项目",sub:"综合能力提升。",effects:{knowledge:5,reputation:6,energy:-3},talentEffects:{communication:2,resilience:1},endFlow:true}]},
        fail:{stage:"结果 · 基层实践",year:"19岁",title:"名额不足",type:"resultFail",text:"这次没进项目，但你仍然可以在普通实习里积累经验。",
          choices:[{text:"继续正常实训",sub:"不让一次名额影响节奏。",effects:{knowledge:3,mental:3},endFlow:true}]}
      }
    }
  });
})();