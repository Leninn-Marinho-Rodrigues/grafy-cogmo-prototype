import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import type { FirebaseApp, FirebaseOptions } from "firebase/app";
import {
  BadgeCheck,
  Bot,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  Check,
  ChevronRight,
  CircleDot,
  ContactRound,
  Database,
  Eye,
  EyeOff,
  Filter,
  Fingerprint,
  Globe2,
  Home,
  Import,
  KeyRound,
  Link2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Network,
  PanelLeft,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Tags,
  Trash2,
  Upload,
  UserRound,
  Users,
  WandSparkles,
  X,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import { initialState, seedContacts } from "./data";
import {
  buildGraph,
  buildOpportunityMatches,
  extractDdd,
  formatDddLocation,
  formatDate,
  getAllTags,
  getGraphFilterTags,
  getMergeSuggestions,
  graphFilterGroups,
  initials,
  makeAssistantAnswer,
  mergeContacts,
  parseContactImportText,
  parseIcsCalendarContacts,
  parseTabularContacts,
  parseVcardContacts,
  searchContacts,
  splitList,
  uid,
  unique
} from "./lib";
import type { Contact, CustomField, GrafyState, GraphNode, LinkKind, ViewKey } from "./types";

const STORAGE_KEY = "grafy-state-v2";
const SESSION_KEY = "grafy-session-v2";
const APP_SCHEMA_VERSION = "real-data-ingestion-2026-05-29";
const LEGACY_DEMO_CONTACT_IDS = new Set(seedContacts.map((contact) => contact.id));

const navItems: Array<{ key: ViewKey; label: string; icon: typeof Home }> = [
  { key: "dashboard", label: "Início", icon: Home },
  { key: "contacts", label: "Contatos", icon: ContactRound },
  { key: "import", label: "Importar", icon: Import },
  { key: "integrations", label: "Conectores", icon: Link2 },
  { key: "graph", label: "Grafo", icon: Network },
  { key: "groups", label: "Grupos", icon: Users },
  { key: "public", label: "Rede", icon: Globe2 },
  { key: "chat", label: "Chat", icon: MessageSquare },
  { key: "profile", label: "Perfil", icon: UserRound },
  { key: "settings", label: "Ajustes", icon: Settings }
];

const linkLabels: Record<LinkKind, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  url: "Site"
};

const mobileNavOrder: ViewKey[] = ["dashboard", "contacts", "graph", "import", "integrations", "chat"];
const groupColorOptions = ["#66e7ff", "#a993ff", "#ffd166", "#60f2d5", "#ff7aa8", "#31d17f"];
type AudienceMode = "personal" | "hub";
type SignupLandingMode = "signupPersonal" | "signupHub";
type LandingMode = "choice" | AudienceMode | SignupLandingMode;
type AuthMode = "signup" | "login";
type AccountType = "personal" | "company";
type ProviderSetupTarget = "google" | "apple";
type AuthLoginHandler = (email: string, importedContacts?: Contact[], targetView?: ViewKey) => void;
type FirebaseRuntimeConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  messagingSenderId?: string;
  storageBucket?: string;
};
type OAuthRuntimeConfig = {
  googleClientId: string;
  appleServiceId: string;
  appleRedirectUri: string;
  firebase: FirebaseRuntimeConfig | null;
};

const envString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const getFirebaseRuntimeConfig = (): FirebaseRuntimeConfig | null => {
  const apiKey = envString(import.meta.env.VITE_FIREBASE_API_KEY);
  const authDomain = envString(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
  const projectId = envString(import.meta.env.VITE_FIREBASE_PROJECT_ID);
  const appId = envString(import.meta.env.VITE_FIREBASE_APP_ID);
  if (!apiKey || !authDomain || !projectId || !appId) return null;
  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    messagingSenderId: envString(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) || undefined,
    storageBucket: envString(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) || undefined
  };
};

const getOAuthRuntimeConfig = (): OAuthRuntimeConfig => {
  return {
    googleClientId: envString(import.meta.env.VITE_GOOGLE_CLIENT_ID),
    appleServiceId: envString(import.meta.env.VITE_APPLE_SERVICE_ID),
    appleRedirectUri: envString(import.meta.env.VITE_APPLE_REDIRECT_URI),
    firebase: getFirebaseRuntimeConfig()
  };
};

function useOAuthRuntimeConfig() {
  const [config] = useState<OAuthRuntimeConfig>(() => getOAuthRuntimeConfig());

  return {
    oauthConfig: config,
    firebaseConfigured: Boolean(config.firebase),
    googleClientConfigured: Boolean(config.firebase || config.googleClientId),
    appleClientConfigured: Boolean(config.firebase || (config.appleServiceId && config.appleRedirectUri))
  };
}

const getLandingModeFromHash = (): LandingMode => {
  const hash = window.location.hash.toLowerCase();
  if (hash.includes("cadastro") && hash.includes("hubs")) return "signupHub";
  if (hash.includes("cadastro")) return "signupPersonal";
  if (hash.includes("hubs")) return "hub";
  if (hash.includes("empresarios")) return "personal";
  return "choice";
};

const getAudienceFromLandingMode = (mode: LandingMode): AudienceMode =>
  mode === "hub" || mode === "signupHub" ? "hub" : "personal";

const isSignupLandingMode = (mode: LandingMode) => mode === "signupPersonal" || mode === "signupHub";

const digitsOnly = (value: string) => value.replace(/\D/g, "");

const formatCep = (value: string) => {
  const digits = digitsOnly(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const formatCnpj = (value: string) => {
  const digits = digitsOnly(value).slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

const formatBrazilPhone = (value: string) => {
  const digits = digitsOnly(value).slice(0, 13);
  const localDigits = digits.startsWith("55") ? digits.slice(2) : digits;
  if (localDigits.length <= 2) return localDigits ? `(${localDigits}` : "";
  if (localDigits.length <= 6) return `(${localDigits.slice(0, 2)}) ${localDigits.slice(2)}`;
  if (localDigits.length <= 10) return `(${localDigits.slice(0, 2)}) ${localDigits.slice(2, 6)}-${localDigits.slice(6)}`;
  return `(${localDigits.slice(0, 2)}) ${localDigits.slice(2, 7)}-${localDigits.slice(7, 11)}`;
};

const cepFallbackRegions = [
  { min: 1000000, max: 19999999, label: "faixa postal de São Paulo/SP" },
  { min: 20000000, max: 28999999, label: "faixa postal do Rio de Janeiro/ES" },
  { min: 30000000, max: 39999999, label: "faixa postal de Minas Gerais" },
  { min: 40000000, max: 48999999, label: "faixa postal da Bahia/Sergipe" },
  { min: 49000000, max: 59999999, label: "faixa postal do Nordeste" },
  { min: 60000000, max: 63999999, label: "faixa postal do Ceará" },
  { min: 64000000, max: 65999999, label: "faixa postal do Piauí/Maranhão" },
  { min: 66000000, max: 68899999, label: "faixa postal do Pará/Amapá" },
  { min: 69000000, max: 69999999, label: "faixa postal do Amazonas/Roraima/Acre" },
  { min: 70000000, max: 76999999, label: "faixa postal do Centro-Oeste" },
  { min: 77000000, max: 77999999, label: "faixa postal do Tocantins" },
  { min: 78000000, max: 78899999, label: "faixa postal de Mato Grosso" },
  { min: 79000000, max: 79999999, label: "faixa postal de Mato Grosso do Sul" },
  { min: 80000000, max: 87999999, label: "faixa postal do Paraná" },
  { min: 88000000, max: 89999999, label: "faixa postal de Santa Catarina" },
  { min: 90000000, max: 99999999, label: "faixa postal do Rio Grande do Sul" }
];

const getCepFallbackLabel = (cep: string) => {
  const value = Number(digitsOnly(cep));
  const match = cepFallbackRegions.find((region) => value >= region.min && value <= region.max);
  return match?.label ?? "";
};

const getPasswordChecks = (password: string, confirmPassword: string) => [
  { label: "8 caracteres ou mais", valid: password.length >= 8 },
  { label: "pelo menos 1 número", valid: /\d/.test(password) },
  { label: "pelo menos 1 caractere especial", valid: /[^A-Za-z0-9]/.test(password) },
  { label: "senhas iguais", valid: Boolean(password) && password === confirmPassword }
];

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleTokenClient = {
  requestAccessToken: (options?: { prompt?: string; hint?: string }) => void;
};

type AppleSignInResponse = {
  authorization?: {
    code?: string;
    id_token?: string;
    state?: string;
  };
  user?: {
    email?: string;
    name?: {
      firstName?: string;
      lastName?: string;
    };
  };
};

type GoogleUserProfile = {
  email?: string;
  name?: string;
  picture?: string;
};

type GoogleNetworkImport = {
  contacts: Contact[];
  profile: GoogleUserProfile;
  stats: {
    peopleContacts: number;
    calendarContacts: number;
    totalBeforeMerge: number;
  };
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            include_granted_scopes?: boolean;
            callback: (response: GoogleTokenResponse) => void;
            error_callback?: (error: unknown) => void;
          }) => GoogleTokenClient;
        };
      };
    };
    AppleID?: {
      auth?: {
        init: (config: {
          clientId: string;
          scope: string;
          redirectURI: string;
          state?: string;
          nonce?: string;
          usePopup?: boolean;
        }) => void;
        signIn: () => Promise<AppleSignInResponse>;
      };
    };
  }
}

const envScope = (value: unknown, fallback: string) => {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || fallback;
};

const GOOGLE_CONTACTS_SCOPE = envScope(import.meta.env.VITE_GOOGLE_CONTACTS_SCOPE, "https://www.googleapis.com/auth/contacts.readonly");
const GOOGLE_CALENDAR_SCOPE = envScope(import.meta.env.VITE_GOOGLE_CALENDAR_SCOPE, "https://www.googleapis.com/auth/calendar.readonly");
const GOOGLE_IMPORT_CALENDAR = envString(import.meta.env.VITE_GOOGLE_IMPORT_CALENDAR).toLowerCase() === "true";
const GOOGLE_IMPORT_SCOPES = [
  "openid",
  "email",
  "profile",
  GOOGLE_CONTACTS_SCOPE,
  ...(GOOGLE_IMPORT_CALENDAR ? [GOOGLE_CALENDAR_SCOPE] : [])
].join(" ");

const decodeJwtPayload = (token?: string): Record<string, unknown> => {
  if (!token) return {};
  try {
    const payload = token.split(".")[1];
    if (!payload) return {};
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return {};
  }
};

let googleIdentityScriptPromise: Promise<void> | null = null;
let appleIdentityScriptPromise: Promise<void> | null = null;

const loadGoogleIdentityScript = () => {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (googleIdentityScriptPromise) return googleIdentityScriptPromise;
  googleIdentityScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Não foi possível carregar Google Identity Services.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Não foi possível carregar Google Identity Services."));
    document.head.appendChild(script);
  });
  return googleIdentityScriptPromise;
};

const loadAppleIdentityScript = () => {
  if (window.AppleID?.auth) return Promise.resolve();
  if (appleIdentityScriptPromise) return appleIdentityScriptPromise;
  appleIdentityScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Não foi possível carregar Sign in with Apple.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Não foi possível carregar Sign in with Apple."));
    document.head.appendChild(script);
  });
  return appleIdentityScriptPromise;
};

type GooglePerson = {
  names?: Array<{ displayName?: string; givenName?: string; familyName?: string }>;
  emailAddresses?: Array<{ value?: string }>;
  phoneNumbers?: Array<{ value?: string }>;
  organizations?: Array<{ name?: string; title?: string }>;
  biographies?: Array<{ value?: string }>;
  photos?: Array<{ url?: string; default?: boolean }>;
};

type GoogleCalendarEvent = {
  summary?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  organizer?: { displayName?: string; email?: string };
  attendees?: Array<{ displayName?: string; email?: string; organizer?: boolean; responseStatus?: string }>;
};

const contactFromGooglePerson = (person: GooglePerson, now: string): Contact | null => {
  const name = person.names?.[0]?.displayName || [person.names?.[0]?.givenName, person.names?.[0]?.familyName].filter(Boolean).join(" ");
  const emails = unique((person.emailAddresses ?? []).map((email) => email.value ?? "").filter(Boolean));
  const phones = unique((person.phoneNumbers ?? []).map((phone) => phone.value ?? "").filter(Boolean));
  if (!name && !emails.length && !phones.length) return null;
  const ddd = extractDdd(phones[0] ?? "");
  const organization = person.organizations?.[0];
  return {
    id: uid("ct"),
    name: name || emails[0] || phones[0] || "Contato Google",
    headline: unique([organization?.title, organization?.name]).join(" · "),
    avatarUrl: person.photos?.find((photo) => photo.url && !photo.default)?.url ?? person.photos?.find((photo) => photo.url)?.url,
    description: person.biographies?.[0]?.value || "Contato importado do Google Contacts com consentimento do usuário.",
    tags: unique(["Google Contacts", ddd ? `DDD ${ddd}` : "", organization?.name ? "empresa" : ""].filter(Boolean)),
    phones,
    emails,
    ddd,
    source: "Google Contacts",
    currentDemand: "",
    problemSolves: "",
    notes: "Importado via Google People API no navegador. Em produção, tokens devem ficar no backend/Edge Function.",
    links: [],
    isPublic: false,
    groupIds: [],
    customFields: {
      origemAgenda: "Google Contacts",
      empresa: organization?.name ?? "",
      cargo: organization?.title ?? ""
    },
    createdAt: now,
    updatedAt: now
  };
};

const contactFromGoogleAttendee = (event: GoogleCalendarEvent, attendee: NonNullable<GoogleCalendarEvent["attendees"]>[number], now: string): Contact | null => {
  if (!attendee.email) return null;
  const eventName = event.summary || "Evento Google Agenda";
  return {
    id: uid("ct"),
    name: attendee.displayName || attendee.email.split("@")[0].replace(/[._-]+/g, " "),
    headline: attendee.organizer ? `Organizador em ${eventName}` : `Participante de ${eventName}`,
    description: `Participante importado da Google Agenda${event.location ? ` em ${event.location}` : ""}.`,
    tags: unique(["Google Calendar", "agenda", "evento", event.location ?? "", eventName].filter(Boolean)),
    phones: [],
    emails: [attendee.email],
    ddd: "",
    source: "Google Calendar",
    currentDemand: "",
    problemSolves: "",
    notes: "Importado via Google Calendar API com consentimento do usuário.",
    links: [],
    isPublic: false,
    groupIds: ["grp_eventos"],
    customFields: {
      origemAgenda: "Google Calendar",
      eventoOrigem: eventName,
      localEvento: event.location ?? "",
      dataEvento: event.start?.dateTime ?? event.start?.date ?? "",
      statusAgenda: attendee.responseStatus ?? ""
    },
    createdAt: now,
    updatedAt: now
  };
};

const mergeContactsByEmailOrPhone = (contacts: Contact[]) => {
  const merged: Contact[] = [];
  const indexByKey = new Map<string, number>();
  const getKeys = (contact: Contact) =>
    [
      ...contact.emails.map((email) => `email:${email.toLowerCase().trim()}`),
      ...contact.phones.map((phone) => `phone:${phone.replace(/\D/g, "")}`)
    ].filter((key) => !key.endsWith(":"));

  contacts.forEach((contact) => {
    const keys = getKeys(contact);
    const existingIndex = keys.map((key) => indexByKey.get(key)).find((index): index is number => typeof index === "number");
    if (typeof existingIndex === "number") {
      merged[existingIndex] = mergeContacts(merged[existingIndex], contact);
      getKeys(merged[existingIndex]).forEach((key) => indexByKey.set(key, existingIndex));
      return;
    }

    const nextIndex = merged.push(contact) - 1;
    keys.forEach((key) => indexByKey.set(key, nextIndex));
  });

  return merged;
};

const contactFromImportedPartial = (
  partial: Partial<Contact>,
  options: {
    fallbackName: string;
    fallbackSource: Contact["source"];
    notes: string;
    extraTags?: string[];
    groupIds?: string[];
    customFields?: Contact["customFields"];
  }
): Contact => {
  const now = new Date().toISOString();
  const phones = partial.phones ?? [];
  const ddd = partial.ddd || extractDdd(phones[0] ?? "");
  const source = (partial.source as Contact["source"] | undefined) ?? options.fallbackSource;
  return {
    id: uid("ct"),
    name: partial.name ?? options.fallbackName,
    headline: partial.headline ?? "",
    description: partial.description ?? "",
    tags: unique([...(partial.tags ?? []), ...(options.extraTags ?? []), ddd ? `DDD ${ddd}` : ""].filter(Boolean)),
    phones,
    emails: partial.emails ?? [],
    ddd,
    source,
    currentDemand: partial.currentDemand ?? "",
    problemSolves: partial.problemSolves ?? "",
    notes: partial.notes ?? options.notes,
    links: partial.links ?? [],
    isPublic: partial.isPublic ?? false,
    linkedUserId: partial.linkedUserId,
    groupIds: options.groupIds ?? partial.groupIds ?? [],
    customFields: {
      ...(partial.customFields ?? {}),
      ...(options.customFields ?? {})
    },
    createdAt: now,
    updatedAt: now
  };
};

const buildPrototypeNetworkContacts = (provider: ProviderSetupTarget, audienceMode: AudienceMode): Contact[] => {
  const now = new Date().toISOString();
  const providerLabel = provider === "google" ? "Google" : "Apple";
  const scopeLabel = audienceMode === "hub" ? "Hub/evento" : "Empresário";
  return seedContacts.slice(0, audienceMode === "hub" ? 9 : 12).map((contact) => ({
    ...contact,
    id: uid("demo"),
    tags: unique(["demonstração Grafy", "base exemplo", providerLabel, scopeLabel, ...contact.tags]),
    notes: unique([
      contact.notes,
      `Amostra de demonstração criada porque o login real de ${providerLabel} ainda não está conectado nesta publicação.`
    ]).join(" "),
    customFields: {
      ...contact.customFields,
      modoPrototipo: "Demonstração",
      conectorOrigem: providerLabel,
      publicoAlvo: scopeLabel
    },
    createdAt: now,
    updatedAt: now
  }));
};

const readFileAsText = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error(`Não foi possível ler ${file.name}.`));
    reader.readAsText(file);
  });

const getTextImportSource = (fileName: string, text: string): Extract<Contact["source"], "CSV" | "JSON"> =>
  fileName.toLowerCase().endsWith(".json") || text.trim().startsWith("{") || text.trim().startsWith("[") ? "JSON" : "CSV";

const parseContactsFromFile = async (file: File): Promise<{
  contacts: Partial<Contact>[];
  source: Extract<Contact["source"], "CSV" | "JSON" | "Excel">;
  text?: string;
}> => {
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
    const { default: readXlsxFile } = await import("read-excel-file/browser");
    const rows = await readXlsxFile(file);
    return { contacts: parseTabularContacts(rows as unknown as unknown[][], "Excel"), source: "Excel" };
  }

  const text = await readFileAsText(file);
  const source = getTextImportSource(file.name, text);
  return {
    contacts: parseContactImportText(text).map((contact) => ({ ...contact, source })),
    source,
    text
  };
};

const fetchGoogleJson = async <T,>(url: string, accessToken: string, label: string): Promise<T> => {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const response = await fetch(url, { headers });
  const text = await response.text();
  let data: unknown = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error?: { message?: string } }).error?.message === "string"
        ? (data as { error: { message: string } }).error.message
        : text;
    throw new Error(`${label} retornou ${response.status}${message ? `: ${message}` : "."}`);
  }
  return data as T;
};

const fetchGoogleUserProfile = async (accessToken: string): Promise<GoogleUserProfile> => {
  try {
    const userInfo = await fetchGoogleJson<{ email?: string; name?: string; picture?: string }>(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      accessToken,
      "Google perfil"
    );
    return {
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture
    };
  } catch {
    const person = await fetchGoogleJson<GooglePerson>(
      "https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,photos",
      accessToken,
      "Google perfil"
    );
    return {
      email: person.emailAddresses?.[0]?.value,
      name: person.names?.[0]?.displayName,
      picture: person.photos?.find((photo) => photo.url && !photo.default)?.url ?? person.photos?.[0]?.url
    };
  }
};

