// Layout físico de cada planta. Cada fila del outer array es una fila del depósito;
// cada inner array es una sección (A, B, C...) separada por pasillos.
// Fuente: relevamiento STOCK.xlsx hojas "disposición pl2" / "disposición pl3".

export const PL2_LAYOUT: string[][][] = [
    // Fila delantera (ingreso)
    [['A04', 'A03', 'A02', 'A01'], ['B04', 'B03', 'B02', 'B01', 'B14'], ['C04', 'C03', 'C02', 'C01']],
    // Fila central
    [['A05', 'A06', 'A07', 'A08'], ['B05', 'B06', 'B07', 'B08', 'B11'], ['C05', 'C06', 'C07', 'C08']],
    // Fila trasera
    [['A12', 'A11', 'A10', 'A09'], ['B12', 'B11', 'B10', 'B09', 'B02'], ['C12', 'C11', 'C10', 'C09']],
]

export const PL3_LAYOUT: string[][][] = [
    // Fila trasera
    [['A15', 'A16', 'A17', 'A18', 'A19', 'A20', 'A21'], ['B13', 'B14', 'B15', 'B16', 'B17', 'B18']],
    // Fila central
    [['A14', 'A13', 'A12', 'A11', 'A10', 'A09', 'A08'], ['B12', 'B11', 'B10', 'B09', 'B08', 'B07']],
    // Fila delantera (ingreso)
    [['A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07'], ['B01', 'B02', 'B03', 'B04', 'B05', 'B06']],
]

export const PL2_SECTION_LABELS = ['A', 'B', 'C']
export const PL3_SECTION_LABELS = ['A', 'B']

export const PL2_ROW_LABELS = ['Frente', 'Centro', 'Fondo']
export const PL3_ROW_LABELS = ['Fondo', 'Centro', 'Frente']
