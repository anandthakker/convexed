module.exports.pointToSegment = pointToSegment
// squared distance from point to segment
// See http://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
function pointToSegment (point, s0, s1) {
  // vector from segment_0 => point
  const vx = point[0] - s0[0]
  const vy = point[1] - s0[1]
  // vector along segment (also starting at segment_0)
  const sx = s1[0] - s0[0]
  const sy = s1[1] - s0[1]

  const dot = vx * sx + vy * sy
  const s2 = sx * sx + sy * sy
  if (s2 === 0) { return vx * vx + vy * vy }

  const fraction = dot / s2
  let dx
  let dy
  if (fraction < 0) {
    dx = point[0] - s0[0]
    dy = point[1] - s0[1]
  } else if (fraction > 1) {
    dx = point[0] - s1[0]
    dy = point[1] - s1[1]
  } else {
    dx = point[0] - (s0[0] + fraction * sx)
    dy = point[1] - (s0[1] + fraction * sy)
  }

  return dx * dx + dy * dy
}

module.exports.rewind = rewind
function rewind (polygonOrRing, direction) {
  direction = direction || 1
  if (Array.isArray(polygonOrRing[0][0])) {
    rewind(polygonOrRing[0])
    for (let i = 1; i < polygonOrRing.length; i++) {
      rewind(polygonOrRing[i], -1 * direction)
    }
  }
  const a = calculateSignedArea(polygonOrRing)
  if (a * direction > 0) { polygonOrRing.reverse() }
  return polygonOrRing
}

// adapted from mapbox-gl-js
function calculateSignedArea (ring) {
  let sum = 0
  for (let i = 0, len = ring.length, j = len - 1, p1, p2; i < len; j = i++) {
    p1 = ring[i]
    p2 = ring[j]
    sum += (p2[0] - p1[0]) * (p1[1] + p2[1])
  }
  return sum
}

module.exports.squaredDistance = squaredDistance
function squaredDistance (p1, p2) {
  const dx = p1[0] - p2[0]
  const dy = p1[1] - p2[1]
  return dx * dx + dy * dy
}

module.exports.segmentsIntersect = segmentsIntersect
// From https://github.com/Turfjs/turf/blob/master/packages/turf-point-on-line/index.js
function segmentsIntersect (line1StartX, line1StartY, line1EndX, line1EndY, line2StartX, line2StartY, line2EndX, line2EndY) {
  // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
  let denominator
  let a
  let b
  let numerator1
  let numerator2

  let result = {
    x: null,
    y: null,
    onLine1: false,
    onLine2: false
  }
  denominator = ((line2EndY - line2StartY) * (line1EndX - line1StartX)) - ((line2EndX - line2StartX) * (line1EndY - line1StartY))
  if (denominator === 0) {
    if (result.x !== null && result.y !== null) {
      return result
    } else {
      return false
    }
  }
  a = line1StartY - line2StartY
  b = line1StartX - line2StartX
  numerator1 = ((line2EndX - line2StartX) * a) - ((line2EndY - line2StartY) * b)
  numerator2 = ((line1EndX - line1StartX) * a) - ((line1EndY - line1StartY) * b)
  a = numerator1 / denominator
  b = numerator2 / denominator

  // if we cast these lines infinitely in both directions, they intersect here:
  result.x = line1StartX + (a * (line1EndX - line1StartX))
  result.y = line1StartY + (a * (line1EndY - line1StartY))

  // if line1 is a segment and line2 is infinite, they intersect if:
  if (a >= 0 && a <= 1) {
    result.onLine1 = true
  }
  // if line2 is a segment and line1 is infinite, they intersect if:
  if (b >= 0 && b <= 1) {
    result.onLine2 = true
  }
  // if line1 and line2 are segments, they intersect if both of the above are true
  if (result.onLine1 && result.onLine2) {
    return [result.x, result.y]
  } else {
    return false
  }
}

// check if the diagonal from ring[index1] to ring[index2] lies within the
// ring if ring is oriented cw (or outside the ring if it is oriented ccw)
module.exports.interior = interior
function interior (index1, index2, ring) {
  const tail = Math.min(index1, index2)
  const tip = tail === index1 ? index2 : index1
  const prev = tail > 0 ? tail - 1 : ring.length - 2
  const next = (tail + 1) % (ring.length - 1)
  // vector from the "earlier" endpoint of the diagonal to the "previous" vertex
  // on the ring
  const ux = ring[prev][0] - ring[tail][0]
  const uy = ring[prev][1] - ring[tail][1]
  // vector from the "earlier" endpoint of the diagonal to the "next" vertex
  // on the ring
  const vx = ring[next][0] - ring[tail][0]
  const vy = ring[next][1] - ring[tail][1]
  // vector from the "earlier" endpoint to the "later" endpoint of the diagonal
  const dx = ring[tip][0] - ring[tail][0]
  const dy = ring[tip][1] - ring[tail][1]
  const ucrossv = ux * vy - uy * vx
  const dcrossv = dx * vy - dy * vx
  const ucrossd = ux * dy - uy * dx
  return (ucrossv >= 0 && dcrossv >= 0 && ucrossd >= 0) || (ucrossv < 0 && (dcrossv >= 0 || ucrossd >= 0))
}

// test if the proposed split collides with any edge of the polygon
module.exports.collides = collides
function collides (witnessRing, witnessIndex, diagonalRing, diagonalIndex, polygon, index) {
  // if we're considering a "diagonal" that is actually a polygon edge, then
  // treat that as a collision
  if (diagonalRing === witnessRing) {
    const len = polygon[diagonalRing].length - 1
    if (witnessIndex % len === (diagonalIndex + 1) % len ||
        diagonalIndex % len === (witnessIndex + 1) % len) {
      return true
    }
  }

  const p1 = polygon[witnessRing][witnessIndex]
  const p2 = polygon[diagonalRing][diagonalIndex]
  const candidates = index.search(segmentBounds(p1, p2))

  for (let i = 0; i < candidates.length; i++) {
    const segment = candidates[i]
    // don't bother to check for intersection against the two segments that
    // meet at the 'diagonal' point we're considering
    if (segment.ring === diagonalRing && (segment.segment === diagonalIndex || segment.segment + 1 === diagonalIndex)) {
      continue
    }
    // same with the two segments that meet at the witness point
    if (segment.ring === witnessRing && (segment.segment === witnessIndex || segment.segment + 1 === witnessIndex)) {
      continue
    }
    let intersect = segmentsIntersect(p1[0], p1[1], p2[0], p2[1], segment.minX, segment.minY, segment.maxX, segment.maxY)
    if (intersect) return true
  }

  return false
}

module.exports.segmentBounds = segmentBounds
function segmentBounds (p1, p2) {
  return {
    minX: Math.min(p1[0], p2[0]),
    minY: Math.min(p1[1], p2[1]),
    maxX: Math.max(p1[0], p2[0]),
    maxY: Math.max(p1[1], p2[1])
  }
}

