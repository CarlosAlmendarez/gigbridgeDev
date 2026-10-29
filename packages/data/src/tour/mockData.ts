import type { Guest, Provider, RosterPerson, TourDate, Vacancy, ExternalContact } from "@gigbridge/types";

/**
 * Set de datos de ejemplo para la gira "Norte 2026" de Las Bestias del
 * Valle — el mismo contenido del prototipo de Claude Design. Es la fuente
 * "mock" de tour/repository.ts (default con TOUR_DATA_SOURCE sin definir) y
 * tiene la MISMA forma que produce supabaseRepository.ts desde las tablas
 * reales. Las constantes DEFAULT_* / GUESTS_SEED todavía siembran el estado
 * de cliente de TourUIContext en ambos modos.
 */

export const TOUR_NAME = "Norte 2026";
export const BAND_LINE = "Las Bestias del Valle · 14 fechas";
export const DEFAULT_DATE_ID = "d12";

export const DATES: TourDate[] = [
  {
    id: "d11",
    dow: "Vie",
    day: "11",
    kind: "Viaje",
    dateline: "Vie 11 sep 2026",
    counter: "Día de viaje",
    kicker: "Saltillo → Monterrey",
    title: "Día de traslado",
    subtitle: "Salida 09:00 del Hotel Urdiñola\n270 km · 3 h 20 min por la 40D",
    mapUrl: "https://maps.google.com/?q=Monterrey+NL",
    tel: "tel:+528118420124",
    telLabel: "Head Driver",
    contactLine: "Rafa Ponce · Head Driver",
    completion: 95,
    missing: ["Sin comida de crew en ruta"],
    clock: [
      { time: "09:00", label: "Salida de Saltillo" },
      { time: "12:20", label: "Llegada al hotel" },
      { time: "14:00", label: "Check-in crew" },
      { time: "19:00", label: "Junta de producción", accent: true },
    ],
    clockNote: "Los trailers salieron anoche; ya están en el patio del foro.",
    hotel: "Hotel Ancira Centro",
    hotelMeta: "Ocampo 443 Ote. · check-in 14:00",
    hotelMap: "https://maps.google.com/?q=Ocampo+443+Monterrey",
    venueRider: "Sin venue en esta fecha",
    venueRiderNote: "El avance del Foro Cantera se cerró el 2 sep.",
    advanceLine: "Avance cerrado",
    itinerary: [
      {
        icon: "van",
        title: "Van de crew · 09:00",
        meta: "8 pax · chofer Rafa Ponce",
        note: "Parada de comida en Ramos Arizpe, 30 min.",
      },
      {
        icon: "truck",
        title: "Trailers ya en sitio",
        meta: "Truck 1 y 2 · patio trasero",
        note: "Truck 3 llega 06:00 del 12.",
      },
    ],
    venue: {
      kicker: "Día de viaje",
      name: "Sin recinto",
      address: "Traslado Saltillo → Monterrey",
      type: "Sin venue",
      capacity: "—",
      visibility: "No aplica",
      management: "La siguiente fecha es el Foro Cantera, Monterrey.",
      mapUrl: "https://maps.google.com/?q=Monterrey+NL",
      site: "#",
      specs: [
        { k: "Ruta", v: "Carretera 40D · 270 km" },
        { k: "Casetas", v: "3 · $610 MXN por unidad" },
        { k: "Paradas", v: "Ramos Arizpe (comida, 30 min)" },
      ],
      contacts: [
        { name: "Rafa Ponce", role: "Head Driver", email: "rafa@fletesdelcerro.mx", tel: "tel:+528118420106" },
      ],
      files: [{ name: "Hoja de ruta 11 sep.pdf", kind: "pdf", meta: "Road manager · 2 pág.", status: "vigente" }],
      notes: [
        { body: "Van 2 sin confirmar: si no llega, el crew de luces se reparte en la van 1.", meta: "Lucía B. · ayer" },
      ],
      providerRule: "Sin recinto en esta fecha.",
    },
    show: {
      kicker: "Vie 11 sep · día de viaje",
      headline: [
        { value: "—", label: "Montaje" },
        { value: "—", label: "Soundcheck" },
        { value: "19:00", label: "Junta de producción" },
        { value: "8", label: "Pax en van" },
      ],
      montaje: [{ time: "19:00", task: "Junta de producción en el lobby", area: "Management" }],
      docs: [{ name: "Agenda de junta 11 sep.pdf", kind: "pdf", meta: "Production manager", status: "vigente" }],
      notes: [{ body: "No hay show: se aprovecha para revisar el plano de GDL.", meta: "Phil G. · hoy" }],
    },
    guestKicker: "Día de viaje · 11 sep",
  },
  {
    id: "d12",
    dow: "Sáb",
    day: "12",
    kind: "Show",
    dateline: "Sáb 12 sep 2026",
    counter: "Show 07 / 14",
    kicker: "Monterrey, N.L.",
    title: "Foro Cantera",
    subtitle: "Foro pequeño · 1,400 pax\nAv. Constitución 1450, Centro",
    mapUrl: "https://maps.google.com/?q=Av.+Constitucion+1450+Monterrey",
    tel: "tel:+528118420117",
    telLabel: "Producción",
    contactLine: "Rocío Tamez · producción del lugar",
    completion: 82,
    missing: ["Rider desactualizado", "Setlist sin confirmar"],
    clock: [
      { time: "14:00", label: "Load-in · 3 camiones" },
      { time: "18:00", label: "Soundcheck" },
      { time: "20:00", label: "Doors" },
      { time: "21:30", label: "Show", accent: true },
    ],
    clockNote: "Salida del hotel 17:15 — lobby, van del road manager.",
    hotel: "Hotel Ancira Centro",
    hotelMeta: "Ocampo 443 Ote. · 6 min del venue",
    hotelMap: "https://maps.google.com/?q=Ocampo+443+Monterrey",
    venueRider: "Foro Cantera — plano, patch y potencia",
    venueRiderNote: "Consola FOH Avid S6L, 48 canales. Límite de ruido 98 dB a las 23:00.",
    advanceLine: "Confirmado en el avance del 2 sep",
    itinerary: [
      {
        icon: "airplane-takeoff",
        title: "MTY → GDL · dom 13, 07:40",
        meta: "VivaAerobús 2218 · 6 pax · conf. QK4RT2",
        note: "Backline viaja por tierra con el Dockmaster.",
      },
      {
        icon: "van",
        title: "Van al aeropuerto · 05:15",
        meta: "Lobby del Ancira · chofer Beto Salinas",
        note: "Pases de abordar ya repartidos por persona.",
      },
      {
        icon: "truck",
        title: "Load-out · 00:30",
        meta: "Orden de carga definido en el dashboard",
        note: "El foro solo recibe 2 camiones a la vez.",
      },
    ],
    venue: {
      kicker: "Monterrey, N.L. · recinto de la fecha",
      name: "Foro Cantera",
      address: "Av. Constitución 1450, Centro\nMonterrey, N.L. 64000",
      type: "Foro pequeño",
      capacity: "1,400 pax",
      visibility: "Contacto selectivo",
      management: "Administración por terceros · operado por Cantera Live bajo convenio a 5 años.",
      mapUrl: "https://maps.google.com/?q=Av.+Constitucion+1450+Monterrey",
      site: "https://example.com/foro-cantera",
      specs: [
        { k: "Escenario", v: "12 × 9 m · altura libre 7.5 m" },
        { k: "Rigging", v: "12 puntos certificados · 1 t por punto" },
        { k: "Potencia", v: "3 × 200 A trifásica + planta de respaldo" },
        { k: "Consola FOH", v: "Avid S6L-24D · 48 canales" },
        { k: "Monitores", v: "12 vías · 8 in-ear propios del foro" },
        { k: "Acceso de carga", v: "2 camiones simultáneos · elevador 1.90 m" },
        { k: "Camerinos", v: "4 (2 con baño propio) · lavandería en sitio" },
        { k: "Catering", v: "Cocina disponible · 30 comensales" },
        { k: "Curfew", v: "00:30 · 98 dB máx. después de las 23:00" },
        { k: "Parking", v: "Patio trasero, 3 unidades + 2 vans en calle" },
        { k: "Internet", v: "Enlace dedicado 100 Mb para producción" },
        { k: "Perfil GigBridge", v: "Creado por GigBridge · sin reclamar por el venue" },
      ],
      contacts: [
        { name: "Rocío Tamez", role: "Producción del lugar", email: "rocio@canteralive.mx", tel: "tel:+528118420117" },
        {
          name: "Emiliano Ceballos",
          role: "Jefe de escenario del foro",
          email: "emiliano@canteralive.mx",
          tel: "tel:+528118420141",
        },
        {
          name: "Gerardo Pineda",
          role: "Seguridad y accesos",
          email: "accesos@canteralive.mx",
          tel: "tel:+528118420142",
        },
      ],
      files: [
        { name: "Rider técnico del foro v2.pdf", kind: "pdf", meta: "18 pág. · actualizado 2 sep", status: "vigente" },
        { name: "Plano de escenario y rigging.dwg", kind: "plano", meta: "Cantera Live · 1.4 MB", status: "vigente" },
        { name: "Patch list del foro.xlsx", kind: "xls", meta: "48 canales · 2 sep", status: "vigente" },
        { name: "Reglamento de accesos y curfew.pdf", kind: "pdf", meta: "4 pág. · 2025", status: "revisar" },
        { name: "canteralive.mx/produccion", kind: "web", meta: "Sitio del recinto", status: "vigente" },
      ],
      notes: [
        {
          body: "El elevador de carga mide 1.90 m: los racks altos suben por rampa, no por elevador.",
          meta: "Phil G. · hace 2 h",
        },
        { body: "Pedir por escrito la extensión de curfew a 01:00 para el load-out.", meta: "Juan C. · ayer" },
      ],
      providerRule:
        "Lista cerrada: el foro solo permite audio con Sonido Sierra y rigging con Alturas MX. Luces y video sí son libres.",
    },
    show: {
      kicker: "Sáb 12 sep · Foro Cantera",
      headline: [
        { value: "14:00", label: "Inicio de montaje" },
        { value: "18:00", label: "Soundcheck" },
        { value: "21:30", label: "Show" },
        { value: "95 min", label: "Duración estimada" },
      ],
      montaje: [
        { time: "13:30", task: "Llegada de Dockmaster y apertura de patio", area: "Choferes" },
        { time: "14:00", task: "Load-in Truck 2 · audio y backline", area: "Sonido" },
        { time: "14:30", task: "Rigging y puntos de vuelo", area: "Rigging" },
        { time: "15:30", task: "Piso de luces y patch de dimmer", area: "Luces" },
        { time: "16:30", task: "Line check y patch de canales", area: "Sonido" },
        { time: "17:00", task: "Prueba de RF e in-ear", area: "Radiofrecuencia" },
        { time: "18:00", task: "Soundcheck con banda", area: "Backline" },
        { time: "19:15", task: "Ajuste de vestuario y camerinos", area: "Vestuario" },
        { time: "19:45", task: "Barrido de escenario y briefing de seguridad", area: "Stage" },
      ],
      docs: [
        { name: "Run of show 12 sep.pdf", kind: "pdf", meta: "Stage manager · 3 pág.", status: "vigente" },
        { name: "Cue list de secuencias.xlsx", kind: "xls", meta: "Playback · 42 cues", status: "vigente" },
        { name: "Plot de luces MA3.pdf", kind: "pdf", meta: "Karla E. · 12 pág.", status: "vigente" },
        { name: "Input list 32 canales (rider v4).pdf", kind: "pdf", meta: "Banda · 8 sep", status: "revisar" },
      ],
      notes: [
        {
          body: 'La banda pidió mover "Bestias" al encore y meter versión acústica de "Patio trasero".',
          meta: "Bruno A. · hace 3 h",
        },
        { body: "El escenario es bajo: el riser de batería se queda en 40 cm, no 60.", meta: "Dani B. · hoy" },
      ],
    },
    guestKicker: "Foro Cantera · 12 sep",
  },
  {
    id: "d13",
    dow: "Dom",
    day: "13",
    kind: "Show",
    dateline: "Dom 13 sep 2026",
    counter: "Show 08 / 14",
    kicker: "Guadalajara, Jal.",
    title: "Salón Barranca",
    subtitle: "Teatro · 3,200 pax\nAv. Vallarta 2050, Ladrón de Guevara",
    mapUrl: "https://maps.google.com/?q=Av.+Vallarta+2050+Guadalajara",
    tel: "tel:+523318420130",
    telLabel: "Producción",
    contactLine: "Emilio Gaytán · jefe de foro",
    completion: 68,
    missing: ["Hotel sin confirmar", "Rigging sin plano", "Setlist sin cargar"],
    clock: [
      { time: "12:00", label: "Load-in · 4 camiones" },
      { time: "17:00", label: "Soundcheck" },
      { time: "19:30", label: "Doors" },
      { time: "21:00", label: "Show", accent: true },
    ],
    clockNote: "Día doble: el crew de luces llega en el vuelo de las 07:40.",
    hotel: "Por confirmar",
    hotelMeta: "Reserva en negociación · Zona Chapultepec",
    hotelMap: "https://maps.google.com/?q=Chapultepec+Guadalajara",
    venueRider: "Salón Barranca — plano y potencia",
    venueRiderNote: "Falta el plano de rigging firmado; el venue solo trabaja con Alturas MX.",
    advanceLine: "Avance agendado para el 10 sep",
    itinerary: [
      {
        icon: "airplane-landing",
        title: "Llegada GDL · 08:55",
        meta: "6 pax de crew · conf. QK4RT2",
        note: "Van del venue espera en llegadas nacionales.",
      },
      {
        icon: "truck",
        title: "Trailers desde MTY · 06:00",
        meta: "Dockmaster Beto Salinas",
        note: "10 h de carretera, salen tras el load-out.",
      },
    ],
    venue: {
      kicker: "Guadalajara, Jal. · recinto de la fecha",
      name: "Salón Barranca",
      address: "Av. Vallarta 2050, Ladrón de Guevara\nGuadalajara, Jal. 44600",
      type: "Teatro",
      capacity: "3,200 pax",
      visibility: "Perfil público",
      management: "Híbrido · inmueble del gobierno estatal, operado por Barranca Espectáculos.",
      mapUrl: "https://maps.google.com/?q=Av.+Vallarta+2050+Guadalajara",
      site: "https://example.com/salon-barranca",
      specs: [
        { k: "Escenario", v: "16 × 11 m · altura libre 9 m" },
        { k: "Rigging", v: "20 puntos · plano firmado pendiente" },
        { k: "Potencia", v: "2 × 400 A trifásica" },
        { k: "Consola FOH", v: "DiGiCo SD10 · 96 canales" },
        { k: "Acceso de carga", v: "4 camiones · andén a nivel de escenario" },
        { k: "Camerinos", v: "6 · uno con regadera" },
        { k: "Curfew", v: "23:30 por reglamento municipal" },
        { k: "Parking", v: "Estacionamiento techado, 6 unidades" },
        { k: "Perfil GigBridge", v: "Reclamado por el venue · datos verificados" },
      ],
      contacts: [
        { name: "Emilio Gaytán", role: "Jefe de foro", email: "emilio@barrancaesp.mx", tel: "tel:+523318420130" },
        {
          name: "Lorena Ávalos",
          role: "Coordinación técnica",
          email: "lorena@barrancaesp.mx",
          tel: "tel:+523318420143",
        },
      ],
      files: [
        { name: "Ficha técnica Salón Barranca.pdf", kind: "pdf", meta: "22 pág. · 2026", status: "vigente" },
        { name: "Plano de rigging (sin firma).dwg", kind: "plano", meta: "Pendiente de validar", status: "falta" },
        { name: "barrancaesp.mx/tecnica", kind: "web", meta: "Sitio del recinto", status: "vigente" },
      ],
      notes: [
        {
          body: "El venue exige rigger propio: Alturas MX debe mandar certificaciones 48 h antes.",
          meta: "Dani B. · ayer",
        },
      ],
      providerRule: "Lista cerrada para rigging (Alturas MX) y seguridad. Audio, luces y video abiertos con aviso previo.",
    },
    show: {
      kicker: "Dom 13 sep · Salón Barranca",
      headline: [
        { value: "12:00", label: "Inicio de montaje" },
        { value: "17:00", label: "Soundcheck" },
        { value: "21:00", label: "Show" },
        { value: "105 min", label: "Duración estimada" },
      ],
      montaje: [
        { time: "11:30", task: "Llegada de trailers desde MTY", area: "Choferes" },
        { time: "12:00", task: "Load-in general por andén", area: "Stage" },
        { time: "13:00", task: "Rigging con rigger del venue", area: "Rigging" },
        { time: "14:30", task: "Audio y patch", area: "Sonido" },
        { time: "15:30", task: "Luces y video", area: "Luces" },
        { time: "17:00", task: "Soundcheck con banda", area: "Backline" },
      ],
      docs: [
        { name: "Run of show 13 sep (borrador).pdf", kind: "pdf", meta: "Stage manager · sin firmar", status: "revisar" },
        { name: "Cue list de secuencias.xlsx", kind: "xls", meta: "Playback · heredado de MTY", status: "revisar" },
      ],
      notes: [{ body: 'Curfew 23:30: si el show arranca tarde se corta "Carretera 40D".', meta: "Phil G. · hoy" }],
    },
    guestKicker: "Salón Barranca · 13 sep",
  },
  {
    id: "d15",
    dow: "Mar",
    day: "15",
    kind: "Hold",
    dateline: "Mar 15 sep 2026",
    counter: "Hold · sin firmar",
    kicker: "Ciudad de México",
    title: "Foro Volcán",
    subtitle: "Foro pequeño · 900 pax\nFecha en hold: la oferta no está firmada",
    mapUrl: "https://maps.google.com/?q=Foro+Volcan+CDMX",
    tel: "tel:+525518420140",
    telLabel: "Promotor",
    contactLine: "Vero Ibarra · promotora",
    completion: 35,
    missing: ["Contrato sin firmar", "Sin venue confirmado", "Sin proveedores", "Sin hotel"],
    clock: [
      { time: "—", label: "Load-in sin definir" },
      { time: "—", label: "Soundcheck sin definir" },
      { time: "20:00", label: "Doors tentativo" },
      { time: "21:30", label: "Show tentativo", accent: true },
    ],
    clockNote: "Cláusula de radio: 80 km / 30 días alrededor de esta fecha.",
    hotel: "Sin hotel cargado",
    hotelMeta: "Se carga al firmar la oferta",
    hotelMap: "https://maps.google.com/?q=CDMX",
    venueRider: "Sin rider de venue",
    venueRiderNote: "El perfil del Foro Volcán en GigBridge aún no está reclamado por el venue.",
    advanceLine: "Sin avance",
    itinerary: [
      {
        icon: "calendar-x",
        title: "Sin itinerario",
        meta: "Se genera al confirmar la fecha",
        note: "El ruteo propone volar desde GDL el 14.",
      },
    ],
    venue: {
      kicker: "Ciudad de México · fecha en hold",
      name: "Foro Volcán",
      address: "Calz. de Tlalpan 1520, Portales\nCiudad de México",
      type: "Foro pequeño",
      capacity: "900 pax",
      visibility: "Perfil privado",
      management: "Propio · operadora Volcán Producciones. Perfil sin reclamar.",
      mapUrl: "https://maps.google.com/?q=Foro+Volcan+CDMX",
      site: "https://example.com/foro-volcan",
      specs: [
        { k: "Escenario", v: "10 × 7 m (declarado, sin verificar)" },
        { k: "Potencia", v: "Sin dato" },
        { k: "Acceso de carga", v: "Sin dato · calle con restricción de horario" },
        { k: "Curfew", v: "01:00 (declarado)" },
        { k: "Perfil GigBridge", v: "Creado por GigBridge · datos sin verificar" },
      ],
      contacts: [{ name: "Vero Ibarra", role: "Promotora de la fecha", email: "vero@volcanprod.mx", tel: "tel:+525518420140" }],
      files: [{ name: "Oferta CDMX (borrador).pdf", kind: "pdf", meta: "Sin firmar · 15% de anticipo", status: "falta" }],
      notes: [{ body: "No mover fechas cercanas: cláusula de radio de 80 km por 30 días.", meta: "Marisol T. · hace 3 días" }],
      providerRule: "Sin lista de proveedores: el venue no ha compartido su reglamento.",
    },
    show: {
      kicker: "Mar 15 sep · fecha en hold",
      headline: [
        { value: "—", label: "Montaje" },
        { value: "—", label: "Soundcheck" },
        { value: "21:30", label: "Show tentativo" },
        { value: "90 min", label: "Duración propuesta" },
      ],
      montaje: [{ time: "—", task: "Se define al firmar el contrato", area: "Management" }],
      docs: [{ name: "Propuesta de producción CDMX.pdf", kind: "pdf", meta: "Borrador interno", status: "falta" }],
      notes: [{ body: "Si se firma, se replica el run of show de Monterrey.", meta: "Juan C. · hace 2 días" }],
    },
    guestKicker: "Foro Volcán · 15 sep",
  },
];

