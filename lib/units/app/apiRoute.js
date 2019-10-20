const insAccountCtrl = require('../api/controllers/insAccount')

module.exports = function(app) {
  app.get('/app/api/v1/ins_account', insAccountCtrl.getAllInsAccount)
  app.post('/app/api/v1/save_ins_account', insAccountCtrl.saveInsAccount)
  app.post('/app/api/v1/update_ins_follow_state', insAccountCtrl.updateFollowState)
  app.post('/app/api/v1/update_ins_unfollow_state', insAccountCtrl.updateUnFollowState)
  app.get('/app/api/v1/ins_account_detail/:account', insAccountCtrl.getInsAccountByAccount)
  app.get('/app/api/v1/ins/devices', insAccountCtrl.getAllDevice)
  app.post('/app/api/v1/ins/update_serial', insAccountCtrl.updateInsAccountSerialByAccount)
  app.post('/app/api/v1/ins/del_account', insAccountCtrl.delInsAccount)
  app.post('/app/api/v1/ins/update_config', insAccountCtrl.updateInsAccountConfigByAccount)
}
