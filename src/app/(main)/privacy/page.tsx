import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo/metadata";
import LegalDocument, { type LegalDocumentCopy } from "@/components/legal/LegalDocument";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("legal", "privacyTitle", "privacyDescription", "/privacy");
}

const UPDATED_AT = "2026-09-28";

const IT_COPY: LegalDocumentCopy = {
  eyebrow: "Informativa",
  title: "Informativa sulla privacy",
  updatedLabel: "Ultimo aggiornamento",
  intro:
    "Questa informativa descrive come la Chiesa Copta Ortodossa di San Marco – Milano tratta i dati personali di chi visita il sito, crea un account o si iscrive agli eventi della comunità, ai sensi del Regolamento (UE) 2016/679 (GDPR) e del D.Lgs. 196/2003 (Codice privacy).",
  tocTitle: "Indice",
  sections: [
    {
      id: "titolare",
      title: "Titolare del trattamento",
      paragraphs: [
        "Il titolare del trattamento è la Chiesa Copta Ortodossa di San Marco – Milano, Via Senato 4, 20121 Milano (MI). Per qualsiasi domanda sui tuoi dati o per esercitare i tuoi diritti puoi scrivere a info@sanmarcocopti.it.",
      ],
    },
    {
      id: "dati",
      title: "Quali dati trattiamo",
      items: [
        "Dati di navigazione: indirizzo IP, tipo di browser e pagine richieste, trattati dal fornitore di hosting per erogare il sito e dal sito stesso per limitare gli abusi (ad esempio troppi tentativi di accesso). Le statistiche di utilizzo sono aggregate e non usano cookie.",
        "Dati dell'account: email, nome utente, nome, cognome, ruolo nella comunità (ad esempio credente, madre, padre, ospite di un'altra chiesa), fascia d'età, eventuale chiesa di provenienza, password (conservata solo in forma cifrata e non leggibile), data di registrazione e dell'ultimo accesso, eventuali richieste di accesso come amministratore.",
        "Accesso con Google o Facebook (solo se lo scegli): identificativo dell'account presso il fornitore, indirizzo email e relativa verifica, nome e cognome. Non riceviamo la tua password del fornitore né accediamo ai tuoi contatti o ai tuoi contenuti.",
        "Iscrizioni agli eventi: nome e cognome del partecipante, nome e cognome del padre (per distinguere persone omonime e raggruppare le famiglie), telefono, email facoltativa, eventuali note, familiari iscritti insieme, punto di raccolta scelto, stato del pagamento e account che ha effettuato l'iscrizione.",
        "Recupero password: un codice temporaneo (conservato solo in forma cifrata), l'indirizzo IP e il tipo di browser della richiesta.",
        "Comunicazioni via email: i dati che ci invii scrivendo all'indirizzo della comunità.",
        "Verifica dell'email: un codice temporaneo (conservato solo in forma cifrata) legato all'indirizzo da confermare e l'esito della conferma.",
        "Richieste di preghiera (solo se ne invii una): il tipo e il testo dell'intenzione, che possono contenere nomi e informazioni sulla salute o sulla fede di altre persone, il tuo nome e la tua email se scegli di indicarli, il consenso alla lettura durante la liturgia e la lingua del sito. Scrivi solo ciò che è necessario e, per altre persone, solo se sei autorizzato a farlo.",
        "Notifiche push (solo se le attivi): l'indirizzo tecnico fornito dal servizio di notifiche del tuo browser, le relative chiavi di cifratura e la lingua. Non è collegato al tuo account e non contiene il tuo nome o la tua email.",
        "Registro delle attività degli amministratori: per chi amministra il sito, le operazioni svolte nel pannello (accessi, creazione, modifica ed eliminazione dei contenuti) con data e ora.",
      ],
    },
    {
      id: "finalita",
      title: "Finalità e basi giuridiche",
      items: [
        "Gestire l'account e i servizi riservati del sito, incluse le iscrizioni agli eventi: esecuzione del servizio che richiedi (art. 6.1.b GDPR).",
        "Proteggere il sito e gli account (limitazione dei tentativi, prevenzione di abusi, sicurezza delle sessioni): legittimo interesse del titolare (art. 6.1.f GDPR).",
        "Inviarti le email di servizio strettamente necessarie: il link per reimpostare la password o per confermare il tuo indirizzo, la conferma di un'iscrizione a un evento e il promemoria il giorno prima dell'evento, sempre e solo all'indirizzo email del tuo account (non a quello eventualmente scritto nel modulo di iscrizione): esecuzione del servizio (art. 6.1.b GDPR). Non inviamo newsletter né comunicazioni promozionali.",
        "Affidare alla preghiera della comunità le intenzioni che ci invii: consenso esplicito, espresso con l'apposita casella del modulo e revocabile in qualsiasi momento (artt. 6.1.a e 9.2.a GDPR).",
        "Inviarti notifiche sugli avvisi della parrocchia: consenso, espresso attivando le notifiche e revocabile disattivandole dalla pagina Avvisi o dalle impostazioni del browser (art. 6.1.a GDPR).",
        "Tenere traccia delle modifiche fatte dagli amministratori, per sicurezza e per ricostruire chi ha cambiato cosa: legittimo interesse del titolare (art. 6.1.f GDPR).",
        "Alcune informazioni, come il ruolo nella comunità o l'iscrizione alle attività della chiesa, possono rivelare le convinzioni religiose. Sono trattate dalla comunità religiosa nell'ambito delle proprie attività e solo per i suoi membri o per chi ha contatti regolari con essa, senza comunicarle all'esterno senza il tuo consenso (art. 9.2.d GDPR).",
        "Adempiere a eventuali obblighi di legge (art. 6.1.c GDPR).",
      ],
    },
    {
      id: "minori",
      title: "Minori",
      paragraphs: [
        "In Italia i minori di 14 anni possono usare i servizi del sito solo tramite o con il consenso di chi esercita la responsabilità genitoriale. L'iscrizione di figli e familiari agli eventi deve essere effettuata da un genitore o da chi ne ha la responsabilità, che garantisce di essere autorizzato a comunicarne i dati.",
      ],
    },
    {
      id: "destinatari",
      title: "Chi può accedere ai dati",
      paragraphs: [
        "I dati sono accessibili solo agli amministratori della comunità autorizzati, nei limiti necessari al loro compito, e ai fornitori tecnici che ci aiutano a erogare il sito, nominati responsabili del trattamento:",
      ],
      items: [
        "Vercel (hosting del sito e statistiche aggregate di utilizzo);",
        "MongoDB (database dei contenuti, degli account e delle iscrizioni);",
        "Supabase (database degli account amministratore);",
        "Upstash (archivio temporaneo per la limitazione dei tentativi di accesso, quando attivo);",
        "Resend e, se attivato, Brevo (invio delle email di servizio: recupero password, conferma dell'email, conferme e promemoria degli eventi);",
        "i servizi di notifica del browser che usi (ad esempio Google Firebase Cloud Messaging, Mozilla, Apple o Microsoft), solo se attivi le notifiche, che ricevono il messaggio cifrato da consegnare al tuo dispositivo;",
        "Google e Facebook, solo se scegli di accedere con il loro account, secondo le rispettive informative;",
        "YouTube, Google Maps e Google Drive, per i video, la mappa e i documenti della libreria incorporati nelle pagine, che possono raccogliere dati secondo le proprie informative quando li visualizzi o li usi.",
      ],
    },
    {
      id: "trasferimenti",
      title: "Trasferimenti fuori dall'Unione europea",
      paragraphs: [
        "Alcuni fornitori hanno sede o infrastrutture negli Stati Uniti. In questi casi il trasferimento avviene sulla base delle garanzie previste dal GDPR, come l'EU-US Data Privacy Framework o le clausole contrattuali standard approvate dalla Commissione europea.",
      ],
    },
    {
      id: "conservazione",
      title: "Per quanto tempo conserviamo i dati",
      items: [
        "Account: finché l'account resta attivo o fino alla tua richiesta di cancellazione.",
        "Sessione di accesso: 24 ore, oppure 7 giorni se scegli «Ricordami».",
        "Codice per reimpostare la password: al massimo 60 minuti, poi viene eliminato automaticamente.",
        "Registrazione con Google o Facebook non completata: eliminata automaticamente dopo 24 ore.",
        "Contatori di sicurezza legati all'indirizzo IP: da pochi minuti a 24 ore.",
        "Iscrizioni agli eventi: per il tempo necessario all'organizzazione dell'evento e agli adempimenti collegati; puoi chiederne la cancellazione in qualsiasi momento.",
        "Link per confermare l'email: 48 ore, poi viene eliminato automaticamente.",
        "Richieste di preghiera: sono lette solo dai superamministratori della parrocchia; vengono archiviate al più tardi dopo 60 giorni e quelle archiviate sono eliminate automaticamente dopo altri 90 giorni. Puoi chiederne la cancellazione in qualsiasi momento.",
        "Iscrizione alle notifiche: finché non le disattivi o finché il servizio del browser non la dichiara scaduta.",
        "Registro delle attività degli amministratori: 12 mesi.",
      ],
    },
    {
      id: "cookie",
      title: "Cookie e memoria del browser",
      paragraphs: [
        "Il sito usa solo cookie tecnici, necessari al suo funzionamento, per i quali non è richiesto il consenso: la sessione di accesso (utente o amministratore), la lingua scelta e, durante l'accesso con Google o Facebook, due cookie temporanei che proteggono la procedura. Nella memoria del browser vengono salvate alcune preferenze di navigazione (ad esempio gli avvisi che hai nascosto o la scelta di non installare l'app). Non usiamo cookie di profilazione o pubblicitari.",
        "Per funzionare anche senza connessione e come app installabile, il sito salva nella cache del tuo browser le risorse tecniche (script, immagini) e una copia delle pagine pubbliche che hai visitato. Le pagine personali, come il profilo o le iscrizioni, non vengono mai salvate, e le copie vengono cancellate quando esci dall'account. Puoi eliminarle in qualsiasi momento cancellando i dati del sito dalle impostazioni del browser.",
        "I video di YouTube sono incorporati in modalità di privacy avanzata. La mappa di Google Maps nella pagina Contatti e i documenti della libreria visualizzati tramite Google Drive sono forniti da Google, che può impostare propri cookie quando li visualizzi.",
      ],
    },
    {
      id: "diritti",
      title: "I tuoi diritti",
      paragraphs: [
        "Puoi chiedere in qualsiasi momento di accedere ai tuoi dati, correggerli, cancellarli, limitarne il trattamento, riceverli in un formato leggibile (portabilità) od opporti al trattamento basato sul legittimo interesse. Molti dati dell'account possono essere modificati direttamente dalla pagina Profilo; per le altre richieste, inclusa la cancellazione dell'account, scrivi a info@sanmarcocopti.it.",
        "Se ritieni che il trattamento violi la normativa, puoi proporre reclamo al Garante per la protezione dei dati personali (www.garanteprivacy.it).",
      ],
    },
    {
      id: "sicurezza",
      title: "Sicurezza",
      paragraphs: [
        "Adottiamo misure tecniche e organizzative adeguate: connessioni cifrate, password e codici conservati solo in forma cifrata, sessioni firmate con scadenza, limitazione dei tentativi di accesso e accesso ai dati riservato agli amministratori autorizzati.",
      ],
    },
    {
      id: "modifiche",
      title: "Modifiche a questa informativa",
      paragraphs: [
        "Potremo aggiornare questa informativa per riflettere cambiamenti del sito o della normativa. La data dell'ultimo aggiornamento è indicata in cima alla pagina.",
      ],
    },
  ],
  related: { href: "/termini", label: "Leggi i Termini di servizio" },
};

