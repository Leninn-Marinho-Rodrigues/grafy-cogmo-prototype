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

export const dddLocationMap: Record<string, { label: string; state: string; region: string }> = {
  "11": { label: "São Paulo/SP", state: "SP", region: "Sudeste" },
  "12": { label: "Vale do Paraíba/SP", state: "SP", region: "Sudeste" },
  "13": { label: "Baixada Santista/SP", state: "SP", region: "Sudeste" },
  "14": { label: "Bauru/SP", state: "SP", region: "Sudeste" },
  "15": { label: "Sorocaba/SP", state: "SP", region: "Sudeste" },
  "16": { label: "Ribeirão Preto/SP", state: "SP", region: "Sudeste" },
  "17": { label: "São José do Rio Preto/SP", state: "SP", region: "Sudeste" },
  "18": { label: "Presidente Prudente/SP", state: "SP", region: "Sudeste" },
  "19": { label: "Campinas/SP", state: "SP", region: "Sudeste" },
  "21": { label: "Rio de Janeiro/RJ", state: "RJ", region: "Sudeste" },
  "22": { label: "Norte Fluminense/RJ", state: "RJ", region: "Sudeste" },
  "24": { label: "Sul Fluminense/RJ", state: "RJ", region: "Sudeste" },
  "27": { label: "Vitória/ES", state: "ES", region: "Sudeste" },
  "28": { label: "Sul do Espírito Santo/ES", state: "ES", region: "Sudeste" },
  "31": { label: "Belo Horizonte/MG", state: "MG", region: "Sudeste" },
  "32": { label: "Zona da Mata/MG", state: "MG", region: "Sudeste" },
  "33": { label: "Leste de Minas/MG", state: "MG", region: "Sudeste" },
  "34": { label: "Triângulo Mineiro/MG", state: "MG", region: "Sudeste" },
  "35": { label: "Sul de Minas/MG", state: "MG", region: "Sudeste" },
  "37": { label: "Centro-Oeste de Minas/MG", state: "MG", region: "Sudeste" },
  "38": { label: "Norte de Minas/MG", state: "MG", region: "Sudeste" },
  "41": { label: "Curitiba/PR", state: "PR", region: "Sul" },
  "42": { label: "Ponta Grossa/PR", state: "PR", region: "Sul" },
  "43": { label: "Londrina/PR", state: "PR", region: "Sul" },
  "44": { label: "Maringá/PR", state: "PR", region: "Sul" },
  "45": { label: "Foz do Iguaçu/PR", state: "PR", region: "Sul" },
  "46": { label: "Pato Branco/PR", state: "PR", region: "Sul" },
  "47": { label: "Joinville/SC", state: "SC", region: "Sul" },
  "48": { label: "Florianópolis/SC", state: "SC", region: "Sul" },
  "49": { label: "Oeste Catarinense/SC", state: "SC", region: "Sul" },
  "51": { label: "Porto Alegre/RS", state: "RS", region: "Sul" },
  "53": { label: "Pelotas/RS", state: "RS", region: "Sul" },
  "54": { label: "Caxias do Sul/RS", state: "RS", region: "Sul" },
  "55": { label: "Santa Maria/RS", state: "RS", region: "Sul" },
  "61": { label: "Brasília/DF", state: "DF", region: "Centro-Oeste" },
  "62": { label: "Goiânia/GO", state: "GO", region: "Centro-Oeste" },
  "63": { label: "Tocantins/TO", state: "TO", region: "Norte" },
  "64": { label: "Rio Verde/GO", state: "GO", region: "Centro-Oeste" },
  "65": { label: "Cuiabá/MT", state: "MT", region: "Centro-Oeste" },
  "66": { label: "Norte de Mato Grosso/MT", state: "MT", region: "Centro-Oeste" },
  "67": { label: "Campo Grande/MS", state: "MS", region: "Centro-Oeste" },
  "68": { label: "Acre/AC", state: "AC", region: "Norte" },
  "69": { label: "Rondônia/RO", state: "RO", region: "Norte" },
  "71": { label: "Salvador/BA", state: "BA", region: "Nordeste" },
  "73": { label: "Sul da Bahia/BA", state: "BA", region: "Nordeste" },
  "74": { label: "Juazeiro/BA", state: "BA", region: "Nordeste" },
  "75": { label: "Feira de Santana/BA", state: "BA", region: "Nordeste" },
  "77": { label: "Vitória da Conquista/BA", state: "BA", region: "Nordeste" },
  "79": { label: "Sergipe/SE", state: "SE", region: "Nordeste" },
  "81": { label: "Recife/PE", state: "PE", region: "Nordeste" },
  "82": { label: "Maceió/AL", state: "AL", region: "Nordeste" },
  "83": { label: "Paraíba/PB", state: "PB", region: "Nordeste" },
  "84": { label: "Rio Grande do Norte/RN", state: "RN", region: "Nordeste" },
  "85": { label: "Fortaleza/CE", state: "CE", region: "Nordeste" },
  "86": { label: "Teresina/PI", state: "PI", region: "Nordeste" },
  "87": { label: "Interior de Pernambuco/PE", state: "PE", region: "Nordeste" },
  "88": { label: "Interior do Ceará/CE", state: "CE", region: "Nordeste" },
  "89": { label: "Sul do Piauí/PI", state: "PI", region: "Nordeste" },
  "91": { label: "Belém/PA", state: "PA", region: "Norte" },
  "92": { label: "Manaus/AM", state: "AM", region: "Norte" },
  "93": { label: "Santarém/PA", state: "PA", region: "Norte" },
  "94": { label: "Marabá/PA", state: "PA", region: "Norte" },
  "95": { label: "Roraima/RR", state: "RR", region: "Norte" },
  "96": { label: "Amapá/AP", state: "AP", region: "Norte" },
  "97": { label: "Interior do Amazonas/AM", state: "AM", region: "Norte" },
  "98": { label: "São Luís/MA", state: "MA", region: "Nordeste" },
  "99": { label: "Interior do Maranhão/MA", state: "MA", region: "Nordeste" }
};

