/**
 * 数据库models
 */
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('db.json');
const db = low(adapter);

db
  .defaults({
    notice: [
      { site: 'notice', latestNoticeTitle: '', latestListETag: '' },
      { site: 'jwc', latestNoticeTitle: '', latestListETag: '' },
    ],
    user: [{ name: 'puresox', email: 'puresox@163.com' }],
  })
  .write();

exports.db = db;
