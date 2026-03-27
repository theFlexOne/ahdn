export type ImageDimensions = {
  width: number;
  height: number;
};

const SOF_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

const ISO_CONTAINER_BOX_TYPES = new Set([
  'meta',
  'iprp',
  'ipco',
  'moov',
  'trak',
  'mdia',
  'minf',
  'stbl',
  'edts',
  'dinf',
  'udta',
]);

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  return new TextDecoder('ascii').decode(bytes.subarray(offset, offset + length));
}

function readUint16BE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function readUint24LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] * 0x1000000 +
    (bytes[offset + 1] << 16) +
    (bytes[offset + 2] << 8) +
    bytes[offset + 3]
  );
}

function readUint64BE(bytes: Uint8Array, offset: number): number {
  const value =
    (BigInt(bytes[offset]) << 56n) |
    (BigInt(bytes[offset + 1]) << 48n) |
    (BigInt(bytes[offset + 2]) << 40n) |
    (BigInt(bytes[offset + 3]) << 32n) |
    (BigInt(bytes[offset + 4]) << 24n) |
    (BigInt(bytes[offset + 5]) << 16n) |
    (BigInt(bytes[offset + 6]) << 8n) |
    BigInt(bytes[offset + 7]);

  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error('Image box size exceeds supported range');
  }

  return Number(value);
}

function validateDimensions(width: number, height: number, format: string): ImageDimensions {
  if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
    throw new Error(`Invalid ${format} image dimensions`);
  }

  return { width, height };
}

function isPng(bytes: Uint8Array): boolean {
  return bytes.length >= 24 && bytes[0] === 0x89 && readAscii(bytes, 1, 3) === 'PNG';
}

function isGif(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 10 &&
    (readAscii(bytes, 0, 6) === 'GIF87a' || readAscii(bytes, 0, 6) === 'GIF89a')
  );
}

function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8;
}

function isWebp(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 16 && readAscii(bytes, 0, 4) === 'RIFF' && readAscii(bytes, 8, 4) === 'WEBP'
  );
}

function isAvif(bytes: Uint8Array): boolean {
  if (bytes.length < 16 || readAscii(bytes, 4, 4) !== 'ftyp') {
    return false;
  }

  const brands = readAscii(bytes, 8, Math.min(16, bytes.length - 8));
  return brands.includes('avif') || brands.includes('avis');
}

function extractPngDimensions(bytes: Uint8Array): ImageDimensions {
  if (readAscii(bytes, 12, 4) !== 'IHDR') {
    throw new Error('PNG image is missing an IHDR chunk');
  }

  return validateDimensions(readUint32BE(bytes, 16), readUint32BE(bytes, 20), 'PNG');
}

function extractGifDimensions(bytes: Uint8Array): ImageDimensions {
  return validateDimensions(bytes[6] | (bytes[7] << 8), bytes[8] | (bytes[9] << 8), 'GIF');
}

function extractJpegDimensions(bytes: Uint8Array): ImageDimensions {
  let offset = 2;

  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    while (offset < bytes.length && bytes[offset] === 0xff) {
      offset += 1;
    }

    const marker = bytes[offset];
    offset += 1;

    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      continue;
    }

    if (offset + 2 > bytes.length) {
      break;
    }

    const segmentLength = readUint16BE(bytes, offset);

    if (segmentLength < 2 || offset + segmentLength > bytes.length) {
      throw new Error('JPEG image contains an invalid segment');
    }

    if (SOF_MARKERS.has(marker)) {
      if (segmentLength < 7) {
        throw new Error('JPEG SOF segment is too short');
      }

      return validateDimensions(
        readUint16BE(bytes, offset + 5),
        readUint16BE(bytes, offset + 3),
        'JPEG',
      );
    }

    offset += segmentLength;
  }

  throw new Error('JPEG image dimensions could not be determined');
}

