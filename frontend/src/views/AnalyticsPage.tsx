import React, { useEffect, useState, useRef } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { fetchAuth } from '../hooks/useAuth'; 
import type { AnalyticsResponse } from '../types/analyticsTypes';

const COLORS = ['#2563eb', '#93c5fd'];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false); 
  
  const reportRef = useRef<HTMLDivElement>(null);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        setLoading(true);
        const response = await fetchAuth(`${apiUrl}/api/userJ/analytics`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error("Error cargando estadísticas:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarEstadisticas();
  }, [apiUrl]);

  const prepararCanvas = async () => {
    if (!reportRef.current) return null;
    
    await new Promise(resolve => setTimeout(resolve, 800));

    return await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        const report = clonedDoc.getElementById('pdf-content');
        if (report) {
          const allElements = report.querySelectorAll('*');
          allElements.forEach((el) => {
            const element = el as HTMLElement;
            const style = window.getComputedStyle(element);
            if (style.color.includes('okl')) element.style.color = '#1f2937';
            if (style.backgroundColor.includes('okl')) element.style.backgroundColor = '#ffffff';
            if (style.borderColor.includes('okl')) element.style.borderColor = '#e5e7eb';
            
            element.style.backgroundImage = 'none';
            element.style.filter = 'none';
            element.style.boxShadow = 'none';
            element.style.textShadow = 'none';
          });
        }

        const styleTag = clonedDoc.createElement('style');
        styleTag.innerHTML = `
          * { 
            color: #1f2937 !important; 
            border-color: #e5e7eb !important;
            box-shadow: none !important;
            text-shadow: none !important;
            background-image: none !important;
          }
          svg text { fill: #9ca3af !important; }
          .bg-blue-600 { background-color: #2563eb !important; }
          .bg-gray-50 { background-color: #f9fafb !important; }
        `;
        clonedDoc.head.appendChild(styleTag);

        const containers = clonedDoc.querySelectorAll('.recharts-responsive-container');
        containers.forEach((container) => {
          (container as HTMLElement).style.width = '700px';
          (container as HTMLElement).style.height = '350px';
        });
      }
    });
  };

  const exportarPDF = async () => {
    try {
      setExporting(true);
      const canvas = await prepararCanvas();
      if (!canvas) return;

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pdfWidth - 20; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 15, imgWidth, imgHeight);
      pdf.save(`Reporte_Negocio_${new Date().toLocaleDateString()}.pdf`);
    } catch (error) {
      console.error("Error crítico:", error);
      alert("Error al generar el PDF.");
    } finally {
      setExporting(false);
    }
  };

  const enviarPorEmail = async () => {
    try {
      setSendingEmail(true);
      const canvas = await prepararCanvas();
      if (!canvas) return;

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pdfWidth - 20; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 15, imgWidth, imgHeight);

      const base64PDF = pdf.output('datauristring').split(',')[1];

      const response = await fetchAuth(`${apiUrl}/api/userJ/send-analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: base64PDF,
          fileName: `Reporte_${new Date().toLocaleDateString()}.pdf`
        })
      });

      if (response.ok) {
        alert("📊 ¡Analíticas enviadas con éxito a tu email!");
      } else {
        alert("Error al enviar el email.");
      }
    } catch (error) {
      console.error(error);
      alert("Error crítico al intentar enviar.");
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold">Cargando análisis...</div>;
  if (!data) return <div className="p-10 text-center text-red-500">Error al cargar datos.</div>;

  const ticketMedio = data.kpis.citasMes > 0 
    ? (data.kpis.ingresosMes / data.kpis.citasMes).toFixed(2) 
    : "0";

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-800">Estadísticas</h2>
        
        <div className="flex gap-3">
          <button
            onClick={enviarPorEmail}
            disabled={sendingEmail || exporting}
            className="px-4 py-2 sm:px-6 bg-gray-800 text-white rounded-xl font-bold hover:bg-black disabled:bg-gray-300 transition-colors text-sm sm:text-base"
          >
            {sendingEmail ? 'Enviando...' : 'Enviar Email'}
          </button>

          <button
            onClick={exportarPDF}
            disabled={exporting || sendingEmail}
            className="px-4 py-2 sm:px-6 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-300 transition-colors text-sm sm:text-base"
          >
            {exporting ? 'Procesando...' : 'Descargar PDF'}
          </button>
        </div>
      </div>

      {/* Reducimos el padding en móvil (p-4 en móvil, p-8 en desktop) para dar más espacio horizontal */}
      <div ref={reportRef} id="pdf-content" className="bg-white p-4 sm:p-8 space-y-10 border border-gray-100 rounded-3xl shadow-sm">
        
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Ingresos Mes" value={`${data.kpis.ingresosMes}€`} />
          <StatCard title="Citas Finalizadas" value={data.kpis.citasMes.toString()} />
          <StatCard title="Ticket Medio" value={`${ticketMedio}€`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gráfico de Líneas */}
          <div className="p-4 sm:p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-6 tracking-widest">Evolución de Ingresos</h3>
            {/* Control dinámico de altura mediante clases globales y dejamos fluir el ancho */}
            <div className="w-full h-[260px] sm:h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                {/* Agregamos el objeto margin para recuperar espacio en los lados en pantallas pequeñas */}
                <LineChart 
                  data={data.ingresos} 
                  id="line-chart-analytics"
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#9ca3af'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#9ca3af'}} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#2563eb" 
                    strokeWidth={4} 
                    dot={{ r: 4, fill: '#2563eb' }}
                    isAnimationActive={false} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de Tarta */}
          <div className="p-4 sm:p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-6 tracking-widest">Fidelización de Clientes</h3>
            <div className="w-full h-[300px] sm:h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart id="pie-chart-analytics">
                  <Pie 
                    data={data.fidelizacion} 
                    dataKey="value" 
                    // Reducimos sutilmente los radios para móvil para evitar desbordes con las leyendas
                    innerRadius={window.innerWidth < 640 ? 55 : 70} 
                    outerRadius={window.innerWidth < 640 ? 85 : 100}
                    isAnimationActive={false}
                  >
                    {data.fidelizacion.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '13px' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string, value: string }) {
  return (
    // Reducimos padding interno del card en móvil de p-8 a p-6
    <div className="p-6 sm:p-8 bg-gray-50 rounded-3xl border border-gray-100">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{title}</p>
      <p className="text-2xl sm:text-3xl font-black text-gray-900">{value}</p>
    </div>
  );
}
