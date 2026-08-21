'use client';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PriceChartProps {
  currentPrice: string;
}

export default function PriceChart({ currentPrice }: PriceChartProps) {
  // Extract number from price (e.g. "EGP 5,999.00" -> 5999)
  const priceNum = parseFloat(currentPrice.replace(/[^0-9.]/g, '')) || 1000;
  
  // Dummy data generation
  const labels = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'اليوم'];
  const data = {
    labels,
    datasets: [
      {
        label: 'تاريخ السعر',
        data: [
          priceNum * 1.2, 
          priceNum * 1.15, 
          priceNum * 1.1, 
          priceNum * 1.05, 
          priceNum * 1.0, 
          priceNum * 1.02, 
          priceNum
        ],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'تتبع السعر (أخر 6 أشهر)',
        font: {
          family: "'Cairo', sans-serif",
          size: 16
        }
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      }
    }
  };

  return <Line options={options} data={data} />;
}
