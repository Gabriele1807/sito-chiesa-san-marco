import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo/metadata";
import LegalDocument, { type LegalDocumentCopy } from "@/components/legal/LegalDocument";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("legal", "termsTitle", "termsDescription", "/termini");
}

const UPDATED_AT = "2026-09-26";

const IT_COPY: LegalDocumentCopy = {
  eyebrow: "Condizioni d'uso",
  title: "Termini di servizio",
  updatedLabel: "Ultimo aggiornamento",
  intro:
    "Questi termini regolano l'uso del sito della Chiesa Copta Ortodossa di San Marco – Milano e dei servizi offerti agli utenti registrati. Usando il sito o creando un account li accetti; se non li condividi, ti chiediamo di non utilizzare i servizi riservati.",
  tocTitle: "Indice",
  sections: [
    {
      id: "servizio",
      title: "Il servizio",
      paragraphs: [
        "Il sito è gestito dalla Chiesa Copta Ortodossa di San Marco – Milano, Via Senato 4, 20121 Milano (MI), ed è offerto gratuitamente. Pubblica informazioni sulla comunità, gli orari delle celebrazioni, contenuti spirituali (preghiere, testi, icone, video) e permette agli utenti registrati di iscriversi agli eventi.",
        "Alcune sezioni possono essere riservate agli utenti registrati o temporaneamente non disponibili, a discrezione della comunità.",
      ],
    },
    {
      id: "account",
      title: "Account",
      items: [
        "Per creare un account devi fornire dati veritieri e aggiornati e tenerli corretti nel tempo dalla pagina Profilo.",
        "I minori di 14 anni possono usare i servizi solo tramite o con il consenso di un genitore o di chi ne ha la responsabilità.",
        "Il nome utente è personale e univoco: non può coincidere con quello di un altro account, né essere offensivo o ingannevole (ad esempio imitare il nome di un sacerdote o della comunità). Puoi modificarlo dal Profilo.",
        "Sei responsabile della riservatezza della tua password e delle attività svolte con il tuo account. Se sospetti un accesso non autorizzato, reimposta la password e avvisaci.",
        "Puoi accedere anche con un account Google o Facebook: in questo caso si applicano anche le condizioni di quei servizi. Puoi collegare o scollegare questi accessi dal Profilo.",
        "Puoi chiedere la cancellazione dell'account in qualsiasi momento scrivendo a info@sanmarcocopti.it.",
      ],
    },
    {
      id: "eventi",
      title: "Iscrizione agli eventi",
      items: [
        "Le iscrizioni sono soggette ai posti disponibili e alle indicazioni pubblicate per ciascun evento.",
        "Iscrivendo altre persone o familiari dichiari di essere autorizzato a farlo e a comunicarne i dati.",
        "Eventuali quote di partecipazione sono gestite direttamente dalla comunità secondo le indicazioni dell'evento: il sito non raccoglie dati di pagamento.",
        "La comunità può modificare, rinviare o annullare un evento; in questi casi cercherà di avvisare gli iscritti con i contatti forniti.",
      ],
    },
    {
      id: "uso",
      title: "Uso corretto del sito",
      paragraphs: ["Usando il sito ti impegni a non:"],
      items: [
        "fornire dati falsi o di altre persone senza autorizzazione, o creare account multipli per aggirare limiti;",
        "tentare di accedere ad aree, account o dati non tuoi, o di compromettere la sicurezza e il funzionamento del sito;",
        "usare il sito o i suoi contenuti per finalità commerciali, pubblicitarie o contrarie alla legge, al buon costume o al rispetto dovuto alla comunità religiosa;",
        "raccogliere in modo automatizzato contenuti o dati degli utenti.",
      ],
    },
    {
      id: "contenuti",
      title: "Contenuti e proprietà intellettuale",
      paragraphs: [
        "Testi, immagini, icone, video e grafica del sito appartengono alla comunità o ai rispettivi titolari e sono messi a disposizione per uso personale, di preghiera e di formazione. Non è consentito riprodurli o distribuirli per scopi commerciali senza autorizzazione scritta.",
        "Video, mappe e documenti forniti da servizi esterni (come YouTube, Google Maps e Google Drive) restano soggetti alle condizioni di quei servizi.",
      ],
    },
    {
      id: "responsabilita",
      title: "Disponibilità e responsabilità",
      paragraphs: [
        "Ci impegniamo a mantenere il sito funzionante e le informazioni aggiornate, ma non possiamo garantire che il servizio sia sempre disponibile o privo di errori. Orari delle celebrazioni ed eventi possono cambiare: in caso di dubbio fanno fede le comunicazioni ufficiali della comunità.",
        "Nei limiti consentiti dalla legge, la comunità non è responsabile di danni derivanti da interruzioni del servizio, da un uso del sito non conforme a questi termini o dai contenuti di siti esterni raggiungibili tramite link.",
      ],
    },
    {
      id: "sospensione",
      title: "Sospensione dell'account",
      paragraphs: [
        "In caso di violazione di questi termini o di uso che possa danneggiare la comunità o altri utenti, gli amministratori possono disattivare l'account, dopo averti avvisato quando possibile.",
      ],
    },
    {
      id: "privacy",
      title: "Dati personali",
      paragraphs: [
        "Il trattamento dei dati personali è descritto nell'Informativa sulla privacy, che fa parte integrante di questi termini.",
      ],
    },
    {
      id: "modifiche",
      title: "Modifiche ai termini",
      paragraphs: [
        "Potremo aggiornare questi termini; la data dell'ultimo aggiornamento è indicata in cima alla pagina. In caso di modifiche rilevanti ne daremo evidenza sul sito. Continuando a usare i servizi dopo l'aggiornamento accetti la nuova versione.",
      ],
    },
    {
      id: "legge",
      title: "Legge applicabile e contatti",
      paragraphs: [
        "Questi termini sono regolati dalla legge italiana, fatti salvi i diritti inderogabili riconosciuti ai consumatori. Per qualsiasi domanda puoi scrivere a info@sanmarcocopti.it.",
      ],
    },
  ],
  related: { href: "/privacy", label: "Leggi l'Informativa sulla privacy" },
};

