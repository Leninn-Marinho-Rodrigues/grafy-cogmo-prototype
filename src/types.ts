export type ViewKey =
  | "dashboard"
  | "contacts"
  | "import"
  | "integrations"
  | "graph"
  | "groups"
  | "public"
  | "chat"
  | "profile"
  | "settings";

export type LinkKind = "whatsapp" | "instagram" | "linkedin" | "url";

export type PublicVisibility = "private" | "groups" | "platform";

export type CustomFieldType =
  | "short_text"
  | "long_text"
  | "number"
  | "select"
  | "checkbox"
  | "multiselect"
  | "date";

export interface ContactLink {
  kind: LinkKind;
  value: string;
}

export interface Contact {
  id: string;
  name: string;
  headline: string;
  avatarUrl?: string;
  description: string;
  tags: string[];
  phones: string[];
  emails: string[];
  ddd?: string;
  source:
    | "Manual"
    | "CSV"
    | "JSON"
    | "Excel"
    | "Google Contacts"
    | "Google Calendar"
    | "Apple Contacts"
    | "Apple Calendar"
    | "Rede Pública"
    | "Grupo";
  currentDemand: string;
  problemSolves: string;
  notes: string;
  links: ContactLink[];
  isPublic: boolean;
  linkedUserId?: string;
  groupIds: string[];
  customFields: Record<string, string | number | boolean | string[]>;
  lastInteractionAt?: string;
  nextFollowUpAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  role: "admin" | "member" | "viewer";
  color: string;
  members: string[];
  contactIds: string[];
  tags: string[];
  createdAt: string;
}

export interface CustomField {
  id: string;
  scope: "user" | "group";
  groupId?: string;
  name: string;
  key: string;
  type: CustomFieldType;
  options: string[];
  isFilterable: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  headline: string;
  description: string;
  avatarUrl?: string;
  tags: string[];
  problemSolves: string;
  currentDemand: string;
  visibility: PublicVisibility;
  links: ContactLink[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  resultContactIds?: string[];
  createdAt: string;
}

export interface GrafyState {
  schemaVersion?: string;
  profile: UserProfile;
  contacts: Contact[];
  groups: Group[];
  customFields: CustomField[];
  chatMessages: ChatMessage[];
  completedOnboarding: boolean;
}

export interface MergeSuggestion {
  id: string;
  contactA: Contact;
  contactB: Contact;
  reason: string;
  confidence: number;
}

export interface GraphNode {
  id: string;
  label: string;
  type: "contact" | "tag" | "source" | "ddd" | "group" | "public" | "demand" | "solution";
  x: number;
  y: number;
  contactId?: string;
  weight: number;
  color?: string;
  isDimmed?: boolean;
  meta?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  weight: number;
  isDimmed?: boolean;
  color?: string;
}
