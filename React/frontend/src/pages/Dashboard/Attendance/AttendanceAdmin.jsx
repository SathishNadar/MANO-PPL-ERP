// src/pages/Dashboard/Attendance/AttendanceAdmin.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import Sidebar from "../../SidebarComponent/sidebar"; // Imported Sidebar

// Fix leaflet icon paths for bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";
const DEFAULT_MAP_CENTER = [19.165924, 73.041916];
const defaultZoom = 11;

function ClickSetter({ enabled, onSet }) {
  useMapEvents({
    click(e) { if (!enabled) return; onSet([e.latlng.lat, e.latlng.lng]); }
  });
  return null;
}

function TopCard({ title, subtitle, active, onClick }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={
        "min-w-[160px] px-4 py-3 rounded-t-xl focus:outline-none transition-all duration-150 " +
        (active
          ? "bg-[#1E2939] text-white border-t border-l border-r border-b-0 border-gray-700/50 -translate-y-[6px] "
          : "bg-[#111827] text-gray-400 border-t border-l border-r border-b-0 border-white/5 hover:bg-[#374151]")
      }
    >
      <div className="font-semibold text-sm">{title}</div>
      {subtitle && <div className="text-xs opacity-90 mt-1">{subtitle}</div>}
    </button>
  );
}

