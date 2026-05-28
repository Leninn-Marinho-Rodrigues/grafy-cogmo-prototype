import type { Contact, GrafyState, GraphEdge, GraphNode, MergeSuggestion } from "./types";

export const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

export const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export const normalizePhone = (value: string) => value.replace(/\D/g, "");

export const extractDdd = (phone: string) => {
  const digits = normalizePhone(phone);
  if (digits.length >= 12 && digits.startsWith("55")) return digits.slice(2, 4);
  if (digits.length >= 10) return digits.slice(0, 2);
  return "";
};

export const unique = <T,>(items: T[]) => Array.from(new Set(items.filter(Boolean)));

export const splitList = (value: string) =>
  unique(
    value
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
  );

export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export const formatDate = (value?: string) => {
  if (!value) return "Sem data";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date);
};

export const contactHaystack = (contact: Contact) =>
  normalize(
    [
      contact.name,
      contact.headline,
      contact.description,
      contact.tags.join(" "),
      contact.currentDemand,
      contact.problemSolves,
      contact.notes,
      contact.ddd,
      contact.source,
      contact.emails.join(" "),
      contact.phones.join(" "),
      contact.links.map((link) => link.value).join(" "),
      Object.values(contact.customFields).join(" ")
    ].join(" ")
  );

export const scoreContact = (contact: Contact, query: string) => {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return 1;
  const terms = unique(normalizedQuery.split(/\s+/).filter((term) => term.length > 2));
  if (!terms.length) return 1;
  const haystack = contactHaystack(contact);
  let score = 0;
  for (const term of terms) {
    if (normalize(contact.name).includes(term)) score += 7;
    if (contact.tags.some((tag) => normalize(tag).includes(term))) score += 6;
    if (normalize(contact.problemSolves).includes(term)) score += 5;
    if (normalize(contact.currentDemand).includes(term)) score += 5;
    if (normalize(contact.description).includes(term)) score += 3;
    if (haystack.includes(term)) score += 1;
  }
  return score;
};

