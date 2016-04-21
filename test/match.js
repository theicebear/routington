var should = require('should')
var assert = require('assert')

var routington = require('../')

describe('Route matching', function () {
  it('should match the root path', function () {
    var router = routington()
    var routes = router.define('')

    var match = router.match('')
    match.param.should.eql({})
    match.node.should.equal(routes[0])
  })

  it('should match a top level path', function () {
    var router = routington()
    var routes = router.define('/favicon')

    var match = router.match('/favicon')
    match.param.should.eql({})
    match.node.should.equal(routes[0])
  })

  it('should match a named parameter', function () {
    var router = routington()
    var routes = router.define('/:id')

    var match = router.match('/asdf')
    match.param.should.eql({
      id: 'asdf'
    })
    match.node.should.equal(routes[0])
  })

  it('should match a regex', function () {
    var router = routington()
    var route = router.define('/:id(\\w{3,30})').shift()

    var match = router.match('/asdf')
    match.param.should.eql({
      id: 'asdf'
    })
    match.node.should.equal(route)

    should.not.exist(router.match('/a'))
  })

  it('should match the first declared regex', function () {
    var router = routington()
    router.define('/:id(\\w{3,30})')
    router.define('/:id([0-9a-f]{24})')

    var match = router.match('/asdfasdfasdfasdfasdfasdf')
    match.param.should.eql({
      id: 'asdfasdfasdfasdfasdfasdf'
    })
    match.node.regex.toString().should.equal('/^(\\w{3,30})$/i')
  })

  it('should match strings over regex', function () {
    var router = routington()
    router.define('/asdf')
    router.define('/:id(\\w{3,30})')

    var match = router.match('/asdf')
    match.param.should.eql({})
    match.node.string.should.equal('asdf')
  })

  it('should not overwrite generically named routes', function () {
    var router = routington()
    router.define('/:id')
    router.define('/:id(.*)')

    var match = router.match('/a')
    match.param.should.eql({
      id: 'a'
    })
    should.not.exist(match.node.parent.regex)
  })

  it('should be case sensitive with strings, but not regexs', function () {
    var router = routington()
    router.define('/asdf')
    router.define('/:id([0-9A-F]+)')

    should.not.exist(router.match('/ASDF'))
    router.match('/asdf').should.be.ok
    router.match('/a0b').should.be.ok
    router.match('/A0B').should.be.ok
  })

  it('should not match Object.prototype properties', function () {
    var router = routington()
    router.define('/')

    should.not.exist(router.match('/__proto__'))
    should.not.exist(router.match('/hasOwnProperty'))
  })

  it('/:path should not match /', function () {
    var router = routington()

    should.not.exist(router.match('/:path'))
  })

  it('should match encoded paths', function () {
    var router = routington()

    router.define('/page/:name(@\\w+)')

    router.match('/page/@jongleberry').should.be.ok
    router.match('/page/%40jongleberry').should.be.ok
  })

  it('should throw on malformed paths', function () {
    var router = routington()

    router.define('/page/:name(@\\w+)')

    assert.throws(function () {
      router.match('/page/%%%')
    })
  })

  it('should match all the rest of url at the last regex or named parameter', function() {
    var router = routington()

    router.define('/page/:rest')
    router.define('/asdf/:rest([\\d\\/]+)')

    router.match('/page/a').should.be.ok
    router.match('/page/a/b/c').should.be.ok

    router.match('/asdf/34/23').should.be.ok
    should.not.exists(router.match('/asdf/a/b'))
  })
})