import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, UserCheck } from 'lucide-react';
import { supabase, Database } from '../lib/supabase';
import { format } from 'date-fns';
import { AddUserModal } from '../components/AddUserModal';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function Employees() {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [searchTerm, employees]);

  async function loadEmployees() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'employee')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterEmployees() {
    if (!searchTerm) {
      setFilteredEmployees(employees);
      return;
    }

    const filtered = employees.filter(
      (employee) =>
        employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmployees(filtered);
  }

  async function toggleActiveStatus(employee: Profile) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !employee.is_active })
        .eq('id', employee.id);

      if (error) throw error;
      loadEmployees();
    } catch (error) {
      console.error('Error updating employee status:', error);
      alert('Failed to update employee status. Please try again.');
    }
  }

  async function handleRemoveEmployee(employee: Profile) {
    if (!window.confirm(`Are you sure you want to remove ${employee.full_name}?`)) {
      return;
    }

    try {
      const { error } = await supabase.auth.admin.deleteUser(employee.id);

      if (error) throw error;
      loadEmployees();
    } catch (error) {
      console.error('Error removing employee:', error);
      alert('Failed to remove employee. Please try again.');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-600 mt-2">{employees.length} employees</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition"
        >
          <Plus className="w-5 h-5" />
          Add New Employee
        </motion.button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
          />
        </div>
      </div>

      {filteredEmployees.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-100"
        >
          <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-heading font-semibold text-gray-900 mb-2">No employees found</h3>
          <p className="text-gray-600">Start by adding your first employee.</p>
        </motion.div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <AnimatePresence>
                  {filteredEmployees.map((employee, index) => (
                    <motion.tr
                      key={employee.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{employee.full_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-600">{employee.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            employee.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {employee.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {format(new Date(employee.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleActiveStatus(employee)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                              employee.is_active
                                ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                                : 'bg-green-50 text-green-700 hover:bg-green-100'
                            }`}
                          >
                            {employee.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleRemoveEmployee(employee)}
                            className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddUserModal
          role="employee"
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadEmployees();
          }}
        />
      )}
    </div>
  );
}
