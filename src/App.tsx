import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Bot,
  CalendarClock,
  Check,
  ChevronRight,
  CircleDot,
  ContactRound,
  Database,
  Download,
  Eye,
  Filter,
  Globe2,
  Home,
  Import,
  KeyRound,
  Link2,
  Lock,
  LogOut,
  Mail,
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
import { initialState } from "./data";
import {
  buildGraph,
  buildOpportunityMatches,
  extractDdd,
  formatDate,
  getAllTags,
  getGraphFilterTags,
  getMergeSuggestions,
  graphFilterGroups,
  initials,
  makeAssistantAnswer,
  mergeContacts,
  parseCsvContacts,
  searchContacts,
  splitList,
  uid,
  unique
} from "./lib";
import type { Contact, CustomField, GrafyState, GraphNode, LinkKind, ViewKey } from "./types";

const STORAGE_KEY = "grafy-state-v2";
const SESSION_KEY = "grafy-session-v2";
const APP_SCHEMA_VERSION = "ux-neural-2026-05-28";

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
  const currentContacts = state.contacts?.length ? state.contacts : initialState.contacts;
  const contactsById = new Map(currentContacts.map((contact) => [contact.id, contact]));
  const hydratedContacts = [
    ...initialState.contacts.map((seedContact) => {
      const currentContact = contactsById.get(seedContact.id);
      if (!needsDemoDataRefresh || !currentContact) return currentContact ?? seedContact;
      return {
        ...seedContact,
        ...currentContact,
        tags: unique([...seedContact.tags, ...(currentContact.tags ?? [])]),
        links: currentContact.links ?? seedContact.links,
        groupIds: unique([...seedContact.groupIds, ...(currentContact.groupIds ?? [])]),
        customFields: { ...seedContact.customFields, ...(currentContact.customFields ?? {}) }
      };
    }),
    ...currentContacts.filter((contact) => !initialState.contacts.some((seedContact) => seedContact.id === contact.id))
  ];
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
      contactIds: group.contactIds ?? [],
      members: group.members ?? []
    })),
    customFields: state.customFields ?? initialState.customFields,
    chatMessages: state.chatMessages ?? initialState.chatMessages
  };
}

