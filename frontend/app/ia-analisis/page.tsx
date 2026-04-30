'use client';
import { useState } from 'react';
import axios from 'axios';
import { BrainCircuit, ShieldAlert, Loader2, Target, Lightbulb, TrendingUp } from 'lucide-react';
import API_URL from '@/lib/api';

export default function AnalisisIA() {
  const [analisis, setAnalisis] = useState("");
  const [cargando, setCargando] = useState(false);

  const ejecutarIA = async () => {
    setCargando(true);
    setAnalisis("");
    try {
      // Simulación de delay para dar peso al análisis de la IA
      const res = await axios.get(`${API_URL}/ia/analizar-riesgo`);
      setAnalisis(res.data.diagnostico);
    } catch (err) {
      setAnalisis("Error crítico: No se pudo conectar con Gemini 3 Flash. Verifica el servidor backend.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-[#001F3F] border-b-4 border-[#800020] mb-8 flex gap-3 items-center uppercase tracking-tighter">
          <BrainCircuit className="text-[#800020]" size={40} /> 
          Análisis Predictivo de Personal
        </h1>
        
        <div className="bg-white border-2 border-zinc-200 p-10 rounded-[2rem] shadow-2xl text-center">
          <p className="text-zinc-500 mb-8 font-medium italic">
            El motor de IA procesará el historial de inasistencias para detectar patrones de deserción o agotamiento laboral.
          </p>

          <button 
            onClick={ejecutarIA}
            disabled={cargando}
            className={`
              ${cargando ? 'bg-zinc-400' : 'bg-[#800020] hover:bg-[#001F3F]'} 
              text-white px-10 py-5 rounded-2xl font-black transition-all shadow-xl mb-6 flex items-center gap-3 mx-auto uppercase tracking-widest
            `}
          >
            {cargando ? <Loader2 className="animate-spin" /> : <Target size={20} />}
            {cargando ? "Procesando Big Data..." : "EJECUTAR DIAGNÓSTICO IA"}
          </button>
          
          {analisis && (
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Encabezado del Informe */}
              <div className="flex items-center justify-between mb-4 border-b pb-2">
                <div className="flex items-center gap-2 text-[#800020] font-black uppercase text-sm">
                  <ShieldAlert size={18} /> Informe Detallado de Sistema
                </div>
                <span className="text-[10px] bg-zinc-100 px-2 py-1 rounded text-zinc-400 font-mono">
                  MODEL: GEMINI-3-FLASH-LATEST
                </span>
              </div>

              {/* Grid de Detalles Descriptivos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-left">
                <div className="p-4 bg-[#001f3f08] rounded-xl border-l-4 border-[#001F3F]">
                  <h3 className="text-[#001F3F] font-bold text-xs flex items-center gap-2 mb-2 uppercase">
                    <TrendingUp size={14} /> Patrón Detectado
                  </h3>
                  <p className="text-zinc-600 text-sm leading-relaxed">
                    Identificación de recurrencias en días específicos (Lunes/Viernes) y acumulación de permisos económicos.
                  </p>
                </div>
                <div className="p-4 bg-[#80002008] rounded-xl border-l-4 border-[#800020]">
                  <h3 className="text-[#800020] font-bold text-xs flex items-center gap-2 mb-2 uppercase">
                    <Lightbulb size={14} /> Sugerencia Administrativa
                  </h3>
                  <p className="text-zinc-600 text-sm leading-relaxed">
                    Entrevista de seguimiento para evaluar clima laboral o posibles problemas de salud crónicos.
                  </p>
                </div>
              </div>

              {/* Diagnóstico Principal */}
              <div className="bg-zinc-900 text-zinc-100 p-8 rounded-2xl text-left shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <BrainCircuit size={80} />
                </div>
                <h4 className="text-[#f1f1f1] font-bold mb-4 flex items-center gap-2 border-b border-zinc-700 pb-2">
                  Diagnóstico de la IA:
                </h4>
                <p className="text-zinc-300 leading-relaxed font-medium whitespace-pre-line text-lg">
                  {analisis}
                </p>
              </div>

              <p className="mt-4 text-[10px] text-zinc-400 italic">
                * Este análisis es una sugerencia automatizada. La decisión final corresponde a Recursos Humanos.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}