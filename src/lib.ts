import Fuse from "fuse.js";
import { distance } from "fastest-levenshtein";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { parse as parseDomain } from "tldts";
import { z } from "zod";
import type {
  Contact,
  EnrichmentLibraryDefinition,
  EnrichmentProviderDefinition,
  EnrichmentResearchLink,
  EnrichmentRuntimeSignal,
  EnrichmentSuggestion,
  EnrichmentSuggestedUpdate,
  GrafyState,
  Group,
  GraphColorRule,
  GraphEdge,
  GraphNode,
  MergeSuggestion
} from "./types";

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
  if (!ddd) return "DDD não identificado";
  const location = getDddLocation(ddd);
  return location ? `DDD ${ddd} · ${location.label} · ${location.region}` : `DDD ${ddd}`;
};

export const formatDddShortLocation = (ddd?: string) => {
  if (!ddd) return "DDD não identificado";
  const location = getDddLocation(ddd);
  return location ? `DDD ${ddd} · ${location.state}` : `DDD ${ddd}`;
};

export const getDddLocationSignals = (ddd?: string) => {
  if (!ddd) return [];
  const location = getDddLocation(ddd);
  return unique([
    `ddd${ddd}`,
    `DDD ${ddd}`,
    location ? `DDD ${ddd} · ${location.state}` : "",
    location ? `DDD ${ddd} · ${location.label}` : "",
    location?.label ?? "",
    location?.state ?? "",
    location?.region ?? ""
  ]);
};

export const unique = <T,>(items: T[]) => Array.from(new Set(items.filter(Boolean)));

export const contactEnrichmentApiCatalog: EnrichmentProviderDefinition[] = [
  {
    id: "google-people",
    name: "Google People API",
    category: "contatos",
    status: "ativo",
    useCase: "Trazer contatos autorizados pelo próprio usuário com nomes, emails, telefones, fotos e organizações salvas.",
    data: ["nome", "email", "telefone", "foto", "organização", "cargo"],
    limitation: "Só retorna dados que o usuário autorizou e que existem nos contatos dele."
  },
  {
    id: "linkedin-official",
    name: "LinkedIn oficial",
    category: "identidade",
    status: "restrito",
    useCase: "Vincular a identidade/perfil do usuário e recursos aprovados no catálogo de produtos do LinkedIn.",
    data: ["perfil do usuário autorizado", "email autorizado", "URL revisada"],
    limitation: "Não é uma API aberta para buscar qualquer pessoa por telefone ou nome; enriquecimento amplo exige aprovação/parceria."
  },
  {
    id: "people-data-labs",
    name: "People Data Labs",
    category: "profissional",
    status: "depende_chave",
    useCase: "Enriquecer pessoa por email, domínio, nome, empresa ou sinais profissionais, com confiança e fonte.",
    data: ["cargo", "empresa", "localidade", "perfil social", "senioridade"],
    limitation: "Depende de chave, plano e conformidade LGPD; respostas devem ser revisadas antes de gravar."
  },
  {
    id: "proxycurl",
    name: "Proxycurl / Nubela",
    category: "profissional",
    status: "depende_chave",
    useCase: "Consultar perfis públicos profissionais e dados relacionados por URL/perfil quando permitido pelo provedor.",
    data: ["perfil público", "headline", "empresa", "experiência", "educação"],
    limitation: "Uso comercial precisa validar termos, custo e disponibilidade atual do provedor."
  },
  {
    id: "hunter",
    name: "Hunter",
    category: "profissional",
    status: "depende_chave",
    useCase: "Qualificar emails e domínios corporativos para inferir empresa, website e contexto B2B.",
    data: ["email", "domínio", "empresa", "validade", "fontes públicas"],
    limitation: "Mais forte para email/domínio do que para telefone ou perfil social."
  },
  {
    id: "pipl",
    name: "Pipl Search API",
    category: "profissional",
    status: "depende_chave",
    useCase: "Busca e resolução de identidade por combinações de nome, email, telefone e sinais públicos.",
    data: ["telefone", "email", "nome", "localidade", "perfis"],
    limitation: "Ferramenta sensível; precisa controle de finalidade, consentimento e auditoria."
  },
  {
    id: "phone-validation",
    name: "AbstractAPI / Numverify",
    category: "telefone",
    status: "depende_chave",
    useCase: "Validar número, país, operadora e melhorar localização quando DDD sozinho for pouco.",
    data: ["telefone válido", "país", "operadora", "tipo", "localidade aproximada"],
    limitation: "Não descobre LinkedIn; apenas melhora o sinal telefônico e regional."
  },
  {
    id: "web-search",
    name: "Brave/Bing/Google CSE/SerpAPI",
    category: "busca",
    status: "depende_chave",
    useCase: "Buscar páginas públicas prováveis com nome, empresa, domínio e termos como LinkedIn.",
    data: ["título", "snippet", "URL pública", "fonte", "ranking"],
    limitation: "Precisa evitar scraping de sites logados e sempre mostrar evidência ao usuário."
  }
];

export const contactEnrichmentLibraryCatalog: EnrichmentLibraryDefinition[] = [
  {
    name: "libphonenumber-js",
    packageName: "libphonenumber-js",
    useCase: "Normaliza e valida telefones, calcula E.164 e melhora sinais de DDD/região.",
    implemented: true
  },
  {
    name: "Fuse.js",
    packageName: "fuse.js",
    useCase: "Fuzzy search para comparar nomes, empresas, cargos e contatos parecidos na base.",
    implemented: true
  },
  {
    name: "tldts",
    packageName: "tldts",
    useCase: "Extrai domínio corporativo de emails e ajuda a inferir empresa sem depender de texto solto.",
    implemented: true
  },
  {
    name: "fastest-levenshtein",
    packageName: "fastest-levenshtein",
    useCase: "Calcula similaridade entre nome do contato e email/resultado externo para pontuar confiança.",
    implemented: true
  },
  {
    name: "Zod",
    packageName: "zod",
    useCase: "Valida respostas de provedores antes de criar sugestões no Grafy.",
    implemented: true
  },
  {
    name: "OpenAI embeddings",
    packageName: "openai",
    useCase: "Evolução futura para similaridade semântica entre demandas, cargos, áreas e descrições.",
    implemented: false
  }
];

const enrichmentSuggestionSchema = z.object({
  suggestedName: z.string().min(1),
  headline: z.string(),
  role: z.string(),
  company: z.string(),
  location: z.string(),
  profileUrl: z.string(),
  confidence: z.number().min(0).max(100),
  evidence: z.array(z.string()).min(1),
  tags: z.array(z.string())
});

const cleanDomainLabel = (domain: string) =>
  domain
    .split(".")[0]
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const companyFromEmail = (email?: string) => {
  const domain = email?.split("@")[1]?.trim().toLowerCase();
  if (!domain) return "";
  const parsed = parseDomain(domain);
  const domainName = parsed.domainWithoutSuffix || parsed.domain || domain;
  const blocked = new Set(["gmail", "hotmail", "outlook", "icloud", "yahoo", "live", "proton", "uol", "bol"]);
  return blocked.has(domainName) ? "" : cleanDomainLabel(domainName);
};

const bestCustomField = (contact: Contact, keys: string[]) =>
  keys.map((key) => String(contact.customFields[key] ?? "").trim()).find(Boolean) ?? "";

