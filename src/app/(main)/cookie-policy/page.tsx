import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo/metadata";
import LegalDocument, { type LegalDocumentCopy } from "@/components/legal/LegalDocument";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("legal", "cookiePolicyTitle", "cookiePolicyDescription", "/cookie-policy");
}

const UPDATED_AT = "2026-10-26";

const IT_COPY: LegalDocumentCopy = {
  eyebrow: "Informativa",
  title: "Cookie policy",
  updatedLabel: "Ultimo aggiornamento",
  intro:
    "Questa pagina spiega quali cookie e quali dati salvati nel browser usa il sito della Chiesa Copta Ortodossa di San Marco – Milano, per quanto tempo restano e come puoi gestire il consenso, ai sensi dell'art. 122 del D.Lgs. 196/2003, del Regolamento (UE) 2016/679 e delle Linee guida del Garante per la protezione dei dati personali del 10 giugno 2021. Per come trattiamo i dati personali in generale leggi l'Informativa sulla privacy.",
  tocTitle: "Indice",
  sections: [
    {
      id: "cosa",
      title: "Cosa sono i cookie",
      paragraphs: [
        "I cookie sono piccoli file di testo che il sito salva sul tuo dispositivo. Simili funzioni hanno la memoria del browser (localStorage e sessionStorage) e la cache dell'app. In questa pagina li chiamiamo tutti «cookie» per semplicità.",
      ],
    },
    {
      id: "tecnici",
      title: "Cookie tecnici (non richiedono consenso)",
      paragraphs: [
        "Sono necessari al funzionamento del sito e sono impostati direttamente da noi. Non servono a profilarti.",
      ],
      items: [
        "user_session: mantiene l'accesso dell'utente registrato. Dura 24 ore, oppure 7 giorni se scegli «Ricordami».",
        "admin_session: mantiene l'accesso degli amministratori. Cookie di sessione dell'area riservata.",
        "locale: ricorda la lingua scelta (italiano o arabo). Dura 1 anno.",
        "cookie_consent: ricorda la scelta che fai nel banner dei cookie. Dura 6 mesi.",
        "oauth_flow: protegge l'accesso con Google o Facebook. Dura 10 minuti.",
        "oauth_pending: conserva temporaneamente i dati della registrazione con Google o Facebook non ancora completata. Dura 30 minuti.",
      ],
    },
    {
      id: "memoria",
      title: "Memoria del browser e cache dell'app",
      paragraphs: [
        "Servono a far funzionare il sito e a ricordare le tue preferenze sul tuo dispositivo. Non vengono inviate a terzi.",
      ],
      items: [
        "user_info e admin_info (localStorage): nome, nome utente e ruolo dell'account, per mostrare l'interfaccia giusta. Sono rimossi quando esci dall'account.",
        "explicit_guest (localStorage): ricorda che hai scelto di navigare senza account.",
        "avvisi_nascosti (localStorage): gli avvisi che hai nascosto.",
        "dock_compact (localStorage): preferenza sulla barra di navigazione.",
        "pwa_install_dismissed_at, pwa_visits, pwa_push_prompt_dismissed_at, oauth_nudge_dismissed_until (localStorage): quando hai chiuso i suggerimenti di installazione dell'app, di attivazione delle notifiche o di collegamento dell'account.",
        "email_verify_banner_hidden (sessionStorage): nasconde per la sessione il promemoria di conferma email.",
        "Cache dell'app (service worker): per funzionare anche senza connessione salva script, immagini e le pagine pubbliche che hai visitato. Le pagine personali non vengono mai salvate e la cache delle pagine è svuotata quando esci dall'account.",
        "Statistiche (Vercel Web Analytics e Speed Insights): misurano visite e prestazioni in forma aggregata e anonima, senza cookie e senza identificarti.",
      ],
    },
    {
      id: "terzi",
      title: "Contenuti di terze parti (richiedono il tuo consenso)",
      paragraphs: [
        "Alcune parti del sito incorporano servizi di Google. Quando li carichi, Google può impostare cookie propri e raccogliere dati come l'indirizzo IP e informazioni sul dispositivo, anche a fini di profilazione, secondo le proprie informative. Per questo vengono caricati solo dopo il tuo consenso; finché non lo dai vedi un segnaposto con il collegamento diretto al servizio.",
      ],
      items: [
        "Google Maps: mappa della chiesa nella pagina Contatti. Informativa: policies.google.com/privacy.",
        "YouTube: anteprime, immagine del canale e lettore dei video nella home. I video usano il dominio youtube-nocookie.com (modalità a privacy avanzata). Informativa: policies.google.com/privacy.",
        "Google Drive: lettura dei PDF nella pagina dei singoli testi della libreria. Informativa: policies.google.com/privacy.",
        "Le immagini delle icone, delle copertine e degli eventi ospitate su Google Drive fanno parte dei contenuti del sito.",
      ],
    },
    {
      id: "gestire",
      title: "Come dare, rifiutare o cambiare il consenso",
      paragraphs: [
        "Alla prima visita compare un banner con i pulsanti «Rifiuta tutti», «Personalizza» e «Accetta tutti». Se lo chiudi con la X equivale a rifiutare. Puoi cambiare idea in qualsiasi momento con il link «Gestisci cookie» in fondo a ogni pagina, oppure con i pulsanti nei segnaposto dei contenuti. La tua scelta è conservata per 6 mesi, poi ti verrà chiesta di nuovo.",
        "Se revochi il consenso, smettiamo di caricare i contenuti di Google, ma i cookie già impostati da Google restano sul tuo dispositivo finché non li elimini dalle impostazioni del browser.",
        "Puoi anche bloccare o cancellare i cookie dalle impostazioni del browser (Chrome, Firefox, Safari, Edge). Bloccando i cookie tecnici alcune funzioni, come l'accesso all'account, potrebbero non funzionare.",
      ],
    },
    {
      id: "diritti",
      title: "Titolare e diritti",
      paragraphs: [
        "Il titolare del trattamento e i tuoi diritti sono descritti nell'Informativa sulla privacy. Per domande sui cookie scrivi a info@sanmarcocopti.it. Puoi sempre proporre reclamo al Garante per la protezione dei dati personali (www.garanteprivacy.it).",
      ],
    },
    {
      id: "modifiche",
      title: "Modifiche a questa policy",
      paragraphs: [
        "Potremo aggiornare questa pagina se cambiano i servizi usati o la normativa. La data dell'ultimo aggiornamento è indicata in cima alla pagina; se cambiano le finalità dei contenuti di terze parti ti chiederemo di nuovo il consenso.",
      ],
    },
  ],
  related: { href: "/privacy", label: "Leggi l'Informativa sulla privacy" },
};

