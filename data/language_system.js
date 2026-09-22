window.LANGUAGE_DATA = {
  pools:{
    undergrad:["lang_cet_strategy","lang_paper_reading","lang_case_english"],
    master:["lang_journal_club","lang_abstract_revision","lang_foreign_round"],
    phd:["lang_conference_qa","lang_peer_review"],
    career:["lang_guideline_update","lang_international_mdt"]
  },
  events:{
    lang_cet_strategy:{
      stage:"本科支线 · 英语",year:"19-20岁",title:"四六级快到了，但专业课也在期中周",type:"language",
      text:"英语不会因为你进了医学院就停止使用。你只能决定它在这一阶段占多少时间。",
      choices:[
        {text:"每天固定半小时医学英语",sub:"进步慢，但稳定。",effects:{knowledge:2,energy:-2},talentEffects:{english:4},flags:["englishRoutine"],next:"__RETURN__"},
        {text:"考前集中突击",sub:"短期够用，长期积累较少。",effects:{mental:-2,knowledge:1},talentEffects:{english:2},next:"__RETURN__"},
        {text:"这学期先保专业课",sub:"英语基本不增长。",effects:{knowledge:3,mental:1},next:"__RETURN__"}
      ]},
    lang_paper_reading:{
      stage:"本科支线 · 英语",year:"20-22岁",title:"导师把一篇全英文论文发给你：明天组会讲",type:"language",
      text:"第一次读英文论文时，最费时间的不是专业知识，而是你还没有形成英文阅读节奏。",
      choices:[
        {text:"自己逐段读完并做术语表",sub:"耗时，但英文科研阅读明显进步。",effects:{research:3,energy:-3},talentEffects:{english:4,researchSense:1},next:"__RETURN__"},
        {text:"先读图表和摘要，再补正文",sub:"训练高效阅读。",effects:{research:2,knowledge:2},talentEffects:{english:3},next:"__RETURN__"},
        {text:"主要看中文解读",sub:"完成任务更快，但英语成长有限。",effects:{energy:1},talentEffects:{english:1},next:"__RETURN__"}
      ]},
    lang_case_english:{
      stage:"本科支线 · 英语",year:"21-23岁",title:"见习老师让你用英文做两分钟病例摘要",type:"language",
      text:"你知道病人发生了什么，但要用另一种语言把逻辑讲清楚，突然又变难了。",
      choices:[
        {text:"提前写稿并反复练习",sub:"表达和医学英语一起提高。",effects:{reputation:2,energy:-2},talentEffects:{english:4,communication:1},next:"__RETURN__"},
        {text:"抓住几个关键词现场讲",sub:"紧张，但更接近真实交流。",effects:{mental:-1},talentEffects:{english:3,resilience:1},next:"__RETURN__"}
      ]},
    lang_journal_club:{
      stage:"研究生支线 · 英语",year:"24-27岁",title:"Journal Club 轮到你讲英文原文",type:"language",
      text:"你发现科研英语已经不是考试科目，而是每天都要使用的工作工具。",
      choices:[
        {text:"把方法和结果都吃透再讲",sub:"阅读速度与学术表达一起成长。",effects:{research:4,energy:-3},talentEffects:{english:4,communication:1},next:"__RETURN__"},
        {text:"重点准备讨论部分",sub:"训练表达观点。",effects:{research:2,reputation:2},talentEffects:{english:3},next:"__RETURN__"}
      ]},
    lang_abstract_revision:{
      stage:"研究生支线 · 英语",year:"25-28岁",title:"英文摘要被导师改得满页都是修订痕迹",type:"language",
      text:"你开始意识到“能看懂”与“能写清楚”之间还隔着很远。",
      choices:[
        {text:"逐条理解为什么这样改",sub:"下一篇会写得更快。",effects:{research:3,energy:-2},talentEffects:{english:5},next:"__RETURN__"},
        {text:"先照着导师版本修改",sub:"论文能推进，但成长较少。",effects:{research:2},talentEffects:{english:2},next:"__RETURN__"}
      ]},
    lang_foreign_round:{
      stage:"研究生支线 · 英语",year:"24-28岁",title:"科室来了海外访问医生一起查房",type:"language",
      text:"真正的临床交流没有字幕。",
      choices:[
        {text:"主动汇报一个病例",sub:"紧张，但非常有效。",effects:{reputation:3,mental:-2},talentEffects:{english:4,communication:2},next:"__RETURN__"},
        {text:"先听别人怎么表达",sub:"理解力增长更明显。",effects:{knowledge:2},talentEffects:{english:3},next:"__RETURN__"}
      ]},
    lang_conference_qa:{
      stage:"博士支线 · 英语",year:"28-31岁",title:"国际会议问答环节，比演讲本身更难",type:"language",
      text:"准备好的幻灯片可以背，但听懂一个带口音的问题并马上回答不能。",
      choices:[
        {text:"主动参加模拟问答",sub:"提升速度最快。",effects:{reputation:2,energy:-2},talentEffects:{english:5,communication:2},next:"__RETURN__"},
        {text:"把常见问题全部提前整理",sub:"稳定但更依赖准备。",effects:{research:2},talentEffects:{english:4},next:"__RETURN__"}
      ]},
    lang_peer_review:{
      stage:"博士支线 · 英语",year:"29-32岁",title:"导师让你试着回复英文审稿意见",type:"language",
      text:"每一句都要既准确，又不能让语气听起来像在和审稿人吵架。",
      choices:[
        {text:"自己先完整写一版回复",sub:"英文写作与科研逻辑同步训练。",effects:{research:4,energy:-3},talentEffects:{english:5},next:"__RETURN__"},
        {text:"跟着导师模板逐条改",sub:"风险低，成长较稳定。",effects:{research:3},talentEffects:{english:3},next:"__RETURN__"}
      ]},
    lang_guideline_update:{
      stage:"职业支线 · 英语",year:"住院医师/主治阶段",title:"最新指南只有英文原版先发布",type:"language",
      text:"工作以后，英语能力仍然决定你获取新知识的速度。",
      choices:[
        {text:"直接读原版并给科室做摘要",sub:"临床知识与英语同步增长。",effects:{knowledge:4,reputation:2,energy:-2},talentEffects:{english:3},next:"__RETURN__"},
        {text:"等中文解读出来再看",sub:"省时间，但信息会晚一点。",effects:{knowledge:2},next:"__RETURN__"}
      ]},
    lang_international_mdt:{
      stage:"职业支线 · 英语",year:"主治/副高阶段",title:"一次国际 MDT 需要你直接汇报患者",type:"language",
      text:"病例复杂，时间很短，你必须准确表达临床重点。",
      choices:[
        {text:"自己完成汇报与问答",sub:"高压力、高成长。",effects:{reputation:4,mental:-2},talentEffects:{english:4,communication:2},next:"__RETURN__"},
        {text:"和年轻同事共同准备",sub:"风险更低。",effects:{reputation:2},talentEffects:{english:2},next:"__RETURN__"}
      ]}
  }
};