const AR_COPY: LegalDocumentCopy = {
  eyebrow: "شروط الاستخدام",
  title: "شروط الخدمة",
  updatedLabel: "آخر تحديث",
  intro:
    "تنظّم هذه الشروط استخدام موقع كنيسة القديس مرقس القبطية الأرثوذكسية في ميلانو والخدمات المقدّمة للمستخدمين المسجّلين. باستخدامك الموقع أو إنشائك حسابًا فإنك توافق عليها؛ وإن لم توافق عليها نرجو ألا تستخدم الخدمات المحجوزة.",
  tocTitle: "المحتويات",
  sections: [
    {
      id: "servizio",
      title: "الخدمة",
      paragraphs: [
        "تدير الموقعَ كنيسةُ القديس مرقس القبطية الأرثوذكسية – ميلانو، Via Senato 4، 20121 ميلانو (MI)، ويُقدَّم مجانًا. ينشر الموقع معلومات عن الجماعة ومواعيد القداسات ومحتوى روحيًا (صلوات ونصوص وأيقونات وفيديوهات)، ويتيح للمستخدمين المسجّلين التسجيل في الفعاليات.",
        "قد تكون بعض الأقسام مخصّصة للمستخدمين المسجّلين أو غير متاحة مؤقتًا، وفقًا لتقدير الجماعة.",
      ],
    },
    {
      id: "account",
      title: "الحساب",
      items: [
        "لإنشاء حساب يجب تقديم بيانات صحيحة ومحدّثة والحفاظ على صحتها من صفحة الملف الشخصي.",
        "لا يمكن للقاصرين دون سن 14 عامًا استخدام الخدمات إلا عن طريق أحد الوالدين أو من يتولى المسؤولية عنهم أو بموافقته.",
        "اسم المستخدم شخصي وفريد: لا يجوز أن يطابق اسم حساب آخر، ولا أن يكون مسيئًا أو مضلّلًا (مثل انتحال اسم كاهن أو اسم الجماعة). يمكنك تغييره من الملف الشخصي.",
        "أنت مسؤول عن سرية كلمة مرورك وعن الأنشطة التي تتم بحسابك. إذا اشتبهت في دخول غير مصرّح به، أعد تعيين كلمة المرور وأبلغنا.",
        "يمكنك أيضًا تسجيل الدخول بحساب Google أو Facebook، وفي هذه الحالة تسري أيضًا شروط تلك الخدمات. يمكنك ربط هذه الحسابات أو إلغاء ربطها من الملف الشخصي.",
        "يمكنك طلب حذف حسابك في أي وقت بالكتابة إلى info@sanmarcocopti.it.",
      ],
    },
    {
      id: "eventi",
      title: "التسجيل في الفعاليات",
      items: [
        "يخضع التسجيل لعدد الأماكن المتاحة وللتعليمات المنشورة لكل فعالية.",
        "عند تسجيل أشخاص آخرين أو أفراد من عائلتك فإنك تقرّ بأنك مخوّل بذلك وبتقديم بياناتهم.",
        "تتولى الجماعة مباشرة إدارة أي رسوم مشاركة وفقًا لتعليمات الفعالية: لا يجمع الموقع أي بيانات دفع.",
        "يجوز للجماعة تعديل فعالية أو تأجيلها أو إلغاؤها، وستسعى في هذه الحالات إلى إبلاغ المسجّلين عبر بيانات الاتصال المقدّمة.",
      ],
    },
    {
      id: "uso",
      title: "الاستخدام السليم للموقع",
      paragraphs: ["باستخدامك الموقع تتعهد بألا:"],
      items: [
        "تقدّم بيانات كاذبة أو بيانات أشخاص آخرين دون إذنهم، أو تنشئ حسابات متعددة للتحايل على القيود؛",
        "تحاول الوصول إلى أقسام أو حسابات أو بيانات لا تخصك، أو الإضرار بأمان الموقع أو بعمله؛",
        "تستخدم الموقع أو محتواه لأغراض تجارية أو إعلانية أو مخالفة للقانون أو للآداب العامة أو للاحترام الواجب للجماعة الدينية؛",
        "تجمع محتوى الموقع أو بيانات المستخدمين بطرق آلية.",
      ],
    },
    {
      id: "contenuti",
      title: "المحتوى والملكية الفكرية",
      paragraphs: [
        "النصوص والصور والأيقونات والفيديوهات والتصاميم في الموقع مملوكة للجماعة أو لأصحابها، وهي متاحة للاستخدام الشخصي وللصلاة والتعليم. لا يجوز نسخها أو توزيعها لأغراض تجارية دون إذن كتابي.",
        "تبقى الفيديوهات والخرائط والوثائق المقدّمة من خدمات خارجية (مثل YouTube وGoogle Maps وGoogle Drive) خاضعة لشروط تلك الخدمات.",
      ],
    },
    {
      id: "responsabilita",
      title: "التوفّر والمسؤولية",
      paragraphs: [
        "نلتزم بالحفاظ على عمل الموقع وتحديث معلوماته، لكننا لا نضمن أن تكون الخدمة متاحة دائمًا أو خالية من الأخطاء. قد تتغير مواعيد القداسات والفعاليات: وعند الشك تكون الإعلانات الرسمية للجماعة هي المرجع.",
        "في الحدود التي يسمح بها القانون، لا تتحمل الجماعة مسؤولية الأضرار الناتجة عن انقطاع الخدمة أو عن استخدام الموقع بما يخالف هذه الشروط أو عن محتوى المواقع الخارجية التي يمكن الوصول إليها عبر الروابط.",
      ],
    },
    {
      id: "sospensione",
      title: "إيقاف الحساب",
      paragraphs: [
        "في حال مخالفة هذه الشروط أو الاستخدام الذي قد يضر بالجماعة أو بمستخدمين آخرين، يجوز للمشرفين تعطيل الحساب، مع إشعارك مسبقًا متى أمكن ذلك.",
      ],
    },
    {
      id: "privacy",
      title: "البيانات الشخصية",
      paragraphs: [
        "معالجة البيانات الشخصية موضّحة في سياسة الخصوصية، التي تُعدّ جزءًا لا يتجزأ من هذه الشروط.",
      ],
    },
    {
      id: "modifiche",
      title: "تعديل الشروط",
      paragraphs: [
        "قد نقوم بتحديث هذه الشروط، ويظهر تاريخ آخر تحديث في أعلى الصفحة. وفي حال إجراء تعديلات جوهرية سنشير إليها في الموقع. إن استمرارك في استخدام الخدمات بعد التحديث يعني قبولك للنسخة الجديدة.",
      ],
    },
    {
      id: "legge",
      title: "القانون الواجب التطبيق والتواصل",
      paragraphs: [
        "تخضع هذه الشروط للقانون الإيطالي، مع مراعاة الحقوق الإلزامية المقرّرة للمستهلكين. لأي استفسار يمكنك الكتابة إلى info@sanmarcocopti.it.",
      ],
    },
  ],
  languageNotice:
    "هذه ترجمة لتسهيل الاطلاع. في حال وجود أي اختلاف، تكون النسخة الإيطالية هي المرجع.",
  related: { href: "/privacy", label: "اقرأ سياسة الخصوصية" },
};

export default async function TerminiPage() {
  const locale = await getLocale();
  return (
    <LegalDocument
      copy={locale === "ar" ? AR_COPY : IT_COPY}
      updatedAt={UPDATED_AT}
      locale={locale}
    />
  );
}
