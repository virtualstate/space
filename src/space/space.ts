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
  Blender,
  BlenderConnect,
  BlenderTarget,
  BlendOptions,
} from "@virtualstate/promise";
import { Directional, isSameDirectional } from "./directional";
import { Box } from "./box";
import { match } from "./match";
import { index } from "cheerio/lib/api/traversing";

export interface SpaceConnectOptions extends Omit<BlendOptions, "blended"> {}

export interface BlendedSpaceIndex {
  source: Directional;
  target: Directional;
}

export interface BlendedSpace extends BlendedSpaceIndex {
  promise: Promise<void>;
}

export interface Space<T = unknown>
  extends Blender<T, BlendedSpaceIndex, BlendedSpace>, Box {
  blend(): BlendedSpaceIndex[];
  source(source: AsyncIterable<T>, at: Directional): Directional;
  target(target: BlenderTarget<T>, at: Directional): Directional;
  connect(options?: SpaceConnectOptions): BlendedSpace[];

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

  const targets: Directional[] = [],
    sources: Directional[] = [];

  function matchingBlend() {
    const blended: BlendedIndex[] = [];
    ok(sources.length);
    const sourceIndexes = [...sources.keys()];
    const movementSums = sources.map(({ acceleration, direction }) =>
      pointDimensionsSum(addPoints(acceleration, direction))
    );
    const sums = sources.map((_, index) => movementSums[index]);
    const allZero = [...sums.values()].every((value) => !value);

    if (!allZero) {
      sourceIndexes.sort((a, b) => {
        return sums[a] > sums[b] ? -1 : 1;
      });
    }
    // console.log(JSON.stringify(info, undefined, "  "));

    const matched = match(box, [...sources, ...targets]);

    // console.log({ matched, box });
    ok(matched.size);
    const remaining = [...targets.keys()];
    for (const [value, matches] of matched) {
      if (!matches.length) continue;
      const indexes = matches
        .map((match) => targets.indexOf(match))
        .filter((value) => value > -1);
      const source = sources.indexOf(value);
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

  function getIndex(indexed: Directional[], at: Directional) {
    const expected = indexed.findIndex((index) => isSameDirectional(at, index));
    if (expected > -1) return expected;
    const index = indexed.length;
    indexed.push(at);
    return index;
  }
  function blendInner(blended = matchingBlend()) {
    return blended.map(({ source, target }) => ({
      source: sources[source],
      target: targets[target],
    }));
  }

  return {
    ...box,
    blend() {
      return blendInner();
    },
    source(source, at) {
      const index = getIndex(sources, at);
      blender.source(source, index);
      return at;
    },
    target(target, at) {
      const index = getIndex(targets, at);
      blender.target(target, index);
      return at;
    },
    connect(options?: SpaceConnectOptions) {
      const blended = matchingBlend();
      const output = blendInner(blended);
      const promises = blender.connect({
        ...options,
        blended,
      });
      return output.map((output, index) => ({
        ...output,
        promise: promises[index].promise,
      }));
    },
  };
}
