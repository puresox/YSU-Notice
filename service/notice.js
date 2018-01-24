const UserModel = require('../models/user');
const NoticeModel = require('../models/notice');
const cheerio = require('cheerio');
const request = require('request-promise');
const sendEmail = require('../service/sendEmail');
const config = require('../config/config');

const EmailAdress = config.transporter.auth.user;

module.exports = {
  // 判断数据库是否为空
  isNull: async function isNull(site) {
    const notice = await NoticeModel.getNoticeInDb(site);
    if (notice.latestNoticeTitle === '') {
      return true;
    }
    return false;
  },

  // 初始化数据库
  initNotice: async function init(site) {
    // 获取通知列表
    const uri =
      site === 'notice'
        ? 'http://notice.ysu.edu.cn/index/tzgg/xzbm/xzbgs.htm'
        : 'http://jwc.ysu.edu.cn/tzgg1.htm';
    const [listBody, listHeaders] = await this.getBodyAndHeaders(uri);
    // 获取第一条通知的信息
    const info = await this.getInfoFromNoticeList(site, listBody, 0);
    // 存储最新的通知
    await NoticeModel.updateNoticeInDb(site, info.title, listHeaders.etag);
    sendEmail.toAdmin(`<p>数据库初始化成功，${site}.ysu.edu.cn 的最新文章为《${info.title}》</p><a href='${
      info.href
    }'>${info.href}</a>`);
  },

  // 获取页面的body和headers
  getBodyAndHeaders: async function getBodyAndHeaders(uri) {
    const options = {
      uri,
      simple: false,
      resolveWithFullResponse: true,
    };
    return request(options)
      .then(response => Promise.all([cheerio.load(response.body), response.headers]))
      .catch(console.log);
  },

  // 通知列表页是否改变
  hasChanged: async function hasChanged(listHeaders, site) {
    const notice = await NoticeModel.getNoticeInDb(site);
    if (notice.latestListETag === listHeaders.etag) {
      return false;
    }
    return true;
  },

  // 从notice列表中获取某一条通知的信息
  getInfoFromNoticeList: function getInfoFromNoticeList(site, listBody, num) {
    const context = site === 'notice' ? `#lineu12_${num}` : `#lineu3_${num}`;
    const uri =
      site === 'notice'
        ? 'http://notice.ysu.edu.cn/index/tzgg/xzbm/xzbgs.htm'
        : 'http://jwc.ysu.edu.cn/tzgg1.htm';
    // 获取通知链接
    let href =
      listBody('a', context)
        .attr('href')
        .replace(/\.\.\//g, '') || uri;
    const patt = new RegExp('http://');
    if (!patt.test(href)) {
      href = `http://${site}.ysu.edu.cn/${href}`;
    }
    // 获取通知标题
    const title =
      site === 'notice'
        ? listBody('.list-txt-1', context)
          .text()
          .trim() || '获取标题出错'
        : listBody('a', context)
          .attr('title')
          .trim() || '获取标题出错';
    return { href, title };
  },

  // 获取比数据库里更新的notice通知信息
  getNewNoticesOfNotice: async function getNewNoticesOfNotice(site, listBody) {
    const notice = await NoticeModel.getNoticeInDb(site);
    const newNotices = [];
    for (let index = 0; index < 6; index += 1) {
      const newNotice = this.getInfoFromNoticeList(site, listBody, index);
      if (newNotice.title !== notice.latestNoticeTitle) {
        newNotices.push(newNotice);
      } else {
        return newNotices;
      }
    }
    return Promise.reject(newNotices);
  },

  // 给用户发送新的通知
  sendNewNoticesToUsers: async function sendNewNoticesToUsers(site, newNotices) {
    const emails = await UserModel.getUserEmails();
    if (emails.length === 0) {
      return;
    }
    const emailPromises = [];
    newNotices.forEach(({ title, href }) => {
      if (href.length >= 50) {
        return;
      }
      const mailOptions = {
        from: {
          name: 'YSUNotice',
          address: EmailAdress,
        }, // 发件人
        to: emails, // 收件人
        subject: '燕山大学通知推送服务发现新通知!', // 标题
        html: `<p>通知监控系统刚刚在 ${site}.ysu.edu.cn 发现新通知：《${title}》</p><p>如果你对这个通知不感兴趣，请无视，如果感兴趣，请点击下方链接：</p><a href='${href}'>${href}</a>`, // html
      };
      emailPromises.push(sendEmail.toUser(mailOptions));
    });
    await Promise.all(emailPromises);
  },
};
