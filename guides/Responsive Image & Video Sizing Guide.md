# Responsive Image & Video Sizing Guide

**Practical production defaults with minimal variants (3 per class)**

This guide defines consistent, production-ready presets for responsive images and video across devices and connection types. Each media class uses **exactly three variants** to minimize storage and processing overhead.

For each class:

- Variant 1 = small/mobile
- Variant 2 = standard desktop max display size
- Variant 3 = ~1.5× the recommended max display width (rounded to a common standard width)

---

# Images

## General Principles

- Prefer **AVIF**, then **WebP**, with **JPEG fallback**.
- Always define `width` and `height` attributes (or CSS `aspect-ratio`).
- Use `srcset` + `sizes`.
- Use `loading="lazy"` for non-critical images.
- Pre-crop images to match layout aspect ratios.

---

## 1. Thumbnail / Card Images

**Typical max display width:** 400px
**Largest variant target:** ~600px (≈ 1.5 × 400 → rounded to 640)

### Variants

| Variant | Width | Use Case              |
| ------- | ----- | --------------------- |
| Small   | 240px | Small mobile grids    |
| Medium  | 400px | Standard card display |
| Large   | 640px | High-DPR / retina     |

### Target File Sizes

- AVIF/WebP: **5–40 KB**
- JPEG fallback: **20–80 KB**

### Example

```html
<img
  src="/img/card-400.avif"
  srcset="
    /img/card-240.avif 240w,
    /img/card-400.avif 400w,
    /img/card-640.avif 640w
  "
  sizes="(max-width: 768px) 50vw, 400px"
  width="400"
  height="300"
  loading="lazy"
  decoding="async"
  alt=""
/>
```

---

## 2. Content Images (Article / Body Images)

**Typical max display width:** 900px
**Largest variant target:** ~1350px (rounded to 1440)

### Variants

| Variant | Width  | Use Case                |
| ------- | ------ | ----------------------- |
| Small   | 600px  | Mobile portrait         |
| Medium  | 900px  | Desktop content width   |
| Large   | 1440px | Retina / large displays |

### Target File Sizes

- AVIF/WebP: **40–200 KB**
- JPEG fallback: **80–300 KB**

### Example

```html
<img
  src="/img/content-900.avif"
  srcset="
    /img/content-600.avif   600w,
    /img/content-900.avif   900w,
    /img/content-1440.avif 1440w
  "
  sizes="(max-width: 1024px) 90vw, 900px"
  width="900"
  height="600"
  loading="lazy"
  decoding="async"
  alt=""
/>
```

---

## 3. Hero / Banner Images (Full Bleed)

**Typical max display width:** 1280px
**Largest variant target:** ~1920px (standard full HD width)

### Variants

| Variant | Width  | Use Case               |
| ------- | ------ | ---------------------- |
| Small   | 768px  | Mobile hero            |
| Medium  | 1280px | Standard desktop       |
| Large   | 1920px | Retina / large desktop |

### Target File Sizes

- AVIF/WebP: **100–400 KB**
- JPEG fallback: **200–600 KB**

### Example

```html
<img
  src="/img/hero-1280.avif"
  srcset="
    /img/hero-768.avif   768w,
    /img/hero-1280.avif 1280w,
    /img/hero-1920.avif 1920w
  "
  sizes="100vw"
  width="1280"
  height="720"
  fetchpriority="high"
  alt=""
/>
```

---

# Video

## General Principles

- Use **H.264 MP4** for universal compatibility.
- Optionally include **AV1/WebM** as an enhancement.
- Always provide a **poster image**.
- Use `preload="none"` unless the video is critical.
- Background videos must be `muted autoplay playsinline loop`.

---

## 1. Background Hero Video

**Typical max display width:** 1280px
**Largest variant target:** ~1920px

Keep duration short (≤10 seconds recommended).

### Variants

| Variant | Resolution | Recommended Bitrate |
| ------- | ---------- | ------------------- |
| Small   | 480p       | 0.5–1.0 Mbps        |
| Medium  | 720p       | 1.0–2.5 Mbps        |
| Large   | 1080p      | 2.5–5 Mbps          |

**Target size for 8–10 sec clip:** ~0.5–4 MB

### Example

```html
<video
  muted
  autoplay
  playsinline
  loop
  preload="none"
  poster="/img/hero-1280.avif"
>
  <source src="/video/hero-720.mp4" type="video/mp4" />
</video>
```

---

## 2. Inline Content Video

**Typical max display width:** 900px
**Largest variant target:** ~1350px (rounded to 1440 width class → use 1080p)

### Variants

| Variant | Resolution | Recommended Bitrate |
| ------- | ---------- | ------------------- |
| Small   | 360p       | 0.5–1 Mbps          |
| Medium  | 720p       | 2–4 Mbps            |
| Large   | 1080p      | 4–8 Mbps            |

### Example

```html
<video controls preload="metadata" poster="/img/video-thumb-900.avif">
  <source src="/video/content-720.mp4" type="video/mp4" />
</video>
```

---

# Handling Slower Connections

### Recommended Strategy

1. Always use responsive `srcset`.
2. Respect:
   - `prefers-reduced-motion`
   - `Save-Data`

3. On slow networks:
   - Avoid background autoplay video.
   - Default to small or medium variant.

4. For motion-sensitive users:
   - Replace background video with static poster image.

---

# Summary of Production Presets

## Images

| Class      | Widths            |
| ---------- | ----------------- |
| Thumbnails | 240 / 400 / 640   |
| Content    | 600 / 900 / 1440  |
| Hero       | 768 / 1280 / 1920 |

## Video

| Class      | Resolutions         |
| ---------- | ------------------- |
| Background | 480p / 720p / 1080p |
| Inline     | 360p / 720p / 1080p |

---

These presets provide:

- Minimal storage overhead
- Retina coverage
- Controlled bandwidth usage
- Clean scaling across device sizes
- Strong Core Web Vitals performance

If needed, these can be translated into automated encoding presets (e.g., ffmpeg pipelines or edge-function image transforms).