const bestLinkedinUrl = (contact: Contact) => {
  const url = contact.links.find((link) => link.kind === "linkedin")?.value.trim() ?? "";
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url.replace(/^\/+/, "")}`;
};

const providerStatusLabel: Record<EnrichmentProviderDefinition["status"], EnrichmentRuntimeSignal["status"]> = {
  ativo: "ativo",
  preparado: "preparado",
  depende_chave: "depende_chave",
  restrito: "restrito",
  risco: "restrito"
};

type InferenceSignal = {
  value: string;
  confidence: number;
  reason: string;
  source: "campo" | "google" | "headline" | "email" | "tags" | "texto";
};

const EMPTY_SIGNAL: InferenceSignal = { value: "", confidence: 0, reason: "", source: "texto" };

const personalEmailDomains = new Set([
  "gmail",
  "hotmail",
  "outlook",
  "icloud",
  "yahoo",
  "live",
  "proton",
  "uol",
  "bol",
  "terra",
  "me"
]);

const roleKeywordMap: Array<[RegExp, string]> = [
  [/\b(ceo|presidente|diretor|diretora|director|cfo|cto|coo|cio|vp|vice[-\s]?presidente)\b/i, "Diretor"],
  [/\b(founder|fundador|fundadora|co[-\s]?founder|socio|socia|sócio|sócia)\b/i, "Founder / Sócio"],
  [/\b(head|lider|líder|lead|gestor|gestora|gerente|manager)\b/i, "Gestor"],
  [/\b(coordenador|coordenadora|coordinator)\b/i, "Coordenador"],
  [/\b(especialista|specialist|consultor|consultora|advisor|assessor|assessora)\b/i, "Especialista"],
  [/\b(analista|analyst)\b/i, "Analista"],
  [/\b(vendedor|vendedora|comercial|sales|account executive|sdr|bdr)\b/i, "Comercial"],
  [/\b(recrutador|recrutadora|recruiter|talent acquisition|rh|people)\b/i, "RH / People"],
  [/\b(investidor|investidora|investor|venture|partner)\b/i, "Investidor"]
];

const areaKeywordMap: Array<[RegExp, string]> = [
  [/\b(marketing|growth|brand|conteudo|conteúdo|midia|mídia|crm)\b/i, "Marketing"],
  [/\b(vendas|comercial|sales|receita|revenue|parcerias|partnerships)\b/i, "Comercial"],
  [/\b(financas|finanças|financeiro|contabilidade|cfo|fiscal|tributario|tributário)\b/i, "Finanças"],
  [/\b(tecnologia|tech|software|dados|data|ia|ai|engenharia|developer|dev|produto)\b/i, "Tecnologia"],
  [/\b(operacoes|operações|logistica|logística|supply|processos)\b/i, "Operações"],
  [/\b(rh|people|talent|recrutamento|cultura|educacao|educação)\b/i, "RH"],
  [/\b(juridico|jurídico|legal|contratos|compliance)\b/i, "Jurídico"],
  [/\b(evento|eventos|comunidade|community|hub|networking)\b/i, "Comunidade/Eventos"],
  [/\b(saude|saúde|health|clinica|clínica|medico|médico)\b/i, "Saúde"]
];

const seniorityTagMap: Array<[RegExp, string]> = [
  [/\b(ceo|presidente|diretor|diretora|c-level|cfo|cto|coo|cio|vp)\b/i, "decisor"],
  [/\b(founder|fundador|fundadora|socio|socia|sócio|sócia)\b/i, "fundador"],
  [/\b(head|gerente|gestor|gestora|lider|líder|lead)\b/i, "liderança"],
  [/\b(comercial|sales|vendas|receita|revenue)\b/i, "potencial comercial"]
];

const getPrimaryEmailDomain = (email?: string) => email?.split("@")[1]?.trim().toLowerCase() ?? "";

const getEmailDomainName = (email?: string) => {
  const domain = getPrimaryEmailDomain(email);
  if (!domain) return "";
  const parsed = parseDomain(domain);
  return parsed.domainWithoutSuffix || parsed.domain || domain.split(".")[0] || "";
};

const isCorporateEmail = (email?: string) => {
  const domainName = getEmailDomainName(email);
  return Boolean(domainName && !personalEmailDomains.has(domainName));
};

const splitHeadlineParts = (headline: string) =>
  headline
    .split(/(?:·|\||•|-{1,2})/)
    .map((part) => part.trim())
    .filter(Boolean);

const isUsefulRoleText = (value: string) => {
  const normalized = normalize(value);
  if (!normalized || normalized.length > 64) return false;
  return ![
    "participante de",
    "organizador em",
    "perfil profissional",
    "contato importado",
    "evento google",
    "evento apple",
    "google agenda"
  ].some((phrase) => normalized.includes(phrase));
};

const inferFromKeywords = (text: string, map: Array<[RegExp, string]>) =>
  map.find(([pattern]) => pattern.test(text))?.[1] ?? "";

const signalText = (contact: Contact) =>
  unique([
    contact.name,
    contact.headline,
    contact.description,
    contact.currentDemand,
    contact.problemSolves,
    contact.notes,
    ...contact.tags,
    ...Object.values(contact.customFields).flatMap((value) => Array.isArray(value) ? value.map(String) : String(value ?? ""))
  ]).join(" ");

const inferCompanySignal = (contact: Contact): InferenceSignal => {
  const explicit = bestCustomField(contact, ["empresa", "company", "organization", "organizacao", "companhia", "org"]);
  if (explicit) {
    return {
      value: explicit,
      confidence: contact.source === "Google Contacts" ? 96 : 90,
      reason: contact.source === "Google Contacts" ? "Organização importada pelo Google People API." : "Campo de empresa já existe no contato.",
      source: contact.source === "Google Contacts" ? "google" : "campo"
    };
  }

  const parts = splitHeadlineParts(contact.headline);
  const fromHeadline = parts.find((part, index) => index > 0 && isUsefulRoleText(part) && !roleKeywordMap.some(([pattern]) => pattern.test(part)));
  if (fromHeadline) {
    return { value: fromHeadline, confidence: 72, reason: "Empresa provável lida no headline do contato.", source: "headline" };
  }

  if (isCorporateEmail(contact.emails[0])) {
    return {
      value: companyFromEmail(contact.emails[0]),
      confidence: 68,
      reason: "Empresa inferida pelo domínio corporativo do email.",
      source: "email"
    };
  }

  return EMPTY_SIGNAL;
};

const inferRoleSignal = (contact: Contact): InferenceSignal => {
  const explicit = bestCustomField(contact, ["cargo", "title", "job_title", "position", "funcao", "papel"]);
  if (explicit) {
    return {
      value: explicit,
      confidence: contact.source === "Google Contacts" ? 96 : 90,
      reason: contact.source === "Google Contacts" ? "Cargo importado pelo Google People API." : "Campo de cargo já existe no contato.",
      source: contact.source === "Google Contacts" ? "google" : "campo"
    };
  }

  const [firstHeadlinePart] = splitHeadlineParts(contact.headline);
  const headlineIsAreaOnly = firstHeadlinePart
    ? Boolean(inferFromKeywords(firstHeadlinePart, areaKeywordMap)) && !inferFromKeywords(firstHeadlinePart, roleKeywordMap)
    : false;
  if (firstHeadlinePart && isUsefulRoleText(firstHeadlinePart) && !headlineIsAreaOnly) {
    return { value: firstHeadlinePart, confidence: 74, reason: "Cargo provável lido no headline do contato.", source: "headline" };
  }

  const keywordRole = inferFromKeywords(signalText(contact), roleKeywordMap);
  if (keywordRole) return { value: keywordRole, confidence: 58, reason: "Cargo provável inferido por palavras-chave e tags.", source: "tags" };

  return EMPTY_SIGNAL;
};

const inferAreaSignal = (contact: Contact): InferenceSignal => {
  const explicit = bestCustomField(contact, ["area", "departamento", "department", "setor", "segmento", "industry"]);
  if (explicit) return { value: explicit, confidence: 88, reason: "Área já existe nos campos do contato.", source: "campo" };

  const area = inferFromKeywords(signalText(contact), areaKeywordMap);
  if (area) return { value: area, confidence: 62, reason: "Área inferida por descrição, tags, cargo ou demanda.", source: "texto" };

  return EMPTY_SIGNAL;
};

const getSeniorityTags = (text: string) => seniorityTagMap.flatMap(([pattern, tag]) => pattern.test(text) ? [tag] : []);

const buildResearchLinks = (contact: Contact, role: string, company: string): EnrichmentResearchLink[] => {
  const domain = getPrimaryEmailDomain(contact.emails[0]);
  const baseParts = unique([contact.name, role, company].filter(Boolean));
  const professionalQuery = unique([...baseParts, "LinkedIn", "site:linkedin.com/in"].filter(Boolean)).join(" ");
  const companyQuery = unique([contact.name, company, role, domain].filter(Boolean)).join(" ");
  return [
    {
      label: "Buscar LinkedIn público",
      url: `https://www.google.com/search?q=${encodeURIComponent(professionalQuery || `${contact.name} LinkedIn site:linkedin.com/in`)}`,
      detail: "Abre uma busca pública para o usuário confirmar o perfil antes de gravar."
    },
    {
      label: "Confirmar cargo/empresa",
      url: `https://www.google.com/search?q=${encodeURIComponent(companyQuery || contact.name)}`,
      detail: "Busca evidências públicas combinando nome, empresa, cargo e domínio."
    },
    ...(domain && isCorporateEmail(contact.emails[0])
      ? [{
          label: "Abrir domínio corporativo",
          url: `https://${domain}`,
          detail: "Ajuda a validar se o email pertence a uma empresa real."
        }]
      : [])
  ];
};

