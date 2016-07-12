var DebugViz = require('./viz')
var data = require('../test/fixture/one.json')
var convex = require('../')
// var earcut = require('earcut')

var viz = new DebugViz('canvas')

var maxIterations = 4

run()
window.onclick = run

var size

function run () {
  viz.clear()
  var forEarcut = []
  var subject = [data[0].map(function (p) {
    var pt = [
      Math.round(p[1] / 10),
      Math.round(p[0] / 10)
    ]
    forEarcut.push(pt[1], pt[0])
    return pt
  })]

  size = size || viz.scale(subject)
  var threshold = Math.pow(Math.max(size[0], size[1]) / 10, 2)

  viz.poly(subject, 'rgba(0,0,255,0.2)')

  console.time('convex')
  var results = convex(subject, threshold, maxIterations)
  console.timeEnd('convex')
  console.log('threshold: ' + threshold, results)

  var show = false
  results.decomposition.forEach(function (part, i) {
    if (show !== false && i !== show) { return }
    var r = i / (results.decomposition.length - 1)
    var rgba = [r * 255, (1 - r) * 255, 0, 0.5].map(Math.round)
    viz.poly(part, 'rgba(' + rgba.join(',') + ')')
    // console.log('part', i, rgba, part[0].length, part)

    // forEarcut = []
    // part[0].forEach((p) => forEarcut.push(p[0], p[1]))
    // console.time('smaller earcut')
    // earcut(forEarcut)
    // console.timeEnd('smaller earcut')
  })
}
