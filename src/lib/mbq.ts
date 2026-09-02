export const formatUserId = (id: any, createdAt?: string | null) => {
  const num = parseInt(id, 10);
  if (isNaN(num)) return `MBQ${id}`;
  const year = createdAt ? new Date(createdAt).getFullYear() : new Date().getFullYear();
  return `MBQ${year}${String(num).padStart(3, '0')}`;
};

export interface GeneOption {
  label: string;
  tier: 'lite' | 'pro';
  genes: string[];
}

export interface GeneCategory {
  name: string;
  options: GeneOption[];
}

export const GENE_CATALOG: GeneCategory[] = [
  {
    name: 'Caffeine Qode',
    options: [
      { label: 'Caffeine Metabolism (CYP1A2)', tier: 'lite', genes: ['CYP1A2'] },
      { label: 'Caffeine Response (ADORA2A)', tier: 'lite', genes: ['ADORA2A'] },
      { label: 'Caffeine Qode Pro (CYP1A2,ADORA2A)', tier: 'pro', genes: ['CYP1A2', 'ADORA2A'] },
    ],
  },
  {
    name: 'Muscle Qode',
    options: [
      { label: 'Muscle Power (ACTN3)', tier: 'lite', genes: ['ACTN3'] },
      { label: 'Muscle Endurance (ACE)', tier: 'lite', genes: ['ACE'] },
      { label: 'Muscle Qode Pro (ACTN3,ACE)', tier: 'pro', genes: ['ACTN3', 'ACE'] },
    ],
  },
  {
    name: 'Hair Qode',
    options: [
      { label: 'Hair Thickness (FGFR2)', tier: 'lite', genes: ['FGFR2'] },
      { label: 'Hair Strength (EDAR)', tier: 'lite', genes: ['EDAR'] },
      { label: 'Hair Qode Pro (FGFR2,EDAR)', tier: 'pro', genes: ['FGFR2', 'EDAR'] },
    ],
  },
];

// Flat list of every selectable option, for pages that just need "all 9".
export const GENE_OPTIONS: GeneOption[] = GENE_CATALOG.flatMap((c) => c.options);

const GENE_VARIANTS: Record<string, string[]> = {
  CYP1A2: ['AA', 'AC', 'CC'],
  ADORA2A: ['TT', 'TC', 'CC'],
  ACTN3: ['RR', 'RX', 'XX'],
  ACE: ['II', 'ID', 'DD'],
  FGFR2: ['TT', 'GT', 'GG'],
  EDAR: ['GG', 'AG', 'AA'],
};

const GENE_PANEL_LABEL: Record<string, string> = {
  CYP1A2: 'Caffeine Sensitivity',
  ADORA2A: 'Caffeine Sensitivity',
  ACTN3: 'Muscle Performance',
  ACE: 'Muscle Performance',
  FGFR2: 'Hair',
  EDAR: 'Hair',
};

export interface RequiredGene {
  panel: string;
  name: string;
  variants: string[];
}

// Splits a stored gene_type string into its individual panel labels, the same
// way every page has always done it: commas outside of a "(...)" group.
export const splitGenePanels = (geneTypeString: string): string[] =>
  geneTypeString.split(/,\s*(?![^(]*\))/).map((s) => s.trim()).filter(Boolean);

// Extracts the required genes (with their possible genotype variants) out of a
// stored gene_type string, by reading the gene codes out of each panel's
// trailing "(...)" group — works for both the old two-gene Pro panels and the
// new single-gene Lite panels without a case per option.
export const getRequiredGenes = (geneTypeString: string): RequiredGene[] => {
  if (!geneTypeString) return [];
  const required: RequiredGene[] = [];
  splitGenePanels(geneTypeString).forEach((panel) => {
    const match = panel.match(/\(([^)]+)\)/);
    if (!match) return;
    const genes = match[1].split(',').map((g) => g.trim().toUpperCase()).filter(Boolean);
    genes.forEach((gene) => {
      const variants = GENE_VARIANTS[gene];
      if (!variants) return;
      required.push({ panel: GENE_PANEL_LABEL[gene] || gene, name: gene, variants });
    });
  });
  return required;
};

export const getGeneColor = (geneName: string) => {
  const name = geneName.toLowerCase();
  if (name.includes('actn3') || name.includes('ace')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (name.includes('edar') || name.includes('fgfr2')) return 'bg-purple-50 text-purple-700 border-purple-200';
  if (name.includes('cyp1a2') || name.includes('adora2a') || name.includes('caffeine') || name.includes('caffine')) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-[#F4F4F2] text-[#5A5A55] border-[#D4D4CE]';
};

export const getGenePieColor = (geneName: string) => {
  const name = geneName.toLowerCase();
  if (name.includes('actn3') || name.includes('ace')) return '#3b82f6';
  if (name.includes('edar') || name.includes('fgfr2')) return '#a855f7';
  if (name.includes('cyp1a2') || name.includes('adora2a') || name.includes('caffeine') || name.includes('caffine')) return '#f59e0b';
  return '#8B8B86';
};
