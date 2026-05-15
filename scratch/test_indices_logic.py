
def get_column_indices(header):
    def find(names):
        h_upper = [h.upper().strip() for h in header]
        # Try exact match first
        for name in names:
            name_upper = name.upper()
            try:
                return h_upper.index(name_upper)
            except ValueError:
                continue
        # Fallback to includes
        for name in names:
            name_upper = name.upper()
            for i, h in enumerate(h_upper):
                if name_upper in h:
                    return i
        return -1

    return {
        "cliente": find(['CLIENTE']),
    }

pl2_headers = ['Fecha De Transaccion', 'Codigo De Organizacion', 'Articulo', 'Descripcion', 'Cantidad  Transaccin', 'Costo  Total  Transaccin', 'Unidad de Medida Primaria', 'Subinventario', 'Localizador', 'Subinventario Transferencia', 'Lpn Transferido', 'Tipo De Origen', 'Accion', 'Tipo De Transaccion', 'Usuario', 'TURNO', 'Lpn Contenido', 'Origen', 'Cliente', 'CLIENTE', 'Lpn']

print(f"PL2 Indices: {get_column_indices(pl2_headers)}")

pl3_headers = ['Fecha De Transaccion', 'Codigo De Organizacion', 'Articulo', 'Descripcion', 'Cantidad  Transaccin', 'Costo  Total  Transaccin', 'Unidad de Medida Primaria', 'Subinventario', 'Localizador', 'Subinventario Transferencia', 'Lpn Transferido', 'Tipo De Origen', 'Accion', 'Tipo De Transaccion', 'Usuario', 'TURNO', 'CLIENTE', 'Lpn Contenido', 'Lpn']

print(f"PL3 Indices: {get_column_indices(pl3_headers)}")