export const PROVIDERS: Provider[] = [
  { name: "Sonido Sierra", service: "Audio", contact: "Memo Villarreal", city: "Monterrey", email: "contacto@sonidosierra.mx", tel: "+528118420118", bucket: "recinto", note: "Único proveedor de audio autorizado por el Foro Cantera." },
  { name: "Alturas MX", service: "Rigging", contact: "Ivo Cárdenas", city: "CDMX", email: "ops@alturas.mx", tel: "+525518420122", bucket: "recinto", note: "Rigging obligatorio en Foro Cantera y Salón Barranca. Certificación 2027." },
  { name: "Seguridad Muralla", service: "Seguridad", contact: "Hugo Lira", city: "Monterrey", email: "operaciones@muralla.mx", tel: "+528118420150", bucket: "recinto", note: "Lista cerrada del recinto: 24 elementos por show." },
  { name: "Lumen Norte", service: "Luces", contact: "Karla Esquivel", city: "Monterrey", email: "hola@lumennorte.mx", tel: "+528118420119", bucket: "local", note: "A 15 min del foro. Piso de 24 barras, mesa MA3." },
  { name: "Pantalla Fría", service: "Video", contact: "Su Ortega", city: "Monterrey", email: "video@pantallafria.mx", tel: "+528118420123", bucket: "local", note: "LED 4.8 mm, 7 × 4 m. Bodega en Guadalupe, NL." },
  { name: "Taller Reyes", service: "Carpintería", contact: "Chuy Reyes", city: "Monterrey", email: "tallerreyes@correo.mx", tel: "+528118420121", bucket: "local", note: "Tarima de batería y praticables. Entrega en 6 h." },
  { name: "Cocina Nómada", service: "Catering", contact: "Fer Aguilar", city: "Monterrey", email: "fer@cocinanomada.mx", tel: "+528118420125", bucket: "local", note: "24 comidas por fecha, 2 vegetarianas." },
  { name: "Cuerda Viva Backline", service: "Backline", contact: "Nacho Peña", city: "Guadalajara", email: "renta@cuerdaviva.mx", tel: "+523318420120", bucket: "general", note: "Renta por temporada; viaja con la gira las 14 fechas." },
  { name: "Fletes del Cerro", service: "Transporte", contact: "Beto Salinas", city: "Monterrey", email: "logistica@fletesdelcerro.mx", tel: "+528118420124", bucket: "general", note: "3 trailers + van de crew para toda la gira." },
  { name: "RF Central", service: "Radiofrecuencia", contact: "Ivette Lara", city: "CDMX", email: "rf@rfcentral.mx", tel: "+525518420151", bucket: "general", note: "Coordinación de frecuencias en las 14 fechas." },
  { name: "Vuelo Escénico", service: "Automatización", contact: "Paco Rendón", city: "CDMX", email: "contacto@vueloescenico.mx", tel: "+525518420152", bucket: "general", note: "Cotizado para las fechas de arena; no aplica en foros chicos." },
  { name: "Audio Coloso", service: "Audio", contact: "Sin contacto directo", city: "Monterrey", email: "—", tel: "+528118420153", bucket: "vetado", note: "No admitido en Foro Cantera: conflicto con la operadora. Tampoco en Barranca." },
  { name: "Rigging Express", service: "Rigging", contact: "Sin contacto directo", city: "Guadalajara", email: "—", tel: "+523318420154", bucket: "vetado", note: "Vetado por la gira: certificaciones vencidas en 2025." },
  { name: "Staff Rápido", service: "Local crew", contact: "Sin contacto directo", city: "CDMX", email: "—", tel: "+525518420155", bucket: "vetado", note: "No admitido: incidente de carga en la gira anterior." },
];