function extractWebpDimensions(bytes: Uint8Array): ImageDimensions {
  const chunkType = readAscii(bytes, 12, 4);
  const chunkDataOffset = 20;

  if (chunkType === 'VP8X') {
    return validateDimensions(readUint24LE(bytes, 24) + 1, readUint24LE(bytes, 27) + 1, 'WebP');
  }

  if (chunkType === 'VP8L') {
    const b0 = bytes[21];
    const b1 = bytes[22];
    const b2 = bytes[23];
    const b3 = bytes[24];

    return validateDimensions(
      1 + (((b1 & 0x3f) << 8) | b0),
      1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
      'WebP',
    );
  }

  if (chunkType === 'VP8 ') {
    if (
      bytes[chunkDataOffset + 3] !== 0x9d ||
      bytes[chunkDataOffset + 4] !== 0x01 ||
      bytes[chunkDataOffset + 5] !== 0x2a
    ) {
      throw new Error('WebP VP8 image is missing its frame marker');
    }

    const width = bytes[chunkDataOffset + 6] | ((bytes[chunkDataOffset + 7] & 0x3f) << 8);
    const height = bytes[chunkDataOffset + 8] | ((bytes[chunkDataOffset + 9] & 0x3f) << 8);

    return validateDimensions(width, height, 'WebP');
  }

  throw new Error(`Unsupported WebP chunk type "${chunkType}"`);
}

function findAvifDimensions(bytes: Uint8Array, start: number, end: number): ImageDimensions | null {
  let offset = start;

  while (offset + 8 <= end) {
    let boxSize = readUint32BE(bytes, offset);
    const boxType = readAscii(bytes, offset + 4, 4);
    let headerSize = 8;

    if (boxSize === 1) {
      if (offset + 16 > end) {
        break;
      }

      boxSize = readUint64BE(bytes, offset + 8);
      headerSize = 16;
    } else if (boxSize === 0) {
      boxSize = end - offset;
    }

    if (boxSize < headerSize || offset + boxSize > end) {
      break;
    }

    const payloadStart = offset + headerSize;
    const payloadEnd = offset + boxSize;

    if (boxType === 'ispe') {
      if (payloadStart + 12 > payloadEnd) {
        throw new Error('AVIF image has an invalid ispe box');
      }

      return validateDimensions(
        readUint32BE(bytes, payloadStart + 4),
        readUint32BE(bytes, payloadStart + 8),
        'AVIF',
      );
    }

    if (boxType === 'meta') {
      if (payloadStart + 4 > payloadEnd) {
        throw new Error('AVIF meta box is truncated');
      }

      const dimensions = findAvifDimensions(bytes, payloadStart + 4, payloadEnd);

      if (dimensions) {
        return dimensions;
      }
    } else if (ISO_CONTAINER_BOX_TYPES.has(boxType)) {
      const dimensions = findAvifDimensions(bytes, payloadStart, payloadEnd);

      if (dimensions) {
        return dimensions;
      }
    }

    offset = payloadEnd;
  }

  return null;
}

function extractAvifDimensions(bytes: Uint8Array): ImageDimensions {
  const dimensions = findAvifDimensions(bytes, 0, bytes.length);

  if (!dimensions) {
    throw new Error('AVIF image dimensions could not be determined');
  }

  return dimensions;
}

export default function extractImageDimensions(
  bytes: Uint8Array,
  mimeType?: string,
): ImageDimensions {
  const normalizedMimeType = mimeType?.toLowerCase();

  if (normalizedMimeType === 'image/png' || isPng(bytes)) {
    return extractPngDimensions(bytes);
  }

  if (normalizedMimeType === 'image/gif' || isGif(bytes)) {
    return extractGifDimensions(bytes);
  }

  if (normalizedMimeType === 'image/jpeg' || isJpeg(bytes)) {
    return extractJpegDimensions(bytes);
  }

  if (normalizedMimeType === 'image/webp' || isWebp(bytes)) {
    return extractWebpDimensions(bytes);
  }

  if (normalizedMimeType === 'image/avif' || isAvif(bytes)) {
    return extractAvifDimensions(bytes);
  }

  throw new Error(
    normalizedMimeType
      ? `Unsupported image format "${normalizedMimeType}"`
      : 'Unsupported image format',
  );
}
