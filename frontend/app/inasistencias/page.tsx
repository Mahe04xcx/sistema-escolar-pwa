'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import API_URL from '@/lib/api';

interface Docente {
  id: number;
  nombre_completo: string;
}

export default function RegistroInasistencias() {
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [form, setForm] = useState({
    personal_id: '',
    fecha: '',
    horario: '',
    motivo: ''
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
      const params = new URLSearchParams({
        personal_id: form.personal_id,
        fecha: form.fecha,
        horario: form.horario,
        motivo: form.motivo,
        tipo: 'FALTA',
        obs: 'Sin observaciones'
      });

      const res = await axios.post(`${API_URL}/inasistencias/registrar?${params.toString()}`);
      
      if (res.data && res.data.id) {
        window.open(`${API_URL}/inasistencias/reporte/${res.data.id}`, '_blank');
        Swal.fire('Éxito', 'Reporte generado', 'success');
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
    <div className="min-h-screen bg-slate-900 p-10 flex justify-center">
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
          

          <button 
            onClick={guardarInasistencia}
            className="bg-red-800 text-white p-4 rounded-lg font-bold hover:bg-red-700"
          >
            GUARDAR
          </button>
        </div>
      </div>
    </div>
  );
}
