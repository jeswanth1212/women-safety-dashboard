import { Bell, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="px-4 mx-auto">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-800">Security Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-500 hover:text-gray-600">
              <Bell className="w-6 h-6" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-600">
              <Settings className="w-6 h-6" />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-gray-600"
              title="Logout"
            >
              <LogOut className="w-6 h-6" />
            </button>
            <div className="flex items-center">
              <img
                className="w-8 h-8 rounded-full"
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt="User avatar"
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;