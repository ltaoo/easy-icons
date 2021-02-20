import { assignAttrsAtTag } from "..";
import { TransformFactory } from "../..";

export const adjustViewBox: TransformFactory = assignAttrsAtTag("svg", () => ({
  viewBox: "0 0 1024 1024",
}));
