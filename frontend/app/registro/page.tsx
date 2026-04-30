'use client';
import { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { UserPlus, Fingerprint, Briefcase, Contact } from 'lucide-react';

export default function RegistroPersonal() {
  const [form, setForm] = useState({
    nombre: '',
    num_empleado: '',
    area: '',
    curp: ''
  });

  const [loading, setLoading] = useState(false);

  const guardarDocente = async () => {
    // 1. Verificación de Seguridad: ¿Hay una sesión activa?
    const token = localStorage.getItem('token');
    if (!token) {
      return Swal.fire({
        title: 'Acceso Denegado',
        text: 'Debes iniciar sesión para realizar registros en la base de datos.',
        icon: 'error',
        confirmButtonColor: '#800020'
      });
    }

    // 2. Validación de campos
    if (!form.nombre || !form.num_empleado || !form.curp) {
      return Swal.fire('Campos incompletos', 'Por favor llena los datos obligatorios', 'warning');
    }

    setLoading(true);
    try {
      // 3. Envío con Headers de Autorización
      await axios.post('http://127.0.0.1:8000/personal/crear', null, {
        params: {
          nombre: form.nombre,
          num_empleado: form.num_empleado,
          area: form.area,
          curp: form.curp
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      Swal.fire({
        title: '¡Registro Exitoso!',
        text: `${form.nombre} ha sido dado de alta.`,
        icon: 'success',
        confirmButtonColor: '#001F3F'
      });
      
      setForm({ nombre: '', num_empleado: '', area: '', curp: '' });
      
    } catch (err: unknown) {
      let mensajeError = "Error de conexión con el servidor";
      if (axios.isAxiosError(err)) {
        // Si el servidor responde con 401, es que el token no sirve
        if (err.response?.status === 401) {
          mensajeError = "Tu sesión ha expirado o no tienes permisos.";
        } else {
          mensajeError = err.response?.data?.detail || mensajeError;
        }
      }
      Swal.fire('Error al guardar', mensajeError, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 p-6 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-zinc-200">
        <div className="bg-[#001F3F] p-6 text-center">
          <UserPlus className="text-white mx-auto mb-2" size={40} />
          <h2 className="text-white text-2xl font-black tracking-tighter uppercase">ALTA DE NUEVO PERSONAL</h2>
          <p className="text-blue-200 text-xs mt-1 font-bold">ACCESO RESTRINGIDO - MODO ADMINISTRADOR</p>
        </div>

        <div className="p-8 space-y-5">
          {/* Nombre Completo */}
          <div className="relative">
            <label className="text-[10px] font-bold text-[#800020] uppercase ml-2">Nombre completo del docente</label>
            <div className="flex items-center border-2 border-zinc-200 rounded-xl focus-within:border-[#001F3F] transition-all p-1">
              <Contact className="text-zinc-400 ml-2" size={20} />
              <input 
                type="text"
                value={form.nombre}
                className="w-full p-2 outline-none text-black font-medium"
                placeholder="Ej. Juan Pérez López"
                onChange={e => setForm({...form, nombre: e.target.value.toUpperCase()})}
              />
            </div>
          </div>

          {/* Clave de Empleado */}
          <div className="relative">
            <label className="text-[10px] font-bold text-[#800020] uppercase ml-2">Clave o número de empleado</label>
            <div className="flex items-center border-2 border-zinc-200 rounded-xl focus-within:border-[#001F3F] transition-all p-1">
              <Fingerprint className="text-zinc-400 ml-2" size={20} />
              <input 
                type="text"
                value={form.num_empleado}
                className="w-full p-2 outline-none text-black font-medium"
                placeholder="Ej. EMP-2024-01"
                onChange={e => setForm({...form, num_empleado: e.target.value.toUpperCase()})}
              />
            </div>
          </div>

          {/* Área / Departamento */}
          <div className="relative">
            <label className="text-[10px] font-bold text-[#800020] uppercase ml-2">Área, asignatura o departamento</label>
            <div className="flex items-center border-2 border-zinc-200 rounded-xl focus-within:border-[#001F3F] transition-all p-1">
              <Briefcase className="text-zinc-400 ml-2" size={20} />
              <input 
                type="text"
                value={form.area}
                className="w-full p-2 outline-none text-black font-medium"
                placeholder="Ej. Matemáticas / Administrativo"
                onChange={e => setForm({...form, area: e.target.value.toUpperCase()})}
              />
            </div>
          </div>

          {/* CURP */}
          <div className="relative">
            <label className="text-[10px] font-bold text-[#800020] uppercase ml-2">CURP (18 caracteres)</label>
            <div className="flex items-center border-2 border-zinc-200 rounded-xl focus-within:border-[#001F3F] transition-all p-1">
              <Contact className="text-zinc-400 ml-2" size={20} />
              <input 
                type="text"
                value={form.curp}
                maxLength={18}
                className="w-full p-2 outline-none text-black font-medium"
                placeholder="MOPJ800101HGRRRN01"
                onChange={e => setForm({...form, curp: e.target.value.toUpperCase()})}
              />
            </div>
          </div>

          <button 
            onClick={guardarDocente}
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-black text-white transition-all shadow-lg flex items-center justify-center gap-2
              ${loading ? 'bg-zinc-400' : 'bg-[#800020] hover:bg-[#001F3F] hover:scale-[1.02] active:scale-95'}`}
          >
            {loading ? 'VERIFICANDO CREDENCIALES...' : 'GUARDAR EN BASE DE DATOS'}
          </button>
        </div>
        
        <div className="bg-zinc-50 p-4 text-center border-t border-zinc-100">
          <p className="text-[9px] text-zinc-400 uppercase tracking-widest text-black">Verificación de identidad mediante token de sesión activo</p>
        </div>
      </div>
    </div>
  );
}