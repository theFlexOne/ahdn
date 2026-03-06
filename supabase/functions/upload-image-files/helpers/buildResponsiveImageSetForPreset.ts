import { ImagePreset, ImageSet } from "../types.ts";
import buildResponsiveImageSet from "./buildResponsiveImageSet.ts";

type BuildResponsiveImageSetsForPresetOptions = {
  async?: boolean;
};

export default async function buildResponsiveImageSetsForPreset(
  inputs: Parameters<typeof buildResponsiveImageSet>[0][],
  preset: ImagePreset,
  options: BuildResponsiveImageSetsForPresetOptions,
): Promise<ImageSet[]> {
  const {
    async = false,
  } = options;

  const sets: ImageSet[] = [];

  if (async) {
    await Promise.all(
      inputs.map(async (input) => {
        sets.push(await buildResponsiveImageSet(input, preset));
      }),
    );
  } else {
    for (const input of inputs) {
      sets.push(await buildResponsiveImageSet(input, preset));
    }
  }

  return sets;
}
