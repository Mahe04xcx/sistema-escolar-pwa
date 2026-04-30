'use client';
import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import API_URL from '@/lib/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface GraphConfig {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[]; // Cambiado a arreglo
    borderRadius: number;
  }[];
}

export default function Estadisticas() {
  const [chartData, setChartData] = useState<GraphConfig | null>(null);

  // Paleta de colores predefinida (puedes agregar más si tienes muchas categorías)
  const colores = [
    '#800020', // Guinda
    '#001F3F', // Navy
    '#3D9970', // Verde
    '#FF851B', // Naranja
    '#B10DC9', // Púrpura
    '#FFDC00', // Amarillo
    '#0074D9', // Azul
    '#2ECC40', // Lima
    '#FF4136', // Rojo
    '#AAAAAA'  // Gris
  ];

  useEffect(() => {
    axios.get(`${API_URL}/estadisticas/general`)
      .then(res => {
        const labels = Object.keys(res.data.distribucion);
        const values = Object.values(res.data.distribucion) as number[];
        
        // Generamos un color para cada barra basado en la paleta
        const backgroundColors = labels.map((_, index) => colores[index % colores.length]);

        setChartData({
          labels,
          datasets: [{
            label: 'Cantidad de Inasistencias',
            data: values,
            backgroundColor: backgroundColors, // Asignamos el arreglo de colores
            borderRadius: 8
          }]
        });
      })
      .catch(() => console.log("Sin datos suficientes en la BD"));
  }, []);

  return (
    <div className="p-10 bg-zinc-50 min-h-screen flex flex-col items-center text-black">
      <h1 className="text-3xl font-black text-[#001F3F] mb-10 border-b-4 border-[#800020] pb-2 uppercase">
        Estadísticas Institucionales
      </h1>
      
      <div className="w-full max-w-4xl bg-white p-10 rounded-3xl shadow-2xl border border-zinc-200">
        {chartData ? (
          <div className="h-[400px] flex items-center justify-center">
            <Bar 
              data={chartData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: {
                  legend: { 
                    display: false // Desactivamos leyenda porque cada barra es distinta
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                  }
                }
              }} 
            />
          </div>
        ) : (
          <div className="text-center py-20 text-zinc-400 italic">
            Esperando datos de la base de datos...
          </div>
        )}
      </div>
    </div>
  );
}