const {EPS} = require('../math/constants')

const {vec3} = require('../math')

const {geom3, poly3} = require('../geometry')

/** Construct an elliptic cylinder.
 * @param {Object} [options] - options for construction
 * @param {Array} [options.center=[0,0,0]] - center of cylinder
 * @param {Vector3} [options.height=2] - height of cylinder
 * @param {Vector2D} [options.startRadius=[1,1]] - radius of rounded start, must be two dimensional array
 * @param {Number} [options.startAngle=0] - start angle of cylinder, in radians
 * @param {Vector2D} [options.endRadius=[1,1]] - radius of rounded end, must be two dimensional array
 * @param {Number} [options.endAngle=(Math.PI * 2)] - end angle of cylinder, in radians
 * @param {Number} [options.segments=12] - number of segments to create per full rotation
 * @returns {geom3} new geometry
 *
 * @example
 *     let cylinder = cylinderElliptic({
 *       height: 2,
 *       startRadius: [10,5],
 *       endRadius: [8,3]
 *     });
 */
const cylinderElliptic = function (options) {
  const defaults = {
    center: [0, 0, 0],
    height: 2,
    startRadius: [1,1],
    startAngle: 0,
    endRadius: [1,1],
    endAngle: (Math.PI * 2),
    segments: 12
  }
  let {center, height, startRadius, startAngle, endRadius, endAngle, segments} = Object.assign({}, defaults, options)

  if (!Array.isArray(center)) throw new Error('center must be an array')
  if (center.length < 3) throw new Error('center must contain X, Y and Z values')

  if (height < (EPS*2)) throw new Error('height must be larger then zero')

  if ((endRadius[0] <= 0) || (startRadius[0] <= 0) || (endRadius[1] <= 0) || (startRadius[1] <= 0)) {
    throw new Error('endRadus and startRadius should be positive')
  }
  if (startAngle < 0 || endAngle < 0) throw new Error('startAngle and endAngle must be positive')

  if (segments < 4) throw new Error('segments must be four or more')

  startAngle = startAngle % (Math.PI * 2)
  endAngle = endAngle % (Math.PI * 2)

  let rotation = (Math.PI * 2)
  if (startAngle < endAngle) {
    rotation = endAngle - startAngle
  }
  if (startAngle > endAngle) {
    rotation = endAngle + ((Math.PI * 2) - startAngle)
  }

  let minradius = Math.min(startRadius[0], startRadius[1], endRadius[0], endRadius[1])
  let minangle = Math.acos(((minradius * minradius) + (minradius * minradius) - (EPS * EPS)) /
                            (2 * minradius * minradius))
  if (rotation < minangle) throw new Error('startAngle and endAngle to not define a significant rotation')

  let slices = Math.floor(segments * (rotation / (Math.PI * 2)))

  let start = vec3.fromValues(0, 0, -(height/2))
  let end = vec3.fromValues(0, 0, height/2)
  let ray = vec3.subtract(end, start)

  let axisZ = vec3.unit(ray)
  let axisX = vec3.unit(vec3.random(axisZ))
  let axisY = vec3.unit(vec3.cross(axisX, axisZ))

  const point = (stack, slice, radius) => {
    let angle = slice * rotation + startAngle
    let out = vec3.add(vec3.scale(radius[0] * Math.cos(angle), axisX), vec3.scale(radius[1] * Math.sin(angle), axisY))
    let pos = vec3.add(vec3.add(vec3.scale(stack, ray), start), out)
    return pos
  }

  // adjust the points to center
  const fromPoints = (...points) => {
    const newpoints = points.map((point) => vec3.add(point, center))
    return poly3.fromPoints(newpoints)
  }

  let polygons = []
  for (let i = 0; i < slices; i++) {
    let t0 = i / slices
    let t1 = (i + 1) / slices

    if (endRadius[0] === startRadius[0] && endRadius[1] === startRadius[1]) {
      polygons.push(fromPoints(start, point(0, t0, endRadius), point(0, t1, endRadius)))
      polygons.push(fromPoints(point(0, t1, endRadius), point(0, t0, endRadius), point(1, t0, endRadius), point(1, t1, endRadius)))
      polygons.push(fromPoints(end, point(1, t1, endRadius), point(1, t0, endRadius)))
    } else {
      if (startRadius[0] > 0) {
        polygons.push(fromPoints(start, point(0, t0, startRadius), point(0, t1, startRadius)))
        polygons.push(fromPoints(point(0, t0, startRadius), point(1, t0, endRadius), point(0, t1, startRadius)))
      }
      if (endRadius[0] > 0) {
        polygons.push(fromPoints(end, point(1, t1, endRadius), point(1, t0, endRadius)))
        polygons.push(fromPoints(point(1, t0, endRadius), point(1, t1, endRadius), point(0, t1, startRadius)))
      }
    }
  }
  if (rotation < (Math.PI * 2)) {
    polygons.push(fromPoints(start, end, point(0, 0, startRadius)))
    polygons.push(fromPoints(point(0, 0, startRadius), end, point(1, 0, endRadius)))
    polygons.push(fromPoints(start, point(0, 1, startRadius), end))
    polygons.push(fromPoints(point(0, 1, startRadius), point(1, 1, endRadius), end))
  }
  let result = geom3.create(polygons)
  return result
}

/** Construct a solid cylinder.
 * @param {Object} [options] - options for construction
 * @param {Array} [options.center=[0,0,0]] - center of cylinder
 * @param {Array} [options.height=2] - height of cylinder
 * @param {Number} [options.startRadisu=1] - radius of cylinder at the start
 * @param {Number} [options.startAngle=0] - start angle of cylinder
 * @param {Number} [options.endRadius=1] - radius of cylinder at the end
 * @param {Number} [options.endAngle=(Math.PI * 2)] - end angle of cylinder
 * @param {Number} [options.segments=12] - number of segments to create per full rotation
 * @returns {geom3} new geometry
 *
 * @example
 * let cylinder = cylinder({
 *   height: 2,
 *   startRadis: 10,
 *   endRadis: 5,
 *   segments: 16
 * })
 */
const cylinder = function (options) {
  const defaults = {
    center: [0, 0, 0],
    height: 2,
    startRadius: 1,
    startAngle: 0,
    endRadius: 1,
    endAngle: (Math.PI * 2),
    segments: 12
  }
  let {center, height, startRadius, startAngle, endRadius, endAngle, segments} = Object.assign({}, defaults, options)

  let newoptions = {
    center: center,
    height: height,
    startRadius: [startRadius, startRadius],
    startAngle: startAngle,
    endRadius: [endRadius, endRadius],
    endAngle: endAngle,
    segments: segments
  }

  return cylinderElliptic(newoptions)
}

module.exports = {
  cylinder,
  cylinderElliptic
}