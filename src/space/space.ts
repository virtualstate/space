import { ok } from "../like";
import {
  addPoints,
  isPointZero,
  isSamePoint,
  pointDimensionsSum,
} from "./point";
import {
  blend,
  Blended,
  BlendedIndex,
  BlenderConnect,
  BlenderTarget,
  BlendOptions,
} from "@virtualstate/promise";
import { Directional } from "./directional";
import { Box } from "./box";
import { match } from "./match";

export interface SpaceConnectOptions extends Omit<BlendOptions, "blended"> {}

export interface Space<T = unknown> extends BlenderConnect {
  source(source: AsyncIterable<T>, at: Directional): Directional;
  target(target: BlenderTarget<T>, at: Directional): Directional;
  connect(options?: SpaceConnectOptions): Blended[];
}

export interface SpaceOptions {
  box: Box;
}

export function space<T = unknown>(options: SpaceOptions): Space<T> {
  const { box } = options;

  ok(
    box,
    "Expected box for now, please open an issue to implement a different shape"
  );

  const blender = blend<T>();

  const indexed: Directional[] = [];
  function matchingBlend() {
    const blended: BlendedIndex[] = [];
    const info = [...indexed];

    const movementSums = info.map(({ acceleration, direction }) =>
      pointDimensionsSum(addPoints(acceleration, direction))
    );

    const sums = new Map(
      Array.from(info.entries()).map(
        ([index, value]) => [value, movementSums[index]] as const
      )
    );

    const allZero = [...sums.values()].every((value) => !value);

    if (!allZero) {
      info.sort((a, b) => {
        return sums.get(a) > sums.get(b) ? -1 : 1;
      });
    }
    console.log(JSON.stringify(info, undefined, "  "));

    ok(info.length);
    const matched = match(box, info);

    console.log({ matched, box });
    ok(matched.size);
    const remaining = [...info.keys()];
    for (const [value, matches] of matched) {
      if (!matches.length) continue;
      const indexes = matches.map((match) => info.indexOf(match));
      const source = info.indexOf(value);
      for (const index of indexes) {
        const remainingIndex = remaining.indexOf(index);
        if (remainingIndex === -1) continue;
        remaining.splice(remainingIndex, 1);
        blended.push({
          source,
          target: index,
        });
      }
    }
    return blended;
  }

  function getIndex(at: Directional) {
    const expected = indexed.findIndex((index) =>
      isSamePoint(at.point, index.point)
    );
    if (expected > -1) return expected;
    const index = indexed.length;
    indexed.push(at);
    return index;
  }

  return {
    source(source, at) {
      const index = getIndex(at);
      blender.source(source, index);
      return at;
    },
    target(target, at) {
      const index = getIndex(at);
      blender.target(target, index);
      return at;
    },
    connect(options?: SpaceConnectOptions) {
      const blended = matchingBlend();
      return blender.connect({
        ...options,
        blended,
      });
    },
  };
}
