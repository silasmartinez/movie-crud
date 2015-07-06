var http = require('http'),
  router = require('./router')

var server = http.createServer((res, req) => {
  router.handle(res, req)
})

server.listen(9001)
