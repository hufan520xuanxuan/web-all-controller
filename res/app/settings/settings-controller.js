module.exports = function SettingsCtrl($scope, gettext) {

  $scope.settingTabs = [
    {
      //通用
      title: gettext('General'),
      icon: 'fa-gears fa-fw',
      templateUrl: 'settings/general/general.pug'
    },
    {
      //按键
      // title: gettext('Keys'),
      // icon: 'fa-key fa-fw',
      // templateUrl: 'settings/keys/keys.pug'
    }
  ]
}
