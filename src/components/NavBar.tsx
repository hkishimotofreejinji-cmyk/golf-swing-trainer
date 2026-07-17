import { NavLink } from 'react-router-dom'
import { IconHome, IconRecord, IconHistory, IconKnowledge, IconRounds, IconSettings } from './icons'
import './NavBar.css'

const items = [
  { to: '/', label: 'ホーム', Icon: IconHome },
  { to: '/record', label: '記録', Icon: IconRecord },
  { to: '/history', label: '履歴', Icon: IconHistory },
  { to: '/knowledge', label: 'ナレッジ', Icon: IconKnowledge },
  { to: '/rounds', label: 'スコア', Icon: IconRounds },
  { to: '/settings', label: '設定', Icon: IconSettings },
]

export default function NavBar() {
  return (
    <nav className="nav-bar">
      {items.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <Icon className="nav-icon" />
          <span className="nav-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
