const UserModel = require('../models/user')
const NoticeModel = require('../models/notice')
const cheerio = require('cheerio')
const request = require('request-promise')
const sendEmail = require('../service/sendEmail')
const config = require('../config/config')

const EmailAdress = config.transporter.auth.user

module.exports = {
  // 判断数据库是否为空
  isNull: async function isNull (site) {
    const notice = await NoticeModel.getNoticeInDb(site)
    return !notice
  },

  // 初始化数据库
  initNotice: async function init (site) {
    // 获取通知列表
    const uri = site === 'notice'
      ? 'http://notice.ysu.edu.cn/index/tzgg/xzbm/xzbgs.htm'
      : 'http://jwc.ysu.edu.cn/tzgg1.htm'
    const [listBody,
      listHeaders] = await this.getBodyAndHeaders(uri)
    // 获取第一条通知的信息
    const info = await this.getInfoFromNoticeList(site, listBody, 0)
    // 存储最新的通知
    await NoticeModel.createNotice(site, info.title, listHeaders.etag)
    sendEmail.toAdmin(`<p>数据库初始化成功，${site}.ysu.edu.cn 的最新文章为《${info.title}》</p><a href='${info.href}'>${info.href}</a>`)
  },

  // 获取页面的body和headers
  getBodyAndHeaders: async function getBodyAndHeaders (uri) {
    const options = {
      uri,
      simple: false,
      resolveWithFullResponse: true
    }
    return request(options).then(response => Promise.all([
      cheerio.load(response.body),
      response.headers
    ]))
  },

  // 通知列表页是否改变
  hasChanged: async function hasChanged (listHeaders, site) {
    const notice = await NoticeModel.getNoticeInDb(site)
    if (notice.latestListETag === listHeaders.etag) {
      return false
    }
    return true
  },

  // 从notice列表中获取某一条通知的信息
  getInfoFromNoticeList: async function getInfoFromNoticeList (site, listBody, num) {
    const context = site === 'notice'
      ? `#lineu12_${num}`
      : `#lineu3_${num}`
    const uri = site === 'notice'
      ? 'http://notice.ysu.edu.cn/index/tzgg/xzbm/xzbgs.htm'
      : 'http://jwc.ysu.edu.cn/tzgg1.htm'
    // 获取通知链接
    let href = listBody('a', context)
      .attr('href')
      .replace(/\.\.\//g, '') || uri
    const patt = new RegExp('http://')
    if (!patt.test(href)) {
      href = `http://${site}.ysu.edu.cn/${href}`
    }
    // 获取通知标题
    const title = site === 'notice'
      ? listBody('.list-txt-1', context)
        .text()
        .trim() || '获取标题出错'
      : listBody('a', context)
        .attr('title')
        .trim() || '获取标题出错'
    return {href, title}
  },

  // 获取比数据库里更新的notice通知信息
  getNewNoticesOfNotice: async function getNewNoticesOfNotice (site, listBody) {
    const notice = await NoticeModel.getNoticeInDb(site)
    const newNotices = []
    for (let index = 0; index < 6; index++) {
      const newNotice = await this.getInfoFromNoticeList(site, listBody, index)
      if (newNotice.title !== notice.latestNoticeTitle) {
        if (newNotice.href.length <= 45) {
          newNotices.push(newNotice)
        }
      } else {
        return newNotices
      }
    }
    throw new Error('数据库与网站通知同步失败，将强制更新。')
  },

  // 给用户发送新的通知
  sendNewNoticesToUsers: async function sendNewNoticesToUsers (site, newNotices) {
    const emails = await UserModel.getUserEmails()
    if (!emails) {
      return
    }
    for (var newNotice of newNotices) {
      const mailOptions = {
        from: {
          name: 'YSUNotice',
          address: EmailAdress
        }, // 发件人
        to: emails, // 收件人
        subject: '燕山大学通知推送服务发现新通知!', // 标题
        html: `<p>通知监控系统刚刚在 ${site}.ysu.edu.cn 发现新通知：《${newNotice.title}》</p><p>如果你对这个通知不感兴趣，请无视，如果感兴趣，请点击下方链接：</p><a href='${newNotice.href}'>${newNotice.href}</a>` // html
      }
      await sendEmail.toUser(mailOptions)
    }
  }
}
