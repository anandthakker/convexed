const rbush = require('rbush')
const markBridges = require('./bridges')
const util = require('./util')

// "resolve" concavity > threshold in the given polygon by finding a diagnoal
// from the point of greatest concavity that can be used to split the poly
module.exports = function resolve (polygon, threshold) {
  const outer = polygon[0]

  markBridges(outer)
  // a vertex that "wintesses" the concavity of the polygon, i.e., a "maximally
  // concave" vertex
  let witness = outer.maxBridgeWitness
  if (!witness || !(outer.maxBridgeDistance > threshold)) {
    return false
  }

  // TODO: for each hole:
  // 1. choose a pair of 'antipodal' points p and q, i.e. points that (roughly)
  // maximize the length of the shortest path within the hole.
  // 2. find the point x on `outer` closest to p (or q)
  // 3. assign the _hole_ a concavity of concavity(x) + distance(x, p) + path(p, q) + maxConcavity(outer)

  const sorted = outer.map(function (point, i) { return i }).slice(0, -1)
  sorted.sort(compareConcavityAndDistance)

  // index all the segments of the polygon
  const index = rbush()
  index.load(polygonSegmentBounds(polygon))

  // traversing vertices in sorted order, find a diagonal from witness that
  // splits the poly into two valid, smaller polygons
  for (var diagonal = 1; diagonal < sorted.length; diagonal++) {
    if (outer[sorted[diagonal]].bridge === outer[witness].bridge) {
      continue
    }
    if (!util.collides(0, witness, 0, sorted[diagonal], polygon, index) &&
        util.interior(witness, sorted[diagonal], polygon[0])) {
      break
    }
  }

  return diagonal < sorted.length ? [witness, sorted[diagonal]] : null

  function compareConcavityAndDistance (a, b) {
    // descending by concavity
    const deltaConcavity = outer[b].bridgeDistance - outer[a].bridgeDistance
    if (deltaConcavity) { return deltaConcavity }
    const da = util.squaredDistance(outer[a], outer[witness])
    const db = util.squaredDistance(outer[b], outer[witness])
    // ascending by distance
    return da - db
  }
}

function polygonSegmentBounds (polygon) {
  const bounds = []
  for (let i = 0; i < polygon.length; i++) {
    const ring = polygon[i]
    for (let j = 0; j < ring.length - 1; j++) {
      const p1 = ring[j]
      const p2 = ring[j + 1]
      const box = util.segmentBounds(p1, p2)
      box.ring = i
      box.segment = j
      bounds.push(box)
    }
  }
  return bounds
}