const buildMissingFields = (contact: Contact, role: string, company: string, linkedinUrl: string) =>
  [
    !contact.emails.length ? "email" : "",
    !contact.phones.length ? "telefone" : "",
    !contact.ddd && !extractDdd(contact.phones[0] ?? "") ? "DDD/região" : "",
    !company ? "empresa" : "",
    !role ? "cargo" : "",
    !bestCustomField(contact, ["area", "departamento", "department", "setor", "segmento", "industry"]) ? "área" : "",
    !linkedinUrl ? "LinkedIn revisado" : ""
  ].filter(Boolean);

const buildSuggestedUpdates = (
  contact: Contact,
  roleSignal: InferenceSignal,
  companySignal: InferenceSignal,
  areaSignal: InferenceSignal,
  linkedinUrl: string,
  researchUrl: string,
  tags: string[]
): EnrichmentSuggestedUpdate[] => {
  const currentCompany = bestCustomField(contact, ["empresa", "company", "organization"]);
  const currentRole = bestCustomField(contact, ["cargo", "title", "position", "funcao"]);
  const currentArea = bestCustomField(contact, ["area", "departamento", "department", "setor"]);
  const updates: EnrichmentSuggestedUpdate[] = [];

  if (!currentCompany && companySignal.value) {
    updates.push({
      field: "empresa",
      current: "vazio",
      suggested: companySignal.value,
      reason: companySignal.reason,
      strength: companySignal.confidence >= 80 ? "forte" : "media"
    });
  }
  if (!currentRole && roleSignal.value) {
    updates.push({
      field: "cargo",
      current: "vazio",
      suggested: roleSignal.value,
      reason: roleSignal.reason,
      strength: roleSignal.confidence >= 80 ? "forte" : "media"
    });
  }
  if (!currentArea && areaSignal.value) {
    updates.push({
      field: "area",
      current: "vazio",
      suggested: areaSignal.value,
      reason: areaSignal.reason,
      strength: areaSignal.confidence >= 80 ? "forte" : "media"
    });
  }
  if (!contact.headline && unique([roleSignal.value, companySignal.value, areaSignal.value]).length) {
    updates.push({
      field: "headline",
      current: "vazio",
      suggested: unique([roleSignal.value, companySignal.value, areaSignal.value]).join(" · "),
      reason: "Headline montado com os melhores sinais profissionais disponíveis.",
      strength: "media"
    });
  }
  if (linkedinUrl) {
    updates.push({
      field: "linkedin",
      current: "vazio",
      suggested: linkedinUrl,
      reason: "URL do LinkedIn já estava salva no contato.",
      strength: "forte"
    });
  } else {
    updates.push({
      field: "linkedin",
      current: "vazio",
      suggested: researchUrl,
      reason: "Pesquisa pública preparada para revisão humana.",
      strength: "baixa"
    });
  }
  if (tags.length) {
    updates.push({
      field: "tags",
      current: `${contact.tags.length} tag(s)`,
      suggested: tags.slice(0, 6).join(", "),
      reason: "Tags geradas por cargo, empresa, área, DDD e senioridade.",
      strength: "media"
    });
  }

  return updates;
};

export const buildLinkedinResearchUrl = (contact: Contact) => {
  const company = bestCustomField(contact, ["empresa", "company"]) || companyFromEmail(contact.emails[0]);
  const role = bestCustomField(contact, ["cargo", "title", "position"]);
  const query = unique([contact.name, role, company, "LinkedIn", "site:linkedin.com/in"].filter(Boolean)).join(" ");
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
};

