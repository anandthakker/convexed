const convexHull = require('./hull')
const pointToSegment = require('./util').pointToSegment

// Find the "bridges" in the given ring.  (A bridge is a convex hull edge that
// spans more than one edge of the ring, as described in
//
// Also for each ring vertex not on the convex hull, mark it with its
// associated bridge ([index1, index2]) and the squared distance to that
// bridge.  O(n)
module.exports = function bridges (ring) {
  const hull = convexHull(ring)
  if (hull.length < 3) { return [] }

  let maxBridgeDistance = 0
  let maxBridgeWitness = null

  // NOTE: assumes hull is oriented the same way as ring, so that its indexes
  // are increasing except for when it wraps around the end of the array
  const bridges = []
  for (let i = 0; i < hull.length; i++) {
    const s = hull[i]
    const adjacent = s[0] === s[1] + 1 || s[1] === s[0] + 1 ||
      (s[0] === 0 && s[1] === ring.length - 2) ||
      (s[1] === 0 && s[0] === ring.length - 2)
    if (!adjacent) {
      bridges.push(s)
      // mark each ring vertex that's 'skipped' by this bridge
      let wrapped = 0 // <- bail out of loop if we somehow end up wrapping around twice
      // mark the ring vertexes associated with this bridge
      for (let r = s[0] + 1; r !== s[1] && wrapped < 2; r++) {
        ring[r].bridge = s
        ring[r].bridgeDistance = pointToSegment(ring[r], ring[s[0]], ring[s[1]])
        if (ring[r].bridgeDistance > maxBridgeDistance) {
          maxBridgeDistance = ring[r].bridgeDistance
          maxBridgeWitness = r
        }
        if (r === ring.length - 1) {
          r = -1
          wrapped++
        }
      }
    }
  }

  // first ring vertex is equivalent to last
  ring[0].bridge = ring[ring.length - 1].bridge
  ring[0].bridgeDistance = ring[ring.length - 1].bridgeDistance
  // never use final, repeated vertex as the 'witness' -- prefer instead to use
  // vertex 0 in that case.
  ring.maxBridgeWitness = maxBridgeWitness === ring.length - 1 ? 0 : maxBridgeWitness
  ring.maxBridgeDistance = maxBridgeDistance

  return bridges
}

