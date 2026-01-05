import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Shield } from 'lucide-react';
import { supabase, Database } from '../lib/supabase';
import { format } from 'date-fns';
import { AddUserModal } from '../components/AddUserModal';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function CoLeaders() {
  const [coLeaders, setCoLeaders] = useState<Profile[]>([]);
  const [filteredCoLeaders, setFilteredCoLeaders] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadCoLeaders();
  }, []);

  useEffect(() => {
    filterCoLeaders();
  }, [searchTerm, coLeaders]);

  async function loadCoLeaders() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'co_leader')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoLeaders(data || []);
    } catch (error) {
      console.error('Error loading co-leaders:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterCoLeaders() {
    if (!searchTerm) {
      setFilteredCoLeaders(coLeaders);
      return;
    }

    const filtered = coLeaders.filter(
      (coLeader) =>
        coLeader.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coLeader.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCoLeaders(filtered);
  }

  async function handleDemoteToEmployee(coLeader: Profile) {
    if (!window.confirm(`Are you sure you want to demote ${coLeader.full_name} to employee?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'employee' })
        .eq('id', coLeader.id);

      if (error) throw error;
      loadCoLeaders();
    } catch (error) {
      console.error('Error demoting co-leader:', error);
      alert('Failed to demote co-leader. Please try again.');
    }
  }

  async function handleRemoveCoLeader(coLeader: Profile) {
    if (!window.confirm(`Are you sure you want to remove ${coLeader.full_name}?`)) {
      return;
    }

    try {
      const { error } = await supabase.auth.admin.deleteUser(coLeader.id);

      if (error) throw error;
      loadCoLeaders();
    } catch (error) {
      console.error('Error removing co-leader:', error);
      alert('Failed to remove co-leader. Please try again.');
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
          <h1 className="text-3xl font-heading font-bold text-gray-900">Co-Leader Management</h1>
          <p className="text-gray-600 mt-2">{coLeaders.length} co-leaders</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition"
        >
          <Plus className="w-5 h-5" />
          Add New Co-Leader
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

      {filteredCoLeaders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-100"
        >
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-heading font-semibold text-gray-900 mb-2">No co-leaders found</h3>
          <p className="text-gray-600">Start by adding your first co-leader.</p>
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
                  {filteredCoLeaders.map((coLeader, index) => (
                    <motion.tr
                      key={coLeader.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-primary-600" />
                          <div className="font-medium text-gray-900">{coLeader.full_name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-600">{coLeader.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            coLeader.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {coLeader.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {format(new Date(coLeader.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDemoteToEmployee(coLeader)}
                            className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-100 transition"
                          >
                            Demote to Employee
                          </button>
                          <button
                            onClick={() => handleRemoveCoLeader(coLeader)}
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
          role="co_leader"
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadCoLeaders();
          }}
        />
      )}
    </div>
  );
}
