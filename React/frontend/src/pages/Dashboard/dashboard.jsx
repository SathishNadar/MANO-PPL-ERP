import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Chart from 'chart.js/auto';
import 'material-icons/iconfont/material-icons.css';
import './dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const ctx = document.getElementById('projectChart');
    let chartInstance;

    if (ctx) {
      chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Project A', 'Project B', 'Project C', 'Project D', 'Project E'],
          datasets: [{
            label: 'Completion %',
            data: [79, 52, 95, 30, 65],
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
            borderRadius: 8,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              grid: {
                color: '#374151'
              },
              ticks: {
                color: '#9CA3AF'
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                color: '#9CA3AF'
              }
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  }, []);

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-20 bg-sidebar shadow-lg flex flex-col items-center py-5">
        <div className="mb-10">
          <img
            alt="Company logo"
            className="w-12 h-12"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYqC4QedXgsQ36OpYtKvw2u3RQPZYjuKva5zvxhp1XXmjHo-pvNPPQ9RibgZoE_2d5L92HBZU76yv7YtL6qvkme3XVjo-jtVfUa7HczOkcw1A9yCYwlOAPlAOrlyT5KLe0f1G_k9rKeAQHW8M5kU3KU8zUSsveuJJNy4HVehGl_VVapT9ztvcVvuiY8f07VLwaF33NpgBWumDplhw5dNWrowPiQsFJVGQ51bJZR6mzeNYOnVR0SCsWQI05YxNftU4e2qKBshCIA75I"
          />
        </div>
        <nav className="flex flex-col space-y-8">
          <button onClick={() => navigate('/')} className="text-secondary hover:text-blue-light">
            <span className="material-icons text-3xl">home</span>
          </button>
          <button className="text-secondary hover:text-blue-light">
            <span className="material-icons text-3xl">bar_chart</span>
          </button>
          <button className="text-secondary hover:text-blue-light">
            <span className="material-icons text-3xl">folder</span>
          </button>
          <button className="text-secondary hover:text-blue-light">
            <span className="material-icons text-3xl">receipt_long</span>
          </button>
          <button className="text-secondary hover:text-blue-light">
            <span className="material-icons text-3xl">summarize</span>
          </button>
          <button onClick={() => navigate('/Wip')} className="text-secondary hover:text-blue-light">
            <span className="material-icons text-3xl">wysiwyg</span>
          </button>
        </nav>
        <div className="mt-auto text-secondary">CDX</div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">Project List</h1>
            <p className="text-secondary">An overview of all ongoing projects.</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">search</span>
              <input class="pl-10 pr-4 py-2 rounded-full border border-gray-600 bg-[var(--sidebar-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]" placeholder="     Search projects..." type="text"/>
            </div>
            <div className="flex items-center space-x-2">
              <img
                alt="User avatar"
                className="w-10 h-10 rounded-full"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLfWyPP_yFAEG_gjAchak9ylgmyX8NDer_TYOCRBciD3o0EwO0w_xnK6RTdmrJbainVA5n-29GN4oIWWM62FwD6-kOZZQ8_3ymooziSk389zQ3B5j9bY2OjC_z9wh5pxpEKYdHOF3AYlR8A5w_lGWuYVtXGPQvTVSBLVtNWv0ZCojBMx_O-rpCZVwQjFVk3YkakHsyienX8VZgXDnYKsbtwph8bq3PgUWwFDhKmPIcP6NmG07p-oFgpltV8cjRP4Fw6qFaFlqUmUfK"
              />
              <span className="font-semibold text-primary">Mano</span>
              <span className="material-icons text-secondary">expand_more</span>
            </div>
          </div>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[79, 52].map((progress, index) => (
            <div key={index} className="bg-card p-6 rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300">
              <h2 className="text-2xl font-bold text-primary mb-2">New Airport Terminal</h2>
              <p className="text-secondary mb-4">Construction of the new international terminal with modern facilities.</p>
              <div className="flex justify-between text-sm text-secondary mb-4">
                <div><span className="font-semibold">Start Date:</span> 7/1/2025</div>
                <div><span className="font-semibold">End Date:</span> 6/30/2026</div>
              </div>
              <div className="flex items-center mb-4">
                <span className="font-semibold mr-2 text-primary">Status:</span>
                <span className="bg-blue-900 text-blue-light text-xs font-semibold px-2.5 py-0.5 rounded-full">In Progress</span>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-primary">Progress</span>
                  <span className="text-sm font-medium text-blue-light">{progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div className="bg-blue h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            </div>
          ))}
          <div className="bg-card p-6 rounded-2xl shadow-md col-span-1 lg:col-span-2">
            <h3 className="text-xl font-bold text-primary mb-4">Project Progress Overview</h3>
            <div className="h-64 relative">
              <div className="w-full h-full flex items-center justify-center bg-background rounded-lg">
                <canvas id="projectChart"></canvas>
              </div>
            </div>
          </div>
        </div>
        <button
          className="fixed bottom-8 right-8 bg-blue hover:bg-blue-dark text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform transform hover:scale-110"
        >
          <span className="material-icons text-3xl">add</span>
        </button>
      </main>
    </div>
  );
};

export default Dashboard;