export const searchContacts = (contacts: Contact[], query: string) =>
  contacts
    .map((contact) => ({ contact, score: scoreContact(contact, query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.contact);

export const getAllTags = (contacts: Contact[]) =>
  unique(contacts.flatMap((contact) => contact.tags)).sort((a, b) => a.localeCompare(b));

export const getMergeSuggestions = (contacts: Contact[]): MergeSuggestion[] => {
  const suggestions: MergeSuggestion[] = [];
  for (let i = 0; i < contacts.length; i += 1) {
    for (let j = i + 1; j < contacts.length; j += 1) {
      const first = contacts[i];
      const second = contacts[j];
      const emailsA = first.emails.map((email) => normalize(email));
      const emailsB = second.emails.map((email) => normalize(email));
      const phonesA = first.phones.map(normalizePhone);
      const phonesB = second.phones.map(normalizePhone);
      const sameEmail = emailsA.some((email) => emailsB.includes(email));
      const samePhone = phonesA.some((phone) => phone && phonesB.includes(phone));
      if (sameEmail || samePhone) {
        suggestions.push({
          id: `${first.id}_${second.id}`,
          contactA: first,
          contactB: second,
          reason: sameEmail ? "email normalizado igual" : "telefone normalizado igual",
          confidence: sameEmail && samePhone ? 0.98 : 0.86
        });
      }
    }
  }
  return suggestions;
};

export const mergeContacts = (primary: Contact, duplicate: Contact): Contact => ({
  ...primary,
  headline: primary.headline || duplicate.headline,
  description: primary.description || duplicate.description,
  currentDemand: primary.currentDemand || duplicate.currentDemand,
  problemSolves: primary.problemSolves || duplicate.problemSolves,
  notes: unique([primary.notes, duplicate.notes]).join("\n"),
  tags: unique([...primary.tags, ...duplicate.tags]),
  phones: unique([...primary.phones, ...duplicate.phones]),
  emails: unique([...primary.emails, ...duplicate.emails]),
  links: unique([...primary.links, ...duplicate.links].map((link) => `${link.kind}:${link.value}`)).map((item) => {
    const [kind, ...rest] = item.split(":");
    return { kind: kind as Contact["links"][number]["kind"], value: rest.join(":") };
  }),
  groupIds: unique([...primary.groupIds, ...duplicate.groupIds]),
  isPublic: primary.isPublic || duplicate.isPublic,
  customFields: { ...duplicate.customFields, ...primary.customFields },
  updatedAt: new Date().toISOString()
});

export const buildOpportunityMatches = (contacts: Contact[]) =>
  contacts
    .flatMap((seeker) =>
      contacts
        .filter((solver) => solver.id !== seeker.id)
        .map((solver) => {
          const demand = normalize(`${seeker.currentDemand} ${seeker.tags.join(" ")}`);
          const solution = normalize(`${solver.problemSolves} ${solver.tags.join(" ")} ${solver.description}`);
          const matchingTags = seeker.tags.filter((tag) => solution.includes(normalize(tag)));
          const demandTerms = unique(demand.split(/\s+/).filter((term) => term.length > 4));
          const termHits = demandTerms.filter((term) => solution.includes(term));
          const sameGroup = seeker.groupIds.some((groupId) => solver.groupIds.includes(groupId));
          const sameDdd = seeker.ddd && seeker.ddd === solver.ddd;
          const score = matchingTags.length * 20 + termHits.length * 12 + (sameGroup ? 15 : 0) + (sameDdd ? 8 : 0);
          return { seeker, solver, score, reason: unique([...matchingTags, ...termHits]).slice(0, 4).join(", ") };
        })
        .filter((match) => match.score >= 24)
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

export const parseCsvContacts = (csv: string): Partial<Contact>[] => {
  const rows = csv
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean);
  if (rows.length < 2) return [];
  const delimiter = rows[0].includes(";") ? ";" : ",";
  const headers = rows[0].split(delimiter).map((header) => normalize(header).replace(/\s+/g, "_"));
  return rows.slice(1).map((row) => {
    const values = row.split(delimiter).map((value) => value.trim());
    const record = headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = values[index] ?? "";
      return acc;
    }, {});
    const phones = splitList(record.telefone || record.phone || record.celular || "");
    return {
      name: record.nome || record.name || "Contato sem nome",
      headline: record.cargo || record.headline || "",
      description: record.descricao || record.description || "",
      emails: splitList(record.email || record.emails || ""),
      phones,
      ddd: extractDdd(phones[0] ?? ""),
      tags: splitList(record.tags || record.tag || ""),
      currentDemand: record.demanda || record.current_demand || "",
      problemSolves: record.resolve || record.problem_solves || "",
      source: "CSV"
    };
  });
};

export const buildGraph = (state: GrafyState, query = "", groupId?: string) => {
  const filteredContacts = searchContacts(
    groupId ? state.contacts.filter((contact) => contact.groupIds.includes(groupId)) : state.contacts,
    query
  );
  const contacts = query ? filteredContacts : groupId ? state.contacts.filter((contact) => contact.groupIds.includes(groupId)) : state.contacts;
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const centerX = 480;
  const centerY = 315;
  const contactRadius = 178;
  const tagRadius = 270;

  contacts.forEach((contact, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(contacts.length, 1) - Math.PI / 2;
    nodes.push({
      id: `contact:${contact.id}`,
      label: contact.name,
      type: contact.isPublic ? "public" : "contact",
      x: centerX + Math.cos(angle) * contactRadius,
      y: centerY + Math.sin(angle) * contactRadius,
      contactId: contact.id,
      weight: 12 + contact.tags.length * 2
    });
  });

  const tags = getAllTags(contacts).slice(0, 18);
  tags.forEach((tag, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(tags.length, 1) + Math.PI / 10;
    const nodeId = `tag:${tag}`;
    nodes.push({
      id: nodeId,
      label: tag,
      type: "tag",
      x: centerX + Math.cos(angle) * tagRadius,
      y: centerY + Math.sin(angle) * tagRadius,
      weight: 8
    });
    contacts
      .filter((contact) => contact.tags.includes(tag))
      .forEach((contact) => {
        edges.push({
          id: `${contact.id}-${tag}`,
          source: `contact:${contact.id}`,
          target: nodeId,
          type: "possui tag",
          weight: 1
        });
      });
  });

  const ddds = unique(contacts.map((contact) => contact.ddd).filter(Boolean)).slice(0, 8);
  ddds.forEach((ddd, index) => {
    const nodeId = `ddd:${ddd}`;
    nodes.push({
      id: nodeId,
      label: `DDD ${ddd}`,
      type: "ddd",
      x: 120,
      y: 90 + index * 70,
      weight: 7
    });
    contacts
      .filter((contact) => contact.ddd === ddd)
      .forEach((contact) => {
        edges.push({ id: `${contact.id}-ddd-${ddd}`, source: `contact:${contact.id}`, target: nodeId, type: "tem DDD", weight: 1 });
      });
  });

  const sources = unique(contacts.map((contact) => contact.source)).slice(0, 6);
  sources.forEach((source, index) => {
    const nodeId = `source:${source}`;
    nodes.push({
      id: nodeId,
      label: source,
      type: "source",
      x: 840,
      y: 112 + index * 76,
      weight: 7
    });
    contacts
      .filter((contact) => contact.source === source)
      .forEach((contact) => {
        edges.push({
          id: `${contact.id}-source-${source}`,
          source: `contact:${contact.id}`,
          target: nodeId,
          type: "importado de",
          weight: 1
        });
      });
  });

  state.groups
    .filter((group) => !groupId || group.id === groupId)
    .forEach((group, index) => {
      const nodeId = `group:${group.id}`;
      nodes.push({
        id: nodeId,
        label: group.name,
        type: "group",
        x: 220 + index * 230,
        y: 580,
        weight: 9
      });
      group.contactIds
        .filter((contactId) => contacts.some((contact) => contact.id === contactId))
        .forEach((contactId) => {
          edges.push({ id: `${contactId}-${group.id}`, source: `contact:${contactId}`, target: nodeId, type: "pertence ao grupo", weight: 2 });
        });
    });

  buildOpportunityMatches(contacts).slice(0, 5).forEach((match) => {
    edges.push({
      id: `match:${match.seeker.id}:${match.solver.id}`,
      source: `contact:${match.seeker.id}`,
      target: `contact:${match.solver.id}`,
      type: "potencial match",
      weight: 3
    });
  });

  return { nodes, edges };
};

export const makeAssistantAnswer = (prompt: string, state: GrafyState) => {
  const normalized = normalize(prompt);
  const duplicateWords = ["duplicado", "duplicados", "merge"];
  if (duplicateWords.some((word) => normalized.includes(word))) {
    const suggestions = getMergeSuggestions(state.contacts);
    return {
      content:
        suggestions.length > 0
          ? `Encontrei ${suggestions.length} possivel duplicado. O caso mais forte e ${suggestions[0].contactA.name} com ${suggestions[0].contactB.name}, por ${suggestions[0].reason}.`
          : "Nao encontrei duplicados por email ou telefone normalizado.",
      resultContactIds: suggestions.flatMap((suggestion) => [suggestion.contactA.id, suggestion.contactB.id])
    };
  }

  if (normalized.includes("oportunidade") || normalized.includes("match") || normalized.includes("conectar")) {
    const matches = buildOpportunityMatches(state.contacts);
    return {
      content: matches.length
        ? `Achei ${matches.length} oportunidades de complementaridade. A melhor sugestao e conectar ${matches[0].seeker.name} com ${matches[0].solver.name}. Motivo: ${matches[0].reason || "demanda e solucao proximas"}.`
        : "Ainda nao encontrei complementaridades fortes. Complete demandas e problemas resolvidos para melhorar os matches.",
      resultContactIds: matches.flatMap((match) => [match.seeker.id, match.solver.id])
    };
  }

  const dddMatch = normalized.match(/\bddd\s?(\d{2})\b/) || normalized.match(/\b(\d{2})\b/);
  if (dddMatch && normalized.includes("ddd")) {
    const ddd = dddMatch[1];
    const contacts = state.contacts.filter((contact) => contact.ddd === ddd);
    return {
      content: contacts.length ? `Encontrei ${contacts.length} contato(s) com DDD ${ddd}.` : `Nao encontrei contatos com DDD ${ddd}.`,
      resultContactIds: contacts.map((contact) => contact.id)
    };
  }

  const contacts = searchContacts(state.contacts, prompt).slice(0, 6);
  const intent = normalized.includes("busca") || normalized.includes("demanda") || normalized.includes("procur")
    ? "demanda"
    : normalized.includes("resolve") || normalized.includes("presta") || normalized.includes("servico") || normalized.includes("ajuda")
      ? "solucao"
      : "busca";
  const content = contacts.length
    ? `Encontrei ${contacts.length} resultado(s) por ${intent}. Destaques: ${contacts
        .slice(0, 3)
        .map((contact) => contact.name)
        .join(", ")}.`
    : "Nao encontrei resultados fortes. Tente usar uma tag, DDD, demanda ou problema resolvido.";
  return { content, resultContactIds: contacts.map((contact) => contact.id) };
};
