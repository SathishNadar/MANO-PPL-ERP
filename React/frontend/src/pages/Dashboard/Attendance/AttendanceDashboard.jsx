import React, { useState, useRef, useEffect } from 'react'
import Sidebar from '../../SidebarComponent/sidebar'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

function AttendanceDashboard() {
  const [records, setRecords] = useState([])
  const mapRef = useRef(null)

  const indiaCenter = [20.5937, 78.9629]
  const defaultZoom = 5
  const [tileUrl, setTileUrl] = useState('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')

  // fetch today's records from server
  useEffect(() => {
    async function fetchToday() {
      try {
        const today = new Date()
        const yyyy = today.getFullYear()
        const mm = String(today.getMonth() + 1).padStart(2, '0')
        const dd = String(today.getDate()).padStart(2, '0')
        const dateStr = `${yyyy}-${mm}-${dd}`

        // NOTE: adjust this URL if your backend route differs. Keep credentials if using cookie auth.
        const res = await fetch(`${API_BASE}/attendance/records/admin?date_from=${dateStr}&date_to=${dateStr}&limit=2000`, {
          credentials: 'include'
        })
        const data = await res.json()
        console.log('attendance fetch response', { status: res.status, ok: data?.ok, count: Array.isArray(data?.data) ? data.data.length : 0 })

        if (data.ok && Array.isArray(data.data)) {
          const pts = data.data
            .map(r => ({
              id: r.id || r.attendance_id || `${r.user_id}_${r.time_in}`,
              user_id: r.user_id,
              name: r.user_name || r.user_id,
              time_in: r.time_in,
              time_out: r.time_out,
              lat: parseFloat(r.time_in_lat) || parseFloat(r.time_in_latitude) || null,
              lng: parseFloat(r.time_in_lng) || parseFloat(r.time_in_longitude) || null,
              raw: r
            }))
            .filter(p => p.lat !== null && !Number.isNaN(p.lat) && p.lng !== null && !Number.isNaN(p.lng))

          setRecords(pts)
        } else {
          setRecords([])
        }
      } catch (err) {
        console.error('Failed to fetch attendance records:', err)
        setRecords([])
      }
    }

    fetchToday()
  }, [])

  function handleMapReady(map) {
    mapRef.current = map
    map.setView(indiaCenter, defaultZoom)
  }

  return (
    <div className="flex h-screen bg-background text-white">
      <Sidebar />

      <div className="flex-1 p-6 flex flex-col" style={{ minHeight: 0 }}>
        <div className="mb-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-2xl font-semibold">Attendance — Map</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 flex-shrink-0">
          <Link to="/dashboard/attendance/admin" className="block">
            <div className="h-44 rounded-lg bg-gray-800 border-l-4 border-blue-500 shadow-sm hover:shadow-lg transition-transform hover:-translate-y-1 p-4 flex">
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Admin View — Graph</h3>
                  <p className="text-sm text-gray-400 mt-1">Shows time-series graphs for users: <span className="text-gray-200">time_in, time_out, breaks, idle periods</span>. Useful for spotting punctuality trends and long breaks.</p>
                </div>
                <div className="text-xs text-gray-400">Tip: hover graph points to see exact timestamps.</div>
              </div>
            </div>
          </Link>

          <Link to="/attendance/dashboard" className="block">
            <div className="h-44 rounded-lg bg-gray-800 border-l-4 border-green-500 shadow-sm hover:shadow-lg transition-transform hover:-translate-y-1 p-4 flex">
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Attendance Dashboard</h3>
                  <p className="text-sm text-gray-400 mt-1">At-a-glance overview: <span className="text-gray-200">present, not reported, late leaderboard</span>. Includes quick filters for team / department and today's highlights.</p>
                </div>
                <div className="text-xs text-gray-400">Great for daily ops and quick escalations.</div>
              </div>
            </div>
          </Link>

          <Link to="/attendance/employee-stats" className="block">
            <div className="h-44 rounded-lg bg-gray-800 border-l-4 border-green-500 shadow-sm hover:shadow-lg transition-transform hover:-translate-y-1 p-4 flex">
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Employee Stats</h3>
                  <p className="text-sm text-gray-400 mt-1">Detailed breakdowns by <span className="text-gray-200">department, gender, cohorts, tenure</span>. Use this to find patterns and create targeted reports.</p>
                </div>
                <div className="text-xs text-gray-400">Export charts for presentations.</div>
              </div>
            </div>
          </Link>

          <Link to="/attendance/attendance-list" className="block">
            <div className="h-44 rounded-lg bg-gray-800 border-l-4 border-blue-500 shadow-sm hover:shadow-lg transition-transform hover:-translate-y-1 p-4 flex">
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Attendance List — Cumulative</h3>
                  <p className="text-sm text-gray-400 mt-1">Excel-style summary view with quick exports. Helpful for payroll, audits and giving a concise attendance snapshot to stakeholders.</p>
                </div>
                <div className="text-xs text-gray-400">Includes row-level export and column filters.</div>
              </div>
            </div>
          </Link>
        </div>

        <div className="rounded bg-[#061024] border border-gray-700 p-4 flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <h4 className="font-medium">Map</h4>

            <div className="flex gap-2 items-center">
              <span className="text-xs text-gray-400 mr-2">Style</span>
              <button onClick={() => setTileUrl('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')} className="px-2 py-1 rounded text-sm bg-gray-700 hover:bg-gray-600">Street</button>
              <button onClick={() => setTileUrl('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png')} className="px-2 py-1 rounded text-sm bg-gray-700 hover:bg-gray-600">Dark</button>
              <button onClick={() => setTileUrl('http://www.google.cn/maps/vt?lyrs=y&x={x}&y={y}&z={z}')} className="px-2 py-1 rounded text-sm bg-gray-700 hover:bg-gray-600">Terrain</button>
            </div>
          </div>

          <div className="flex-1 rounded overflow-hidden min-h-0">
            <MapContainer
              whenCreated={handleMapReady}
              center={indiaCenter}
              zoom={defaultZoom}
              scrollWheelZoom={true}
              style={{ height: '70vh', width: '100%' }}
              zoomControl={false}
            >
              <ZoomControl position="topright" />
              {/* Outdoor / terrain style tiles (OpenTopoMap) - good shaded outdoor look */}
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url={tileUrl}
                noWrap={true}
              />

              {/* Render individual markers */}
              {records.map(pt => (
                <Marker key={`p-${pt.id}`} position={[pt.lat, pt.lng]}>
                  <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent={false}>
                    {pt.name}
                  </Tooltip>
                  <Popup>
                    <div>
                      <div className="font-semibold">{pt.name}</div>
                      <div className="text-xs text-gray-500">{pt.time_in}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <p className="text-xs text-gray-400 mt-2 flex-shrink-0">Tip: Use mouse scroll / two-finger drag to zoom & pan. Showing individual pins (no clustering).</p>
        </div>
      </div>
    </div>
  )
}

export default AttendanceDashboard
