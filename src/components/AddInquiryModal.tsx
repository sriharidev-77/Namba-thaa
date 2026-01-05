import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AddInquiryModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddInquiryModal({ onClose, onSuccess }: AddInquiryModalProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    student_name: '',
    contact_number: '',
    email: '',
    course_interested: '',
    more_input: '',
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('inquiries').insert({
        ...formData,
        email: formData.email || null,
        more_input: formData.more_input || null,
        created_by: profile?.id,
        status: 'pending',
      });

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Error creating inquiry:', error);
      alert('Failed to create inquiry. Please try again.');
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
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-2xl font-heading font-bold text-gray-900">Add New Inquiry</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student Name *
            </label>
            <input
              type="text"
              required
              value={formData.student_name}
              onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              placeholder="Enter student's full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Number *
            </label>
            <input
              type="tel"
              required
              value={formData.contact_number}
              onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              placeholder="Enter contact number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              placeholder="Enter email address (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Interested *
            </label>
            <input
              type="text"
              required
              value={formData.course_interested}
              onChange={(e) => setFormData({ ...formData, course_interested: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              placeholder="e.g., Web Development, Data Science"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={formData.more_input}
              onChange={(e) => setFormData({ ...formData, more_input: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none"
              placeholder="Any additional information about the student or inquiry"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {loading ? 'Creating...' : 'Create Inquiry'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
