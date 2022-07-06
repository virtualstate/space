import { match } from "../../space";
import { Directional } from "../../space/directional";
import { ok } from "../../like";

const items: Directional[] = [
  {
    point: {
      type: "Point",
      dimensions: [0, 0, 0],
    },
    direction: {
      type: "Point",
      dimensions: [50, 50, 50],
    },
  },
  {
    point: {
      type: "Point",
      dimensions: [0, 0, 0],
    },
  },
  {
    point: {
      type: "Point",
      dimensions: [0, 50, 50],
    },
  },
  {
    point: {
      type: "Point",
      dimensions: [100, 100, 100],
    },
  },
];
const map = match(
  {
    type: "Box",
    point: {
      type: "Point",
      dimensions: [0, 0, 0],
    },
    dimensions: [100, 100, 100],
  },
  items
);

const indexed = items
  .map((item) => map.get(item))
  .map((value) => value.map((value) => items.indexOf(value)));

ok(indexed[0].length === 1);
ok(indexed[1].length === 1);
ok(indexed[2].length === 0);
ok(indexed[3].length === 0);

ok(indexed[0][0] === 3);
ok(indexed[1][0] === 0);

// .map((value, index) => console.log(index, value))
