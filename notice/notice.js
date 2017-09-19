/**
 * 监控notice.ysu.edu.cn 有新通知时发邮件
 */
const NoticeService = require('../service/notice')

module.exports = async() => {
  // 判断是否需要初始化
  const isNull = await NoticeService.isNull('notice')
  if (isNull) {
    await NoticeService.initNotice()
    return
  }
  // 获取通知列表
  const uri = 'http://notice.ysu.edu.cn/index/tzgg/xzbm/xzbgs.htm'
  const [listBody,
    listHeaders] = await NoticeService.getBodyAndHeaders(uri)
  // 判断通知列表是否改变
  const hasChanged = await NoticeService.hasChanged(listHeaders, 'notice')
  if (!hasChanged) {
    return
  }
  // 获取比数据库里更新的通知信息
  const newNotices = await NoticeService.getNewNoticesOfNotice(listBody)
  // 给用户发送新的通知
  await NoticeService.sendNewNoticesToUsers(newNotices)
  // 更新数据库与网站同步
  await NoticeService.updateNoticeInDb('notice', newNotices[0].title, listHeaders.etag)
}
