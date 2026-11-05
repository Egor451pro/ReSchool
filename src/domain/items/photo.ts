export function categoryPlaceholderPath(slug: string): string {
  if (!/^[a-z0-9-]+$/.test(slug)) return "/placeholders/other.svg";
  return `/placeholders/${slug}.svg`;
}

export function itemPhotoSrc(photo: { id: string; path: string }): string {
  if (/^\/placeholders\/[a-z0-9-]+\.svg$/.test(photo.path)) return photo.path;
  return `/catalog/photos/${photo.id}`;
}
