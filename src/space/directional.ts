import { Point } from "./point";

export interface Directional {
  point: Point;
  direction?: Point;
  acceleration?: Point;
}
