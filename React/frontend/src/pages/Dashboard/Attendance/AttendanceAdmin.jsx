// src/pages/Dashboard/Attendance/AttendanceAdmin.jsx
import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

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
          ? "bg-gray-800 text-sky-100 border-t border-l border-r border-b-0 border-sky-600/20 -translate-y-[6px] "
          : "bg-[#071018] text-sky-200 border-t border-l border-r border-b-0 border-white/5")
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
      <div className="w-[720px] bg-[#07111a] p-5 rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-3">Manage allowed geofences for <em>{user?.username}</em></h3>

        <div className="flex flex-col gap-2 max-h-[52vh] overflow-auto">
          {geofences.map(g => (
            <div key={g.id} className="flex justify-between items-center p-2 rounded-md bg-[#071018]">
              <div>
                <div className="font-semibold">{g.name}</div>
                <div className="text-xs text-sky-300">{(g.latitude)?.toFixed?.(5) ?? g.center?.[0]?.toFixed?.(5)} , {(g.longitude)?.toFixed?.(5) ?? g.center?.[1]?.toFixed?.(5)} · {g.radius} m</div>
              </div>
              <div>
                <button onClick={() => toggle(g.id)} className={`px-3 py-2 rounded-md text-sm border ${selected.includes(g.id) ? 'bg-[#164a6a] border-transparent text-white' : 'bg-[#081018] border-white/5 text-sky-100'}`}>
                  {selected.includes(g.id) ? 'Assigned' : 'Assign'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded-md border border-white/5 bg-[#081018] text-sky-100">Cancel</button>
          <button onClick={async () => { await onSaveRemote(user.user_id, selected); onClose(); }} className="px-4 py-2 rounded-lg bg-sky-600 text-white">Save</button>
        </div>
      </div>
    </div>
  );
}

export default function attendanceGeoFencing() {
  const [view, setView] = useState("users");

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [query, setQuery] = useState("");

  // geofences from DB (work_locations)
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

  // map ref + resize handler
  const mapRef = useRef(null);
  useEffect(() => {
    function handleResize() { if (mapRef.current && typeof mapRef.current.invalidateSize === 'function') mapRef.current.invalidateSize(); }
    window.addEventListener('resize', handleResize); return () => window.removeEventListener('resize', handleResize);
  }, []);

  // fetch work locations and users on mount
  useEffect(() => {
    fetchWorkLocations();
    fetchUsers();
  }, []);

  async function fetchWorkLocations() {
    try {
      const res = await fetch(`${API_BASE}/admin/locations`, { credentials: 'include' });
      const body = await res.json();
      console.log(body)
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
        throw new Error('Expected JSON from /admin/users — got HTML or other. Check server route.');
      }
      const body = JSON.parse(text);
      if (!body.success) throw new Error(body.message || 'Failed to fetch users');

      const mapped = (body.users || []).map(u => ({
        id: u.user_id ?? u.id,
        user_id: u.user_id ?? u.id,
        username: u.user_name ?? u.name ?? 'Unknown',
        email: u.email ?? '',
        designation: u.designation ?? u.title ?? '',
        work_locations: u.work_locations || [], // array from server
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

  // Create new work location on backend
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

  // Assign work locations to user via backend
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

      // update local users state
      setUsers(prev => prev.map(u => u.user_id === userId ? ({ ...u, work_locations: (selectedIds || []).map(id => {
        const fl = geofences.find(g => g.id === id);
        return fl ? { loc_id: fl.id, loc_name: fl.name, latitude: fl.latitude, longitude: fl.longitude, radius: fl.radius } : { loc_id: id };
      }) }) : u ));
    } catch (err) {
      console.error('assign failed', err);
      alert(err.message || String(err));
    }
  }

  // Save edit to an existing work location (PUT)
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
    <div className="h-screen box-border p-7 bg-[#0f1724] text-[#e6eef8] font-sans">
      {/* HEADER */}
      <div className="h-20 flex items-center justify-between gap-4">
        <div>
          <h1 className="m-0 text-2xl font-semibold">Admin: User Management</h1>
          <div className="text-sky-300">Manage users and site geofences</div>
        </div>

        {/* Search (tailwind style per reference) */}
        {view === 'users' && (
          <div className="relative w-[360px]">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-sky-300">search</span>
            <input value={query} onChange={e => setQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#07111a] border border-gray-700 focus:ring-2 focus:ring-sky-500 text-sky-100" placeholder="Search users..." type="search" />
          </div>
        )}
      </div>

      {/* TOP CARDS */}
      <div className="flex items-end justify-between mt-2">
        <div className="flex gap-3">
          <TopCard title="Users" subtitle={`${users.length} users`} active={view === "users"} onClick={() => setView("users")} />
          <TopCard title="Create GeoFence" subtitle="New fence" active={view === "create"} onClick={() => setView("create")} />
          <TopCard title="Edit GeoFence" subtitle={`${geofences.length} fences`} active={view === "edit"} onClick={() => setView("edit")} />
        </div>
      </div>

      {/* MAIN container full-width */}
      <div className="mt-[-6px] h-[calc(100vh-80px-64px-40px)] pb-4 flex">
        <div className="bg-gray-800 p-6 rounded-lg rounded-tl-none shadow-[0_6px_24px_rgba(2,6,23,0.6)] h-full w-full overflow-hidden flex flex-col">

          {/* USERS VIEW */}
          {view === 'users' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between">
                <h3 className="m-0 mb-2 text-sky-50 text-lg font-semibold">Users</h3>
                <div className="text-sky-300">{users.length} users</div>
              </div>

              <div className="flex-1 overflow-auto pr-2">
                <div className="min-w-[980px]">
                  <table className="w-full table-auto border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left px-4 py-3 text-sky-300 text-sm">Username</th>
                        <th className="text-left px-4 py-3 text-sky-300 text-sm">Email</th>
                        <th className="text-left px-4 py-3 text-sky-300 text-sm">Designation</th>
                        <th className="text-left px-4 py-3 text-sky-300 text-sm">Shift</th>
                        <th className="text-center px-4 py-3 text-sky-300 text-sm">Allowed Geofences</th>
                        <th className="text-center px-4 py-3 text-sky-300 text-sm">Manage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers().map((u) => (
                        <tr key={u.id} className="border-b border-white/5">
                          <td className="px-4 py-3 text-white font-semibold">{u.username}</td>
                          <td className="px-4 py-3 text-sky-100">{u.email || "—"}</td>
                          <td className="px-4 py-3 text-sky-100">{u.designation}</td>
                          <td className="px-4 py-3 text-sky-100">9:00 AM - 6:00 PM</td>
                          <td className="px-4 py-3 text-sky-100 text-center">
                            <div className="flex gap-2 items-center justify-center flex-wrap">
                              {(u.work_locations || []).length === 0 ? (
                                <span className="text-sky-400">None</span>
                              ) : (
                                (u.work_locations || []).map((w) => (
                                  <span key={w.loc_id} className="px-2 py-1 bg-[#071018] text-sky-100 rounded-full border border-white/5 text-sm">{w.loc_name}</span>
                                ))
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => { setAssignUser(u); setAssignOpen(true); }} className="px-3 py-2 rounded-md bg-[#0b2233] text-sky-100">Manage</button>
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
            <div className="flex gap-4 h-full">
              <div className="w-[420px]">
                <h3 className="text-lg font-semibold mb-2">Create GeoFence</h3>
                <label className="block text-sm text-sky-300 mt-3 mb-1">Name</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-3 py-2 rounded-md border border-white/5 bg-[#07111a] text-sky-100" />

                <label className="block text-sm text-sky-300 mt-3 mb-1">Radius (meters)</label>
                <input type="number" value={newRadius} onChange={e => setNewRadius(e.target.value)} className="w-full px-3 py-2 rounded-md border border-white/5 bg-[#07111a] text-sky-100" />

                <label className="block text-sm text-sky-300 mt-3 mb-1">Pick center</label>
                <label className="flex items-center gap-2 mb-2">
                  <input type="checkbox" checked={clickToSet} onChange={e => setClickToSet(e.target.checked)} />
                  <span className="text-sm text-sky-200">Click map to set center</span>
                </label>

                <div className="p-3 bg-[#0b1117] rounded-md text-sky-200">
                  <div className="mb-2">{newCenter ? newCenter.map(c => c.toFixed(6)).join(', ') : <em>No center selected</em>}</div>
                  <div className="flex gap-2">
                    <button onClick={() => { if (!navigator.geolocation) return alert('Geolocation not supported'); navigator.geolocation.getCurrentPosition(p => setNewCenter([p.coords.latitude, p.coords.longitude]), e => alert(e.message), { enableHighAccuracy: true }); }} className="px-3 py-2 rounded-md border border-white/5 bg-[#081018] text-sky-100">Use my location</button>
                    <button onClick={() => { setNewCenter(null); setNewRadius(100); setNewName(''); }} className="px-3 py-2 rounded-md border border-white/5 text-sky-300">Reset</button>
                  </div>
                </div>

                <div className="mt-4">
                  <button onClick={createWorkLocation} className="px-4 py-2 rounded-lg bg-sky-600 text-white">Create GeoFence</button>
                </div>
              </div>

              <div className="flex-1 h-full">
                <div className="h-full rounded-lg overflow-hidden">
                  <MapContainer whenCreated={map => (mapRef.current = map)} center={newCenter || DEFAULT_MAP_CENTER} zoom={defaultZoom} className="h-full w-full">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <ClickSetter enabled={clickToSet} onSet={latlng => setNewCenter(latlng)} />
                    {newCenter && <><Marker position={newCenter} /><Circle center={newCenter} radius={Number(newRadius)} /></>}
                  </MapContainer>
                </div>
              </div>
            </div>
          )}

          {/* EDIT VIEW */}
          {view === 'edit' && (
            <div className="flex gap-4 h-full">
              {/* LEFT PANEL — EXISTING GEOFENCES + EDIT FORM STACKED */}
              <div className="w-[420px] h-full flex flex-col gap-3 overflow-hidden">
                {/* EXISTING GEOFENCES LIST — row 1 */}
                <div className="flex-[1] overflow-auto pr-1">
                  <h3 className="text-lg font-semibold mb-2">Edit GeoFences</h3>
                  {geofences.map(g => (
                    <div key={g.id} className="p-3 rounded-lg bg-[#071018] border border-white/5 mb-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold">{g.name}</div>
                          <div className="text-xs text-sky-300">{(g.latitude)?.toFixed?.(5)} , {(g.longitude)?.toFixed?.(5)} · {g.radius} m</div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingId(g.id)} className="px-2 py-1 rounded-md bg-[#0b2233] text-sky-100">Edit</button>
                          <button onClick={() => removeGeo(g.id)} className="px-2 py-1 rounded-md bg-[#2a0b0b] text-rose-300">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* EDIT FORM — row 2 */}
                <div className="h-[260px] flex-[1] overflow-hidden p-2 rounded-lg bg-[#071018] border border-white/5">
                  {editingId ? (
                    <>
                      <h3 className="text-lg font-semibold">Editing: {editName}</h3>

                      <label className="block text-sm text-sky-300 mt-3 mb-1">Name</label>
                      <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-3 py-2 rounded-md border border-white/5 bg-[#07111a] text-sky-100" />

                      <label className="block text-sm text-sky-300 mt-3 mb-1">Radius (meters)</label>
                      <input type="number" value={editRadius} onChange={e => setEditRadius(e.target.value)} className="w-full px-3 py-2 rounded-md border border-white/5 bg-[#07111a] text-sky-100" />

                      <label className="flex items-center gap-2 mt-3">
                        <input type="checkbox" checked={clickToSet} onChange={e => setClickToSet(e.target.checked)} />
                        <span className="text-sky-200">Click map to set center</span>
                      </label>

                      <div className="mt-4 flex gap-2">
                        <button onClick={saveEdit} className="px-4 py-2 rounded-lg bg-sky-600 text-white">Save changes</button>
                        <button onClick={() => setEditingId(null)} className="px-3 py-2 rounded-md border border-white/5 text-sky-100">Cancel</button>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 text-sky-300">Select a geofence to edit from the list above.</div>
                  )}
                </div>
              </div>

              {/* MAP — remaining space */}
              <div className="flex-1 h-full rounded-lg overflow-hidden">
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
  );
}