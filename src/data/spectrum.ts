// Spectrum-of-activity reference. Values are general/typical; local resistance
// patterns vary. Verify with your institution's antibiogram.

export type Coverage = "y" | "v" | "n"

export type OrganismCategory =
  | "gram-positive"
  | "gram-negative"
  | "anaerobe"
  | "atypical"

export interface Antibiotic {
  id: string
  name: string
  short?: string
  class: string
  notes?: string
}

export interface Organism {
  id: string
  name: string
  category: OrganismCategory
  short?: string
}

export const antibiotics: Antibiotic[] = [
  // beta-lactams: penicillins
  { id: "pcn-g", name: "Penicillin G", class: "Penicillin (natural)" },
  { id: "amp", name: "Ampicillin", class: "Aminopenicillin" },
  { id: "nafcillin", name: "Nafcillin", short: "Naf", class: "Antistaphylococcal PCN" },
  { id: "amp-sulb", name: "Ampicillin-sulbactam", short: "Unasyn", class: "PCN + BLI" },
  { id: "amox-clav", name: "Amoxicillin-clavulanate", short: "Augmentin", class: "PCN + BLI" },
  { id: "pip-tazo", name: "Piperacillin-tazobactam", short: "Zosyn", class: "PCN + BLI" },

  // cephalosporins
  { id: "cefazolin", name: "Cefazolin", short: "Ancef", class: "Cephalosporin (1st gen)" },
  { id: "ceftriaxone", name: "Ceftriaxone", short: "CTX", class: "Cephalosporin (3rd gen)" },
  { id: "ceftazidime", name: "Ceftazidime", class: "Cephalosporin (3rd gen, anti-pseudomonal)" },
  { id: "cefepime", name: "Cefepime", class: "Cephalosporin (4th gen)" },
  { id: "ceftaz-avi", name: "Ceftazidime-avibactam", class: "Cephalosporin + BLI" },

  // carbapenems
  { id: "ertapenem", name: "Ertapenem", class: "Carbapenem" },
  { id: "meropenem", name: "Meropenem", class: "Carbapenem" },

  // monobactam
  { id: "aztreonam", name: "Aztreonam", class: "Monobactam" },

  // glycopeptides & related
  { id: "vancomycin", name: "Vancomycin (IV)", short: "Vanc", class: "Glycopeptide" },

  // oxazolidinones / lipopeptides
  { id: "linezolid", name: "Linezolid", class: "Oxazolidinone" },
  { id: "daptomycin", name: "Daptomycin", class: "Lipopeptide", notes: "Inactivated by surfactant — do not use for pneumonia." },

  // fluoroquinolones
  { id: "ciprofloxacin", name: "Ciprofloxacin", short: "Cipro", class: "Fluoroquinolone" },
  { id: "levofloxacin", name: "Levofloxacin", short: "Levo", class: "Fluoroquinolone (resp)" },

  // macrolides / tetracyclines / other
  { id: "azithromycin", name: "Azithromycin", short: "Azithro", class: "Macrolide" },
  { id: "doxycycline", name: "Doxycycline", short: "Doxy", class: "Tetracycline" },
  { id: "tmp-smx", name: "TMP-SMX", short: "Bactrim", class: "Folate antagonist" },
  { id: "clindamycin", name: "Clindamycin", short: "Clinda", class: "Lincosamide" },
  { id: "metronidazole", name: "Metronidazole", short: "Flagyl", class: "Nitroimidazole" },
]

