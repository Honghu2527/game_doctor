window.BACKGROUND_DATA = {
  note:"出生条件只作为游戏资源与机会差异，不代表现实中任何群体的能力、价值或必然结果。",
  hometowns:{
    mega:{name:"超大城市 / 一线城市",desc:"信息和培训机会更多，生活成本与比较压力也更高。",mods:{money:-2,mental:-1},resources:{info:5,support:3,cost:5},scoreShift:5},
    capital:{name:"省会 / 强二线城市",desc:"教育与医疗资源较集中，机会和成本相对平衡。",mods:{money:-1},resources:{info:4,support:3,cost:4},scoreShift:3},
    city:{name:"普通地级市",desc:"资源相对稳定，很多机会需要主动寻找。",mods:{mental:1},resources:{info:3,support:3,cost:3},scoreShift:0},
    county:{name:"县城",desc:"生活成本较低，但升学与科研信息更依赖自己搜集。",mods:{money:2,mental:1},resources:{info:2,support:3,cost:2},scoreShift:-3},
    rural:{name:"乡镇 / 农村",desc:"生活成本低，信息与培训机会较少，后续平台跃迁更重要。",mods:{money:3,mental:1},resources:{info:1,support:3,cost:1},scoreShift:-6}
  },
  onlyChild:{
    yes:{name:"独生子女",desc:"家庭资源更集中，同时家庭期待和未来照护压力可能更集中。",mods:{money:2,mental:-1},resources:{familyPressure:4,familySupport:4}},
    no:{name:"有兄弟姐妹",desc:"家庭资源需要分享，但家庭责任与支持结构也不同。",mods:{money:-1,mental:1},resources:{familyPressure:3,familySupport:3}}
  },
  economy:{
    tight:{name:"家庭经济紧张",desc:"兼职、奖学金、住宿和海外机会的经济成本更敏感。",mods:{money:-12,mental:-2},resources:{finance:1},scoreShift:-5},
    ordinary:{name:"普通工薪家庭",desc:"大多数选择需要算成本，但基本学习投入可以维持。",mods:{money:0},resources:{finance:3},scoreShift:0},
    comfortable:{name:"家庭经济宽裕",desc:"考试培训、交换和城市生活成本压力更小。",mods:{money:10,mental:1},resources:{finance:4},scoreShift:3},
    affluent:{name:"家庭条件优越",desc:"经济选择空间很大，但并不自动转化为成绩或职业能力。",mods:{money:18},resources:{finance:5},scoreShift:5}
  },
  education:{
    firstgen:{name:"家中第一代大学生",desc:"很多升学规则需要自己摸索，信息差会更明显。",mods:{mental:-1},resources:{infoBonus:-1},scoreShift:-3},
    college:{name:"父母有高等教育经历",desc:"对升学流程和学历路径相对熟悉。",mods:{knowledge:1},resources:{infoBonus:1},scoreShift:2},
    academic:{name:"家庭教育资源较强",desc:"对升学规划、英语和信息搜集更熟悉，但家庭期待也可能更高。",mods:{knowledge:2,mental:-1},resources:{infoBonus:2,familyPressure:1},scoreShift:4}
  },
  medicalFamily:{
    none:{name:"非医学家庭",desc:"对医学职业的真实工作方式需要自己逐渐了解。",mods:{},resources:{medicalInfo:1}},
    one:{name:"家中有人从事医疗相关工作",desc:"更早知道医院、规培和职业路径的一些现实信息。",mods:{reputation:1},resources:{medicalInfo:3}},
    strong:{name:"医学家庭背景较强",desc:"职业信息与临床环境更熟悉，但家庭期待也可能更明确。",mods:{reputation:2,mental:-1},resources:{medicalInfo:5,familyPressure:1}}
  }
};