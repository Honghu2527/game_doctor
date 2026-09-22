const getDom = require('replace-global-var-loader!html-to-js-loader!./body.html')
require('../styles.css')

export default function createApp() {
  document.body.setAttribute('data-stage-bg', 'undergrad')
  document.body.appendChild(getDom())

  window.__WECHAT_CONFIG__ = require('./wechat.config')

  // 数据与业务逻辑保持与网页版完全同序加载。
  require('../data/backgrounds.js')
  require('../data/schools.js')
  require('../data/events.js')
  require('../data/school_system.js')
  require('../data/schools_expansion.js')
  require('../data/career_tree.js')
  require('../data/college_route.js')
  require('../data/specialty_system.js')
  require('../data/education_system.js')
  require('../data/language_system.js')
  require('../data/job_system.js')
  require('../data/item_system.js')
  require('../data/opportunity_flows.js')
  require('../data/college_opportunities.js')
  require('../board_adapter.js')
  require('../ad_adapter.js')
  require('../share_adapter.js')
  require('../app.js')

  if(window.AD_SERVICE&&window.AD_SERVICE.isRealAdAvailable&&!window.AD_SERVICE.isRealAdAvailable()){
    var supplyButton=document.getElementById('openSupplyBtn')
    if(supplyButton)supplyButton.hidden=true
  }
}
