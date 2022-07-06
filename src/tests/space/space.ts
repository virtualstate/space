import { space } from "../../space";
import { all } from "@virtualstate/promise";

const blender = space({
  box: {
    type: "Box",
    point: {
      type: "Point",
      dimensions: [0, 0, 0],
    },
    dimensions: [100, 100, 100],
  },
});

blender.source(
  {
    async *[Symbol.asyncIterator]() {
      yield 1;
      yield 1;
      yield 1;
      yield 1;
    },
  },
  {
    point: {
      type: "Point",
      dimensions: [0, 0, 0],
    },
  }
);
blender.source(
  {
    async *[Symbol.asyncIterator]() {
      yield 2;
      yield 3;
      yield 4;
      yield 5;
    },
  },
  {
    point: {
      type: "Point",
      dimensions: [100, 100, 100],
    },
    direction: {
      type: "Point",
      dimensions: [-25, -25, -25],
    },
  }
);
blender.source(
  {
    async *[Symbol.asyncIterator]() {
      yield 9;
      yield 6;
      yield 3;
      yield 1;
    },
  },
  {
    point: {
      type: "Point",
      dimensions: [0, 0, 0],
    },
    direction: {
      type: "Point",
      dimensions: [25, 25, 25],
    },
  }
);

blender.target(console.log.bind(console, "0, 0, 0: "), {
  point: {
    type: "Point",
    dimensions: [0, 0, 0],
  },
});
blender.target(console.log.bind(console, "0, 50, 50: "), {
  point: {
    type: "Point",
    dimensions: [0, 50, 50],
  },
});
blender.target(console.log.bind(console, "100, 100, 100: "), {
  point: {
    type: "Point",
    dimensions: [100, 100, 100],
  },
});

const blended = blender.connect();

console.log({ blended });

try {
  await all(...blended.map(({ promise }) => promise));
} catch (error) {
  if (error instanceof AggregateError) {
    console.error(error.errors);
  }
  throw error;
}
