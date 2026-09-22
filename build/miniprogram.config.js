module.exports = {
  origin: 'https://game-doctor.example.com',
  entry: '/',
  router: {
    index: ['/'],
  },
  app: {
    navigationBarTitleText: '医学生养成记录',
    navigationBarBackgroundColor: '#142b30',
    navigationBarTextStyle: 'white',
    backgroundColor: '#0f1f23',
  },
  projectConfig: {
    // 上传前将环境变量 WECHAT_APPID 设置为你的小程序 AppID；
    // 未设置时使用 touristappid，仅用于开发者工具本地预览。
    appid: process.env.WECHAT_APPID || 'touristappid',
    projectname: 'game-doctor-wechat',
    setting: {
      urlCheck: false,
      es6: true,
      enhance: true,
      postcss: true,
      minified: true,
    },
  },
  packageConfig: {
    author: 'Honghu2527',
  },
}
