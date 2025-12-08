// src/pages/Dashboard/Attendance/AttendanceAdmin.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";
const DEFAULT_MAP_CENTER = [19.0760, 72.8777]; // Mumbai

// Fix leaflet icon paths for ESM builds (vite/cra)
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

function ClickSetter({ enabled, onSet }) {
  useMapEvents({ click(e) { if (!enabled) return; onSet([e.latlng.lat, e.latlng.lng]); } });
  return null;
}

function TopCard({ title, subtitle, active, onClick }) {
  return (
    <div onClick={onClick} style={{ padding: '14px 18px', borderRadius: 12, background: active ? 'linear-gradient(180deg, rgba(30,60,90,0.18), rgba(10,20,30,0.12))' : '#081018', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.03)', minWidth: 180 }}>
      <div style={{ fontWeight: 700 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: active ? '#d7f0ff' : '#9aa' }}>{subtitle}</div>}
    </div>
  );
}

function AssignModal({ open, onClose, user, geofences, onSave }) {
  const [selected, setSelected] = useState(user?.allowedGeofences ? [...user.allowedGeofences] : []);

  useEffect(() => {
    setSelected(user?.allowedGeofences ? [...user.allowedGeofences] : []);
  }, [user]);

  function toggle(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#07111a', padding: 18, borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.6)', width: 720 }}>
        <h3 style={{ marginTop: 0 }}>Manage allowed geofences for <em>{user?.username}</em></h3>
        <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
          {geofences.map(g => (
            <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, borderRadius: 8, background: '#071018' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{g.name}</div>
                <div style={{ fontSize: 12, color: '#9aa' }}>{g.center.map(c => c.toFixed(5)).join(', ')} · {g.radius} m</div>
              </div>
              <div>
                <button onClick={() => toggle(g.id)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.03)', background: selected.includes(g.id) ? '#164a6a' : '#081018', color: '#dff', cursor: 'pointer' }}>{selected.includes(g.id) ? 'Assigned' : 'Assign'}</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.03)', background: '#081018', color: '#dff', cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => { onSave(selected); onClose(); }} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', background: '#2b7cff', color: '#fff', cursor: 'pointer' }}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default function attendanceGeoFencing() {
  const [view, setView] = useState('users'); // users | create | edit

  // static sample users (no phone numbers displayed)
  const staticUsers = [
    { id: 'u1', username: 'Mano', email: 'manobharathi189@gmail.com', role: 'admin', allowedGeofences: ['hq'] },
    { id: 'u2', username: 'Mugilan Muthaiah', email: 'mugilan6633@gmail.com', role: 'admin', allowedGeofences: ['warehouse', 'hq'] },
    { id: 'u3', username: 'Nishok Ganapathy Nadar', email: 'nishokganapathy07@gmail.com', role: 'client', allowedGeofences: [] },
  ];

  const [users, setUsers] = useState(staticUsers);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [query, setQuery] = useState('');

  // geofences local state
  const [geofences, setGeofences] = useState([
    { id: 'hq', name: 'Office HQ', center: [19.07283, 72.88261], radius: 80 },
    { id: 'warehouse', name: 'Warehouse', center: [19.21833, 72.97809], radius: 120 },
    { id: 'client_site', name: 'Client Site', center: [19.1334, 72.9133], radius: 60 },
  ]);

  // create form
  const [newName, setNewName] = useState('');
  const [newCenter, setNewCenter] = useState(null);
  const [newRadius, setNewRadius] = useState(100);
  const [clickToSet, setClickToSet] = useState(true);

  // edit form
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCenter, setEditCenter] = useState(null);
  const [editRadius, setEditRadius] = useState(100);

  // assign modal
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignUser, setAssignUser] = useState(null);

  // map ref + resize handler (inside component to obey hooks rules)
  const mapRef = useRef(null);
  useEffect(() => {
    function handleResize() {
      if (mapRef.current && typeof mapRef.current.invalidateSize === 'function') {
        mapRef.current.invalidateSize();
      }
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // try fetching real users, but DO NOT overwrite static users on error
    async function fetchUsers() {
      setLoadingUsers(true);
      setUsersError(null);
      try {
        const res = await fetch(`${API_BASE}/admin/users`, { credentials: 'include' });
        const contentType = res.headers.get('content-type') || '';
        const text = await res.text();
        if (!contentType.includes('application/json')) {
          throw new Error('Expected JSON from /api/admin/users — got HTML or other. Check server route.');
        }
        const body = JSON.parse(text);
        if (!body.success) throw new Error(body.message || 'Failed to fetch users');

        const mapped = (body.users || []).map(u => ({
          id: u.user_id ?? u.id ?? Math.random().toString(36).slice(2, 8),
          username: u.name ?? u.user_name ?? u.full_name ?? u.display_name ?? 'Unknown',
          email: u.email ?? u.user_email ?? '',
          role: u.title ?? u.role ?? u.designation ?? 'client',
          allowedGeofences: (u.allowedGeofences || u.geofences || []).map(g => (typeof g === 'string' ? g : g.id ?? g.name)),
          raw: u,
        }));

        // replace static users only when fetch succeeds
        setUsers(mapped);
      } catch (err) {
        console.error('fetch users failed — keeping static users', err);
        setUsersError(err.message || String(err));
      } finally {
        setLoadingUsers(false);
      }
    }

    fetchUsers();
  }, []);

  useEffect(() => {
    if (editingId) {
      const g = geofences.find(x => x.id === editingId);
      if (g) {
        setEditName(g.name);
        setEditCenter(g.center.slice());
        setEditRadius(g.radius);
      }
    }
  }, [editingId, geofences]);

  function filteredUsers() {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u => (u.username || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.role || '').toLowerCase().includes(q));
  }

  function saveNew() {
    if (!newName || !newCenter) return alert('Enter name and pick center on map');
    const id = newName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    setGeofences(prev => [...prev, { id, name: newName, center: newCenter, radius: Number(newRadius) }]);
    setNewName(''); setNewCenter(null); setNewRadius(100); setView('edit');
  }

  function saveEdit() {
    if (!editingId) return;
    setGeofences(prev => prev.map(g => g.id === editingId ? { ...g, name: editName, center: editCenter, radius: Number(editRadius) } : g));
    setEditingId(null);
  }

  function removeGeo(id) {
    if (!window.confirm('Delete geofence ' + id + '?')) return;
    setGeofences(prev => prev.filter(g => g.id !== id));
    setUsers(prev => prev.map(u => ({ ...u, allowedGeofences: (u.allowedGeofences || []).filter(x => x !== id) })));
  }

  function openAssignModal(user) {
    setAssignUser(user);
    setAssignOpen(true);
  }

  function saveAssigned(userId, selectedIds) {
    setUsers(prev => prev.map(u => u.id === userId ? ({ ...u, allowedGeofences: selectedIds }) : u));
  }

  return (
    <div style={{ padding: '36px 48px', background: '#0f1724', height: '100vh', color: '#e6eef8', fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>Admin: User Management</h1>
          <div style={{ color: '#9aa' }}>Manage users and site geofences</div>
        </div>

        <div style={{ minWidth: 320 }}>
          <input placeholder="Search users..." value={query} onChange={e => setQuery(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #1f2a36', background: '#0a0f14', color: '#cfe6ff' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        <TopCard title="Users" subtitle={`${users.length} users`} active={view === 'users'} onClick={() => setView('users')} />
        <TopCard title="Create GeoFence" subtitle="New fence" active={view === 'create'} onClick={() => setView('create')} />
        <TopCard title="Edit GeoFence" subtitle={`${geofences.length} fences`} active={view === 'edit'} onClick={() => setView('edit')} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)' }}>
        <div style={{ background: 'rgb(11, 17, 23)', padding: 20, borderRadius: 12, boxShadow: 'rgba(2, 6, 23, 0.6) 0px 6px 24px', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {view === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, marginBottom: 12, color: '#dfefff' }}>Users</h3>
            <div style={{ color: '#9aa' }}>{users.length} users</div>
            </div>

            {loadingUsers && <div style={{ padding: 12, color: '#9aa' }}>Loading users...</div>}
            {usersError && <div style={{ padding: 12, color: '#ff9a9a' }}>Warning: {usersError}</div>}

            <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1, paddingRight: 6 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
                <thead>
                <tr>
                    <th style={{ textAlign: 'left', padding: '16px 18px', color: '#a9b9cc', fontSize: 13 }}>Username</th>
                    <th style={{ textAlign: 'left', padding: '16px 18px', color: '#a9b9cc', fontSize: 13 }}>Email</th>
                    <th style={{ textAlign: 'left', padding: '16px 18px', color: '#a9b9cc', fontSize: 13 }}>Role</th>
                    <th style={{ textAlign: 'left', padding: '16px 18px', color: '#a9b9cc', fontSize: 13 }}>Shift</th>
                    <th style={{ textAlign: 'center', padding: '16px 18px', color: '#a9b9cc', fontSize: 13 }}>Allowed Geofences</th>
                    <th style={{ textAlign: 'center', padding: '16px 18px', color: '#a9b9cc', fontSize: 13 }}>Manage</th>
                </tr>
                </thead>
                <tbody>
                {filteredUsers().map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '14px 18px', color: '#fff', fontWeight: 600, fontSize: 15 }}>{u.username}</td>
                    <td style={{ padding: '14px 18px', color: '#d3e8ff', fontSize: 14 }}>{u.email || '—'}</td>
                    <td style={{ padding: '14px 18px', color: '#d3e8ff', fontSize: 14 }}>{u.role}</td>
                    <td style={{ padding: '14px 18px', color: '#d3e8ff', fontSize: 14 }}>9:00 AM - 6:00 PM</td>
                    <td style={{ padding: '14px 18px', color: '#d3e8ff', fontSize: 14, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {(u.allowedGeofences || []).length === 0 ? (
                            <span style={{ color: '#9aa' }}>None</span>
                        ) : (
                            (u.allowedGeofences || []).map(id => {
                            const gf = geofences.find(g => g.id === id);
                            return <span key={id} style={{ padding: '6px 10px', background: '#071018', color: '#bfe6ff', borderRadius: 999, border: '1px solid rgba(255,255,255,0.03)', fontSize: 13 }}>{gf ? gf.name : id}</span>;
                            })
                        )}
                        </div>
                    </td>
                    <td style={{ padding: '14px 18px', color: '#d3e8ff', fontSize: 14, textAlign: 'center' }}>
                        <button onClick={() => openAssignModal(u)} style={{ padding: 8, borderRadius: 8, background: '#0b2233', color: '#bfe6ff', border: 'none', cursor: 'pointer' }}>Manage</button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>

        </div>
        )}

        {view === 'create' && (
          <div style={{ display: 'flex', gap: 18, height: '100%' }}>
            <div style={{ width: 420 }}>
              <h3 style={{ marginTop: 0 }}>Create GeoFence</h3>
              <label style={{ display: 'block', marginTop: 12, marginBottom: 6, color: '#a9b9cc' }}>Name</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)', background: '#07111a', color: '#e6f6ff' }} />

              <label style={{ display: 'block', marginTop: 12, marginBottom: 6, color: '#a9b9cc' }}>Radius (meters)</label>
              <input type="number" value={newRadius} onChange={e => setNewRadius(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)', background: '#07111a', color: '#e6f6ff' }} />

              <label style={{ display: 'block', marginTop: 12, marginBottom: 6, color: '#a9b9cc' }}>Pick center</label>
              <label style={{ display: 'block', marginBottom: 8 }}><input type="checkbox" checked={clickToSet} onChange={e => setClickToSet(e.target.checked)} /> Click map to set center</label>

              <div style={{ padding: 10, background: '#0b1117', borderRadius: 8, color: '#bcd' }}>
                <div style={{ marginBottom: 8 }}>{newCenter ? newCenter.map(c => c.toFixed(6)).join(', ') : <em>No center selected</em>}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => {
                    if (!navigator.geolocation) return alert('Geolocation not supported');
                    navigator.geolocation.getCurrentPosition(p => setNewCenter([p.coords.latitude, p.coords.longitude]), e => alert(e.message), { enableHighAccuracy: true });
                  }} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.03)', background: '#081018', color: '#dff', cursor: 'pointer' }}>Use my location</button>
                  <button onClick={() => { setNewCenter(null); setNewRadius(100); setNewName(''); }} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.03)', background: 'transparent', color: '#9aa', cursor: 'pointer' }}>Reset</button>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <button onClick={saveNew} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', background: '#2b7cff', color: '#fff', cursor: 'pointer' }}>Create GeoFence</button>
              </div>
            </div>

            <div style={{ flex: 1, height: '100%' }}>
              <MapContainer whenCreated={map => (mapRef.current = map)} center={newCenter || DEFAULT_MAP_CENTER} zoom={13} style={{ height: '100%', width: '100%', borderRadius: 8 }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <ClickSetter enabled={clickToSet} onSet={(latlng) => setNewCenter(latlng)} />
                {newCenter && <><Marker position={newCenter} /><Circle center={newCenter} radius={Number(newRadius)} /></>}
              </MapContainer>
            </div>
          </div>
        )}

        {view === 'edit' && (
          <div style={{ display: 'flex', gap: 18, height: '100%' }}>
            <div style={{ width: 360 }}>
              <h3 style={{ marginTop: 0 }}>Edit GeoFences</h3>
              {geofences.map(g => (
                <div key={g.id} style={{ padding: 12, borderRadius: 10, background: '#071018', border: '1px solid rgba(255,255,255,0.02)', marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{g.name}</div>
                      <div style={{ fontSize: 12, color: '#9aa' }}>{g.center.map(c => c.toFixed(5)).join(', ')} · {g.radius} m</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setEditingId(g.id)} style={{ padding: 8, borderRadius: 8, background: '#0b2233', color: '#bfe6ff', border: 'none', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => removeGeo(g.id)} style={{ padding: 8, borderRadius: 8, background: '#2a0b0b', color: '#ffbdbd', border: 'none', cursor: 'pointer' }}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ flex: 1, height: '100%' }}>
              {editingId ? (
                <div>
                  <h3 style={{ marginTop: 0 }}>Editing: {editName}</h3>
                  <div style={{ display: 'flex', gap: 12, height: 'calc(100% - 48px)' }}>
                    <div style={{ width: 320 }}>
                      <label style={{ display: 'block', marginTop: 12, marginBottom: 6, color: '#a9b9cc' }}>Name</label>
                      <input value={editName} onChange={e => setEditName(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)', background: '#07111a', color: '#e6f6ff' }} />

                      <label style={{ display: 'block', marginTop: 12, marginBottom: 6, color: '#a9b9cc' }}>Radius (meters)</label>
                      <input type="number" value={editRadius} onChange={e => setEditRadius(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)', background: '#07111a', color: '#e6f6ff' }} />

                      <label style={{ display: 'block', marginTop: 8 }}><input type="checkbox" checked={clickToSet} onChange={e => setClickToSet(e.target.checked)} /> Click map to set center</label>

                      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                        <button onClick={saveEdit} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', background: '#2b7cff', color: '#fff', cursor: 'pointer' }}>Save changes</button>
                        <button onClick={() => setEditingId(null)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.03)', background: '#081018', color: '#dff', cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </div>

                    <div style={{ flex: 1, height: '100%' }}>
                      <MapContainer whenCreated={map => (mapRef.current = map)} center={editCenter || DEFAULT_MAP_CENTER} zoom={13} style={{ height: '100%', width: '100%', borderRadius: 8 }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <ClickSetter enabled={clickToSet} onSet={(latlng) => setEditCenter(latlng)} />
                        {editCenter && <><Marker position={editCenter} /><Circle center={editCenter} radius={Number(editRadius)} /></>}
                      </MapContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: 18, color: '#9aa' }}>Select a geofence to edit from the left.</div>
              )}
            </div>
          </div>
        )}

        </div>
      </div>

      <AssignModal open={assignOpen} onClose={() => setAssignOpen(false)} user={assignUser} geofences={geofences} onSave={(selected) => saveAssigned(assignUser.id, selected)} />

    </div>
  );
}