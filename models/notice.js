const { db } = require('../models');

module.exports = {
  // 获取数据库里的通知
  getNoticeInDb: function getNoticeInDb(site) {
    const notice = db
      .get('notice')
      .find({ site })
      .value();
    return notice;
  },

  // 更新数据库与网站同步
  updateNoticeInDb: function updateNoticeInDb(site, latestNoticeTitle, latestListETag) {
    db
      .get('notice')
      .find({ site })
      .assign({ latestNoticeTitle, latestListETag })
      .write();
  },

  // 更新数据库etag与网站同步
  updateETagInDb: function updateETagInDb(site, latestListETag) {
    db
      .get('notice')
      .find({ site })
      .assign({ site, latestListETag })
      .write();
  },
};
