/**
 * 发送邮件
 */
const config = require('../config/config')
const nodemailer = require('nodemailer')
const moment = require('moment')

const EmailAdress = config.transporter.auth.user
const adminEmail = config.adminEmail

const transporter = nodemailer.createTransport(config.transporter)

module.exports = {
  toUser: async function toUser (mailOptions) {
    return new Promise((resolve, reject) => {
      // send mail with defined transport object
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          reject(error)
        }
        resolve()
      })
    })
  },

  toAdmin: async function toAdmin (msg) {
    const mailOptions = {
      from: {
        name: 'YSUNotice',
        address: EmailAdress
      }, // 发件人
      to: adminEmail, // 收件人
      subject: '燕山大学通知推送服务', // 标题
      html: `<div><p>${moment().format('H:mm:ss')}:</p>${msg}</div>` // html
    }
    await this.toUser(mailOptions)
  }
}
