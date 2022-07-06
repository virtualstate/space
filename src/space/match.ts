import { getWithinRadius, isSamePoint, Point, projectPoint } from "./point";
import { Box, isInsideBox } from "./box";
import { ok } from "../like";
import { Directional } from "./directional";

export function match(
  box: Box,
  items: Directional[]
): Map<Directional, Directional[]> {
  const within = items.filter((item) => isInsideBox(item.point, box));
  ok(
    within.length === items.length,
    "Expected all given points to be within box"
  );
  const lines = items.map(
    (point) => [point.point, projectPoint(point, box)] as const
  );

  // TODO, should be the smallest number we see, or just 5
  const maximumDirection = items.reduce(
    (sum, value) =>
      Math.min(
        sum,
        ...(value.direction?.dimensions ?? [])
          .filter(Boolean)
          .map((value) => Math.abs(value))
      ),
    5
  );

  if (!maximumDirection) return new Map();

  const projected = lines.map(([, target]) => target);

  console.log("Projected", { maximumDirection });
  // console.log(JSON.stringify(projected, undefined, "  "));

  // Now group projected -> items[].point
  return new Map(
    projected.flatMap((point, index) => {
      const points = [...items.map(({ point }) => point)];
      // Remove the current item
      points.splice(index, 1);
      const matches = getWithinRadius({
        point,
        points,
        radius: maximumDirection,
      });
      return [
        [items[index], items.filter(({ point }) => matches.includes(point))],
      ] as const;
    })
  );
}