function AssignModal({ open, onClose, user, geofences, onSaveRemote }) {
  const [selected, setSelected] = useState((user?.work_locations || []).map(w => w.loc_id));

  useEffect(() => {
    setSelected((user?.work_locations || []).map(w => w.loc_id));
  }, [user]);

  function toggle(id) {
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center" onClick={onClose}>
      <div className="w-[720px] bg-[#1E2939] p-6 rounded-xl shadow-2xl border border-gray-700" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-semibold mb-4 text-white">Manage allowed geofences for <em className="text-blue-400">{user?.username}</em></h3>

        <div className="flex flex-col gap-2 max-h-[52vh] overflow-auto pr-2 custom-scrollbar">
          {geofences.map(g => (
            <div key={g.id} className="flex justify-between items-center p-3 rounded-lg bg-[#374151] hover:bg-[#4b5563] transition-colors">
              <div>
                <div className="font-semibold text-white">{g.name}</div>
                <div className="text-xs text-gray-400">{(g.latitude)?.toFixed?.(5) ?? g.center?.[0]?.toFixed?.(5)} , {(g.longitude)?.toFixed?.(5) ?? g.center?.[1]?.toFixed?.(5)} · {g.radius} m</div>
              </div>
              <div>
                <button onClick={() => toggle(g.id)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${selected.includes(g.id) ? 'bg-blue-600 border-transparent text-white' : 'bg-transparent border-gray-500 text-gray-300 hover:border-gray-300'}`}>
                  {selected.includes(g.id) ? 'Assigned' : 'Assign'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors">Cancel</button>
          <button onClick={async () => { await onSaveRemote(user.user_id, selected); onClose(); }} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">Save Changes</button>
        </div>
      </div>
    </div>
  );
}

export default function attendanceGeoFencing() {
  const navigate = useNavigate();
  const [view, setView] = useState("users");

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [query, setQuery] = useState("");

  const [geofences, setGeofences] = useState([]);

  // create form
  const [newName, setNewName] = useState("");
  const [newCenter, setNewCenter] = useState(null);
  const [newRadius, setNewRadius] = useState(100);
  const [clickToSet, setClickToSet] = useState(true);

  // edit form
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCenter, setEditCenter] = useState(null);
  const [editRadius, setEditRadius] = useState(100);

  // assign modal
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignUser, setAssignUser] = useState(null);

  const mapRef = useRef(null);
  useEffect(() => {
    function handleResize() { if (mapRef.current && typeof mapRef.current.invalidateSize === 'function') mapRef.current.invalidateSize(); }
    window.addEventListener('resize', handleResize); return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchWorkLocations();
    fetchUsers();
  }, []);

  async function fetchWorkLocations() {
    try {
      const res = await fetch(`${API_BASE}/admin/locations`, { credentials: 'include' });
      const body = await res.json();
      if (!body.success) throw new Error(body.message || 'Failed to fetch work locations');
      const list = (body.locations || []).map(r => ({ id: r.loc_id, name: r.loc_name, latitude: Number(r.latitude), longitude: Number(r.longitude), radius: Number(r.radius) }));
      setGeofences(list);
    } catch (err) {
      console.error('failed load work locations', err);
    }
  }

  async function fetchUsers() {
    setLoadingUsers(true); setUsersError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/users?workLocation=true`, { credentials: 'include' });
      const contentType = res.headers.get('content-type') || '';
      const text = await res.text();
      if (!contentType.includes('application/json')) {
        throw new Error('Expected JSON from /admin/users - got HTML or other');
      }
      const body = JSON.parse(text);
      if (!body.success) throw new Error(body.message || 'Failed to fetch users');

      const mapped = (body.users || []).map(u => ({
        id: u.user_id ?? u.id,
        user_id: u.user_id ?? u.id,
        username: u.user_name ?? u.name ?? 'Unknown',
        email: u.email ?? '',
        designation: u.designation ?? u.title ?? '',
        work_locations: u.work_locations || [],
        controls: u.controls || [],
        raw: u,
      }));

      setUsers(mapped);
    } catch (err) {
      console.error('fetch users failed', err);
      setUsersError(err.message || String(err));
    } finally {
      setLoadingUsers(false);
    }
  }

  async function createWorkLocation() {
    if (!newName || !newCenter) return alert('Enter name and pick center');
    try {
      const body = { loc_name: newName, latitude: newCenter[0], longitude: newCenter[1], radius: Number(newRadius) };
      const res = await fetch(`${API_BASE}/admin/locations`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to create location');
      const id = data.id ?? data.loc_id ?? String(Date.now());
      const newG = { id, name: newName, latitude: Number(newCenter[0]), longitude: Number(newCenter[1]), radius: Number(newRadius) };
      setGeofences(prev => [...prev, newG]);
      setNewName(''); setNewCenter(null); setNewRadius(100); setView('edit');
    } catch (err) { console.error('create location failed', err); alert(err.message || String(err)); }
  }

  async function assignWorkLocationsToUser(userId, selectedIds) {
    try {
      const user = users.find(u => u.user_id === userId || u.id === userId);
      const before = (user?.work_locations || []).map(w => w.loc_id);
      const add = selectedIds.filter(id => !before.includes(id));
      const remove = before.filter(id => !selectedIds.includes(id));

      const res = await fetch(`${API_BASE}/admin/locations/assign/${userId}`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ add, remove })
      });
      const resp = await res.json();
      if (!resp.success) throw new Error(resp.message || 'assign failed');

      setUsers(prev => prev.map(u => u.user_id === userId ? ({
        ...u, work_locations: (selectedIds || []).map(id => {
          const fl = geofences.find(g => g.id === id);
          return fl ? { loc_id: fl.id, loc_name: fl.name, latitude: fl.latitude, longitude: fl.longitude, radius: fl.radius } : { loc_id: id };
        })
      }) : u));
    } catch (err) {
      console.error('assign failed', err);
      alert(err.message || String(err));
    }
  }

  async function saveEdit() {
    if (!editingId) return;
    try {
      const payload = { loc_name: editName, latitude: editCenter[0], longitude: editCenter[1], radius: Number(editRadius) };
      const res = await fetch(`${API_BASE}/admin/locations/${editingId}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'update failed');
      setGeofences(prev => prev.map(g => g.id === editingId ? ({ ...g, name: editName, latitude: editCenter[0], longitude: editCenter[1], radius: Number(editRadius) }) : g));
      setEditingId(null);
    } catch (err) { console.error('update failed', err); alert(err.message || String(err)); }
  }

  function removeGeo(id) {
    if (!window.confirm('Delete geofence ' + id + '?')) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/locations/${id}`, { method: 'DELETE', credentials: 'include' });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'delete failed');
        setGeofences(prev => prev.filter(g => g.id !== id));
        setUsers(prev => prev.map(u => ({ ...u, work_locations: (u.work_locations || []).filter(w => w.loc_id !== id) })));
      } catch (err) { console.error('delete failed', err); alert(err.message || String(err)); }
    })();
  }

  useEffect(() => {
    if (editingId) {
      const g = geofences.find(x => x.id === editingId);
      if (g) {
        setEditName(g.name);
        setEditCenter([g.latitude ?? g.center?.[0], g.longitude ?? g.center?.[1]]);
        setEditRadius(g.radius);
      }
    }
  }, [editingId, geofences]);

  useEffect(() => {
    const t = setTimeout(() => { if (mapRef && mapRef.current && typeof mapRef.current.invalidateSize === 'function') mapRef.current.invalidateSize(); }, 200);
    return () => clearTimeout(t);
  }, [view, editingId]);

  function filteredUsers() {
    const q = query.trim().toLowerCase(); if (!q) return users; return users.filter(u => (u.username || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.designation || '').toLowerCase().includes(q));
  }

  return (
    <div className="flex h-screen bg-[#101828] text-white font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="p-8 overflow-hidden h-full flex flex-col">

          <button
            onClick={() => navigate('/dashboard/attendance')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors w-fit"
          >
            <span className="material-icons text-lg">arrow_back</span>
            <span className="text-sm font-medium">Back</span>
          </button>

          {/* HEADER */}
          <div className="flex items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Admin: User Management</h1>
              <div className="text-gray-400 text-sm">Manage users and site geofences</div>
            </div>

            {/* Search */}
            {view === 'users' && (
              <div className="relative w-[360px]">
                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#1E2939] border border-gray-700 text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="Search users..."
                  type="search"
                />
              </div>
            )}
          </div>

          {/* TOP CARDS */}
          <div className="flex items-end justify-between mt-2">
            <div className="flex gap-2">
              <TopCard title="Users" subtitle={`${users.length} users`} active={view === "users"} onClick={() => setView("users")} />
              <TopCard title="Create GeoFence" subtitle="New fence" active={view === "create"} onClick={() => setView("create")} />
              <TopCard title="Edit GeoFence" subtitle={`${geofences.length} fences`} active={view === "edit"} onClick={() => setView("edit")} />
            </div>
          </div>

          {/* MAIN container full-width */}
          <div className="mt-[-6px] h-full flex-1 overflow-hidden pb-4 flex relative z-10">
            <div className="bg-[#1E2939] p-6 rounded-lg rounded-tl-none border border-gray-700/50 shadow-xl h-full w-full overflow-hidden flex flex-col">

              {/* USERS VIEW */}
              {view === 'users' && (
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Users List</h3>
                    <div className="text-gray-400 text-sm bg-[#1f2937] px-3 py-1 rounded-full border border-gray-700">{users.length} users</div>
                  </div>

                  <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
                    <div className="min-w-[980px]">
                      <table className="w-full table-auto border-collapse">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium uppercase tracking-wider">Username</th>
                            <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium uppercase tracking-wider">Email</th>
                            <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium uppercase tracking-wider">Designation</th>
                            <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium uppercase tracking-wider">Shift</th>
                            <th className="text-center px-4 py-3 text-gray-400 text-sm font-medium uppercase tracking-wider">Allowed Geofences</th>
                            <th className="text-center px-4 py-3 text-gray-400 text-sm font-medium uppercase tracking-wider">Manage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers().map((u) => (
                            <tr key={u.id} className="border-b border-gray-800 hover:bg-[#1f2937] transition-colors">
                              <td className="px-4 py-3 text-white font-medium">{u.username}</td>
                              <td className="px-4 py-3 text-gray-300">{u.email || "—"}</td>
                              <td className="px-4 py-3 text-gray-300">{u.designation}</td>
                              <td className="px-4 py-3 text-gray-300">9:00 AM - 6:00 PM</td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex gap-2 items-center justify-center flex-wrap">
                                  {(u.work_locations || []).length === 0 ? (
                                    <span className="text-gray-500 italic text-sm">None</span>
                                  ) : (
                                    (u.work_locations || []).map((w) => (
                                      <span key={w.loc_id} className="px-2 py-1 bg-[#374151] text-blue-200 rounded-md border border-gray-600 text-xs">{w.loc_name}</span>
                                    ))
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button onClick={() => { setAssignUser(u); setAssignOpen(true); }} className="px-3 py-1.5 rounded-md bg-[#1f2937] border border-gray-600 text-blue-400 hover:bg-blue-900/20 hover:border-blue-700 hover:text-blue-300 transition-colors text-sm">Manage</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* CREATE VIEW */}
              {view === 'create' && (
                <div className="flex gap-6 h-full">
                  <div className="w-[420px] flex flex-col">
                    <h3 className="text-lg font-semibold mb-4 text-white">Create New Geofence</h3>

                    <div className="space-y-4 flex-1 overflow-auto pr-2 custom-scrollbar">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Name</label>
                        <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-700 bg-[#1E2939] text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors" placeholder="e.g. Head Office" />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Radius (meters)</label>
                        <input type="number" value={newRadius} onChange={e => setNewRadius(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-700 bg-[#1E2939] text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors" />
                      </div>

                      <div className="bg-[#1E2939] p-4 rounded-lg border border-gray-700">
                        <label className="block text-sm text-gray-400 mb-2">Location Center</label>
                        <label className="flex items-center gap-2 mb-3 cursor-pointer">
                          <input type="checkbox" checked={clickToSet} onChange={e => setClickToSet(e.target.checked)} className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700" />
                          <span className="text-sm text-gray-300">Click map to set center</span>
                        </label>

                        <div className="text-blue-300 text-sm mb-3 font-mono break-all">
                          {newCenter ? `${newCenter[0].toFixed(6)}, ${newCenter[1].toFixed(6)}` : <em className="text-gray-500">No center selected</em>}
                        </div>

                        <div className="flex gap-2">
                          <button onClick={() => { if (!navigator.geolocation) return alert('Geolocation not supported'); navigator.geolocation.getCurrentPosition(p => setNewCenter([p.coords.latitude, p.coords.longitude]), e => alert(e.message), { enableHighAccuracy: true }); }} className="px-3 py-2 rounded-md border border-gray-600 bg-gray-700 text-white hover:bg-gray-600 transition-colors text-sm flex-1">Use my location</button>
                          <button onClick={() => { setNewCenter(null); setNewRadius(100); setNewName(''); }} className="px-3 py-2 rounded-md border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors text-sm">Reset</button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <button onClick={createWorkLocation} className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20">Create GeoFence</button>
                    </div>
                  </div>

                  <div className="flex-1 h-full rounded-xl overflow-hidden border border-gray-700 shadow-inner">
                    <MapContainer whenCreated={map => (mapRef.current = map)} center={newCenter || DEFAULT_MAP_CENTER} zoom={defaultZoom} className="h-full w-full">
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <ClickSetter enabled={clickToSet} onSet={latlng => setNewCenter(latlng)} />
                      {newCenter && <><Marker position={newCenter} /><Circle center={newCenter} radius={Number(newRadius)} /></>}
                    </MapContainer>
                  </div>
                </div>
              )}

              {/* EDIT VIEW */}
              {view === 'edit' && (
                <div className="flex gap-6 h-full">
                  {/* LEFT PANEL */}
                  <div className="w-[420px] h-full flex flex-col gap-4 overflow-hidden">
                    {/* LIST */}
                    <div className="flex-[1] overflow-auto pr-2 custom-scrollbar bg-[#1E2939] rounded-lg border border-gray-700 p-2">
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2 sticky top-0 bg-[#1E2939]">Existing Geofences</h3>
                      {geofences.map(g => (
                        <div key={g.id} className="p-3 rounded-lg bg-[#374151] hover:bg-[#4b5563] border border-transparent hover:border-gray-500 mb-2 transition-all">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-semibold text-white">{g.name}</div>
                              <div className="text-xs text-blue-300 mt-0.5">{(g.latitude)?.toFixed?.(5)} , {(g.longitude)?.toFixed?.(5)} · {g.radius} m</div>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => setEditingId(g.id)} className="px-2 py-1 rounded bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 hover:text-blue-200 text-xs border border-blue-900/50 transition-colors">Edit</button>
                              <button onClick={() => removeGeo(g.id)} className="px-2 py-1 rounded bg-red-900/30 text-red-400 hover:bg-red-900/50 hover:text-red-200 text-xs border border-red-900/50 transition-colors">Del</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* EDIT FORM */}
                    <div className="h-[280px] flex-shrink-0 flex flex-col p-4 rounded-lg bg-[#1E2939] border border-gray-700 shadow-lg">
                      {editingId ? (
                        <>
                          <h3 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                            <span className="material-icons text-sm text-blue-400">edit</span>
                            Editing: {editName}
                          </h3>

                          <div className="space-y-3 overflow-auto pr-1">
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Name</label>
                              <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-2 py-1.5 rounded border border-gray-600 bg-[#374151] text-white text-sm focus:border-blue-500 focus:outline-none" />
                            </div>

                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Radius (meters)</label>
                              <input type="number" value={editRadius} onChange={e => setEditRadius(e.target.value)} className="w-full px-2 py-1.5 rounded border border-gray-600 bg-[#374151] text-white text-sm focus:border-blue-500 focus:outline-none" />
                            </div>

                            <label className="flex items-center gap-2 mt-2">
                              <input type="checkbox" checked={clickToSet} onChange={e => setClickToSet(e.target.checked)} className="rounded bg-gray-600 border-gray-500 text-blue-600" />
                              <span className="text-xs text-gray-300">Click map to update center</span>
                            </label>
                          </div>

                          <div className="mt-auto pt-3 flex gap-2">
                            <button onClick={saveEdit} className="flex-1 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors">Save</button>
                            <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded border border-gray-600 text-gray-300 text-sm hover:bg-gray-700 transition-colors">Cancel</button>
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-4 text-center border-2 border-dashed border-gray-700 rounded-lg">
                          <span className="material-icons text-3xl mb-2 opacity-50">touch_app</span>
                          <span className="text-sm">Select a geofence above to edit details</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* MAP */}
                  <div className="flex-1 h-full rounded-xl overflow-hidden border border-gray-700 shadow-inner">
                    <MapContainer whenCreated={map => (mapRef.current = map)} center={editCenter || DEFAULT_MAP_CENTER} zoom={defaultZoom} className="h-full w-full">
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <ClickSetter enabled={clickToSet} onSet={latlng => setEditCenter(latlng)} />
                      {editCenter && <><Marker position={editCenter} /><Circle center={editCenter} radius={Number(editRadius)} /></>}
                    </MapContainer>
                  </div>
                </div>
              )}

            </div>
          </div>

          <AssignModal open={assignOpen} onClose={() => setAssignOpen(false)} user={assignUser} geofences={geofences} onSaveRemote={assignWorkLocationsToUser} />
        </div>
      </div>
    </div>
  );
}