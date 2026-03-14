import { ImageData, ImageSet } from "../types.ts";
import buildImageSet from "./buildImageSet.ts";

type BuildImageSetsOptions = {
  async?: boolean;
};

export default async function buildImageSets(
  inputs: ImageData[],
  options: BuildImageSetsOptions = {},
): Promise<ImageSet[]> {
  const { async: shouldBuildInParallel = false } = options;

  if (shouldBuildInParallel) {
    return Promise.all(inputs.map((input) => buildImageSet(input)));
  }

  const sets: ImageSet[] = [];

  for (const input of inputs) {
    sets.push(await buildImageSet(input));
  }

  return sets;
}
