import { NavLink } from 'react-router-dom'
import './NavBar.css'

const items = [
  { to: '/', label: 'ホーム', icon: '🏠' },
  { to: '/record', label: '記録', icon: '🎥' },
  { to: '/history', label: '履歴', icon: '📋' },
  { to: '/knowledge', label: 'ナレッジ', icon: '📚' },
  { to: '/rounds', label: 'スコア', icon: '⛳' },
  { to: '/settings', label: '設定', icon: '⚙️' },
]

export default function NavBar() {
  return (
    <nav className="nav-bar">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
