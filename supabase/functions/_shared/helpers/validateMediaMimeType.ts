export default function validateMediaMimeType(file: File) {
  const type = file.type;
  if (!type) {
    console.error(`Could not determine mime type for ${file.name}`);
    return;
  }

  if (!type.startsWith('image') && !type.startsWith('video')) {
    console.error(`File ${file.name} is not an image or video`);
    return;
  }
}