export const getDddLocation = (ddd?: string) => ddd ? dddLocationMap[ddd] ?? null : null;

export const formatDddLocation = (ddd?: string) => {
  if (!ddd) return "DDD não calculado";
  const location = getDddLocation(ddd);
  return location ? `DDD ${ddd} · ${location.label}` : `DDD ${ddd}`;
};

export const unique = <T,>(items: T[]) => Array.from(new Set(items.filter(Boolean)));

export const splitList = (value: string) =>
  unique(
    value
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
  );

const normalizeImportKey = (key: string) => normalize(key).replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

const toImportText = (value: unknown): string => {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) return value.map(toImportText).filter(Boolean).join(", ");
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") return "";
  return String(value).trim();
};

const splitImportValue = (value: unknown): string[] => {
  if (Array.isArray(value)) return unique(value.flatMap((item) => splitImportValue(item)));
  return splitList(toImportText(value));
};

const readImportValue = (record: Record<string, unknown>, aliases: string[]) => {
  const normalizedAliases = aliases.map(normalizeImportKey);
  const entry = Object.entries(record).find(([key]) => normalizedAliases.includes(normalizeImportKey(key)));
  return entry ? entry[1] : "";
};

const detectDelimiter = (input: string) => {
  const firstLine = input.split(/\r?\n/).find((line) => line.trim()) ?? "";
  const candidates = ["\t", ";", ","];
  return candidates
    .map((delimiter) => ({ delimiter, count: firstLine.split(delimiter).length }))
    .sort((a, b) => b.count - a.count)[0]?.delimiter ?? ",";
};

