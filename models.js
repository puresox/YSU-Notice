/**
 * 数据库models
 */
const Sequelize = require('sequelize')
const config = require('./config/config')

const sequelize = new Sequelize(config.postgres)

exports.User = sequelize.define('user', {
  // 用户名
  name: {
    type: Sequelize.STRING,
    primaryKey: true,
    unique: true
  },
  // 用户邮箱
  email: {
    type: Sequelize.STRING,
    unique: true
  }
})

exports.Notice = sequelize.define('notice', {
  // 通知来源网站 notice,jwc
  site: {
    type: Sequelize.STRING,
    primaryKey: true,
    unique: true
  },
  // 最新的通知标题
  latestNoticeTitle: {
    type: Sequelize.STRING
  },
  // 最新的通知列表的ETag
  latestListETag: {
    type: Sequelize.STRING
  }
})
