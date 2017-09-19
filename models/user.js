const User = require('../models').User

module.exports = {
  // 获取所有用户的Email
  getUserEmails: async function getUserEmails () {
    await User.sync()
    const users = await User.findAll()
    const emails = []
    users.forEach((user) => {
      emails.push(user.email)
    })
    return emails
  }
}
