const insAccountCtrl = require('../api/controllers/insAccount')

module.exports = function(app) {
  app.get('/app/api/v1/ins_account', insAccountCtrl.getAllInsAccount)
  app.post('/app/api/v1/save_ins_account', insAccountCtrl.saveInsAccount)
}
