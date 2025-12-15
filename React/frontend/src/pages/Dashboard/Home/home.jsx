import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../../SidebarComponent/sidebar';
import Chart from 'chart.js/auto';

const TITLE_MAP = {
  1: "Client",
  2: "Admin",
  3: "Developer",
  4: "CEO",
  5: "Engineer",
  6: "New User"
};

// Dummy Data for Dashboard
const summaryMetrics = [
  { label: 'Total Projects', value: 12, icon: 'apartment', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { label: 'Active Sites', value: 8, icon: 'construction', color: 'text-green-500', bg: 'bg-green-500/10' },
  { label: 'Total Staff', value: 45, icon: 'groups', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { label: 'Pending Hindrances', value: 23, icon: 'warning', color: 'text-red-500', bg: 'bg-red-500/10' },
];

const resentActivities = [
  { id: 1, text: "New vendor 'Apex Constructions' added to 'Airport Terminal' project.", time: "2 hours ago", icon: "domain_add", color: "text-green-400" },
  { id: 2, text: "Hindrance report updated for 'Metro Line Phase 2'.", time: "5 hours ago", icon: "update", color: "text-blue-400" },
  { id: 3, text: "Safety audit completed for 'City Center Mall'.", time: "1 day ago", icon: "verified_user", color: "text-purple-400" },
  { id: 4, text: "New staff member 'John Doe' assigned to 'Highway Expansion'.", time: "2 days ago", icon: "person_add", color: "text-yellow-400" },
  { id: 5, text: "Project 'Residential Complex' marked as Completed.", time: "3 days ago", icon: "check_circle", color: "text-green-500" },
];

function Home() {
  const [username, setUsername] = useState('');
  const [userRoles, setUserRoles] = useState('');

  // Chart References
  const doughnutChartRef = useRef(null);
  const barChartRef = useRef(null);
  const doughnutChartInstance = useRef(null);
  const barChartInstance = useRef(null);

  useEffect(() => {
    // User Session Logic
    const session = localStorage.getItem('session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        setUsername(parsed.username || '');
        setUserRoles(TITLE_MAP[parsed.title_id] || '');
      } catch (e) {
        setUsername('');
        setUserRoles('');
      }
    }

    // Initialize Charts
    if (doughnutChartRef.current) {
      if (doughnutChartInstance.current) doughnutChartInstance.current.destroy();

      doughnutChartInstance.current = new Chart(doughnutChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Ongoing', 'Completed', 'On Hold', 'Planning'],
          datasets: [{
            data: [8, 3, 1, 2],
            backgroundColor: [
              'rgba(34, 197, 94, 0.8)', // Green - Ongoing
              'rgba(59, 130, 246, 0.8)', // Blue - Completed
              'rgba(239, 68, 68, 0.8)',  // Red - On Hold
              'rgba(234, 179, 8, 0.8)'   // Yellow - Planning
            ],
            borderColor: '#1f2937', // Match bg-gray-900
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: { color: '#9ca3af', font: { size: 12 } } // text-gray-400
            }
          }
        }
      });
    }

    if (barChartRef.current) {
      if (barChartInstance.current) barChartInstance.current.destroy();

      barChartInstance.current = new Chart(barChartRef.current, {
        type: 'bar',
        data: {
          labels: ['Airport', 'Metro', 'Mall', 'Highway', 'Campus'],
          datasets: [
            {
              label: 'Budget Allocated (Cr)',
              data: [120, 250, 80, 150, 60],
              backgroundColor: 'rgba(59, 130, 246, 0.6)', // Blue
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 1
            },
            {
              label: 'Actual Spent (Cr)',
              data: [90, 210, 45, 160, 30],
              backgroundColor: 'rgba(34, 197, 94, 0.6)', // Green
              borderColor: 'rgba(34, 197, 94, 1)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(75, 85, 99, 0.2)' }, // gray-600/20
              ticks: { color: '#9ca3af' }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#9ca3af' }
            }
          },
          plugins: {
            legend: {
              labels: { color: '#9ca3af' }
            }
          }
        }
      });
    }

    // Cleanup Charts on Unmount
    return () => {
      if (doughnutChartInstance.current) doughnutChartInstance.current.destroy();
      if (barChartInstance.current) barChartInstance.current.destroy();
    };
  }, []);

  return (
    <div className="flex h-screen bg-background text-gray-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-900 p-8">
        
        {/* Header */}
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
            <p className="text-gray-400">Welcome back, {username || 'User'}! Here's what's happening today.</p>
          </div>
          <div className="text-right">
            <span className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Your Role</span>
            <div className="text-blue-400 font-bold text-lg">{userRoles || 'Guest'}</div>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {summaryMetrics.map((metric, index) => (
            <div key={index} className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg hover:-translate-y-1 transition-transform duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${metric.bg}`}>
                  <span className={`material-icons text-2xl ${metric.color}`}>{metric.icon}</span>
                </div>
                {/* <span className="text-xs font-medium text-gray-500 bg-gray-700 px-2 py-1 rounded">+2.5%</span> */}
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{metric.value}</h3>
              <p className="text-sm text-gray-400 font-medium">{metric.label}</p>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Project Status */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg lg:col-span-1 flex flex-col">
            <h3 className="text-xl font-bold text-white mb-6">Project Status</h3>
            <div className="flex-1 relative min-h-[250px]">
              <canvas ref={doughnutChartRef}></canvas>
            </div>
          </div>

          {/* Budget Overview */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg lg:col-span-2 flex flex-col">
            <h3 className="text-xl font-bold text-white mb-6">Financial Overview (Budget vs Actual)</h3>
            <div className="flex-1 relative min-h-[300px]">
              <canvas ref={barChartRef}></canvas>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Recent Activity</h3>
            <button className="text-sm text-blue-400 hover:text-blue-300 font-medium">View All</button>
          </div>
          <div className="space-y-6">
            {resentActivities.map((activity, index) => (
              <div key={activity.id} className="flex relative">
                {/* Connector Line */}
                {index !== resentActivities.length - 1 && (
                  <div className="absolute top-8 left-5 w-0.5 h-full bg-gray-700 -z-10"></div>
                )}
                
                <div className="flex-shrink-0 mr-4">
                  <div className="w-10 h-10 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center">
                    <span className={`material-icons text-lg ${activity.color}`}>{activity.icon}</span>
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-gray-300 text-sm mb-1">{activity.text}</p>
                  <p className="text-xs text-gray-500 font-medium">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}

export default Home;