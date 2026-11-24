export type WidenStep<T> = { label: string; pass: (item: T) => boolean };
export type WidenGroup<T> = { label: string; items: T[] };

/** Closest matches first, then every looser match, through to the last ad. */
export function widen<T>(items: T[], steps: WidenStep<T>[]): WidenGroup<T>[] {
  const used = new Set<T>();
  const groups: WidenGroup<T>[] = [];
  for (let index = 0; index < steps.length; index++) {
    const step = steps[index];
    const matched = items.filter((item) => !used.has(item) && step.pass(item));
    if (!matched.length) continue;
    matched.forEach((item) => used.add(item));
    groups.push({ label: index === 0 ? "" : step.label, items: matched });
  }
  return groups;
}

const featuredOrder = new Map<string, string[]>();

function shuffled<T extends { id: string }>(items: T[], bucket: string) {
  const signature = `${bucket}:${[...items.map((item) => item.id)].sort().join("|")}`;
  let ids = featuredOrder.get(signature);
  if (!ids) {
    ids = items.map((item) => item.id);
    for (let index = ids.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [ids[index], ids[swap]] = [ids[swap], ids[index]];
    }
    featuredOrder.set(signature, ids);
  }
  const byId = new Map(items.map((item) => [item.id, item]));
  return ids.map((id) => byId.get(id)).filter((item): item is T => Boolean(item));
}

/** When featuring is on, paid ads sit in a random order at the top. */
export function featureFirst<T extends { id: string; featured?: boolean }>(groups: WidenGroup<T>[], on: boolean, bucket: string): WidenGroup<T>[] {
  if (!on) return groups;
  const featured: T[] = [];
  const rest = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.featured) return true;
        featured.push(item);
        return false;
      }),
    }))
    .filter((group) => group.items.length);
  if (!featured.length) return groups;
  return [{ label: "Featured", items: shuffled(featured, bucket) }, ...rest];
}

export function randomFeatured<T extends { id: string }>(items: T[], bucket: string) {
  return shuffled(items, bucket);
}
