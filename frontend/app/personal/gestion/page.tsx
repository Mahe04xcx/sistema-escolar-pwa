'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { UserCog, Trash2, Edit3, Save, X, Search } from 'lucide-react';

interface Docente {
  id: number;
  nombre_completo: string;
  numero_empleado: string;
}

export default function GestionPersonal() {
  const [personal, setPersonal] = useState<Docente[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState<number | null>(null);
  const [tempData, setTempData] = useState({ nombre_completo: '', numero_empleado: '' });

  const cargarPersonal = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/personal/listar');
      setPersonal(res.data);
    } catch (err) {
      console.error("Error al cargar lista", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await cargarPersonal();
    };
    fetchData();
  }, []);

  const iniciarEdicion = (docente: Docente) => {
    setEditando(docente.id);
    setTempData({ 
      nombre_completo: docente.nombre_completo, 
      numero_empleado: docente.numero_empleado 
    });
  };

  const guardarCambios = async (id: number) => {
    try {
      await axios.put(`http://127.0.0.1:8000/personal/actualizar/${id}`, null, {
        params: {
          nombre: tempData.nombre_completo,
          numero: tempData.numero_empleado
        }
      });
      Swal.fire('Actualizado', 'Datos modificados con éxito', 'success');
      setEditando(null);
      cargarPersonal();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo actualizar', 'error');
    }
  };

  const eliminarDocente = (id: number) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción eliminará al docente y su historial.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#800020',
      cancelButtonColor: '#001F3F',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`http://127.0.0.1:8000/personal/eliminar/${id}`);
          Swal.fire('Eliminado', 'El registro ha sido borrado.', 'success');
          cargarPersonal();
        } catch (err) {
          console.error(err);
          Swal.fire('Error', 'No se pudo eliminar el registro', 'error');
        }
      }
    });
  };

  const filtrados = personal.filter(p => 
    p.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.numero_empleado.includes(busqueda)
  );

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      {/* JSX completo igual que antes */}
    </div>
  );
}
