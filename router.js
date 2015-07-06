var fs = require('fs'),
  db = require('monk')('localhost/movies'),
  qs = require('qs'),
  bars = require('handlebars'),
  ratings = db.get('ratings'),
  mime = require('mime'),

  Rooter = require('rooter-router'),
  router = newRooter

function prep (file, obj, res) {
  res.setHeader('Content-Type', 'text/html')
  var file = fs.readFileSync(file)
  var template = bars.compile(file.toString())(obj)
  res.end(template)
}

router
  .add('/*', (req, res, url) => {
    // Static fileserver should appear to serve from / for sane URLs
    fs.readFile('public/' + req.url, function (err, file) {
      if (err) {
        res.writeHead(404, {'Content-Type': 'text/html'})
        res.end('404')
      } else {
        res.setHeader('Content-Type', mime.lookup(req.url))
        res.end(file)
      }
    })
  })

  .add('/', (req, res, url) => {
    res.writeHead(302, {'Location': '/index.html'})
    res.end()
  })

  .add('/ratings', (req, res, url) => {
    ratings.find({}, (err, docs) => {
      if (err) {
        console.log(err)
        res.end('DB encountered an error')
      }
      prep('templates/ratings/index.html', {'ratings': docs}, res)
    })
  }, 'GET')

  .add('/ratings', (req, res, url) => {
    var data = ''
    req.on('data', function (chunk) {
      data += chunk
    })
    req.on('end', function () {
      var rating = qs.parse(data)
      ratings.insert(rating, (err, doc) => {
        if (err) {
          console.log(err)
          res.end('DB Error')
        }
        res.writeHead(302, {'Location': '/ratings'})
        res.end()
      })
    })
  }, 'POST')

  .add('/ratings/new', (req, res, url) => {
    prep('templates/ratings/new.html', {}, res)
  })

  .add('/ratings/:id', (req, res, url) => {
    ratings.findOne({_id: url.dynamics.id}, (err, doc) => {
      prep('templates/ratings/show.html', doc, res)
    })
  }, 'GET')

  .add('/ratings/:id', (req, res, url) => {
    var data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => {
      var rating = qs.parse(data)
      ratings.insert(rating, (err, doc) => {
        res.writeHead(302, {'Location': '/ratings'})
        res.end()
      })
    })

  }, 'POST')

  .add('/ratings/:id/edit', (req, res, url) => {
    ratings.findOne({_id: url.dynamics.id}, (err, doc) => {
      prep('templates/ratings/edit.html', doc, res)
    })
  })

  .add('/ratings/:id/update', function (req, res, url) {
    var data = ''
    req.on('data', function (chunk) {
      data += chunk
    })
    req.on('end', function () {
      var rating = qs.parse(data)
      ratings.updateById(url.dynamics.id, rating, (err, doc) => {
        if (err) {
          console.log(err)
          res.end('404')
        }
        res.writeHead(302, { 'Location': '/ratings' })
        res.end()
      })
    })
  }, 'POST')

  .add('/ratings/:id/delete', (req, res, url) => {
    var data = ''
    req.on('data', (chunk) => {
    })
    req.on('end', () => {
      ratings.remove({_id: url.dynamics.id}, (err, doc) => {
        res.writeHead(302, {'Location': '/ratings'})
        res.end()
      })
    })
  }, 'POST')

module.exports = router
