import { Icona, TestoSacro, Preghiera, Evento, OrarioSettimanale } from "@/types";

// ============================================================
// ICONE MOCK DATA
// ============================================================
export const icone: Icona[] = [
  {
    id: "1",
    slug: "san-marco-evangelista",
    nome: "Icona di San Marco Evangelista",
    nomeSanto: "San Marco Evangelista",
    descrizione: "Fondatore della Chiesa Copta, patrono della nostra comunità milanese.",
    descrizioneEstesa:
      "San Marco Evangelista è considerato il fondatore della Chiesa di Alessandria d'Egitto, che oggi è conosciuta come Chiesa Copta Ortodossa. Secondo la tradizione, Marco portò il Vangelo in Egitto intorno all'anno 49 d.C., fondando la prima comunità cristiana ad Alessandria. Il suo Vangelo, il più breve dei quattro, è caratterizzato da uno stile vivido e diretto. Il leone è il suo simbolo tradizionale, rappresentando il coraggio e la forza della fede. Questa icona, realizzata secondo la tradizione copta, lo ritrae con il Vangelo in mano e il leone ai suoi piedi.",
    posizione: "Altare principale",
    categoria: "Santi",
    immagini: ["/images/icone/san-marco.jpg"],
    tecnica: "Tempera su legno dorato",
    autore: "Iconografo copto Isaac Fanous (scuola)",
    anno: "2005",
    testiCorrelati: ["1"],
    iconeCorrelate: ["2", "3"],
  },
  {
    id: "2",
    slug: "vergine-maria-odigitria",
    nome: "Vergine Maria Odigitria",
    nomeSanto: "Vergine Maria",
    descrizione: "La Theotokos che indica la Via, icona di grande devozione nella tradizione copta.",
    descrizioneEstesa:
      "L'icona della Vergine Maria nella posa dell'Odigitria (Colei che indica la Via) è una delle rappresentazioni più antiche e venerate nella tradizione cristiana orientale. Maria tiene il Bambino Gesù con una mano e con l'altra lo indica, mostrando che Cristo è la Via, la Verità e la Vita. Questa iconografia ha origini antichissime e la tradizione ne attribuisce il prototipo all'evangelista Luca. Nella Chiesa Copta, la Vergine Maria è venerata con particolare devozione e le sono dedicate numerose feste durante l'anno liturgico.",
    posizione: "Navata sinistra",
    categoria: "Vergine Maria",
    immagini: ["/images/icone/vergine-maria.jpg"],
    tecnica: "Tempera su legno con foglia d'oro",
    autore: "Anonimo, scuola copta egiziana",
    anno: "2010",
    testiCorrelati: ["2"],
    iconeCorrelate: ["1", "4"],
  },
  {
    id: "3",
    slug: "arcangelo-michele",
    nome: "Arcangelo Michele",
    nomeSanto: "Arcangelo Michele",
    descrizione: "Il capo degli eserciti celesti, protettore della Chiesa e dei fedeli.",
    descrizioneEstesa:
      "L'Arcangelo Michele è una delle figure più importanti nella tradizione copta. Il suo nome significa 'Chi è come Dio?' ed è venerato come il capo degli angeli e il difensore della fede. Nella tradizione copta, Michele è collegato al Nilo e alla sua piena annuale, ed è celebrato il 12 di ogni mese copto. L'icona lo rappresenta con la spada e lo scudo, simboli della sua lotta contro il male, e con le ali spiegate a protezione dei fedeli.",
    posizione: "Navata destra",
    categoria: "Angeli",
    immagini: ["/images/icone/arcangelo-michele.jpg"],
    tecnica: "Tempera su tavola",
    autore: "Maestro copto contemporaneo",
    anno: "2012",
    testiCorrelati: [],
    iconeCorrelate: ["4"],
  },
  {
    id: "4",
    slug: "san-giorgio-e-il-drago",
    nome: "San Giorgio e il Drago",
    nomeSanto: "San Giorgio",
    descrizione: "Il santo cavaliere martire, esempio di fede e coraggio per la comunità.",
    descrizioneEstesa:
      "San Giorgio, noto anche come Mari Girgis nella tradizione copta, è uno dei santi più amati della Chiesa Copta Ortodossa. Nato in Cappadocia nel III secolo, era un soldato romano di alto rango che abbracciò la fede cristiana. Il suo rifiuto di rinunciare alla fede lo portò al martirio durante le persecuzioni di Diocleziano. La leggenda del drago simboleggia la vittoria del bene sul male e della fede sulla persecuzione. Nella pittura copta, San Giorgio è rappresentato a cavallo nell'atto di trafiggere il drago.",
    posizione: "Ingresso",
    categoria: "Santi",
    immagini: ["/images/icone/san-giorgio.jpg"],
    tecnica: "Acrilico su legno preparato",
    autore: "Atelier iconografico copto del Cairo",
    anno: "2018",
    testiCorrelati: ["1"],
    iconeCorrelate: ["1", "3"],
  },
  {
    id: "5",
    slug: "santa-famiglia-in-egitto",
    nome: "La Sacra Famiglia in Egitto",
    nomeSanto: "Sacra Famiglia",
    descrizione: "La fuga in Egitto della Santa Famiglia, tema fondamentale per la Chiesa Copta.",
    descrizioneEstesa:
      "La fuga della Sacra Famiglia in Egitto è un evento di importanza capitale per la Chiesa Copta, poiché rappresenta la benedizione divina sulla terra d'Egitto. Secondo la tradizione, la famiglia attraversò molte città egiziane, lasciando ovunque segni e benedizioni. Questa icona raffigura il viaggio attraverso il deserto egiziano, con Giuseppe che guida l'asino su cui siedono Maria e il Bambino Gesù, accompagnati dall'Arcangelo Michele.",
    posizione: "Cappella laterale",
    categoria: "Santi",
    immagini: ["/images/icone/santa-famiglia.jpg"],
    tecnica: "Tecnica mista su legno",
    autore: "Scuola iconografica di Anba Rueiss",
    anno: "2015",
    testiCorrelati: ["2"],
    iconeCorrelate: ["2"],
  },
  {
    id: "6",
    slug: "sant-atanasio-di-alessandria",
    nome: "Sant'Atanasio di Alessandria",
    nomeSanto: "Sant'Atanasio",
    descrizione: "Il Padre della Ortodossia, difensore della fede nel Concilio di Nicea.",
    descrizioneEstesa:
      "Sant'Atanasio di Alessandria (296-373 d.C.) fu il 20° Papa di Alessandria e uno dei più grandi Padri della Chiesa. È conosciuto come il 'Padre dell'Ortodossia' per la sua strenua difesa della divinità di Cristo contro l'eresia ariana. Partecipò al Concilio di Nicea nel 325 d.C. come diacono e assistente del Patriarca Alessandro. Nonostante gli esili e le persecuzioni, rimase fedele alla vera dottrina cristiana. La sua opera più nota è 'L'Incarnazione del Verbo'.",
    posizione: "Navata sinistra",
    categoria: "Padri della Chiesa",
    immagini: ["/images/icone/sant-atanasio.jpg"],
    tecnica: "Tempera su legno dorato",
    autore: "Iconografo copto moderno",
    anno: "2008",
    testiCorrelati: ["3"],
    iconeCorrelate: ["1"],
  },
];

