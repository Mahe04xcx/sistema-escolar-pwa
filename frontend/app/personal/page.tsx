'use client';
import { useEffect, useState } from 'react'; 
import axios from 'axios';
import { Trash2, FileText, Search, Contact } from 'lucide-react'; 
import Swal from 'sweetalert2';

interface Docente {
  id: number;
  nombre: string;
  num_empleado: string;
  area: string;
  curp: string;
}

export default function ListaPersonal() {
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [filtro, setFiltro] = useState('');

  // Carga inicial de datos
  useEffect(() => {
    const fetchDocentes = async () => {
      try {
        const res = await axios.get('http://127.0.0.1:8000/personal/listar');
        setDocentes(res.data);
      } catch (err: unknown) {
        console.error("Error al cargar", err);
      }
    };
    
    fetchDocentes();
  }, []);

  const eliminarDocente = (id: number) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#800020',
      confirmButtonText: 'Sí, eliminar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`http://127.0.0.1:8000/personal/eliminar/${id}`);
          Swal.fire('Eliminado', 'El registro ha sido borrado', 'success');
          const res = await axios.get('http://127.0.0.1:8000/personal/listar');
          setDocentes(res.data);
        } catch (err: unknown) {
          Swal.fire('Error', 'No se pudo eliminar', 'error');
        }
      }
    });
  };

  // Función para abrir el PDF en una pestaña nueva
  const descargarPDF = (id: number) => {
    window.open(`http://127.0.0.1:8000/personal/pdf/${id}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-8 text-black">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
            <Contact className="text-[#001F3F]" size={40} />
            <h1 className="text-3xl font-black text-[#001F3F]">PLANTILLA DOCENTE</h1>
        </div>
        
        <div className="flex items-center bg-white border-2 border-zinc-200 rounded-2xl px-4 py-2 mb-6 shadow-sm focus-within:border-[#001F3F] transition-all">
          <Search className="text-zinc-400 mr-2" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nombre..." 
            className="outline-none w-full text-black bg-transparent"
            onChange={(e) => setFiltro(e.target.value.toUpperCase())}
          />
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-zinc-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#001F3F] text-white">
              <tr>
                <th className="p-4 font-bold uppercase text-sm">Nombre Completo</th>
                <th className="p-4 font-bold uppercase text-sm">Número de Empleado</th>
                <th className="p-4 text-center font-bold uppercase text-sm">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {docentes.filter(d => d.nombre.toUpperCase().includes(filtro)).map((docente) => (
                <tr key={docente.id} className="border-t border-zinc-100 hover:bg-zinc-50 transition-colors">
                  <td className="p-4 font-bold text-zinc-800">{docente.nombre}</td>
                  <td className="p-4 font-mono text-sm text-blue-900">{docente.num_empleado}</td>
                  <td className="p-4 flex justify-center gap-3">
                    {/* BOTÓN DE PDF ACTUALIZADO */}
                    <button 
                      onClick={() => descargarPDF(docente.id)}
                      className="p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                      title="Descargar Expediente"
                    >
                      <FileText size={18} />
                    </button>

                    <button 
                      onClick={() => eliminarDocente(docente.id)} 
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {docentes.length === 0 && (
            <div className="p-10 text-center text-zinc-400 font-medium">
                No hay docentes registrados en la base de datos.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}