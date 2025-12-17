import React, { useState, useRef, useEffect } from 'react'
import Sidebar from '../../SidebarComponent/sidebar'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
})

const _DEFAULT_MARKER = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28]
})

function getDefaultMarker() {
  return _DEFAULT_MARKER
}
const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

function AttendanceDashboard() {
  const [records, setRecords] = useState([])
  const mapRef = useRef(null)

  const indiaCenter = [17.9, 78.9629]
  const defaultZoom = 5
  const [tileUrl, setTileUrl] = useState('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')

  useEffect(() => {
    async function fetchToday() {
      try {
        const today = new Date()
        const yyyy = today.getFullYear()
        const mm = String(today.getMonth() + 1).padStart(2, '0')
        const dd = String(today.getDate()).padStart(2, '0')
        const dateStr = `${yyyy}-${mm}-${dd}`

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
    <div className="flex h-screen bg-[#0f1724] text-[#e6eef8] font-sans overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* HEADER */}
        <div className="h-20 flex items-center justify-between px-8 bg-[#0f1724] border-b border-white/5 flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-wide">Attendance Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1a2332] hover:bg-[#233042] border border-white/5 text-gray-400 transition-colors">
              <span className="material-icons text-[20px]">notifications</span>
            </button>
          </div>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

          {/* TOP CARDS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <Link to="/dashboard/attendance/admin" className="block group">
              <div className="bg-[#1E2939] h-32 rounded-xl p-5 border border-white/5 relative transition-all transform hover:-translate-y-1 hover:shadow-xl hover:bg-[#253246] flex flex-col justify-center">
                <h3 className="font-bold text-white text-base mb-2">Admin View — Graph</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Shows time-series graphs for users: <span className="text-gray-200">time_in, time_out, breaks, idle periods</span>.</p>
              </div>
            </Link>

            <Link to="/dashboard/attendance/users" className="block group">
              <div className="bg-[#1E2939] h-32 rounded-xl p-5 border border-white/5 relative transition-all transform hover:-translate-y-1 hover:shadow-xl hover:bg-[#253246] flex flex-col justify-center">
                <h3 className="font-bold text-white text-base mb-2">Admin View — Users</h3>
                <p className="text-xs text-slate-400 leading-relaxed">A Admin Page to manage geofencing rules for employees.</p>
              </div>
            </Link>

            <Link to="/dashboard/attendance" className="block group">
              <div className="bg-[#1E2939] h-32 rounded-xl p-5 border border-white/5 relative transition-all transform hover:-translate-y-1 hover:shadow-xl hover:bg-[#253246] flex flex-col justify-center">
                <h3 className="font-bold text-white text-base mb-2">Employee Stats</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Detailed breakdowns by <span className="text-gray-200">department, gender, cohorts, tenure</span>.</p>
              </div>
            </Link>

            <Link to="/dashboard/attendance" className="block group">
              <div className="bg-[#1E2939] h-32 rounded-xl p-5 border border-white/5 relative transition-all transform hover:-translate-y-1 hover:shadow-xl hover:bg-[#253246] flex flex-col justify-center">
                <h3 className="font-bold text-white text-base mb-2">Attendance List — Cumulative</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Excel-style summary view with quick exports.</p>
              </div>
            </Link>
          </div>

          {/* MAP SECTION */}
          <div className="bg-[#151e2d] rounded-xl shadow-xl shadow-black/30 border border-white/5 flex flex-col min-h-[500px] h-[calc(100vh-280px)] overflow-hidden">
            <div className="px-5 py-3 flex justify-between items-center bg-[#1a2332] border-b border-white/5">
              <h3 className="font-bold text-white flex items-center gap-2">
                <span className="material-icons text-sky-400 text-sm">my_location</span>
                Live Location Overview
              </h3>

              <div className="bg-[#0f1724] p-1 rounded-lg flex gap-1 border border-white/10">
                <button onClick={() => setTileUrl('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')} className={`px-3 py-1 text-xs font-medium rounded transition-all ${tileUrl.includes('openstreetmap') ? 'bg-sky-600 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>Street</button>
                <button onClick={() => setTileUrl('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png')} className={`px-3 py-1 text-xs font-medium rounded transition-all ${tileUrl.includes('dark_all') ? 'bg-sky-600 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>Dark</button>
                <button onClick={() => setTileUrl('http://www.google.cn/maps/vt?lyrs=y&x={x}&y={y}&z={z}')} className={`px-3 py-1 text-xs font-medium rounded transition-all ${tileUrl.includes('google') ? 'bg-sky-600 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>Satellite</button>
              </div>
            </div>

            <div className="flex-1 relative bg-[#0f1724]">
              <MapContainer whenCreated={handleMapReady} center={indiaCenter} zoom={defaultZoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                <ZoomControl position="topright" />
                <TileLayer attribution='&copy; OpenStreetMap contributors' url={tileUrl} noWrap={true} />
                {(() => {
                  function haversineDistance(aLat, aLng, bLat, bLng) {
                    const toRad = v => (v * Math.PI) / 180; const R = 6371000;
                    const dLat = toRad(bLat - aLat); const dLon = toRad(bLng - aLng);
                    const lat1 = toRad(aLat); const lat2 = toRad(bLat);
                    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
                    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                  }
                  function buildClusters(points, radiusMeters = 200) {
                    const clusters = [];
                    for (const p of points) {
                      const lat = Number(p.lat); const lng = Number(p.lng);
                      if (!isFinite(lat) || !isFinite(lng)) continue;
                      let placed = false;
                      for (const c of clusters) {
                        if (haversineDistance(c.lat, c.lng, lat, lng) <= radiusMeters) { c.members.push(p); const n = c.members.length; c.lat = (c.lat * (n - 1) + lat) / n; c.lng = (c.lng * (n - 1) + lng) / n; placed = true; break; }
                      }
                      if (!placed) clusters.push({ lat, lng, members: [p] });
                    }
                    return clusters;
                  }
                  return buildClusters(records, 200).map((c, idx) => {
                    if (!c?.members?.length) return null;
                    if (c.members.length === 1) {
                      const pt = c.members[0];
                      return (
                        <Marker key={`p-${pt.id}`} position={[Number(pt.lat), Number(pt.lng)]} icon={getDefaultMarker()}>
                          <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent={false}>{pt.name}</Tooltip>
                          <Popup><div><div className="font-semibold">{pt.name}</div><div className="text-xs text-gray-500">{pt.time_in}</div></div></Popup>
                        </Marker>
                      );
                    }
                    const uniqueNames = Array.from(new Set(c.members.map(m => (m.name || '').toString().trim()).filter(Boolean)));
                    return (
                      <Marker key={`cluster-${idx}`} position={[c.lat, c.lng]} icon={getDefaultMarker()} eventHandlers={{ click: () => { try { mapRef.current?.flyTo([c.lat, c.lng], 17, { animate: true, duration: 0.8 }); } catch (e) { } } }}>
                        <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent={false}>{uniqueNames.slice(0, 3).join(', ') + (uniqueNames.length > 3 ? ' ...' : '') || 'Multiple'}</Tooltip>
                        <Popup><div style={{ maxHeight: 220, overflowY: 'auto', minWidth: 160 }}><div className="font-semibold">People nearby</div><ul className="text-sm mt-2 pl-4 list-disc">{uniqueNames.map((u, i) => <li key={i}>{u}</li>)}</ul></div></Popup>
                      </Marker>
                    );
                  });
                })()}
              </MapContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default AttendanceDashboard