// ============================================================
// TESTI SACRI MOCK DATA
// ============================================================
export const testiSacri: TestoSacro[] = [
  {
    id: "1",
    slug: "vangelo-di-san-marco",
    titolo: "Il Vangelo secondo Marco",
    autore: "San Marco Evangelista",
    tipo: "Liturgia",
    descrizione:
      "Il secondo Vangelo, caratterizzato da uno stile vivido e diretto, racconta la vita e le opere di Gesù Cristo con particolare attenzione ai miracoli e alla Passione.",
    urlPDF: "/pdf/vangelo-marco.pdf",
    copertina: "/images/libri/vangelo-marco.jpg",
    iconeCorrelate: ["1"],
  },
  {
    id: "2",
    slug: "theotokia-e-lodi-alla-vergine",
    titolo: "Theotokia – Lodi alla Vergine Maria",
    autore: "Tradizione Copta",
    tipo: "Liturgia",
    descrizione:
      "Raccolta di inni e preghiere dedicate alla Theotokos (Madre di Dio) secondo la tradizione liturgica copta, cantate nei vari giorni della settimana.",
    urlPDF: "/pdf/theotokia.pdf",
    copertina: "/images/libri/theotokia.jpg",
    iconeCorrelate: ["2", "5"],
  },
  {
    id: "3",
    slug: "lincarnazione-del-verbo",
    titolo: "L'Incarnazione del Verbo",
    autore: "Sant'Atanasio di Alessandria",
    tipo: "Patristica",
    descrizione:
      "Opera fondamentale della Patristica in cui Sant'Atanasio espone la dottrina dell'Incarnazione e la redenzione dell'umanità attraverso Cristo.",
    urlPDF: "/pdf/incarnazione-verbo.pdf",
    copertina: "/images/libri/incarnazione-verbo.jpg",
    iconeCorrelate: ["6"],
  },
  {
    id: "4",
    slug: "sinassario-copto",
    titolo: "Il Sinassario Copto",
    autore: "Vari autori della tradizione",
    tipo: "Sinassario",
    descrizione:
      "Il martirologio della Chiesa Copta, contenente le vite e le commemorazioni dei santi per ogni giorno dell'anno copto.",
    urlPDF: "/pdf/sinassario.pdf",
    copertina: "/images/libri/sinassario.jpg",
    iconeCorrelate: ["1", "3", "4"],
  },
  {
    id: "5",
    slug: "catechismo-della-chiesa-copta",
    titolo: "Catechismo della Chiesa Copta Ortodossa",
    autore: "Diocesi Copta Ortodossa",
    tipo: "Catechismo",
    descrizione:
      "Manuale di catechismo che espone i fondamenti della fede copta ortodossa, i sacramenti, la liturgia e la vita spirituale della Chiesa.",
    urlPDF: "/pdf/catechismo.pdf",
    copertina: "/images/libri/catechismo.jpg",
    iconeCorrelate: [],
  },
];