export const ROSTER: RosterPerson[] = [
  { name: "Phil Gutiérrez", role: "Tour Manager", party: "C", team: "Management", depth: 0, account: true, reports: "Raíz de la gira", scope: "Ve toda la gira (tour_all): crew, cuartos, itinerarios y contratos.", tel: "+528118420100", email: "phil@bestiasdelvalle.mx", hotel: "Ancira Centro", room: "512", roomScope: "tour_all", onSite: true, note: "Decide qué se comparte con cada colaborador." },
  { name: "Juan C. Cisneros", role: "Production Manager", party: "C", team: "Management", depth: 1, account: true, reports: "Reporta a Phil Gutiérrez", scope: "Ve toda la gira (tour_all). Autoriza quién ve los cuartos de hotel.", tel: "+528118420101", email: "jc@bestiasdelvalle.mx", hotel: "Ancira Centro", room: "510", roomScope: "tour_all", onSite: true, note: "Ya está viendo la fecha de Guadalajara." },
  { name: "Lucía Bernal", role: "Road Manager", party: "C", team: "Management", depth: 1, account: true, reports: "Reporta a Phil Gutiérrez", scope: "Ve toda la gira (tour_all): hoteles, vuelos, catering y horarios.", tel: "+528118420105", email: "lucia@bestiasdelvalle.mx", hotel: "Ancira Centro", room: "508", roomScope: "tour_all", onSite: true, note: "Dueña de los horarios de salida del hotel." },
  { name: "Dani Berrones", role: "Stage Manager", party: "C", team: "Stage", depth: 2, account: true, reports: "Reporta a Juan C. Cisneros", scope: "Ve su departamento. Coordina el montaje de todas las áreas el día del show.", tel: "+528118420102", email: "dani@bestiasdelvalle.mx", hotel: "Ancira Centro", room: "405", roomScope: "department", onSite: true, note: "Recibe el run of show firmado." },
  { name: "Memo Villarreal", role: "FOH · ingeniero de sonido", party: "C", team: "Sonido", depth: 3, account: false, reports: "Reporta a Dani Berrones", scope: "Freelance sin cuenta. Acceso al rider de la fecha y al patch.", tel: "+528118420118", email: "memo@sonidosierra.mx", hotel: "Ancira Centro", room: "402", roomScope: "self", onSite: true, note: "Trae su propia consola de respaldo." },
  { name: "Chava Domínguez", role: "Patch Master", party: "C", team: "Sonido", depth: 3, account: false, reports: "Reporta a Memo Villarreal", scope: "Freelance sin cuenta. Ve solo el rider de la fecha, no el resto de la gira.", tel: "+528118420103", email: "chava.patch@correo.mx", hotel: "Ancira Centro", room: "401", roomScope: "self", onSite: true, note: "Sigue con el input list v3: hay que reenviarle la v4." },
  { name: "Tania Ruelas", role: "Monitores · in-ear", party: "B", team: "Monitores", depth: 3, account: false, reports: "Reporta a Memo Villarreal", scope: "Freelance sin cuenta. Trabaja directo con la banda en soundcheck.", tel: "+528118420108", email: "tania.mon@correo.mx", hotel: "Ancira Centro", room: "403", roomScope: "self", onSite: true, note: "Pide 15 min extra de soundcheck para in-ears." },
  { name: "Ivette Lara", role: "RF Coordinator", party: "C", team: "Radiofrecuencia", depth: 3, account: true, reports: "Reporta a Dani Berrones", scope: "Ve su departamento. Coordina todos los inalámbricos del show.", tel: "+528118420104", email: "ivette@rfcentral.mx", hotel: "Ancira Centro", room: "404", roomScope: "department", onSite: true, note: "Escaneo de frecuencias a las 17:00." },
  { name: "Karla Esquivel", role: "Crew Chief · diseño de luces", party: "C", team: "Luces", depth: 3, account: false, reports: "Reporta a Dani Berrones", scope: "Freelance sin cuenta. 6 personas de iluminación bajo su mando.", tel: "+528118420119", email: "karla@lumennorte.mx", hotel: "Ancira Centro", room: "308", roomScope: "self", onSite: true, note: "Viaja en el vuelo de las 07:40 a GDL." },
  { name: "Pepe Rangel", role: "Operador de luces", party: "C", team: "Luces", depth: 4, account: false, reports: "Reporta a Karla Esquivel", scope: "Freelance sin cuenta. Solo ve su día y su área.", tel: "+528118420109", email: "pepe.luces@correo.mx", hotel: "Ancira Centro", room: "307", roomScope: "self", onSite: true, note: "" },
  { name: "Su Ortega", role: "Directora de cámaras", party: "C", team: "Video", depth: 3, account: false, reports: "Reporta a Dani Berrones", scope: "Freelance sin cuenta. Video World detrás del escenario.", tel: "+528118420123", email: "su@pantallafria.mx", hotel: "Ancira Centro", room: "306", roomScope: "self", onSite: true, note: "Falta cámara 2: hay vacante abierta." },
  { name: "Nacho Peña", role: "Crew Chief · backline", party: "B", team: "Backline", depth: 3, account: false, reports: "Reporta a Dani Berrones", scope: "Freelance sin cuenta. Responde por instrumentos y equipo de la banda.", tel: "+523318420120", email: "nacho@cuerdaviva.mx", hotel: "Ancira Centro", room: "305", roomScope: "self", onSite: true, note: "Viaja por tierra con el backline." },
  { name: "Lalo Cruz", role: "Line Tech · guitarras", party: "B", team: "Backline", depth: 4, account: false, reports: "Reporta a Nacho Peña", scope: "Freelance sin cuenta. Ve solo su día y su área.", tel: "+523318420110", email: "lalo.tech@correo.mx", hotel: "Ancira Centro", room: "304", roomScope: "self", onSite: true, note: "" },
  { name: "Pau Ledezma", role: "Line Tech · batería", party: "B", team: "Backline", depth: 4, account: false, reports: "Reporta a Nacho Peña", scope: "Freelance sin cuenta. Ve solo su día y su área.", tel: "+523318420111", email: "pau.tech@correo.mx", hotel: "Ancira Centro", room: "303", roomScope: "self", onSite: true, note: "Riser de batería a 40 cm en este foro." },
  { name: "Bruno Alanís", role: "Playback / MD", party: "B", team: "Playback", depth: 3, account: true, reports: "Reporta a Dani Berrones", scope: "Ve su departamento. Controla clic, secuencias y cueing.", tel: "+528118420112", email: "bruno@bestiasdelvalle.mx", hotel: "Ancira Centro", room: "302", roomScope: "department", onSite: true, note: 'Pidió mover "Bestias" al encore.' },
  { name: "Chuy Reyes", role: "Crew Chief · carpintería", party: "C", team: "Carpintería", depth: 3, account: false, reports: "Reporta a Dani Berrones", scope: "Freelance sin cuenta. 6 carpinteros bajo su mando.", tel: "+528118420121", email: "tallerreyes@correo.mx", hotel: "Hotel Fastos", room: "118", roomScope: "self", onSite: true, note: "Su equipo se hospeda aparte, más cerca del taller." },
  { name: "Ivo Cárdenas", role: "Crew Chief · rigging", party: "C", team: "Rigging", depth: 3, account: false, reports: "Reporta a Dani Berrones", scope: "Freelance sin cuenta. Certificación de vuelo aéreo vigente.", tel: "+525518420122", email: "ops@alturas.mx", hotel: "Llega directo a GDL", room: "n/a", roomScope: "self", onSite: false, note: "Debe mandar certificaciones 48 h antes de Barranca." },
  { name: "Ruth Camarena", role: "Jefa de vestuario", party: "A", team: "Vestuario", depth: 2, account: true, reports: "Reporta a Sonia del Valle", scope: "Ve solo lo del artista (self). Camerino y guardarropa.", tel: "+528118420113", email: "ruth@bestiasdelvalle.mx", hotel: "Ancira Centro", room: "604", roomScope: "self", onSite: true, note: "Lavandería del foro disponible desde las 15:00." },
  { name: "Ximena Pardo", role: "Glam · maquillaje y pelo", party: "A", team: "Vestuario", depth: 3, account: false, reports: "Reporta a Ruth Camarena", scope: "Freelance sin cuenta. Solo ve los horarios del camerino.", tel: "+528118420114", email: "xime.glam@correo.mx", hotel: "Ancira Centro", room: "603", roomScope: "self", onSite: true, note: "" },
  { name: "Sonia del Valle", role: "Personal Manager", party: "A", team: "Artista", depth: 1, account: true, reports: "Reporta a Phil Gutiérrez", scope: "Ve lo del artista (self) más los cuartos que le autorizó el Production Manager.", tel: "+528118420107", email: "sonia@bestiasdelvalle.mx", hotel: "Ancira Centro", room: "606", roomScope: "custom", onSite: true, note: "Único contacto para necesidades privadas del artista." },
  { name: "Aldo Sáenz", role: "Seguridad del artista", party: "A", team: "Seguridad", depth: 2, account: false, reports: "Reporta a Sonia del Valle", scope: "Freelance sin cuenta. Ve movimientos del artista, no la gira completa.", tel: "+528118420115", email: "aldo.seg@correo.mx", hotel: "Ancira Centro", room: "605", roomScope: "custom", onSite: true, note: "Acompaña del hotel al camerino." },
  { name: "Nadia Quiroz", role: "Jefa de seguridad de sitio", party: "C", team: "Seguridad", depth: 2, account: true, reports: "Reporta a Juan C. Cisneros", scope: "Ve su departamento. Coordina accesos, backstage y local security.", tel: "+528118420116", email: "nadia@muralla.mx", hotel: "Ancira Centro", room: "406", roomScope: "department", onSite: true, note: "Briefing de accesos a las 19:45." },
  { name: "Beto Salinas", role: "Dockmaster", party: "C", team: "Choferes", depth: 2, account: false, reports: "Reporta a Lucía Bernal", scope: "Freelance sin cuenta. Define el orden de carga de los trailers.", tel: "+528118420124", email: "logistica@fletesdelcerro.mx", hotel: "Hotel Fastos", room: "112", roomScope: "self", onSite: true, note: "Duerme cerca del patio de camiones." },
  { name: "Rafa Ponce", role: "Head Driver", party: "C", team: "Choferes", depth: 3, account: false, reports: "Reporta a Beto Salinas", scope: "Freelance sin cuenta. Coordina la llegada de camiones al venue.", tel: "+528118420106", email: "rafa@fletesdelcerro.mx", hotel: "Hotel Fastos", room: "110", roomScope: "self", onSite: true, note: "" },
  { name: "Fer Aguilar", role: "Catering de gira", party: "C", team: "Catering", depth: 2, account: false, reports: "Reporta a Lucía Bernal", scope: "Freelance sin cuenta. 24 comidas por fecha.", tel: "+528118420125", email: "fer@cocinanomada.mx", hotel: "Hotel Fastos", room: "108", roomScope: "self", onSite: true, note: "Catering en camerino 3, no en el lobby." },
  { name: "Marisol Treviño", role: "Booking Agent", party: "C", team: "Booking", depth: 1, account: true, reports: "Reporta a Phil Gutiérrez", scope: "Ve fechas, ofertas y contratos; no ve logística de sitio.", tel: "+528118420126", email: "marisol@bookingnorte.mx", hotel: "No viaja", room: "n/a", roomScope: "tour_all", onSite: false, note: "Negocia la fecha en hold de CDMX." },
  { name: "Despacho Nava & Ruiz", role: "Contratos y cláusulas", party: "C", team: "Legal", depth: 1, account: true, reports: "Reporta a Phil Gutiérrez", scope: "Ve contratos y cláusulas de la gira; nada de crew ni cuartos.", tel: "+528118420127", email: "contratos@navaruiz.mx", hotel: "No viaja", room: "n/a", roomScope: "tour_all", onSite: false, note: "Valida cláusula de radio de CDMX." },
];

