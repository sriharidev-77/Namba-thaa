import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  UserCog,
  BarChart3,
  LogOut,
  Menu,
  X,
  FileText,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'co_leader', 'employee'] },
    { name: 'Student Inquiries', href: '/inquiries', icon: FileText, roles: ['admin', 'co_leader', 'employee'] },
    { name: 'Employees', href: '/employees', icon: Users, roles: ['admin'] },
    { name: 'Co-Leaders', href: '/co-leaders', icon: UserCog, roles: ['admin'] },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['admin', 'co_leader'] },
  ];

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(profile?.role || '')
  );

  async function handleSignOut() {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm"
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <h1 className="text-xl font-heading font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                CMS Admission Platform
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
                <p className="text-xs text-gray-500 capitalize">{profile?.role.replace('_', ' ')}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex">
        <AnimatePresence>
          {(sidebarOpen || window.innerWidth >= 1024) && (
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed lg:sticky top-16 left-0 z-30 w-64 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 overflow-y-auto"
            >
              <nav className="p-4 space-y-1">
                {filteredNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                        isActive
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          )}
        </AnimatePresence>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
