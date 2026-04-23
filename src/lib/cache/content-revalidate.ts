import { revalidateTag } from "next/cache";

export type PublicContentTag = "icone" | "libreria" | "preghiere" | "eventi" | "orari";

export function revalidatePublicContent(tag: PublicContentTag) {
  revalidateTag("content");
  revalidateTag(tag);
}
