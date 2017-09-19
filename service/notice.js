const UserModel = require('../models/user')
const NoticeModel = require('../models/notice')
const cheerio = require('cheerio')
const request = require('request-promise')
const sendEmail = require('../service/sendEmail')
const moment = require('moment')
const config = require('../config/config')

const EmailAdress = config.transporter.auth.user

module.exports = {
  // 判断数据库是否为空
  isNull: async function isNull (name) {
    const notice = await NoticeModel.getNoticeInDb(name)
    return !notice
  },

  // 初始化数据库
  initNotice: async function init () {
    // 获取通知列表
    const uri = 'http://notice.ysu.edu.cn/index/tzgg/xzbm/xzbgs.htm'
    const [listBody,
      listHeaders] = await this.getBodyAndHeaders(uri)
    // 获取第一条通知的信息
    const info = await this.getInfoFromNoticeList(listBody, 0)
    // 存储最新的通知
    await NoticeModel.createNotice('notice', info.title, listHeaders.etag)
    sendEmail.toAdmin(`<p>数据库初始化成功，最新文章为 ${info.date} 发表的《${info.title}》</p><a href='${info.href}'>${info.href}</a>`)
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
  hasChanged: async function hasChanged (listHeaders, name) {
    const notice = await NoticeModel.getNoticeInDb(name)
    if (notice.latestListETag === listHeaders.etag) {
      return false
    }
    return true
  },

  // 从notice列表中获取某一条通知的信息
  getInfoFromNoticeList: async function getInfoFromNoticeList (listBody, num) {
    // 获取通知链接
    let href = listBody('a', `#lineu12_${num}`)
      .attr('href')
      .replace(/\.\.\//g, '') || 'http://notice.ysu.edu.cn/index/tzgg/xzbm/xzbgs.htm'
    const patt = new RegExp('http://')
    if (!patt.test(href)) {
      href = `http://notice.ysu.edu.cn/${href}`
    }
    // 获取通知标题
    const title = listBody('.list-txt-1', `#lineu12_${num}`)
      .text()
      .trim() || '获取标题出错'
    // 获取通知发布时间
    const date = await this.getNoticeDateOfNotice(href)
    return {href, title, date}
  },

  // 获取notice通知的发布时间
  getNoticeDateOfNotice: async function getNoticeDate (uri) {
    const [noticeBody] = await this.getBodyAndHeaders(uri)
    const date = noticeBody('span', '.content-title')
      .text()
      .substring(5, 21)
      .trim() || moment().format('YYYY-MM-DD，H:mm:ss')
    return date
  },

  // 获取比数据库里更新的notice通知信息
  getNewNoticesOfNotice: async function getNewNoticesOfNotice (listBody) {
    const notice = await NoticeModel.getNoticeInDb('notice')
    const newNotices = []
    for (let index = 0; index < 6; index++) {
      const newNotice = await this.getInfoFromNoticeList(listBody, index)
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
  sendNewNoticesToUsers: async function sendNewNoticesToUsers (newNotices) {
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
        html: `<p>通知监控系统发现新通知！</p><p>${newNotice.date}发表了《${newNotice.title}》</p><p>如果你对这个通知不感兴趣，请无视，如果感兴趣，请点击下方链接：</p><a href='${newNotice.href}'>${newNotice.href}</a>` // html
      }
      await sendEmail.toUser(mailOptions)
    }
  },

  // 更新数据库与网站同步
  updateNoticeInDb: async function updateNoticeInDb (name, latestNoticeTitle, latestListETag) {
    const notice = await NoticeModel.getNoticeInDb(name)
    await notice.update({latestNoticeTitle, latestListETag})
  }
}
