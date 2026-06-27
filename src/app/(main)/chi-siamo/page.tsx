import { getLocale } from "next-intl/server";
import { BookOpen, Church, Cross, Landmark, Users } from "lucide-react";

type Copy = {
  title: string;
  intro: string;
  missionTitle: string;
  mission: string;
  communityTitle: string;
  community: string;
  institutionTitle: string;
  institutionIntro: string;
  institutionItems: { title: string; body: string }[];
  milanTitle: string;
  milanItems: { title: string; body: string }[];
  notes: string;
};

const IT_COPY: Copy = {
  title: "Chi siamo",
  intro:
    "La Chiesa Copta Ortodossa di San Marco a Milano appartiene alla Chiesa Copta Ortodossa di Alessandria, una Chiesa apostolica fondata dalla predicazione di San Marco Evangelista in Egitto. La nostra comunità vive la tradizione liturgica, sacramentale e pastorale della Chiesa madre, custodendo la fede ortodossa e servendo i fedeli copti in Lombardia.",
  missionTitle: "La nostra missione",
  mission:
    "Accompagnare la comunità nella preghiera, nei sacramenti, nella formazione e nella vita familiare, offrendo un luogo stabile di culto, ascolto e crescita spirituale per bambini, giovani e adulti.",
  communityTitle: "La nostra comunità",
  community:
    "La parrocchia riunisce famiglie, giovani, diaconi e servitori che partecipano alla Divina Liturgia, alla catechesi, ai momenti di fraternità e alle opere di carità in comunione con la diocesi copta ortodossa di Milano.",
  institutionTitle: "Riferimenti ufficiali",
  institutionIntro:
    "Le informazioni di questa pagina sono state riallineate ai riferimenti ufficiali della Chiesa Copta Ortodossa e della Diocesi Copta Ortodossa di Milano.",
  institutionItems: [
    {
      title: "La Chiesa Copta Ortodossa",
      body:
        "La Chiesa Copta Ortodossa di Alessandria riconosce San Marco Evangelista come fondatore del trono apostolico di Alessandria e custodisce una continuità ininterrotta di fede, liturgia e vita monastica.",
    },
    {
      title: "Il Papa della Chiesa",
      body:
        "Sua Santità Papa Tawadros II è l'attuale Papa di Alessandria e Patriarca della Sede di San Marco. Sul sito ufficiale della Chiesa Copta Ortodossa è indicato come riferimento del ministero pastorale e della guida della Chiesa nel mondo.",
    },
    {
      title: "Tradizione spirituale",
      body:
        "La tradizione copta mette al centro la Divina Liturgia, la vita sacramentale, il monachesimo, la testimonianza dei martiri e la custodia della fede ortodossa ricevuta dai padri.",
    },
  ],
  milanTitle: "Diocesi di Milano",
  milanItems: [
    {
      title: "Diocesi ufficiale",
      body:
        "Il sito ufficiale `copticorthodox.church` indica la Diocesi di Milano, Italia, come diocesi estera della Chiesa Copta Ortodossa, istituita nel 1986.",
    },
    {
      title: "Vescovo della diocesi",
      body:
        "Le fonti ufficiali della Diocesi Copta Ortodossa di Milano indicano S.E. Anba Antonio come Vescovo della Diocesi Copta Ortodossa di Milano; il sito ufficiale della Chiesa lo presenta come 'Bishop Antonio' per la Diocesi di Milano, Italia.",
    },
    {
      title: "Continuità pastorale",
      body:
        "La diocesi prosegue la missione pastorale già servita da Anba Kirollos e coordina le chiese e le attività pastorali copte del territorio affidato.",
    },
  ],
  notes:
    "Contenuti istituzionali aggiornati in base alle pagine ufficiali `copticorthodox.church` e `diocesicoptamilano.com` disponibili al 27 giugno 2026.",
};

