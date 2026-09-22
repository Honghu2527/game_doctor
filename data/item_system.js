window.ITEM_DATA = {
  items:{
    energy_card:{
      id:"energy_card",name:"体力恢复卡",icon:"⚡",desc:"体力 +15。用于高压学习、值班与科研阶段的资源恢复。",
      effect:{energy:15},max:5,adReward:true
    },
    mental_card:{
      id:"mental_card",name:"心理恢复卡",icon:"🧠",desc:"心理 +15。让角色从持续压力中恢复一部分。",
      effect:{mental:15},max:5,adReward:true
    },
    english_card:{
      id:"english_card",name:"英语训练卡",icon:"EN",desc:"英语 +5。不能在考研、申博、录取或求职竞争流程中使用。",
      effect:{english:5},max:5,adReward:true
    },
    hint_card:{
      id:"hint_card",name:"决策提示卡",icon:"💡",desc:"显示当前非竞争性关键选择可能影响的属性和路线，不提供“正确答案”。",
      action:"hint",max:3,adReward:true
    },
    rewind_card:{
      id:"rewind_card",name:"人生回溯卡",icon:"↶",desc:"回到最近一个允许回溯的关键人生节点。不能用于重抽考研、申博或求职结果。",
      action:"rewind",max:2,adReward:true
    }
  },
  defaultInventory:{
    energy_card:0,
    mental_card:0,
    english_card:0,
    hint_card:0,
    rewind_card:0
  },
  crisisThresholds:{energy:20,mental:20},
  competitiveScenePattern:"^(edu_master|edu_phd|grad_exam|exam_fail|recommended_postgrad|job_|__OPPORTUNITY_FLOW__)"
};