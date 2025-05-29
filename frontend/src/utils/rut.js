export function formatearRut(rutInput) {
    if (!rutInput) return '';
    // Limpiar: sacar puntos y guiones y convertir K a mayúscula
    let cleanRut = rutInput.replace(/[^0-9kK]/g, '').toUpperCase();
    // Separar dv
    let cuerpo = cleanRut.slice(0, -1);
    let dv = cleanRut.slice(-1);

    // Si el RUT tiene menos de 7 dígitos no se formatea
    if (cuerpo.length < 7) return cleanRut;

    // Aplicar formato
    let rutFormateado = '';
    let i = 0;
    for (let j = cuerpo.length - 1; j >= 0; j--) {
        rutFormateado = cuerpo[j] + rutFormateado;
        i++;
        if (i % 3 === 0 && j !== 0) rutFormateado = '.' + rutFormateado;
    }
    return `${rutFormateado}-${dv}`;
}

export function limpiarRut(rut) {
    if (!rut) return '';
    return rut.replace(/[^0-9kK]/g, '').toUpperCase();
}