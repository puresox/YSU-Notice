const { Notice } = require('../models');

module.exports = {
  // 获取所有用户的Email
  createNotice: async function createNotice(site, latestNoticeTitle, latestListETag) {
    await Notice.sync();
    await Notice.create({ site, latestNoticeTitle, latestListETag });
  },

  // 获取数据库里的最新通知
  getNoticeInDb: async function getNoticeInDb(site) {
    await Notice.sync();
    const notice = await Notice.findOne({
      where: {
        site,
      },
    });
    return notice;
  },

  // 更新数据库与网站同步
  updateNoticeInDb: async function updateNoticeInDb(site, latestNoticeTitle, latestListETag) {
    const notice = await this.getNoticeInDb(site);
    await notice.update({ latestNoticeTitle, latestListETag });
  },

  // 更新数据库etag与网站同步
  updateETagInDb: async function updateETagInDb(site, latestListETag) {
    const notice = await this.getNoticeInDb(site);
    await notice.update({ latestListETag });
  },
};
