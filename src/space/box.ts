import {
  isPoint,
  isPoint2D,
  isPoint3D,
  Point,
  Point2D,
  Point3D,
} from "./point";
import { Dimensions, isDimensions, IsDimensionsOptions } from "./dimensions";
import { ok, isLike } from "../like";

export interface Box extends Dimensions {
  type: "Box";
  point: Point;
}

export interface Box2D extends Box {
  point: Point2D;
  dimensions: [number, number];
}

export interface Box3D extends Box {
  point: Point3D;
  dimensions: [number, number, number];
}

export interface BoxPointMapperOptions {
  from: Point;
  direction?: Point;
  box: Box;
}

export interface BoxPointMapper {
  (options: BoxPointMapperOptions): Point;
}

export function createBoxPointMapper2D(): BoxPointMapper {
  return ({ from, direction, box }) => {
    ok(isPoint2D(from));
    ok(isBox2D(box));
    if (!direction) {
      return from; // No change
    }
    ok(isPoint2D(direction));
    return {
      ...from,
      dimensions: [
        from.dimensions[0] + direction.dimensions[0],
        from.dimensions[1] + direction.dimensions[1],
      ],
    };
  };
}

export function createBoxPointMapper3D(): BoxPointMapper {
  return ({ from, direction, box }) => {
    ok(isPoint3D(from));
    ok(isBox3D(box));
    if (!direction) {
      return from; // No change
    }
    ok(isPoint3D(direction));
    return {
      ...from,
      dimensions: [
        from.dimensions[0] + direction.dimensions[0],
        from.dimensions[1] + direction.dimensions[1],
        from.dimensions[2] + direction.dimensions[2],
      ],
    };
  };
}

export function createBoxPointMapper(): BoxPointMapper {
  return ({ from, direction, box }) => {
    ok(isPoint(from));
    ok(isBox(box));
    if (!direction) {
      return from; // No change
    }
    ok(isPoint(direction));

    return add(from, direction);

    function add(a: Point, b: Point) {
      // Ensure same dimensions or right has a larger dimension
      ok(isPoint(a, { dimensions: b.dimensions.length }));
      return {
        ...a,
        dimensions: a.dimensions.map((value, index) => {
          return b.dimensions[index] + value;
        }),
      };
    }
  };
}

export function isBox<B extends Box>(
  value: unknown,
  options?: IsDimensionsOptions<B["dimensions"]["length"]>
): value is B;
export function isBox(value: unknown): value is Box;
export function isBox(
  value: unknown,
  options?: IsDimensionsOptions
): value is Box {
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

export function isBox2D(value: unknown): value is Box2D {
  return isBox<Box2D>(value, { dimensions: 2 });
}

export function isBox3D(value: unknown): value is Box3D {
  return isBox<Box3D>(value, { dimensions: 3 });
}

export function directClipInBox(point: Point, box: Box) {
  ok(point.dimensions.length);
  return {
    ...point,
    dimensions: point.dimensions.map((value, index) =>
      directClipValueInBox(index, value, box)
    ),
  };
}

function directClipValueInBox(dimension: number, value: number, box: Box) {
  const min = box.point.dimensions[dimension],
    max = min + box.dimensions[dimension];
  return Math.max(min, Math.min(max, value));
}

function isValueInsideBox(dimension: number, point: Point, box: Box) {
  const min = box.point.dimensions[dimension],
    max = min + box.dimensions[dimension],
    value = point.dimensions[dimension];
  return value >= min && value <= max;
}

export function isInsideBox(point: Point, box: Box) {
  ok(box.dimensions.length);
  return box.dimensions.every((_, index) =>
    isValueInsideBox(index, point, box)
  );
}