export const organisms: Organism[] = [
  // gram-positive
  { id: "mssa", name: "Staph aureus (MSSA)", category: "gram-positive" },
  { id: "mrsa", name: "Staph aureus (MRSA)", category: "gram-positive" },
  { id: "cons", name: "Coag-neg staph", category: "gram-positive", short: "CoNS" },
  { id: "strep-pneumo", name: "Strep pneumoniae", category: "gram-positive" },
  { id: "gas", name: "Strep pyogenes (GAS)", category: "gram-positive" },
  { id: "viridans", name: "Viridans streptococci", category: "gram-positive" },
  { id: "gbs", name: "Strep agalactiae (GBS)", category: "gram-positive" },
  { id: "efaecalis", name: "Enterococcus faecalis", category: "gram-positive" },
  { id: "efaecium", name: "Enterococcus faecium", category: "gram-positive" },
  { id: "vre", name: "VRE (E. faecium)", category: "gram-positive" },

  // gram-negative
  { id: "ecoli", name: "E. coli (susceptible)", category: "gram-negative" },
  { id: "ecoli-esbl", name: "E. coli (ESBL)", category: "gram-negative" },
  { id: "kleb", name: "Klebsiella pneumoniae", category: "gram-negative" },
  { id: "enterobacter", name: "Enterobacter cloacae", category: "gram-negative" },
  { id: "serratia", name: "Serratia marcescens", category: "gram-negative" },
  { id: "proteus", name: "Proteus mirabilis", category: "gram-negative" },
  { id: "pseudomonas", name: "Pseudomonas aeruginosa", category: "gram-negative" },
  { id: "acinetobacter", name: "Acinetobacter baumannii", category: "gram-negative" },
  { id: "hflu", name: "Haemophilus influenzae", category: "gram-negative" },
  { id: "moraxella", name: "Moraxella catarrhalis", category: "gram-negative" },

  // anaerobes
  { id: "bfrag", name: "Bacteroides fragilis", category: "anaerobe" },
  { id: "cdiff", name: "Clostridioides difficile", category: "anaerobe" },

  // atypicals
  { id: "legionella", name: "Legionella", category: "atypical" },
  { id: "mycoplasma", name: "Mycoplasma pneumoniae", category: "atypical" },
  { id: "chlamydia-pneumo", name: "Chlamydia pneumoniae", category: "atypical" },
]

