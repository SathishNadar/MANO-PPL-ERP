import React from 'react'
import Sidebar from '../../SidebarComponent/sidebar'
function home() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar/>
      <div>Home</div>
    </div>
  )
}

export default home