const resolve = require('./resolve')
const split = require('./split')
const rewind = require('./util').rewind

// iteratively split the given polygon until the worst concavity is below
// `threshold` or optionally until a max number of iterations
module.exports = function (polygon, threshold, maxIterations) {
  // the main result
  let decomposition = []
  // keep track of individual 'split' diagonals used, for convenience/analysis
  let splits = []

  let concavity = Infinity

  // ensure cw outer-ring orientation
  rewind(polygon)

  let polygons = [polygon]

  // TODO: replace with total vertex count
  maxIterations = maxIterations || Math.log(polygon[0].length) / Math.LN2

  let iterations = []
  while (concavity > threshold && polygons.length) {
    iterations.push({start: Date.now()})

    // "resolve"
    const diagonals = polygons.map((p, i) => resolve(p, threshold))
    let nextConcavity = -Infinity
    let nextPolygons = []
    for (let i = 0; i < diagonals.length; i++) {
      if (!diagonals[i]) {
        decomposition.push(polygons[i])
        continue
      }

      nextConcavity = Math.max(polygons[i][0][diagonals[i][0]].bridgeDistance, nextConcavity)

      // split
      split(polygons[i], 0, diagonals[i][0], 0, diagonals[i][1], nextPolygons)

      splits.push([polygons[i][0][diagonals[i][0]], polygons[i][0][diagonals[i][1]]])
    }

    polygons = nextPolygons
    concavity = nextConcavity
    iterations[iterations.length - 1].end = Date.now()

    if (iterations.length >= maxIterations) {
      decomposition.push.apply(decomposition, nextPolygons)
      break
    }
  }

  iterations = iterations.map(iter => iter.start - iter.end)

  return { decomposition: decomposition, splits: splits, iterations: iterations }
}
