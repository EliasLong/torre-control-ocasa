import { fetchSheetRows, parseSheetDate } from '@/lib/raw-sources';
import type { CamionMovimiento } from '@/types';

// Sheet ID del registro de portones/camiones
const SHEET_CAMIONES_ID = '1BTlpe6EtwsTjIHgqjHvJcPIj6V25GJmwaY3hlxp6lKk';

// Nombre de la pestaña — configurar via env var SHEET_CAMIONES_TAB si difiere de 'Hoja1'
const SHEET_CAMIONES_TAB = process.env.SHEET_CAMIONES_TAB ?? 'Hoja 1';

/** Encuentra el índice de una columna por su nombre de header (case-insensitive) */
function findCol(headers: string[], name: string): number {
  return headers.findIndex(h => h.toLowerCase().trim() === name.toLowerCase());
}

/**
 * Parsea un campo que puede ser "DD/MM/YYYY" o "DD/MM/YYYY HH:MM:SS" o "DD/MM/YYYY HH:MM".
 * Devuelve la fecha en YYYY-MM-DD y la hora como string, o nulls si está vacío.
 */
function parseDateTimeField(raw: string): { fecha: string | null; hora: string | null } {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return { fecha: null, hora: null };

  const spaceIdx = trimmed.indexOf(' ');
  const datePart = spaceIdx !== -1 ? trimmed.slice(0, spaceIdx) : trimmed;
  const timePart = spaceIdx !== -1 ? trimmed.slice(spaceIdx + 1).trim() : null;

  const fecha = parseSheetDate(datePart);
  // Normalizar hora a HH:MM (quitar segundos si los hay)
  const hora = timePart ? timePart.slice(0, 5) : null;

  return { fecha, hora };
}

export async function getCamionesDelDia(fecha: string): Promise<CamionMovimiento[]> {
  const rows = await fetchSheetRows(SHEET_CAMIONES_ID, SHEET_CAMIONES_TAB);
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim().toLowerCase());

  const idxPatente = findCol(headers, 'patente tractor');
  const idxContenedor = findCol(headers, 'contenedor');
  const idxEmpresa = findCol(headers, 'empresa');
  const idxFechaIngreso = findCol(headers, 'fecha ingreso');
  const idxFechaEgreso = findCol(headers, 'fecha egreso');

  // Si no encontró columnas críticas, loguea y devuelve vacío
  if (idxPatente === -1 || idxFechaIngreso === -1) {
    console.warn(
      '[camiones.service] No se encontraron columnas requeridas en el Sheet.',
      'Headers encontrados:', headers,
    );
    return [];
  }

  const result: CamionMovimiento[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    const { fecha: fechaIngreso, hora: horaIngreso } = parseDateTimeField(row[idxFechaIngreso] ?? '');

    // Filtrar solo los que ingresaron hoy
    if (!fechaIngreso || fechaIngreso !== fecha) continue;

    const { fecha: fechaEgreso, hora: horaEgreso } = parseDateTimeField(
      idxFechaEgreso !== -1 ? (row[idxFechaEgreso] ?? '') : ''
    );

    const contenedorRaw = idxContenedor !== -1 ? (row[idxContenedor] ?? '').trim() : '';

    result.push({
      patente: idxPatente !== -1 ? (row[idxPatente] ?? '').trim() : '',
      contenedor: contenedorRaw || null,
      empresa: idxEmpresa !== -1 ? (row[idxEmpresa] ?? '').trim() : '',
      fechaIngreso,
      horaIngreso,
      fechaEgreso,
      horaEgreso,
      estado: fechaEgreso ? 'egresado' : 'en_predio',
    });
  }

  return result;
}
