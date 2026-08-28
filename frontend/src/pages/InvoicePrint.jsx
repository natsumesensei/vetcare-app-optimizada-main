import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Printer, ArrowLeft, Download, CheckCircle2 } from "lucide-react";
import api from "../api/apiClient";
import { getCurrencySymbol } from "../utils/currency";

export default function InvoicePrint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const { data } = await api.get(`/invoices/${id}`);
        setInvoice(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-500">
        Cargando factura para impresión...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4">
        <p className="text-base font-semibold text-slate-700">Factura no encontrada</p>
        <button
          onClick={() => navigate("/invoices")}
          className="mt-4 px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl"
        >
          Volver a Facturación
        </button>
      </div>
    );
  }

  const clinic = invoice.clinic || {};
  const currencySymbol = getCurrencySymbol(invoice.currency || clinic.currency || "EUR");

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 print:bg-white print:p-0">
      {/* Barra superior de control (oculta en print) */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate("/invoices")}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs"
        >
          <ArrowLeft size={16} /> Volver a Facturación
        </button>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm"
        >
          <Printer size={16} /> Imprimir / Guardar en PDF
        </button>
      </div>

      {/* Documento A4 */}
      <div className="max-w-3xl mx-auto bg-white p-10 rounded-2xl shadow-lg border border-slate-200 print:border-0 print:shadow-none print:p-0 text-slate-900 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {clinic.clinic_name || "VetCare Clínica Dr. Saladin"}
            </h1>
            <div className="text-xs text-slate-600 mt-1 space-y-0.5">
              <p>{clinic.address || "Calle Mayor 45, 28013 Madrid"}</p>
              <p>
                NIF: <span className="font-semibold">{clinic.nif || "B-12345678"}</span> · Colegiado:{" "}
                <span className="font-semibold">{clinic.license_number || "COL-MAD-4521"}</span>
              </p>
              <p>
                Tel: {clinic.phone || "+34 912 345 678"} · Email: {clinic.email || "contacto@vetcare-saladin.es"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-teal-700 uppercase tracking-wider">
              FACTURA SIMPLIFICADA
            </div>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {invoice.invoice_number}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Fecha de emisión: <span className="font-semibold text-slate-800">{invoice.issue_date}</span>
            </div>
            <div className="mt-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full inline-block border border-emerald-200">
              {invoice.status}
            </div>
          </div>
        </div>

        {/* Cliente & Mascota */}
        <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <div className="font-bold text-slate-400 uppercase tracking-wider mb-1">
              Datos del Cliente / Pagador
            </div>
            <div className="font-bold text-sm text-slate-900">{invoice.owner_name}</div>
            {invoice.tax_id && <div className="text-slate-600">NIF/DNI: {invoice.tax_id}</div>}
            {invoice.owner_address && <div className="text-slate-600">{invoice.owner_address}</div>}
            {invoice.owner_phone && <div className="text-slate-600">Tel: {invoice.owner_phone}</div>}
          </div>

          <div>
            <div className="font-bold text-slate-400 uppercase tracking-wider mb-1">
              Paciente
            </div>
            {invoice.patient_name ? (
              <>
                <div className="font-bold text-sm text-slate-900">{invoice.patient_name}</div>
                <div className="text-slate-600">
                  {invoice.patient_species} · {invoice.patient_breed || "Mestizo"}
                </div>
                {invoice.patient_microchip && (
                  <div className="text-slate-600">Chip: {invoice.patient_microchip}</div>
                )}
              </>
            ) : (
              <div className="text-slate-400 italic">Servicios veterinarios generales</div>
            )}
          </div>
        </div>

        {/* Conceptos */}
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-200 text-slate-500 font-bold uppercase">
              <th className="py-2.5">Concepto / Servicio</th>
              <th className="py-2.5 text-center">Cant.</th>
              <th className="py-2.5 text-right">Precio Unit.</th>
              <th className="py-2.5 text-center">IVA</th>
              <th className="py-2.5 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {invoice.items?.map((it, idx) => (
              <tr key={idx}>
                <td className="py-3 font-semibold text-slate-900">{it.description}</td>
                <td className="py-3 text-center">{it.quantity}</td>
                <td className="py-3 text-right">
                  {Number(it.unit_price).toFixed(2)} {currencySymbol}
                </td>
                <td className="py-3 text-center">{it.tax_rate}%</td>
                <td className="py-3 text-right font-bold text-slate-900">
                  {Number(it.total).toFixed(2)} {currencySymbol}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totales */}
        <div className="flex justify-end pt-4 border-t border-slate-200">
          <div className="w-64 space-y-1.5 text-xs text-slate-700">
            <div className="flex justify-between">
              <span>Base Imponible:</span>
              <span className="font-semibold">
                {Number(invoice.subtotal || 0).toFixed(2)} {currencySymbol}
              </span>
            </div>
            {Number(invoice.discount_rate) > 0 && (
              <div className="flex justify-between text-teal-700">
                <span>Descuento ({invoice.discount_rate}%):</span>
                <span className="font-semibold">
                  -{Number(invoice.discount_amount || 0).toFixed(2)} {currencySymbol}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>IVA:</span>
              <span className="font-semibold">
                {Number(invoice.tax || 0).toFixed(2)} {currencySymbol}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-900 text-sm font-black text-slate-900">
              <span>TOTAL:</span>
              <span>
                {Number(invoice.total || 0).toFixed(2)} {currencySymbol}
              </span>
            </div>
          </div>
        </div>

        {/* Legal & Firma */}
        <div className="pt-8 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
          <p>
            <span className="font-bold text-slate-700">Forma de pago:</span> {invoice.payment_method}
          </p>
          {invoice.notes && (
            <p>
              <span className="font-bold text-slate-700">Observaciones:</span> {invoice.notes}
            </p>
          )}
          <p className="text-[10px] text-slate-400 pt-4">
            {clinic.legal_notes ||
              "Centro Veterinario Autorizado. Factura simplificada emitida de acuerdo con la legislación vigente."}
          </p>
        </div>
      </div>
    </div>
  );
}
