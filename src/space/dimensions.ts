import { isLike } from "../like";

export interface Dimensions {
  type?: string;
  dimensions: number[];
}

export interface IsDimensionsOptions<D extends number = number> {
  dimensions: D;
}

export function isDimensions<D extends Dimensions>(
  value: unknown,
  options?: IsDimensionsOptions<D["dimensions"]["length"]>
): value is D;
export function isDimensions(value: unknown): value is Dimensions;
export function isDimensions(
  value: unknown,
  options?: IsDimensionsOptions
): value is Dimensions {
  if (!(isLike<Dimensions>(value) && Array.isArray(value.dimensions))) {
    return false;
  }
  if (typeof options?.dimensions !== "number") {
    return true;
  }
  return options.dimensions <= value.dimensions.length;
}