// ============================================================
// PREGHIERE MOCK DATA
// ============================================================
export const preghiere: Preghiera[] = [
  {
    id: "1",
    slug: "preghiera-del-signore",
    titolo: "La Preghiera del Signore (Padre Nostro)",
    descrizione: "La preghiera insegnata da Gesù ai suoi discepoli, fondamento di ogni preghiera cristiana.",
    categoria: "Preghiere fondamentali",
    testoInline:
      "Padre nostro che sei nei cieli, sia santificato il tuo nome, venga il tuo regno, sia fatta la tua volontà come in cielo così in terra. Dacci oggi il nostro pane quotidiano e rimetti a noi i nostri debiti come noi li rimettiamo ai nostri debitori, e non ci indurre in tentazione ma liberaci dal male.",
  },
  {
    id: "2",
    slug: "agpeya-ora-terza",
    titolo: "Agpeya – Preghiera dell'Ora Terza",
    descrizione:
      "L'Ora Terza dell'Agpeya, il libro delle ore copto, commemorante la discesa dello Spirito Santo sugli Apostoli.",
    categoria: "Agpeya",
    urlPDF: "/pdf/agpeya-terza.pdf",
  },
  {
    id: "3",
    slug: "agpeya-ora-sesta",
    titolo: "Agpeya – Preghiera dell'Ora Sesta",
    descrizione:
      "L'Ora Sesta dell'Agpeya, commemorante la crocifissione di Cristo e la redenzione dell'umanità.",
    categoria: "Agpeya",
    urlPDF: "/pdf/agpeya-sesta.pdf",
  },
  {
    id: "4",
    slug: "preghiera-del-ringraziamento",
    titolo: "Preghiera del Ringraziamento",
    descrizione:
      "Preghiera di ringraziamento recitata all'inizio di ogni servizio liturgico copto.",
    categoria: "Preghiere liturgiche",
    testoInline:
      "Rendiamo grazie al benefico e misericordioso Dio, Padre del nostro Signore, Dio e Salvatore nostro Gesù Cristo, poiché ci ha protetti, ci ha soccorsi, ci ha custoditi, ci ha accolti presso di Sé, ci ha risparmiati, ci ha aiutati e ci ha condotti fino a quest'ora.",
  },
  {
    id: "5",
    slug: "credo-niceno",
    titolo: "Il Credo Niceno",
    descrizione:
      "La professione di fede stabilita nel Concilio di Nicea (325 d.C.), recitata durante la Divina Liturgia.",
    categoria: "Preghiere fondamentali",
    testoInline:
      "Crediamo in un solo Dio, Padre onnipotente, creatore del cielo e della terra, di tutte le cose visibili e invisibili. Crediamo in un solo Signore Gesù Cristo, Figlio unigenito di Dio, nato dal Padre prima di tutti i secoli...",
    urlPDF: "/pdf/credo-niceno.pdf",
  },
];