const AR_COPY: LegalDocumentCopy = {
  eyebrow: "إشعار",
  title: "سياسة ملفات تعريف الارتباط",
  updatedLabel: "آخر تحديث",
  intro:
    "توضّح هذه الصفحة ملفات تعريف الارتباط والبيانات المحفوظة في المتصفح التي يستخدمها موقع كنيسة القديس مرقس القبطية الأرثوذكسية في ميلانو، ومدة بقائها وكيفية إدارة موافقتك، وفقًا للمادة 122 من القانون الإيطالي رقم 196/2003 واللائحة الأوروبية رقم 2016/679 وإرشادات الهيئة الإيطالية لحماية البيانات الشخصية الصادرة في 10 يونيو 2021. لمعرفة كيفية معالجة البيانات الشخصية عمومًا اقرأ سياسة الخصوصية.",
  tocTitle: "المحتويات",
  sections: [
    {
      id: "cosa",
      title: "ما هي ملفات تعريف الارتباط",
      paragraphs: [
        "هي ملفات نصية صغيرة يحفظها الموقع على جهازك. وتؤدي وظائف مشابهة ذاكرةُ المتصفح (localStorage وsessionStorage) وذاكرة التخزين المؤقت للتطبيق. نسمّيها جميعًا هنا «ملفات تعريف الارتباط» للتبسيط.",
      ],
    },
    {
      id: "tecnici",
      title: "ملفات تعريف الارتباط التقنية (لا تتطلب موافقة)",
      paragraphs: [
        "ضرورية لعمل الموقع ونضعها نحن مباشرة. لا تُستخدم لتحليل سلوكك.",
      ],
      items: [
        "user_session: تُبقي المستخدم المسجّل متصلًا. مدتها 24 ساعة، أو 7 أيام إذا اخترت «تذكّرني».",
        "admin_session: تُبقي المشرفين متصلين. ملف جلسة للمنطقة المحجوزة.",
        "locale: تتذكّر اللغة المختارة (الإيطالية أو العربية). مدتها سنة.",
        "cookie_consent: تتذكّر اختيارك في شريط ملفات تعريف الارتباط. مدتها 6 أشهر.",
        "oauth_flow: تحمي تسجيل الدخول عبر Google أو Facebook. مدتها 10 دقائق.",
        "oauth_pending: تحفظ مؤقتًا بيانات التسجيل عبر Google أو Facebook التي لم تكتمل بعد. مدتها 30 دقيقة.",
      ],
    },
    {
      id: "memoria",
      title: "ذاكرة المتصفح وذاكرة التطبيق المؤقتة",
      paragraphs: [
        "تُستخدم لتشغيل الموقع ولتذكّر تفضيلاتك على جهازك. لا تُرسل إلى أطراف ثالثة.",
      ],
      items: [
        "user_info وadmin_info (localStorage): اسم الحساب واسم المستخدم والدور لعرض الواجهة المناسبة. تُزال عند الخروج من الحساب.",
        "explicit_guest (localStorage): تتذكّر أنك اخترت التصفح بدون حساب.",
        "avvisi_nascosti (localStorage): الإعلانات التي أخفيتها.",
        "dock_compact (localStorage): تفضيل شريط التنقل.",
        "pwa_install_dismissed_at وpwa_visits وpwa_push_prompt_dismissed_at وoauth_nudge_dismissed_until (localStorage): متى أغلقت اقتراحات تثبيت التطبيق أو تفعيل الإشعارات أو ربط الحساب.",
        "email_verify_banner_hidden (sessionStorage): يُخفي تذكير تأكيد البريد الإلكتروني خلال الجلسة.",
        "ذاكرة التطبيق المؤقتة (service worker): ليعمل الموقع دون اتصال تُحفظ البرامج النصية والصور والصفحات العامة التي زرتها. لا تُحفظ الصفحات الشخصية أبدًا، وتُفرَّغ ذاكرة الصفحات عند الخروج من الحساب.",
        "الإحصاءات (Vercel Web Analytics وSpeed Insights): تقيس الزيارات والأداء بشكل مجمّع ومجهول، دون ملفات تعريف ارتباط ودون تحديد هويتك.",
      ],
    },
    {
      id: "terzi",
      title: "محتوى الأطراف الثالثة (يتطلب موافقتك)",
      paragraphs: [
        "تتضمن بعض أجزاء الموقع خدمات من Google. عند تحميلها قد تضع Google ملفات تعريف ارتباط خاصة بها وتجمع بيانات مثل عنوان IP ومعلومات الجهاز، ومنها لأغراض التنميط، وفق سياساتها. لذلك لا تُحمَّل إلا بعد موافقتك؛ وإلى أن تمنحها ترى مكانًا بديلًا مع رابط مباشر إلى الخدمة.",
      ],
      items: [
        "Google Maps: خريطة الكنيسة في صفحة التواصل. السياسة: policies.google.com/privacy.",
        "YouTube: الصور المصغّرة وصورة القناة ومشغّل الفيديو في الصفحة الرئيسية. تستخدم الفيديوهات النطاق youtube-nocookie.com (وضع الخصوصية المحسّن). السياسة: policies.google.com/privacy.",
        "Google Drive: قراءة ملفات PDF في صفحة كل نص من المكتبة. السياسة: policies.google.com/privacy.",
        "صور الأيقونات والأغلفة والفعاليات المستضافة على Google Drive جزء من محتوى الموقع.",
      ],
    },
    {
      id: "gestire",
      title: "كيف تمنح الموافقة أو ترفضها أو تغيّرها",
      paragraphs: [
        "عند أول زيارة يظهر شريط فيه الأزرار «رفض الكل» و«تخصيص» و«قبول الكل». إغلاقه بعلامة X يُعدّ رفضًا. يمكنك تغيير رأيك في أي وقت عبر رابط «إدارة ملفات تعريف الارتباط» أسفل كل صفحة أو عبر أزرار المحتوى البديل. تُحفظ موافقتك 6 أشهر ثم نطلبها منك من جديد.",
        "إذا سحبت موافقتك نتوقف عن تحميل محتوى Google، لكن ملفات تعريف الارتباط التي وضعتها Google سابقًا تبقى على جهازك حتى تحذفها من إعدادات المتصفح.",
        "يمكنك أيضًا حظر ملفات تعريف الارتباط أو حذفها من إعدادات المتصفح (Chrome وFirefox وSafari وEdge). قد يؤدي حظر الملفات التقنية إلى تعطّل بعض الوظائف مثل الدخول إلى الحساب.",
      ],
    },
    {
      id: "diritti",
      title: "الجهة المسؤولة وحقوقك",
      paragraphs: [
        "الجهة المسؤولة عن المعالجة وحقوقك موضحة في سياسة الخصوصية. لأي سؤال عن ملفات تعريف الارتباط اكتب إلى info@sanmarcocopti.it. يمكنك دائمًا تقديم شكوى إلى الهيئة الإيطالية لحماية البيانات الشخصية (www.garanteprivacy.it).",
      ],
    },
    {
      id: "modifiche",
      title: "التعديلات على هذه السياسة",
      paragraphs: [
        "قد نحدّث هذه الصفحة إذا تغيّرت الخدمات المستخدمة أو القوانين. يظهر تاريخ آخر تحديث في أعلى الصفحة؛ وإذا تغيّرت أغراض محتوى الأطراف الثالثة سنطلب موافقتك من جديد.",
      ],
    },
  ],
  languageNotice:
    "هذه ترجمة لتسهيل الاطلاع. في حال وجود أي اختلاف، تكون النسخة الإيطالية هي المرجع.",
  related: { href: "/privacy", label: "اقرأ سياسة الخصوصية" },
};

export default async function CookiePolicyPage() {
  const locale = await getLocale();
  return (
    <LegalDocument
      copy={locale === "ar" ? AR_COPY : IT_COPY}
      updatedAt={UPDATED_AT}
      locale={locale}
    />
  );
}
