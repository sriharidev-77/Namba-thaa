import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, UserCheck } from 'lucide-react';
import { supabase, Database } from '../lib/supabase';

type Inquiry = Database['public']['Tables']['inquiries']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface AssignInquiryModalProps {
  inquiry: Inquiry;
  onClose: () => void;
  onSuccess: () => void;
}

export function AssignInquiryModal({ inquiry, onClose, onSuccess }: AssignInquiryModalProps) {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>(inquiry.assigned_to || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadEmployees() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  }

  async function handleAssign() {
    if (!selectedEmployee) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('inquiries')
        .update({ assigned_to: selectedEmployee })
        .eq('id', inquiry.id);

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Error assigning inquiry:', error);
      alert('Failed to assign inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full"
      >
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-heading font-bold text-gray-900">Assign Inquiry</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Assign inquiry for <span className="font-semibold">{inquiry.student_name}</span> to a
              counselor
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Counselor *
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            >
              <option value="">-- Select a counselor --</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name} ({employee.role.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={loading || !selectedEmployee}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <UserCheck className="w-5 h-5" />
              {loading ? 'Assigning...' : 'Assign Inquiry'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
