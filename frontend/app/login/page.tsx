'use client';
import { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { ShieldCheck } from 'lucide-react';
import API_URL from '@/lib/api';

export default function LoginSeguro() {
  const [form, setForm] = useState({ usuario: '', password: '' });
  const [loading, setLoading] = useState(false);

 const manejarLogin = async () => {
  if (!form.usuario || !form.password) {
    return Swal.fire('Error', 'Ingresa tus credenciales', 'error');
  }

  setLoading(true);
  try {
    const res = await axios.post(`${API_URL}/login`, null, {
      params: {
        username: form.usuario,
        password: form.password
      }
    });

    console.log("Respuesta del servidor:", res.data);

   if (res.data) {
  localStorage.setItem('rol', res.data.rol || 'admin');
  localStorage.setItem('token', 'autenticado');
  
  await Swal.fire({
    title: '¡Bienvenido!',
    text: 'Acceso concedido',
    icon: 'success',
    timer: 1500,
    showConfirmButton: false
  });
  
  window.location.replace('/');
} else {
      Swal.fire('Error', 'Respuesta inesperada del servidor', 'error');
    }
  } catch (err: unknown) {
    let msg = "Error en la autenticación";
    if (axios.isAxiosError(err)) {
      msg = err.response?.data?.detail || msg;
    }
    Swal.fire('Fallo de Seguridad', msg, 'error');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-[#001F3F] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border-4 border-[#800020]">
        <div className="bg-zinc-50 p-8 text-center border-b border-zinc-200">
          <ShieldCheck className="text-[#800020] mx-auto mb-2" size={48} />
          <h2 className="text-2xl font-black text-[#001F3F]">ACCESO SEGURO</h2>
        </div>

        <div className="p-8 space-y-6">
          <input
            className="w-full p-4 border-2 rounded-xl text-black"
            placeholder="Correo o Usuario"
            onChange={(e) => setForm({ ...form, usuario: e.target.value })}
          />
          <input
            type="password"
            className="w-full p-4 border-2 rounded-xl text-black"
            placeholder="Contraseña"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <button
            onClick={manejarLogin}
            disabled={loading}
            className="w-full py-4 bg-[#001F3F] text-white rounded-xl font-bold hover:bg-[#800020] transition-colors cursor-pointer active:scale-95"
          >
            {loading ? 'VERIFICANDO...' : 'ENTRAR AL SISTEMA'}
          </button>
        </div>
      </div>
    </div>
  );
}