const parseDelimitedRows = (input: string, delimiter = detectDelimiter(input)) => {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === delimiter && !inQuotes) {
      row.push(current.trim());
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  row.push(current.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
};

const recordToContactPartial = (record: Record<string, unknown>, source: Contact["source"]): Partial<Contact> => {
  const emails = splitImportValue(readImportValue(record, ["email", "emails", "e_mail", "mail", "email_corporativo", "work_email"]));
  const phones = splitImportValue(readImportValue(record, ["telefone", "telefones", "phone", "phones", "celular", "mobile", "whatsapp"]));
  const company = toImportText(readImportValue(record, ["empresa", "company", "organization", "organizacao", "companhia", "org"]));
  const title = toImportText(readImportValue(record, ["cargo", "title", "job_title", "position", "funcao", "papel"]));
  const area = toImportText(readImportValue(record, ["area", "departamento", "department", "setor", "segmento", "industry"]));
  const ddd = extractDdd(phones[0] ?? "");
  const firstName = toImportText(readImportValue(record, ["nome", "name", "display_name", "nome_completo", "full_name", "participante", "membro", "contato"]));
  const composedName = unique([
    toImportText(readImportValue(record, ["first_name", "firstname", "primeiro_nome"])),
    toImportText(readImportValue(record, ["last_name", "lastname", "sobrenome"]))
  ]).join(" ");
  const name = firstName || composedName || emails[0] || phones[0] || "Contato sem nome";
  const currentDemand = toImportText(readImportValue(record, ["demanda", "current_demand", "currentDemand", "o_que_demanda", "precisa", "busca", "needs"]));
  const problemSolves = toImportText(readImportValue(record, ["resolve", "problem_solves", "problemSolves", "problema_que_resolve", "solucao", "solução", "oferece", "helps"]));
  const description = toImportText(readImportValue(record, ["descricao", "description", "bio", "resumo", "observacoes", "observações", "notes", "nota"]));
  const tags = unique([
    ...splitImportValue(readImportValue(record, ["tags", "tag", "interesses", "interests", "temas", "categorias", "category", "grupo", "groups", "trilha"])),
    area,
    title,
    company ? "empresa" : "",
    ddd ? `DDD ${ddd}` : ""
  ]);
  const links = [
    { kind: "linkedin" as const, value: toImportText(readImportValue(record, ["linkedin", "linkedIn", "linkedin_url", "perfil_linkedin"])) },
    { kind: "whatsapp" as const, value: toImportText(readImportValue(record, ["link_whatsapp", "whatsapp_url"])) },
    { kind: "instagram" as const, value: toImportText(readImportValue(record, ["instagram", "instagram_url"])) },
    { kind: "url" as const, value: toImportText(readImportValue(record, ["url", "site", "website", "link"])) }
  ].filter((link) => link.value);

  return {
    name,
    headline: unique([title, company, area]).join(" · "),
    description,
    emails,
    phones,
    ddd,
    tags,
    currentDemand,
    problemSolves,
    source,
    links,
    customFields: {
      empresa: company,
      cargo: title,
      area,
      localidadeDdd: formatDddLocation(ddd)
    }
  };
};

const recordsToContactPartials = (records: Array<Record<string, unknown>>, source: Contact["source"]) =>
  records
    .map((record) => recordToContactPartial(record, source))
    .filter((contact) => contact.name || contact.emails?.length || contact.phones?.length);

export const parseTabularContacts = (rows: unknown[][], source: Contact["source"] = "Excel"): Partial<Contact>[] => {
  const [headerRow, ...bodyRows] = rows.filter((row) => row.some((cell) => toImportText(cell)));
  if (!headerRow || !bodyRows.length) return [];
  const headers = headerRow.map((cell) => toImportText(cell));
  const records = bodyRows.map((row) =>
    headers.reduce<Record<string, unknown>>((record, header, index) => {
      if (header) record[header] = row[index] ?? "";
      return record;
    }, {})
  );
  return recordsToContactPartials(records, source);
};

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
      formatDddLocation(contact.ddd),
      getDddLocation(contact.ddd)?.region ?? "",
      contact.source,
      contact.emails.join(" "),
      contact.phones.join(" "),
      contact.links.map((link) => link.value).join(" "),
      Object.values(contact.customFields).join(" ")
    ].join(" ")
  );

const queryStopWords = new Set([
  "quem",
  "qual",
  "quais",
  "meu",
  "meus",
  "minha",
  "minhas",
  "contato",
  "contatos",
  "presta",
  "prestam",
  "servico",
  "servicos",
  "busca",
  "buscam",
  "procur",
  "procura",
  "procuram",
  "pode",
  "podem",
  "ajuda",
  "ajudar",
  "para",
  "com",
  "que",
  "esta",
  "estao",
  "entre",
  "dentre"
]);

