'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';
import API_URL from '@/lib/api';

interface Docente {
  id: number;
  nombre_completo: string;
}

export default function RegistroInasistencias() {
  const router = useRouter();
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [form, setForm] = useState({
    personal_id: '',
    fecha: '',
    horario: '',
    motivo: '',
    archivo: null as File | null
  });

  useEffect(() => {
    axios.get(`${API_URL}/personal/listar`)
      .then(res => setDocentes(res.data))
      .catch((err: unknown) => {
        console.error("Error cargando docentes:", err);
      });
  }, []);

  const guardarInasistencia = async () => {
    if (!form.personal_id || !form.fecha || !form.horario || !form.motivo) {
      return Swal.fire('Atención', 'Llena todos los campos', 'info');
    }

    try {
      const formData = new FormData();
      formData.append("personal_id", form.personal_id);
      formData.append("fecha", form.fecha);
      formData.append("horario", form.horario);
      formData.append("motivo", form.motivo);
      formData.append("tipo", "FALTA");
      formData.append("obs", "Sin observaciones");
      if (form.archivo) {
        formData.append("archivo", form.archivo);
      }

      const res = await axios.post(`${API_URL}/inasistencias/registrar`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      if (res.data && res.data.id) {
        const reporteUrl = `${API_URL}/inasistencias/reporte/${res.data.id}`;
        
        Swal.fire({
          title: '¡Inasistencia Registrada!',
          text: 'El reporte está listo para descargar.',
          icon: 'success',
          showCancelButton: true,
          confirmButtonText: 'Descargar Reporte',
          cancelButtonText: 'Aceptar',
          reverseButtons: true,
          buttonsStyling: false,
          customClass: {
            popup: 'rounded-3xl shadow-2xl',
            title: 'font-black text-[#001F3F]',
            confirmButton: 'bg-[#800020] text-white font-bold px-6 py-3 rounded-xl ml-2 hover:bg-opacity-90 transition-all',
            cancelButton: 'bg-[#001F3F] text-white font-bold px-6 py-3 rounded-xl mr-2 hover:bg-opacity-90 transition-all'
          }
        }).then((result) => {
          if (result.isConfirmed) {
            window.open(reporteUrl, '_blank');
          }
        });
      }
    } catch (err: unknown) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          Swal.fire('Error 404', 'La ruta /inasistencias/registrar no existe en el backend', 'error');
        } else {
          Swal.fire('Error', 'Hubo un problema con el servidor', 'error');
        }
      } else {
        Swal.fire('Error', 'Error inesperado', 'error');
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 p-10 flex items-center justify-center">
      <button
        onClick={() => router.push('/')}
        className="fixed top-5 left-5 flex items-center gap-3 bg-[#001F3F] hover:bg-[#003366] text-white font-black px-6 py-3 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 z-50 text-base"
      >
        <ArrowLeft size={18} />
        <span className="text-sm uppercase tracking-wide">Inicio</span>
      </button>

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg h-fit">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">REGISTRO DE FALTAS</h1>
        
        <div className="flex flex-col gap-4">
          <select 
            className="p-3 border rounded-lg text-black"
            value={form.personal_id}
            onChange={(e) => setForm({...form, personal_id: e.target.value})}
          >
            <option value="">Selecciona Docente</option>
            {docentes.map((d) => (
              <option key={d.id} value={d.id}>{d.nombre_completo}</option>
            ))}
          </select>

          <input 
            type="date" 
            className="p-3 border rounded-lg text-black"
            onChange={(e) => setForm({...form, fecha: e.target.value})}
          />

          <select 
            className="p-3 border rounded-lg text-black"
            onChange={(e) => setForm({...form, horario: e.target.value})}
          >
            <option value="">Horario</option>
            <option>7:00 - 14:00</option>
            <option>8:00 - 14:00</option>
            <option>9:00 - 14:00</option>
            <option>10:00 - 14:00</option>
            <option>11:00 - 14:00</option>
            <option>7:00 - 13:00</option>
            <option>8:00 - 13:00</option>
            <option>9:00 - 13:00</option>
            <option>10:00 - 13:00</option>
            <option>7:00 - 12:00</option>
            <option>8:00 - 12:00</option>
          </select>

          <select
            className="p-3 border rounded-lg text-black"
            onChange={(e) => setForm({...form, motivo: e.target.value})}
          >
            <option value="">Motivo</option>
            <option>Cita médica</option>
            <option>Capacitación</option>
            <option>Comisión</option>
            <option>Asuntos personales</option>
            <option>Permiso extraordinario</option>
            <option>Otro</option>
          </select>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-600 font-medium">Adjuntar documento (PDF)</span>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setForm({...form, archivo: e.target.files?.[0] ?? null})}
              className="p-3 border rounded-lg text-black bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#001F3F] file:text-white file:font-bold file:cursor-pointer hover:file:bg-[#003366] cursor-pointer"
            />
          </label>

          <button 
            onClick={guardarInasistencia}
            className="bg-red-800 text-white p-4 rounded-lg font-bold hover:bg-red-700 cursor-pointer active:scale-95 transition-all"
          >
            GUARDAR
          </button>
        </div>
      </div>
    </div>
  );
}