const vec3 = require('../math/vec3')

const geom3 = require('../geometry/geom3')
const poly3 = require('../geometry/poly3')

/** Construct an ellipsoid.
 * @param {Object} [options] - options for construction
 * @param {Array} [options.center=[0,0,0]] - center of ellipsoid
 * @param {Array} [options.radius=[1,1,1]] - radius of ellipsoid, along X, Y and Z
 * @param {Number} [options.segments=12] - number of segements to create per 360 rotation
 * @param {Array} [options.axes] -  an array with three vectors for the x, y and z base vectors
 * @returns {geom3} new 3D geometry
 *
 * @example
 * let myshape = ellipsoid({center: [5, 5, 5], radius: [5, 10, 20]})
*/
const ellipsoid = (options) => {
  const defaults = {
    center: [0, 0, 0],
    radius: [1, 1, 1],
    segments: 12,
    axes: [[1, 0, 0], [0, -1, 0], [0, 0, 1]]
  }
  let {center, radius, segments, axes} = Object.assign({}, defaults, options)

  if (!Array.isArray(center)) throw new Error('center must be an array')
  if (center.length < 3) throw new Error('center must contain X, Y and Z values')

  if (!Array.isArray(radius)) throw new Error('radius must be an array')
  if (radius.length < 3) throw new Error('radius must contain X, Y and Z values')

  if (segments < 4) throw new Error('segments must be four or more')

  let xvector = vec3.scale(radius[0], vec3.unit(axes[0]))
  let yvector = vec3.scale(radius[1], vec3.unit(axes[1]))
  let zvector = vec3.scale(radius[2], vec3.unit(axes[2]))

  let qsegments = Math.round(segments / 4)
  let prevcylinderpoint
  let polygons = []
  for (let slice1 = 0; slice1 <= segments; slice1++) {
    let angle = Math.PI * 2.0 * slice1 / segments
    let cylinderpoint = vec3.add(vec3.scale(Math.cos(angle), xvector), vec3.scale(Math.sin(angle), yvector))
    if (slice1 > 0) {
      let prevcospitch, prevsinpitch
      for (let slice2 = 0; slice2 <= qsegments; slice2++) {
        let pitch = 0.5 * Math.PI * slice2 / qsegments
        let cospitch = Math.cos(pitch)
        let sinpitch = Math.sin(pitch)
        if (slice2 > 0) {
          let points = []
          let point
          point = vec3.subtract(vec3.scale(prevcospitch, prevcylinderpoint), vec3.scale(prevsinpitch, zvector))
          points.push(vec3.add(center, point))
          point = vec3.subtract(vec3.scale(prevcospitch, cylinderpoint), vec3.scale(prevsinpitch, zvector))
          points.push(vec3.add(center, point))
          if (slice2 < qsegments) {
            point = vec3.subtract(vec3.scale(cospitch, cylinderpoint), vec3.scale(sinpitch, zvector))
            points.push(vec3.add(center, point))
          }
          point = vec3.subtract(vec3.scale(cospitch, prevcylinderpoint), vec3.scale(sinpitch, zvector))
          points.push(vec3.add(center, point))

          polygons.push(poly3.fromPoints(points))

          points = []
          point = vec3.add(vec3.scale(prevcospitch, prevcylinderpoint), vec3.scale(prevsinpitch, zvector))
          points.push(vec3.add(center, point))
          point = vec3.add(vec3.scale(prevcospitch, cylinderpoint), vec3.scale(prevsinpitch, zvector))
          points.push(vec3.add(center, point))
          if (slice2 < qsegments) {
            point = vec3.add(vec3.scale(cospitch, cylinderpoint), vec3.scale(sinpitch, zvector))
            points.push(vec3.add(center, point))
          }
          point = vec3.add(vec3.scale(cospitch, prevcylinderpoint), vec3.scale(sinpitch, zvector))
          points.push(vec3.add(center, point))
          points.reverse()

          polygons.push(poly3.fromPoints(points))
        }
        prevcospitch = cospitch
        prevsinpitch = sinpitch
      }
    }
    prevcylinderpoint = cylinderpoint
  }
  return geom3.create(polygons)
}

/**
 * Construct a sphere where are points are at the same distance from the center.
 * @see {@link ellipsoid} for additional options, as this is an alias for ellipsoid
 * @param {Object} [options] - options for construction
 * @param {Array} [options.center=[0,0,0]] - center of sphere
 * @param {Number} [options.radius=1] - radius of sphere
 * @param {Number} [options.segments=12] - number of segments to create per 360 rotation
 * @param {Array} [options.axes] -  an array with three vectors for the x, y and z base vectors
 * @returns {geom3} new 3D geometry
*/
const sphere = (options) => {
  const defaults = {
    center: [0, 0, 0],
    radius: 1,
    segments: 12,
    axes: [[1, 0, 0], [0, -1, 0], [0, 0, 1]]
  }
  let {center, radius, segments, axes} = Object.assign({}, defaults, options)

  // TODO check that radius is a number

  radius = [radius, radius, radius]

  return ellipsoid({center: center, radius: radius, segments: segments, axes: axes})
}

module.exports = {
  ellipsoid,
  sphere
}