export const scoreContact = (contact: Contact, query: string) => {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return 1;
  const terms = unique(
    normalizedQuery
      .split(/\s+/)
      .map((term) => term.replace(/[^\p{L}\p{N}]/gu, ""))
      .filter((term) => term.length > 2 && !queryStopWords.has(term))
  );
  if (!terms.length) return 1;
  const haystack = contactHaystack(contact);
  let score = 0;
  let termHitCount = 0;
  for (const term of terms) {
    let termScore = 0;
    if (normalize(contact.name).includes(term)) termScore += 7;
    if (contact.tags.some((tag) => normalize(tag).includes(term))) termScore += 6;
    if (normalize(contact.problemSolves).includes(term)) termScore += 5;
    if (normalize(contact.currentDemand).includes(term)) termScore += 5;
    if (normalize(contact.description).includes(term)) termScore += 3;
    if (haystack.includes(term)) termScore += 1;
    if (termScore > 0) termHitCount += 1;
    score += termScore;
  }
  if (terms.length > 1 && termHitCount < terms.length) return 0;
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

const customFieldText = (contact: Contact, key: string) => {
  const value = contact.customFields[key];
  if (Array.isArray(value)) return value.join(" ");
  if (typeof value === "boolean") return value ? "sim" : "";
  return value ? String(value) : "";
};

export const getContactTaxonomyTags = (contact: Contact, groups: GrafyState["groups"] = []) => {
  const contactGroups = groups.filter((group) => contact.groupIds.includes(group.id));
  const dddLocation = getDddLocation(contact.ddd);
  return unique([
    ...contact.tags,
    customFieldText(contact, "area"),
    customFieldText(contact, "cargo"),
    customFieldText(contact, "tipoNegocio"),
    contact.ddd ? `DDD ${contact.ddd}` : "",
    dddLocation?.label ?? "",
    dddLocation?.region ?? "",
    contact.source,
    ...contactGroups.flatMap((group) => [group.name, ...group.tags])
  ]).filter(Boolean);
};

export const graphFilterGroups = [
  { label: "Cargos", tags: ["CEO", "CTO", "CFO", "diretor", "diretoria", "decisor", "founder", "fundador", "head", "gerente", "especialista", "consultor", "fornecedor", "investidor", "mentor"] },
  { label: "Áreas", tags: ["marketing", "vendas", "finanças", "financeiro", "investimentos", "tecnologia", "produto", "jurídico", "operações", "eventos", "segurança", "RH", "customer success", "construção"] },
  { label: "Negócios", tags: ["B2B", "SaaS", "PME", "startups", "consultoria", "serviços B2B", "serviços locais", "fornecedores", "comunidade", "healthtech", "scale-up", "SaaS vertical", "Venture"] },
  { label: "Estratégia", tags: ["parcerias", "fundraising", "investimento", "contratos recorrentes", "growth", "compliance", "expansão", "recrutamento", "limpeza", "governança"] },
  { label: "Fontes", tags: ["Google Contacts", "Google Calendar", "Apple Contacts", "Apple Calendar", "CSV", "Manual", "Rede Pública"] },
  { label: "Localidade", tags: ["DDD 11", "DDD 21", "DDD 31", "DDD 41", "DDD 61", "DDD 81", "DDD 85", "São Paulo/SP", "Rio de Janeiro/RJ", "Belo Horizonte/MG", "Curitiba/PR", "Brasília/DF", "Recife/PE", "Fortaleza/CE", "Sudeste", "Nordeste", "Sul"] },
  { label: "Pastas", tags: ["Founders e Investidores", "Networking de Eventos", "Empresários Regionais", "decisores"] }
];

export const getGraphFilterTags = (contacts: Contact[], groups: GrafyState["groups"] = []) => {
  const existing = unique([
    ...contacts.flatMap((contact) => getContactTaxonomyTags(contact, groups)),
    ...groups.flatMap((group) => [group.name, ...group.tags])
  ]).map((tag) => ({ tag, normalized: normalize(tag) }));
  const curated = graphFilterGroups.flatMap((group) => group.tags);
  const suggested = curated.filter((tag) => existing.some((item) => item.normalized === normalize(tag)));
  const remaining = existing
    .map((item) => item.tag)
    .filter((tag) => !suggested.some((suggestion) => normalize(suggestion) === normalize(tag)))
    .slice(0, 16);
  return unique([...suggested, ...remaining]);
};

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
          const seekerSignals = getContactTaxonomyTags(seeker);
          const solverSignals = getContactTaxonomyTags(solver);
          const demand = normalize(`${seeker.currentDemand} ${seekerSignals.join(" ")}`);
          const solution = normalize(`${solver.problemSolves} ${solver.description} ${solverSignals.join(" ")}`);
          const matchingTags = seekerSignals.filter((tag) => solution.includes(normalize(tag)));
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
  return parseTabularContacts(parseDelimitedRows(csv), "CSV");
};

export const parseJsonContacts = (input: string): Partial<Contact>[] => {
  if (!input.trim()) return [];
  const parsed = JSON.parse(input) as unknown;
  const collection = Array.isArray(parsed)
    ? parsed
    : typeof parsed === "object" && parsed !== null
      ? Object.entries(parsed as Record<string, unknown>).find(([key, value]) =>
          ["contacts", "people", "participants", "pessoas", "membros", "inscritos"].includes(normalizeImportKey(key)) && Array.isArray(value)
        )?.[1]
      : [];
  if (!Array.isArray(collection)) return [];
  return recordsToContactPartials(
    collection.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null && !Array.isArray(item)),
    "JSON"
  );
};

export const parseContactImportText = (input: string): Partial<Contact>[] => {
  const text = input.trim();
  if (!text) return [];
  if (text.startsWith("[") || text.startsWith("{")) return parseJsonContacts(text);
  return parseCsvContacts(text);
};

