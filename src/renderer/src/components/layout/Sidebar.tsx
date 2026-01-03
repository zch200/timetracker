import { NavLink } from 'react-router-dom'

const navigation = [
  { name: '录入', path: '/' },
  { name: '分析', path: '/analysis' },
  { name: '设置', path: '/settings' },
]

export default function Sidebar() {
  return (
    <aside className="w-48 bg-white border-r border-gray-200">
      <div className="p-4">
        <h1 className="text-xl font-bold text-gray-900 mb-6">TimeTracker</h1>
        <nav className="space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `block px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  )
}

