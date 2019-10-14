const {spawn} = require('child_process')
let argv = process.argv

let paramsStr = argv[2]
paramsStr = paramsStr.replace('params=', '')
if (paramsStr) {
  paramsStr = paramsStr.split(',')
  let params = {}
  paramsStr.map(item => {
    let arr = item.split(':')
    params[arr[0]] = arr[1] || ''
  })

  let {
    ip = 'localhost',
    port = 7100,
    socket = 7110,
    min = 7400,
    max = 7700,
  } = params

  console.log([
    'node', './bin/stf', 'local', '--public-ip', ip, '-p', port,
    '--websocket-port', socket, '--provider-min-port', min, '--provider-max-port', max
  ].join(' '))


  try {
    spawn('node', [
      './bin/stf', 'local', '--public-ip', ip, '-p', port,
      '--websocket-port', socket, '--provider-min-port', min, '--provider-max-port', max
    ], {stdio: 'inherit'})
  }
  catch (err) {
    console.log(err)
  }
}