export const parseVcardContacts = (vcard: string): Partial<Contact>[] => {
  const cards = vcard
    .split(/END:VCARD/i)
    .map((card) => card.trim())
    .filter(Boolean);

  return cards.map((card) => {
    const lines = card.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const findValue = (prefixes: string[]) => {
      const line = lines.find((item) => prefixes.some((prefix) => item.toUpperCase().startsWith(prefix)));
      if (!line) return "";
      return line.slice(line.indexOf(":") + 1).trim();
    };
    const name = findValue(["FN:"]) || findValue(["N:"]).split(";").filter(Boolean).reverse().join(" ");
    const phones = unique(
      lines
        .filter((line) => line.toUpperCase().startsWith("TEL"))
        .map((line) => line.slice(line.indexOf(":") + 1).trim())
    );
    const emails = unique(
      lines
        .filter((line) => line.toUpperCase().startsWith("EMAIL"))
        .map((line) => line.slice(line.indexOf(":") + 1).trim())
    );
    const org = findValue(["ORG:"]);
    const title = findValue(["TITLE:"]);
    const note = findValue(["NOTE:"]);
    const ddd = extractDdd(phones[0] ?? "");

    return {
      name: name || "Contato Apple sem nome",
      headline: unique([title, org]).join(" · "),
      description: note || (org ? `Contato importado do Apple Contacts ligado a ${org}.` : "Contato importado via vCard do Apple Contacts."),
      emails,
      phones,
      ddd,
      tags: unique(["Apple Contacts", ddd ? `DDD ${ddd}` : "", org ? "empresa" : ""]),
      currentDemand: "",
      problemSolves: "",
      source: "Apple Contacts"
    };
  });
};

const unfoldCalendarLines = (input: string) =>
  input
    .replace(/\r?\n[ \t]/g, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const getCalendarValue = (line: string) => {
  const separatorIndex = line.indexOf(":");
  return separatorIndex >= 0 ? line.slice(separatorIndex + 1).trim() : "";
};

const getCalendarParam = (line: string, param: string) => {
  const match = line.match(new RegExp(`${param}=([^;:]+)`, "i"));
  return match?.[1]?.replace(/^"|"$/g, "").trim() ?? "";
};

const cleanMailto = (value: string) => value.replace(/^mailto:/i, "").trim();

export const parseIcsCalendarContacts = (ics: string): Partial<Contact>[] => {
  const events = ics.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/gi) ?? [];
  return events.flatMap((eventBlock) => {
    const lines = unfoldCalendarLines(eventBlock);
    const summary = getCalendarValue(lines.find((line) => line.toUpperCase().startsWith("SUMMARY")) ?? "");
    const location = getCalendarValue(lines.find((line) => line.toUpperCase().startsWith("LOCATION")) ?? "");
    const date = getCalendarValue(lines.find((line) => line.toUpperCase().startsWith("DTSTART")) ?? "");
    const attendeeLines = lines.filter((line) => line.toUpperCase().startsWith("ATTENDEE"));
    const organizerLine = lines.find((line) => line.toUpperCase().startsWith("ORGANIZER"));
    const attendeeContacts = attendeeLines.map((line) => {
      const email = cleanMailto(getCalendarValue(line));
      const commonName = getCalendarParam(line, "CN");
      const role = getCalendarParam(line, "ROLE");
      const name = commonName || email.split("@")[0]?.replace(/[._-]+/g, " ") || "Participante Apple Agenda";
      return {
        name,
        headline: role ? `${role} em ${summary || "evento Apple"}` : `Participante de ${summary || "evento Apple"}`,
        description: `Participante importado de agenda Apple/iCloud${summary ? ` no evento "${summary}"` : ""}${location ? ` em ${location}` : ""}.`,
        emails: email ? [email] : [],
        phones: [],
        ddd: "",
        tags: unique(["Apple Calendar", "agenda", "evento", location, summary].filter(Boolean)),
        currentDemand: "",
        problemSolves: "",
        source: "Apple Calendar" as Contact["source"],
        customFields: {
          origemAgenda: "Apple Calendar",
          eventoOrigem: summary,
          localEvento: location,
          dataEvento: date
        }
      } satisfies Partial<Contact>;
    });
    if (!organizerLine) return attendeeContacts;
    const organizerEmail = cleanMailto(getCalendarValue(organizerLine));
    const organizerName = getCalendarParam(organizerLine, "CN") || organizerEmail.split("@")[0]?.replace(/[._-]+/g, " ");
    const organizerContact: Partial<Contact> = {
      name: organizerName || "Organizador Apple Agenda",
      headline: `Organizador de ${summary || "evento Apple"}`,
      description: `Organizador identificado em agenda Apple/iCloud${summary ? ` no evento "${summary}"` : ""}${location ? ` em ${location}` : ""}.`,
      emails: organizerEmail ? [organizerEmail] : [],
      phones: [],
      ddd: "",
      tags: unique(["Apple Calendar", "organizador", "agenda", "evento", location, summary].filter(Boolean)),
      currentDemand: "",
      problemSolves: "",
      source: "Apple Calendar",
      customFields: {
        origemAgenda: "Apple Calendar",
        eventoOrigem: summary,
        localEvento: location,
        dataEvento: date
      }
    };
    return [organizerContact, ...attendeeContacts];
  });
};

