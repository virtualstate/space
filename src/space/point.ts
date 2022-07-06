import { Dimensions, isDimensions, IsDimensionsOptions } from "./dimensions";
import { ok } from "../like";
import { Box, directClipInBox, isInsideBox } from "./box";
import { Directional } from "./directional";

export interface Point extends Dimensions {
  type: "Point";
}

export interface Point2D extends Point {
  dimensions: [number, number];
}

export interface Point3D extends Point {
  dimensions: [number, number, number];
}

export function isPoint<P extends Point>(
  value: unknown,
  options?: IsDimensionsOptions<P["dimensions"]["length"]>
): value is P;
export function isPoint(value: unknown): value is Point;
export function isPoint(
  value: unknown,
  options?: IsDimensionsOptions
): value is Point {
  if (!isDimensions(value, options)) {
    return false;
  }
  if (value.type !== "Point") {
    return false;
  }
  if (typeof options?.dimensions !== "number") {
    return true;
  }
  return options.dimensions <= value.dimensions.length;
}

export function isPoint2D(value: unknown): value is Point2D {
  return isPoint<Point2D>(value, { dimensions: 2 });
}

export function isPoint3D(value: unknown): value is Point3D {
  return isPoint<Point3D>(value, { dimensions: 3 });
}

export function isSamePoint(a: Point, b: Point) {
  if (!a && !b) return true;
  if (a === b) return true;
  if (a.dimensions.length !== b.dimensions.length) return false;
  return a.dimensions.every((value, index) => b[index] === index);
}

export interface WithinRadiusOptions {
  point: Point;
  radius: number;
  points: Point[];
}

export function getWithinRadius({
  point,
  radius,
  points,
}: WithinRadiusOptions): Point[] {
  const diameter = radius + radius;
  const negativeRadius = -radius;
  const box: Box = {
    type: "Box",
    point: addPoints(point, {
      type: "Point",
      // Shift backwards by radius in all dimensions
      // from the point
      // We will then
      dimensions: point.dimensions.map(() => negativeRadius),
    }),
    dimensions: point.dimensions.map(() => diameter),
  };

  // console.log(JSON.stringify({ box }, undefined, "  "));

  const withinBox = points.filter((point) => isInsideBox(point, box));

  // console.log(JSON.stringify({ withinBox }, undefined, "  "));

  if (!withinBox.length) {
    return [];
  }

  // For now just use a box, it is an approximation for now
  //
  // that is okay for what I am wanting at the moment
  return withinBox;
}

export function isPointZero(point: Point) {
  const value = point.dimensions.reduce((sum, value) => sum + value, 0);
  return value === 0;
}

export function addPoints(point: Point, ...points: Point[]) {
  const filtered = points.filter(Boolean);
  const dimensions = filtered.reduce(
    (dimensions, point) => Math.max(dimensions, point.dimensions.length),
    0
  );
  // ok(dimensions);
  if (!point) {
    return addPoints(
      {
        type: "Point",
        dimensions: Array.from({ length: dimensions }, () => 0),
      },
      ...points
    );
  }
  return filtered.reduce((sum, next) => {
    ok(
      isPoint(sum, {
        dimensions,
      })
    );
    return {
      ...sum,
      dimensions: [
        ...sum.dimensions,
        ...Array.from({ length: dimensions - sum.dimensions.length }, () => 0),
      ].map((a, index) => a + next.dimensions[index]),
    };
  }, point);
}

export function projectPoint(
  { point, direction, acceleration }: Directional,
  box: Box
): Point {
  const change = addPoints(direction, acceleration);
  if (isPointZero(change)) {
    return point;
  }
  ok(isInsideBox(point, box), "Expected point to within box");
  // This is not how to do math, this is me just making
  // the worst way to do this, but just trying to do it quickly and direct to the point
  // as to what kind of value I am after.
  //
  // Instead, for each dimension of our point
  // we need to create a maximum line from where it is to the edge of the box
  // We can find the intersection the planes of the box with the line
  //
  // but for that I have do more math, the function signature will be the same though
  let shifted: Point = point;
  do {
    shifted = addPoints(shifted, change);
  } while (isInsideBox(shifted, box));
  return directClipInBox(shifted, box);
}

export function pointDimensionsSum(point: Point) {
  // console.log(point.dimensions);
  return point.dimensions.reduce((sum, value) => sum + Math.abs(value), 0);
}
