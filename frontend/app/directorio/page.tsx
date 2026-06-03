'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  ArrowLeft, Pencil, Trash2, Clock, Contact, 
  Fingerprint, Briefcase, X, FileDown, 
  Eye,
  FileText
} from 'lucide-react';
import API_URL from '@/lib/api';

interface Personal {
  id: number;
  nombre_completo: string;
  numero_empleado: string;
  area_departamento: string;
  curp: string;
}

interface Inasistencia {
  id: number;
  fecha_falta: string;
  horario: string;
  motivo: string;
  fecha_registro: string;
}

export default function Directorio() {
  const router = useRouter();
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para Modal de Edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<Personal | null>(null);
  const [saving, setSaving] = useState(false);

  // Estados para Modal de Historial
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState<Inasistencia[]>([]);
  const [selectedDocente, setSelectedDocente] = useState<Personal | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchPersonal = async () => {
    try {
      const res = await axios.get(`${API_URL}/personal/listar`);
      setPersonal(res.data);
    } catch (err: unknown) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        console.error("Detalle del error:", err.response?.data); // ← agrega esto
        Swal.fire('Error', JSON.stringify(err.response?.data), 'error'); // muestra el detalle
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPersonal();
  }, []);

  // --- ELIMINAR ---
  const handleEliminar = (id: number, nombre: string) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará a ${nombre} y todo su historial de inasistencias permanentemente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      buttonsStyling: false,
      customClass: {
        popup: 'rounded-3xl shadow-2xl',
        title: 'font-black text-[#001F3F]',
        confirmButton: 'bg-red-600 text-white font-bold px-6 py-3 rounded-xl ml-2 hover:bg-opacity-90 transition-all',
        cancelButton: 'bg-zinc-300 text-black font-bold px-6 py-3 rounded-xl mr-2 hover:bg-opacity-90 transition-all'
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${API_URL}/personal/eliminar/${id}`);
          Swal.fire({
            title: 'Eliminado',
            text: 'El registro ha sido eliminado.',
            icon: 'success',
            buttonsStyling: false,
            customClass: {
              popup: 'rounded-3xl shadow-2xl',
              confirmButton: 'bg-[#001F3F] text-white font-bold px-6 py-3 rounded-xl'
            }
          });
          fetchPersonal();
        } catch (err) {
          Swal.fire('Error', 'No se pudo eliminar', 'error');
        }
      }
    });
  };

  const handleEditClick = (docente: Personal) => {
    setEditForm(docente);
    setIsEditModalOpen(true);
  };

  const handleEditNombreChange = (val: string) => {
    if (!editForm) return;
    const uppercaseName = val.toUpperCase();
    
    // Extraer la secuencia numérica actual al final de la clave
    const currentSeqMatch = editForm.numero_empleado.match(/\d+$/);
    const currentSeq = currentSeqMatch ? currentSeqMatch[0].padStart(3, '0') : '000';

    const words = uppercaseName.trim().split(/\s+/).filter(w => w.length > 0);
    let letters = '';
    
    if (words.length >= 3) {
      const apPat = words[0];
      const apMat = words[1];
      const nombres = words[2];
      
      const primeraLetraPat = apPat.charAt(0);
      const vocalInternaMatch = apPat.substring(1).match(/[AEIOU]/);
      const primeraVocalPat = vocalInternaMatch ? vocalInternaMatch[0] : 'X';
      
      const primeraLetraMat = apMat.charAt(0);
      const primeraLetraNom = nombres.charAt(0);
      
      letters = `${primeraLetraPat}${primeraVocalPat}${primeraLetraMat}${primeraLetraNom}`;
    } else {
      letters = words.map(w => w[0]).join('').substring(0, 4);
    }
    
    const autoNumEmpleado = uppercaseName.length > 0 ? `${letters}${currentSeq}` : '';
    setEditForm({ ...editForm, nombre_completo: uppercaseName, numero_empleado: autoNumEmpleado });
  };

  const handleSaveEdit = async () => {
    if (!editForm) return;
    if (!editForm.nombre_completo || !editForm.numero_empleado || !editForm.curp) {
      return Swal.fire('Campos incompletos', 'Llena los datos obligatorios', 'warning');
    }
    setSaving(true);
    try {
      await axios.put(`${API_URL}/personal/actualizar/${editForm.id}`, null, {
        params: {
          nombre: editForm.nombre_completo,
          numero: editForm.numero_empleado,
          area: editForm.area_departamento,
          curp: editForm.curp
        }
      });
      Swal.fire({
        title: 'Actualizado',
        text: 'Información guardada correctamente.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      setIsEditModalOpen(false);
      fetchPersonal();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        Swal.fire('Error', err.response?.data?.detail || 'No se pudo actualizar', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  // --- HISTORIAL ---
  const handleHistoryClick = async (docente: Personal) => {
    setSelectedDocente(docente);
    setIsHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const res = await axios.get(`${API_URL}/inasistencias/personal/${docente.id}`);
      setHistoryData(res.data);
    } catch (err) {
      Swal.fire('Error', 'No se pudo cargar el historial', 'error');
      setIsHistoryModalOpen(false);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-10 flex flex-col items-center font-sans">
      <button
        onClick={() => router.push('/')}
        className="fixed top-5 left-5 flex items-center gap-3 bg-[#001F3F] hover:bg-[#003366] text-white font-black px-6 py-3 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 z-40 text-base"
      >
        <ArrowLeft size={18} />
        <span className="text-sm uppercase tracking-wide">Inicio</span>
      </button>

      <h1 className="text-3xl font-black text-[#001F3F] mb-10 border-b-4 border-[#800020] pb-2 uppercase mt-8">
        Directorio de Personal
      </h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-zinc-500 font-bold uppercase tracking-widest animate-pulse">Cargando...</p>
        </div>
      ) : (
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {personal.length === 0 ? (
            <div className="col-span-full text-center py-20 text-zinc-400 italic">
              No hay personal registrado.
            </div>
          ) : (
            personal.map((docente) => (
              <div key={docente.id} className="bg-white rounded-3xl shadow-xl border border-zinc-200 overflow-hidden flex flex-col">
                <div className="bg-[#001F3F] p-4 text-center">
                  <h3 className="text-white font-black uppercase tracking-tight text-lg truncate">
                    {docente.nombre_completo}
                  </h3>
                  <p className="text-blue-200 text-xs font-bold">{docente.area_departamento}</p>
                </div>
                <div className="p-6 space-y-3 flex-1 text-sm">
                  <div className="flex items-center gap-2 text-zinc-600">
                    <Fingerprint size={16} className="text-[#800020]" />
                    <span className="font-bold text-black">{docente.numero_empleado}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-600">
                    <Contact size={16} className="text-[#800020]" />
                    <span className="font-mono text-xs">{docente.curp}</span>
                  </div>
                </div>
                <div className="bg-zinc-50 border-t border-zinc-100 p-3 flex justify-between gap-2">
                  <button 
                    onClick={() => handleHistoryClick(docente)}
                    className="flex-1 flex items-center justify-center gap-1 bg-[#001F3F] hover:bg-[#003366] text-white py-2 rounded-xl text-xs font-bold transition-all"
                    title="Ver Historial"
                  >
                    <Clock size={16} /> Historial
                  </button>
                  <button 
                    onClick={() => handleEditClick(docente)}
                    className="w-10 flex items-center justify-center bg-zinc-200 hover:bg-zinc-300 text-[#001F3F] rounded-xl transition-all"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button 
                    onClick={() => handleEliminar(docente.id, docente.nombre_completo)}
                    className="w-10 flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-700 rounded-xl transition-all"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL EDITAR */}
      {isEditModalOpen && editForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#001F3F] p-4 flex justify-between items-center text-white">
              <h2 className="font-black uppercase tracking-tighter">Editar Información</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="hover:text-red-400 transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="relative">
                <label className="text-[10px] font-bold text-[#800020] uppercase ml-2">Nombre completo</label>
                <div className="flex items-center border-2 border-zinc-200 rounded-xl focus-within:border-[#001F3F] transition-all p-1">
                  <Contact className="text-zinc-400 ml-2" size={20} />
                  <input 
                    type="text"
                    value={editForm.nombre_completo}
                    className="w-full p-2 outline-none text-black font-medium"
                    onChange={e => handleEditNombreChange(e.target.value)}
                  />
                </div>
              </div>
              <div className="relative">
                <label className="text-[10px] font-bold text-[#800020] uppercase ml-2">Clave / Empleado</label>
                <div className="flex items-center border-2 border-zinc-200 rounded-xl focus-within:border-[#001F3F] transition-all p-1">
                  <Fingerprint className="text-zinc-400 ml-2" size={20} />
                  <input 
                    type="text"
                    value={editForm.numero_empleado}
                    readOnly
                    className="w-full p-2 outline-none text-zinc-500 font-bold bg-zinc-100 rounded-r-xl"
                  />
                </div>
              </div>
              <div className="relative">
                <label className="text-[10px] font-bold text-[#800020] uppercase ml-2">Área / Asignatura</label>
                <div className="flex items-center border-2 border-zinc-200 rounded-xl focus-within:border-[#001F3F] transition-all p-1">
                  <Briefcase className="text-zinc-400 ml-2 shrink-0" size={20} />
                  <select
                    value={editForm.area_departamento}
                    className="w-full p-2 outline-none text-black font-medium bg-transparent cursor-pointer"
                    onChange={e => setEditForm({...editForm, area_departamento: e.target.value})}
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
              <div className="relative">
                <label className="text-[10px] font-bold text-[#800020] uppercase ml-2">CURP</label>
                <div className="flex items-center border-2 border-zinc-200 rounded-xl focus-within:border-[#001F3F] transition-all p-1">
                  <Contact className="text-zinc-400 ml-2" size={20} />
                  <input 
                    type="text"
                    value={editForm.curp}
                    maxLength={18}
                    className="w-full p-2 outline-none text-black font-medium"
                    onChange={e => setEditForm({...editForm, curp: e.target.value.toUpperCase()})}
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-[#001F3F] bg-zinc-100 hover:bg-zinc-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl font-black text-white bg-[#800020] hover:bg-[#5a0016] transition-all disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HISTORIAL */}
      {isHistoryModalOpen && selectedDocente && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="bg-[#800020] p-5 flex justify-between items-center text-white shrink-0">
              <div>
                <h2 className="font-black uppercase tracking-tighter text-lg">Historial de Inasistencias</h2>
                <p className="text-xs text-red-200 font-bold">{selectedDocente.nombre_completo}</p>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="hover:text-red-200 transition-colors">
                <X size={28} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {loadingHistory ? (
                <div className="flex justify-center items-center py-10">
                  <p className="text-zinc-500 font-bold uppercase tracking-widest animate-pulse">Cargando reportes...</p>
                </div>
              ) : historyData.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 italic">
                  Este docente no tiene inasistencias registradas.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-200">
                  <table className="w-full text-left text-sm text-zinc-700">
                    <thead className="bg-[#001F3F] text-white font-bold uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3">Fecha</th>
                        <th className="px-4 py-3">Horario</th>
                        <th className="px-4 py-3">Motivo</th>
                        <th className="px-4 py-3 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 bg-white">
                      {historyData.map((falta) => (
                        <tr key={falta.id} className="hover:bg-zinc-50 transition-colors">
                          <td className="px-4 py-3 font-bold text-[#800020]">{falta.fecha_falta}</td>
                          <td className="px-4 py-3">{falta.horario}</td>
                          <td className="px-4 py-3">{falta.motivo}</td>
                          <td className="px-4 py-3 text-center">
                            <button 
                              onClick={() => window.open(`${API_URL}/inasistencias/reporte/${falta.id}`, '_blank')}
                              className="inline-flex items-center gap-1 bg-[#001F3F] hover:bg-[#003366] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                            >
                              <Eye size={14} /> Ver
                            </button>
                            <button 
                                onClick={async () => {
                                  try {
                                    const response = await fetch(`${API_URL}/inasistencias/justificante/${falta.id}`);
                                    if (response.ok) {
                                      window.open(`${API_URL}/inasistencias/justificante/${falta.id}`, '_blank');
                                    } else {
                                      Swal.fire({
                                        title: 'Sin justificante',
                                        text: 'Este registro no tiene un documento justificante adjunto.',
                                        icon: 'info',
                                        buttonsStyling: false,
                                        customClass: {
                                          popup: 'rounded-3xl shadow-2xl',
                                          confirmButton: 'bg-[#001F3F] text-white font-bold px-6 py-3 rounded-xl'
                                        }
                                      });
                                    }
                                  } catch {
                                    Swal.fire('Error', 'No se pudo verificar el justificante', 'error');
                                  }
                                }}
                                className="inline-flex items-center gap-1 bg-[#800020] hover:bg-[#600018] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                              >
                                <FileText size={14} /> Justificante
                              </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="bg-zinc-50 p-4 border-t border-zinc-200 shrink-0 flex justify-end">
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-6 py-2 rounded-xl font-bold text-white bg-zinc-600 hover:bg-zinc-700 transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