const contactGraphHaystack = (contact: Contact, groups: GrafyState["groups"]) => {
  const contactGroups = groups.filter((group) => contact.groupIds.includes(group.id));
  return normalize(
    [
      contactHaystack(contact),
      getContactTaxonomyTags(contact, groups).join(" "),
      contactGroups.map((group) => `${group.name} ${group.tags.join(" ")}`).join(" ")
    ].join(" ")
  );
};

export const contactMatchesGraphFilters = (contact: Contact, filters: string[], query = "", groups: GrafyState["groups"] = []) => {
  const haystack = contactGraphHaystack(contact, groups);
  const normalizedQuery = normalize(query);
  const queryMatches = !normalizedQuery || scoreContact(contact, query) > 0 || haystack.includes(normalizedQuery);
  const filtersMatch = filters.every((filter) => haystack.includes(normalize(filter)));
  return queryMatches && filtersMatch;
};

const nodeColorByType: Record<GraphNode["type"], string> = {
  contact: "#66e7ff",
  public: "#ffd166",
  tag: "#a993ff",
  source: "#ff7aa8",
  ddd: "#60f2d5",
  group: "#ffffff",
  demand: "#4da3ff",
  solution: "#31d17f"
};

const addPairEdges = (
  contacts: Contact[],
  edges: GraphEdge[],
  key: string,
  type: string,
  color: string,
  weight: number,
  matchedIds: Set<string>
) => {
  const scoped = contacts.slice(0, 7);
  for (let i = 0; i < scoped.length; i += 1) {
    for (let j = i + 1; j < scoped.length; j += 1) {
      const first = scoped[i];
      const second = scoped[j];
      edges.push({
        id: `${type}:${key}:${first.id}:${second.id}`,
        source: `contact:${first.id}`,
        target: `contact:${second.id}`,
        type,
        weight,
        color,
        isDimmed: !matchedIds.has(first.id) || !matchedIds.has(second.id)
      });
    }
  }
};

const priorityGraphTopics = [
  "CTO",
  "investidores",
  "investimento",
  "parcerias",
  "fornecedores",
  "contratos recorrentes",
  "fundraising",
  "compliance",
  "limpeza",
  "eventos",
  "comunidades",
  "churn",
  "governança",
  "segurança",
  "financeiro",
  "tecnologia",
  "recrutamento",
  "vendas",
  "operações"
];

const pickGraphTopics = (text: string, tags: string[] = []) => {
  const haystack = normalize(`${text} ${tags.join(" ")}`);
  return priorityGraphTopics.filter((topic) => haystack.includes(normalize(topic))).slice(0, 4);
};

