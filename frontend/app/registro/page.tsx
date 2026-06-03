'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Swal from 'sweetalert2';
import { UserPlus, Fingerprint, Briefcase, Contact, ArrowLeft } from 'lucide-react';
import API_URL from '@/lib/api';

export default function RegistroPersonal() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: '',
    num_empleado: '',
    area: '',
    curp: ''
  });

  const [loading, setLoading] = useState(false);
  const [nextIndex, setNextIndex] = useState(1);

  useEffect(() => {
    axios.get(`${API_URL}/personal/listar`)
      .then(res => {
        setNextIndex(res.data.length + 1);
      })
      .catch(err => console.error("Error al obtener contador de personal", err));
  }, []);

  const handleNombreChange = (val: string) => {
    const uppercaseName = val.toUpperCase();
    
    // Obtener las 4 letras estilo CURP/RFC
    // Asumimos el formato: ApellidoPaterno ApellidoMaterno Nombre(s)
    const words = uppercaseName.trim().split(/\s+/).filter(w => w.length > 0);
    let letters = '';
    
    if (words.length >= 3) {
      const apPat = words[0];
      const apMat = words[1];
      const nombres = words[2]; // Tomamos el primer nombre
      
      const primeraLetraPat = apPat.charAt(0);
      const vocalInternaMatch = apPat.substring(1).match(/[AEIOU]/);
      const primeraVocalPat = vocalInternaMatch ? vocalInternaMatch[0] : 'X';
      
      const primeraLetraMat = apMat.charAt(0);
      const primeraLetraNom = nombres.charAt(0);
      
      letters = `${primeraLetraPat}${primeraVocalPat}${primeraLetraMat}${primeraLetraNom}`;
    } else {
      // Fallback si no hay 3 palabras (solo iniciales)
      letters = words.map(w => w[0]).join('').substring(0, 4);
    }
    
    const seq = String(nextIndex).padStart(3, '0');
    const autoNumEmpleado = uppercaseName.length > 0 ? `${letters}${seq}` : '';
    
    setForm({ ...form, nombre: uppercaseName, num_empleado: autoNumEmpleado });
  };

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
      await axios.post(`${API_URL}/personal/crear`, null, {
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
      {/* Botón de regreso */}
      <button
        onClick={() => router.push('/')}
        className="fixed top-5 left-5 flex items-center gap-3 bg-[#001F3F] hover:bg-[#003366] text-white font-black px-6 py-3 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 z-50 text-base"
      >
        <ArrowLeft size={18} />
        <span className="text-sm uppercase tracking-wide">Inicio</span>
      </button>

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
                onChange={e => handleNombreChange(e.target.value)}
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
                readOnly
                className="w-full p-2 outline-none text-zinc-500 font-bold bg-zinc-100 rounded-r-xl"
                placeholder="Autogenerada (ej. JPL001)"
              />
            </div>
          </div>

          {/* Área / Departamento */}
          <div className="relative">
            <label className="text-[10px] font-bold text-[#800020] uppercase ml-2">Área, asignatura o departamento</label>
            <div className="flex items-center border-2 border-zinc-200 rounded-xl focus-within:border-[#001F3F] transition-all p-1">
              <Briefcase className="text-zinc-400 ml-2 shrink-0" size={20} />
              <select
                value={form.area}
                className="w-full p-2 outline-none text-black font-medium bg-transparent cursor-pointer"
                onChange={e => setForm({...form, area: e.target.value})}
              >
                <option value="">-- Selecciona una opción --</option>
                <option value="INGLÉS">INGLÉS</option>
                <option value="ARTES">ARTES</option>
                <option value="DEPORTES">DEPORTES</option>
                <option value="MATEMÁTICAS">MATEMÁTICAS</option>
                <option value="ESPAÑOL">ESPAÑOL</option>
                <option value="CIENCIAS">CIENCIAS</option>
                <option value="CIVISMO">CIVISMO</option>
                <option value="TALLER TÉCNICO">TALLER TÉCNICO</option>
                <option value="ADMINISTRATIVO">ADMINISTRATIVO</option>
                <option value="PERSONAL DE APOYO">PERSONAL DE APOYO</option>
                <option value="INTENDENCIA">INTENDENCIA</option>
              </select>
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