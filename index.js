const Koa = require('koa')
const notice = require('./notice')
const sendEmail = require('./service/sendEmail')

const app = new Koa()

let errCount = 0

let flag

setInterval(() => {
  flag = 0
}, 2400000)

const YSUNotice = async() => {
  await notice('notice')
  await notice('jwc')
}

try {
  // 先执行一次
  YSUNotice()
  // 之后每10分钟再执行一次
  flag = setInterval(YSUNotice, 600000) // ms
} catch (err) {
  errCount++
  if (errCount === 3) {
    clearInterval(flag)
    sendEmail.toAdmin('<p>系统侦测到监控程序存在严重漏洞，已启动自毁程序</p>')
  } else {
    // 给管理员发送错误信息的邮件
    sendEmail.toAdmin(`<p>${err}</p>`)
  }
}

app.listen(3000)
