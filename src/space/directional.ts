import {isSamePoint, Point} from "./point";
import {Dir} from "fs";

export interface Directional {
  point: Point;
  direction?: Point;
  acceleration?: Point;
}

export function isSameDirectional(a: Directional, b: Directional) {
  if (!isSamePoint(a.point, b.point)) {
    return false;
  }
  return (
      isSamePoint(a.point, b.point) &&
      isSamePoint(a.direction, b.direction) &&
      isSamePoint(a.acceleration, b.acceleration)
  )
}