// Layout físico de cada planta. Cada fila del outer array es una fila del depósito;
// cada inner array es una sección (A, B, C...) separada por pasillos.
// Fuente: plano CAD PL2 (adjuntado por el usuario) + disposición PL3 (demo-ocupacion).

export const PL2_LAYOUT: string[][][] = [
    // Frente (ingreso)
    [['A01', 'A02', 'A03', 'A04'], ['B01', 'B02', 'B03', 'B04'], ['C01', 'C02', 'C03', 'C04']],
    // Centro
    [['A08', 'A07', 'A06', 'A05'], ['B08', 'B07', 'B06', 'B05'], ['C08', 'C07', 'C06', 'C05']],
    // Fondo
    [['A09', 'A10', 'A11', 'A12'], ['B09', 'B10', 'B11', 'B12'], ['C09', 'C10', 'C11', 'C12']],
]

export const PL3_LAYOUT: string[][][] = [
    // Frente (ingreso)
    [['A15', 'A16', 'A17', 'A18', 'A19', 'A20', 'A21'], ['B13', 'B14', 'B15', 'B16', 'B17', 'B18']],
    // Centro
    [['A14', 'A13', 'A12', 'A11', 'A10', 'A09', 'A08'], ['B12', 'B11', 'B10', 'B09', 'B08', 'B07']],
    // Fondo
    [['A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07'], ['B01', 'B02', 'B03', 'B04', 'B05', 'B06']],
]

export const PL2_SECTION_LABELS = ['A', 'B', 'C']
export const PL3_SECTION_LABELS = ['A', 'B']

export const PL2_ROW_LABELS = ['Frente', 'Centro', 'Fondo']
export const PL3_ROW_LABELS = ['Frente', 'Centro', 'Fondo']