// Coverage rows keyed by antibiotic id → { organism id → coverage }.
// y = typically covers | v = variable / regional resistance | n = no reliable activity
export const coverage: Record<string, Record<string, Coverage>> = {
  "pcn-g": {
    mssa: "n", mrsa: "n", cons: "n", "strep-pneumo": "v", gas: "y", viridans: "y",
    gbs: "y", efaecalis: "v", efaecium: "n", vre: "n",
    ecoli: "n", "ecoli-esbl": "n", kleb: "n", enterobacter: "n", serratia: "n",
    proteus: "n", pseudomonas: "n", acinetobacter: "n", hflu: "n", moraxella: "n",
    bfrag: "n", cdiff: "n", legionella: "n", mycoplasma: "n", "chlamydia-pneumo": "n",
  },
  "amp": {
    mssa: "n", mrsa: "n", cons: "n", "strep-pneumo": "y", gas: "y", viridans: "y",
    gbs: "y", efaecalis: "y", efaecium: "v", vre: "n",
    ecoli: "v", "ecoli-esbl": "n", kleb: "n", enterobacter: "n", serratia: "n",
    proteus: "v", pseudomonas: "n", acinetobacter: "n", hflu: "v", moraxella: "n",
    bfrag: "n", cdiff: "n", legionella: "n", mycoplasma: "n", "chlamydia-pneumo": "n",
  },
  "nafcillin": {
    mssa: "y", mrsa: "n", cons: "v", "strep-pneumo": "y", gas: "y", viridans: "y",
    gbs: "y", efaecalis: "n", efaecium: "n", vre: "n",
    ecoli: "n", "ecoli-esbl": "n", kleb: "n", enterobacter: "n", serratia: "n",
    proteus: "n", pseudomonas: "n", acinetobacter: "n", hflu: "n", moraxella: "n",
    bfrag: "n", cdiff: "n", legionella: "n", mycoplasma: "n", "chlamydia-pneumo": "n",
  },
  "amp-sulb": {
    mssa: "y", mrsa: "n", cons: "v", "strep-pneumo": "y", gas: "y", viridans: "y",
    gbs: "y", efaecalis: "y", efaecium: "v", vre: "n",
    ecoli: "y", "ecoli-esbl": "n", kleb: "v", enterobacter: "n", serratia: "n",
    proteus: "y", pseudomonas: "n", acinetobacter: "v", hflu: "y", moraxella: "y",
    bfrag: "y", cdiff: "n", legionella: "n", mycoplasma: "n", "chlamydia-pneumo": "n",
  },
  "amox-clav": {
    mssa: "y", mrsa: "n", cons: "v", "strep-pneumo": "y", gas: "y", viridans: "y",
    gbs: "y", efaecalis: "y", efaecium: "v", vre: "n",
    ecoli: "y", "ecoli-esbl": "n", kleb: "y", enterobacter: "n", serratia: "n",
    proteus: "y", pseudomonas: "n", acinetobacter: "n", hflu: "y", moraxella: "y",
    bfrag: "y", cdiff: "n", legionella: "n", mycoplasma: "n", "chlamydia-pneumo": "n",
  },
  "pip-tazo": {
    mssa: "y", mrsa: "n", cons: "v", "strep-pneumo": "y", gas: "y", viridans: "y",
    gbs: "y", efaecalis: "y", efaecium: "v", vre: "n",
    ecoli: "y", "ecoli-esbl": "v", kleb: "y", enterobacter: "y", serratia: "y",
    proteus: "y", pseudomonas: "y", acinetobacter: "v", hflu: "y", moraxella: "y",
    bfrag: "y", cdiff: "n", legionella: "n", mycoplasma: "n", "chlamydia-pneumo": "n",
  },
  "cefazolin": {
    mssa: "y", mrsa: "n", cons: "v", "strep-pneumo": "y", gas: "y", viridans: "y",
    gbs: "y", efaecalis: "n", efaecium: "n", vre: "n",
    ecoli: "y", "ecoli-esbl": "n", kleb: "y", enterobacter: "n", serratia: "n",
    proteus: "y", pseudomonas: "n", acinetobacter: "n", hflu: "v", moraxella: "v",
    bfrag: "n", cdiff: "n", legionella: "n", mycoplasma: "n", "chlamydia-pneumo": "n",
  },
  "ceftriaxone": {
    mssa: "y", mrsa: "n", cons: "n", "strep-pneumo": "y", gas: "y", viridans: "y",
    gbs: "y", efaecalis: "n", efaecium: "n", vre: "n",
    ecoli: "y", "ecoli-esbl": "n", kleb: "y", enterobacter: "v", serratia: "y",
    proteus: "y", pseudomonas: "n", acinetobacter: "n", hflu: "y", moraxella: "y",
    bfrag: "n", cdiff: "n", legionella: "n", mycoplasma: "n", "chlamydia-pneumo": "n",
  },
  "ceftazidime": {
    mssa: "v", mrsa: "n", cons: "n", "strep-pneumo": "v", gas: "y", viridans: "v",
    gbs: "y", efaecalis: "n", efaecium: "n", vre: "n",
    ecoli: "y", "ecoli-esbl": "n", kleb: "y", enterobacter: "v", serratia: "y",
    proteus: "y", pseudomonas: "y", acinetobacter: "v", hflu: "y", moraxella: "y",
    bfrag: "n", cdiff: "n", legionella: "n", mycoplasma: "n", "chlamydia-pneumo": "n",
  },
  "cefepime": {
    mssa: "y", mrsa: "n", cons: "v", "strep-pneumo": "y", gas: "y", viridans: "y",
    gbs: "y", efaecalis: "n", efaecium: "n", vre: "n",
    ecoli: "y", "ecoli-esbl": "v", kleb: "y", enterobacter: "y", serratia: "y",
    proteus: "y", pseudomonas: "y", acinetobacter: "v", hflu: "y", moraxella: "y",
    bfrag: "n", cdiff: "n", legionella: "n", mycoplasma: "n", "chlamydia-pneumo": "n",
  },
  "ceftaz-avi": {
    mssa: "v", mrsa: "n", cons: "n", "strep-pneumo": "v", gas: "y", viridans: "v",
    gbs: "y", efaecalis: "n", efaecium: "n", vre: "n",
    ecoli: "y", "ecoli-esbl": "y", kleb: "y", enterobacter: "y", serratia: "y",
    proteus: "y", pseudomonas: "y", acinetobacter: "n", hflu: "y", moraxella: "y",
    bfrag: "n", cdiff: "n", legionella: "n", mycoplasma: "n", "chlamydia-pneumo": "n",
  },
  "ertapenem": {
    mssa: "y", mrsa: "n", cons: "v", "strep-pneumo": "y", gas: "y", viridans: "y",
    gbs: "y", efaecalis: "n", efaecium: "n", vre: "n",
    ecoli: "y", "ecoli-esbl": "y", kleb: "y", enterobacter: "y", serratia: "y",
    proteus: "y", pseudomonas: "n", acinetobacter: "n", hflu: "y", moraxella: "y",
    bfrag: "y", cdiff: "n", legionella: "n", mycoplasma: "n", "chlamydia-pneumo": "n",
  },
  "meropenem": {
    mssa: "y", mrsa: "n", cons: "v", "strep-pneumo": "y", gas: "y", viridans: "y",
    gbs: "y", efaecalis: "v", efaecium: "n", vre: "n",
    ecoli: "y", "ecoli-esbl": "y", kleb: "y", enterobacter: "y", serratia: "y",
    proteus: "y", pseudomonas: "y", acinetobacter: "v", hflu: "y", moraxella: "y",
    bfrag: "y", cdiff: "n", legionella: "n", mycoplasma: "n", "chlamydia-pneumo": "n",
  },
  "aztreonam": {
    mssa: "n", mrsa: "n", cons: "n", "strep-pneumo": "n", gas: "n", viridans: "n",
    gbs: "n", efaecalis: "n", efaecium: "n", vre: "n",
    ecoli: "y", "ecoli-esbl": "n", kleb: "y", enterobacter: "y", serratia: "y",
    proteus: "y", pseudomonas: "y", acinetobacter: "n", hflu: "y", moraxella: "y",
    bfrag: "n", cdiff: "n", legionella: "n", mycoplasma: "n", "chlamydia-pneumo": "n",
  },
  "vancomycin": {
    mssa: "y", mrsa: "y", cons: "y", "strep-pneumo": "y", gas: "y", viridans: "y",
    gbs: "y", efaecalis: "y", efaecium: "v", vre: "n",
    ecoli: "n", "ecoli-esbl": "n", kleb: "n", enterobacter: "n", serratia: "n",
    proteus: "n", pseudomonas: "n", acinetobacter: "n", hflu: "n", moraxella: "n",
    bfrag: "n", cdiff: "y", legionella: "n", mycoplasma: "n", "chlamydia-pneumo": "n",
  },
  "linezolid": {
    mssa: "y", mrsa: "y", cons: "y", "strep-pneumo": "y", gas: "y", viridans: "y",
    gbs: "y", efaecalis: "y", efaecium: "y", vre: "y",
    ecoli: "n", "ecoli-esbl": "n", kleb: "n", enterobacter: "n", serratia: "n",
    proteus: "n", pseudomonas: "n", acinetobacter: "n", hflu: "n", moraxella: "n",
    bfrag: "n", cdiff: "n", legionella: "n", mycoplasma: "n", "chlamydia-pneumo": "n",
  },
  "daptomycin": {
    mssa: "y", mrsa: "y", cons: "y", "strep-pneumo": "y", gas: "y", viridans: "y",
    gbs: "y", efaecalis: "y", efaecium: "y", vre: "y",
    ecoli: "n", "ecoli-esbl": "n", kleb: "n", enterobacter: "n", serratia: "n",
    proteus: "n", pseudomonas: "n", acinetobacter: "n", hflu: "n", moraxella: "n",
    bfrag: "n", cdiff: "n", legionella: "n", mycoplasma: "n", "chlamydia-pneumo": "n",
  },
  "ciprofloxacin": {
    mssa: "v", mrsa: "n", cons: "n", "strep-pneumo": "n", gas: "v", viridans: "n",
    gbs: "v", efaecalis: "n", efaecium: "n", vre: "n",
    ecoli: "v", "ecoli-esbl": "v", kleb: "v", enterobacter: "y", serratia: "y",
    proteus: "y", pseudomonas: "y", acinetobacter: "v", hflu: "y", moraxella: "y",
    bfrag: "n", cdiff: "n", legionella: "y", mycoplasma: "y", "chlamydia-pneumo": "y",
  },
  "levofloxacin": {
    mssa: "v", mrsa: "n", cons: "n", "strep-pneumo": "y", gas: "y", viridans: "y",
    gbs: "y", efaecalis: "v", efaecium: "n", vre: "n",
    ecoli: "v", "ecoli-esbl": "v", kleb: "v", enterobacter: "y", serratia: "y",
    proteus: "y", pseudomonas: "v", acinetobacter: "v", hflu: "y", moraxella: "y",
    bfrag: "n", cdiff: "n", legionella: "y", mycoplasma: "y", "chlamydia-pneumo": "y",
  },
  "azithromycin": {
    mssa: "n", mrsa: "n", cons: "n", "strep-pneumo": "v", gas: "v", viridans: "v",
    gbs: "v", efaecalis: "n", efaecium: "n", vre: "n",
    ecoli: "n", "ecoli-esbl": "n", kleb: "n", enterobacter: "n", serratia: "n",
    proteus: "n", pseudomonas: "n", acinetobacter: "n", hflu: "y", moraxella: "y",
    bfrag: "n", cdiff: "n", legionella: "y", mycoplasma: "y", "chlamydia-pneumo": "y",
  },
  "doxycycline": {
    mssa: "y", mrsa: "y", cons: "v", "strep-pneumo": "y", gas: "v", viridans: "v",
    gbs: "v", efaecalis: "v", efaecium: "v", vre: "v",
    ecoli: "v", "ecoli-esbl": "v", kleb: "v", enterobacter: "v", serratia: "n",
    proteus: "n", pseudomonas: "n", acinetobacter: "v", hflu: "y", moraxella: "y",
    bfrag: "n", cdiff: "n", legionella: "y", mycoplasma: "y", "chlamydia-pneumo": "y",
  },
  "tmp-smx": {
    mssa: "y", mrsa: "y", cons: "v", "strep-pneumo": "v", gas: "n", viridans: "n",
    gbs: "n", efaecalis: "n", efaecium: "n", vre: "n",
    ecoli: "v", "ecoli-esbl": "v", kleb: "v", enterobacter: "v", serratia: "v",
    proteus: "v", pseudomonas: "n", acinetobacter: "v", hflu: "y", moraxella: "y",
    bfrag: "n", cdiff: "n", legionella: "n", mycoplasma: "n", "chlamydia-pneumo": "n",
  },
  "clindamycin": {
    mssa: "y", mrsa: "v", cons: "v", "strep-pneumo": "y", gas: "y", viridans: "y",
    gbs: "y", efaecalis: "n", efaecium: "n", vre: "n",
    ecoli: "n", "ecoli-esbl": "n", kleb: "n", enterobacter: "n", serratia: "n",
    proteus: "n", pseudomonas: "n", acinetobacter: "n", hflu: "n", moraxella: "n",
    bfrag: "v", cdiff: "n", legionella: "n", mycoplasma: "n", "chlamydia-pneumo": "n",
  },
  "metronidazole": {
    mssa: "n", mrsa: "n", cons: "n", "strep-pneumo": "n", gas: "n", viridans: "n",
    gbs: "n", efaecalis: "n", efaecium: "n", vre: "n",
    ecoli: "n", "ecoli-esbl": "n", kleb: "n", enterobacter: "n", serratia: "n",
    proteus: "n", pseudomonas: "n", acinetobacter: "n", hflu: "n", moraxella: "n",
    bfrag: "y", cdiff: "y", legionella: "n", mycoplasma: "n", "chlamydia-pneumo": "n",
  },
}
