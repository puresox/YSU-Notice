const Koa = require('koa')
const notice = require('./notice/notice')
const jwc = require('./notice/jwc')
const sendEmail = require('./service/sendEmail')

const app = new Koa()

let noticeErrCount = 0
let jwcErrCount = 0

let noticeFlag, jwcFlag

setInterval(() => {
  noticeFlag = 0
  jwcFlag = 0
}, 2400000)

try {
  // 先执行一次
  notice()
  // 之后每10分钟再执行一次
  // noticeFlag = setInterval(notice, 600000) // ms
} catch (err) {
  noticeErrCount++
  if (noticeErrCount === 3) {
    clearInterval(noticeFlag)
    sendEmail.toAdmin('<p>系统侦测到监控notice.ysu.edu.cn的程序存在严重漏洞，已启动自毁程序</p>')
  } else {
    // 给管理员发送错误信息的邮件
    sendEmail.toAdmin(`<p>${err}</p>`)
  }
}

/* try {
  // 先执行一次
  jwc()
  // 之后每10分钟再执行一次
  jwcFlag = setInterval(jwc, 600000) // ms
} catch (err) {
  jwcErrCount++
  if (jwcErrCount === 3) {
    clearInterval(jwcFlag)
  }
  // 给管理员发送错误信息的邮件
  sendEmail.toAdmin('<p>jwc.ysu.edu.cn的程序存在严重漏洞，已启动自毁程序</p>')
} */

app.listen(3000)