const AR_COPY: Copy = {
  title: "من نحن",
  intro:
    "كنيسة القديس مرقس القبطية الأرثوذكسية في ميلانو تنتمي إلى الكنيسة القبطية الأرثوذكسية بالإسكندرية، وهي كنيسة رسولية تأسست بكرازة القديس مرقس الإنجيلي في مصر. تعيش جماعتنا في لومبارديا التقليد الليتورجي والأسراري والرعوي للكنيسة الأم وتحفظ الإيمان الأرثوذكسي في حياة الصلاة والخدمة.",
  missionTitle: "رسالتنا",
  mission:
    "مرافقة المؤمنين في الصلاة والأسرار والتنشئة الكنسية والحياة العائلية، وتوفير بيت ثابت للعبادة والإصغاء والنمو الروحي للأطفال والشباب والكبار.",
  communityTitle: "جماعتنا",
  community:
    "تضم الرعية عائلات وشباباً وشمامسة وخداماً يشاركون في القداس الإلهي والتعليم الكنسي وأعمال المحبة في شركة كاملة مع إيبارشية ميلانو القبطية الأرثوذكسية.",
  institutionTitle: "المراجع الرسمية",
  institutionIntro:
    "تمت إعادة ضبط هذه الصفحة اعتماداً على المعلومات الرسمية المنشورة من الكنيسة القبطية الأرثوذكسية ومن إيبارشية ميلانو القبطية الأرثوذكسية.",
  institutionItems: [
    {
      title: "الكنيسة القبطية الأرثوذكسية",
      body:
        "تعترف الكنيسة القبطية الأرثوذكسية بالإسكندرية بالقديس مرقس الإنجيلي مؤسساً للكرسي الرسولي المرقسي وتحفظ استمرارية الإيمان والليتورجيا والحياة الرهبانية عبر القرون.",
    },
    {
      title: "بابا الكنيسة",
      body:
        "قداسة البابا تواضروس الثاني هو البابا الحالي للإسكندرية وبطريرك الكرازة المرقسية، ويقدمه الموقع الرسمي للكنيسة القبطية الأرثوذكسية مرجعاً للقيادة والرعاية الكنسية في العالم.",
    },
    {
      title: "التراث الروحي",
      body:
        "يقوم التراث القبطي على القداس الإلهي والحياة الأسرارية والرهبنة وشهادة الشهداء وحفظ الإيمان الأرثوذكسي الذي تسلمناه من الآباء.",
    },
  ],
  milanTitle: "إيبارشية ميلانو",
  milanItems: [
    {
      title: "الإيبارشية الرسمية",
      body:
        "يذكر الموقع الرسمي `copticorthodox.church` إيبارشية ميلانو بإيطاليا ضمن الإيبارشيات الخارجية للكنيسة القبطية الأرثوذكسية، مع تاريخ تأسيس يعود إلى سنة 1986.",
    },
    {
      title: "أسقف الإيبارشية",
      body:
        "تشير المصادر الرسمية لإيبارشية ميلانو القبطية الأرثوذكسية إلى نيافة الأنبا أنطونيو كأسقف الإيبارشية، بينما يقدمه الموقع الرسمي للكنيسة باسم 'Bishop Antonio' لإيبارشية ميلانو في إيطاليا.",
    },
    {
      title: "الاستمرارية الرعوية",
      body:
        "تواصل الإيبارشية الخدمة الرعوية التي ازدهرت سابقاً مع الأنبا كيرلس وتنسق الكنائس والأنشطة الروحية والخدمية في الإقليم الموكول إليها.",
    },
  ],
  notes:
    "تم تحديث المعلومات المؤسسية بالرجوع إلى الصفحات الرسمية `copticorthodox.church` و `diocesicoptamilano.com` المتاحة بتاريخ 27 يونيو 2026.",
};

export default async function ChiSiamoPage() {
  const locale = await getLocale();
  const copy = locale === "ar" ? AR_COPY : IT_COPY;

  const pillars = [
    { icon: Church, title: copy.missionTitle, body: copy.mission },
    { icon: Users, title: copy.communityTitle, body: copy.community },
  ];

  const institutionCards = [
    { icon: Landmark, title: copy.institutionTitle, items: copy.institutionItems },
    { icon: Cross, title: copy.milanTitle, items: copy.milanItems },
  ];

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <div className="rounded-3xl border border-border bg-surface p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">
            {copy.title}
          </p>
          <h1 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
            {copy.title}
          </h1>
          <p className="mt-4 max-w-4xl text-base leading-relaxed text-foreground/75">
            {copy.intro}
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <article key={pillar.title} className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">{pillar.title}</h2>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-foreground/70">
                  {pillar.body}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="space-y-6">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold text-foreground">{copy.institutionTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/70">
            {copy.institutionIntro}
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {institutionCards.map((section) => {
            const Icon = section.icon;
            return (
              <article key={section.title} className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
                <div className="flex items-center gap-3 border-b border-border/60 pb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{section.title}</h3>
                </div>
                <div className="mt-5 space-y-4">
                  {section.items.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-border/70 bg-surface-alt/60 p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
                        <div>
                          <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                          <p className="mt-1 text-sm leading-relaxed text-foreground/70">{item.body}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Fonti</h2>
            <p className="text-sm text-foreground/70">{copy.notes}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
