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
  {
    id: "7",
    slug: "sant-antonio-abate",
    nome: "Sant'Antonio Abate",
    nomeSanto: "Sant'Antonio Abate",
    descrizione: "Il padre del monachesimo cristiano, fondatore della vita eremitica nel deserto egiziano.",
    descrizioneEstesa:
      "Sant'Antonio Abate (251-356 d.C.) è considerato il padre del monachesimo cristiano. Nacque in Egitto e, all'età di vent'anni, si ritirò nel deserto per vivere una vita di preghiera e penitenza. La sua vita fu narrata da Sant'Atanasio e divenne modello per migliaia di monaci. Nella tradizione copta è uno dei santi più venerati, simbolo della vittoria spirituale sulle tentazioni del mondo.",
    posizione: "Cappella laterale",
    categoria: "Santi",
    immagini: ["/images/icone/sant-antonio.jpg"],
    tecnica: "Tempera su legno",
    autore: "Scuola monastica di Wadi Natrun",
    anno: "2003",
    testiCorrelati: [],
    iconeCorrelate: ["8"],
  },
  {
    id: "8",
    slug: "san-paolo-eremita",
    nome: "San Paolo il Primo Eremita",
    nomeSanto: "San Paolo Eremita",
    descrizione: "Il primo eremita cristiano, che visse nel deserto egiziano per oltre novant'anni.",
    descrizioneEstesa:
      "San Paolo di Tebe (228-341 d.C.) è venerato come il primo eremita cristiano. Fuggì nel deserto egiziano per sfuggire alle persecuzioni dell'imperatore Decio e vi rimase per tutta la vita. Secondo la tradizione, un corvo portava ogni giorno mezzo pane per il suo sostentamento. Prima di morire ricevette la visita di Sant'Antonio Abate. La sua icona lo raffigura avvolto in un mantello di foglie di palma.",
    posizione: "Ingresso",
    categoria: "Santi",
    immagini: ["/images/icone/san-paolo-eremita.jpg"],
    tecnica: "Encausto su tavola",
    autore: "Iconografo copto Abanub Banoub",
    anno: "2006",
    testiCorrelati: [],
    iconeCorrelate: ["7"],
  },
  {
    id: "9",
    slug: "arcangelo-gabriele",
    nome: "Arcangelo Gabriele",
    nomeSanto: "Arcangelo Gabriele",
    descrizione: "Il messaggero di Dio che annunciò a Maria la nascita del Salvatore.",
    descrizioneEstesa:
      "L'Arcangelo Gabriele, il cui nome significa 'Forza di Dio', è il messaggero divino per eccellenza. Nella Bibbia appare a Daniele per spiegare le visioni profetiche, a Zaccaria per annunciare la nascita di Giovanni Battista e a Maria per l'Annunciazione. Nella tradizione copta è celebrato il 22 di ogni mese copto. L'icona lo rappresenta con il giglio bianco, simbolo di purezza, e il rotolo del messaggio divino.",
    posizione: "Altare principale",
    categoria: "Angeli",
    immagini: ["/images/icone/arcangelo-gabriele.jpg"],
    tecnica: "Tempera e oro su legno",
    autore: "Maestro Isaac Fanous",
    anno: "2005",
    testiCorrelati: [],
    iconeCorrelate: ["3"],
  },
  {
    id: "10",
    slug: "arcangelo-raffaele",
    nome: "Arcangelo Raffaele",
    nomeSanto: "Arcangelo Raffaele",
    descrizione: "Il guaritore divino, accompagnatore e protettore dei viaggiatori.",
    descrizioneEstesa:
      "L'Arcangelo Raffaele, il cui nome significa 'Dio guarisce', è venerato come il guaritore celeste. Il libro di Tobia narra come accompagnò Tobia nel suo viaggio, curandone il padre dalla cecità. Nella tradizione copta è uno dei sette arcangeli ed è celebrato il 3 di ogni mese copto. L'icona lo rappresenta con il bastone del viandante e il pesce simbolo della guarigione di Tobi.",
    posizione: "Navata destra",
    categoria: "Angeli",
    immagini: ["/images/icone/arcangelo-raffaele.jpg"],
    tecnica: "Tempera su tavola di cedro",
    autore: "Scuola copta del Cairo",
    anno: "2011",
    testiCorrelati: [],
    iconeCorrelate: ["3", "9"],
  },
  {
    id: "11",
    slug: "santa-caterina-di-alessandria",
    nome: "Santa Caterina di Alessandria",
    nomeSanto: "Santa Caterina",
    descrizione: "La martire filosofa di Alessandria, patrona degli studiosi e dei teologi.",
    descrizioneEstesa:
      "Santa Caterina di Alessandria (287-305 d.C.) fu una giovane nobildonna cristiana di Alessandria d'Egitto, nota per la sua straordinaria intelligenza. Secondo la tradizione, confutò cinquanta filosofi pagani inviati dall'imperatore Massimino. Rifiutando di abiurare la fede e di sposare l'imperatore, fu torturata sulla ruota e poi decapitata. È patrona delle università, degli studiosi e dei filosofi. Nella tradizione copta è venerata come grande martire.",
    posizione: "Navata sinistra",
    categoria: "Santi",
    immagini: ["/images/icone/santa-caterina.jpg"],
    tecnica: "Tempera e foglia d'oro su legno",
    autore: "Atelier copto di Alessandria",
    anno: "2014",
    testiCorrelati: [],
    iconeCorrelate: ["12"],
  },
  {
    id: "12",
    slug: "santa-barbara",
    nome: "Santa Barbara Martire",
    nomeSanto: "Santa Barbara",
    descrizione: "La giovane martire che abbracciò la fede cristiana contro la volontà del padre pagano.",
    descrizioneEstesa:
      "Santa Barbara visse nel III secolo. Secondo la tradizione, era la figlia di un ricco pagano che la rinchiuse in una torre per proteggerla dal mondo. Lì si convertì al cristianesimo. Quando il padre scoprì la sua fede, la denunciò al governatore romano e assistette personalmente alla sua esecuzione. Nella tradizione copta è venerata ogni anno il 2 del mese copto di Kiyahk. L'icona la raffigura con la torre, simbolo della sua prigionia e della fortezza della fede.",
    posizione: "Cappella laterale",
    categoria: "Santi",
    immagini: ["/images/icone/santa-barbara.jpg"],
    tecnica: "Acrilico su legno preparato",
    autore: "Iconografo copto moderno",
    anno: "2016",
    testiCorrelati: [],
    iconeCorrelate: ["11"],
  },
  {
    id: "13",
    slug: "san-basilio-magno",
    nome: "San Basilio il Grande",
    nomeSanto: "San Basilio Magno",
    descrizione: "Il Padre della Chiesa autore della grande Anafora liturgica.",
    descrizioneEstesa:
      "San Basilio di Cesarea (329-379 d.C.) è uno dei tre Padri Cappadoci e uno dei più grandi teologi della storia cristiana. Fondò il monachesimo cenobitico e scrisse opere fondamentali di teologia trinitaria e spiritualità monastica. La sua Liturgia, l'Anafora di San Basilio, è ancora celebrata nella Chiesa Copta Ortodossa durante i digiuni importanti. L'icona lo raffigura con le vesti episcopali e il libro dei suoi scritti teologici.",
    posizione: "Navata sinistra",
    categoria: "Padri della Chiesa",
    immagini: ["/images/icone/san-basilio.jpg"],
    tecnica: "Tempera su legno dorato",
    autore: "Scuola iconografica copta",
    anno: "2009",
    testiCorrelati: ["3"],
    iconeCorrelate: ["6"],
  },
  {
    id: "14",
    slug: "profeta-mose",
    nome: "Il Profeta Mosè",
    nomeSanto: "Profeta Mosè",
    descrizione: "Il liberatore del popolo d'Egitto, prefigurazione di Cristo nella tradizione copta.",
    descrizioneEstesa:
      "Il Profeta Mosè è una figura centrale nella fede copta, poiché la storia dell'Esodo si svolge proprio in Egitto. Mosè nacque in Egitto, fu salvato dalle acque del Nilo e divenne il liberatore del popolo di Dio. Nella tradizione copta, l'Esodo è visto come prefigurazione della salvezza portata da Cristo. L'icona lo rappresenta con le tavole della Legge e il bastone pastorale, davanti al roveto ardente che arde senza consumarsi.",
    posizione: "Navata destra",
    categoria: "Profeti",
    immagini: ["/images/icone/profeta-mose.jpg"],
    tecnica: "Tempera e oro su tavola",
    autore: "Iconografo del Monastero di San Macario",
    anno: "2007",
    testiCorrelati: [],
    iconeCorrelate: ["15"],
  },
  {
    id: "15",
    slug: "profeta-elia",
    nome: "Il Profeta Elia",
    nomeSanto: "Profeta Elia",
    descrizione: "Il grande profeta che ascese al cielo su un carro di fuoco.",
    descrizioneEstesa:
      "Il Profeta Elia è uno dei più grandi profeti dell'Antico Testamento. Lottò strenuamente contro l'idolatria al tempo del re Acab e della regina Gezabele. La tradizione ricorda il suo incontro con Dio sul monte Oreb, la sua lotta contro i profeti di Baal e la sua ascesa al cielo su un carro di fuoco. Nella teologia copta, Elia è considerato prefigurazione di san Giovanni Battista. L'icona lo raffigura con il mantello di fuoco e il carro celeste.",
    posizione: "Ingresso",
    categoria: "Profeti",
    immagini: ["/images/icone/profeta-elia.jpg"],
    tecnica: "Tecnica mista su legno",
    autore: "Scuola iconografica copta moderna",
    anno: "2013",
    testiCorrelati: [],
    iconeCorrelate: ["14"],
  },
  {
    id: "16",
    slug: "sant-efrem-il-siro",
    nome: "Sant'Efrem il Siro",
    nomeSanto: "Sant'Efrem il Siro",
    descrizione: "Il diacono poeta, autore di celebri inni spirituali della tradizione siriaca.",
    descrizioneEstesa:
      "Sant'Efrem di Nisibi (306-373 d.C.) è uno dei più grandi teologi e poeti della tradizione cristiana orientale. Diacono e teologo, scrisse in siriaco migliaia di inni e commentari biblici. La sua influenza si estese a tutta la tradizione cristiana orientale, inclusa la Chiesa Copta. È noto soprattutto per i suoi inni mariani e per i commenti all'Evangelo. Viene rappresentato con il calamo e il rotolo dei suoi inni, simbolo della sua prodigiosa produzione letteraria.",
    posizione: "Navata sinistra",
    categoria: "Padri della Chiesa",
    immagini: ["/images/icone/sant-efrem.jpg"],
    tecnica: "Tempera su legno",
    autore: "Iconografo siriano-copto",
    anno: "2017",
    testiCorrelati: [],
    iconeCorrelate: ["6", "13"],
  },
  {
    id: "17",
    slug: "san-teodoro-stratelata",
    nome: "San Teodoro Stratelata",
    nomeSanto: "San Teodoro Stratelata",
    descrizione: "Il generale martire, uno dei santi guerrieri più venerati nella tradizione copta.",
    descrizioneEstesa:
      "San Teodoro Stratelata (Stratelata = Generale) fu un alto ufficiale dell'esercito romano. Noto per la sua fede cristiana, rifiutò di compiere sacrifici agli idoli pagani. Fu arrestato, torturato e infine decapitato durante le persecuzioni dell'imperatore Licinio nel 319 d.C. Nella tradizione copta è venerato come uno dei santi guerrieri insieme a San Giorgio e San Mercurio. L'icona lo raffigura in armatura militare con spada e croce.",
    posizione: "Navata destra",
    categoria: "Santi",
    immagini: ["/images/icone/san-teodoro.jpg"],
    tecnica: "Tempera e oro su tavola",
    autore: "Maestro copto del Cairo",
    anno: "2019",
    testiCorrelati: [],
    iconeCorrelate: ["4"],
  },
  {
    id: "18",
    slug: "vergine-maria-galaktotrophousa",
    nome: "Vergine Maria Galaktotrophousa",
    nomeSanto: "Vergine Maria",
    descrizione: "La Madre di Dio nell'iconografia della Lattante, tema fondamentale nella tradizione copta.",
    descrizioneEstesa:
      "L'iconografia della Galaktotrophousa (la Vergine che allatta) è una delle rappresentazioni più antiche della Madre di Dio, con radici nei papiri egiziani che raffiguravano Iside nell'atto di allattare Horus. La Chiesa Copta ha trasformato questa immagine in una potente raffigurazione mariana che esprime la vera umanità di Cristo. Maria è rappresentata mentre allatta il Bambino Gesù, sottolineando l'incarnazione del Figlio di Dio nel grembo umano.",
    posizione: "Altare principale",
    categoria: "Vergine Maria",
    immagini: ["/images/icone/vergine-galaktotrophousa.jpg"],
    tecnica: "Encausto su tavola con oro zecchino",
    autore: "Scuola copta di Isaac Fanous",
    anno: "2004",
    testiCorrelati: ["2"],
    iconeCorrelate: ["2"],
  },
  {
    id: "19",
    slug: "san-mercurio-abu-sifain",
    nome: "San Mercurio Abu Sifain",
    nomeSanto: "San Mercurio",
    descrizione: "Il martire dalle due spade, uno dei più potenti santi guerrieri della tradizione copta.",
    descrizioneEstesa:
      "San Mercurio, chiamato Abu Sifain (Colui dalle due spade) nella tradizione copta, fu un soldato romano di origine cappadoce. Durante la persecuzione dell'imperatore Decio, si rifiutò di rinnegare la fede cristiana. Secondo la tradizione, un angelo gli donò una seconda spada celeste. Fu martirizzato nel 250 d.C. La sua chiesa ad Alessandria è uno dei luoghi più sacri della tradizione copta. L'icona lo raffigura a cavallo con le due spade, simbolo della duplice vittoria spirituale e militare.",
    posizione: "Cappella laterale",
    categoria: "Santi",
    immagini: ["/images/icone/san-mercurio.jpg"],
    tecnica: "Acrilico e oro su legno preparato",
    autore: "Atelier iconografico di Assuan",
    anno: "2020",
    testiCorrelati: [],
    iconeCorrelate: ["4", "17"],
  },
  {
    id: "20",
    slug: "sant-abramo-el-faransawi",
    nome: "Sant'Abramo el-Faransawi",
    nomeSanto: "Sant'Abramo el-Faransawi",
    descrizione: "Il vescovo francese divenuto monaco copto, esempio di conversione e vita ascetica.",
    descrizioneEstesa:
      "Sant'Abramo el-Faransawi (il Francese) nacque in Francia nel XIX secolo come Jules L'Enfant. Medico di professione, si convertì all'Ortodossia copta durante un viaggio in Egitto, attratto dalla profondità spirituale della tradizione monastica copta. Si fece monaco nel monastero di Anba Bishai e fu ordinato vescovo copto. La sua vita è esempio straordinario di ricerca spirituale e conversione. L'icona lo raffigura in abito episcopale copto con la croce pettorale.",
    posizione: "Navata destra",
    categoria: "Santi",
    immagini: ["/images/icone/sant-abramo.jpg"],
    tecnica: "Tempera su legno",
    autore: "Iconografo copto contemporaneo",
    anno: "2021",
    testiCorrelati: [],
    iconeCorrelate: ["7"],
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
