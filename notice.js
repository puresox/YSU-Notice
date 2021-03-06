/**
 * 监控notice.ysu.edu.cn 有新通知时发邮件
 */
const NoticeService = require('./service/notice');
const NoticeModel = require('./models/notice');

module.exports = async (site) => {
  // 判断是否需要初始化
  const isNull = await NoticeService.isNull(site);
  if (isNull) {
    await NoticeService.initNotice(site);
    return;
  }
  // 获取通知列表
  const uri =
    site === 'notice'
      ? 'http://notice.ysu.edu.cn/index/tzgg/xzbm/xzbgs.htm'
      : 'http://jwc.ysu.edu.cn/tzgg1.htm';
  const [listBody, listHeaders] = await NoticeService.getBodyAndHeaders(uri);
  // 判断通知列表是否改变
  const hasChanged = await NoticeService.hasChanged(listHeaders, site);
  if (!hasChanged) {
    return;
  }
  // 获取比数据库里更新的通知信息
  await NoticeService.getNewNoticesOfNotice(site, listBody)
    .then(async (newNotices) => {
      if (newNotices.length === 0) {
        await NoticeModel.updateETagInDb(site, listHeaders.etag);
        return;
      }
      // 给用户发送新的通知
      await NoticeService.sendNewNoticesToUsers(site, newNotices);
      // 更新数据库与网站同步
      await NoticeModel.updateNoticeInDb(site, newNotices[0].title, listHeaders.etag);
    })
    .catch(async (newNotices) => {
      // 更新数据库与网站同步
      await NoticeModel.updateNoticeInDb(site, newNotices[0].title, listHeaders.etag);
      throw new Error('数据库与网站通知同步失败，将强制更新。');
    });
};
