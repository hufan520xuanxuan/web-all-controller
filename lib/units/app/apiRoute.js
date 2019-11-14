var multer = require('multer')
var bodyParser = require('body-parser')

var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function(req, file, cb) {
    let name = file.originalname
    let ext = name.split('.')[1]

    let random = '' + Math.round(Math.random() * 10000)

    cb(null, Date.now() + random + '.' + ext)
  }
})

var upload = multer({storage})
const insAccountCtrl = require('../api/controllers/insAccount')
const fileCtrl = require('../api/controllers/file')

module.exports = function(app) {
  app.post('/app/api/v1/upload_file', upload.array('files'), fileCtrl.uploadFile)
  app.use(bodyParser.json())
  app.get('/app/api/v1/ins_account', insAccountCtrl.getAllInsAccount)
  app.post('/app/api/v1/save_ins_account', insAccountCtrl.saveInsAccount)
  app.post('/app/api/v1/update_ins_follow_state', insAccountCtrl.updateFollowState)
  app.post('/app/api/v1/update_ins_unfollow_state', insAccountCtrl.updateUnFollowState)
  app.post('/app/api/v1/update_ins_thumb_state', insAccountCtrl.updateThumbState)
  app.post('/app/api/v1/update_ins_comment_state', insAccountCtrl.updateCommentState)
  app.post('/app/api/v1/update_ins_message_state', insAccountCtrl.updateMessageState)
  app.get('/app/api/v1/ins_account_detail/:account', insAccountCtrl.getInsAccountByAccount)
  app.get('/app/api/v1/ins/devices', insAccountCtrl.getAllDevice)
  app.post('/app/api/v1/ins/update_serial', insAccountCtrl.updateInsAccountSerialByAccount)
  app.post('/app/api/v1/ins/del_account', insAccountCtrl.delInsAccount)
  app.post('/app/api/v1/ins/update_config', insAccountCtrl.updateInsAccountConfigByAccount)
  app.get('/app/api/v1/ins/logs', insAccountCtrl.getAllLogs)
  app.get('/app/api/v1/ins/logs/:serial', insAccountCtrl.getLogsBySerial)
  app.get('/app/api/v1/ins/device_name', insAccountCtrl.getDeviceNameByAccount)
  app.post('/app/api/v1/ins/account/logs', insAccountCtrl.getLogsByAccountLimit)
  app.post('/app/api/v1/ins/create_post', insAccountCtrl.savePost)
  app.get('/app/api/v1/ins/post_list', insAccountCtrl.getPostList)
  app.post('/app/api/v1/ins/get_post', insAccountCtrl.getPostById)
  app.post('/app/api/v1/ins/update_post', insAccountCtrl.updatePostById)
}
