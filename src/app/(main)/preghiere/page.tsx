import { getTranslations } from "next-intl/server";
import { getPreghiere, getVideoCorsi } from "@/lib/db";
import PreghiereTabs from "@/components/PreghiereTabs";

export const revalidate = 60;

const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@SanMarco-Milano/videos";

export default async function PreghierePage() {
  const [t, preghiere, videoCorsi] = await Promise.all([
    getTranslations("preghiere"),
    getPreghiere(),
    getVideoCorsi(),
  ]);

  const texts = {
    titolo: t("titolo"),
    sottotitolo: t("sottotitolo"),
    sezionePreghiereTitolo: t("sezionePreghiereTitolo"),
    sezionePreghiereDescrizione: t("sezionePreghiereDescrizione"),
    leggiTesto: t("leggiTesto"),
    sezioneVideoTitolo: t("sezioneVideoTitolo"),
    sezioneVideoDescrizione: t("sezioneVideoDescrizione"),
    videoIntro: t("videoIntro"),
    videoApri: t("videoApri"),
    videoApriCanale: t("videoApriCanale"),
    youtubeChannel: YOUTUBE_CHANNEL_URL,
  } as Record<string, string>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 animate-fade-in-up">{texts.titolo}</h1>
        <p className="text-gray-600 leading-relaxed max-w-2xl animate-fade-in-up [animation-delay:100ms]">{texts.sottotitolo}</p>
      </div>

      <PreghiereTabs preghiere={preghiere} videoCorsi={videoCorsi} texts={texts} />
    </div>
  );
}