export const buildProfessionalEnrichmentSuggestions = (contacts: Contact[], limit = 8): EnrichmentSuggestion[] => {
  const fuse = new Fuse(contacts, {
    keys: ["name", "headline", "emails", "phones", "tags", "customFields.empresa", "customFields.cargo", "customFields.area"],
    includeScore: true,
    threshold: 0.34
  });

  return contacts
    .map((contact) => {
      const phone = contact.phones[0] ?? "";
      const parsedPhone = phone ? parsePhoneNumberFromString(phone, "BR") : undefined;
      const ddd = contact.ddd || extractDdd(phone);
      const dddLocation = formatDddLocation(ddd);
      const company = bestCustomField(contact, ["empresa", "company", "organization"]) || companyFromEmail(contact.emails[0]);
      const role = bestCustomField(contact, ["cargo", "title", "position", "funcao"]) || contact.headline.split("·")[0]?.trim() || "";
      const area = bestCustomField(contact, ["area", "departamento", "industry"]);
      const linkedinUrl = bestLinkedinUrl(contact);
      const emailName = contact.emails[0]?.split("@")[0]?.replace(/[._-]+/g, " ") ?? "";
      const normalizedName = normalize(contact.name);
      const normalizedEmailName = normalize(emailName);
      const nameDistance = normalizedEmailName ? distance(normalizedName, normalizedEmailName) : normalizedName.length;
      const nameSimilarity = normalizedEmailName
        ? Math.max(0, 1 - nameDistance / Math.max(normalizedName.length, normalizedEmailName.length, 1))
        : 0;
      const peerMatches = company
        ? fuse.search(company, { limit: 4 }).filter((match) => match.item.id !== contact.id && (match.score ?? 1) < 0.42)
        : [];
      const provider = linkedinUrl
        ? "linkedin-official"
        : company || role
          ? "people-data-labs"
          : phone
            ? "phone-validation"
            : "web-search";
      const providerLabel = contactEnrichmentApiCatalog.find((item) => item.id === provider)?.name ?? "Busca pública assistida";
      const providerDefinition = contactEnrichmentApiCatalog.find((item) => item.id === provider);
      const runtimeSignals: EnrichmentRuntimeSignal[] = [
        {
          source: "library",
          name: "libphonenumber-js",
          status: "rodando",
          value: phone
            ? parsedPhone?.isValid()
              ? parsedPhone.formatInternational()
              : "telefone a validar"
            : "sem telefone",
          detail: ddd ? `DDD ${ddd} usado como sinal regional.` : "Contato sem DDD extraído."
        },
        {
          source: "library",
          name: "tldts",
          status: "rodando",
          value: company || "sem domínio corporativo",
          detail: contact.emails[0] ? `Email analisado: ${contact.emails[0]}.` : "Contato sem email para inferir domínio."
        },
        {
          source: "library",
          name: "Fuse.js",
          status: "rodando",
          value: `${peerMatches.length} similar(es)`,
          detail: peerMatches.length
            ? peerMatches.map((match) => match.item.name).slice(0, 3).join(", ")
            : "Nenhum contato parecido o suficiente na base atual."
        },
        {
          source: "library",
          name: "fastest-levenshtein",
          status: "rodando",
          value: `${Math.round(nameSimilarity * 100)}% nome/email`,
          detail: emailName ? `Comparou "${contact.name}" com "${emailName}".` : "Sem email para comparar nome."
        },
        {
          source: "library",
          name: "Zod",
          status: "rodando",
          value: "schema validado",
          detail: "A sugestão só aparece depois de validar campos obrigatórios e confiança."
        },
        ...(contact.source === "Google Contacts" || contact.source === "Google Calendar"
          ? [{
              source: "api" as const,
              name: contact.source === "Google Contacts" ? "Google People API" : "Google Calendar API",
              status: "ativo" as const,
              value: contact.source,
              detail: "Contato veio de OAuth Google autorizado pelo usuário."
            }]
          : []),
        {
          source: "api",
          name: providerDefinition?.name ?? providerLabel,
          status: providerDefinition ? providerStatusLabel[providerDefinition.status] : "preparado",
          value: providerDefinition?.status === "depende_chave" ? "aguardando chave/backend" : "pronto para revisão",
          detail: providerDefinition?.limitation ?? "Provedor preparado para retornar evidências externas."
        }
      ];
      const evidence = unique([
        `Nome lido do contato: ${contact.name}`,
        phone ? `Telefone ${parsedPhone?.isValid() ? "válido" : "a validar"} com ${dddLocation}` : "",
        contact.emails[0] ? `Email analisado: ${contact.emails[0]}` : "",
        company ? `Domínio/campo sugere empresa: ${company}` : "",
        role ? `Cargo atual provável: ${role}` : "",
        area ? `Área indicada: ${area}` : "",
        linkedinUrl ? "LinkedIn já informado no contato." : "Sem LinkedIn salvo; abrir busca pública para revisão.",
        peerMatches.length ? `${peerMatches.length} contato(s) parecido(s) na base ajudam a validar contexto.` : ""
      ]);
      const confidence = Math.min(
        96,
        Math.round(
          28 +
            (parsedPhone?.isValid() ? 12 : phone ? 5 : 0) +
            (ddd ? 8 : 0) +
            (contact.emails[0] ? 8 : 0) +
            (company ? 14 : 0) +
            (role ? 14 : 0) +
            (linkedinUrl ? 18 : 0) +
            (nameSimilarity > 0.35 ? 8 : 0) +
            Math.min(peerMatches.length * 3, 6)
        )
      );
      const parsedSuggestion = enrichmentSuggestionSchema.parse({
        suggestedName: contact.name,
        headline: contact.headline || unique([role, company, area]).join(" · ") || "Perfil profissional a revisar",
        role,
        company,
        location: dddLocation,
        profileUrl: linkedinUrl || buildLinkedinResearchUrl(contact),
        confidence,
        evidence,
        tags: unique([
          "revisar LinkedIn",
          company,
          role,
          area,
          ddd ? `DDD ${ddd}` : "",
          getDddLocation(ddd)?.state ?? "",
          "enriquecimento profissional"
        ])
      });

      return {
        id: `enrich:${contact.id}`,
        contactId: contact.id,
        provider,
        providerLabel,
        ...parsedSuggestion,
        runtimeSignals,
        status: confidence >= 72 ? "suggested" : "needs_review"
      } satisfies EnrichmentSuggestion;
    })
    .sort((a, b) => {
      const aNeedsWork = a.role && a.company && a.profileUrl ? 0 : 1;
      const bNeedsWork = b.role && b.company && b.profileUrl ? 0 : 1;
      return bNeedsWork - aNeedsWork || b.confidence - a.confidence;
    })
    .slice(0, limit);
};

