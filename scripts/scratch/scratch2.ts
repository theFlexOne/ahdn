type ParsedImageData = {
  file: File;
  tags?: string[];
  alt: string;
  metadata: Record<string, unknown>;
};

type ImageVariantsData = {
  filenameBase: string;
  variants: {
    mimeType: "image/jpeg" | "image/webp" | "image/avif";
    width: number;
    height: number;
    file: File;
    metadata: {
      tags: string[];
      alt: string;
      [key: string]: unknown;
    };
  }[];
};

const rawFormData: Array<[string, FormDataEntryValue]> = [
  [
    "file[0]",
    new File(["image-1"], "example-image1.jpg", { type: "image/jpeg" }),
  ],
  ["tags[0]", "hero"],
  ["tags[0]", "homepage"],
  ["alt[0]", "My image"],
  ["metadata[0]", JSON.stringify({ section: "home" })],
  [
    "file[1]",
    new File(["image-2"], "example-image2.jpg", { type: "image/jpeg" }),
  ],
  ["tags[1]", "hero"],
  ["tags[1]", "about"],
  ["alt[1]", "My other image"],
  ["metadata[1]", JSON.stringify({ section: "home" })],
];

const formData = new FormData();
rawFormData.forEach(([key, value]) => {
  formData.append(key, value);
});

function parseFormData(formData: FormData): ParsedImageData[] {
  const imageData: ParsedImageData[] = [];

  formData.forEach((value, key) => {
    const match = key.match(/^(\w+)\[(\d+)\]$/);

    if (!match) {
      return;
    }

    const [, keyName, indexValue] = match;
    const index = +indexValue;

    imageData[index] ??= {} as ParsedImageData;

    switch (keyName) {
      case "file":
        imageData[index].file = value as File;
        break;
      case "tags":
        imageData[index].tags ??= [];
        imageData[index].tags.push(value as string);
        break;
      case "alt":
        imageData[index].alt = value as string;
        break;
      case "metadata":
        imageData[index].metadata = JSON.parse(value as string);
        break;
      default:
        console.warn(`Unknown key: ${keyName}`);
        break;
    }
  });
  for (const image of imageData) {
    if (image.alt === undefined) {
      image.alt = image.file.name.split(".")[0];
    }
  }

  return imageData;
}

function testParseFormData(): void {
  const parsed = parseFormData(formData);

  console.log("Test:");
  console.log(formatConsoleValue(formData));
  console.log("Result:");
  console.log(formatConsoleValue(parsed));
}

function formatConsoleValue(value: unknown): string {
  return JSON.stringify(
    value,
    (_key, item) =>
      item instanceof File
        ? { name: item.name, type: item.type, size: item.size }
        : item,
    2,
  );
}

testParseFormData();
