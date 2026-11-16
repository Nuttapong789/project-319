import { describe, expect, it } from "vitest";
import { initialOf, shortName } from "./user";

describe("shortName (Navbar)", () => {
  it.each([
    ["THITIWUT TANGTANAKUL", "THITIWUT T."],
    ["  สมชาย   ใจดี  ", "สมชาย ใ."],
    ["บ้านพักน้องจร", "บ้านพักน้องจร"],
    ["ปอง", "ปอง"],
    ["Mary Jane Watson", "Mary J."],
  ])("%j → %j", (name, expected) => {
    expect(shortName(name)).toBe(expected);
  });
});

describe("initialOf (avatar)", () => {
  it.each([
    ["THITIWUT TANGTANAKUL", "T"],
    ["mind", "M"],
    ["มายด์", "ม"],
    ["เอ", "อ"], // ข้ามสระหน้า
    ["ไข่ตุ๋น", "ข"],
    ["", "?"],
  ])("%j → %j", (name, expected) => {
    expect(initialOf(name)).toBe(expected);
  });
});
