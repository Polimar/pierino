import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  MessageSquare, 
  Mail, 
  Calendar, 
  FolderOpen, 
  Bot, 
  Settings,
  Building2,
  UserCog,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/store/authStore';
import { useSettings } from '@/hooks/useSettings';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, current: false },
  { name: 'Clienti', href: '/clients', icon: Users, current: false },
  { name: 'Pratiche', href: '/practices', icon: FileText, current: false },
  { name: 'WhatsApp', href: '/whatsapp', icon: MessageSquare, current: false },
  { name: 'Email', href: '/email', icon: Mail, current: false },
  { name: 'Calendario', href: '/calendar', icon: Calendar, current: false },
  { name: 'Documenti', href: '/documents', icon: FolderOpen, current: false },
  { name: 'AI Assistant Pro', href: '/ai-assistant-pro', icon: Bot, current: false },
];

const secondaryNavigation = [
  { name: 'Utenti', href: '/users', icon: UserCog },
  { name: 'Impostazioni', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuthStore();
  const { settings } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6 pb-4">
      <div className="flex h-16 shrink-0 items-center justify-between">
        <div className="flex items-center">
          <Building2 className="h-8 w-8 text-blue-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">
            {settings?.general?.companyName || 'Studio Gori'}
          </span>
        </div>
        {/* Close button for mobile */}
        <button
          type="button"
          className="lg:hidden rounded-md p-2 text-gray-700 hover:bg-gray-100"
          onClick={() => setMobileMenuOpen(false)}
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col">
        <ul className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={cn(
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      )}
                      onClick={() => setMobileMenuOpen(false)} // Close menu on mobile when link is clicked
                    >
                      <item.icon
                        className={cn(
                          'h-6 w-6 shrink-0',
                          isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>

          <li className="mt-auto">
            <ul className="-mx-2 space-y-1">
              {secondaryNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={cn(
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      )}
                      onClick={() => setMobileMenuOpen(false)} // Close menu on mobile when link is clicked
                    >
                      <item.icon
                        className={cn(
                          'h-6 w-6 shrink-0',
                          isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* User info */}
            <div className="mt-6 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user?.email
                    }
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.role === 'ADMIN' && 'Amministratore'}
                    {user?.role === 'GEOMETRA' && 'Geometra'}
                    {user?.role === 'SECRETARY' && 'Segreteria'}
                  </p>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden">
        <button
          type="button"
          className="fixed top-4 left-4 z-50 inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-700 shadow-md hover:bg-gray-100 hover:text-gray-900"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <SidebarContent />
      </div>

      {/* Mobile sidebar */}
      {mobileMenuOpen && (
        <>
          {/* Background overlay */}
          <div
            className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Mobile sidebar panel */}
          <div className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden">
            <SidebarContent />
          </div>
        </>
      )}
    </>
  );
}