const fetchGooglePeopleContacts = async (accessToken: string, now: string) => {
  const contacts: Contact[] = [];
  let pageToken = "";
  do {
    const params = new URLSearchParams({
      pageSize: "1000",
      personFields: "names,emailAddresses,phoneNumbers,organizations,biographies,photos",
      sortOrder: "FIRST_NAME_ASCENDING"
    });
    if (pageToken) params.set("pageToken", pageToken);
    const data = await fetchGoogleJson<{ connections?: GooglePerson[]; nextPageToken?: string }>(
      `https://people.googleapis.com/v1/people/me/connections?${params.toString()}`,
      accessToken,
      "Google Contacts"
    );
    contacts.push(
      ...(data.connections ?? [])
        .map((person) => contactFromGooglePerson(person, now))
        .filter((contact): contact is Contact => Boolean(contact))
    );
    pageToken = data.nextPageToken ?? "";
  } while (pageToken);
  return contacts;
};

const fetchGoogleCalendarContacts = async (accessToken: string, now: string) => {
  const contacts: Contact[] = [];
  const timeMin = new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString();
  const timeMax = new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString();
  let pageToken = "";
  do {
    const params = new URLSearchParams({
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "2500",
      timeMin,
      timeMax
    });
    if (pageToken) params.set("pageToken", pageToken);
    const data = await fetchGoogleJson<{ items?: GoogleCalendarEvent[]; nextPageToken?: string }>(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
      accessToken,
      "Google Agenda"
    );
    contacts.push(
      ...(data.items ?? []).flatMap((event) =>
        (event.attendees ?? [])
          .map((attendee) => contactFromGoogleAttendee(event, attendee, now))
          .filter((contact): contact is Contact => Boolean(contact))
      )
    );
    pageToken = data.nextPageToken ?? "";
  } while (pageToken);
  return contacts;
};

const fetchGoogleContactsAndCalendar = async (accessToken: string): Promise<GoogleNetworkImport> => {
  const now = new Date().toISOString();
  const [profile, peopleContacts, calendarContacts] = await Promise.all([
    fetchGoogleUserProfile(accessToken),
    fetchGooglePeopleContacts(accessToken, now),
    GOOGLE_IMPORT_CALENDAR ? fetchGoogleCalendarContacts(accessToken, now) : Promise.resolve([])
  ]);
  const contacts = mergeContactsByEmailOrPhone([...peopleContacts, ...calendarContacts]);
  return {
    profile,
    contacts,
    stats: {
      peopleContacts: peopleContacts.length,
      calendarContacts: calendarContacts.length,
      totalBeforeMerge: peopleContacts.length + calendarContacts.length
    }
  };
};

const createEmptyGoogleImport = (profile: GoogleUserProfile): GoogleNetworkImport => ({
  profile,
  contacts: [],
  stats: {
    peopleContacts: 0,
    calendarContacts: 0,
    totalBeforeMerge: 0
  }
});

const getFirebaseApp = async (config: FirebaseRuntimeConfig): Promise<FirebaseApp> => {
  const { getApps, initializeApp } = await import("firebase/app");
  const existing = getApps()[0];
  if (existing) return existing;
  const options: FirebaseOptions = {
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    appId: config.appId,
    messagingSenderId: config.messagingSenderId,
    storageBucket: config.storageBucket
  };
  return initializeApp(options);
};

const requestFirebaseGoogleNetworkImport = async (
  firebaseConfig: FirebaseRuntimeConfig,
  onStatus: (message: string) => void
): Promise<GoogleNetworkImport> => {
  const [{ getAuth, GoogleAuthProvider, signInWithPopup }, app] = await Promise.all([
    import("firebase/auth"),
    getFirebaseApp(firebaseConfig)
  ]);
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  provider.addScope(GOOGLE_CONTACTS_SCOPE);
  if (GOOGLE_IMPORT_CALENDAR) provider.addScope(GOOGLE_CALENDAR_SCOPE);

  onStatus("Abrindo Google...");
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const profile: GoogleUserProfile = {
    email: result.user.email ?? undefined,
    name: result.user.displayName ?? undefined,
    picture: result.user.photoURL ?? undefined
  };

  if (!credential?.accessToken) {
    onStatus("Login Google concluído. O Google não devolveu permissão de contatos nesta sessão.");
    return createEmptyGoogleImport(profile);
  }

  try {
    onStatus(GOOGLE_IMPORT_CALENDAR ? "Login Google concluído. Importando Contacts e Agenda autorizados..." : "Login Google concluído. Importando Google Contacts autorizados...");
    const googleImport = await fetchGoogleContactsAndCalendar(credential.accessToken);
    return {
      ...googleImport,
      profile: {
        ...profile,
        ...googleImport.profile
      }
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "People API ou Calendar API não retornou dados.";
    onStatus(`Login Google concluído para ${profile.email ?? "a conta escolhida"}. Não consegui importar contatos ainda: ${detail}`);
    return createEmptyGoogleImport(profile);
  }
};

const requestFirebaseAppleIdentity = async (firebaseConfig: FirebaseRuntimeConfig): Promise<GoogleUserProfile> => {
  const [{ getAuth, OAuthProvider, signInWithPopup }, app] = await Promise.all([
    import("firebase/auth"),
    getFirebaseApp(firebaseConfig)
  ]);
  const auth = getAuth(app);
  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.addScope("name");
  const result = await signInWithPopup(auth, provider);
  return {
    email: result.user.email ?? undefined,
    name: result.user.displayName ?? undefined,
    picture: result.user.photoURL ?? undefined
  };
};

const requestGoogleProviderNetworkImport = async (
  config: OAuthRuntimeConfig,
  onStatus: (message: string) => void
): Promise<GoogleNetworkImport> => {
  if (config.firebase) return requestFirebaseGoogleNetworkImport(config.firebase, onStatus);
  if (config.googleClientId) return requestGoogleNetworkImport(config.googleClientId, onStatus);
  throw new Error("Google ainda não está ativado nesta publicação.");
};

const requestGoogleNetworkImport = async (
  googleClientId: string,
  onStatus: (message: string) => void
): Promise<GoogleNetworkImport> => {
  await loadGoogleIdentityScript();
  return new Promise((resolve, reject) => {
    const tokenClient = window.google?.accounts?.oauth2?.initTokenClient({
      client_id: googleClientId,
      scope: GOOGLE_IMPORT_SCOPES,
      include_granted_scopes: true,
      callback: async (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error_description || response.error || "Google não retornou token de acesso."));
          return;
        }
        try {
          onStatus(GOOGLE_IMPORT_CALENDAR ? "Importando perfil, Google Contacts e Agenda autorizados..." : "Importando perfil e Google Contacts autorizados...");
          resolve(await fetchGoogleContactsAndCalendar(response.access_token));
        } catch (error) {
          reject(error instanceof Error ? error : new Error("Falha ao importar dados do Google."));
        }
      },
      error_callback: (error) => {
        reject(new Error(`Falha no OAuth Google: ${String(error)}`));
      }
    });
    if (!tokenClient) {
      reject(new Error("Google Identity Services não ficou disponível neste navegador."));
      return;
    }
    tokenClient.requestAccessToken({ prompt: "consent select_account" });
  });
};

function useStoredState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;
    try {
      return JSON.parse(stored) as T;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

function hydrateState(state: GrafyState): GrafyState {
  const needsDemoDataRefresh = state.schemaVersion !== APP_SCHEMA_VERSION;
  const hydratedContacts = (state.contacts ?? []).filter((contact) => !LEGACY_DEMO_CONTACT_IDS.has(contact.id));
  const hydratedContactIds = new Set(hydratedContacts.map((contact) => contact.id));
  const currentGroups = state.groups?.length ? state.groups : initialState.groups;
  const groupsById = new Map(currentGroups.map((group) => [group.id, group]));
  const hydratedGroups = [
    ...initialState.groups.map((seedGroup, index) => {
      const currentGroup = groupsById.get(seedGroup.id);
      if (!needsDemoDataRefresh || !currentGroup) return currentGroup ?? seedGroup;
      return {
        ...seedGroup,
        ...currentGroup,
        color: currentGroup.color || seedGroup.color || groupColorOptions[index % groupColorOptions.length],
        tags: unique([...seedGroup.tags, ...(currentGroup.tags ?? [])]),
        contactIds: unique([...seedGroup.contactIds, ...(currentGroup.contactIds ?? [])]),
        members: unique([...seedGroup.members, ...(currentGroup.members ?? [])])
      };
    }),
    ...currentGroups.filter((group) => !initialState.groups.some((seedGroup) => seedGroup.id === group.id))
  ];

  return {
    ...state,
    schemaVersion: APP_SCHEMA_VERSION,
    profile: {
      ...initialState.profile,
      ...state.profile,
      visibility: needsDemoDataRefresh && state.profile?.id === initialState.profile.id ? "private" : state.profile?.visibility ?? "private",
      tags: state.profile?.tags ?? initialState.profile.tags,
      links: state.profile?.links ?? initialState.profile.links
    },
    contacts: hydratedContacts.map((contact) => ({
      ...contact,
      tags: contact.tags ?? [],
      links: contact.links ?? [],
      groupIds: contact.groupIds ?? [],
      customFields: contact.customFields ?? {}
    })),
    groups: hydratedGroups.map((group, index) => ({
      ...group,
      color: group.color || groupColorOptions[index % groupColorOptions.length],
      tags: group.tags ?? [],
      contactIds: (group.contactIds ?? []).filter((contactId) => hydratedContactIds.has(contactId)),
      members: group.members ?? []
    })),
    customFields: [
      ...initialState.customFields,
      ...(state.customFields ?? []).filter((field) => !initialState.customFields.some((seedField) => seedField.id === field.id))
    ],
    chatMessages: state.chatMessages ?? initialState.chatMessages
  };
}

function NetworkBackdrop({ className = "", density = 72, interactive = true }: { className?: string; density?: number; interactive?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef({ x: -9999, y: -9999, active: false, strength: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const colors = ["#58a6ff", "#3fb950", "#d29922", "#a371f7", "#f85149"];
    const particles = Array.from({ length: density }, (_, index) => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      radius: index % 9 === 0 ? 2.9 : 1.6 + Math.random() * 2.2,
      color: colors[index % colors.length],
      phase: Math.random() * Math.PI * 2
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const syncPointer = (event: PointerEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      pointerRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        active: event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom,
        strength: event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom ? 1 : pointerRef.current.strength
      };
      document.documentElement.style.setProperty("--pointer-x", `${event.clientX}px`);
      document.documentElement.style.setProperty("--pointer-y", `${event.clientY}px`);
    };

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);
      const pointer = pointerRef.current;
      pointer.strength = pointer.active ? Math.min(1, pointer.strength + 0.08) : pointer.strength * 0.92;
      const pointerStrength = interactive ? pointer.strength : 0;
      const points = particles.map((particle) => {
        if (!reducedMotion) {
          particle.x += particle.vx / Math.max(width, 1);
          particle.y += particle.vy / Math.max(height, 1);
        }
        if (particle.x < -0.04) particle.x = 1.04;
        if (particle.x > 1.04) particle.x = -0.04;
        if (particle.y < -0.04) particle.y = 1.04;
        if (particle.y > 1.04) particle.y = -0.04;
        const drift = reducedMotion ? 0 : 8;
        const baseX = particle.x * width + Math.cos(time / 1200 + particle.phase) * drift;
        const baseY = particle.y * height + Math.sin(time / 1500 + particle.phase) * drift;
        const distanceToPointer = pointerStrength > 0.02 ? Math.hypot(pointer.x - baseX, pointer.y - baseY) : 9999;
        const pull = distanceToPointer < 250 ? (1 - distanceToPointer / 250) * 0.22 * pointerStrength : 0;
        return {
          ...particle,
          px: baseX + (pointer.x - baseX) * pull,
          py: baseY + (pointer.y - baseY) * pull,
          distanceToPointer
        };
      });

      for (let i = 0; i < points.length; i += 1) {
        for (let j = i + 1; j < points.length; j += 1) {
          const first = points[i];
          const second = points[j];
          const distance = Math.hypot(first.px - second.px, first.py - second.py);
          if (distance > 150) continue;
          const midX = (first.px + second.px) / 2;
          const midY = (first.py + second.py) / 2;
          const cursorDistance = pointerStrength > 0.02 ? Math.hypot(pointer.x - midX, pointer.y - midY) : 9999;
          const cursorBoost = cursorDistance < 260 ? (1 - cursorDistance / 260) * 0.28 * pointerStrength : 0;
          const opacity = (1 - distance / 150) * (0.18 + cursorBoost);
          context.strokeStyle = `rgba(125, 201, 255, ${opacity})`;
          context.lineWidth = distance < 72 ? 1.05 : 0.7;
          context.beginPath();
          context.moveTo(first.px, first.py);
          context.lineTo(second.px, second.py);
          context.stroke();
        }
      }

      if (pointerStrength > 0.02 && interactive) {
        const pointer = pointerRef.current;
        for (const point of points) {
          if (point.distanceToPointer > 230) continue;
          const opacity = (1 - point.distanceToPointer / 230) * 0.62 * pointerStrength;
          context.strokeStyle = `rgba(96, 242, 213, ${opacity})`;
          context.lineWidth = 0.7 + opacity * 1.2;
          context.setLineDash([4, 10]);
          context.beginPath();
          context.moveTo(pointer.x, pointer.y);
          context.lineTo(point.px, point.py);
          context.stroke();
        }
        context.setLineDash([]);

        const gradient = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 220);
        gradient.addColorStop(0, `rgba(88, 166, 255, ${0.22 * pointerStrength})`);
        gradient.addColorStop(0.42, `rgba(63, 185, 80, ${0.08 * pointerStrength})`);
        gradient.addColorStop(1, "rgba(88, 166, 255, 0)");
        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);

        context.beginPath();
        context.strokeStyle = `rgba(96, 242, 213, ${0.42 * pointerStrength})`;
        context.lineWidth = 1.2;
        context.arc(pointer.x, pointer.y, 34 + Math.sin(time / 240) * 6, 0, Math.PI * 2);
        context.stroke();
      }

      for (const point of points) {
        context.beginPath();
        context.fillStyle = point.color;
        context.shadowColor = point.color;
        context.shadowBlur = 18;
        context.arc(point.px, point.py, point.radius, 0, Math.PI * 2);
        context.fill();
      }
      context.shadowBlur = 0;
      if (!reducedMotion) animationFrame = requestAnimationFrame(draw);
    };

    resize();
    animationFrame = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", syncPointer, { passive: true });

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", syncPointer);
    };
  }, [density, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={`network-backdrop ${className}`}
      aria-hidden="true"
    />
  );
}

function App() {
  const [state, setState] = useStoredState<GrafyState>(STORAGE_KEY, initialState);
  const [session, setSession] = useStoredState<{ email: string } | null>(SESSION_KEY, null);
  const [view, setView] = useState<ViewKey>("dashboard");
  const [selectedContactId, setSelectedContactId] = useState(state.contacts[0]?.id ?? "");

  const selectedContact = state.contacts.find((contact) => contact.id === selectedContactId) ?? state.contacts[0];

  useEffect(() => {
    setState((current) => hydrateState(current));
  }, [setState]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [session, view]);

  const addContact = (contact: Contact) => {
    setState((current) => ({
      ...current,
      contacts: [contact, ...current.contacts],
      groups: current.groups.map((group) => ({
        ...group,
        contactIds: contact.groupIds.includes(group.id) ? unique([...group.contactIds, contact.id]) : group.contactIds
      }))
    }));
    setSelectedContactId(contact.id);
    setView("contacts");
  };

  const addContacts = (contacts: Contact[]) => {
    if (!contacts.length) return;
    setState((current) => ({
      ...current,
      contacts: [...contacts, ...current.contacts],
      groups: current.groups.map((group) => ({
        ...group,
        contactIds: unique([
          ...group.contactIds,
          ...contacts.filter((contact) => contact.groupIds.includes(group.id)).map((contact) => contact.id)
        ])
      }))
    }));
    setSelectedContactId(contacts[0].id);
    setView("contacts");
  };

  const updateContact = (id: string, patch: Partial<Contact>) => {
    setState((current) => ({
      ...current,
      contacts: current.contacts.map((contact) =>
        contact.id === id ? { ...contact, ...patch, updatedAt: new Date().toISOString() } : contact
      )
    }));
  };

  const deleteContact = (id: string) => {
    setState((current) => ({
      ...current,
      contacts: current.contacts.filter((contact) => contact.id !== id),
      groups: current.groups.map((group) => ({ ...group, contactIds: group.contactIds.filter((contactId) => contactId !== id) }))
    }));
    setSelectedContactId(state.contacts.find((contact) => contact.id !== id)?.id ?? "");
  };

  const approveMerge = (primaryId: string, duplicateId: string) => {
    setState((current) => {
      const primary = current.contacts.find((contact) => contact.id === primaryId);
      const duplicate = current.contacts.find((contact) => contact.id === duplicateId);
      if (!primary || !duplicate) return current;
      const merged = mergeContacts(primary, duplicate);
      return {
        ...current,
        contacts: current.contacts.map((contact) => (contact.id === primaryId ? merged : contact)).filter((contact) => contact.id !== duplicateId),
        groups: current.groups.map((group) => ({
          ...group,
          contactIds: unique(group.contactIds.map((contactId) => (contactId === duplicateId ? primaryId : contactId)))
        }))
      };
    });
    setSelectedContactId(primaryId);
  };

  const addGroup = (name: string, description: string, tags: string[] = [], color = groupColorOptions[0]) => {
    setState((current) => ({
      ...current,
      groups: [
        {
          id: uid("grp"),
          name,
          description,
          role: "admin",
          color,
          members: [session?.email ?? "usuario@grafy.local"],
          contactIds: [],
          tags,
          createdAt: new Date().toISOString()
        },
        ...current.groups
      ]
    }));
  };

  const updateGroup = (id: string, patch: Partial<GrafyState["groups"][number]>) => {
    setState((current) => ({
      ...current,
      groups: current.groups.map((group) => (group.id === id ? { ...group, ...patch } : group))
    }));
  };

  const addContactToGroup = (groupId: string, contactId: string) => {
    if (!contactId) return;
    setState((current) => ({
      ...current,
      groups: current.groups.map((group) =>
        group.id === groupId ? { ...group, contactIds: unique([...group.contactIds, contactId]) } : group
      ),
      contacts: current.contacts.map((contact) =>
        contact.id === contactId ? { ...contact, groupIds: unique([...contact.groupIds, groupId]) } : contact
      )
    }));
  };

  const addCustomField = (field: CustomField) => {
    setState((current) => ({ ...current, customFields: [field, ...current.customFields] }));
  };

  const startSession: AuthLoginHandler = (email, importedContacts = [], targetView = "dashboard") => {
    setSession({ email: email || "usuario@grafy.local" });
    if (importedContacts.length) {
      addContacts(importedContacts);
    }
    setView(targetView);
  };

  if (!session) {
    return <AuthScreen onLogin={startSession} />;
  }

  return (
    <AppShell
      state={state}
      setState={setState}
      view={view}
      setView={setView}
      selectedContact={selectedContact}
      setSelectedContactId={setSelectedContactId}
      addContact={addContact}
      addContacts={addContacts}
      updateContact={updateContact}
      deleteContact={deleteContact}
      approveMerge={approveMerge}
      addGroup={addGroup}
      updateGroup={updateGroup}
      addContactToGroup={addContactToGroup}
      addCustomField={addCustomField}
      onLogout={() => setSession(null)}
      sessionEmail={session.email}
    />
  );
}

