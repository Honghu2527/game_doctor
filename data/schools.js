window.SCHOOL_DATA = {
  bands: [
    {min:710,max:750,label:"顶尖医学平台区间",note:"极少数高分局，科研与升学竞争会非常激烈。"},
    {min:685,max:709,label:"头部医学院校区间",note:"临床与科研资源都很强，同时意味着更高的同伴竞争。"},
    {min:655,max:684,label:"强势医学院校区间",note:"可选择强势综合大学医学部或头部医科大学。"},
    {min:630,max:654,label:"重点医科大学区间",note:"区域影响力强，临床训练与升学路线较完整。"},
    {min:605,max:629,label:"区域医学强校区间",note:"更看重后续努力，学校只是人生的第一张牌。"},
    {min:575,max:604,label:"地方医学本科区间",note:"临床路径仍然完整，后续考研与规培会成为关键分岔。"},
    {min:530,max:574,label:"临床医学冲刺区间",note:"开局更艰难，但并不代表结局被锁死。"}
  ],

  schools: [
    {id:"pkuhsc",name:"北京大学医学部",city:"北京",minScore:716,level:5,pressure:1.16,cost:5,research:5,clinical:5,mods:{knowledge:5,research:10,reputation:8,mental:-5,money:-5},traits:["科研竞争极高","临床资源丰富","城市成本高"],flavor:"同学很强，机会很多，焦虑也来得很早。"},
    {id:"sjtu_med",name:"上海交通大学医学院",city:"上海",minScore:712,level:5,pressure:1.15,cost:5,research:5,clinical:5,mods:{knowledge:5,research:9,reputation:8,mental:-5,money:-5},traits:["科研竞争极高","附属医院资源强","城市成本高"],flavor:"你很快发现，优秀在这里往往只是起点。"},
    {id:"fudan_med",name:"复旦大学上海医学院",city:"上海",minScore:710,level:5,pressure:1.15,cost:5,research:5,clinical:5,mods:{knowledge:5,research:9,reputation:8,mental:-5,money:-5},traits:["学术氛围浓","临床平台强","城市成本高"],flavor:"课程、科研和未来规划会很早同时出现。"},
    {id:"zju_med",name:"浙江大学医学院",city:"杭州",minScore:704,level:5,pressure:1.13,cost:4,research:5,clinical:5,mods:{knowledge:5,research:9,reputation:7,mental:-4,money:-3},traits:["交叉科研机会多","同伴竞争强","升学导向明显"],flavor:"医学之外，你还会不断遇见工程、AI和交叉学科。"},
    {id:"scu_huaxi",name:"四川大学华西医学中心",city:"成都",minScore:696,level:5,pressure:1.12,cost:3,research:5,clinical:5,mods:{knowledge:6,research:8,reputation:7,mental:-3,money:-1},traits:["临床训练强","科研平台强","专业认同感高"],flavor:"你开始频繁听见“华西”两个字背后的分量。"},
    {id:"csu_xiangya",name:"中南大学湘雅医学院",city:"长沙",minScore:692,level:5,pressure:1.11,cost:3,research:5,clinical:5,mods:{knowledge:6,research:7,reputation:7,mental:-3},traits:["临床传统强","科研竞争高","培养节奏快"],flavor:"老牌医学传统给你底气，也给你压力。"},
    {id:"sysu_med",name:"中山大学中山医学院",city:"广州",minScore:690,level:5,pressure:1.11,cost:4,research:5,clinical:5,mods:{knowledge:5,research:8,reputation:7,mental:-3,money:-2},traits:["附属医院多","科研机会多","城市成本较高"],flavor:"大平台意味着更多选择，也意味着更早做选择。"},
    {id:"hust_tongji",name:"华中科技大学同济医学院",city:"武汉",minScore:686,level:5,pressure:1.11,cost:3,research:5,clinical:5,mods:{knowledge:6,research:7,reputation:7,mental:-3},traits:["临床资源强","科研氛围浓","同伴竞争高"],flavor:"你很快会认识一批同样目标明确的人。"},

    {id:"ccmu",name:"首都医科大学",city:"北京",minScore:676,level:4,pressure:1.10,cost:5,research:4,clinical:5,mods:{knowledge:7,research:6,reputation:6,mental:-4,money:-5},traits:["临床资源密集","城市机会多","生活成本高"],flavor:"医院很多，机会很多，通勤和房租也很真实。"},
    {id:"smu",name:"南方医科大学",city:"广州",minScore:668,level:4,pressure:1.08,cost:4,research:4,clinical:5,mods:{knowledge:6,research:6,reputation:5,mental:-2,money:-2},traits:["临床导向强","科研机会多","节奏较快"],flavor:"你会很早接触临床，也会很早面对竞争。"},
    {id:"njmu",name:"南京医科大学",city:"南京",minScore:664,level:4,pressure:1.08,cost:4,research:4,clinical:4,mods:{knowledge:6,research:6,reputation:5,mental:-2,money:-2},traits:["科研训练扎实","升学氛围浓","城市资源好"],flavor:"你会发现周围很多人从大一就在规划保研。"},
    {id:"tmu",name:"天津医科大学",city:"天津",minScore:660,level:4,pressure:1.07,cost:4,research:4,clinical:4,mods:{knowledge:6,research:5,reputation:5,mental:-2,money:-2},traits:["医学平台完整","升学路径清晰","临床资源稳定"],flavor:"路线清楚以后，真正难的是坚持走完。"},
    {id:"cmu",name:"中国医科大学",city:"沈阳",minScore:656,level:4,pressure:1.07,cost:3,research:4,clinical:4,mods:{knowledge:6,research:5,reputation:5,mental:-1},traits:["医学底蕴深","临床训练扎实","成本相对友好"],flavor:"传统医学强校的节奏，会让你逐渐变得务实。"},

    {id:"cqmu",name:"重庆医科大学",city:"重庆",minScore:648,level:4,pressure:1.06,cost:3,research:4,clinical:4,mods:{knowledge:6,research:5,reputation:4,mental:-1},traits:["区域临床资源强","儿科等方向突出","城市成本适中"],flavor:"你会越来越早意识到，选科室也是选人生。"},
    {id:"hrbmu",name:"哈尔滨医科大学",city:"哈尔滨",minScore:644,level:4,pressure:1.06,cost:2,research:4,clinical:4,mods:{knowledge:6,research:5,reputation:4,energy:-1,money:1},traits:["医学体系完整","科研训练稳定","生活成本较低"],flavor:"冬天很长，考试周更长。"},
    {id:"gzhmu",name:"广州医科大学",city:"广州",minScore:640,level:4,pressure:1.05,cost:4,research:4,clinical:4,mods:{knowledge:5,research:5,reputation:4,money:-2},traits:["临床实践机会多","城市机会多","生活成本较高"],flavor:"城市给你的机会和诱惑一样多。"},
    {id:"dmu",name:"大连医科大学",city:"大连",minScore:636,level:3,pressure:1.04,cost:3,research:3,clinical:4,mods:{knowledge:5,research:4,reputation:3,mental:1},traits:["临床训练稳定","学习节奏扎实","生活体验平衡"],flavor:"海风治不了解剖学，但多少能治一点焦虑。"},
    {id:"wmu",name:"温州医科大学",city:"温州",minScore:632,level:4,pressure:1.06,cost:3,research:4,clinical:4,mods:{knowledge:5,research:5,reputation:4,mental:-1},traits:["专业特色鲜明","科研活跃","成长速度快"],flavor:"你会发现地方医科大学一样可以卷得很专业。"},

    {id:"ahmu",name:"安徽医科大学",city:"合肥",minScore:620,level:3,pressure:1.03,cost:2,research:3,clinical:4,mods:{knowledge:5,research:3,reputation:3,money:1},traits:["区域资源稳定","临床路径完整","成本较友好"],flavor:"后面的考研、科研和规培会比学校标签更重要。"},
    {id:"fjmu",name:"福建医科大学",city:"福州",minScore:615,level:3,pressure:1.03,cost:3,research:3,clinical:4,mods:{knowledge:5,research:3,reputation:3},traits:["区域认可度高","临床训练稳定","发展路线务实"],flavor:"这是一个更需要自己主动找机会的开局。"},
    {id:"hebmu",name:"河北医科大学",city:"石家庄",minScore:610,level:3,pressure:1.03,cost:2,research:3,clinical:4,mods:{knowledge:5,research:3,reputation:3,money:1},traits:["临床基础扎实","区域资源稳定","成本较低"],flavor:"日子朴素，但医学知识一点都不会少背。"},
    {id:"gxmu",name:"广西医科大学",city:"南宁",minScore:604,level:3,pressure:1.02,cost:2,research:3,clinical:4,mods:{knowledge:5,research:3,reputation:3,money:1,mental:1},traits:["区域临床资源强","发展空间稳定","生活压力较低"],flavor:"不在最卷的城市，也并不代表医学会轻松。"},
    {id:"kmmu",name:"昆明医科大学",city:"昆明",minScore:596,level:3,pressure:1.01,cost:2,research:3,clinical:4,mods:{knowledge:4,research:3,reputation:2,mental:2},traits:["区域医疗需求大","生活节奏相对舒缓","临床机会稳定"],flavor:"天气很好，但期末周不会因为天气好就取消。"},
    {id:"xzhmu",name:"徐州医科大学",city:"徐州",minScore:600,level:3,pressure:1.03,cost:2,research:3,clinical:4,mods:{knowledge:5,research:3,reputation:3,money:1},traits:["临床导向明确","区域资源稳定","专业训练扎实"],flavor:"平台够用，后面的差距要靠你自己拉开。"},
    {id:"sxmu",name:"山西医科大学",city:"太原",minScore:586,level:3,pressure:1.01,cost:2,research:3,clinical:3,mods:{knowledge:4,research:2,reputation:2,money:1},traits:["培养体系稳定","成本较低","需要主动争取机会"],flavor:"你的上限越来越取决于后面的选择。"},
    {id:"zymu",name:"遵义医科大学",city:"遵义",minScore:580,level:2,pressure:1.00,cost:1,research:2,clinical:3,mods:{knowledge:4,research:2,reputation:2,money:2,mental:1},traits:["临床训练务实","生活成本低","升学改变路径"],flavor:"不是最耀眼的开局，但足够让你把临床基本功练起来。"},
    {id:"swmu",name:"西南医科大学",city:"泸州",minScore:572,level:2,pressure:1.00,cost:1,research:2,clinical:3,mods:{knowledge:4,research:2,reputation:2,money:2,mental:1},traits:["临床导向明确","生活成本低","后续升学很关键"],flavor:"从这里开始，努力的权重会越来越大。"},
    {id:"nxmu",name:"宁夏医科大学",city:"银川",minScore:566,level:2,pressure:.99,cost:1,research:2,clinical:3,mods:{knowledge:4,research:2,reputation:2,money:2,mental:2},traits:["区域医疗需求高","生活成本较低","机会靠主动争取"],flavor:"学校只是地图的一部分，真正的路线还在后面。"},
    {id:"gannan",name:"赣南医科大学",city:"赣州",minScore:558,level:2,pressure:.99,cost:1,research:2,clinical:3,mods:{knowledge:4,research:1,reputation:2,money:2,mental:2},traits:["临床路径完整","成本较低","考研节点关键"],flavor:"你需要比别人更早思考下一次跃迁。"},
    {id:"xinxiang",name:"新乡医学院",city:"新乡",minScore:550,level:2,pressure:.98,cost:1,research:2,clinical:3,mods:{knowledge:4,research:1,reputation:2,money:3,mental:2},traits:["医学培养稳定","生活成本低","升学影响明显"],flavor:"这里的开局更朴素，也更考验长期积累。"},
    {id:"bengbu",name:"蚌埠医科大学",city:"蚌埠",minScore:545,level:2,pressure:.98,cost:1,research:2,clinical:3,mods:{knowledge:3,research:1,reputation:2,money:3,mental:2},traits:["临床训练务实","生活压力较低","后续选择重要"],flavor:"你没有太多光环，但有足够长的时间改变结局。"},
    {id:"regional_med",name:"地方医学院（游戏虚拟校）",city:"家乡省会",minScore:530,level:2,pressure:0.98,cost:1,research:2,clinical:3,mods:{knowledge:3,research:1,reputation:1,money:3,mental:2},traits:["生活成本较低","资源需要主动争取","升学改变路径"],flavor:"没有耀眼校名加持，你需要用后面的十几年证明自己。"}
  ]
};