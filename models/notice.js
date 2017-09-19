const Notice = require('../models').Notice

module.exports = {
  // 获取所有用户的Email
  createNotice: async function createNotice (name, latestNoticeTitle, latestListETag) {
    await Notice.sync()
    await Notice.create({name, latestNoticeTitle, latestListETag})
  },

  // 获取数据库里的最新通知
  getNoticeInDb: async function getNoticeInDb (name) {
    await Notice.sync()
    const notice = await Notice.findOne({where: {
      name
    }})
    return notice
  }
}
