
def get_column_indices(header):
    def find(names):
        # 1. Try exact match (case sensitive)
        for name in names:
            try:
                return header.index(name)
            except ValueError:
                continue
        
        # 2. Try exact match (case insensitive)
        h_upper = [h.upper().strip() for h in header]
        for name in names:
            name_upper = name.upper()
            try:
                return h_upper.index(name_upper)
            except ValueError:
                continue
                
        # 3. Fallback to includes
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

print(f"PL2 Indices (Improved): {get_column_indices(pl2_headers)}")