function NetworkBackdrop({ className = "", density = 72, interactive = true }: { className?: string; density?: number; interactive?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef({ x: -9999, y: -9999, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let animationFrame = 0;
    let width = 0;
    let height = 0;
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
        active: event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom
      };
      document.documentElement.style.setProperty("--pointer-x", `${event.clientX}px`);
      document.documentElement.style.setProperty("--pointer-y", `${event.clientY}px`);
    };

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);
      const points = particles.map((particle) => {
        particle.x += particle.vx / Math.max(width, 1);
        particle.y += particle.vy / Math.max(height, 1);
        if (particle.x < -0.04) particle.x = 1.04;
        if (particle.x > 1.04) particle.x = -0.04;
        if (particle.y < -0.04) particle.y = 1.04;
        if (particle.y > 1.04) particle.y = -0.04;
        const baseX = particle.x * width + Math.cos(time / 1200 + particle.phase) * 8;
        const baseY = particle.y * height + Math.sin(time / 1500 + particle.phase) * 8;
        const pointer = pointerRef.current;
        const distanceToPointer = pointer.active ? Math.hypot(pointer.x - baseX, pointer.y - baseY) : 9999;
        const pull = pointer.active && distanceToPointer < 220 ? (1 - distanceToPointer / 220) * 0.12 : 0;
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
          const opacity = (1 - distance / 150) * 0.22;
          context.strokeStyle = `rgba(125, 201, 255, ${opacity})`;
          context.lineWidth = distance < 72 ? 1.05 : 0.7;
          context.beginPath();
          context.moveTo(first.px, first.py);
          context.lineTo(second.px, second.py);
          context.stroke();
        }
      }

      if (pointerRef.current.active && interactive) {
        const pointer = pointerRef.current;
        for (const point of points) {
          if (point.distanceToPointer > 230) continue;
          const opacity = (1 - point.distanceToPointer / 230) * 0.62;
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
        gradient.addColorStop(0, "rgba(88, 166, 255, 0.22)");
        gradient.addColorStop(0.42, "rgba(63, 185, 80, 0.08)");
        gradient.addColorStop(1, "rgba(88, 166, 255, 0)");
        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);

        context.beginPath();
        context.strokeStyle = "rgba(96, 242, 213, 0.42)";
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
      animationFrame = requestAnimationFrame(draw);
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
    setState((current) => ({ ...current, contacts: [contact, ...current.contacts] }));
    setSelectedContactId(contact.id);
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

  if (!session) {
    return <AuthScreen onLogin={(email) => setSession({ email })} />;
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

function AuthScreen({ onLogin }: { onLogin: (email: string) => void }) {
  const [email, setEmail] = useState("lenin@grafy.local");
  const [password, setPassword] = useState("grafy-demo");
  const [status, setStatus] = useState("");
  const googleClientConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onLogin(email || "usuario@grafy.local");
  };

  const handleGoogleLogin = () => {
    if (!googleClientConfigured) {
      setStatus("Google ainda não está configurado neste ambiente. Adicione VITE_GOOGLE_CLIENT_ID e o fluxo OAuth para ativar login e contatos reais.");
      return;
    }
    setStatus("Cliente Google detectado. A próxima etapa é conectar OAuth seguro com Supabase e People API.");
  };

  return (
    <div className="auth-page">
      <NetworkBackdrop className="auth-live-network" density={96} />
      <header className="auth-topbar">
        <button className="brand horizontal" aria-label="Grafy">
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
          <span>Google Contacts ready</span>
          <span>PWA mobile-first</span>
        </div>
      </header>

      <motion.section
        className="auth-hero auth-hero-grid"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <div className="auth-copy">
          <h1>
            <span>Sua rede,</span>
            <span className="gradient-text">mapeada e conectada</span>
          </h1>
          <p>
            Transforme contatos soltos em um mapa vivo de pessoas, demandas, problemas resolvidos, grupos e oportunidades
            de introdução.
          </p>
          <div className="auth-proof">
            <span><Lock size={15} /> dados privados</span>
            <span><Network size={15} /> grafo interativo</span>
            <span><Sparkles size={15} /> inteligência de networking</span>
          </div>
          <div className="auth-value-grid">
            <Info icon={ContactRound} label="Contatos" value="Importe, dedupe e qualifique sua base" />
            <Info icon={Users} label="Grupos" value="Comunidades e eventos com grafo próprio" />
            <Info icon={Bot} label="Copiloto" value="Pergunte quem resolve, busca ou conecta" />
          </div>
        </div>

        <div className="auth-product-column">
          <motion.div
            className="product-preview"
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
          >
            <div className="preview-header">
              <span className="status-dot live" />
              <div>
                <strong>Mapa ativo da rede</strong>
                <small>Founders, fornecedores, investidores e comunidade</small>
              </div>
            </div>
            <div className="preview-network">
              <NetworkBackdrop density={34} interactive={false} />
              <div className="preview-node main">LR</div>
              <div className="preview-node n1">CTO</div>
              <div className="preview-node n2">MKT</div>
              <div className="preview-node n3">PME</div>
              <div className="preview-node n4">IA</div>
            </div>
            <div className="preview-insights">
              <div>
                <span>Match sugerido</span>
                <strong>Ana precisa de CTO. Bruno recruta lideranças tech.</strong>
              </div>
              <div>
                <span>Demanda recente</span>
                <strong>3 contatos procuram comunidades empresariais.</strong>
              </div>
            </div>
          </motion.div>

          <form className="auth-card" onSubmit={submit}>
            <div className="auth-card-head">
              <div>
                <h2>Entrar no protótipo</h2>
                <p>Use seu email para criar um workspace local de teste neste navegador.</p>
              </div>
              <span className="status-dot live" />
            </div>
            <button className="google-button" type="button" onClick={handleGoogleLogin}>
              <Globe2 size={18} />
              Continuar com Google
              <small>{googleClientConfigured ? "configurado" : "não configurado"}</small>
            </button>
            <div className="auth-divider"><span>ou entre com email</span></div>
            <label>
              Email
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="voce@empresa.com" />
            </label>
            <label>
              Senha
              <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="sua senha" />
            </label>
            <button className="primary-button" type="submit">
              <KeyRound size={18} />
              Criar / entrar
            </button>
            <button className="secondary-button" type="button" onClick={() => onLogin(email || "usuario@grafy.local")}>
              <Mail size={18} />
              Entrar sem senha real
            </button>
            <p className="prototype-note">
              Ambiente demonstrativo: dados ficam somente neste navegador. Login real com Supabase/Google entra na próxima fase.
            </p>
            {status && <p className="auth-status">{status}</p>}
          </form>
        </div>
      </motion.section>

      <LandingSections onLogin={() => onLogin(email || "usuario@grafy.local")} />
    </div>
  );
}

function LandingSections({ onLogin }: { onLogin: () => void }) {
  const sections = [
    {
      icon: ContactRound,
      title: "Contatos deixam de ser uma lista fria",
      body: "Cada pessoa carrega demandas, problemas que resolve, tags, origem, DDD, grupos e vínculos públicos. O Grafy transforma isso em contexto navegável.",
      stat: "12 contatos demo",
      meta: "dedupe, tags e campos"
    },
    {
      icon: Network,
      title: "O grafo vira uma camada de leitura da rede",
      body: "Pessoas, tags, fontes, grupos e oportunidades aparecem como nós conectados. O usuário filtra, aproxima, clica e entende caminhos de introdução.",
      stat: "38+ relações",
      meta: "matches e filtros"
    },
    {
      icon: Bot,
      title: "Busca e copiloto ajudam a achar a pessoa certa",
      body: "Perguntas como quem resolve limpeza, quem busca investimento ou quem está em determinado DDD retornam contatos relevantes com explicação.",
      stat: "busca estruturada",
      meta: "pronto para IA"
    }
  ];

  return (
    <div className="landing-flow">
      <motion.section
        className="landing-band split"
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.65, ease: "easeOut" }}
      >
        <div>
          <span className="context public">como funciona</span>
          <h2>Uma base privada, uma rede pública opcional e grupos com inteligência própria.</h2>
          <p>
            O PRD do Grafy pede um CRM pessoal de networking, mas com camadas de comunidade. A landing agora mostra essa
            arquitetura antes do usuário entrar, sem misturar tudo em uma tela apertada.
          </p>
        </div>
        <div className="flow-rail">
          {["Importar contatos", "Enriquecer contexto", "Sugerir matches", "Navegar pelo grafo"].map((item, index) => (
            <div className="flow-step-card" key={item}>
              <span>{index + 1}</span>
              <strong>{item}</strong>
            </div>
          ))}
        </div>
      </motion.section>

      <section className="landing-card-grid">
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <motion.article
              className="landing-feature-card spotlight-card"
              key={section.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.55, delay: index * 0.08, ease: "easeOut" }}
            >
              <span className="feature-icon"><Icon size={20} /></span>
              <h3>{section.title}</h3>
              <p>{section.body}</p>
              <div>
                <strong>{section.stat}</strong>
                <small>{section.meta}</small>
              </div>
            </motion.article>
          );
        })}
      </section>

      <motion.section
        className="landing-band visual"
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.65, ease: "easeOut" }}
      >
        <div className="visual-copy">
          <span className="context group">experiencia visual</span>
          <h2>O fundo acompanha o mouse para a rede parecer viva.</h2>
          <p>
            A camada de partículas usa canvas leve, conexões dinâmicas e um spotlight que reage ao cursor. Isso conversa
            com a ideia central do produto: uma rede que responde quando você explora.
          </p>
          <button className="primary-button glow-button" onClick={onLogin}>
            <Sparkles size={18} />
            Abrir protótipo
          </button>
        </div>
        <div className="landing-orbit">
          <NetworkBackdrop density={40} interactive={false} />
          <span className="orbit-person main">Grafy</span>
          <span className="orbit-person a">Eventos</span>
          <span className="orbit-person b">Founders</span>
          <span className="orbit-person c">PMEs</span>
          <span className="orbit-person d">IA</span>
        </div>
      </motion.section>
    </div>
  );
}