// ============================================================
// EVENTI MOCK DATA
// ============================================================
export const eventi: Evento[] = [
  {
    id: "1",
    slug: "gita-monastero-san-macario",
    titolo: "Gita Spirituale al Monastero di San Macario",
    data: "2026-04-12T08:00:00",
    dataFine: "2026-04-12T20:00:00",
    descrizione:
      "Una giornata dedicata alla visita del Monastero di San Macario nel deserto di Scete, luogo di profonda spiritualità monastica. Partenza in pullman dalla chiesa alle ore 8:00.",
    luogo: "Partenza dalla Chiesa, Milano",
    postiDisponibili: 45,
    immagine: "/images/eventi/monastero.jpg",
  },
  {
    id: "2",
    slug: "festa-san-marco-2026",
    titolo: "Festa del Patrono San Marco Evangelista",
    data: "2026-05-08T10:00:00",
    descrizione:
      "Celebrazione solenne della festa del nostro patrono San Marco Evangelista con Divina Liturgia, processione e pranzo comunitario.",
    luogo: "Chiesa di San Marco, Milano",
    postiDisponibili: 200,
    immagine: "/images/eventi/festa-san-marco.jpg",
  },
  {
    id: "3",
    slug: "ritiro-giovani-estate-2026",
    titolo: "Ritiro Spirituale Giovani – Estate 2026",
    data: "2026-07-15T09:00:00",
    dataFine: "2026-07-18T16:00:00",
    descrizione:
      "Tre giorni di ritiro spirituale per i giovani della comunità con meditazioni, attività e momenti di preghiera immersi nella natura.",
    luogo: "Casa di ritiro, Lago di Como",
    postiDisponibili: 30,
    immagine: "/images/eventi/ritiro-giovani.jpg",
  },
  {
    id: "4",
    slug: "corso-lingua-copta",
    titolo: "Corso di Lingua Copta – Livello Base",
    data: "2026-03-20T18:00:00",
    descrizione:
      "Corso settimanale di lingua copta per principianti. Impara l'alfabeto e le basi della lingua liturgica della Chiesa Copta.",
    luogo: "Sala parrocchiale, Milano",
    postiDisponibili: 20,
    immagine: "/images/eventi/corso-copto.jpg",
  },
];

// ============================================================
// ORARI SETTIMANALI MOCK DATA
// ============================================================
export const orariSettimanali: OrarioSettimanale[] = [
  {
    giorno: "Domenica",
    celebrazioni: [
      { tipo: "Divina Liturgia", orario: "08:00 – 11:00" },
      { tipo: "Scuola domenicale", orario: "11:30 – 13:00" },
    ],
  },
  {
    giorno: "Lunedì",
    celebrazioni: [
      { tipo: "Preghiera serale", orario: "19:00 – 20:00" },
    ],
  },
  {
    giorno: "Martedì",
    celebrazioni: [
      { tipo: "Studio Biblico", orario: "19:30 – 21:00" },
    ],
  },
  {
    giorno: "Mercoledì",
    celebrazioni: [
      { tipo: "Divina Liturgia", orario: "07:00 – 09:00" },
      { tipo: "Riunione giovani", orario: "19:00 – 21:00" },
    ],
  },
  {
    giorno: "Giovedì",
    celebrazioni: [
      { tipo: "Preghiera dell'Agpeya", orario: "18:30 – 19:30" },
    ],
  },
  {
    giorno: "Venerdì",
    celebrazioni: [
      { tipo: "Divina Liturgia", orario: "07:00 – 09:00" },
      { tipo: "Incontro famiglie", orario: "19:00 – 20:30", note: "Ogni primo venerdì del mese" },
    ],
  },
  {
    giorno: "Sabato",
    celebrazioni: [
      { tipo: "Vespri", orario: "18:00 – 19:00" },
      { tipo: "Confessioni", orario: "19:00 – 20:30", note: "Su appuntamento" },
    ],
  },
];