export const VACANCIES: Vacancy[] = [
  { role: "Booker", party: "C", team: "Booking" },
  { role: "Automatización", party: "C", team: "Rigging" },
  { role: "Cámara 2", party: "C", team: "Video" },
  { role: "Asistente de vestuario", party: "A", team: "Vestuario" },
  { role: "Seguridad de escenario", party: "C", team: "Seguridad" },
  { role: "Chofer de van 2", party: "C", team: "Choferes" },
  { role: "Confidencialidad / seguridad legal", party: "C", team: "Legal" },
];

export const EXTERNAL_CONTACTS: ExternalContact[] = [
  { name: "Rocío Tamez", role: "Producción del lugar · Foro Cantera", type: "Recinto", email: "rocio@canteralive.mx", phone: "+52 81 8420 0117", tel: "+528118420117", note: "Autoriza extensiones de curfew y accesos de carga." },
  { name: "Emiliano Ceballos", role: "Jefe de escenario · Foro Cantera", type: "Recinto", email: "emiliano@canteralive.mx", phone: "+52 81 8420 0141", tel: "+528118420141", note: "Recibe el run of show impreso a las 13:30." },
  { name: "Vero Ibarra", role: "Promotora · fecha CDMX", type: "Promotor", email: "vero@volcanprod.mx", phone: "+52 55 8420 0140", tel: "+525518420140", note: "Pendiente de firmar la oferta del 15 sep." },
  { name: "Daniela Sepúlveda", role: "Gerente de grupos · Hotel Ancira", type: "Hotel", email: "grupos@ancira.mx", phone: "+52 81 1234 567", tel: "+528111234567", note: "Maneja el bloque de 18 cuartos y el late check-out." },
  { name: "Memo Villarreal", role: "Audio · Sonido Sierra", type: "Proveedor", email: "contacto@sonidosierra.mx", phone: "+52 81 8420 0118", tel: "+528118420118", note: "Proveedor autorizado del recinto; trae consola de respaldo." },
];

