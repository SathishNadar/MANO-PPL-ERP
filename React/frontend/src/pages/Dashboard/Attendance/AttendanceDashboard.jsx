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

// small helper to avoid creating new icon objects on every render
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
          <h2 className="text-2xl font-semibold">Attendance Dashboard</h2>
        </div>

        <div className="flex gap-4 mb-6 overflow-x-auto items-stretch">
          <div className="flex-shrink-0 w-64 md:w-1/4">
            <Link to="/dashboard/attendance/admin" className="block h-full">
              <div className="h-44 rounded-lg bg-gray-800 border-l-4 border-green-500 shadow-sm hover:shadow-lg transition-transform hover:-translate-y-1 p-4 flex h-full">
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Admin View — Graph</h3>
                    <p className="text-sm text-gray-400 mt-1">Shows time-series graphs for users: <span className="text-gray-200">time_in, time_out, breaks, idle periods</span>.</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div className="flex-shrink-0 w-64 md:w-1/4">
            <Link to="/dashboard/attendance/users" className="block h-full">
              <div className="h-44 rounded-lg bg-gray-800 border-l-4 border-green-500 shadow-sm hover:shadow-lg transition-transform hover:-translate-y-1 p-4 flex h-full">
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Admin View — Users</h3>
                    <p className="text-sm text-gray-400 mt-1">A Admin Page to manage geofencing rules for employees.</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div className="flex-shrink-0 w-64 md:w-1/4">
            <Link to="/dashboard/attendance" className="block h-full">
              <div className="h-44 rounded-lg bg-gray-800 border-l-4 border-blue-500 shadow-sm hover:shadow-lg transition-transform hover:-translate-y-1 p-4 flex h-full">
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Employee Stats</h3>
                    <p className="text-sm text-gray-400 mt-1">Detailed breakdowns by <span className="text-gray-200">department, gender, cohorts, tenure</span>.</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div className="flex-shrink-0 w-64 md:w-1/4">
            <Link to="/dashboard/attendance" className="block h-full">
              <div className="h-44 rounded-lg bg-gray-800 border-l-4 border-blue-500 shadow-sm hover:shadow-lg transition-transform hover:-translate-y-1 p-4 flex h-full">
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Attendance List — Cumulative</h3>
                    <p className="text-sm text-gray-400 mt-1">Excel-style summary view with quick exports.</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
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
              style={{ height: '85vh', width: '100%' }}
              zoomControl={false}
            >
              <ZoomControl position="topright" />
              {/* Outdoor / terrain style tiles (OpenTopoMap) - good shaded outdoor look */}
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url={tileUrl}
                noWrap={true}
              />

              {/* Render clustered markers (200m radius) */}
              {(() => {
                // build clusters on the fly
                function haversineDistance(aLat, aLng, bLat, bLng) {
                  const toRad = v => (v * Math.PI) / 180
                  const R = 6371000 // meters
                  const dLat = toRad(bLat - aLat)
                  const dLon = toRad(bLng - aLng)
                  const lat1 = toRad(aLat)
                  const lat2 = toRad(bLat)

                  const sinDLat = Math.sin(dLat / 2)
                  const sinDLon = Math.sin(dLon / 2)
                  const a = sinDLat * sinDLat + sinDLon * sinDLon * Math.cos(lat1) * Math.cos(lat2)
                  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
                  return R * c
                }

                function buildClusters(points, radiusMeters = 200) {
                  const clusters = []
                  for (const p of points) {
                    const lat = Number(p.lat)
                    const lng = Number(p.lng)
                    if (!isFinite(lat) || !isFinite(lng)) continue

                    let placed = false
                    for (const c of clusters) {
                      // distance from cluster center to this point
                      const d = haversineDistance(c.lat, c.lng, lat, lng)
                      if (d <= radiusMeters) {
                        // append to cluster and recompute centroid
                        c.members.push(p)
                        const n = c.members.length
                        c.lat = (c.lat * (n - 1) + lat) / n
                        c.lng = (c.lng * (n - 1) + lng) / n
                        placed = true
                        break
                      }
                    }

                    if (!placed) {
                      clusters.push({ lat, lng, members: [p] })
                    }
                  }
                  return clusters
                }

                const clusters = buildClusters(records, 200)

                return clusters.map((c, idx) => {
                  if (!c || !Array.isArray(c.members) || c.members.length === 0) return null
                  if (c.members.length === 1) {
                    const pt = c.members[0]
                    return (
                      <Marker key={`p-${pt.id}`} position={[Number(pt.lat), Number(pt.lng)]} icon={getDefaultMarker()}>
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
                    )
                  }

                  // cluster marker (shows unique names count and unique name list)
                  const uniqueNamesArr = Array.from(new Set(c.members.map(m => (m.name || '').toString().trim()).filter(Boolean)))
                  const uniqueCount = uniqueNamesArr.length
                  const popupContent = (
                    <div style={{ maxHeight: 220, overflowY: 'auto', minWidth: 160 }}>
                      <div className="font-semibold">Names nearby</div>
                      <ul className="text-sm mt-2" style={{ paddingLeft: 16 }}>
                        {uniqueNamesArr.map((uname, i) => (
                          <li key={`u-${idx}-${i}`} className="mb-1">{uname}</li>
                        ))}
                      </ul>
                    </div>
                  )

                  return (
                    <Marker
                      key={`cluster-${idx}`}
                      position={[c.lat, c.lng]}
                      icon={getDefaultMarker()}
                      eventHandlers={{
                        click: () => {
                          // zoom further into cluster center
                          try {
                            if (mapRef.current && typeof mapRef.current.flyTo === 'function') {
                              mapRef.current.flyTo([c.lat, c.lng], 17, { animate: true, duration: 0.8 })
                            } else if (mapRef.current) {
                              mapRef.current.setView([c.lat, c.lng], 17, { animate: true })
                            }
                          } catch (e) {
                            console.warn('cluster click zoom failed', e)
                          }
                        }
                      }}
                    >
                      <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent={false}>
                        {(() => {
                          const displayNames = uniqueNamesArr.slice(0, 3).join(', ')
                          return displayNames ? `${displayNames}${uniqueCount > 3 ? ' ...' : ''}` : 'Multiple nearby'
                        })()}
                      </Tooltip>
                      <Popup>
                        {popupContent}
                      </Popup>
                    </Marker>
                  )
                })
              })()}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AttendanceDashboard
