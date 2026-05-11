
const pickingMovs = [
  { fecha: '2026-05-11', cliente: 'B2C', lpnTransferido: 'B2C001', cantidad: 10 },
  { fecha: '2026-05-11', cliente: 'B2B', lpnTransferido: 'B2B001', cantidad: 20 },
  { fecha: '2026-05-11', cliente: 'OCASA', lpnTransferido: 'B2B002', cantidad: 30 },
  { fecha: '2026-05-11', cliente: 'FARMACITY', lpnTransferido: 'B2C002', cantidad: 40 },
  { fecha: '2026-05-11', cliente: 'OTRO', lpnTransferido: 'OTRO001', cantidad: 50 }, // Should be ignored
];

let bultosB2C = 0;
let bultosB2B = 0;

for (const mov of pickingMovs) {
  const cantidad = Math.abs(mov.cantidad);
  const cli = (mov.cliente || '').toUpperCase();
  const lpn = (mov.lpnTransferido || '').toUpperCase();

  const isB2C = cli === 'B2C' || lpn.startsWith('B2C');
  const isB2B = cli === 'B2B' || lpn.startsWith('B2B');

  if (isB2C) {
    bultosB2C += cantidad;
  } else if (isB2B) {
    bultosB2B += cantidad;
  }
}

console.log('B2C:', bultosB2C); // Expected: 10 + 40 = 50
console.log('B2B:', bultosB2B); // Expected: 20 + 30 = 50
