import React from 'react'
import { useNavigate } from 'react-router-dom'
function sidebar() {
  const navigate = useNavigate()
  return (
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
        
        <img
            alt="User avatar"
            className="w-10 h-10 rounded-full mt-auto text-secondary"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLfWyPP_yFAEG_gjAchak9ylgmyX8NDer_TYOCRBciD3o0EwO0w_xnK6RTdmrJbainVA5n-29GN4oIWWM62FwD6-kOZZQ8_3ymooziSk389zQ3B5j9bY2OjC_z9wh5pxpEKYdHOF3AYlR8A5w_lGWuYVtXGPQvTVSBLVtNWv0ZCojBMx_O-rpCZVwQjFVk3YkakHsyienX8VZgXDnYKsbtwph8bq3PgUWwFDhKmPIcP6NmG07p-oFgpltV8cjRP4Fw6qFaFlqUmUfK"
          />
        <span className="font-semibold text-primary">Mano</span>
    </aside>
  )
}

export default sidebar