export const buildGraph = (state: GrafyState, query = "", groupId?: string, activeFilters: string[] = []) => {
  const scopedContacts = groupId ? state.contacts.filter((contact) => contact.groupIds.includes(groupId)) : state.contacts;
  const contacts = scopedContacts;
  const matchedContactIds = new Set(
    contacts
      .filter((contact) => contactMatchesGraphFilters(contact, activeFilters, query, state.groups))
      .map((contact) => contact.id)
  );
  const hasFocus = Boolean(query.trim()) || activeFilters.length > 0;
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const centerX = 480;
  const centerY = 315;
  const contactRadius = 178;
  const tagRadius = 270;

  contacts.forEach((contact, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(contacts.length, 1) - Math.PI / 2;
    const area = customFieldText(contact, "area");
    const cargo = customFieldText(contact, "cargo");
    nodes.push({
      id: `contact:${contact.id}`,
      label: contact.name,
      type: contact.isPublic ? "public" : "contact",
      x: centerX + Math.cos(angle) * contactRadius,
      y: centerY + Math.sin(angle) * contactRadius,
      contactId: contact.id,
      weight: 12 + contact.tags.length * 2,
      color: contact.isPublic ? nodeColorByType.public : nodeColorByType.contact,
      isDimmed: hasFocus && !matchedContactIds.has(contact.id),
      meta: unique([contact.headline || contact.source, area, cargo, formatDddLocation(contact.ddd)]).join(" · ")
    });
  });

  const sourceTags = new Set(["Manual", "CSV", "Google Contacts", "Google Calendar", "Apple Contacts", "Apple Calendar", "Rede Pública", "Grupo"]);
  const tags = getGraphFilterTags(contacts, state.groups)
    .filter((tag) => !tag.startsWith("DDD ") && !sourceTags.has(tag))
    .slice(0, 24);
  tags.forEach((tag, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(tags.length, 1) + Math.PI / 10;
    const nodeId = `tag:${tag}`;
    const taggedContacts = contacts.filter((contact) =>
      getContactTaxonomyTags(contact, state.groups).some((item) => normalize(item) === normalize(tag))
    );
    nodes.push({
      id: nodeId,
      label: tag,
      type: "tag",
      x: centerX + Math.cos(angle) * tagRadius,
      y: centerY + Math.sin(angle) * tagRadius,
      weight: 8,
      color: nodeColorByType.tag,
      isDimmed: hasFocus && !taggedContacts.some((contact) => matchedContactIds.has(contact.id))
    });
    taggedContacts.forEach((contact) => {
      edges.push({
        id: `${contact.id}-${tag}`,
        source: `contact:${contact.id}`,
        target: nodeId,
        type: "possui sinal",
        weight: 1,
        color: nodeColorByType.tag,
        isDimmed: hasFocus && !matchedContactIds.has(contact.id)
      });
    });

    if (["marketing", "finanças", "financeiro", "tecnologia", "jurídico", "operações", "diretoria", "decisor", "CEO", "CTO", "CFO", "B2B", "PME", "SaaS", "fornecedores"].some((focusTag) => normalize(focusTag) === normalize(tag))) {
      addPairEdges(taggedContacts, edges, tag, "afinidade de tag", "#7dc7ff", 0.45, matchedContactIds);
    }
  });

  const demandTopics = unique(contacts.flatMap((contact) => pickGraphTopics(contact.currentDemand, contact.tags))).slice(0, 6);
  demandTopics.forEach((topic, index) => {
    const nodeId = `demand:${topic}`;
    const topicContacts = contacts.filter((contact) => normalize(`${contact.currentDemand} ${contact.tags.join(" ")}`).includes(normalize(topic)));
    nodes.push({
      id: nodeId,
      label: `Busca: ${topic}`,
      type: "demand",
      x: 130,
      y: 485 - index * 46,
      weight: 7,
      color: nodeColorByType.demand,
      isDimmed: hasFocus && !topicContacts.some((contact) => matchedContactIds.has(contact.id))
    });
    topicContacts.forEach((contact) => {
      edges.push({
        id: `${contact.id}-demand-${topic}`,
        source: `contact:${contact.id}`,
        target: nodeId,
        type: "demanda algo",
        weight: 1.4,
        color: nodeColorByType.demand,
        isDimmed: hasFocus && !matchedContactIds.has(contact.id)
      });
    });
  });

  const solutionTopics = unique(contacts.flatMap((contact) => pickGraphTopics(contact.problemSolves, contact.tags))).slice(0, 6);
  solutionTopics.forEach((topic, index) => {
    const nodeId = `solution:${topic}`;
    const topicContacts = contacts.filter((contact) => normalize(`${contact.problemSolves} ${contact.tags.join(" ")}`).includes(normalize(topic)));
    nodes.push({
      id: nodeId,
      label: `Resolve: ${topic}`,
      type: "solution",
      x: 830,
      y: 485 - index * 46,
      weight: 7,
      color: nodeColorByType.solution,
      isDimmed: hasFocus && !topicContacts.some((contact) => matchedContactIds.has(contact.id))
    });
    topicContacts.forEach((contact) => {
      edges.push({
        id: `${contact.id}-solution-${topic}`,
        source: `contact:${contact.id}`,
        target: nodeId,
        type: "resolve algo",
        weight: 1.4,
        color: nodeColorByType.solution,
        isDimmed: hasFocus && !matchedContactIds.has(contact.id)
      });
    });
  });

  [
    { type: "mesma área", color: "#58a6ff", get: (contact: Contact) => customFieldText(contact, "area") },
    { type: "mesmo cargo", color: "#d29922", get: (contact: Contact) => customFieldText(contact, "cargo") },
    { type: "tipo de negócio", color: "#a371f7", get: (contact: Contact) => customFieldText(contact, "tipoNegocio") },
    { type: "mesmo DDD", color: "#60f2d5", get: (contact: Contact) => contact.ddd ?? "" }
  ].forEach((affinity) => {
    unique(contacts.map(affinity.get).filter(Boolean)).forEach((value) => {
      const relatedContacts = contacts.filter((contact) => normalize(affinity.get(contact)) === normalize(value));
      if (relatedContacts.length > 1) {
        addPairEdges(relatedContacts, edges, value, affinity.type, affinity.color, 0.38, matchedContactIds);
      }
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
      weight: 7,
      color: nodeColorByType.ddd,
      isDimmed: hasFocus && !contacts.some((contact) => contact.ddd === ddd && matchedContactIds.has(contact.id)),
      meta: formatDddLocation(ddd)
    });
    contacts
      .filter((contact) => contact.ddd === ddd)
      .forEach((contact) => {
          edges.push({
            id: `${contact.id}-ddd-${ddd}`,
            source: `contact:${contact.id}`,
            target: nodeId,
            type: "tem DDD",
            weight: 1,
            color: nodeColorByType.ddd,
            isDimmed: hasFocus && !matchedContactIds.has(contact.id)
          });
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
      weight: 7,
      color: nodeColorByType.source,
      isDimmed: hasFocus && !contacts.some((contact) => contact.source === source && matchedContactIds.has(contact.id))
    });
    contacts
      .filter((contact) => contact.source === source)
      .forEach((contact) => {
        edges.push({
          id: `${contact.id}-source-${source}`,
          source: `contact:${contact.id}`,
          target: nodeId,
          type: "importado de",
          weight: 1,
          color: nodeColorByType.source,
          isDimmed: hasFocus && !matchedContactIds.has(contact.id)
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
        weight: 9,
        color: group.color || nodeColorByType.group,
        isDimmed: hasFocus && !group.contactIds.some((contactId) => matchedContactIds.has(contactId))
      });
      group.contactIds
        .filter((contactId) => contacts.some((contact) => contact.id === contactId))
        .forEach((contactId) => {
          edges.push({
            id: `${contactId}-${group.id}`,
            source: `contact:${contactId}`,
            target: nodeId,
            type: "pasta estratégica",
            weight: 2,
            color: group.color || nodeColorByType.group,
            isDimmed: hasFocus && !matchedContactIds.has(contactId)
          });
        });

      addPairEdges(
        contacts.filter((contact) => group.contactIds.includes(contact.id)),
        edges,
        group.id,
        "mesma pasta",
        group.color || "#ffffff",
        0.5,
        matchedContactIds
      );
    });

  buildOpportunityMatches(contacts).slice(0, 5).forEach((match) => {
    edges.push({
      id: `match:${match.seeker.id}:${match.solver.id}`,
      source: `contact:${match.seeker.id}`,
      target: `contact:${match.solver.id}`,
      type: "potencial match",
      weight: 3,
      color: "#ffd166",
      isDimmed: hasFocus && (!matchedContactIds.has(match.seeker.id) || !matchedContactIds.has(match.solver.id))
    });
  });

  return { nodes, edges, matchedContactIds, hasFocus };
};

export const makeAssistantAnswer = (prompt: string, state: GrafyState) => {
  const normalized = normalize(prompt);
  const duplicateWords = ["duplicado", "duplicados", "merge"];
  if (duplicateWords.some((word) => normalized.includes(word))) {
    const suggestions = getMergeSuggestions(state.contacts);
    return {
      content:
        suggestions.length > 0
          ? `Encontrei ${suggestions.length} possível duplicado. O caso mais forte é ${suggestions[0].contactA.name} com ${suggestions[0].contactB.name}, por ${suggestions[0].reason}.`
          : "Não encontrei duplicados por email ou telefone normalizado.",
      resultContactIds: suggestions.flatMap((suggestion) => [suggestion.contactA.id, suggestion.contactB.id])
    };
  }

  if (normalized.includes("oportunidade") || normalized.includes("match") || normalized.includes("conectar")) {
    const matches = buildOpportunityMatches(state.contacts);
    return {
      content: matches.length
        ? `Achei ${matches.length} oportunidades de complementaridade. A melhor sugestão é conectar ${matches[0].seeker.name} com ${matches[0].solver.name}. Motivo: ${matches[0].reason || "demanda e solução próximas"}.`
        : "Ainda não encontrei complementaridades fortes. Complete demandas e problemas resolvidos para melhorar os matches.",
      resultContactIds: matches.flatMap((match) => [match.seeker.id, match.solver.id])
    };
  }

  const dddMatch = normalized.match(/\bddd\s?(\d{2})\b/) || normalized.match(/\b(\d{2})\b/);
  if (dddMatch && normalized.includes("ddd")) {
    const ddd = dddMatch[1];
    const contacts = state.contacts.filter((contact) => contact.ddd === ddd);
    return {
      content: contacts.length
        ? `Encontrei ${contacts.length} contato(s) em ${formatDddLocation(ddd)}.`
        : `Não encontrei contatos em ${formatDddLocation(ddd)}.`,
      resultContactIds: contacts.map((contact) => contact.id)
    };
  }

  const contacts = searchContacts(state.contacts, prompt).slice(0, 6);
  const intent = normalized.includes("busca") || normalized.includes("demanda") || normalized.includes("procur")
    ? "demanda"
    : normalized.includes("resolve") || normalized.includes("presta") || normalized.includes("servico") || normalized.includes("ajuda")
      ? "solução"
      : "busca";
  const content = contacts.length
    ? `Encontrei ${contacts.length} resultado(s) por ${intent}. Destaques: ${contacts
        .slice(0, 3)
        .map((contact) => contact.name)
        .join(", ")}.`
    : "Não encontrei resultados fortes. Tente usar uma tag, DDD, demanda ou problema resolvido.";
  return { content, resultContactIds: contacts.map((contact) => contact.id) };
};
