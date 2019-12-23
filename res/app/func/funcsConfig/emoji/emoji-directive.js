module.exports = function EmojiDirective() {
  return {
    restrict: 'E'
    , template: require('./emoji.pug')
    , scope: {
      value: '=value',
      elKey: '@elKey',
      visible: '=visible',
      close: '&close'
    }
    , link: function(scope, element) {
      scope.empjiList = ['😀','😁','🤣','😂','😄','😅','😆','😇','😉','😊','🙂','🙃','😋','😌','😍','😘','😙','😜','😝','🤑','🤓','😎','🤗','😏','😶','😑','😒','🙄','🤔','😳','😞','😟','😡','😔','😕','😣','😖','😤','😮','😱','😨','😰','😯','😦','😢','😪','😓','🤤','😭','😲','🤥','🤢','🤧','🤐','😷','🤒']
      scope.setEmoji = (emoji) => {
        let textarea = $('#' + scope.elKey)
        let start = textarea[0].selectionStart
        let oldVal = scope.value
        let startVal = oldVal.substring(0, start)
        let endVal = oldVal.substring(start, oldVal.length)
        scope.value = startVal + emoji + endVal
        scope.close()
      }
    }
  }
}
