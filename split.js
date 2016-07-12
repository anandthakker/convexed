const assert = require('assert')
const inside = require('point-in-polygon')

// split the given polygon along the diagonal going from ring r1, point v1 to
// ring r2, point v2
module.exports = function (polygon, r1, v1, r2, v2, results) {
  assert(v1 < polygon[r1].length - 1) // do not use final, repeated vertex
  assert(v2 < polygon[r2].length - 1)

  if (r1 === 0 && r2 === 0) {
    // clear concavity markings on outer ring
    for (let i = 0; i < polygon[0].length; i++) {
      polygon[0][i].bridge = null
      polygon[0][i].bridgeDistance = 0
    }
    polygon[0].maxBridgeDistance = 0

    const p1 = []
    for (let i = v1; i !== v2; i++) {
      p1.push(polygon[0][i])
      if (i === polygon[0].length - 2) { i = -1 }
    }
    p1.push(clone(polygon[0][v2]), clone(polygon[0][v1]))

    const p2 = []
    for (let i = v2; i !== v1; i++) {
      p2.push(polygon[0][i])
      if (i === polygon[0].length - 2) { i = -1 }
    }
    p2.push(clone(polygon[0][v1]), clone(polygon[0][v2]))

    let polygons = p1.length > p2.length ? [[p2], [p1]] : [[p1], [p2]]
    for (let i = 1; i < polygon.length; i++) {
      const hole = polygon[i]
      // check whether hole is inside the smaller poly
      if (inside(hole[0], polygons[0][0])) {
        polygons[0].push(hole)
      } else {
        polygons[1].push(hole)
      }
    }
    results.push(polygons[0])
    results.push(polygons[1])
  } else {
    assert(r1 === 0 || r2 === 0)
    throw new Error('Splitting on boundary-hole diagonals unimplemented')
  }
}

function clone (p) {
  return [p[0], p[1]]
}