export const GUESTS_SEED: Record<string, Guest[]> = {
  d11: [],
  d12: [
    { name: "Ana Lucía Robles", by: "Agregada por management", status: "confirmed" },
    { name: "Prensa — Radio Sierra (2)", by: "Agregada por promotor", status: "confirmed" },
    { name: "Toño Márquez", by: "Agregado por la banda", status: "pending" },
    { name: "Sofía Cantú +1", by: "Agregada por el venue", status: "pending" },
    { name: "Iker Fuentes", by: "Agregado por la banda", status: "denied" },
  ],
  d13: [
    { name: "Gaby Zepeda", by: "Agregada por la banda", status: "confirmed" },
    { name: "Sello Tierra Alta (3)", by: "Agregado por management", status: "pending" },
  ],
  d15: [],
};

export const DEFAULT_HITOS = [
  { id: "loadin", label: "Load-in", time: "14:00", done: true },
  { id: "patch", label: "Patch y line check", time: "16:30", done: true },
  { id: "sound", label: "Soundcheck", time: "18:00", done: false },
  { id: "doors", label: "Doors", time: "20:00", done: false },
  { id: "show", label: "Show", time: "21:30", done: false },
  { id: "out", label: "Load-out", time: "00:30", done: false },
];

export const DEFAULT_SETLIST = [
  { title: "Neblina en ruta", len: "4:10", cue: "Intro con secuencia · blackout" },
  { title: "Cerro de la Silla", len: "3:38", cue: "Cue de luces 12" },
  { title: "Carretera 40D", len: "5:02", cue: "Se corta si el show arranca tarde" },
  { title: "La última función", len: "4:44", cue: "Cambio de guitarra acústica" },
  { title: "Patio trasero", len: "3:20", cue: "Versión acústica en esta fecha" },
  { title: "Bestias (encore)", len: "6:15", cue: "Encore · confeti y video" },
];