export const buildActionableProfessionalEnrichmentSuggestions = (contacts: Contact[], limit = 8): EnrichmentSuggestion[] => {
  const fuse = new Fuse(contacts, {
    keys: ["name", "headline", "emails", "phones", "tags", "customFields.empresa", "customFields.cargo", "customFields.area"],
    includeScore: true,
    threshold: 0.34
  });

  return contacts
    .map((contact) => {
      const phone = contact.phones[0] ?? "";
      const parsedPhone = phone ? parsePhoneNumberFromString(phone, "BR") : undefined;
      const ddd = contact.ddd || extractDdd(phone);
      const dddLocation = formatDddLocation(ddd);
      const companySignal = inferCompanySignal(contact);
      const roleSignal = inferRoleSignal(contact);
      const areaSignal = inferAreaSignal(contact);
      const company = companySignal.value;
      const role = roleSignal.value;
      const area = areaSignal.value;
      const linkedinUrl = bestLinkedinUrl(contact);
      const researchLinks = buildResearchLinks(contact, role, company);
      const primaryResearchUrl = linkedinUrl || researchLinks[0]?.url || buildLinkedinResearchUrl(contact);
      const emailName = contact.emails[0]?.split("@")[0]?.replace(/[._-]+/g, " ") ?? "";
      const normalizedName = normalize(contact.name);
      const normalizedEmailName = normalize(emailName);
      const nameDistance = normalizedEmailName ? distance(normalizedName, normalizedEmailName) : normalizedName.length;
      const nameSimilarity = normalizedEmailName
        ? Math.max(0, 1 - nameDistance / Math.max(normalizedName.length, normalizedEmailName.length, 1))
        : 0;
      const peerSearchTerm = company || area || role;
      const peerMatches = peerSearchTerm
        ? fuse.search(peerSearchTerm, { limit: 4 }).filter((match) => match.item.id !== contact.id && (match.score ?? 1) < 0.42)
        : [];
      const provider = contact.source === "Google Contacts" && (companySignal.source === "google" || roleSignal.source === "google")
        ? "google-people"
        : linkedinUrl
          ? "linkedin-official"
          : company || role
            ? "people-data-labs"
            : phone
              ? "phone-validation"
              : "web-search";
      const providerLabel = contactEnrichmentApiCatalog.find((item) => item.id === provider)?.name ?? "Busca pública assistida";
      const providerDefinition = contactEnrichmentApiCatalog.find((item) => item.id === provider);
      const professionalText = signalText(contact);
      const seniorityTags = getSeniorityTags(professionalText);
      const missingFields = buildMissingFields(contact, role, company, linkedinUrl);
      const tags = unique([
        "revisar LinkedIn",
        company,
        role,
        area,
        ...seniorityTags,
        ddd ? `DDD ${ddd}` : "",
        getDddLocation(ddd)?.state ?? "",
        getDddLocation(ddd)?.region ?? "",
        companySignal.source === "email" ? "empresa inferida por email" : "",
        roleSignal.source === "google" || companySignal.source === "google" ? "Google People enriquecido" : "",
        "enriquecimento profissional"
      ]);
      const updates = buildSuggestedUpdates(contact, roleSignal, companySignal, areaSignal, linkedinUrl, primaryResearchUrl, tags);
      const qualityScore = Math.min(
        100,
        Math.round(
          (contact.name ? 10 : 0) +
            (contact.emails.length ? 12 : 0) +
            (contact.phones.length ? 12 : 0) +
            (ddd ? 8 : 0) +
            (company ? 16 : 0) +
            (role ? 16 : 0) +
            (area ? 8 : 0) +
            (linkedinUrl ? 10 : 0) +
            (contact.description ? 4 : 0) +
            (contact.currentDemand || contact.problemSolves ? 4 : 0)
        )
      );
      const runtimeSignals: EnrichmentRuntimeSignal[] = [
        {
          source: "library",
          name: "libphonenumber-js",
          status: "rodando",
          value: phone
            ? parsedPhone?.isValid()
              ? parsedPhone.formatInternational()
              : "telefone a validar"
            : "sem telefone",
          detail: ddd ? `DDD ${ddd} usado como sinal regional.` : "Contato sem DDD extraído."
        },
        {
          source: "library",
          name: "tldts",
          status: "rodando",
          value: companySignal.source === "email" ? company : company || "sem domínio corporativo",
          detail: contact.emails[0]
            ? `${isCorporateEmail(contact.emails[0]) ? "Domínio corporativo" : "Domínio pessoal"} analisado: ${contact.emails[0]}.`
            : "Contato sem email para inferir domínio."
        },
        {
          source: "library",
          name: "Fuse.js",
          status: "rodando",
          value: `${peerMatches.length} similar(es)`,
          detail: peerMatches.length
            ? peerMatches.map((match) => match.item.name).slice(0, 3).join(", ")
            : "Nenhum contato parecido o suficiente na base atual para validar contexto."
        },
        {
          source: "library",
          name: "fastest-levenshtein",
          status: "rodando",
          value: `${Math.round(nameSimilarity * 100)}% nome/email`,
          detail: emailName ? `Comparou "${contact.name}" com "${emailName}".` : "Sem email para comparar nome."
        },
        {
          source: "library",
          name: "Zod",
          status: "rodando",
          value: "schema validado",
          detail: "A sugestão só aparece depois de validar campos obrigatórios, score e evidências."
        },
        ...(contact.source === "Google Contacts" || contact.source === "Google Calendar"
          ? [{
              source: "api" as const,
              name: contact.source === "Google Contacts" ? "Google People API" : "Google Calendar API",
              status: "ativo" as const,
              value: contact.source,
              detail: contact.source === "Google Contacts"
                ? `OAuth autorizado. ${company || role ? "Organização/cargo aproveitados quando vieram salvos no Google." : "O Google não retornou cargo/empresa para este contato."}`
                : "Contato veio de evento autorizado pela Agenda Google."
            }]
          : []),
        {
          source: "api",
          name: providerDefinition?.name ?? providerLabel,
          status: providerDefinition ? providerStatusLabel[providerDefinition.status] : "preparado",
          value: providerDefinition?.status === "depende_chave" ? "adapter pronto; falta chave/backend" : "pronto para revisão",
          detail: providerDefinition?.limitation ?? "Provedor preparado para retornar evidências externas."
        }
      ];
      const evidence = unique([
        `Nome lido do contato: ${contact.name}`,
        phone ? `Telefone ${parsedPhone?.isValid() ? "válido" : "a validar"} com ${dddLocation}` : "",
        contact.emails[0] ? `Email analisado: ${contact.emails[0]}` : "",
        company ? `${companySignal.reason} Resultado: ${company}.` : "Empresa ainda não identificada.",
        role ? `${roleSignal.reason} Resultado: ${role}.` : "Cargo ainda não identificado.",
        area ? `${areaSignal.reason} Resultado: ${area}.` : "",
        linkedinUrl ? "LinkedIn já informado no contato." : "Sem LinkedIn salvo; abrir busca pública para revisão.",
        peerMatches.length ? `${peerMatches.length} contato(s) parecido(s) na base ajudam a validar contexto.` : "",
        missingFields.length ? `Pendências: ${missingFields.join(", ")}.` : "Contato com dados profissionais bem qualificados."
      ]);
      const confidence = Math.min(
        96,
        Math.round(
          22 +
            (parsedPhone?.isValid() ? 12 : phone ? 5 : 0) +
            (ddd ? 8 : 0) +
            (contact.emails[0] ? 8 : 0) +
            Math.round(companySignal.confidence * 0.16) +
            Math.round(roleSignal.confidence * 0.16) +
            Math.round(areaSignal.confidence * 0.08) +
            (linkedinUrl ? 18 : 0) +
            (nameSimilarity > 0.35 ? 8 : 0) +
            Math.min(peerMatches.length * 3, 6)
        )
      );
      const nextActions = unique([
        updates.some((update) => update.strength === "forte" || update.strength === "media")
          ? "Aplicar sinais seguros para preencher empresa, cargo, área e tags sem sobrescrever dados existentes."
          : "",
        !linkedinUrl ? "Abrir busca pública e confirmar o LinkedIn antes de salvar a URL no contato." : "LinkedIn já existe; revisar se ainda está atual.",
        missingFields.includes("cargo") || missingFields.includes("empresa")
          ? "Se cargo/empresa não vieram do Google, validar por email corporativo, site da empresa ou provedor externo com chave."
          : "",
        providerDefinition?.status === "depende_chave"
          ? "Para consulta automática externa real, conectar este provedor em backend/Edge Function com LGPD e logs de consentimento."
          : ""
      ]);
      const parsedSuggestion = enrichmentSuggestionSchema.parse({
        suggestedName: contact.name,
        headline: contact.headline || unique([role, company, area]).join(" · ") || "Perfil profissional a revisar",
        role,
        company,
        location: dddLocation,
        profileUrl: primaryResearchUrl,
        confidence,
        evidence,
        tags
      });

      return {
        id: `enrich:${contact.id}`,
        contactId: contact.id,
        provider,
        providerLabel,
        ...parsedSuggestion,
        missingFields,
        nextActions,
        qualityScore,
        researchLinks,
        updates,
        runtimeSignals,
        status: confidence >= 72 ? "suggested" : "needs_review"
      } satisfies EnrichmentSuggestion;
    })
    .sort((a, b) => {
      const aActionable = (a.updates ?? []).filter((update) => update.strength !== "baixa").length;
      const bActionable = (b.updates ?? []).filter((update) => update.strength !== "baixa").length;
      return bActionable - aActionable || b.confidence - a.confidence || (a.qualityScore ?? 0) - (b.qualityScore ?? 0);
    })
    .slice(0, limit);
};

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
  const dddSignals = getDddLocationSignals(ddd);
  const dddLocation = getDddLocation(ddd);
  const tags = unique([
    ...splitImportValue(readImportValue(record, ["tags", "tag", "interesses", "interests", "temas", "categorias", "category", "grupo", "groups", "trilha"])),
    area,
    title,
    company ? "empresa" : "",
    ...dddSignals
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
      ...(ddd ? {
        localidadeDdd: formatDddLocation(ddd),
        estadoDdd: dddLocation?.state ?? "",
        regiaoDdd: dddLocation?.region ?? ""
      } : {})
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
      getDddLocationSignals(contact.ddd).join(" "),
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

export const getContactTaxonomyTags = (
  contact: Contact,
  groups: GrafyState["groups"] = [],
  options: { includeGroupTags?: boolean } = {}
) => {
  const contactGroups = groups.filter((group) => contact.groupIds.includes(group.id));
  return unique([
    ...contact.tags,
    customFieldText(contact, "area"),
    customFieldText(contact, "cargo"),
    customFieldText(contact, "tipoNegocio"),
    ...getDddLocationSignals(contact.ddd),
    contact.source,
    ...contactGroups.map((group) => group.name),
    ...(options.includeGroupTags ? contactGroups.flatMap((group) => group.tags) : [])
  ]).filter(Boolean);
};

const normalizeCompactSignal = (value: string) => normalize(value).replace(/[^a-z0-9]/g, "");

const getSmartGroupSignals = (contact: Contact, groups: GrafyState["groups"] = []) => {
  const ddd = contact.ddd ?? "";
  const location = getDddLocation(ddd);
  return unique([
    ...getContactTaxonomyTags(contact, groups),
    contact.name,
    contact.headline,
    contact.description,
    contact.currentDemand,
    contact.problemSolves,
    contact.notes,
    ...contact.phones,
    ...contact.emails,
    ddd,
    ddd ? `DDD ${ddd}` : "",
    ddd ? `ddd${ddd}` : "",
    formatDddShortLocation(ddd),
    formatDddLocation(ddd),
    location?.state ?? "",
    location?.region ?? "",
    location?.label ?? ""
  ]).filter(Boolean);
};

export const contactMatchesGroupTags = (contact: Contact, group: Group, groups: GrafyState["groups"] = []) => {
  const rules = (group.tags ?? []).map((tag) => tag.trim()).filter(Boolean);
  if (!rules.length) return false;
  const groupsWithoutCurrent = groups.filter((item) => item.id !== group.id);
  const signals = getSmartGroupSignals(contact, groupsWithoutCurrent).map((signal) => ({
    normalized: normalize(signal),
    compact: normalizeCompactSignal(signal)
  }));
  return rules.some((rule) => {
    const normalizedRule = normalize(rule);
    const compactRule = normalizeCompactSignal(rule);
    if (!normalizedRule || !compactRule) return false;
    return signals.some((signal) => (
      signal.normalized === normalizedRule ||
      signal.compact === compactRule ||
      (normalizedRule.length >= 3 && signal.normalized.includes(normalizedRule)) ||
      (compactRule.length >= 4 && signal.compact.includes(compactRule))
    ));
  });
};

export const graphFilterGroups = [
  { label: "Cargos", tags: ["CEO", "CTO", "CFO", "diretor", "diretoria", "decisor", "founder", "fundador", "head", "gerente", "especialista", "consultor", "fornecedor", "investidor", "mentor"] },
  { label: "Áreas", tags: ["marketing", "vendas", "finanças", "financeiro", "investimentos", "tecnologia", "produto", "jurídico", "operações", "eventos", "segurança", "RH", "customer success", "construção"] },
  { label: "Negócios", tags: ["B2B", "SaaS", "PME", "startups", "consultoria", "serviços B2B", "serviços locais", "fornecedores", "comunidade", "healthtech", "scale-up", "SaaS vertical", "Venture"] },
  { label: "Estratégia", tags: ["parcerias", "fundraising", "investimento", "contratos recorrentes", "growth", "compliance", "expansão", "recrutamento", "limpeza", "governança"] },
  { label: "Fontes", tags: ["Google Contacts", "Google Calendar", "Apple Contacts", "Apple Calendar", "CSV", "JSON", "Excel", "Manual", "Rede Pública"] },
  { label: "Localidade", tags: ["DDD 11", "DDD 11 · SP", "DDD 21", "DDD 21 · RJ", "DDD 31", "DDD 31 · MG", "DDD 41", "DDD 41 · PR", "DDD 61", "DDD 61 · DF", "DDD 81", "DDD 81 · PE", "DDD 85", "DDD 85 · CE", "SP", "RJ", "MG", "PR", "DF", "PE", "CE", "São Paulo/SP", "Rio de Janeiro/RJ", "Belo Horizonte/MG", "Curitiba/PR", "Brasília/DF", "Recife/PE", "Fortaleza/CE", "Sudeste", "Nordeste", "Sul", "Centro-Oeste", "Norte"] },
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

const mergeSuggestionId = (firstId: string, secondId: string) => [firstId, secondId].sort().join("::");

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
          id: mergeSuggestionId(first.id, second.id),
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

const DEFAULT_OPPORTUNITY_CANDIDATE_LIMIT = 220;

export const buildOpportunityMatches = (contacts: Contact[], candidateLimit = DEFAULT_OPPORTUNITY_CANDIDATE_LIMIT) => {
  const candidates = contacts.slice(0, candidateLimit);
  const signalCache = new Map(candidates.map((contact) => [contact.id, getContactTaxonomyTags(contact)]));
  const matches: Array<{ seeker: Contact; solver: Contact; score: number; reason: string }> = [];
  for (const seeker of candidates) {
    const seekerSignals = signalCache.get(seeker.id) ?? [];
    const demand = normalize(`${seeker.currentDemand} ${seekerSignals.join(" ")}`);
    const demandTerms = unique(demand.split(/\s+/).filter((term) => term.length > 4)).slice(0, 10);
    for (const solver of candidates) {
      if (solver.id === seeker.id) continue;
      const solverSignals = signalCache.get(solver.id) ?? [];
      const solution = normalize(`${solver.problemSolves} ${solver.description} ${solverSignals.join(" ")}`);
      const matchingTags = seekerSignals.filter((tag) => solution.includes(normalize(tag))).slice(0, 6);
      const termHits = demandTerms.filter((term) => solution.includes(term));
      const sameGroup = seeker.groupIds.some((groupId) => solver.groupIds.includes(groupId));
      const sameDdd = seeker.ddd && seeker.ddd === solver.ddd;
      const score = matchingTags.length * 20 + termHits.length * 12 + (sameGroup ? 15 : 0) + (sameDdd ? 8 : 0);
      if (score >= 24) {
        matches.push({ seeker, solver, score, reason: unique([...matchingTags, ...termHits]).slice(0, 4).join(", ") });
      }
    }
  }
  return matches.sort((a, b) => b.score - a.score).slice(0, 8);
};

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
    const dddLocation = getDddLocation(ddd);

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
      source: "Apple Contacts",
      customFields: {
        empresa: org,
        cargo: title,
        ...(ddd ? {
          localidadeDdd: formatDddLocation(ddd),
          estadoDdd: dddLocation?.state ?? "",
          regiaoDdd: dddLocation?.region ?? ""
        } : {})
      }
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
  const taxonomy = getContactTaxonomyTags(contact, groups).map((tag) => normalize(tag));
  const normalizedQuery = normalize(query);
  const queryMatches = !normalizedQuery || scoreContact(contact, query) > 0 || haystack.includes(normalizedQuery);
  const filtersMatch = filters.every((filter) => taxonomy.includes(normalize(filter)));
  return queryMatches && filtersMatch;
};

type GraphBuildOptions = {
  includeOpportunityMatches?: boolean;
  colorRules?: GraphColorRule[];
  requireFocus?: boolean;
  renderOnlyMatches?: boolean;
};

const graphConfig: {
  maxContactNodes: number;
  maxTagNodes: number;
  maxDddNodes: number;
  maxSourceNodes: number;
  maxSignalEdges: number;
  maxEdges: number;
  affinityPairNodeLimit: number;
  opportunityCandidateLimit: number;
} = {
  maxContactNodes: 20,
  maxTagNodes: 24,
  maxDddNodes: 8,
  maxSourceNodes: 6,
  maxSignalEdges: 180,
  maxEdges: 3600,
  affinityPairNodeLimit: 7,
  opportunityCandidateLimit: 30
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

const isColorRuleMatch = (rule: GraphColorRule, values: string[]) => {
  const normalizedRule = normalize(rule.value);
  return Boolean(normalizedRule) && values.some((value) => {
    const normalizedValue = normalize(value);
    return normalizedValue === normalizedRule || normalizedValue.includes(normalizedRule);
  });
};

const getGraphRuleColor = (rules: GraphColorRule[], scope: GraphColorRule["scope"], values: string[]) =>
  rules.find((rule) => rule.enabled && rule.scope === scope && isColorRuleMatch(rule, values))?.color;

const getContactRuleValues = (
  contact: Contact,
  meta: { taxonomy: string[]; area: string; cargo: string; tipoNegocio: string } | undefined,
  scope: GraphColorRule["scope"]
) => {
  const location = getDddLocation(contact.ddd);
  if (scope === "cargo") return [meta?.cargo ?? "", contact.headline, ...contact.tags];
  if (scope === "area") return [meta?.area ?? "", ...contact.tags];
  if (scope === "tipoNegocio") return [meta?.tipoNegocio ?? "", ...contact.tags];
  if (scope === "ddd") {
    return [
      contact.ddd ?? "",
      contact.ddd ? `DDD ${contact.ddd}` : "",
      formatDddShortLocation(contact.ddd),
      formatDddLocation(contact.ddd),
      location?.state ?? "",
      location?.region ?? "",
      location?.label ?? ""
    ];
  }
  if (scope === "source") return [contact.source];
  return meta?.taxonomy ?? contact.tags;
};

const getContactRuleColor = (
  contact: Contact,
  meta: { taxonomy: string[]; area: string; cargo: string; tipoNegocio: string } | undefined,
  rules: GraphColorRule[]
) => {
  for (const rule of rules) {
    if (rule.enabled && isColorRuleMatch(rule, getContactRuleValues(contact, meta, rule.scope))) {
      return rule.color;
    }
  }
  return "";
};

const addPairEdges = (
  contacts: Contact[],
  edges: GraphEdge[],
  key: string,
  type: string,
  color: string,
  weight: number,
  matchedIds: Set<string>,
  options: { pairLimit?: number; pushEdge?: (edge: GraphEdge) => void } = {}
) => {
  const scoped = contacts.slice(0, options.pairLimit ?? 7);
  const pushEdge = options.pushEdge ?? ((edge: GraphEdge) => edges.push(edge));
  for (let i = 0; i < scoped.length; i += 1) {
    for (let j = i + 1; j < scoped.length; j += 1) {
      const first = scoped[i];
      const second = scoped[j];
      pushEdge({
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

const getContactOrbitPosition = (index: number, total: number, centerX: number, centerY: number) => {
  if (total <= 10) {
    const angle = (Math.PI * 2 * index) / Math.max(total, 1) - Math.PI / 2;
    return {
      x: centerX + Math.cos(angle) * 210,
      y: centerY + Math.sin(angle) * 194
    };
  }

  const outerCount = Math.ceil(total * 0.6);
  const isOuter = index < outerCount;
  const ringIndex = isOuter ? index : index - outerCount;
  const ringCount = isOuter ? outerCount : total - outerCount;
  const angleOffset = isOuter ? -Math.PI / 2 : -Math.PI / 2 + Math.PI / Math.max(outerCount, 1);
  const angle = (Math.PI * 2 * ringIndex) / Math.max(ringCount, 1) + angleOffset;
  const radiusX = isOuter ? 238 : 150;
  const radiusY = isOuter ? 212 : 132;

  return {
    x: centerX + Math.cos(angle) * radiusX,
    y: centerY + Math.sin(angle) * radiusY
  };
};

export const buildGraph = (
  state: GrafyState,
  query = "",
  groupId?: string,
  activeFilters: string[] = [],
  options: GraphBuildOptions = {}
) => {
  const activeGroup = groupId ? state.groups.find((group) => group.id === groupId) : undefined;
  const scopedContacts = activeGroup
    ? state.contacts.filter((contact) => contact.groupIds.includes(activeGroup.id) || contactMatchesGroupTags(contact, activeGroup, state.groups))
    : state.contacts;
  const contacts = scopedContacts;
  const hasFocus = Boolean(query.trim()) || activeFilters.length > 0 || Boolean(activeGroup);
  const config = graphConfig;
  const colorRules = (options.colorRules ?? state.graphColorRules ?? []).filter((rule) => rule.enabled);
  const normalizedQuery = normalize(query);
  const normalizedFilters = activeFilters.map(normalize);

  if (options.requireFocus && !hasFocus) {
    return {
      nodes: [],
      edges: [],
      matchedContactIds: new Set<string>(),
      hasFocus,
      totalContacts: contacts.length,
      renderedContacts: 0,
      hiddenContacts: contacts.length
    };
  }

  const contactMeta = new Map<string, {
    taxonomy: string[];
    taxonomySet: Set<string>;
    haystack: string;
    area: string;
    cargo: string;
    tipoNegocio: string;
  }>();
  const taxonomyContacts = new Map<string, { label: string; contacts: Contact[] }>();
  const matchedContactIds = new Set<string>();

  contacts.forEach((contact) => {
    const taxonomy = getContactTaxonomyTags(contact, state.groups);
    const taxonomySet = new Set(taxonomy.map(normalize));
    const haystack = normalize([contactHaystack(contact), taxonomy.join(" ")].join(" "));
    const queryMatches = !normalizedQuery || scoreContact(contact, query) > 0 || haystack.includes(normalizedQuery);
    const filtersMatch = normalizedFilters.every((filter) => taxonomySet.has(filter));
    if (queryMatches && filtersMatch) matchedContactIds.add(contact.id);
    contactMeta.set(contact.id, {
      taxonomy,
      taxonomySet,
      haystack,
      area: customFieldText(contact, "area"),
      cargo: customFieldText(contact, "cargo"),
      tipoNegocio: customFieldText(contact, "tipoNegocio")
    });
    taxonomy.forEach((tag) => {
      const normalizedTag = normalize(tag);
      const item = taxonomyContacts.get(normalizedTag) ?? { label: tag, contacts: [] };
      item.contacts.push(contact);
      taxonomyContacts.set(normalizedTag, item);
    });
  });

  const matchedContacts = contacts.filter((contact) => matchedContactIds.has(contact.id));
  const graphContacts = options.renderOnlyMatches && hasFocus ? matchedContacts : contacts;
  const nonMatchedContacts = graphContacts.filter((contact) => !matchedContactIds.has(contact.id));
  const renderedContacts = graphContacts.length > config.maxContactNodes
    ? options.renderOnlyMatches && hasFocus
      ? graphContacts.slice(0, config.maxContactNodes)
      : [...matchedContacts.slice(0, config.maxContactNodes), ...nonMatchedContacts.slice(0, Math.max(0, config.maxContactNodes - matchedContacts.length))]
    : graphContacts;
  const renderedContactIds = new Set(renderedContacts.map((contact) => contact.id));
  const graphContactIds = new Set(graphContacts.map((contact) => contact.id));
  const hiddenContacts = graphContacts.filter((contact) => !renderedContactIds.has(contact.id));
  const taxonomyContactsForGraph = new Map(
    [...taxonomyContacts.entries()]
      .map(([key, item]) => [key, { ...item, contacts: item.contacts.filter((contact) => graphContactIds.has(contact.id)) }] as const)
      .filter(([, item]) => item.contacts.length > 0)
  );
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const pushEdge = (edge: GraphEdge) => {
    if (edges.length < config.maxEdges) edges.push(edge);
  };
  const centerX = 480;
  const centerY = 315;
  const tagRadiusX = 322;
  const tagRadiusY = 284;

  renderedContacts.forEach((contact, index) => {
    const position = getContactOrbitPosition(index, renderedContacts.length, centerX, centerY);
    const meta = contactMeta.get(contact.id);
    const ruleColor = getContactRuleColor(contact, meta, colorRules);
    nodes.push({
      id: `contact:${contact.id}`,
      label: contact.name,
      type: contact.isPublic ? "public" : "contact",
      x: position.x,
      y: position.y,
      contactId: contact.id,
      weight: 12 + contact.tags.length * 2,
      color: ruleColor || (contact.isPublic ? nodeColorByType.public : nodeColorByType.contact),
      isDimmed: hasFocus && !matchedContactIds.has(contact.id),
      meta: unique([contact.headline || contact.source, meta?.area ?? "", meta?.cargo ?? "", formatDddLocation(contact.ddd)]).join(" · ")
    });
  });

  const sourceTags = new Set(["Manual", "CSV", "JSON", "Excel", "Google Contacts", "Google Calendar", "Apple Contacts", "Apple Calendar", "Rede Pública", "Grupo"]);
  const existingTags = [...taxonomyContactsForGraph.values()].map((item) => item.label);
  const curatedTags = graphFilterGroups.flatMap((group) => group.tags);
  const suggestedTags = curatedTags.filter((tag) => taxonomyContactsForGraph.has(normalize(tag)));
  const remainingTags = existingTags.filter((tag) => !suggestedTags.some((suggestion) => normalize(suggestion) === normalize(tag))).slice(0, 16);
  const tags = unique([...suggestedTags, ...remainingTags])
    .filter((tag) => !tag.startsWith("DDD ") && !sourceTags.has(tag))
    .slice(0, config.maxTagNodes);
  tags.forEach((tag, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(tags.length, 1) + Math.PI / 10;
    const nodeId = `tag:${tag}`;
    const taggedContacts = taxonomyContactsForGraph.get(normalize(tag))?.contacts ?? [];
    const renderedTaggedContacts = taggedContacts.filter((contact) => renderedContactIds.has(contact.id)).slice(0, config.maxSignalEdges);
    const tagColor = getGraphRuleColor(colorRules, "tag", [tag]);
    nodes.push({
      id: nodeId,
      label: tag,
      type: "tag",
      x: centerX + Math.cos(angle) * tagRadiusX,
      y: centerY + Math.sin(angle) * tagRadiusY,
      weight: 8,
      color: tagColor || nodeColorByType.tag,
      isDimmed: hasFocus && !taggedContacts.some((contact) => matchedContactIds.has(contact.id))
    });
    renderedTaggedContacts.forEach((contact) => {
      pushEdge({
        id: `${contact.id}-${tag}`,
        source: `contact:${contact.id}`,
        target: nodeId,
        type: "possui sinal",
        weight: 1,
        color: tagColor || nodeColorByType.tag,
        isDimmed: hasFocus && !matchedContactIds.has(contact.id)
      });
    });

    if (["marketing", "finanças", "financeiro", "tecnologia", "jurídico", "operações", "diretoria", "decisor", "CEO", "CTO", "CFO", "B2B", "PME", "SaaS", "fornecedores"].some((focusTag) => normalize(focusTag) === normalize(tag))) {
      addPairEdges(renderedTaggedContacts, edges, tag, "afinidade de tag", "#7dc7ff", 0.45, matchedContactIds, { pairLimit: config.affinityPairNodeLimit, pushEdge });
    }
  });

  const demandTopics = unique(graphContacts.flatMap((contact) => pickGraphTopics(contact.currentDemand, contact.tags))).slice(0, 6);
  demandTopics.forEach((topic, index) => {
    const nodeId = `demand:${topic}`;
    const topicContacts = graphContacts.filter((contact) => normalize(`${contact.currentDemand} ${contact.tags.join(" ")}`).includes(normalize(topic)));
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
    topicContacts.filter((contact) => renderedContactIds.has(contact.id)).slice(0, config.maxSignalEdges).forEach((contact) => {
      pushEdge({
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

  const solutionTopics = unique(graphContacts.flatMap((contact) => pickGraphTopics(contact.problemSolves, contact.tags))).slice(0, 6);
  solutionTopics.forEach((topic, index) => {
    const nodeId = `solution:${topic}`;
    const topicContacts = graphContacts.filter((contact) => normalize(`${contact.problemSolves} ${contact.tags.join(" ")}`).includes(normalize(topic)));
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
    topicContacts.filter((contact) => renderedContactIds.has(contact.id)).slice(0, config.maxSignalEdges).forEach((contact) => {
      pushEdge({
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
    const buckets = new Map<string, Contact[]>();
    renderedContacts.forEach((contact) => {
      const value = affinity.get(contact);
      if (!value) return;
      const normalizedValue = normalize(value);
      buckets.set(normalizedValue, [...(buckets.get(normalizedValue) ?? []), contact]);
    });
    buckets.forEach((relatedContacts, value) => {
      if (relatedContacts.length > 1) {
        addPairEdges(relatedContacts, edges, value, affinity.type, affinity.color, 0.38, matchedContactIds, { pairLimit: config.affinityPairNodeLimit, pushEdge });
      }
    });
  });

  const ddds = unique(graphContacts.map((contact) => contact.ddd).filter((ddd): ddd is string => Boolean(ddd))).slice(0, config.maxDddNodes);
  ddds.forEach((ddd, index) => {
    const nodeId = `ddd:${ddd}`;
    const dddColor = getGraphRuleColor(colorRules, "ddd", [ddd, `DDD ${ddd}`, formatDddShortLocation(ddd), formatDddLocation(ddd)]);
    nodes.push({
      id: nodeId,
      label: formatDddShortLocation(ddd),
      type: "ddd",
      x: 120,
      y: 90 + index * 70,
      weight: 7,
      color: dddColor || nodeColorByType.ddd,
      isDimmed: hasFocus && !graphContacts.some((contact) => contact.ddd === ddd && matchedContactIds.has(contact.id)),
      meta: formatDddLocation(ddd)
    });
    graphContacts
      .filter((contact) => contact.ddd === ddd && renderedContactIds.has(contact.id))
      .slice(0, config.maxSignalEdges)
      .forEach((contact) => {
          pushEdge({
            id: `${contact.id}-ddd-${ddd}`,
            source: `contact:${contact.id}`,
            target: nodeId,
            type: "tem DDD",
            weight: 1,
            color: dddColor || nodeColorByType.ddd,
            isDimmed: hasFocus && !matchedContactIds.has(contact.id)
          });
      });
  });

  const sources = unique(graphContacts.map((contact) => contact.source)).slice(0, config.maxSourceNodes);
  sources.forEach((source, index) => {
    const nodeId = `source:${source}`;
    const sourceColor = getGraphRuleColor(colorRules, "source", [source]);
    nodes.push({
      id: nodeId,
      label: source,
      type: "source",
      x: 840,
      y: 112 + index * 76,
      weight: 7,
      color: sourceColor || nodeColorByType.source,
      isDimmed: hasFocus && !graphContacts.some((contact) => contact.source === source && matchedContactIds.has(contact.id))
    });
    graphContacts
      .filter((contact) => contact.source === source && renderedContactIds.has(contact.id))
      .slice(0, config.maxSignalEdges)
      .forEach((contact) => {
        pushEdge({
          id: `${contact.id}-source-${source}`,
          source: `contact:${contact.id}`,
          target: nodeId,
          type: "importado de",
          weight: 1,
          color: sourceColor || nodeColorByType.source,
          isDimmed: hasFocus && !matchedContactIds.has(contact.id)
        });
      });
  });

  state.groups
    .filter((group) => !groupId || group.id === groupId)
    .filter((group) =>
      !options.renderOnlyMatches ||
      !hasFocus ||
      Boolean(groupId) ||
      group.contactIds.some((contactId) => renderedContactIds.has(contactId)) ||
      renderedContacts.some((contact) => contactMatchesGroupTags(contact, group, state.groups))
    )
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
        .filter((contactId) => renderedContactIds.has(contactId))
        .slice(0, config.maxSignalEdges)
        .forEach((contactId) => {
          pushEdge({
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
        renderedContacts.filter((contact) => group.contactIds.includes(contact.id)),
        edges,
        group.id,
        "mesma pasta",
        group.color || "#ffffff",
        0.5,
        matchedContactIds,
        { pairLimit: config.affinityPairNodeLimit, pushEdge }
      );
    });

  if (options.includeOpportunityMatches ?? true) {
    buildOpportunityMatches(renderedContacts, config.opportunityCandidateLimit).slice(0, 5).forEach((match) => {
      pushEdge({
        id: `match:${match.seeker.id}:${match.solver.id}`,
        source: `contact:${match.seeker.id}`,
        target: `contact:${match.solver.id}`,
        type: "potencial match",
        weight: 3,
        color: "#ffd166",
        isDimmed: hasFocus && (!matchedContactIds.has(match.seeker.id) || !matchedContactIds.has(match.solver.id))
      });
    });
  }

  return {
    nodes,
    edges,
    matchedContactIds,
    hasFocus,
    totalContacts: contacts.length,
    renderedContacts: renderedContacts.length,
    hiddenContacts: hiddenContacts.length
  };
};

export const makeAssistantAnswer = (prompt: string, state: GrafyState) => {
  const normalized = normalize(prompt);
  const duplicateWords = ["duplicado", "duplicados", "merge"];
  if (duplicateWords.some((word) => normalized.includes(word))) {
    const suggestions = getMergeSuggestions(state.contacts).filter((suggestion) => state.mergeDecisions?.[suggestion.id] !== "ignored");
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