function Dashboard({ state, setView, setSelectedContactId }: AppShellProps) {
  const tags = getAllTags(state.contacts);
  const duplicates = getMergeSuggestions(state.contacts);
  const matches = buildOpportunityMatches(state.contacts);
  const publicCount = state.contacts.filter((contact) => contact.isPublic).length;
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
          ["2", "Importação", "CSV pronto, Google pendente"],
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
              <span key={tag} className="tag-chip">{tag}</span>
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
            <button key={item} className={tag === item ? "filter-chip active" : "filter-chip"} onClick={() => setTag(item)}>
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
        <Info icon={CircleDot} label="DDD" value={contact.ddd ? `DDD ${contact.ddd}` : "Não calculado"} />
        <Info icon={Database} label="Fonte" value={contact.source} />
      </div>

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

function ImportView({ addContact, state, setView }: AppShellProps) {
  const exampleCsv = `nome,email,telefone,tags,descricao,demanda,resolve
Paula Andrade,paula@pa.com,85999990000,"educação,IA,treinamento,B2B","Treinadora corporativa em IA","Busca empresas para programas de capacitação","Treinamentos de IA aplicada"
Diego Martins,diego@ops.com,11933334444,"operações,logística,PME,consultoria","Consultor de operações","Procura PMEs com gargalos operacionais","Melhora processos e indicadores"`;
  const [csv, setCsv] = useState(exampleCsv);
  const [googleStatus, setGoogleStatus] = useState("");
  const [linkedinQuery, setLinkedinQuery] = useState("");
  const preview = useMemo(() => parseCsvContacts(csv), [csv]);
  const googleClientConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const importContacts = () => {
    preview.forEach((partial) => {
      const phones = partial.phones ?? [];
      addContact({
        id: uid("ct"),
        name: partial.name ?? "Contato sem nome",
        headline: partial.headline ?? "",
        description: partial.description ?? "",
        tags: partial.tags ?? [],
        phones,
        emails: partial.emails ?? [],
        ddd: partial.ddd || extractDdd(phones[0] ?? ""),
        source: "CSV",
        currentDemand: partial.currentDemand ?? "",
        problemSolves: partial.problemSolves ?? "",
        notes: "Importado via CSV no Grafy.",
        links: [],
        isPublic: false,
        groupIds: [],
        customFields: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });
  };

  const connectGoogle = () => {
    if (!googleClientConfigured) {
      setGoogleStatus("Google Contacts ainda não está ativo. Configure VITE_GOOGLE_CLIENT_ID, origem OAuth e uma Edge Function/Supabase para usar People API com segurança.");
      return;
    }
    setGoogleStatus("Cliente Google encontrado. Próxima etapa: abrir consentimento OAuth e importar via People API.");
  };

  const openLinkedinResearch = (name: string) => {
    const query = `${name} LinkedIn cargo empresa`;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
  };

  const linkedinContacts = searchContacts(state.contacts, linkedinQuery).slice(0, 6);

  return (
    <div className="screen import-screen">
      <div className="import-grid">
        <section className="import-card">
          <h2>Importação CSV</h2>
          <p>Mapeamento automático para nome, email, telefone, tags, descrição, demanda e problema resolvido.</p>
          <textarea className="csv-box" value={csv} onChange={(event) => setCsv(event.target.value)} />
          <div className="button-row">
            <button className="secondary-button" onClick={() => setCsv(exampleCsv)}>
              <Download size={17} />
              Usar exemplo
            </button>
            <button className="primary-button" onClick={importContacts} disabled={!preview.length}>
              <Upload size={17} />
              Importar {preview.length}
            </button>
          </div>
        </section>

        <section className="import-card">
          <h2>Preview</h2>
          <div className="preview-list">
            {preview.map((contact, index) => (
              <div key={`${contact.name}-${index}`} className="preview-row">
                <span className="avatar small">{initials(contact.name ?? "?")}</span>
                <div>
                  <strong>{contact.name}</strong>
                  <span>{contact.emails?.[0]} · DDD {contact.ddd || "?"}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="integration-card tall">
          <div>
            <h3>Google / Gmail Contacts</h3>
            <p>
              Para puxar contatos reais do email, o Grafy precisa de OAuth Google, escopo de contatos e backend seguro para
              tokens. Este ambiente ainda não tem client id configurado.
            </p>
            {googleStatus && <p className="integration-note">{googleStatus}</p>}
          </div>
          <button className="secondary-button compact" onClick={connectGoogle}>
            <Globe2 size={16} />
            Testar Google
          </button>
          <span className={googleClientConfigured ? "status-pill live" : "status-pill"}>{googleClientConfigured ? "client id detectado" : "não configurado"}</span>
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
  const googleClientConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
  const openExternal = (url: string) => window.open(url, "_blank", "noopener,noreferrer");
  const connectors = [
    {
      name: "Google Contacts",
      icon: Globe2,
      status: googleClientConfigured ? "OAuth quase pronto" : "Precisa client id",
      tone: googleClientConfigured ? "live" : "",
      description:
        "Fonte principal para importar contatos reais do Gmail com consentimento, People API e backend seguro para tokens.",
      data: ["Nome", "emails", "telefones", "foto", "origem Google"],
      graph: ["importado de", "tem DDD", "possível duplicado"],
      action: "Abrir importação",
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
    }
  ];

  return (
    <div className="screen integrations-screen">
      <section className="integration-hero">
        <div>
          <span className="context public">arquitetura de dados</span>
          <h2>Conectores para dados reais de networking</h2>
          <p>
            O Grafy deve importar dados reais com consentimento, mostrar preview, sugerir merge e só enriquecer contatos
            quando o usuário aprovar. Essa é a base para usar Google, LinkedIn, Meetup e APIs futuras sem quebrar privacidade.
          </p>
        </div>
        <div className="connector-metrics">
          <Info icon={ContactRound} label="Base atual" value={`${state.contacts.length} contatos no protótipo`} />
          <Info icon={ShieldCheck} label="Privacidade" value="Contato privado por padrão, público só com opt-in" />
          <Info icon={Network} label="Grafo" value="Toda fonte vira nó, relação e filtro visual" />
        </div>
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

  const onWheel = (event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    setZoom((value) => Math.min(1.85, Math.max(0.55, value + (event.deltaY < 0 ? 0.08 : -0.08))));
  };

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
                      className={activeFilters.some((item) => normalizeGraphTag(item) === normalizeGraphTag(tag)) ? "filter-chip active" : "filter-chip"}
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

      <section className="graph-layout">
        <div className="graph-canvas">
          <NetworkBackdrop className="graph-canvas-network" density={42} interactive={false} />
          <svg
            viewBox="0 0 960 660"
            role="img"
            aria-label="Grafo de networking do Grafy"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPan}
            onPointerLeave={endPan}
            onWheel={onWheel}
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
                    style={{ "--edge-color": edge.color ?? "#7dc7ff" } as React.CSSProperties}
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

function shortGraphLabel(label: string) {
  if (label.length <= 18) return label;
  const [first, second] = label.split(" ");
  return second ? `${first} ${second[0]}.` : `${label.slice(0, 16)}...`;
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

      <div className="group-board">
        {state.groups.map((group) => {
          const contacts = state.contacts.filter((contact) => group.contactIds.includes(contact.id));
          const availableContacts = state.contacts.filter((contact) => !group.contactIds.includes(contact.id));
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
                {group.tags.map((tag) => <span className="tag-chip" key={tag}>{tag}</span>)}
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

      <div className="section-toolbar">
        <div className="search-box">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por tag, demanda ou problema resolvido" />
        </div>
        <button className="secondary-button compact" onClick={() => setView("graph")}>
          <Network size={16} />
          Ver no grafo
        </button>
      </div>

      <div className="filter-strip network-filter-strip">
        <button className={!tag ? "filter-chip active" : "filter-chip"} onClick={() => setTag("")}>Todos</button>
        {publicTags.map((item) => (
          <button key={item} className={tag === item ? "filter-chip active" : "filter-chip"} onClick={() => setTag(item)}>
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
              {state.profile.tags.map((tag) => <span className="tag-chip" key={tag}>{tag}</span>)}
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
              {contact.tags.slice(0, 5).map((tag) => <span className="tag-chip" key={tag}>{tag}</span>)}
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
                          <em>{contact!.tags.slice(0, 3).join(" · ")}</em>
                          <b>Resolve: {contact!.problemSolves.slice(0, 96) || "Sem descrição"}</b>
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
            {profile.tags.map((tag) => <span className="tag-chip" key={tag}>{tag}</span>)}
          </div>
        </div>
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
  const connectorSettings = [
    {
      name: "Google Contacts",
      icon: Globe2,
      body: "Login Google + People API para puxar nome, sobrenome, email, telefone e foto salvos pelo usuário.",
      action: "Preparar Google OAuth"
    },
    {
      name: "LinkedIn",
      icon: Link2,
      body: "API oficial ou enriquecimento assistido para cargo, empresa e URL pública. Sem scraping logado.",
      action: "Ver requisitos LinkedIn"
    },
    {
      name: "Instagram",
      icon: Eye,
      body: "Integração futura depende das permissões oficiais da Meta. Útil para perfis autorizados e links sociais.",
      action: "Mapear Meta API"
    },
    {
      name: "X / Twitter",
      icon: MessageSquare,
      body: "Integração futura para links e sinais públicos autorizados, sem importar rede privada sem consentimento.",
      action: "Planejar X API"
    },
    {
      name: "Telefone / WhatsApp",
      icon: Phone,
      body: "Normalização de telefones, DDD, WhatsApp e contatos importados de CSV/Google.",
      action: "Validar telefones"
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
                </span>
              </button>
            );
          })}
        </div>
        <p className="integration-note">{connectorStatus}</p>
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
