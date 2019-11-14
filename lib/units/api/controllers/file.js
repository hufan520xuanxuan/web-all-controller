function uploadFile(req, res) {
  let files = []
  req.files.map(file => {
    files.push(file.path.replace('uploads', ''))
  })
  return res.json({
    success: true,
    data: files
  })
}

module.exports = {
  uploadFile
}
