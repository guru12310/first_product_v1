const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const header = req.header['authorization'];
  if (!header) {
    return res.status(500).json({
      status: 'failed',
      message: 'Authorization header is missing'
    })
  }

  const token = header.split('')[1];
  if (!token)
    return res.status(500).json({
      status: 'failed',
      message: 'Token is missing'
    })

  jwt.verify(token, process.env.jwt_secret, (err, decode) => {
    if (err) return res.status(401).json({
      success: 'failed',
      message: 'Invalid Token',
      error: err.message
    })

    req.user = decode

    next()
  })



}