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
const deviceCtrl = require('../api/controllers/devices')
const userCtrl = require('../api/controllers/user')

module.exports = function(app) {
  app.post('/app/api/v1/upload_file', upload.array('files'), fileCtrl.uploadFile)
  app.use(bodyParser.json())
  app.post('/app/api/v1/ins_account', insAccountCtrl.getAllInsAccount)
  app.post('/app/api/v1/save_ins_account', insAccountCtrl.saveInsAccount)
  app.post('/app/api/v1/update_ins_follow_state', insAccountCtrl.updateFollowState)
  app.post('/app/api/v1/update_ins_unfollow_state', insAccountCtrl.updateUnFollowState)
  app.post('/app/api/v1/update_ins_thumb_state', insAccountCtrl.updateThumbState)
  app.post('/app/api/v1/update_ins_comment_state', insAccountCtrl.updateCommentState)
  app.post('/app/api/v1/update_ins_message_state', insAccountCtrl.updateMessageState)
  app.post('/app/api/v1/update_ins_post_state', insAccountCtrl.updatePostState)
  app.post('/app/api/v1/update_ins_browse_state', insAccountCtrl.updateBrowseState)
  app.get('/app/api/v1/ins_account_detail/:account', insAccountCtrl.getInsAccountByAccount)
  app.get('/app/api/v1/ins/devices', insAccountCtrl.getAllDevice)
  app.post('/app/api/v1/ins/update_serial', insAccountCtrl.updateInsAccountSerialByAccount)
  app.post('/app/api/v1/ins/del_account', insAccountCtrl.delInsAccount)
  app.post('/app/api/v1/ins/update_config', insAccountCtrl.updateInsAccountConfigByAccount)
  app.post('/app/api/v1/ins/logs', insAccountCtrl.getAllLogs)
  app.get('/app/api/v1/ins/logs/:serial', insAccountCtrl.getLogsBySerial)
  app.get('/app/api/v1/ins/device_name', insAccountCtrl.getDeviceNameByAccount)
  app.post('/app/api/v1/ins/account/logs', insAccountCtrl.getLogsByAccountLimit)
  app.post('/app/api/v1/ins/create_post', insAccountCtrl.savePost)
  app.get('/app/api/v1/ins/post_list', insAccountCtrl.getPostList)
  app.post('/app/api/v1/ins/get_post', insAccountCtrl.getPostById)
  app.post('/app/api/v1/ins/update_post', insAccountCtrl.updatePostById)
  app.post('/app/api/v1/ins/del_post', insAccountCtrl.delPostById)
  app.post('/app/api/v1/ins/get_ins_users', insAccountCtrl.getInsUsersStatusByAccount)
  app.post('/app/api/v1/ins/get_resource', insAccountCtrl.getResource)
  app.post('/app/api/v1/ins/add_resource', insAccountCtrl.addResource)
  app.post('/app/api/v1/ins/del_resource', insAccountCtrl.delResource)
  app.post('/app/api/v1/ins/update_resource_res', insAccountCtrl.updateResource)
  app.post('/app/api/v1/ins/update_resource_status', insAccountCtrl.updateReourceStatus)
  app.post('/app/api/v1/ins/get_resource_black_list', insAccountCtrl.getResourceBlackList)
  app.post('/app/api/v1/ins/del_resource_black_list', insAccountCtrl.delResourceBlackList)
  app.post('/app/api/v1/ins/get_unfollow_whitelist', insAccountCtrl.getUnfollowWhiteList)
  app.post('/app/api/v1/ins/update_unfollow_whitelist', insAccountCtrl.updateUnfollowWhiteList)
  app.post('/app/api/v1/ins/get_unfollow_whitelist_status', insAccountCtrl.getUnfollowWhiteListStatus)
  app.post('/app/api/v1/ins/update_unfollow_whitelist_status', insAccountCtrl.updateUnfollowWhiteListStatus)
  app.post('/app/api/v1/ins/del_unfollow_whitelist', insAccountCtrl.delUnfollowWhiteList)
  app.post('/app/api/v1/ins/save_notes', insAccountCtrl.saveOrUpdateInsAccountNotes)
  app.post('/app/api/v1/ins/get_notes', insAccountCtrl.getInsAccountNotes)

  app.post('/app/api/v1/device/set_main', deviceCtrl.setMainDevice)
  app.post('/app/api/v1/device/cancel_main', deviceCtrl.cancelMainDevice)

  app.post('/app/api/user/update_device', userCtrl.updateUserDevice)
  app.post('/app/api/user/is_admin', userCtrl.userIsAdmin)

  app.post('/app/api/v1/logout', userCtrl.logout)
}
