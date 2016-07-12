const convexHull = require('convex-hull')
// O(n^floor(d/2) + n log(n))
module.exports = function (ring) {
  return convexHull(ring.slice(0, -1))
}