export const DEFAULT_VEHICLES = [
  { label: "Truck 2 · audio y backline", meta: "Entra primero: monta FOH" },
  { label: "Truck 1 · luces y rigging", meta: "Rigging antes de que suba el piso" },
  { label: "Truck 3 · carpintería", meta: "Llega 06:00, descarga al final" },
  { label: "Bus A · crew", meta: "No entra al patio, se queda en la calle" },
];

export const DEFAULT_REMINDERS = [
  { at: "08:00", message: "Alarma: llamar al promotor de CDMX" },
  { at: "17:00", message: "15 min antes de la salida del hotel" },
];

export interface NotaEntry {
  origen: string;
  body: string;
  meta: string;
}

export const DEFAULT_NOTAS: NotaEntry[] = [
  { origen: "Lugar · Foro Cantera", body: "El elevador de carga del foro mide 1.90 m: los racks altos suben por rampa.", meta: "Phil G. · hace 2 h" },
  { origen: "Equipo · Catering", body: "Catering del crew se sirve en el camerino 3, no en el lobby.", meta: "Lucía B. · hace 40 min" },
  { origen: "Equipo · Rigging", body: "Falta el plano de rigging firmado de Guadalajara.", meta: "Dani B. · ayer" },
];

export function fileIcon(kind: string): "globe" | "blueprint" | "table" | "file-pdf" {
  if (kind === "web") return "globe";
  if (kind === "plano") return "blueprint";
  if (kind === "xls") return "table";
  return "file-pdf";
}