const AR_COPY: LegalDocumentCopy = {
  eyebrow: "إشعار",
  title: "سياسة الخصوصية",
  updatedLabel: "آخر تحديث",
  intro:
    "توضّح هذه السياسة كيف تعالج كنيسة القديس مرقس القبطية الأرثوذكسية في ميلانو البيانات الشخصية لزوّار الموقع ولمن ينشئ حسابًا أو يسجّل في فعاليات الجماعة، وفقًا للائحة الأوروبية العامة لحماية البيانات (GDPR) رقم 2016/679 والقانون الإيطالي رقم 196/2003.",
  tocTitle: "المحتويات",
  sections: [
    {
      id: "titolare",
      title: "الجهة المسؤولة عن المعالجة",
      paragraphs: [
        "الجهة المسؤولة عن معالجة البيانات هي كنيسة القديس مرقس القبطية الأرثوذكسية – ميلانو، Via Senato 4، 20121 ميلانو (MI). لأي استفسار بخصوص بياناتك أو لممارسة حقوقك يمكنك الكتابة إلى info@sanmarcocopti.it.",
      ],
    },
    {
      id: "dati",
      title: "البيانات التي نعالجها",
      items: [
        "بيانات التصفّح: عنوان IP ونوع المتصفح والصفحات المطلوبة، يعالجها مزوّد الاستضافة لتشغيل الموقع ويستخدمها الموقع نفسه للحدّ من إساءة الاستخدام (مثل المحاولات المتكررة لتسجيل الدخول). إحصاءات الاستخدام مجمّعة ولا تستخدم ملفات تعريف الارتباط.",
        "بيانات الحساب: البريد الإلكتروني واسم المستخدم والاسم واسم العائلة والدور في الجماعة (مثل مؤمن، أم، أب، ضيف من كنيسة أخرى) والفئة العمرية والكنيسة التي تنتمي إليها عند الاقتضاء وكلمة المرور (محفوظة بشكل مشفّر فقط وغير قابلة للقراءة) وتاريخ التسجيل وآخر دخول، وأي طلب للحصول على صلاحيات المشرف.",
        "تسجيل الدخول عبر Google أو Facebook (فقط إذا اخترت ذلك): معرّف الحساب لدى المزوّد والبريد الإلكتروني وحالة التحقق منه والاسم واسم العائلة. لا نتلقى كلمة مرورك لدى المزوّد ولا نصل إلى جهات اتصالك أو محتواك.",
        "التسجيل في الفعاليات: اسم المشارك واسم عائلته واسم الأب واسم عائلته (للتمييز بين الأشخاص المتشابهين في الاسم ولتجميع العائلات) ورقم الهاتف والبريد الإلكتروني الاختياري والملاحظات وأفراد العائلة المسجّلين معًا ونقطة التجمّع المختارة وحالة الدفع والحساب الذي أجرى التسجيل.",
        "استعادة كلمة المرور: رمز مؤقت (محفوظ بشكل مشفّر فقط) وعنوان IP ونوع المتصفح الخاص بالطلب.",
        "المراسلات عبر البريد الإلكتروني: البيانات التي ترسلها إلينا عند الكتابة إلى عنوان الجماعة.",
        "تأكيد البريد الإلكتروني: رمز مؤقت (محفوظ بشكل مشفّر فقط) مرتبط بالعنوان المراد تأكيده ونتيجة التأكيد.",
        "طلبات الصلاة (فقط إذا أرسلت طلبًا): نوع النيّة ونصّها، وقد يتضمن أسماء ومعلومات عن صحة أشخاص آخرين أو إيمانهم، واسمك وبريدك الإلكتروني إذا اخترت ذكرهما، والموافقة على قراءة النيّة أثناء القداس ولغة الموقع. اكتب ما هو ضروري فقط، وبالنسبة للآخرين فقط إذا كنت مخوّلًا بذلك.",
        "الإشعارات (فقط إذا فعّلتها): العنوان التقني الذي يوفّره خدمة الإشعارات في متصفحك ومفاتيح التشفير الخاصة به واللغة. لا يرتبط بحسابك ولا يتضمن اسمك أو بريدك الإلكتروني.",
        "سجل نشاط المشرفين: بالنسبة لمن يدير الموقع، العمليات التي يجريها في لوحة التحكم (الدخول وإنشاء المحتوى وتعديله وحذفه) مع التاريخ والوقت.",
      ],
    },
    {
      id: "finalita",
      title: "الأغراض والأسس القانونية",
      items: [
        "إدارة الحساب والخدمات المحجوزة في الموقع، بما في ذلك التسجيل في الفعاليات: تنفيذ الخدمة التي تطلبها (المادة 6.1.ب من اللائحة).",
        "حماية الموقع والحسابات (الحدّ من المحاولات ومنع إساءة الاستخدام وأمان الجلسات): المصلحة المشروعة للجهة المسؤولة (المادة 6.1.و).",
        "إرسال رسائل البريد الإلكتروني الضرورية للخدمة فقط: رابط إعادة تعيين كلمة المرور أو تأكيد عنوانك، وتأكيد التسجيل في فعالية والتذكير بها في اليوم السابق، دائمًا وفقط إلى البريد الإلكتروني لحسابك (وليس إلى العنوان المكتوب في نموذج التسجيل): تنفيذ الخدمة (المادة 6.1.ب). لا نرسل نشرات إخبارية ولا رسائل ترويجية.",
        "تقديم النيّات التي ترسلها لصلاة الجماعة: موافقة صريحة تُعطى عبر الخانة المخصصة في النموذج ويمكن سحبها في أي وقت (المادتان 6.1.أ و9.2.أ).",
        "إرسال إشعارات بإعلانات الكنيسة: موافقة تُعطى بتفعيل الإشعارات ويمكن سحبها بإيقافها من صفحة الإعلانات أو من إعدادات المتصفح (المادة 6.1.أ).",
        "تتبّع التعديلات التي يجريها المشرفون، لأغراض الأمان ولمعرفة من غيّر ماذا: المصلحة المشروعة للجهة المسؤولة (المادة 6.1.و).",
        "قد تكشف بعض المعلومات، مثل الدور في الجماعة أو التسجيل في أنشطة الكنيسة، عن المعتقدات الدينية. تعالجها الجماعة الدينية في إطار أنشطتها ولأعضائها أو لمن تربطهم بها صلة منتظمة فقط، دون الإفصاح عنها خارجها بغير موافقتك (المادة 9.2.د).",
        "الوفاء بأي التزامات قانونية (المادة 6.1.ج).",
      ],
    },
    {
      id: "minori",
      title: "القاصرون",
      paragraphs: [
        "في إيطاليا لا يمكن للقاصرين دون سن 14 عامًا استخدام خدمات الموقع إلا عن طريق وليّ الأمر أو بموافقته. يجب أن يتم تسجيل الأبناء وأفراد العائلة في الفعاليات من قِبل أحد الوالدين أو من يتولى المسؤولية عنهم، والذي يضمن أنه مخوّل بتقديم بياناتهم.",
      ],
    },
    {
      id: "destinatari",
      title: "من يمكنه الاطلاع على البيانات",
      paragraphs: [
        "لا يطّلع على البيانات إلا مشرفو الجماعة المخوّلون وفي حدود ما تتطلبه مهامهم، إضافة إلى المزوّدين التقنيين الذين يساعدوننا في تشغيل الموقع بصفتهم معالجين للبيانات:",
      ],
      items: [
        "Vercel (استضافة الموقع وإحصاءات الاستخدام المجمّعة)؛",
        "MongoDB (قاعدة بيانات المحتوى والحسابات والتسجيلات)؛",
        "Supabase (قاعدة بيانات حسابات المشرفين)؛",
        "Upstash (تخزين مؤقت للحدّ من محاولات الدخول، عند تفعيله)؛",
        "Resend، وBrevo عند تفعيله (إرسال رسائل البريد الإلكتروني الخاصة بالخدمة: استعادة كلمة المرور وتأكيد البريد وتأكيدات الفعاليات والتذكير بها)؛",
        "خدمات الإشعارات في المتصفح الذي تستخدمه (مثل Google Firebase Cloud Messaging أو Mozilla أو Apple أو Microsoft)، فقط إذا فعّلت الإشعارات، والتي تتلقى الرسالة المشفّرة لتوصيلها إلى جهازك؛",
        "Google وFacebook، فقط إذا اخترت تسجيل الدخول بحسابك لديهما، وفقًا لسياسات الخصوصية الخاصة بهما؛",
        "YouTube وGoogle Maps وGoogle Drive، للفيديوهات والخريطة ووثائق المكتبة المضمّنة في الصفحات، والتي قد تجمع بيانات وفقًا لسياساتها عند عرضها أو استخدامها.",
      ],
    },
    {
      id: "trasferimenti",
      title: "نقل البيانات خارج الاتحاد الأوروبي",
      paragraphs: [
        "يقع مقر بعض المزوّدين أو بنيتهم التحتية في الولايات المتحدة. في هذه الحالات يتم النقل استنادًا إلى الضمانات التي تنص عليها اللائحة، مثل إطار خصوصية البيانات بين الاتحاد الأوروبي والولايات المتحدة أو البنود التعاقدية النموذجية المعتمدة من المفوضية الأوروبية.",
      ],
    },
    {
      id: "conservazione",
      title: "مدة الاحتفاظ بالبيانات",
      items: [
        "الحساب: طالما بقي الحساب نشطًا أو حتى تطلب حذفه.",
        "جلسة الدخول: 24 ساعة، أو 7 أيام إذا اخترت «تذكّرني».",
        "رمز إعادة تعيين كلمة المرور: 60 دقيقة كحدّ أقصى، ثم يُحذف تلقائيًا.",
        "التسجيل غير المكتمل عبر Google أو Facebook: يُحذف تلقائيًا بعد 24 ساعة.",
        "عدّادات الأمان المرتبطة بعنوان IP: من بضع دقائق إلى 24 ساعة.",
        "التسجيل في الفعاليات: طوال المدة اللازمة لتنظيم الفعالية وما يرتبط بها من التزامات؛ ويمكنك طلب حذفه في أي وقت.",
        "رابط تأكيد البريد الإلكتروني: 48 ساعة، ثم يُحذف تلقائيًا.",
        "طلبات الصلاة: لا يقرؤها إلا كبار مسؤولي الموقع في الكنيسة؛ وتُؤرشف خلال 60 يومًا على الأكثر، ثم تُحذف الطلبات المؤرشفة تلقائيًا بعد 90 يومًا أخرى. ويمكنك طلب حذفها في أي وقت.",
        "الاشتراك في الإشعارات: حتى توقفه أو حتى تعلن خدمة المتصفح انتهاء صلاحيته.",
        "سجل نشاط المشرفين: 12 شهرًا.",
      ],
    },
    {
      id: "cookie",
      title: "ملفات تعريف الارتباط وذاكرة المتصفح",
      paragraphs: [
        "يستخدم الموقع ملفات تعريف ارتباط تقنية فقط، ضرورية لعمله ولا تتطلب موافقة: جلسة الدخول (للمستخدم أو المشرف) واللغة المختارة، وأثناء تسجيل الدخول عبر Google أو Facebook ملفان مؤقتان لحماية العملية. تُحفظ في ذاكرة المتصفح بعض تفضيلات التصفح (مثل الإعلانات التي أخفيتها أو اختيارك عدم تثبيت التطبيق). لا نستخدم ملفات تعريف ارتباط للتنميط أو للإعلانات.",
        "ليعمل الموقع دون اتصال وكتطبيق قابل للتثبيت، يحفظ في ذاكرة التخزين المؤقت لمتصفحك الموارد التقنية (البرامج النصية والصور) ونسخة من الصفحات العامة التي زرتها. لا تُحفظ الصفحات الشخصية مثل الملف الشخصي أو التسجيلات أبدًا، وتُحذف النسخ عند تسجيل الخروج. يمكنك حذفها في أي وقت بمسح بيانات الموقع من إعدادات المتصفح.",
        "تُضمَّن فيديوهات YouTube في وضع الخصوصية المحسّن. أما خريطة Google Maps في صفحة «اتصل بنا» ووثائق المكتبة المعروضة عبر Google Drive فتقدمها Google، وقد تضع ملفات تعريف ارتباط خاصة بها عند عرضها.",
      ],
    },
    {
      id: "diritti",
      title: "حقوقك",
      paragraphs: [
        "يمكنك في أي وقت أن تطلب الاطلاع على بياناتك أو تصحيحها أو حذفها أو تقييد معالجتها أو الحصول عليها بصيغة قابلة للقراءة (قابلية النقل) أو الاعتراض على المعالجة القائمة على المصلحة المشروعة. يمكن تعديل كثير من بيانات الحساب مباشرة من صفحة الملف الشخصي؛ ولبقية الطلبات، بما في ذلك حذف الحساب، اكتب إلى info@sanmarcocopti.it.",
        "إذا رأيت أن المعالجة تخالف القانون، يمكنك تقديم شكوى إلى الهيئة الإيطالية لحماية البيانات الشخصية (www.garanteprivacy.it).",
      ],
    },
    {
      id: "sicurezza",
      title: "الأمان",
      paragraphs: [
        "نعتمد تدابير تقنية وتنظيمية مناسبة: اتصالات مشفّرة، وكلمات مرور ورموز محفوظة بشكل مشفّر فقط، وجلسات موقّعة ذات صلاحية محدودة، والحدّ من محاولات الدخول، وقصر الوصول إلى البيانات على المشرفين المخوّلين.",
      ],
    },
    {
      id: "modifiche",
      title: "التعديلات على هذه السياسة",
      paragraphs: [
        "قد نقوم بتحديث هذه السياسة لتعكس تغييرات في الموقع أو في القوانين. ويظهر تاريخ آخر تحديث في أعلى الصفحة.",
      ],
    },
  ],
  languageNotice:
    "هذه ترجمة لتسهيل الاطلاع. في حال وجود أي اختلاف، تكون النسخة الإيطالية هي المرجع.",
  related: { href: "/termini", label: "اقرأ شروط الخدمة" },
};

export default async function PrivacyPage() {
  const locale = await getLocale();
  return (
    <LegalDocument
      copy={locale === "ar" ? AR_COPY : IT_COPY}
      updatedAt={UPDATED_AT}
      locale={locale}
    />
  );
}
