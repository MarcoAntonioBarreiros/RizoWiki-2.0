import compatibilityRules from '../data/compatibility_rules.json';

const SEVERITY_RANK = {
  verde: 0,
  amarelo: 1,
  vermelho: 2,
};

const EFFECT_BY_SEMAPHORE = {
  verde: 'sem_alerta_especifico',
  amarelo: 'risco_moderado',
  vermelho: 'alto_risco',
};

const CHEMICAL_CLASS_ALIASES = {
  nenhum: 'nenhum',
  none: 'nenhum',
  sem_quimico: 'nenhum',
  fungicida: 'fungicida',
  fungicidas: 'fungicida',
  cobre: 'cuprico_metal',
  cuprico: 'cuprico_metal',
  cuprico_metal: 'cuprico_metal',
  metal: 'cuprico_metal',
  metais: 'cuprico_metal',
  co_mo: 'micronutriente_metal',
  micronutriente: 'micronutriente_metal',
  micronutriente_metal: 'micronutriente_metal',
  herbicida: 'herbicida',
  herbicidas: 'herbicida',
  inseticida: 'inseticida',
  inseticidas: 'inseticida',
  adubo: 'adubo_salino',
  fertilizante: 'adubo_salino',
  adubo_salino: 'adubo_salino',
  salino: 'adubo_salino',
  ph_extremo: 'pH_extremo',
  pH_extremo: 'pH_extremo',
  ph: 'pH_extremo',
  cloro: 'cloro',
  antibiotico: 'antibiotico',
};

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
}

export function normalizeOrganismId(value) {
  if (!value) return '';
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'mycorrhiza') return 'micorrizas';
  return normalized;
}

export function normalizeChemicalClass(value) {
  if (!value) return 'nenhum';
  const normalized = String(value).trim();
  const key = normalized.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return CHEMICAL_CLASS_ALIASES[normalized] || CHEMICAL_CLASS_ALIASES[key] || key;
}

function ruleMatches(rule, organism, chemicalClass, applicationMode) {
  const ruleOrganism = normalizeOrganismId(rule.organism);
  const ruleChemicalClasses = asArray(rule.chemical_class).map(normalizeChemicalClass);
  const ruleModes = asArray(rule.application_mode);

  return (
    ruleOrganism === organism &&
    ruleChemicalClasses.includes(chemicalClass) &&
    (ruleModes.length === 0 || ruleModes.includes(applicationMode) || ruleModes.includes('qualquer'))
  );
}

function mostSevereRule(matches) {
  return matches.reduce((selected, rule) => {
    if (!selected) return rule;
    return SEVERITY_RANK[rule.semaphore] > SEVERITY_RANK[selected.semaphore] ? rule : selected;
  }, null);
}

function buildDefaultResult({ organism, chemicalClass }) {
  return {
    organism,
    chemical_class: chemicalClass,
    semaphore: 'verde',
    effect: EFFECT_BY_SEMAPHORE.verde,
    message: 'Nao ha alerta especifico cadastrado para esta combinacao nas regras disponiveis.',
    confidence: 'inconclusiva',
    source: null,
    matched_rule_ids: [],
    limitations: [
      'Ausencia de regra nao confirma compatibilidade.',
      'Validar bula, produto comercial, dose, pH da calda e avaliacao tecnica responsavel.',
    ],
  };
}

export function evaluateCompatibility(input = {}, options = {}) {
  const rules = options.rules || compatibilityRules;
  const organisms = asArray(input.organisms ?? input.organism).map(normalizeOrganismId).filter(Boolean);
  const chemicalClasses = asArray(input.chemicalClasses ?? input.chemical_class ?? input.chemicalClass).map(normalizeChemicalClass);
  const applicationMode = input.applicationMode || input.application_mode || 'mistura_tanque';

  if (organisms.length === 0) {
    return {
      semaphore: 'vermelho',
      confidence: 'inconclusiva',
      limitations: ['Informe ao menos um organismo para avaliar compatibilidade.'],
      results: [],
    };
  }

  const effectiveChemicalClasses = chemicalClasses.length > 0 ? chemicalClasses : ['nenhum'];

  const results = organisms.flatMap((organism) =>
    effectiveChemicalClasses.map((chemicalClass) => {
      if (chemicalClass === 'nenhum') {
        return {
          organism,
          chemical_class: chemicalClass,
          semaphore: 'verde',
          effect: EFFECT_BY_SEMAPHORE.verde,
          message: 'Sem classe quimica informada; nenhum alerta de mistura foi aplicado.',
          confidence: 'baixa',
          source: 'entrada_usuario',
          matched_rule_ids: [],
          limitations: ['Resultado nao substitui bula, legislacao ou avaliacao tecnica responsavel.'],
        };
      }

      const matches = rules.filter((rule) => ruleMatches(rule, organism, chemicalClass, applicationMode));
      const selectedRule = mostSevereRule(matches);

      if (!selectedRule) return buildDefaultResult({ organism, chemicalClass });

      return {
        organism,
        chemical_class: chemicalClass,
        semaphore: selectedRule.semaphore,
        effect: selectedRule.effect || EFFECT_BY_SEMAPHORE[selectedRule.semaphore],
        message: selectedRule.message,
        confidence: selectedRule.confidence || 'baixa',
        source: selectedRule.source,
        source_file: selectedRule.source_file,
        matched_rule_ids: matches.map((rule) => rule.id),
        limitations: [
          ...(selectedRule.limitations || []),
          'Ferramenta de apoio a decisao; ajuste a bula, legislacao, condicoes locais e avaliacao tecnica responsavel.',
        ],
      };
    }),
  );

  const worst = results.reduce((current, result) => {
    if (!current) return result;
    return SEVERITY_RANK[result.semaphore] > SEVERITY_RANK[current.semaphore] ? result : current;
  }, null);

  return {
    semaphore: worst?.semaphore || 'verde',
    confidence: results.some((result) => result.confidence === 'inconclusiva') ? 'inconclusiva' : 'baixa',
    limitations: Array.from(new Set(results.flatMap((result) => result.limitations))),
    results,
  };
}

export default evaluateCompatibility;
