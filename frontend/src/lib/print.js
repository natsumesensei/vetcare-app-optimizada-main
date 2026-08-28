export function printDocument(title, body, clinic={}) {
  const w=window.open('', '_blank', 'width=1000,height=800');
  if(!w) return;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>
  @page{size:A4;margin:14mm}body{font-family:Arial,sans-serif;color:#172033;font-size:12px;line-height:1.45}h1{font-size:22px;margin:0}h2{font-size:16px;border-bottom:2px solid #dbe4ef;padding-bottom:5px;margin-top:20px}.header{display:flex;justify-content:space-between;border-bottom:2px solid #1e6aa8;padding-bottom:12px;margin-bottom:18px}.muted{color:#64748b}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.box{border:1px solid #dbe4ef;border-radius:6px;padding:9px;margin:6px 0}table{width:100%;border-collapse:collapse;margin-top:7px}th,td{border:1px solid #dbe4ef;padding:6px;text-align:left}th{background:#f1f5f9}.sign{margin-top:55px;display:grid;grid-template-columns:1fr 1fr;gap:80px}.sign div{border-top:1px solid #334155;padding-top:5px;text-align:center}.pill{display:inline-block;padding:3px 7px;border-radius:10px;background:#eef6ff}.no-print{display:none!important}@media print{.no-print{display:none!important}}
  </style></head><body><div class="header"><div><h1>${clinic.clinic_name||clinic.clinic_name||'Clínica Veterinaria'}</h1><div class="muted">${clinic.address||''} · ${clinic.phone||''} · ${clinic.email||''}</div></div><div class="muted">${clinic.veterinarian||''}</div></div>${body}</body></html>`);
  w.document.close(); w.focus(); setTimeout(()=>w.print(),250);
}
