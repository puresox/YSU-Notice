const { db } = require('../models');

module.exports = {
  // 添加用户
  createUser: function createUser(name, email) {
    const userNum = db
      .get('user')
      .find({ email })
      .value();
    if (!userNum) {
      db
        .get('user')
        .push({ name, email })
        .write();
    }
  },

  // 获取所有用户的Email
  getUserEmails: function getUserEmails() {
    const emails = db
      .get('user')
      .map('email')
      .value();
    return [...new Set(emails)];
  },
};
