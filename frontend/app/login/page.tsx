'use client';
import { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { ShieldCheck, Lock, User, KeyRound } from 'lucide-react';
import API_URL from '@/lib/api';

export default function LoginSeguro() {
  const [paso, setPaso] = useState(1);
  const [form, setForm] = useState({ usuario: '', password: '', token: '' });
  const [loading, setLoading] = useState(false);

  const manejarLogin = async () => {
    if (paso === 1 && (!form.usuario || !form.password)) {
      return Swal.fire('Error', 'Ingresa tus credenciales', 'error');
    }

    setLoading(true);
    try {
      if (paso === 1) {
        // Simulación: Validamos usuario y pasamos al 2FA
        setPaso(2);
      } else {
        // Verificación final del código de 6 dígitos de tu celular
        const res = await axios.post(`${API_URL}/auth/verificar-2fa`, {
          usuario: form.usuario,
          token_otp: form.token
        });

        if (res.data.access_token) {
          // Guardamos el token para que el Registro de Personal lo use
          localStorage.setItem('token', res.data.access_token);
          Swal.fire('¡Bienvenido!', 'Acceso concedido', 'success');
          window.location.href = '/';
        }
      }
    } catch (err: unknown) {
      // Eliminamos el error "any" definiendo el tipo como unknown
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
          {paso === 1 ? (
            <>
              <input 
                className="w-full p-4 border-2 rounded-xl text-black"
                placeholder="Correo o Usuario"
                onChange={(e) => setForm({...form, usuario: e.target.value})}
              />
              <input 
                type="password"
                className="w-full p-4 border-2 rounded-xl text-black"
                placeholder="Contraseña"
                onChange={(e) => setForm({...form, password: e.target.value})}
              />
            </>
          ) : (
            <div className="text-center">
              <label className="text-xs font-bold text-[#800020]">CÓDIGO DE TU CELULAR (6 DÍGITOS)</label>
              <input 
                maxLength={6}
                className="w-full p-4 text-center text-3xl font-black tracking-widest text-[#001F3F] border-2 border-[#001F3F] rounded-xl"
                placeholder="000000"
                onChange={(e) => setForm({...form, token: e.target.value})}
              />
            </div>
          )}

          <button 
            onClick={manejarLogin}
            disabled={loading}
            className="w-full py-4 bg-[#001F3F] text-white rounded-xl font-bold hover:bg-[#800020] transition-colors"
          >
            {loading ? 'VERIFICANDO...' : paso === 1 ? 'SIGUIENTE' : 'ENTRAR AL SISTEMA'}
          </button>
        </div>
      </div>
    </div>
  );
}