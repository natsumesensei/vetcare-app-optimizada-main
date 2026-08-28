import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, CalendarDays, Stethoscope, 
  Package, Scissors, Hospital, FlaskConical, 
  Settings, LogOut, Euro, Activity, Pill 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/vetnestor-logo.png';

const groups = [
  ['PRINCIPAL', [['/', 'Dashboard', LayoutDashboard], ['/patients', 'Pacientes', Users], ['/appointments', 'Agenda', CalendarDays]]],
  ['CLÍNICA', [['/consultations', 'Consultas', Stethoscope], ['/surgeries', 'Cirugías', Scissors], ['/hospitalizations', 'Hospitalización', Hospital], ['/anesthesia', 'Anestesia y monitorización', Activity], ['/reference-values', 'Laboratorio', FlaskConical], ['/inventory', 'Farmacia y stock', Package], ['/invoices', 'Facturación', Euro]]],
  ['GESTIÓN', [['/settings', 'Configuración', Settings]]]
];

export default function Sidebar({ onNavigate }) {
  const { logout } = useAuth();
  const loc = useLocation();

  return (
    <div className="sidebar-inner">
      <div className="brand">
        <img src={logo} alt="Vet Nestor" className="brand-logo" />
        <div>
          <strong>Vet <span>Nestor</span></strong>
          <small>Gestión Veterinaria</small>
        </div>
      </div>

      <div className="clinic-status">
        <span className="status-dot"/> Clínica operativa <span className="status-time">08:00–20:00</span>
      </div>

      <nav className="sidebar-nav">
        {groups.map(([title, links]) => (
          <div className="nav-group" key={title}>
            <div className="nav-title">{title}</div>
            {links.map(([to, label, Icon], i) => {
              const active = to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(to);
              return (
                <Link 
                  key={title + label + i} 
                  to={to} 
                  onClick={onNavigate} 
                  className={`nav-link ${active ? 'active' : ''}`}
                >
                  <Icon size={18}/>
                  <span>{label}</span>
                  {active && <i/>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="support-card">
          <div className="support-icon"><Pill size={15}/></div>
          <div>
            <strong>Centro clínico</strong>
            <small>Todo bajo control</small>
          </div>
        </div>
        <button type="button" onClick={logout} className="logout">
          <LogOut size={16}/> Cerrar sesión
        </button>
      </div>
    </div>
  );
}