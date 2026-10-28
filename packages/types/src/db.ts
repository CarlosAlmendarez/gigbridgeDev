/**
 * Formas de fila del esquema unificado de GigBridge en Supabase.
 *
 * A diferencia de la versión anterior de este archivo, esto YA NO es un
 * contrato provisional: refleja 1:1 las migraciones en
 * `gigbridgeDev/supabase/migrations/` (0001–0007), que a su vez portan el
 * esquema real de la v1 (`GigBridge/gigbridge/supabase/schema_master.sql`,
 * verificado 2026-09-13) más el módulo de gira reestructurado con el venue
 * como núcleo, según `GigBridge — Análisis y plan de desarrollo de la nueva
 * versión.md`. Si cambias una migración, cambia este archivo en el mismo
 * commit — no hay generación automática todavía.
 */

// ─────────────────────────────────────────────────────────────
// 0001: profiles
// ─────────────────────────────────────────────────────────────

export type UserRole = "artist" | "booker" | "venue" | "fan" | "manager";
export type AvailabilityStatus = "available" | "busy" | "on_tour";
export type SubscriptionTier = "free_unverified" | "free_verified" | "pro" | "max";

export interface ProfileRow {
  id: string;
  user_id: string;
  slug: string;
  display_name: string;
  role: UserRole;
  bio_short: string | null;
  bio_long: string | null;
  cover_image_url: string | null;
  avatar_url: string | null;
  availability_status: AvailabilityStatus;
  availability_city: string | null;
  spotify_url: string | null;
  youtube_url: string | null;
  instagram_url: string | null;
  website_url: string | null;
  /** Nunca se expone vía el cliente público (columna excluida del grant anon/authenticated). */
  rider_pin: string | null;
  is_admin: boolean;
  is_super_admin: boolean;
  subscription_tier: SubscriptionTier;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────
// 0002: bands, rider estructurado (compatibilidad), artefactos de artista
// ─────────────────────────────────────────────────────────────

export type BandVerificationStatus = "unsubmitted" | "pending" | "approved" | "rejected";
export type FormationType = "solo" | "duo" | "trio" | "quartet" | "quintet" | "large_band";
export type BookingStatus = "available" | "booked" | "blocked" | "busy" | "on_tour";

export interface BandRow {
  id: string;
  profile_id: string;
  name: string;
  genre: string | null;
  genres: string[];
  city: string | null;
  state_region: string | null;
  country: string;
  has_own_pa: boolean;
  has_own_lighting: boolean;
  price_min: number | null;
  price_max: number | null;
  currency: string;
  is_discoverable: boolean;
  profile_photo_url: string | null;
  cover_photo_url: string | null;
  formation: unknown[];
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  verification_status: BandVerificationStatus;
  verification_notes: string | null;
  subscription_tier: SubscriptionTier;
  video_url: string | null;
  active_since: number | null;
  formation_type: FormationType | null;
  epk_photos: unknown[];
  featured_video_label: string | null;
  releases: unknown[];
  shows: unknown[];
  press_quotes: unknown[];
  spotify_listeners: number | null;
  instagram_followers: number | null;
  youtube_subscribers: number | null;
  tiktok_followers: number | null;
  facebook_followers: number | null;
  metrics_updated_at: string | null;
  base_price: number | null;
  price_currency: string;
  price_negotiable: boolean;
  set_duration_min: number | null;
  set_duration_max: number | null;
  setup_time: number | null;
  has_full_backline: boolean;
  territories: unknown[];
  booking_email: string | null;
  booking_phone: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  soundcloud_url: string | null;
  bandcamp_url: string | null;
  completeness_score: number;
  epk_published: boolean;
  epk_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export type RiderItemLevel = "must" | "desirable" | "flexible";

export interface RiderItem {
  category: string;
  item: string;
  level: RiderItemLevel;
  notes?: string;
}

/**
 * Rider ESTRUCTURADO del artista (items must/desirable/flexible) usado por
 * el motor de compatibilidad (`compatibility.ts` en v1) contra el
 * inventario técnico de un venue. No confundir con un "rider técnico" como
 * documento (ver DocumentRow / DocumentTypeKey) — son conceptos distintos
 * que resuelven problemas distintos.
 */
export interface RiderRow {
  id: string;
  profile_id: string;
  band_id: string | null;
  title: string;
  items: RiderItem[];
  notes: string | null;
  pin: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface InputListRow {
  id: string;
  profile_id: string;
  rider_id: string | null;
  title: string;
  channels: unknown[];
  created_at: string;
  updated_at: string;
}

export interface StagePlotRow {
  id: string;
  profile_id: string;
  title: string;
  elements: unknown[];
  created_at: string;
  updated_at: string;
}

export interface AvailabilityRow {
  id: string;
  profile_id: string;
  date: string;
  status: BookingStatus;
  city: string | null;
  notes: string | null;
  event_id: string | null;
  created_at: string;
}

export interface BandVerificationRequestRow {
  id: string;
  band_id: string;
  submitted_at: string;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface PdfExportLogRow {
  id: string;
  band_id: string;
  rider_id: string | null;
  exported_at: string;
}

// ─────────────────────────────────────────────────────────────
// 0003: jurisdicciones (reglas de labor)
// ─────────────────────────────────────────────────────────────

export interface JurisdictionRow {
  id: string;
  name: string;
  country: string;
  state_region: string | null;
  city: string | null;
  min_paid_hours: number | null;
  break_frequency_minutes: number | null;
  break_duration_minutes: number | null;
  meal_deadline_hour: number | null;
  meal_penalty_type: string | null;
  allows_department_change: boolean;
  union_required: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────
// 0004: venues (entidad central del MVP)
// ─────────────────────────────────────────────────────────────

export type VenueType = "live_venue" | "rehearsal_studio" | "hybrid";
export type VenueVerificationStatus = "unsubmitted" | "pending" | "approved" | "rejected";
export type ManagementType = "independent" | "managed" | "hybrid";
export type ClaimStatus = "unclaimed" | "pending" | "claimed";
export type ContactVisibility = "public" | "verified_pros" | "tour_members";
export type ParkingAvailability = "none" | "street" | "private_lot" | "van_trailer_accessible";
export type SoundproofingLevel = "none" | "basic" | "professional" | "studio_grade";

export interface VenueRow {
  id: string;
  owner_id: string | null;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  cover_photo_url: string | null;
  photos: string[];
  instagram_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  tiktok_url: string | null;
  website_url: string | null;
  address: string | null;
  city: string;
  state_region: string | null;
  country: string;
  google_maps_url: string | null;
  capacity: number | null;
  venue_type: VenueType;
  stage_width_m: number | null;
  stage_depth_m: number | null;
  stage_height_m: number | null;
  stage_surface: string | null;
  stage_load_kg_per_m2: number | null;
  stage_notes: string | null;
  power_outlets_stage: number;
  power_voltage: number;
  has_ground_connection: boolean;
  has_backup_generator: boolean;
  power_notes: string | null;
  has_pa: boolean;
  pa_brand: string | null;
  pa_model: string | null;
  pa_watts: number | null;
  pa_max_db: number | null;
  has_frontfills: boolean;
  has_outfills: boolean;
  has_subwoofers: boolean;
  pa_notes: string | null;
  has_foh_console: boolean;
  foh_console_brand: string | null;
  foh_console_model: string | null;
  foh_console_type: "analog" | "digital" | null;
  foh_console_channels: number | null;
  foh_console_outputs: number | null;
  foh_max_distance_m: number | null;
  floor_monitors_count: number;
  floor_monitor_brand: string | null;
  floor_monitor_model: string | null;
  sidefills_count: number;
  has_in_ear_system: boolean;
  monitor_notes: string | null;
  microphones: unknown[];
  mic_stands_boom: number;
  mic_stands_straight: number;
  mic_stands_short: number;
  di_boxes_count: number;
  has_backline_loan: boolean;
  backline: unknown[];
  has_lighting: boolean;
  lighting_notes: string | null;
  has_lighting_engineer: boolean;
  has_audio_engineer: boolean;
  has_stage_manager: boolean;
  soundproofing_level: SoundproofingLevel | null;
  acoustic_treatment_type: string | null;
  hourly_rate: number | null;
  lockers_available: boolean;
  has_reception: boolean;
  cancellation_policy: string | null;
  load_in_time_limit_minutes: number | null;
  curfew_time: string | null;
  has_loading_dock: boolean;
  ground_floor_access: boolean;
  parking_availability: ParkingAvailability | null;
  has_green_room: boolean;
  wifi_speed_mbps: number | null;
  has_private_restroom: boolean;
  wheelchair_accessible: boolean;
  accessible_restroom: boolean;
  accessibility_notes: string | null;
  promo_video_url: string | null;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  verification_status: VenueVerificationStatus;
  verification_notes: string | null;
  management_type: ManagementType;
  claim_status: ClaimStatus;
  contact_visibility: ContactVisibility;
  jurisdiction_id: string | null;
  /** Overrides puntuales sobre la jurisdicción heredada (campos sueltos de JurisdictionRow). */
  labor_rule_overrides: Partial<
    Pick<
      JurisdictionRow,
      | "min_paid_hours"
      | "break_frequency_minutes"
      | "break_duration_minutes"
      | "meal_deadline_hour"
      | "meal_penalty_type"
      | "allows_department_change"
      | "union_required"
    >
  >;
  is_discoverable: boolean;
  price_per_event_min: number | null;
  price_per_event_max: number | null;
  currency: string;
  genres_hosted: string[];
  completeness_score: number;
  created_at: string;
  updated_at: string;
}

export interface VenueRoomRow {
  id: string;
  venue_id: string;
  name: string;
  description: string | null;
  stage_plot_elements: unknown[];
  stage_plot_pdf_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface VenueAvailabilityBlockRow {
  id: string;
  venue_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  block_type: "available" | "blocked";
  notes: string | null;
  created_at: string;
}

export interface VenueViewRow {
  id: string;
  venue_id: string;
  viewed_at: string;
  country: string | null;
  city: string | null;
  source: string | null;
  referrer_url: string | null;
}

export interface VenueVerificationRequestRow {
  id: string;
  venue_id: string | null;
  request_type: "verification" | "claim";
  submitted_by: string | null;
  submitted_at: string;
  admin_notes: string | null;
  status: "pending" | "approved" | "rejected";
  reviewed_at: string | null;
  reviewed_by: string | null;
}

// ─────────────────────────────────────────────────────────────
// 0005: booking, eventos, notificaciones, push
// ─────────────────────────────────────────────────────────────

export type BookingRequestStatus =
  | "pending"
  | "viewed"
  | "accepted"
  | "rejected"
  | "negotiating"
  | "confirmed";

export interface BookingRequestRow {
  id: string;
  profile_id: string;
  requester_id: string | null;
  requester_name: string | null;
  requester_email: string | null;
  event_date: string;
  event_type: string;
  venue_name: string;
  venue_city: string;
  venue_capacity: number | null;
  venue_address: string | null;
  budget_min: number | null;
  budget_max: number | null;
  currency: string;
  set_duration_minutes: number | null;
  load_in_time: string | null;
  soundcheck_time: string | null;
  show_time: string;
  has_pa: boolean;
  pa_details: string | null;
  has_monitors: boolean;
  has_backline: boolean;
  backline_details: string | null;
  has_lighting: boolean;
  message: string | null;
  status: BookingRequestStatus;
  rejection_reason: string | null;
  counter_proposal: string | null;
  counter_budget: number | null;
  counter_show_time: string | null;
  counter_load_in_time: string | null;
  counter_proposed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  related_id: string | null;
  read: boolean;
  created_at: string;
}

export type EventStatus = "draft" | "published" | "cancelled" | "completed";
export type TicketPlatform = "ticketmaster" | "boletia" | "eventbrite" | "otra" | "en_puerta";

export interface EventRow {
  id: string;
  band_id: string | null;
  venue_id: string | null;
  booking_request_id: string | null;
  title: string;
  description: string | null;
  event_date: string;
  doors_time: string | null;
  show_time: string;
  end_time: string | null;
  venue_name: string;
  venue_address: string | null;
  city: string;
  state_region: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  is_free: boolean;
  ticket_price_min: number | null;
  ticket_price_max: number | null;
  currency: string;
  ticket_url: string | null;
  ticket_platform: TicketPlatform | null;
  tickets_available: boolean;
  status: EventStatus;
  cancelled_reason: string | null;
  is_public: boolean;
  cover_image_url: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ProfileViewRow {
  id: string;
  band_id: string | null;
  viewer_id: string | null;
  viewer_type: "fan" | "booker" | "venue" | "anonymous" | null;
  source: "direct" | "discovery" | "map" | "share_link" | "other" | null;
  user_agent: string | null;
  viewed_at: string;
}

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
  created_at: string;
}

export interface NotificationPreferencesRow {
  user_id: string;
  booking_request: boolean;
  booking_viewed: boolean;
  booking_accepted: boolean;
  booking_rejected: boolean;
  booking_confirmed: boolean;
  booking_negotiating: boolean;
  venue_verified: boolean;
  band_verified: boolean;
  message: boolean;
  push_enabled: boolean;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────
// 0006: módulo de gira (venue como núcleo)
// ─────────────────────────────────────────────────────────────

export type TourStatus = "planning" | "active" | "completed" | "cancelled";
export type TourDateStatus = "hold" | "confirmed" | "cancelled" | "completed";
export type DealType = "guarantee" | "split" | "buyout" | "hybrid";
export type TourMemberRole = "admin" | "dept_head" | "member" | "guest";
export type TourCrewStatus = "confirmed" | "pending" | "denied";
export type VisibilityScope = "self" | "department" | "tour_all" | "custom";
export type VisibilitySubjectType = "person" | "group" | "department" | "role";
export type VisibilityResourceType =
  | "labor"
  | "contactos"
  | "hospedaje"
  | "finanzas"
  | "documentos"
  | "hotel_room"
  | "itinerary";
export type GuestListStatus = "pending" | "confirmed" | "denied";

export interface DepartmentRow {
  id: string;
  name: string;
  sort_order: number;
}

export interface RoleRow {
  id: string;
  department_id: string | null;
  name: string;
  description: string | null;
  is_department_head: boolean;
}

/** user_id es null para crew freelance/invitado sin cuenta todavía. */
export interface CrewMemberRow {
  id: string;
  user_id: string | null;
  full_name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
}

export interface TourRow {
  id: string;
  band_id: string;
  name: string;
  status: TourStatus;
  region: string | null;
  start_date: string | null;
  end_date: string | null;
  tour_manager_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** venue_id null = día de viaje/descanso sin venue. */
export interface TourDateRow {
  id: string;
  tour_id: string;
  venue_id: string | null;
  show_date: string;
  doors_time: string | null;
  show_time: string | null;
  status: TourDateStatus;
  deal_type: DealType | null;
  guarantee_amount: number | null;
  split_percentage: number | null;
  currency: string;
  advance_date: string | null;
  sequence_order: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * `member_role` es el permiso de aplicación por gira (admin/jefe de
 * depto/miembro/invitado). `role_id` es el rol OPERATIVO (sonido, luces,
 * ...) vía el catálogo `roles` — son dos cosas distintas.
 * `party` es texto libre (el "party A/B" de Phil), no una tabla catálogo.
 */
export interface TourCrewRow {
  id: string;
  tour_id: string;
  crew_member_id: string;
  role_id: string | null;
  member_role: TourMemberRole;
  reports_to: string | null;
  party: string | null;
  status: TourCrewStatus;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

/**
 * subject_id depende de subject_type: 'person' → tour_crew.id,
 * 'department' → departments.id, 'role' → roles.id, 'group' → el valor
 * libre de tour_crew.party. resource_id null = aplica a toda la sección.
 */
export interface VisibilityGrantRow {
  id: string;
  tour_id: string;
  subject_type: VisibilitySubjectType;
  subject_id: string;
  resource_type: VisibilityResourceType;
  resource_id: string | null;
  scope: VisibilityScope;
  granted_by: string | null;
  created_at: string;
}

export interface HotelRoomAssignmentRow {
  id: string;
  tour_date_id: string;
  crew_member_id: string;
  hotel_name: string;
  room_number: string | null;
  check_in: string | null;
  check_out: string | null;
  default_scope: VisibilityScope;
  created_at: string;
}

export interface GuestListEntryRow {
  id: string;
  tour_date_id: string;
  guest_name: string;
  added_by: string | null;
  status: GuestListStatus;
  created_at: string;
}

export interface SetlistRow {
  id: string;
  tour_date_id: string;
  songs: Array<{ order: number; title: string; cue?: string; len?: string }>;
  updated_at: string;
}

export interface TourVehicleRow {
  id: string;
  tour_id: string;
  label: string;
  vehicle_type: "truck" | "bus" | "van" | null;
  load_order: number | null;
  created_at: string;
}

export interface ReminderRow {
  id: string;
  user_id: string;
  tour_date_id: string | null;
  remind_at: string;
  message: string;
  dismissed_at: string | null;
  created_at: string;
}

export interface TourNoteRow {
  id: string;
  tour_id: string;
  entity_type: "tour" | "tour_date" | "tour_crew" | "contract" | "provider" | "venue";
  entity_id: string;
  body: string;
  created_by: string | null;
  created_at: string;
}

/** MVP "en escalones": solo captura el dato, sin validar contra jurisdictions todavía. */
export interface LaborCallRow {
  id: string;
  tour_date_id: string;
  department_id: string | null;
  position_title: string;
  headcount: number;
  call_time: string;
  end_time: string | null;
  notes: string | null;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────
// 0007: documentos versionados y polimórficos
// ─────────────────────────────────────────────────────────────

export type DocumentOwnerType = "venue" | "band" | "tour" | "tour_date" | "crew";
export type DocumentVisibility = "public" | "verified_pros" | "tour_members" | "owner_only";
export type DocumentTypeKey =
  | "rider_tecnico"
  | "stage_plot"
  | "rigging_plot"
  | "patch_list"
  | "reglamento_interno"
  | "mapa_camerinos"
  | "catering"
  | "loading_dock";

export interface DocumentTypeRow {
  id: string;
  key: DocumentTypeKey;
  label: string;
  default_owner_types: DocumentOwnerType[];
  default_validity_days: number | null;
  sort_order: number;
}

export interface DocumentRow {
  id: string;
  owner_type: DocumentOwnerType;
  owner_id: string;
  document_type_id: string;
  title: string;
  visibility: DocumentVisibility;
  current_version_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersionRow {
  id: string;
  document_id: string;
  version_number: number;
  file_url: string;
  valid_from: string;
  valid_until: string | null;
  change_notes: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface DocumentUpdateRequestRow {
  id: string;
  document_id: string;
  requested_by: string | null;
  requested_at: string;
  status: "pending" | "resolved";
  resolved_at: string | null;
  resolved_by: string | null;
}

/** Referencia en vivo: compara seen_version_id contra documents.current_version_id para la alerta de "hay una versión más reciente". */
export interface TourDateDocumentRefRow {
  id: string;
  tour_date_id: string;
  document_id: string;
  seen_version_id: string | null;
  created_at: string;
}
