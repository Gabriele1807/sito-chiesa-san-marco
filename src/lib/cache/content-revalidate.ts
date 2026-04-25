import { revalidateTag } from "next/cache";

export type PublicContentTag = "icone" | "libreria" | "preghiere" | "video-corsi" | "eventi" | "orari";

export function revalidatePublicContent(tag: PublicContentTag) {
  revalidateTag("content", "max");
  revalidateTag(tag, "max");
}