interface AppShellProps {
  state: GrafyState;
  setState: React.Dispatch<React.SetStateAction<GrafyState>>;
  view: ViewKey;
  setView: (view: ViewKey) => void;
  selectedContact?: Contact;
  setSelectedContactId: (id: string) => void;
  addContact: (contact: Contact) => void;
  addContacts: (contacts: Contact[]) => void;
  updateContact: (id: string, patch: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  approveMerge: (primaryId: string, duplicateId: string) => void;
  addGroup: (name: string, description: string, tags?: string[], color?: string) => void;
  updateGroup: (id: string, patch: Partial<GrafyState["groups"][number]>) => void;
  addContactToGroup: (groupId: string, contactId: string) => void;
  addCustomField: (field: CustomField) => void;
  onLogout: () => void;
  sessionEmail: string;
}

function AppShell(props: AppShellProps) {
  const { state, view, setView, onLogout } = props;
  const currentLabel = navItems.find((item) => item.key === view)?.label ?? "Grafy";
  const duplicateCount = getMergeSuggestions(state.contacts).length;

  return (
    <div className="app">
      <NetworkBackdrop className="app-live-network" density={48} />
      <aside className="sidebar">
        <button className="brand" onClick={() => setView("dashboard")} aria-label="Ir para o início">
          <span className="brand-mark">
            <Network size={22} />
          </span>
          <span>
            <strong>Grafy</strong>
            <small>Network intelligence</small>
          </span>
        </button>

        <nav className="nav-list" aria-label="Navegação principal">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.key} className={`nav-item ${view === item.key ? "active" : ""}`} onClick={() => setView(item.key)}>
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-card">
          <ShieldCheck size={19} />
          <div>
            <strong>Privacidade ativa</strong>
            <p>{state.contacts.length} contatos privados. {duplicateCount} merge pendente.</p>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <span className="topbar-kicker">Grafy workspace</span>
            <h1>{currentLabel}</h1>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" onClick={() => setView("import")} title="Importar contatos">
              <Upload size={18} />
            </button>
            <button className="icon-button" onClick={() => setView("chat")} title="Abrir chat">
              <Bot size={18} />
            </button>
            <button className="profile-pill" onClick={() => setView("profile")}>
              <span className="avatar small">{initials(state.profile.name)}</span>
              <span>{state.profile.name}</span>
            </button>
            <button className="icon-button" onClick={onLogout} title="Sair">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <section className="workspace">
          {view === "dashboard" && <Dashboard {...props} />}
          {view === "contacts" && <ContactsView {...props} />}
          {view === "import" && <ImportView {...props} />}
          {view === "integrations" && <IntegrationsView {...props} />}
          {view === "graph" && <GraphView {...props} />}
          {view === "groups" && <GroupsView {...props} />}
          {view === "public" && <PublicNetworkView {...props} />}
          {view === "chat" && <ChatView {...props} />}
          {view === "profile" && <ProfileView {...props} />}
          {view === "settings" && <SettingsView {...props} />}
        </section>
      </main>

      <nav className="mobile-tabs" aria-label="Navegação mobile">
        {mobileNavOrder.map((key) => navItems.find((item) => item.key === key)!).map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.key} className={view === item.key ? "active" : ""} onClick={() => setView(item.key)}>
              <Icon size={19} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function AuthScreen({ onLogin }: { onLogin: AuthLoginHandler }) {
  const [email, setEmail] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [accountType, setAccountType] = useState<AccountType>("personal");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");
  const [cepInsight, setCepInsight] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [linkedinConnected, setLinkedinConnected] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [appleConnected, setAppleConnected] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyRole, setCompanyRole] = useState("");
  const [companySegment, setCompanySegment] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [companyCep, setCompanyCep] = useState("");
  const [status, setStatus] = useState("");
  const [providerFallback, setProviderFallback] = useState<ProviderSetupTarget | null>(null);
  const [providerGuideOpen, setProviderGuideOpen] = useState(false);
  const [googleImporting, setGoogleImporting] = useState(false);
  const [appleIdentityImporting, setAppleIdentityImporting] = useState(false);
  const [appleVcardText, setAppleVcardText] = useState("");
  const [appleIcsText, setAppleIcsText] = useState("");
  const [hubImportText, setHubImportText] = useState("");
  const [hubFilePreview, setHubFilePreview] = useState<Partial<Contact>[] | null>(null);
  const [hubFileName, setHubFileName] = useState("");
  const [hubImportSource, setHubImportSource] = useState<Extract<Contact["source"], "CSV" | "JSON" | "Excel">>("CSV");
  const [hubImporting, setHubImporting] = useState(false);
  const [landingMode, setLandingMode] = useState<LandingMode>(() => getLandingModeFromHash());
  const {
    oauthConfig,
    googleClientConfigured,
    appleClientConfigured
  } = useOAuthRuntimeConfig();
  const appleVcardPreview = useMemo(() => parseVcardContacts(appleVcardText), [appleVcardText]);
  const appleCalendarPreview = useMemo(() => parseIcsCalendarContacts(appleIcsText), [appleIcsText]);
  const applePreviewCount = appleVcardPreview.length + appleCalendarPreview.length;
  const hubTextPreview = useMemo(() => {
    try {
      return parseContactImportText(hubImportText);
    } catch {
      return [];
    }
  }, [hubImportText]);
  const hubPreview = hubFilePreview ?? hubTextPreview;
  const landingCopy = {
    personal: {
      navLabel: "Empresários",
      hash: "#/empresarios",
      headlineA: "Seu networking,",
      headlineB: "montado a partir dos seus contatos",
      body:
        "Conecte Google Contacts e Agenda logo no início, ou importe Apple vCard/.ics. O Grafy organiza nomes, telefones, DDDs, empresas, cargos, demandas e oportunidades em uma rede privada.",
      previewTitle: "Mapa privado do empresário",
      previewSubtitle: "Clientes, parceiros, fornecedores, DDDs e demandas",
      proof: ["Google Contacts", "Apple vCard/.ics", "dados privados"],
      cards: [
        { icon: ContactRound, label: "Base pessoal", value: "Contatos, telefones, emails, DDD e histórico de origem" },
        { icon: Network, label: "Grafo privado", value: "Veja cargos, áreas, tags e caminhos de introdução" },
        { icon: Bot, label: "Copiloto", value: "Pergunte quem compra, resolve ou pode indicar" }
      ],
      match: "Patrícia vende marketing B2B. Marcos decide orçamento no varejo.",
      demand: "4 contatos buscam parceiros comerciais em DDDs estratégicos."
    },
    hub: {
      navLabel: "Hubs e eventos",
      hash: "#/hubs-eventos",
      headlineA: "Sua comunidade,",
      headlineB: "pronta para conectar pessoas",
      body:
        "Para hubs, eventos e empresas que querem carregar uma base de participantes, criar grupos compartilhados e mostrar quem deve conversar com quem.",
      previewTitle: "Grafo compartilhado do hub",
      previewSubtitle: "Membros, patrocinadores, palestrantes e grupos",
      proof: ["base compartilhada", "grupos com cores", "permissões"],
      cards: [
        { icon: Users, label: "Base do grupo", value: "Participantes, membros, empresas e campos customizados" },
        { icon: CalendarClock, label: "Eventos", value: "Agenda, origem do encontro, follow-up e relacionamento" },
        { icon: ShieldCheck, label: "Governança", value: "Permissões, opt-in público e dados privados separados" }
      ],
      match: "Camila organiza o hub. Rodrigo cria encontros executivos.",
      demand: "3 grupos demonstram curadoria para eventos e comunidades."
    }
  } satisfies Record<AudienceMode, {
    navLabel: string;
    hash: string;
    headlineA: string;
    headlineB: string;
    body: string;
    previewTitle: string;
    previewSubtitle: string;
    proof: string[];
    cards: Array<{ icon: typeof ContactRound; label: string; value: string }>;
    match: string;
    demand: string;
  }>;
  const isSignupLanding = isSignupLandingMode(landingMode);
  const audienceMode = getAudienceFromLandingMode(landingMode);
  const activeCopy = landingCopy[audienceMode];
  const SpecificLandingPage = audienceMode === "personal" ? PersonalLandingPage : HubLandingPage;
  const passwordChecks = useMemo(() => getPasswordChecks(password, confirmPassword), [password, confirmPassword]);
  const passwordIsValid = passwordChecks.every((item) => item.valid);
  const phoneDdd = extractDdd(phone);
  const phoneInsight = phoneDdd ? formatDddLocation(phoneDdd) : "Digite o telefone para calcular DDD, estado e região.";
  const userCepFallback = cep.length >= 8 ? getCepFallbackLabel(cep) : "";
  const hasIdentitySource = googleConnected || appleConnected || applePreviewCount > 0;
  const hasContactSource = googleConnected || applePreviewCount > 0;
  const companyFieldsReady = Boolean(companyName.trim() && companyRole.trim() && companySegment.trim());
  const signupReady = Boolean(
    fullName.trim().split(/\s+/).length >= 2 &&
    /\S+@\S+\.\S+/.test(email) &&
    phoneDdd &&
    digitsOnly(cep).length === 8 &&
    passwordIsValid &&
    (accountType === "personal" || companyFieldsReady)
  );

  useEffect(() => {
    const handleHashChange = () => setLandingMode(getLandingModeFromHash());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (!providerFallback) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProviderFallback(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [providerFallback]);

  useEffect(() => {
    if (audienceMode === "hub") setAccountType("company");
    else if (landingMode === "signupPersonal") setAccountType("personal");
  }, [audienceMode, landingMode]);

  useEffect(() => {
    const cepDigits = digitsOnly(cep);
    if (cepDigits.length !== 8) {
      setCepInsight("");
      setCepLoading(false);
      return;
    }
    const controller = new AbortController();
    setCepLoading(true);
    fetch(`https://viacep.com.br/ws/${cepDigits}/json/`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("CEP indisponivel"))))
      .then((data: { erro?: boolean; localidade?: string; uf?: string; bairro?: string }) => {
        if (data.erro) {
          setCepInsight(getCepFallbackLabel(cepDigits) || "CEP valido no formato, mas ainda sem cidade confirmada.");
          return;
        }
        setCepInsight(
          [data.localidade, data.uf].filter(Boolean).join("/") +
            (data.bairro ? ` · ${data.bairro}` : "")
        );
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setCepInsight(getCepFallbackLabel(cepDigits) || "CEP pronto para validação quando houver conexão.");
      })
      .finally(() => setCepLoading(false));
    return () => controller.abort();
  }, [cep]);

  const changeLandingMode = (mode: LandingMode) => {
    setLandingMode(mode);
    const nextHash =
      mode === "choice"
        ? "#/"
        : mode === "signupPersonal"
          ? "#/cadastro/empresarios"
          : mode === "signupHub"
            ? "#/cadastro/hubs-eventos"
            : landingCopy[mode].hash;
    window.history.replaceState(null, "", nextHash);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (authMode === "login") {
      if (!/\S+@\S+\.\S+/.test(email) || !password) {
        setStatus("Informe email e senha, ou entre direto por Google/Apple para reconstruir a rede com contatos reais.");
        return;
      }
      setStatus("Login validado no protótipo. Para abrir o Grafy com valor real, conecte Google/Apple ou carregue uma base do hub.");
      return;
    }
    if (!signupReady) {
      setStatus("Revise nome completo, email, telefone, CEP, senha e os dados da empresa quando for conta empresarial.");
      return;
    }
    if (!hasContactSource && audienceMode === "personal") {
      setStatus("Conecte Google com People API/Agenda ou carregue Apple .vcf/.ics. Apple ID sozinho identifica a conta, mas não libera contatos do iCloud no navegador.");
      return;
    }
    if (audienceMode === "hub") {
      handleHubWorkspaceLogin();
      return;
    }
    if (applePreviewCount) {
      handleAppleLogin();
      return;
    }
    if (googleClientConfigured) {
      void handleGoogleLogin();
      return;
    }
    setStatus("Cadastro qualificado. Para entrar como na Epic, ative Google ou Apple no ambiente do Grafy; o usuário final só precisa clicar no provedor.");
  };

  const buildAppleOnboardingContacts = () => [
    ...appleVcardPreview.map((partial) =>
      contactFromImportedPartial(partial, {
        fallbackName: "Contato Apple sem nome",
        fallbackSource: "Apple Contacts",
        notes: "Importado no onboarding via vCard do Apple Contacts/iCloud.",
        extraTags: ["Apple Contacts"],
        customFields: { origemAgenda: "Apple Contacts" }
      })
    ),
    ...appleCalendarPreview.map((partial) =>
      contactFromImportedPartial(partial, {
        fallbackName: "Participante Apple Agenda",
        fallbackSource: "Apple Calendar",
        notes: "Importado no onboarding via arquivo .ics da Apple Agenda/iCloud Calendar.",
        extraTags: ["Apple Calendar", "agenda"],
        groupIds: ["grp_eventos"],
        customFields: { origemAgenda: "Apple Calendar" }
      })
    )
  ];

  const handleTextFile = (
    event: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>,
    label: string
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    readFileAsText(file)
      .then((text) => {
        setter(text);
        setStatus(`${label} carregado. Revise o preview e entre importando os contatos.`);
      })
      .catch((error) => setStatus(error instanceof Error ? error.message : `Falha ao ler ${label}.`));
  };

  const handleLinkedinConnect = () => {
    const value = linkedinUrl.trim();
    if (!value) {
      setStatus("Cole seu LinkedIn para usar como sinal de identidade profissional e enriquecimento do perfil.");
      return;
    }
    if (!/linkedin\.com\/(in|company)\//i.test(value)) {
      setStatus("Use uma URL do LinkedIn no formato linkedin.com/in/seu-perfil ou linkedin.com/company/sua-empresa.");
      return;
    }
    setLinkedinConnected(true);
    setStatus("LinkedIn vinculado como sinal de perfil. Importar conexões do LinkedIn exige permissão oficial da plataforma.");
  };

  const openProviderFallback = (provider: ProviderSetupTarget, showGuide = false) => {
    setProviderGuideOpen(showGuide);
    setProviderFallback(provider);
    setStatus(
      provider === "google"
        ? "Google respondeu ao clique, mas este deploy ainda não recebeu a conexão oficial. Você pode testar o Grafy em modo protótipo agora."
        : "Apple respondeu ao clique, mas este deploy ainda não recebeu a conexão oficial. Você pode testar o Grafy em modo protótipo agora."
    );
  };

  const enterPrototypeMode = (provider: ProviderSetupTarget) => {
    const contacts = buildPrototypeNetworkContacts(provider, audienceMode);
    const sessionEmail =
      email ||
      (provider === "google"
        ? audienceMode === "hub"
          ? "admin-google-demo@grafy.local"
          : "usuario-google-demo@grafy.local"
        : audienceMode === "hub"
          ? "admin-apple-demo@grafy.local"
          : "usuario-apple-demo@grafy.local");
    if (provider === "google") setGoogleConnected(true);
    else setAppleConnected(true);
    setProviderFallback(null);
    onLogin(sessionEmail, contacts, audienceMode === "hub" ? "groups" : "dashboard");
  };

  const handleGoogleLogin = async () => {
    if (!googleClientConfigured) {
      openProviderFallback("google");
      return;
    }
    setGoogleImporting(true);
    setStatus("Abrindo Google...");
    try {
      const googleImport = await requestGoogleProviderNetworkImport(oauthConfig, setStatus);
      setGoogleConnected(true);
      const sessionEmail = googleImport.profile.email || email || "usuario-google@grafy.local";
      if (!googleImport.contacts.length) {
        onLogin(sessionEmail, [], "import");
        return;
      }
      onLogin(sessionEmail, googleImport.contacts, "dashboard");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Não foi possível iniciar OAuth Google.");
      openProviderFallback("google", true);
      setGoogleImporting(false);
    }
  };

  const handleAppleLogin = () => {
    const contacts = buildAppleOnboardingContacts();
    if (!contacts.length) {
      setStatus("Escolha um arquivo .vcf do Apple Contacts ou .ics da Apple Agenda antes de entrar importando.");
      return;
    }
    setAppleConnected(true);
    onLogin(email || "usuario-apple@grafy.local", contacts, "dashboard");
  };

  const handleAppleIdentityLogin = async () => {
    if (!appleClientConfigured) {
      openProviderFallback("apple");
      return;
    }
    setAppleIdentityImporting(true);
    try {
      if (oauthConfig.firebase) {
        const appleProfile = await requestFirebaseAppleIdentity(oauthConfig.firebase);
        if (appleProfile.email) setEmail(appleProfile.email);
        setAppleConnected(true);
        if (authMode === "login") {
          onLogin(appleProfile.email || email || "usuario-apple@grafy.local", [], "import");
          return;
        }
        setStatus("Apple ID vinculado. No web, carregue .vcf/.ics para trazer contatos reais; acesso direto ao iCloud Contacts exige app nativo.");
        return;
      }
      await loadAppleIdentityScript();
      window.AppleID?.auth?.init({
        clientId: oauthConfig.appleServiceId,
        scope: "name email",
        redirectURI: oauthConfig.appleRedirectUri,
        state: "grafy-apple-signin",
        usePopup: true
      });
      const response = await window.AppleID?.auth?.signIn();
      const tokenPayload = decodeJwtPayload(response?.authorization?.id_token);
      const appleEmail = response?.user?.email || (typeof tokenPayload.email === "string" ? tokenPayload.email : "");
      if (appleEmail) setEmail(appleEmail);
      setAppleConnected(true);
      if (authMode === "login") {
        onLogin(appleEmail || email || "usuario-apple@grafy.local", [], "import");
        return;
      }
      setStatus("Apple ID vinculado. No web, carregue .vcf/.ics para trazer contatos reais; acesso direto ao iCloud Contacts exige app nativo.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Não foi possível vincular Apple ID.");
      openProviderFallback("apple", true);
    } finally {
      setAppleIdentityImporting(false);
    }
  };

  const buildHubOnboardingContacts = () =>
    hubPreview.map((partial) =>
      contactFromImportedPartial(partial, {
        fallbackName: "Pessoa da base do hub",
        fallbackSource: (partial.source as Contact["source"] | undefined) ?? hubImportSource,
        notes: "Importado no onboarding do hub/evento/empresa. Base compartilhada validada por arquivo.",
        extraTags: ["hub", "evento", "base compartilhada"],
        groupIds: ["grp_eventos"],
        customFields: {
          fonteHub: hubFileName || (hubImportSource === "JSON" ? "JSON colado" : "CSV colado"),
          tipoBase: hubImportSource
        }
      })
    );

  const handleHubImportTextChange = (value: string) => {
    setHubImportText(value);
    setHubFilePreview(null);
    setHubFileName("");
    setHubImportSource(getTextImportSource("base", value));
  };

  const handleHubFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setHubImporting(true);
    try {
      const parsed = await parseContactsFromFile(file);
      setHubImportSource(parsed.source);
      setHubFileName(file.name);
      setHubFilePreview(parsed.contacts);
      setHubImportText(parsed.text ?? "");
      setStatus(`${file.name} carregado com ${parsed.contacts.length} pessoa(s) reconhecida(s).`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Não foi possível ler a base do hub.");
    } finally {
      setHubImporting(false);
    }
  };

  const handleHubWorkspaceLogin = () => {
    const contacts = buildHubOnboardingContacts();
    if (!contacts.length) {
      setStatus("Carregue um Excel, CSV ou JSON com pessoas do hub/evento antes de criar o workspace.");
      return;
    }
    onLogin(email || "hub@grafy.local", contacts, "groups");
  };

  const providerFallbackLabel = providerFallback === "apple" ? "Apple" : "Google";
  const providerFallbackCopy =
    providerFallback === "apple"
      ? {
          title: "Apple ID está pronto para entrar no fluxo",
          body:
            "Nesta publicação o provedor Apple ainda não foi conectado ao projeto. No produto final, o usuário clica aqui, escolhe a conta Apple e o Grafy usa a identidade autorizada sem pedir configuração técnica.",
          permission: "Identidade Apple e email autorizado. Contatos Apple no web entram por vCard/.ics; acesso direto ao iCloud Contacts pede app nativo."
        }
      : {
          title: "Google respondeu ao clique",
          body:
            "O app já tem o fluxo de Google preparado. Esta publicação só precisa receber a configuração oficial do Firebase ou Google OAuth para abrir o popup real como Epic, Google e outros apps fazem.",
          permission: GOOGLE_IMPORT_CALENDAR ? "Conta Google, perfil, Google Contacts e Agenda autorizados pelo usuário." : "Conta Google, perfil e Google Contacts autorizados pelo usuário."
        };

  return (
    <div className={`auth-page auth-page-${landingMode}`}>
      <NetworkBackdrop className="auth-live-network" density={landingMode === "choice" ? 82 : 62} />
      <header className="auth-topbar">
        <button className="brand horizontal" aria-label="Grafy" onClick={() => changeLandingMode("choice")}>
          <span className="brand-mark">
            <Network size={22} />
          </span>
          <span>
            <strong>Grafy</strong>
            <small>Network intelligence CRM</small>
          </span>
        </button>
        <div className="auth-topbar-actions">
          <span>Privado por padrão</span>
          <span>Google Contacts + Apple vCard</span>
          <span>PWA mobile-first</span>
        </div>
      </header>

      {landingMode === "choice" ? (
        <LandingChoicePage onChoose={changeLandingMode} />
      ) : (
        <>
          <motion.section
            className={`auth-hero audience-hero audience-hero-${audienceMode} ${isSignupLanding ? "signup-landing-hero" : ""}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="auth-copy audience-copy">
              <h1>
                <span>{isSignupLanding ? (audienceMode === "personal" ? "Crie sua conta" : "Cadastre seu hub") : activeCopy.headlineA}</span>
                <span className="gradient-text">
                  {isSignupLanding
                    ? audienceMode === "personal"
                      ? "conectando contatos reais"
                      : "com uma base real"
                    : activeCopy.headlineB}
                </span>
              </h1>
              <p>
                {isSignupLanding
                  ? audienceMode === "personal"
                    ? "Escolha Google ou Apple para criar a conta. O Google solicita permissão para importar contatos; a Agenda pode ser ativada como etapa opcional. No Apple web, vincule o Apple ID e carregue seus contatos exportados para o Grafy montar a rede."
                    : "Crie a conta do hub, qualifique os dados da organização e carregue a base de participantes em Excel, CSV ou JSON para abrir o workspace com relações reais."
                  : activeCopy.body}
              </p>
              <div className="auth-proof">
                <span><Lock size={15} /> {activeCopy.proof[0]}</span>
                <span><Network size={15} /> {activeCopy.proof[1]}</span>
                <span><Sparkles size={15} /> {activeCopy.proof[2]}</span>
              </div>
              {isSignupLanding && (
                <div className="signup-path-panel">
                  {[
                    ["1", "Criar conta", audienceMode === "personal" ? "Google ou Apple" : "Admin do hub"],
                    ["2", "Conectar contatos", audienceMode === "personal" ? "Google Contacts ou Apple vCard" : "Excel, CSV ou JSON"],
                    ["3", "Abrir Grafy", "Grafo, filtros e oportunidades"]
                  ].map(([step, title, body]) => (
                    <span key={step}>
                      <i>{step}</i>
                      <strong>{title}</strong>
                      <small>{body}</small>
                    </span>
                  ))}
                </div>
              )}
              <div className="auth-value-grid">
                {activeCopy.cards.map((card) => (
                  <Info key={card.label} icon={card.icon} label={card.label} value={card.value} />
                ))}
              </div>
            </div>

            <div className="auth-product-column audience-product-column">
              <motion.div
                className="product-preview"
                initial={{ opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
              >
                <div className="preview-header">
                  <span className="status-dot live" />
                  <div>
                    <strong>{activeCopy.previewTitle}</strong>
                    <small>{activeCopy.previewSubtitle}</small>
                  </div>
                </div>
                <div className="preview-network">
                  <NetworkBackdrop density={28} interactive={false} />
                  <div className="preview-node main">LR</div>
                  <div className="preview-node n1">CTO</div>
                  <div className="preview-node n2">MKT</div>
                  <div className="preview-node n3">PME</div>
                  <div className="preview-node n4">IA</div>
                </div>
                <div className="preview-insights">
                  <div>
                    <span>Match sugerido</span>
                    <strong>{activeCopy.match}</strong>
                  </div>
                  <div>
                    <span>Demanda recente</span>
                    <strong>{activeCopy.demand}</strong>
                  </div>
                </div>
              </motion.div>

              {isSignupLanding && (
              <form className={`auth-card auth-ingestion-card signup-card signup-card-${authMode}`} onSubmit={submit}>
                <div className="auth-card-head signup-head">
                  <div>
                    <h2>{audienceMode === "personal" ? "Cadastro com agenda obrigatória" : "Cadastro do hub com base real"}</h2>
                    <p>
                      {audienceMode === "personal"
                        ? "O Grafy precisa nascer do Google Contacts ou do Apple Contacts exportado para mapear oportunidades de verdade."
                        : "Hubs e eventos entram com dados qualificados da organização e uma base de participantes em Excel, CSV ou JSON."}
                    </p>
                  </div>
                  <div className="auth-mode-toggle" aria-label="Modo de acesso">
                    <button type="button" className={authMode === "signup" ? "active" : ""} onClick={() => setAuthMode("signup")}>
                      Criar cadastro
                    </button>
                    <button type="button" className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>
                      Entrar
                    </button>
                  </div>
                </div>

                {authMode === "signup" ? (
                  <>
                    <div className="simple-auth-panel">
                      <div className="simple-auth-head">
                        <Fingerprint size={20} />
                        <div>
                          <strong>Entre ou crie sua conta</strong>
                          <small>
                            {audienceMode === "personal"
                              ? "Escolha Google ou Apple. O Grafy usa os dados autorizados para montar seu network sem pedir configuração técnica."
                              : "Escolha uma conta para identificar o admin. Depois carregue a base real do hub, evento ou empresa."}
                          </small>
                        </div>
                      </div>
                      <div className="auth-provider-grid" aria-label="Maneiras de criar conta">
                        <button className={`provider-option google ${googleConnected ? "connected" : ""}`} type="button" onClick={handleGoogleLogin} disabled={googleImporting}>
                          <span className="provider-logo google">G</span>
                          <strong>{googleImporting ? "Abrindo Google..." : "Continuar com Google"}</strong>
                          <small>Conta e contatos autorizados</small>
                        </button>
                        <button className={`provider-option apple ${appleConnected || applePreviewCount ? "connected" : ""}`} type="button" onClick={handleAppleIdentityLogin} disabled={appleIdentityImporting}>
                          <span className="provider-logo apple"><UserRound size={18} /></span>
                          <strong>{appleIdentityImporting ? "Abrindo Apple..." : "Continuar com Apple"}</strong>
                          <small>Apple ID; contatos por vCard/.ics</small>
                        </button>
                        <button className={`provider-option linkedin ${linkedinConnected ? "connected" : ""}`} type="button" onClick={handleLinkedinConnect}>
                          <span className="provider-logo linkedin">in</span>
                          <strong>Vincular LinkedIn</strong>
                          <small>Perfil profissional</small>
                        </button>
                      </div>
                      <p className="provider-helper">
                        O usuário só clica no provedor. A conexão do app fica preparada pelo time do Grafy, fora da tela de login.
                      </p>
                    </div>

                    <div className="account-type-toggle">
                      <button type="button" className={accountType === "personal" ? "active" : ""} onClick={() => setAccountType("personal")}>
                        <ContactRound size={17} />
                        Pessoal
                      </button>
                      <button type="button" className={accountType === "company" ? "active" : ""} onClick={() => setAccountType("company")}>
                        <BriefcaseBusiness size={17} />
                        Empresa
                      </button>
                    </div>

                    <div className="signup-form-grid">
                      <label className="smart-field">
                        Nome completo
                        <input
                          value={fullName}
                          onChange={(event) => setFullName(event.target.value.toLocaleUpperCase("pt-BR"))}
                          placeholder="LENIN MARINHO"
                          autoComplete="name"
                        />
                        <small className="field-insight"><BadgeCheck size={13} /> O nome fica padronizado em maiúsculas.</small>
                      </label>
                      <label className="smart-field">
                        Email principal
                        <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="voce@empresa.com" autoComplete="email" />
                        <small className="field-insight"><Mail size={13} /> Usado para login, convites e deduplicação.</small>
                      </label>
                      <label className="smart-field">
                        Telefone com DDD
                        <input value={phone} onChange={(event) => setPhone(formatBrazilPhone(event.target.value))} inputMode="tel" placeholder="(11) 99999-9999" autoComplete="tel" />
                        <small className="field-insight"><Phone size={13} /> {phoneInsight}</small>
                      </label>
                      <label className="smart-field">
                        CEP principal
                        <input value={cep} onChange={(event) => setCep(formatCep(event.target.value))} inputMode="numeric" placeholder="01310-100" autoComplete="postal-code" />
                        <small className="field-insight"><MapPin size={13} /> {cepLoading ? "Consultando CEP..." : cepInsight || userCepFallback || "Ajuda o Grafy a cruzar oportunidades por região."}</small>
                      </label>
                      <label className="smart-field">
                        Senha
                        <span className="password-control">
                          <input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
                          <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar senha" : "Ver senha"}>
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </span>
                      </label>
                      <label className="smart-field">
                        Repetir senha
                        <span className="password-control">
                          <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type={showConfirmPassword ? "text" : "password"} placeholder="Repita a senha" autoComplete="new-password" />
                          <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} aria-label={showConfirmPassword ? "Ocultar confirmacao" : "Ver confirmacao"}>
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </span>
                      </label>
                    </div>

                    <div className="password-checklist">
                      {passwordChecks.map((check) => (
                        <span key={check.label} className={check.valid ? "valid" : ""}>
                          {check.valid ? <Check size={13} /> : <X size={13} />}
                          {check.label}
                        </span>
                      ))}
                    </div>

                    <label className="smart-field full-span-field">
                      LinkedIn ou página profissional
                      <span className="linkedin-control">
                        <input value={linkedinUrl} onChange={(event) => setLinkedinUrl(event.target.value)} placeholder="https://www.linkedin.com/in/seu-perfil" />
                        <button className="secondary-button compact" type="button" onClick={handleLinkedinConnect}>
                          <Link2 size={15} />
                          Vincular
                        </button>
                      </span>
                    </label>

                    {accountType === "company" && (
                      <div className="company-data-panel">
                        <div className="company-data-head">
                          <Building2 size={18} />
                          <span>
                            <strong>Dados para qualificar oportunidades B2B</strong>
                            <small>Esses campos ajudam a separar cargo, segmento, porte e localização no grafo.</small>
                          </span>
                        </div>
                        <div className="signup-form-grid">
                          <label>
                            Empresa ou hub
                            <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="Cogmo" autoComplete="organization" />
                          </label>
                          <label>
                            Cargo atual
                            <input value={companyRole} onChange={(event) => setCompanyRole(event.target.value)} placeholder="Diretor comercial" autoComplete="organization-title" />
                          </label>
                          <label>
                            Segmento
                            <select value={companySegment} onChange={(event) => setCompanySegment(event.target.value)}>
                              <option value="">Selecione</option>
                              <option value="Tecnologia">Tecnologia</option>
                              <option value="Serviços B2B">Serviços B2B</option>
                              <option value="Indústria">Indústria</option>
                              <option value="Educação">Educação</option>
                              <option value="Eventos e comunidades">Eventos e comunidades</option>
                              <option value="Varejo">Varejo</option>
                            </select>
                          </label>
                          <label>
                            Porte
                            <select value={companySize} onChange={(event) => setCompanySize(event.target.value)}>
                              <option value="">Não informado</option>
                              <option value="1-10">1 a 10 pessoas</option>
                              <option value="11-50">11 a 50 pessoas</option>
                              <option value="51-200">51 a 200 pessoas</option>
                              <option value="201+">201+ pessoas</option>
                            </select>
                          </label>
                          <label>
                            CNPJ
                            <input value={cnpj} onChange={(event) => setCnpj(formatCnpj(event.target.value))} inputMode="numeric" placeholder="00.000.000/0000-00" />
                          </label>
                          <label>
                            CEP da sede
                            <input value={companyCep} onChange={(event) => setCompanyCep(formatCep(event.target.value))} inputMode="numeric" placeholder="00000-000" />
                          </label>
                        </div>
                      </div>
                    )}

                    {audienceMode === "personal" ? (
                      <>
                        <div className="apple-onboarding">
                          <div className="onboarding-source-card">
                            <strong>Apple Contacts</strong>
                            <small>Carregue o .vcf exportado do iCloud/Contatos.</small>
                            <input
                              className="file-input"
                              type="file"
                              accept=".vcf,text/vcard,text/x-vcard"
                              onChange={(event) => handleTextFile(event, setAppleVcardText, "vCard Apple")}
                            />
                          </div>
                          <div className="onboarding-source-card">
                            <strong>Apple Agenda</strong>
                            <small>Carregue .ics para transformar participantes em contexto.</small>
                            <input
                              className="file-input"
                              type="file"
                              accept=".ics,text/calendar"
                              onChange={(event) => handleTextFile(event, setAppleIcsText, "Agenda Apple")}
                            />
                          </div>
                        </div>
                        <div className="onboarding-preview-row">
                          <span>{applePreviewCount ? `${applePreviewCount} contato(s) Apple prontos` : "Apple no web: identidade por Apple ID; contatos por .vcf/.ics"}</span>
                          <button className="primary-button compact" type="button" onClick={handleAppleLogin} disabled={!applePreviewCount}>
                            <Upload size={16} />
                            Entrar importando Apple
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="hub-ingestion-panel">
                        <label className="hub-file-drop">
                          <Database size={20} />
                          <span>
                            <strong>Excel, CSV ou JSON da base</strong>
                            <small>Use colunas como nome, email, telefone, empresa, cargo, area, tags, demanda, resolve e LinkedIn.</small>
                          </span>
                          <input type="file" accept=".xlsx,.xls,.csv,.json,text/csv,application/json" onChange={handleHubFile} />
                        </label>
                        <label>
                          Colar CSV ou JSON
                          <textarea
                            className="csv-box compact-ingestion-box"
                            value={hubImportText}
                            onChange={(event) => handleHubImportTextChange(event.target.value)}
                            placeholder="nome,email,telefone,empresa,cargo,area,tags,demanda,resolve,linkedin"
                          />
                        </label>
                        <div className="data-preview-summary">
                          <span>{hubFileName || `${hubImportSource} colado`}</span>
                          <strong>{hubPreview.length} pessoa(s) reconhecida(s)</strong>
                          <small>{hubPreview.slice(0, 3).map((contact) => contact.name).filter(Boolean).join(" · ") || "Carregue uma base para ver o preview."}</small>
                        </div>
                      </div>
                    )}

                    <button className="primary-button signup-submit glow-button" type="submit">
                      {audienceMode === "personal" ? <ContactRound size={18} /> : <Users size={18} />}
                      {audienceMode === "personal" ? "Validar cadastro e importar rede" : `Criar hub com ${hubPreview.length || "base real"}`}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="simple-auth-panel">
                      <div className="simple-auth-head">
                        <KeyRound size={20} />
                        <div>
                          <strong>Outras maneiras de entrar</strong>
                          <small>Clique no provedor e autorize o Grafy. Sem passos técnicos para o usuário.</small>
                        </div>
                      </div>
                      <div className="auth-provider-grid two-options" aria-label="Maneiras de entrar">
                        <button className="provider-option google" type="button" onClick={handleGoogleLogin} disabled={googleImporting}>
                          <span className="provider-logo google">G</span>
                          <strong>{googleImporting ? "Abrindo Google..." : "Entrar com Google"}</strong>
                          <small>Reconstruir contatos</small>
                        </button>
                        <button className="provider-option apple" type="button" onClick={handleAppleIdentityLogin} disabled={appleIdentityImporting}>
                          <span className="provider-logo apple"><UserRound size={18} /></span>
                          <strong>{appleIdentityImporting ? "Abrindo Apple..." : "Entrar com Apple"}</strong>
                          <small>Identidade Apple</small>
                        </button>
                      </div>
                    </div>
                    <div className="signup-form-grid">
                      <label>
                        Email
                        <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="voce@empresa.com" autoComplete="email" />
                      </label>
                      <label>
                        Senha
                        <span className="password-control">
                          <input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} placeholder="Sua senha" autoComplete="current-password" />
                          <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar senha" : "Ver senha"}>
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </span>
                      </label>
                    </div>
                    <button className="secondary-button signup-submit" type="submit">
                      <KeyRound size={18} />
                      Validar login
                    </button>
                  </>
                )}

                <p className="prototype-note">
                  Dados ficam neste navegador. Google usa OAuth/People API quando configurado; Apple no PWA usa Sign in with Apple para identidade e .vcf/.ics para contatos.
                </p>
                <button className="secondary-button signup-back-button" type="button" onClick={() => changeLandingMode(audienceMode)}>
                  <ChevronRight size={17} />
                  Voltar para a trilha escolhida
                </button>
                {status && <p className="auth-status">{status}</p>}
              </form>
              )}
            </div>
          </motion.section>

          {!isSignupLanding && <SpecificLandingPage
            onModeChange={changeLandingMode}
            onLogin={() => changeLandingMode(audienceMode === "personal" ? "signupPersonal" : "signupHub")}
          />}
        </>
      )}
      {providerFallback && (
        <div
          className="provider-fallback-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="provider-fallback-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setProviderFallback(null);
          }}
        >
          <motion.div
            className="provider-fallback-dialog"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <button className="provider-fallback-close" type="button" onClick={() => setProviderFallback(null)} aria-label="Fechar">
              <X size={18} />
            </button>
            <div className="provider-fallback-icon">
              {providerFallback === "google" ? <span className="provider-logo google">G</span> : <span className="provider-logo apple"><UserRound size={18} /></span>}
            </div>
            <div className="provider-fallback-copy">
              <span className="provider-fallback-eyebrow">{providerFallbackLabel}</span>
              <h2 id="provider-fallback-title">{providerFallbackCopy.title}</h2>
              <p>{providerFallbackCopy.body}</p>
            </div>
            <div className="provider-fallback-permission">
              <ShieldCheck size={18} />
              <span>{providerFallbackCopy.permission}</span>
            </div>
            <div className="provider-fallback-actions">
              <button className="primary-button glow-button" type="button" onClick={() => enterPrototypeMode(providerFallback)}>
                <Sparkles size={18} />
                Entrar em modo protótipo
              </button>
              <button className="secondary-button" type="button" onClick={() => setProviderGuideOpen((value) => !value)}>
                <Settings size={18} />
                {providerGuideOpen ? "Ocultar ativação" : "Ver como ativar login real"}
              </button>
            </div>
            {providerGuideOpen && (
              <div className="provider-activation-guide">
                <strong>Para o popup real funcionar nesta hospedagem</strong>
                <ol>
                  <li>Ativar Firebase Authentication e habilitar o provedor {providerFallbackLabel}.</li>
                  <li>Autorizar o domínio desta publicação e qualquer novo domínio de teste.</li>
                  <li>Salvar as chaves do app como segredos do build e publicar novamente.</li>
                  <li>No Google, habilitar People API para contatos; Calendar API só se a Agenda opcional estiver ativada.</li>
                </ol>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}

function LandingChoicePage({ onChoose }: { onChoose: (mode: LandingMode) => void }) {
  const [hoveredChoice, setHoveredChoice] = useState<AudienceMode | null>(null);
  const choices = [
    {
      mode: "personal" as const,
      icon: ContactRound,
      label: "Empresário",
      title: "Organizar minha rede privada",
      body: "Para puxar contatos próprios, descobrir clientes potenciais, fornecedores, parceiros e decisores.",
      points: ["Google Contacts", "Apple vCard/.ics", "Grafo privado"]
    },
    {
      mode: "hub" as const,
      icon: Users,
      label: "Hub, evento ou empresa",
      title: "Conectar uma comunidade",
      body: "Para administrar participantes, membros ou bases compartilhadas e gerar encontros úteis.",
      points: ["Base compartilhada", "Grupos", "Curadoria"]
    }
  ];

  return (
    <motion.section
      className="choice-landing"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      <div className="choice-copy">
        <span className="context private">primeiro passo</span>
        <h1>
          Qual é o seu <span className="gradient-text">tipo de negócio?</span>
        </h1>
        <p>
          O Grafy muda a experiência de acordo com o uso: rede privada para empresários ou base compartilhada para hubs,
          eventos e empresas.
        </p>
      </div>

      <div className={`choice-card-grid ${hoveredChoice ? "has-hover" : ""}`} aria-label="Escolha seu tipo de negócio">
        {choices.map((choice) => {
          const Icon = choice.icon;
          const isActive = hoveredChoice === choice.mode;
          const isMuted = Boolean(hoveredChoice && !isActive);
          return (
            <motion.button
              key={choice.mode}
              className={`choice-card choice-card-${choice.mode} spotlight-card ${isActive ? "choice-card-active" : ""} ${isMuted ? "choice-card-muted" : ""}`}
              onClick={() => onChoose(choice.mode)}
              onMouseEnter={() => setHoveredChoice(choice.mode)}
              onMouseLeave={() => setHoveredChoice(null)}
              onFocus={() => setHoveredChoice(choice.mode)}
              onBlur={() => setHoveredChoice(null)}
              animate={
                hoveredChoice
                  ? { y: isActive ? -14 : 8, scale: isActive ? 1.045 : 0.965, opacity: isMuted ? 0.74 : 1 }
                  : { y: 0, scale: 1, opacity: 1 }
              }
              transition={{ duration: hoveredChoice ? 0.28 : 0.35, ease: "easeOut" }}
            >
              <span className="choice-card-neural" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className="choice-icon"><Icon size={25} /></span>
              <small>{choice.label}</small>
              <strong>{choice.title}</strong>
              <p>{choice.body}</p>
              <div className="connector-data-list">
                {choice.points.map((point) => <i key={point}>{point}</i>)}
              </div>
              <em>Escolher caminho</em>
            </motion.button>
          );
        })}
      </div>
    </motion.section>
  );
}

function PersonalLandingPage({ onLogin, onModeChange }: { onLogin: () => void; onModeChange: (mode: LandingMode) => void }) {
  return (
    <AudienceDetailLanding
      mode="personal"
      eyebrow="Landing para empresários"
      title="Do contato salvo à oportunidade acionável."
      body="O foco é organizar a base pessoal do empresário e revelar quem pode comprar, indicar, fornecer, resolver ou abrir portas."
      steps={[
        ["1", "Conectar fontes", "Google Contacts, Google Agenda, Apple vCard/.ics e CSV entram logo no começo."],
        ["2", "Qualificar pessoas", "Telefone, DDD, empresa, cargo, área, demanda, problema resolvido e origem ficam visíveis."],
        ["3", "Filtrar intenção", "Cruze diretor + finanças, marketing + B2B, DDD + fornecedor e outras combinações."],
        ["4", "Agir", "Chat e grafo indicam por que a pessoa apareceu e qual abordagem faz mais sentido."]
      ]}
      outcomes={[
        "Encontrar clientes potenciais dentro da própria agenda.",
        "Separar fornecedores, parceiros e decisores por contexto.",
        "Planejar introduções sem depender só da memória.",
        "Manter a rede privada enquanto decide o que torna público."
      ]}
      onLogin={onLogin}
      onModeChange={onModeChange}
    />
  );
}

function HubLandingPage({ onLogin, onModeChange }: { onLogin: () => void; onModeChange: (mode: LandingMode) => void }) {
  return (
    <AudienceDetailLanding
      mode="hub"
      eyebrow="Landing para hubs, eventos e empresas"
      title="Uma base compartilhada para fazer pessoas certas se encontrarem."
      body="O foco é dar governança para comunidades, eventos e empresas que precisam carregar participantes, criar grupos e sugerir conexões úteis."
      steps={[
        ["1", "Carregar participantes", "CSV, lista de inscritos, agenda do evento, Meetup futuro ou OpenAPI alimentam a base do grupo."],
        ["2", "Organizar grupos", "Trilhas, mesas, empresas, patrocinadores e comunidades ganham cores, tags e permissões."],
        ["3", "Curar encontros", "Matches por área, cargo, demanda, solução, DDD, empresa, interesse e trilha."],
        ["4", "Medir follow-up", "Grafo do grupo, Rede pública opcional e chat ajudam antes, durante e depois do evento."]
      ]}
      outcomes={[
        "Ajudar membros a descobrir com quem conversar.",
        "Separar dados privados, públicos e compartilhados.",
        "Criar experiências de networking para eventos e comunidades.",
        "Transformar uma lista de inscritos em um mapa vivo de relações."
      ]}
      onLogin={onLogin}
      onModeChange={onModeChange}
    />
  );
}

function AudienceDetailLanding({
  mode,
  eyebrow,
  title,
  body,
  steps,
  outcomes,
  onLogin,
  onModeChange
}: {
  mode: AudienceMode;
  eyebrow: string;
  title: string;
  body: string;
  steps: string[][];
  outcomes: string[];
  onLogin: () => void;
  onModeChange: (mode: LandingMode) => void;
}) {
  const otherMode = mode === "personal" ? "hub" : "personal";
  const otherLabel = mode === "personal" ? "Ver landing para hubs" : "Ver landing para empresários";

  return (
    <div className={`audience-detail-flow audience-detail-${mode}`}>
      <section className="audience-section-head">
        <span className={mode === "personal" ? "context public" : "context group"}>{eyebrow}</span>
        <h2>{title}</h2>
        <p>{body}</p>
      </section>

      <section className="audience-process-grid" aria-label="Fluxo principal da landing">
        {steps.map(([step, stepTitle, stepBody]) => (
          <article className="spotlight-card" key={stepTitle}>
            <span>{step}</span>
            <strong>{stepTitle}</strong>
            <p>{stepBody}</p>
          </article>
        ))}
      </section>

      <section className="audience-outcome-band">
        <div>
          <span className="context private">o que precisa ficar claro</span>
          <h2>{mode === "personal" ? "A agenda vira estratégia de relacionamento." : "A comunidade ganha curadoria e governança."}</h2>
        </div>
        <div className="audience-outcome-list">
          {outcomes.map((outcome) => (
            <article key={outcome}>
              <Check size={17} />
              <span>{outcome}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="audience-cta-band">
        <div>
          <h2>{mode === "personal" ? "Criar conta e conectar minha agenda." : "Criar conta do hub com base real."}</h2>
          <p>{mode === "personal" ? "A próxima tela é só de cadastro: Google ou Apple primeiro, contatos reais logo em seguida." : "A próxima tela é só de cadastro: dados da organização e base de participantes antes do workspace."}</p>
        </div>
        <div className="audience-actions centered">
          <button className="primary-button glow-button" onClick={onLogin}>
            {mode === "personal" ? <ContactRound size={18} /> : <Users size={18} />}
            {mode === "personal" ? "Ir para cadastro pessoal" : "Ir para cadastro do hub"}
          </button>
          <button className="secondary-button" onClick={() => onModeChange(otherMode)}>
            <ChevronRight size={18} />
            {otherLabel}
          </button>
          <button className="secondary-button" onClick={() => onModeChange("choice")}>
            <CircleDot size={18} />
            Voltar à escolha
          </button>
        </div>
      </section>
    </div>
  );
}

function Dashboard({ state, setView, setSelectedContactId }: AppShellProps) {
  const tags = getAllTags(state.contacts);
  const duplicates = getMergeSuggestions(state.contacts);
  const matches = buildOpportunityMatches(state.contacts);
  const publicCount = state.contacts.filter((contact) => contact.isPublic).length;
  const googleContactsCount = state.contacts.filter((contact) => contact.source === "Google Contacts").length;
  const calendarContactsCount = state.contacts.filter((contact) => contact.source === "Google Calendar").length;
  const appleSignalsCount = state.contacts.filter((contact) => contact.source === "Apple Contacts" || contact.source === "Apple Calendar").length;
  const upcoming = state.contacts
    .filter((contact) => contact.nextFollowUpAt)
    .sort((a, b) => String(a.nextFollowUpAt).localeCompare(String(b.nextFollowUpAt)))
    .slice(0, 4);

  return (
    <motion.div className="screen dashboard-screen" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <div className="hero-panel command-center">
        <div>
          <span className="context public">rede privada + grupos + descoberta</span>
          <h2>Inteligência da sua rede</h2>
          <p>
            O Grafy cruza contatos, tags, DDDs, grupos, demandas e problemas resolvidos para revelar introduções e
            oportunidades acionáveis.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => setView("graph")}>
              <Network size={18} />
              Explorar grafo
            </button>
            <button className="secondary-button" onClick={() => setView("import")}>
              <Upload size={18} />
              Importar contatos
            </button>
          </div>
        </div>
        <div className="mini-map">
          <NetworkBackdrop density={28} interactive={false} />
          <span className="pulse-node a" />
          <span className="pulse-node b" />
          <span className="pulse-node c" />
          <span className="pulse-node d" />
          <svg viewBox="0 0 260 180">
            <path d="M46 121L97 52L164 83L214 43M97 52L143 143L205 128L214 43M46 121L143 143" />
          </svg>
        </div>
      </div>

      <div className="onboarding-strip">
        {[
          ["1", "Perfil", state.profile.visibility === "platform" ? "visível na rede" : "privado por padrão"],
          ["2", "Importação", `${googleContactsCount + calendarContactsCount + appleSignalsCount} sinais Google/Apple`],
          ["3", "Dedupe", `${duplicates.length} sugestão`],
          ["4", "Primeiros insights", `${matches.length} matches`]
        ].map(([step, title, body]) => (
          <button key={step} onClick={() => setView(step === "2" ? "import" : step === "4" ? "chat" : "profile")}>
            <span>{step}</span>
            <strong>{title}</strong>
            <small>{body}</small>
          </button>
        ))}
      </div>

      <section className="customer-mode-panel">
        <article>
          <span className="context public">empresário</span>
          <h3>Organizar e monetizar a própria rede</h3>
          <p>Ideal para quem quer cruzar Google Contacts, agenda, DDD, tags, cargos e demandas para achar clientes, fornecedores e parceiros.</p>
          <button className="secondary-button compact" onClick={() => setView("import")}>
            <Globe2 size={15} />
            Conectar fontes pessoais
          </button>
        </article>
        <article>
          <span className="context group">hub / evento / empresa</span>
          <h3>Conectar pessoas dentro de uma base compartilhada</h3>
          <p>Ideal para comunidades, eventos e empresas que querem importar membros, criar grupos e sugerir introduções com governança.</p>
          <button className="secondary-button compact" onClick={() => setView("groups")}>
            <Users size={15} />
            Montar grupo compartilhado
          </button>
        </article>
      </section>

      <div className="metric-grid">
        <Metric icon={ContactRound} label="Contatos" value={state.contacts.length} tone="cyan" />
        <Metric icon={Tags} label="Tags ativas" value={tags.length} tone="green" />
        <Metric icon={Globe2} label="Perfis públicos" value={publicCount} tone="amber" />
        <Metric icon={ShieldCheck} label="Duplicados" value={duplicates.length} tone="coral" />
      </div>

      <div className="dashboard-grid">
        <Panel title="Oportunidades de complementaridade" action="Ver chat" onAction={() => setView("chat")}>
          <div className="match-list">
            {matches.slice(0, 4).map((match) => (
              <button
                key={`${match.seeker.id}-${match.solver.id}`}
                className="match-row"
                onClick={() => {
                  setSelectedContactId(match.seeker.id);
                  setView("contacts");
                }}
              >
                <div>
                  <strong>{match.seeker.name}</strong>
                  <span>pode se conectar com {match.solver.name}</span>
                </div>
                <small>{match.score} pts</small>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Follow-ups próximos" action="Contatos" onAction={() => setView("contacts")}>
          <div className="timeline-list">
            {upcoming.map((contact) => (
              <button
                key={contact.id}
                className="timeline-row"
                onClick={() => {
                  setSelectedContactId(contact.id);
                  setView("contacts");
                }}
              >
                <span className="avatar small">{initials(contact.name)}</span>
                <div>
                  <strong>{contact.name}</strong>
                  <span>{formatDate(contact.nextFollowUpAt)}</span>
                </div>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Tags mais úteis" action="Grafo" onAction={() => setView("graph")}>
          <div className="tag-cloud">
            {tags.slice(0, 18).map((tag) => (
              <span key={tag} className={`tag-chip ${tagToneClass(tag)}`}>{tag}</span>
            ))}
          </div>
        </Panel>

        <Panel title="Grupos ativos" action="Abrir" onAction={() => setView("groups")}>
          <div className="group-stack">
            {state.groups.map((group) => (
              <div key={group.id} className="group-mini">
                <Users size={17} />
                <div>
                  <strong>{group.name}</strong>
                  <span>{group.contactIds.length} contatos compartilhados</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </motion.div>
  );
}

function ContactsView({ state, selectedContact, setSelectedContactId, addContact, updateContact, deleteContact, approveMerge }: AppShellProps) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const suggestions = getMergeSuggestions(state.contacts);
  const tags = getAllTags(state.contacts);
  const contacts = useMemo(() => {
    const searched = query ? searchContacts(state.contacts, query) : state.contacts;
    return tag ? searched.filter((contact) => contact.tags.includes(tag)) : searched;
  }, [query, state.contacts, tag]);

  return (
    <div className="screen split-screen">
      <section className="list-panel">
        <div className="section-toolbar">
          <div className="search-box">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome, tag, demanda, DDD..." />
          </div>
          <button className="primary-button compact" onClick={() => setShowCreate(true)}>
            <Plus size={17} />
            Novo
          </button>
        </div>

        <div className="filter-strip">
          <button className={!tag ? "filter-chip active" : "filter-chip"} onClick={() => setTag("")}>
            Todos
          </button>
          {tags.slice(0, 10).map((item) => (
            <button key={item} className={`${tag === item ? "filter-chip active" : "filter-chip"} ${tagToneClass(item)}`} onClick={() => setTag(item)}>
              {item}
            </button>
          ))}
        </div>

        {suggestions.length > 0 && (
          <div className="alert-card">
            <ShieldCheck size={18} />
            <div>
              <strong>{suggestions.length} possível duplicado</strong>
              <p>Revise antes de mesclar. O Grafy nunca faz merge automático.</p>
            </div>
          </div>
        )}

        <div className="contact-list">
          {contacts.map((contact) => (
            <button
              key={contact.id}
              className={`contact-row ${selectedContact?.id === contact.id ? "active" : ""}`}
              onClick={() => setSelectedContactId(contact.id)}
            >
              <span className="avatar">{initials(contact.name)}</span>
              <span className="contact-row-main">
                <strong>{contact.name}</strong>
                <small>{contact.headline || contact.description}</small>
                <span className="row-tags">
                  {contact.tags.slice(0, 3).map((item) => (
                    <em key={item}>{item}</em>
                  ))}
                </span>
              </span>
              <span className="row-meta">
                {contact.isPublic && <Eye size={15} />}
                {contact.ddd && <small>DDD {contact.ddd}</small>}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="detail-panel">
        {showCreate ? (
          <ContactForm onCancel={() => setShowCreate(false)} onSave={(contact) => {
            addContact(contact);
            setShowCreate(false);
          }} />
        ) : selectedContact ? (
          <ContactDetail
            contact={selectedContact}
            suggestions={suggestions.filter((suggestion) => suggestion.contactA.id === selectedContact.id || suggestion.contactB.id === selectedContact.id)}
            updateContact={updateContact}
            deleteContact={deleteContact}
            approveMerge={approveMerge}
          />
        ) : (
          <EmptyState title="Selecione um contato" body="A lista está pronta para busca, filtros, detalhes e revisão de duplicados." />
        )}
      </section>
    </div>
  );
}

function ContactDetail({
  contact,
  suggestions,
  updateContact,
  deleteContact,
  approveMerge
}: {
  contact: Contact;
  suggestions: ReturnType<typeof getMergeSuggestions>;
  updateContact: (id: string, patch: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  approveMerge: (primaryId: string, duplicateId: string) => void;
}) {
  const [draftTags, setDraftTags] = useState(contact.tags.join(", "));

  useEffect(() => {
    setDraftTags(contact.tags.join(", "));
  }, [contact.id, contact.tags]);

  const customEntries = Object.entries(contact.customFields).filter(([, value]) =>
    Array.isArray(value) ? value.length > 0 : value !== "" && value !== undefined && value !== null
  );

  return (
    <div className="contact-detail">
      <div className="contact-header">
        <span className="avatar xl">{initials(contact.name)}</span>
        <div>
          <div className="context-row">
            <span className="context private">Privado</span>
            {contact.isPublic && <span className="context public">Público</span>}
            {contact.groupIds.length > 0 && <span className="context group">Grupo</span>}
          </div>
          <h2>{contact.name}</h2>
          <p>{contact.headline}</p>
        </div>
      </div>

      {suggestions.map((suggestion) => {
        const other = suggestion.contactA.id === contact.id ? suggestion.contactB : suggestion.contactA;
        return (
          <div key={suggestion.id} className="merge-card">
            <div>
              <strong>Possível duplicado: {other.name}</strong>
              <p>{suggestion.reason} com {Math.round(suggestion.confidence * 100)}% de confiança.</p>
            </div>
            <button className="secondary-button compact" onClick={() => approveMerge(contact.id, other.id)}>
              <Check size={16} />
              Mesclar
            </button>
          </div>
        );
      })}

      <div className="detail-grid">
        <label>
          Descrição
          <textarea value={contact.description} onChange={(event) => updateContact(contact.id, { description: event.target.value })} />
        </label>
        <label>
          Demanda atual
          <textarea value={contact.currentDemand} onChange={(event) => updateContact(contact.id, { currentDemand: event.target.value })} />
        </label>
        <label>
          Problema que resolve
          <textarea value={contact.problemSolves} onChange={(event) => updateContact(contact.id, { problemSolves: event.target.value })} />
        </label>
        <label>
          Tags
          <input
            value={draftTags}
            onChange={(event) => setDraftTags(event.target.value)}
            onBlur={() => updateContact(contact.id, { tags: splitList(draftTags) })}
          />
        </label>
      </div>

      <div className="info-grid">
        <Info icon={Mail} label="Emails" value={contact.emails.join(", ") || "Sem email"} />
        <Info icon={Phone} label="Telefones" value={contact.phones.join(", ") || "Sem telefone"} />
        <Info icon={CircleDot} label="Localidade por DDD" value={formatDddLocation(contact.ddd)} />
        <Info icon={Database} label="Fonte" value={contact.source} />
      </div>

      {customEntries.length > 0 && (
        <div className="custom-field-grid">
          {customEntries.map(([key, value]) => (
            <Info
              key={key}
              icon={Tags}
              label={formatCustomFieldKey(key)}
              value={Array.isArray(value) ? value.join(", ") : String(value)}
            />
          ))}
        </div>
      )}

      {contact.notes && (
        <div className="notes-card">
          <strong>Contexto interno</strong>
          <p>{contact.notes}</p>
        </div>
      )}

      <div className="link-row">
        {contact.links.map((link) => (
          <span key={`${link.kind}-${link.value}`}>
            <Link2 size={15} />
            {linkLabels[link.kind]}
          </span>
        ))}
      </div>

      <div className="detail-actions">
        <button className="secondary-button" onClick={() => updateContact(contact.id, { isPublic: !contact.isPublic })}>
          <Eye size={17} />
          {contact.isPublic ? "Ocultar da rede" : "Tornar público"}
        </button>
        <button className="danger-button" onClick={() => deleteContact(contact.id)}>
          <Trash2 size={17} />
          Excluir
        </button>
      </div>
    </div>
  );
}

function ContactForm({ onSave, onCancel }: { onSave: (contact: Contact) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [emails, setEmails] = useState("");
  const [phones, setPhones] = useState("");
  const [demand, setDemand] = useState("");
  const [solves, setSolves] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const phoneList = splitList(phones);
    onSave({
      id: uid("ct"),
      name: name || "Contato sem nome",
      headline,
      description,
      tags: splitList(tags),
      phones: phoneList,
      emails: splitList(emails),
      ddd: extractDdd(phoneList[0] ?? ""),
      source: "Manual",
      currentDemand: demand,
      problemSolves: solves,
      notes: "",
      links: [],
      isPublic: false,
      groupIds: [],
      customFields: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="form-title">
        <h2>Novo contato</h2>
        <button type="button" className="icon-button" onClick={onCancel}>
          <X size={17} />
        </button>
      </div>
      <label>Nome<input value={name} onChange={(event) => setName(event.target.value)} required /></label>
      <label>Cargo ou contexto<input value={headline} onChange={(event) => setHeadline(event.target.value)} /></label>
      <label>Descrição<textarea value={description} onChange={(event) => setDescription(event.target.value)} /></label>
      <label>Tags<input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="marketing, eventos, tecnologia" /></label>
      <label>Emails<input value={emails} onChange={(event) => setEmails(event.target.value)} /></label>
      <label>Telefones<input value={phones} onChange={(event) => setPhones(event.target.value)} /></label>
      <label>O que demanda atualmente<textarea value={demand} onChange={(event) => setDemand(event.target.value)} /></label>
      <label>Problema que resolve<textarea value={solves} onChange={(event) => setSolves(event.target.value)} /></label>
      <button className="primary-button" type="submit">
        <Plus size={17} />
        Salvar contato
      </button>
    </form>
  );
}

function ImportView({ addContacts, state, setView }: AppShellProps) {
  const [importText, setImportText] = useState("");
  const [filePreview, setFilePreview] = useState<Partial<Contact>[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [importSource, setImportSource] = useState<Extract<Contact["source"], "CSV" | "JSON" | "Excel">>("CSV");
  const [fileImporting, setFileImporting] = useState(false);
  const [importStatus, setImportStatus] = useState("");
  const [googleStatus, setGoogleStatus] = useState("");
  const [googleImporting, setGoogleImporting] = useState(false);
  const [appleStatus, setAppleStatus] = useState("");
  const [vcardText, setVcardText] = useState("");
  const [icsText, setIcsText] = useState("");
  const [linkedinQuery, setLinkedinQuery] = useState("");
  const {
    oauthConfig,
    googleClientConfigured
  } = useOAuthRuntimeConfig();
  const textPreview = useMemo(() => {
    try {
      return parseContactImportText(importText);
    } catch {
      return [];
    }
  }, [importText]);
  const preview = filePreview ?? textPreview;
  const applePreview = useMemo(() => parseVcardContacts(vcardText), [vcardText]);
  const appleCalendarPreview = useMemo(() => parseIcsCalendarContacts(icsText), [icsText]);

  const importContacts = () => {
    const contacts: Contact[] = preview.map((partial) =>
      contactFromImportedPartial(partial, {
        fallbackName: "Pessoa importada",
        fallbackSource: (partial.source as Contact["source"] | undefined) ?? importSource,
        notes: "Importado por arquivo real no Grafy.",
        extraTags: [importSource === "Excel" ? "Excel" : importSource === "JSON" ? "JSON" : "CSV"],
        groupIds: ["grp_eventos"],
        customFields: {
          fonteArquivo: fileName || `${importSource} colado`,
          tipoBase: importSource
        }
      })
    );
    addContacts(contacts);
    setImportStatus(`${contacts.length} pessoa(s) importada(s). O grafo já pode usar DDD, tags, cargos, áreas e grupos.`);
  };

  const importAppleVcard = () => {
    const now = new Date().toISOString();
    const contacts: Contact[] = applePreview.map((partial) => {
      const phones = partial.phones ?? [];
      const ddd = partial.ddd || extractDdd(phones[0] ?? "");
      return {
        id: uid("ct"),
        name: partial.name ?? "Contato Apple sem nome",
        headline: partial.headline ?? "",
        description: partial.description ?? "",
        tags: unique([...(partial.tags ?? []), "Apple Contacts", ddd ? `DDD ${ddd}` : ""]),
        phones,
        emails: partial.emails ?? [],
        ddd,
        source: (partial.source as Contact["source"]) ?? "Apple Contacts",
        currentDemand: partial.currentDemand ?? "",
        problemSolves: partial.problemSolves ?? "",
        notes: "Importado via vCard do Apple Contacts/iCloud no Grafy.",
        links: [],
        isPublic: false,
        groupIds: [],
        customFields: {
          origemAgenda: "Apple Contacts"
        },
        createdAt: now,
        updatedAt: now
      };
    });
    addContacts(contacts);
    setAppleStatus(`${contacts.length} contato(s) Apple importado(s) via vCard. Revise duplicados antes de mesclar em produção.`);
  };

  const handleVcardFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    readFileAsText(file)
      .then((text) => {
        setVcardText(text);
        setAppleStatus(`${file.name} carregado para preview de Apple Contacts.`);
      })
      .catch((error) => setAppleStatus(error instanceof Error ? error.message : "Falha ao ler vCard Apple."));
  };

  const importAppleCalendar = () => {
    const now = new Date().toISOString();
    const contacts: Contact[] = appleCalendarPreview.map((partial) => ({
      id: uid("ct"),
      name: partial.name ?? "Participante Apple Agenda",
      headline: partial.headline ?? "",
      description: partial.description ?? "",
      tags: unique([...(partial.tags ?? []), "Apple Calendar", "agenda"]),
      phones: partial.phones ?? [],
      emails: partial.emails ?? [],
      ddd: partial.ddd ?? "",
      source: "Apple Calendar",
      currentDemand: partial.currentDemand ?? "",
      problemSolves: partial.problemSolves ?? "",
      notes: "Importado via arquivo .ics da Apple Agenda/iCloud Calendar no Grafy.",
      links: [],
      isPublic: false,
      groupIds: ["grp_eventos"],
      customFields: {
        origemAgenda: "Apple Calendar",
        ...(partial.customFields ?? {})
      },
      createdAt: now,
      updatedAt: now
    }));
    addContacts(contacts);
    setAppleStatus(`${contacts.length} participante(s) importado(s) da Apple Agenda via .ics.`);
  };

  const handleIcsFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    readFileAsText(file)
      .then((text) => {
        setIcsText(text);
        setAppleStatus(`${file.name} carregado para preview de Apple Agenda.`);
      })
      .catch((error) => setAppleStatus(error instanceof Error ? error.message : "Falha ao ler Apple Agenda."));
  };

  const connectGoogle = async () => {
    if (!googleClientConfigured) {
      setGoogleStatus("Google ainda não está ativado nesta publicação. Em produção, este botão abre o Google direto e importa os dados autorizados pelo usuário.");
      return;
    }
    setGoogleImporting(true);
    setGoogleStatus("Abrindo Google...");
    try {
      const googleImport = await requestGoogleProviderNetworkImport(oauthConfig, setGoogleStatus);
      if (!googleImport.contacts.length) {
        setGoogleStatus("Google autorizou o login, mas não retornou contatos/participantes com os campos permitidos.");
        return;
      }
      addContacts(googleImport.contacts);
      const importBreakdown = GOOGLE_IMPORT_CALENDAR
        ? ` (${googleImport.stats.peopleContacts} de Contacts, ${googleImport.stats.calendarContacts} de Agenda${googleImport.stats.totalBeforeMerge !== googleImport.contacts.length ? ", com duplicados unidos" : ""})`
        : ` (${googleImport.stats.peopleContacts} de Contacts${googleImport.stats.totalBeforeMerge !== googleImport.contacts.length ? ", com duplicados unidos" : ""})`;
      setGoogleStatus(
        `${googleImport.contacts.length} contato(s)/participante(s) importado(s) via ${GOOGLE_IMPORT_CALENDAR ? "Google Contacts + Agenda" : "Google Contacts"}` +
          importBreakdown +
          `${googleImport.profile.email ? ` para ${googleImport.profile.email}` : ""}.`
      );
    } catch (error) {
      setGoogleStatus(error instanceof Error ? error.message : "Não foi possível iniciar OAuth Google.");
    } finally {
      setGoogleImporting(false);
    }
  };

  const handleImportTextChange = (value: string) => {
    setImportText(value);
    setFilePreview(null);
    setFileName("");
    setImportSource(getTextImportSource("base", value));
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileImporting(true);
    try {
      const parsed = await parseContactsFromFile(file);
      setImportSource(parsed.source);
      setFileName(file.name);
      setFilePreview(parsed.contacts);
      setImportText(parsed.text ?? "");
      setImportStatus(`${file.name} carregado com ${parsed.contacts.length} pessoa(s) reconhecida(s).`);
    } catch (error) {
      setImportStatus(error instanceof Error ? error.message : "Não foi possível ler a base enviada.");
    } finally {
      setFileImporting(false);
    }
  };

  const openLinkedinResearch = (name: string) => {
    const query = `${name} LinkedIn cargo empresa`;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
  };

  const linkedinContacts = searchContacts(state.contacts, linkedinQuery).slice(0, 6);

  return (
    <div className="screen import-screen">
      <div className="import-grid">
        <section className="import-card data-import-card">
          <h2>Importar base real</h2>
          <p>Excel, CSV ou JSON com nome, email, telefone, empresa, cargo, área, tags, demanda, resolve e LinkedIn.</p>
          <label className="hub-file-drop">
            <Database size={20} />
            <span>
              <strong>Carregar arquivo</strong>
              <small>.xlsx, .xls, .csv ou .json exportado do hub, evento, CRM ou planilha da empresa.</small>
            </span>
            <input type="file" accept=".xlsx,.xls,.csv,.json,text/csv,application/json" onChange={handleImportFile} />
          </label>
          <label>
            Colar CSV ou JSON
            <textarea
              className="csv-box"
              value={importText}
              onChange={(event) => handleImportTextChange(event.target.value)}
              placeholder="nome,email,telefone,empresa,cargo,area,tags,demanda,resolve,linkedin"
            />
          </label>
          {importStatus && <p className="integration-note">{importStatus}</p>}
          <div className="button-row">
            <button className="primary-button" onClick={importContacts} disabled={fileImporting || !preview.length}>
              <Upload size={17} />
              Importar {preview.length || "base real"}
            </button>
          </div>
        </section>

        <section className="import-card">
          <h2>Preview normalizado</h2>
          <div className="data-preview-summary">
            <span>{fileName || `${importSource} colado`}</span>
            <strong>{preview.length} pessoa(s) reconhecida(s)</strong>
            <small>O Grafy calcula DDD, fonte, tags e campos de empresa/cargo/área antes de gravar.</small>
          </div>
          <div className="preview-list">
            {preview.length ? preview.slice(0, 8).map((contact, index) => (
              <div key={`${contact.name}-${index}`} className="preview-row">
                <span className="avatar small">{initials(contact.name ?? "?")}</span>
                <div>
                  <strong>{contact.name}</strong>
                  <span>{contact.emails?.[0] || contact.phones?.[0] || "sem contato"} · {formatDddLocation(contact.ddd)}</span>
                </div>
              </div>
            )) : (
              <div className="empty-preview">Nenhum contato carregado ainda. Suba uma base real para montar o grafo.</div>
            )}
          </div>
        </section>

        <section className="integration-card tall google-data-hub">
          <div>
            <h3>Google Data Hub</h3>
            <p>
              Caminho oficial para entrar com Google, puxar contatos salvos e ler agenda com participantes/eventos. O MVP
              real deve pedir consentimento separado para People API e Calendar API, mostrar preview e só gravar após aprovação.
            </p>
            {googleStatus && <p className="integration-note">{googleStatus}</p>}
          </div>
          <div className="google-source-flow">
            {[
              ["1", "Login Google", "Identidade do usuário"],
              ["2", "Contacts", "Nome, email, telefone e foto"],
              ["3", "Agenda", "Eventos, participantes e contexto"],
              ["4", "Enriquecer", "DDD, merge, tags e grafo"]
            ].map(([step, title, body]) => (
              <div key={step}>
                <span>{step}</span>
                <strong>{title}</strong>
                <small>{body}</small>
              </div>
            ))}
          </div>
          <div className="connector-proof-list">
            <span><Check size={15} /> People API: nomes, emails, telefones, empresas e cargos autorizados</span>
            <span><Check size={15} /> Calendar API: participantes, eventos, datas e locais autorizados</span>
            <span><Check size={15} /> Preview e deduplicação antes de merge em produção</span>
          </div>
          <div className="button-row">
            <button className="secondary-button compact" onClick={connectGoogle} disabled={googleImporting}>
              <Globe2 size={16} />
              {googleClientConfigured ? "Conectar Google real" : "Entrar com Google"}
            </button>
          </div>
          <span className={googleClientConfigured ? "status-pill live" : "status-pill"}>{googleClientConfigured ? "Google ativo" : "aguardando ativação"}</span>
        </section>

        <section className="integration-card tall apple-data-hub">
          <div>
            <h3>Apple Contacts + Calendar</h3>
            <p>
              No web MVP, o caminho mais seguro é importar vCard exportado do iCloud/Contatos. Para app nativo futuro,
              o Grafy deve usar Contacts framework e EventKit com consentimento explícito, preview e aprovação antes de gravar.
            </p>
            {appleStatus && <p className="integration-note">{appleStatus}</p>}
          </div>
          <div className="google-source-flow apple-source-flow">
            {[
              ["1", "vCard/iCloud", "Nome, empresa, cargo, email e telefone"],
              ["2", "Apple Contacts", "Normalização por .vcf no web"],
              ["3", "Apple Agenda", "Participantes por .ics ou EventKit"],
              ["4", "Grafo", "DDD, tags, origem e oportunidades"]
            ].map(([step, title, body]) => (
              <div key={step}>
                <span>{step}</span>
                <strong>{title}</strong>
                <small>{body}</small>
              </div>
            ))}
          </div>
          <div className="apple-import-layout">
            <div>
              <label>
                Colar vCard ou carregar arquivo .vcf
                <textarea className="csv-box vcard-box" value={vcardText} onChange={(event) => setVcardText(event.target.value)} />
              </label>
              <input className="file-input" type="file" accept=".vcf,text/vcard,text/x-vcard" onChange={handleVcardFile} />
            </div>
            <div>
              <label>
                Colar Apple Agenda .ics ou carregar arquivo
                <textarea className="csv-box vcard-box" value={icsText} onChange={(event) => setIcsText(event.target.value)} />
              </label>
              <input className="file-input" type="file" accept=".ics,text/calendar" onChange={handleIcsFile} />
            </div>
          </div>
          <div className="apple-preview-grid">
            <div>
              <strong>Preview Apple Contacts</strong>
              <div className="google-preview-list apple-preview-list">
                {applePreview.slice(0, 4).map((contact, index) => (
                  <div key={`${contact.name}-${index}`} className="google-preview-row">
                    <span className="avatar small">{initials(contact.name ?? "?")}</span>
                    <div>
                      <strong>{contact.name}</strong>
                      <small>Apple Contacts · {formatDddLocation(contact.ddd)}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <strong>Preview Apple Agenda</strong>
              <div className="google-preview-list apple-preview-list">
                {appleCalendarPreview.slice(0, 4).map((contact, index) => (
                  <div key={`${contact.name}-${index}`} className="google-preview-row">
                    <span className="avatar small">{initials(contact.name ?? "?")}</span>
                    <div>
                      <strong>{contact.name}</strong>
                      <small>Apple Calendar · {String(contact.customFields?.eventoOrigem ?? "evento")}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="button-row">
            <button className="primary-button compact" onClick={importAppleVcard} disabled={!applePreview.length}>
              <Upload size={16} />
              Importar vCard ({applePreview.length})
            </button>
            <button className="primary-button compact" onClick={importAppleCalendar} disabled={!appleCalendarPreview.length}>
              <CalendarClock size={16} />
              Importar Agenda .ics ({appleCalendarPreview.length})
            </button>
          </div>
          <span className="status-pill attention">web: vCard + .ics · nativo: Contacts/EventKit</span>
        </section>

        <section className="integration-card">
          <div>
            <h3>Qualidade da base</h3>
            <p>{getMergeSuggestions(state.contacts).length} duplicado(s) detectado(s) por email ou telefone.</p>
          </div>
          <span className="status-pill live">Ativo</span>
        </section>

        <section className="integration-card">
          <div>
            <h3>LinkedIn e Meetup</h3>
            <p>Conectores preparados como arquitetura segura: OAuth, preview, deduplicação e revisão humana antes de gravar no CRM.</p>
          </div>
          <button className="secondary-button compact" onClick={() => setView("integrations")}>
            <Link2 size={16} />
            Ver plano
          </button>
        </section>

        <section className="import-card linkedin-research">
          <h2>Enriquecimento LinkedIn seguro</h2>
          <p>
            O Grafy pode abrir pesquisas assistidas para o usuário confirmar cargo/empresa. Evitamos scraping automático
            logado no LinkedIn; a atualização entra por revisão humana ou API autorizada.
          </p>
          <div className="search-box">
            <Search size={17} />
            <input value={linkedinQuery} onChange={(event) => setLinkedinQuery(event.target.value)} placeholder="Filtrar contatos para pesquisar no LinkedIn" />
          </div>
          <div className="linkedin-list">
            {linkedinContacts.map((contact) => (
              <button key={contact.id} onClick={() => openLinkedinResearch(contact.name)}>
                <span className="avatar small">{initials(contact.name)}</span>
                <span>
                  <strong>{contact.name}</strong>
                  <small>{contact.headline || "Pesquisar perfil profissional"}</small>
                </span>
                <Link2 size={16} />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function IntegrationsView({ state, setView }: AppShellProps) {
  const { googleClientConfigured, appleClientConfigured } = useOAuthRuntimeConfig();
  const openExternal = (url: string) => window.open(url, "_blank", "noopener,noreferrer");
  const connectors = [
    {
      name: "Google Contacts",
      icon: Globe2,
      status: googleClientConfigured ? "OAuth real disponível" : "Integração pendente",
      tone: googleClientConfigured ? "live" : "",
      description:
        "Fonte principal do comprador B2C: contatos salvos pelo usuário com consentimento, People API e backend seguro para tokens.",
      data: ["nome", "sobrenome", "emails", "telefones", "foto"],
      graph: ["importado de", "tem DDD", "possível duplicado", "localidade"],
      action: "Abrir importação",
      url: "internal"
    },
    {
      name: "Google Calendar",
      icon: CalendarClock,
      status: googleClientConfigured ? "Agenda autorizável" : "Integração pendente",
      tone: "attention",
      description:
        "Lê eventos e participantes autorizados para entender encontros, reuniões, hubs e follow-ups sem invadir dados privados.",
      data: ["eventos", "participantes", "organizador", "data", "local"],
      graph: ["participou de", "conhecido em", "grupo/evento", "follow-up"],
      action: "Abrir importação",
      url: "internal"
    },
    {
      name: "Apple Contacts",
      icon: ContactRound,
      status: appleClientConfigured ? "Apple ID configurado" : "Apple ID + vCard",
      tone: appleClientConfigured ? "live" : "attention",
      description:
        "No protótipo web, importa .vcf exportado do iCloud/Contatos. Em app nativo, usa Contacts framework com permissão do usuário.",
      data: ["nome", "empresa", "cargo", "emails", "telefones"],
      graph: ["importado de", "tem DDD", "empresa", "possível duplicado"],
      action: "Importar vCard",
      url: "internal"
    },
    {
      name: "Apple Calendar",
      icon: CalendarClock,
      status: "ICS no web",
      tone: "attention",
      description:
        "Para app nativo, usa EventKit para eventos e participantes autorizados. No web, importa participantes por arquivo .ics.",
      data: ["eventos", "participantes", "data", "local", "origem"],
      graph: ["participou de", "conhecido em", "grupo/evento", "follow-up"],
      action: "Importar .ics",
      url: "internal"
    },
    {
      name: "LinkedIn",
      icon: Link2,
      status: "Oficial ou assistido",
      tone: "attention",
      description:
        "Bom para perfil profissional e enriquecimento revisado. Sem scraping logado; usamos API oficial ou revisão humana.",
      data: ["perfil próprio", "cargo revisado", "empresa", "URL pública"],
      graph: ["vinculado a usuário", "trabalha em", "resolve algo"],
      action: "Catálogo LinkedIn",
      url: "https://developer.linkedin.com/product-catalog"
    },
    {
      name: "Meetup",
      icon: CalendarClock,
      status: "GraphQL futuro",
      tone: "attention",
      description:
        "Excelente para contexto de eventos, comunidades, grupos e participantes quando houver OAuth/token autorizado.",
      data: ["eventos", "grupos", "membros", "temas", "local"],
      graph: ["participou de", "pertence a grupo", "interesse comum"],
      action: "Docs GraphQL",
      url: "https://www.meetup.com/graphql/"
    },
    {
      name: "OpenAPI / Swagger",
      icon: Database,
      status: "Contrato preparado",
      tone: "live",
      description:
        "Deixa a plataforma pronta para conectores externos, webhooks e importadores corporativos sem acoplar tudo ao front-end.",
      data: ["contacts", "groups", "tags", "merge_suggestions"],
      graph: ["graph_edges", "custom_fields", "import_jobs"],
      action: "Ver README",
      url: "internal"
    },
    {
      name: "Excel / JSON para hubs",
      icon: Upload,
      status: "Ativo no MVP",
      tone: "live",
      description:
        "Caminho principal para hubs, eventos e empresas subirem participantes reais por planilha ou JSON antes de gerar grafo e grupos.",
      data: ["nome", "empresa", "cargo", "área", "demanda", "tags"],
      graph: ["pertence a grupo", "tem área", "tem cargo", "potencial match"],
      action: "Abrir importação",
      url: "internal"
    }
  ];

  return (
    <div className="screen integrations-screen">
      <section className="integration-hero">
        <div>
          <span className="context public">arquitetura de dados</span>
          <h2>Conectores para dados reais de networking</h2>
          <p>
            O Grafy atende dois cenários: o empresário que quer organizar a própria rede e o hub/evento/empresa que quer
            conectar uma base compartilhada. As integrações precisam importar com consentimento, mostrar preview, sugerir merge
            e só enriquecer contatos quando o usuário aprovar.
          </p>
        </div>
        <div className="connector-metrics">
          <Info icon={ContactRound} label="Base atual" value={`${state.contacts.length} contatos no protótipo`} />
          <Info icon={ShieldCheck} label="Privacidade" value="Contato privado por padrão, público só com opt-in" />
          <Info icon={Network} label="Grafo" value="Toda fonte vira nó, relação e filtro visual" />
        </div>
      </section>

      <section className="buyer-map">
        <article>
          <span className="context public">B2C</span>
          <h3>Empresário individual</h3>
          <p>Google Contacts, agenda, telefone e LinkedIn revisado viram uma base privada para encontrar clientes, parceiros e prestadores.</p>
        </article>
        <article>
          <span className="context group">B2B / B2B2C</span>
          <h3>Hub, evento ou empresa</h3>
          <p>CSV corporativo, Meetup, agenda do evento e OpenAPI alimentam grupos compartilhados, curadoria e grafo por comunidade.</p>
        </article>
      </section>

      <section className="integration-map">
        <div className="integration-map-copy">
          <h3>Como uma fonte vira inteligência</h3>
          <p>Ao conectar uma fonte, o Grafy não grava tudo direto: primeiro normaliza, mostra preview, cruza duplicados e cria relações no grafo.</p>
        </div>
        <div className="integration-roadmap">
          {["Conectar", "Normalizar", "Revisar", "Gerar grafo"].map((step, index) => (
            <div key={step}>
              <span>{index + 1}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
      </section>

      <div className="connector-grid organized">
        {connectors.map((connector) => {
          const Icon = connector.icon;
          return (
            <article className="connector-card" key={connector.name}>
              <header>
                <span className="connector-icon"><Icon size={18} /></span>
                <div>
                  <h3>{connector.name}</h3>
                  <span className={`status-pill ${connector.tone}`}>{connector.status}</span>
                </div>
              </header>
              <p>{connector.description}</p>
              <div className="connector-lanes">
                <ConnectorLane title="Dados úteis" items={connector.data} />
                <ConnectorLane title="Vira grafo" items={connector.graph} />
              </div>
              <button
                className="secondary-button compact"
                onClick={() => {
                  if (connector.url === "internal") setView(connector.name.includes("OpenAPI") ? "settings" : "import");
                  else openExternal(connector.url);
                }}
              >
                <Link2 size={16} />
                {connector.action}
              </button>
            </article>
          );
        })}
      </div>

      <section className="workflow-panel">
        <div>
          <h2>Fluxo seguro de enriquecimento</h2>
          <p>O caminho certo para entender contatos sem automatizar comportamento proibido ou criar dados falsos.</p>
        </div>
        <div className="workflow-steps">
          {[
            ["1", "Conectar fonte", "OAuth ou arquivo autorizado pelo usuário."],
            ["2", "Normalizar", "Emails, telefones, DDDs, tags, empresas e origem."],
            ["3", "Preview e merge", "Sugerir duplicados, nunca mesclar automaticamente."],
            ["4", "Revisão humana", "LinkedIn e dados externos entram como sugestão aprovada."],
            ["5", "Atualizar grafo", "Criar nós, arestas, filtros e oportunidades de conexão."]
          ].map(([step, title, body]) => (
            <div className="workflow-step" key={step}>
              <span>{step}</span>
              <div>
                <strong>{title}</strong>
                <p>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ConnectorLane({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="connector-lane">
      <strong>{title}</strong>
      <div>
        {items.map((item) => <span key={item}>{item}</span>)}
      </div>
    </div>
  );
}

function GraphView({ state, setSelectedContactId, setView }: AppShellProps) {
  const [query, setQuery] = useState("");
  const [groupId, setGroupId] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const graphCanvasRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const graph = useMemo(() => buildGraph(state, query, groupId || undefined, activeFilters), [activeFilters, groupId, query, state]);
  const nodeMap = new Map(graph.nodes.map((node) => [node.id, node]));
  const availableTags = getGraphFilterTags(state.contacts, state.groups);

  const toggleFilter = (tag: string) => {
    setActiveFilters((current) =>
      current.some((item) => normalizeGraphTag(item) === normalizeGraphTag(tag))
        ? current.filter((item) => normalizeGraphTag(item) !== normalizeGraphTag(tag))
        : [...current, tag]
    );
  };

  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    const target = event.target as Element;
    if (target.closest(".graph-node")) return;
    dragRef.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current) return;
    setPan({
      x: dragRef.current.panX + event.clientX - dragRef.current.x,
      y: dragRef.current.panY + event.clientY - dragRef.current.y
    });
  };

  const endPan = (event: React.PointerEvent<SVGSVGElement>) => {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  useEffect(() => {
    const canvas = graphCanvasRef.current;
    if (!canvas) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setZoom((value) => Math.min(1.85, Math.max(0.55, value + (event.deltaY < 0 ? 0.08 : -0.08))));
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <div className="screen graph-screen">
      <section className="graph-toolbar">
        <div className="search-box">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtrar grafo por tag, pessoa, DDD ou demanda" />
        </div>
        <select value={groupId} onChange={(event) => setGroupId(event.target.value)}>
          <option value="">Grafo interno</option>
          {state.groups.map((group) => (
            <option key={group.id} value={group.id}>{group.name}</option>
          ))}
        </select>
        <button className="icon-button" onClick={() => setZoom((value) => Math.max(0.55, value - 0.12))} title="Reduzir zoom" aria-label="Reduzir zoom">
          <ZoomOut size={17} />
        </button>
        <button className="icon-button" onClick={() => setZoom((value) => Math.min(1.85, value + 0.12))} title="Aumentar zoom" aria-label="Aumentar zoom">
          <ZoomIn size={17} />
        </button>
        <button className="secondary-button compact" onClick={() => {
          setZoom(1);
          setPan({ x: 0, y: 0 });
          setActiveFilters([]);
          setQuery("");
        }}>
          <RotateCcw size={16} />
          Resetar visão
        </button>
      </section>

      <section className="graph-filter-panel">
        <div>
          <strong>Filtros combináveis</strong>
          <span>{activeFilters.length ? `${activeFilters.length} filtro(s) ativo(s)` : "Escolha cargo, área, DDD, pasta ou estratégia"}</span>
        </div>
        <div className="graph-filter-groups">
          {graphFilterGroups.map((group) => (
            <div key={group.label} className="filter-family">
              <small>{group.label}</small>
              <div>
                {group.tags
                  .filter((tag) => availableTags.some((item) => normalizeGraphTag(item) === normalizeGraphTag(tag)))
                  .map((tag) => (
                    <button
                      key={tag}
                      className={`${activeFilters.some((item) => normalizeGraphTag(item) === normalizeGraphTag(tag)) ? "filter-chip active" : "filter-chip"} ${tagToneClass(tag)}`}
                      onClick={() => toggleFilter(tag)}
                    >
                      {tag}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="graph-focus-bar">
        <div>
          <strong>{graph.hasFocus ? `${graph.matchedContactIds.size} contato(s) em foco` : `${state.contacts.length} contatos mapeados`}</strong>
          <span>
            {graph.hasFocus
              ? "Quem não bate com a combinação fica em 8% de opacidade para manter contexto sem poluir a leitura."
              : "Combine filtros como diretor + finanças, DDD 11 + eventos ou pasta + tecnologia."}
          </span>
        </div>
        <div className="active-filter-stack">
          {activeFilters.map((filter) => (
            <button key={filter} className={`filter-chip active ${tagToneClass(filter)}`} onClick={() => toggleFilter(filter)}>
              {filter}
              <X size={13} />
            </button>
          ))}
          {activeFilters.length > 0 && (
            <button className="secondary-button compact" onClick={() => setActiveFilters([])}>
              Limpar filtros
            </button>
          )}
        </div>
      </section>

      <section className="graph-layout">
        <div className="graph-canvas" ref={graphCanvasRef}>
          <NetworkBackdrop className="graph-canvas-network" density={42} interactive={false} />
          <div className="graph-zoom-hint" aria-hidden="true">
            <ZoomIn size={15} />
            <span>Roda do mouse: zoom no grafo</span>
            <small>Arraste para navegar. Fora daqui, a página rola normalmente.</small>
          </div>
          <svg
            viewBox="0 0 960 660"
            role="img"
            aria-label="Grafo de networking do Grafy"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPan}
            onPointerLeave={endPan}
          >
            <g style={{ transform: `translate(${480 + pan.x}px, ${330 + pan.y}px) scale(${zoom}) translate(-480px, -330px)` }}>
              {graph.edges.map((edge) => {
                const source = nodeMap.get(edge.source);
                const target = nodeMap.get(edge.target);
                if (!source || !target) return null;
                return (
                  <line
                    key={edge.id}
                    className={`graph-edge ${edge.type === "potencial match" ? "match" : ""} ${edge.type === "afinidade de tag" || edge.type === "mesma pasta" ? "affinity" : ""} ${edge.isDimmed ? "dimmed" : ""}`}
                    style={{ "--edge-color": edge.color ?? "#7dc7ff", strokeWidth: Math.max(0.7, edge.weight) } as React.CSSProperties}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                  />
                );
              })}
              {graph.nodes.map((node, index) => (
                <g key={node.id} className={`graph-node ${node.type} ${node.isDimmed ? "dimmed" : ""}`} style={{ animationDelay: `${(index % 9) * -0.42}s`, "--node-color": node.color ?? "#66e7ff" } as React.CSSProperties} onClick={() => {
                  setSelectedNode(node);
                  if (node.contactId) setSelectedContactId(node.contactId);
                }}>
                  <circle cx={node.x} cy={node.y} r={Math.min(24, node.weight + 8)} />
                  <text className="graph-node-title" x={node.x} y={node.type === "contact" || node.type === "public" ? node.y - 3 : node.y + node.weight + 24}>
                    {shortGraphLabel(node.label)}
                  </text>
                  {(node.type === "contact" || node.type === "public") && (
                    <text className="graph-node-meta" x={node.x} y={node.y + 13}>{node.meta?.split(" · ")[0].slice(0, 18)}</text>
                  )}
                </g>
              ))}
            </g>
          </svg>
        </div>

        <aside className="graph-inspector">
          {selectedNode ? (
            <>
              <span className={`context ${selectedNode.type}`}>{selectedNode.type}</span>
              <h2>{selectedNode.label}</h2>
              <p>{selectedNode.contactId ? "Pessoa conectada a tags, fontes, pastas, DDDs e oportunidades." : "Nó estrutural usado para filtrar e navegar pela rede."}</p>
              {selectedNode.meta && <p className="inspector-meta">{selectedNode.meta}</p>}
              {selectedNode.contactId && (
                <button className="primary-button" onClick={() => setView("contacts")}>
                  <ChevronRight size={17} />
                  Abrir contato
                </button>
              )}
            </>
          ) : (
            <EmptyState title="Clique em um nó" body="Arraste o canvas, use a roda do mouse para zoom e combine filtros como diretoria + finanças." />
          )}
          <div className="legend">
            <span><i className="dot contact" /> contatos</span>
            <span><i className="dot tag" /> tags</span>
            <span><i className="dot public" /> público</span>
            <span><i className="dot group" /> pastas</span>
            <span><i className="dot affinity" /> afinidades</span>
            <span><i className="dot demand" /> demandas</span>
            <span><i className="dot solution" /> soluções</span>
          </div>
        </aside>
      </section>
    </div>
  );
}

function normalizeGraphTag(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function tagToneClass(tag: string) {
  const normalized = normalizeGraphTag(tag);
  const family = graphFilterGroups.find((group) =>
    group.tags.some((item) => normalizeGraphTag(item) === normalized)
  )?.label;
  if (normalized.startsWith("ddd ")) return "tag-ddd";
  if (family === "Cargos") return "tag-role";
  if (family === "Áreas") return "tag-area";
  if (family === "Negócios") return "tag-business";
  if (family === "Estratégia") return "tag-strategy";
  if (family === "Fontes") return "tag-source";
  if (family === "Pastas") return "tag-folder";
  return "";
}

function shortGraphLabel(label: string) {
  if (label.length <= 18) return label;
  const [first, second] = label.split(" ");
  return second ? `${first} ${second[0]}.` : `${label.slice(0, 16)}...`;
}

function formatCustomFieldKey(key: string) {
  const labels: Record<string, string> = {
    ticketMedio: "Ticket médio",
    prioridade: "Prioridade",
    area: "Área",
    cargo: "Cargo",
    tipoNegocio: "Tipo de negócio",
    origemAgenda: "Origem da agenda",
    eventoOrigem: "Evento de origem"
  };
  return labels[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

function contactSignalLine(contact: Contact) {
  return unique([
    String(contact.customFields.cargo ?? ""),
    String(contact.customFields.area ?? ""),
    String(contact.customFields.tipoNegocio ?? ""),
    formatDddLocation(contact.ddd),
    contact.source
  ]).join(" · ");
}

function contactMatchReason(contact: Contact) {
  const signals = unique([
    ...contact.tags.slice(0, 2),
    String(contact.customFields.area ?? ""),
    String(contact.customFields.cargo ?? "")
  ]).filter(Boolean);
  return signals.length
    ? `Sinal do match: ${signals.join(", ")}`
    : "Sinal do match: descrição, demanda e fonte do contato.";
}

function GroupsView({ state, addGroup, updateGroup, addContactToGroup, setSelectedContactId, setView }: AppShellProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [color, setColor] = useState(groupColorOptions[0]);
  const [draftAssignments, setDraftAssignments] = useState<Record<string, string>>({});

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    addGroup(name, description, splitList(tags), color);
    setName("");
    setDescription("");
    setTags("");
    setColor(groupColorOptions[0]);
  };

  return (
    <div className="screen groups-screen">
      <form className="group-create" onSubmit={submit}>
        <div>
          <span className="context group">kanban de pastas</span>
          <h2>Criar grupo ou pasta estratégica</h2>
          <p>Pastas criam uma conexão extra no grafo, mesmo quando as pessoas não são da mesma empresa ou área.</p>
        </div>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome do grupo" />
        <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Descrição do grupo" />
        <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Tags: diretoria, finanças, evento..." />
        <div className="color-picker-row">
          {groupColorOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={option === color ? "color-dot active" : "color-dot"}
              style={{ "--group-color": option } as React.CSSProperties}
              onClick={() => setColor(option)}
              aria-label={`Usar cor ${option}`}
            />
          ))}
        </div>
        <button className="primary-button" type="submit">
          <Plus size={17} />
          Criar grupo
        </button>
      </form>

      <section className="board-summary">
        <div>
          <span className="context group">pastas conectam estratégia</span>
          <h2>Board de grupos compartilhados</h2>
          <p>Cada coluna tem cor, tags e contatos próprios. Quando uma pessoa entra na pasta, o grafo cria uma conexão extra para planejamento de introduções.</p>
        </div>
        <button className="secondary-button compact" onClick={() => setView("graph")}>
          <Network size={16} />
          Ver pastas no grafo
        </button>
      </section>

      <div className="group-board">
        {state.groups.map((group) => {
          const contacts = state.contacts.filter((contact) => group.contactIds.includes(contact.id));
          const availableContacts = state.contacts.filter((contact) => !group.contactIds.includes(contact.id));
          const groupAreas = unique(contacts.map((contact) => String(contact.customFields.area ?? "")).filter(Boolean));
          return (
            <article className="group-card kanban-column" key={group.id} style={{ "--group-color": group.color || groupColorOptions[0] } as React.CSSProperties}>
              <div className="group-card-head">
                <div>
                  <span className="context group">{group.role}</span>
                  <h2>{group.name}</h2>
                </div>
                <Users size={24} />
              </div>
              <p>{group.description}</p>
              <div className="group-stats-row">
                <span><strong>{contacts.length}</strong> contatos</span>
                <span><strong>{groupAreas.length}</strong> áreas</span>
                <span><strong>{group.tags.length}</strong> tags</span>
              </div>
              <div className="group-controls">
                <label>
                  Cor
                  <input type="color" value={group.color || groupColorOptions[0]} onChange={(event) => updateGroup(group.id, { color: event.target.value })} />
                </label>
                <label>
                  Tags da pasta
                  <input
                    value={group.tags.join(", ")}
                    onChange={(event) => updateGroup(group.id, { tags: splitList(event.target.value) })}
                  />
                </label>
              </div>
              <div className="tag-cloud compact">
                {group.tags.map((tag) => <span className={`tag-chip ${tagToneClass(tag)}`} key={tag}>{tag}</span>)}
              </div>
              <div className="group-add-contact">
                <select
                  value={draftAssignments[group.id] ?? ""}
                  onChange={(event) => setDraftAssignments((current) => ({ ...current, [group.id]: event.target.value }))}
                >
                  <option value="">Adicionar contato</option>
                  {availableContacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}</option>)}
                </select>
                <button className="secondary-button compact" onClick={() => {
                  addContactToGroup(group.id, draftAssignments[group.id] ?? "");
                  setDraftAssignments((current) => ({ ...current, [group.id]: "" }));
                }}>
                  <Plus size={15} />
                  Adicionar
                </button>
              </div>
              <div className="group-contact-list">
                {contacts.map((contact) => (
                  <button key={contact.id} onClick={() => {
                    setSelectedContactId(contact.id);
                    setView("contacts");
                  }}>
                    <span className="avatar small">{initials(contact.name)}</span>
                    <span>
                      <strong>{contact.name}</strong>
                      <small>{contact.tags.slice(0, 2).join(" · ")}</small>
                    </span>
                  </button>
                ))}
              </div>
              <div className="group-actions">
                <button className="secondary-button compact" onClick={() => setView("graph")}>
                  <Network size={15} />
                  Abrir grafo
                </button>
                <span>Conexão extra: mesma pasta</span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function PublicNetworkView({ state, setSelectedContactId, setView }: AppShellProps) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const publicContacts = searchContacts(state.contacts.filter((contact) => contact.isPublic), query);
  const filteredPublicContacts = tag ? publicContacts.filter((contact) => contact.tags.some((item) => normalizeGraphTag(item) === normalizeGraphTag(tag))) : publicContacts;
  const ownProfileVisible = state.profile.visibility === "platform";
  const publicTags = getAllTags(publicContacts).slice(0, 12);

  return (
    <div className="screen public-screen">
      <section className="public-hero">
        <div>
          <span className="context public">descoberta com opt-in</span>
          <h2>Rede pública</h2>
          <p>
            A rede é a camada compartilhável do Grafy: mostra apenas perfis e contatos marcados como públicos, ajuda a descobrir
            quem resolve algo e preserva a base privada do usuário.
          </p>
        </div>
        <div className="public-stats">
          <Info icon={Eye} label="Visíveis" value={`${filteredPublicContacts.length + (ownProfileVisible ? 1 : 0)} perfis`} />
          <Info icon={ShieldCheck} label="Privacidade" value="Email e telefone ficam fora dos cards públicos" />
        </div>
      </section>

      <section className="public-explainer">
        <Info icon={ShieldCheck} label="Opt-in" value="Só aparece quem marcou perfil ou contato como público." />
        <Info icon={Network} label="Integração" value="Cards públicos também aparecem no grafo e nos matches." />
        <Info icon={UserRound} label="Seu perfil" value={ownProfileVisible ? "Seu card já está visível na Rede." : "Ative no Perfil quando quiser ser encontrado."} />
      </section>

      <div className="section-toolbar">
        <div className="search-box">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por tag, demanda ou problema resolvido" />
        </div>
        <span className="toolbar-count">{filteredPublicContacts.length} resultado(s)</span>
        <button className="secondary-button compact" onClick={() => setView("graph")}>
          <Network size={16} />
          Ver no grafo
        </button>
      </div>

      <div className="filter-strip network-filter-strip">
        <button className={!tag ? "filter-chip active" : "filter-chip"} onClick={() => setTag("")}>Todos</button>
        {publicTags.map((item) => (
          <button key={item} className={`${tag === item ? "filter-chip active" : "filter-chip"} ${tagToneClass(item)}`} onClick={() => setTag(item)}>
            {item}
          </button>
        ))}
      </div>

      <div className="public-grid">
        {ownProfileVisible && (
          <article className="public-card self">
            <span className="avatar xl">{initials(state.profile.name)}</span>
            <h3>{state.profile.name}</h3>
            <p>{state.profile.headline}</p>
            <div className="tag-cloud compact">
              {state.profile.tags.map((tag) => <span className={`tag-chip ${tagToneClass(tag)}`} key={tag}>{tag}</span>)}
            </div>
            <strong>Resolve</strong>
            <p>{state.profile.problemSolves}</p>
            <button className="secondary-button compact" onClick={() => setView("profile")}>Editar perfil público</button>
          </article>
        )}
        {filteredPublicContacts.map((contact) => (
          <article className="public-card" key={contact.id}>
            <span className="avatar xl">{initials(contact.name)}</span>
            <h3>{contact.name}</h3>
            <p>{contact.headline}</p>
            <div className="tag-cloud compact">
              {contact.tags.slice(0, 5).map((tag) => <span className={`tag-chip ${tagToneClass(tag)}`} key={tag}>{tag}</span>)}
            </div>
            <strong>Resolve</strong>
            <p>{contact.problemSolves}</p>
            <strong>Demanda</strong>
            <p>{contact.currentDemand}</p>
            <div className="network-reason">
              <Sparkles size={15} />
              <span>Entra no grafo por tags, DDD {contact.ddd || "?"}, fonte {contact.source} e opt-in público.</span>
            </div>
            <div className="button-row">
              <button className="secondary-button compact" onClick={() => {
                setSelectedContactId(contact.id);
                setView("contacts");
              }}>
                <ContactRound size={16} />
                Ver vínculo
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ChatView({ state, setState, setSelectedContactId, setView }: AppShellProps) {
  const [prompt, setPrompt] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!prompt.trim()) return;
    const userMessage = { id: uid("msg"), role: "user" as const, content: prompt, createdAt: new Date().toISOString() };
    const answer = makeAssistantAnswer(prompt, state);
    const assistantMessage = {
      id: uid("msg"),
      role: "assistant" as const,
      content: answer.content,
      resultContactIds: answer.resultContactIds,
      createdAt: new Date().toISOString()
    };
    setState((current) => ({ ...current, chatMessages: [...current.chatMessages, userMessage, assistantMessage] }));
    setPrompt("");
  };

  return (
    <div className="screen chat-screen">
      <section className="chat-panel">
        <div className="chat-header">
          <Bot size={22} />
          <div>
            <h2>Copiloto de networking</h2>
            <p>Busca estruturada em contatos, tags, demandas, problemas resolvidos e duplicados.</p>
          </div>
        </div>
        <div className="message-list">
          {state.chatMessages.map((message) => (
            <div key={message.id} className={`message ${message.role}`}>
              <p>{message.content}</p>
              {message.resultContactIds && message.resultContactIds.length > 0 && (
                <div className="result-strip rich-results">
                  {unique(message.resultContactIds)
                    .map((id) => state.contacts.find((contact) => contact.id === id))
                    .filter(Boolean)
                    .slice(0, 5)
                    .map((contact) => (
                      <button className="chat-result-card" key={contact!.id} onClick={() => {
                        setSelectedContactId(contact!.id);
                        setView("contacts");
                      }}>
                        <span className="avatar small">{initials(contact!.name)}</span>
                        <span>
                          <strong>{contact!.name}</strong>
                          <small>{contact!.headline || contact!.source}</small>
                          <em>{contactSignalLine(contact!)}</em>
                          <span className="chat-mini-tags">
                            {contact!.tags.slice(0, 3).map((tag) => <i className={`tag-chip ${tagToneClass(tag)}`} key={tag}>{tag}</i>)}
                          </span>
                          <b>Resolve: {contact!.problemSolves.slice(0, 96) || "Sem descrição"}</b>
                          <b>Demanda: {contact!.currentDemand.slice(0, 86) || "Sem demanda registrada"}</b>
                          <em>{contactMatchReason(contact!)}</em>
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <form className="chat-input" onSubmit={submit}>
          <input
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Ex: quem presta serviço de limpeza? quem busca investidor?"
          />
          <button className="primary-button" type="submit">
            <WandSparkles size={17} />
            Perguntar
          </button>
        </form>
      </section>
    </div>
  );
}

function ProfileView({ state, setState }: AppShellProps) {
  const profile = state.profile;
  const updateProfile = (patch: Partial<typeof profile>) => {
    setState((current) => ({ ...current, profile: { ...current.profile, ...patch } }));
  };
  const linkValue = (kind: LinkKind) => profile.links.find((link) => link.kind === kind)?.value ?? "";
  const updateLink = (kind: LinkKind, value: string) => {
    updateProfile({
      links: value
        ? [...profile.links.filter((link) => link.kind !== kind), { kind, value }]
        : profile.links.filter((link) => link.kind !== kind)
    });
  };
  const profileSignals = [
    profile.name,
    profile.headline,
    profile.description,
    profile.tags.join(" "),
    profile.problemSolves,
    profile.currentDemand,
    profile.links.map((link) => link.value).join(" ")
  ].filter((value) => value.trim());
  const signalScore = Math.round((profileSignals.length / 7) * 100);

  return (
    <div className="screen profile-screen">
      <section className="profile-card-large">
        <span className="avatar xxl">{initials(profile.name)}</span>
        <div>
          <span className={`context ${profile.visibility === "platform" ? "public" : "private"}`}>
            {profile.visibility === "platform" ? "visível na rede" : "privado"}
          </span>
          <h2>{profile.name}</h2>
          <p>{profile.headline}</p>
          <div className="tag-cloud compact">
            {profile.tags.map((tag) => <span className={`tag-chip ${tagToneClass(tag)}`} key={tag}>{tag}</span>)}
          </div>
        </div>
        <div className="profile-score">
          <span>{signalScore}%</span>
          <strong>sinais preenchidos</strong>
          <small>Quanto melhor esse perfil, melhor o chat, a Rede e o grafo público.</small>
        </div>
      </section>

      <section className="profile-impact-strip">
        <Info icon={Network} label="Grafo" value="Tags, demanda e problema resolvido viram nós e filtros." />
        <Info icon={MessageSquare} label="Chat" value="O copiloto usa esses sinais para sugerir contatos antes do clique." />
        <Info icon={Globe2} label="Rede" value="Com opt-in, este é o card que outros usuários descobrem." />
      </section>

      <section className="profile-grid">
        <div className="settings-panel">
          <h2>Identidade de networking</h2>
          <label>Nome<input value={profile.name} onChange={(event) => updateProfile({ name: event.target.value })} /></label>
          <label>Headline<input value={profile.headline} onChange={(event) => updateProfile({ headline: event.target.value })} /></label>
          <label>Descrição<textarea value={profile.description} onChange={(event) => updateProfile({ description: event.target.value })} /></label>
          <label>Tags estratégicas<input value={profile.tags.join(", ")} onChange={(event) => updateProfile({ tags: splitList(event.target.value) })} /></label>
          <label>Problema que resolve<textarea value={profile.problemSolves} onChange={(event) => updateProfile({ problemSolves: event.target.value })} /></label>
          <label>Demanda atual<textarea value={profile.currentDemand} onChange={(event) => updateProfile({ currentDemand: event.target.value })} /></label>
        </div>

        <div className="settings-panel">
          <h2>Links e sinais externos</h2>
          <p className="panel-note">Esses links ajudam o Grafy a conectar sua identidade pública com contatos, grupos, oportunidades e futuras integrações oficiais.</p>
          <label>LinkedIn<input value={linkValue("linkedin")} onChange={(event) => updateLink("linkedin", event.target.value)} placeholder="linkedin.com/in/seu-perfil" /></label>
          <label>WhatsApp<input value={linkValue("whatsapp")} onChange={(event) => updateLink("whatsapp", event.target.value)} placeholder="+55 11 99999-9999" /></label>
          <label>Instagram<input value={linkValue("instagram")} onChange={(event) => updateLink("instagram", event.target.value)} placeholder="@seuperfil" /></label>
          <label>URL<input value={linkValue("url")} onChange={(event) => updateLink("url", event.target.value)} placeholder="https://..." /></label>
        </div>

        <div className="settings-panel profile-signal-panel">
          <h2>Como o perfil entra no sistema</h2>
          <div className="architecture-list">
            <Info icon={Tags} label="Tags" value="Virarão filtros e nós do grafo público" />
            <Info icon={Sparkles} label="Demanda" value="Ajuda o chat a sugerir quem pode ajudar você" />
            <Info icon={Network} label="Problema que resolve" value="Ajuda outros contatos a encontrarem você" />
          </div>
        </div>

        <div className="settings-panel">
          <h2>Visibilidade</h2>
          <p className="panel-note">Por padrão, seu perfil fica privado. Ao ativar, apenas o card público aparece na Rede; seus contatos privados não são expostos.</p>
        <div className="toggle-row">
          <div>
            <strong>Quero ser visto na minha rede</strong>
            <span>Controla se o seu card aparece na descoberta pública.</span>
          </div>
          <button
            className={profile.visibility === "platform" ? "toggle active" : "toggle"}
            onClick={() =>
              updateProfile({ visibility: profile.visibility === "platform" ? "private" : "platform" })
            }
          >
            <span />
          </button>
        </div>
        </div>
      </section>
    </div>
  );
}

function SettingsView({ state, setState, addCustomField, onLogout, sessionEmail }: AppShellProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<CustomField["type"]>("short_text");
  const [connectorStatus, setConnectorStatus] = useState("Escolha uma integração para ver o caminho seguro de conexão.");
  const { googleClientConfigured, appleClientConfigured } = useOAuthRuntimeConfig();
  const connectorSettings = [
    {
      name: "Google Contacts",
      icon: Globe2,
      status: googleClientConfigured ? "OAuth disponível" : "Integração pendente",
      tone: googleClientConfigured ? "live" : "attention",
      body: "Login Google + People API para puxar nome, sobrenome, email, telefone e foto salvos pelo usuário.",
      action: "Preparar Google OAuth",
      data: ["nome", "email", "telefone", "foto", "DDD"]
    },
    {
      name: "Google Calendar",
      icon: CalendarClock,
      status: "OAuth incremental",
      tone: "attention",
      body: "Calendar API para mapear reuniões, eventos e participantes autorizados, gerando contexto de origem e follow-up.",
      action: "Preparar Agenda",
      data: ["eventos", "participantes", "local", "recorrência", "follow-up"]
    },
    {
      name: "Apple Contacts",
      icon: ContactRound,
      status: appleClientConfigured ? "Apple ID + vCard" : "vCard ativo",
      tone: appleClientConfigured ? "live" : "attention",
      body: "No web, importar .vcf exportado do iCloud/Contatos. No app nativo, usar CNContactStore com permissão e preview.",
      action: "Importar vCard Apple",
      data: ["vCard", "nome", "empresa", "telefone", "DDD"]
    },
    {
      name: "Apple Calendar",
      icon: CalendarClock,
      status: "Nativo futuro",
      tone: "attention",
      body: "EventKit para eventos e participantes autorizados quando o Grafy evoluir para app nativo ou wrapper mobile.",
      action: "Planejar EventKit",
      data: ["eventos", "participantes", "local", "follow-up"]
    },
    {
      name: "LinkedIn",
      icon: Link2,
      status: "Oficial/assistido",
      tone: "attention",
      body: "API oficial ou enriquecimento assistido para cargo, empresa e URL pública. Sem scraping logado.",
      action: "Ver requisitos LinkedIn",
      data: ["cargo", "empresa", "URL pública", "revisão"]
    },
    {
      name: "Meetup",
      icon: CalendarClock,
      status: "GraphQL futuro",
      tone: "attention",
      body: "OAuth e GraphQL para grupos, eventos e temas autorizados, útil para dar contexto de comunidade ao grafo.",
      action: "Mapear Meetup",
      data: ["eventos", "grupos", "temas", "local"]
    },
    {
      name: "Instagram",
      icon: Eye,
      status: "Futuro",
      tone: "",
      body: "Integração futura depende das permissões oficiais da Meta. Útil para perfis autorizados e links sociais.",
      action: "Mapear Meta API",
      data: ["perfil autorizado", "links", "sinais públicos"]
    },
    {
      name: "X / Twitter",
      icon: MessageSquare,
      status: "Futuro",
      tone: "",
      body: "Integração futura para links e sinais públicos autorizados, sem importar rede privada sem consentimento.",
      action: "Planejar X API",
      data: ["links", "bio pública", "sinais autorizados"]
    },
    {
      name: "Telefone / WhatsApp",
      icon: Phone,
      status: "Ativo no MVP",
      tone: "live",
      body: "Normalização de telefones, DDD, WhatsApp e contatos importados de CSV/Google.",
      action: "Validar telefones",
      data: ["telefone", "DDD", "WhatsApp", "dedupe"]
    },
    {
      name: "CSV / OpenAPI",
      icon: Database,
      status: "Preparado",
      tone: "live",
      body: "Importação por Excel, CSV, JSON e contrato base para evoluir integrações corporativas, webhooks e documentação Swagger.",
      action: "Revisar contrato",
      data: ["Excel", "CSV", "JSON", "preview", "merge", "docs"]
    }
  ];

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    addCustomField({
      id: uid("cf"),
      scope: "user",
      name,
      key: name.toLowerCase().replace(/\s+/g, "_"),
      type,
      options: [],
      isFilterable: true
    });
    setName("");
  };

  const resetPrototypeAccount = () => {
    const shouldReset = window.confirm("Apagar a conta de teste deste navegador? Isso remove contatos, grupos e sessão local do protótipo.");
    if (!shouldReset) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SESSION_KEY);
    setState(initialState);
    onLogout();
  };

  return (
    <div className="screen settings-screen">
      <section className="settings-panel">
        <h2>Campos personalizados</h2>
        <form className="inline-form" onSubmit={submit}>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome do campo" />
          <select value={type} onChange={(event) => setType(event.target.value as CustomField["type"])}>
            <option value="short_text">Texto curto</option>
            <option value="long_text">Texto longo</option>
            <option value="number">Número</option>
            <option value="select">Dropdown</option>
            <option value="checkbox">Checkbox</option>
            <option value="multiselect">Multiselect</option>
            <option value="date">Data</option>
          </select>
          <button className="primary-button" type="submit">
            <Plus size={17} />
            Adicionar
          </button>
        </form>
        <div className="field-list">
          {state.customFields.map((field) => (
            <div key={field.id} className="field-row">
              <Filter size={17} />
              <div>
                <strong>{field.name}</strong>
                <span>{field.type} · {field.scope}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="settings-panel">
        <h2>Central de integrações</h2>
        <p className="panel-note">
          Aqui ficam as conexões que vão transformar email, LinkedIn, telefone e redes sociais em uma rede neural de oportunidades.
          No protótipo, os botões mostram o caminho seguro; a conexão real exige OAuth, backend e permissões oficiais.
        </p>
        <div className="connector-settings-grid">
          {connectorSettings.map((connector) => {
            const Icon = connector.icon;
            return (
              <button
                key={connector.name}
                className="connector-setting"
                onClick={() => setConnectorStatus(`${connector.name}: ${connector.body}`)}
              >
                <Icon size={18} />
                <span>
                  <strong>{connector.name}</strong>
                  <small>{connector.action}</small>
                  <em className={`status-pill ${connector.tone}`}>{connector.status}</em>
                  <p>{connector.body}</p>
                  <span className="connector-data-list">
                    {connector.data.map((item) => <i key={item}>{item}</i>)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="integration-note">{connectorStatus}</p>
      </section>

      <section className="settings-panel consent-panel">
        <h2>Consentimento e preview</h2>
        <p className="panel-note">
          Toda integração real precisa mostrar o que será importado antes de salvar. O fluxo certo é conectar, normalizar,
          revisar duplicados, aprovar enriquecimento e só então atualizar contatos, tags, pastas e grafo.
        </p>
        <div className="workflow-steps compact">
          {["OAuth oficial", "Preview de dados", "Merge com aprovação", "Atualização do grafo"].map((step, index) => (
            <div className="workflow-step" key={step}>
              <span>{index + 1}</span>
              <div>
                <strong>{step}</strong>
                <p>{index === 0 ? "Sem senha salva e sem scraping de sessão." : "Usuário confirma antes de gravar."}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="settings-panel">
        <h2>Base técnica</h2>
        <div className="architecture-list">
          <Info icon={ShieldCheck} label="Segurança" value="RLS Supabase planejado no PRD" />
          <Info icon={Database} label="Persistência" value="Dados salvos neste navegador; Supabase na etapa de produção" />
          <Info icon={Network} label="Grafo" value="Adapter visual pronto para evoluir para Sigma.js" />
          <Info icon={Bot} label="Copiloto" value="Busca estruturada hoje, tools IA na próxima fase" />
        </div>
      </section>

      <section className="settings-panel danger-zone">
        <h2>Conta de teste</h2>
        <p>
          Sessão atual: <strong>{sessionEmail}</strong>. Como este deploy é demonstrativo, apagar a conta remove somente os dados
          salvos neste navegador.
        </p>
        <button className="danger-button" onClick={resetPrototypeAccount}>
          <Trash2 size={17} />
          Apagar conta de teste
        </button>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value, tone }: { icon: typeof Home; label: string; value: number | string; tone: string }) {
  return (
    <article className={`metric-card ${tone}`}>
      <Icon size={20} />
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </article>
  );
}

function Panel({ title, children, action, onAction }: { title: string; children: React.ReactNode; action?: string; onAction?: () => void }) {
  return (
    <section className="panel">
      <header>
        <h3>{title}</h3>
        {action && <button onClick={onAction}>{action}<ChevronRight size={15} /></button>}
      </header>
      {children}
    </section>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: string }) {
  return (
    <div className="info-card">
      <Icon size={17} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state">
      <Sparkles size={24} />
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

export default App;
