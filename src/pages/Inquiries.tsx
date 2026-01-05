import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  User,
  Phone,
  Mail,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { supabase, Database } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { AddInquiryModal } from '../components/AddInquiryModal';
import { AssignInquiryModal } from '../components/AssignInquiryModal';
import { InquiryDetailsModal } from '../components/InquiryDetailsModal';

type Inquiry = Database['public']['Tables']['inquiries']['Row'] & {
  assigned_user?: { full_name: string } | null;
};

export function Inquiries() {
  const { profile } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [filteredInquiries, setFilteredInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'converted' | 'dropped'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  useEffect(() => {
    loadInquiries();
  }, [profile]);

  useEffect(() => {
    filterInquiries();
  }, [searchTerm, statusFilter, inquiries]);

  async function loadInquiries() {
    try {
      let query = supabase
        .from('inquiries')
        .select(`
          *,
          assigned_user:profiles!inquiries_assigned_to_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (profile?.role === 'employee') {
        query = query.eq('assigned_to', profile.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setInquiries(data || []);
    } catch (error) {
      console.error('Error loading inquiries:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterInquiries() {
    let filtered = inquiries;

    if (searchTerm) {
      filtered = filtered.filter(
        (inquiry) =>
          inquiry.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inquiry.contact_number.includes(searchTerm) ||
          inquiry.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inquiry.course_interested.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((inquiry) => inquiry.status === statusFilter);
    }

    setFilteredInquiries(filtered);
  }

  function getStatusBadge(status: string) {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      converted: 'bg-green-100 text-green-700 border-green-300',
      dropped: 'bg-red-100 text-red-700 border-red-300',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  }

  function handleInquiryClick(inquiry: Inquiry) {
    setSelectedInquiry(inquiry);
    setShowDetailsModal(true);
  }

  function handleAssignClick(inquiry: Inquiry) {
    setSelectedInquiry(inquiry);
    setShowAssignModal(true);
  }

  const canCreateInquiry = profile?.role === 'admin' || profile?.role === 'co_leader';
  const canAssignInquiry = profile?.role === 'admin' || profile?.role === 'co_leader';

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
          <h1 className="text-3xl font-heading font-bold text-gray-900">Student Inquiries</h1>
          <p className="text-gray-600 mt-2">{inquiries.length} total inquiries</p>
        </div>
        {canCreateInquiry && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition"
          >
            <Plus className="w-5 h-5" />
            Add New Inquiry
          </motion.button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, contact, email, or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition appearance-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="converted">Converted</option>
              <option value="dropped">Dropped</option>
            </select>
          </div>
        </div>
      </div>

      {filteredInquiries.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-100"
        >
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-heading font-semibold text-gray-900 mb-2">
            No inquiries yet
          </h3>
          <p className="text-gray-600">
            {canCreateInquiry
              ? 'Start by adding your first student inquiry.'
              : 'No inquiries have been assigned to you yet.'}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredInquiries.map((inquiry, index) => (
              <motion.div
                key={inquiry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleInquiryClick(inquiry)}
                className="bg-white rounded-xl shadow-md p-6 border border-gray-100 cursor-pointer hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-heading font-bold text-gray-900">
                    {inquiry.student_name}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                      inquiry.status
                    )}`}
                  >
                    {inquiry.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{inquiry.contact_number}</span>
                  </div>
                  {inquiry.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{inquiry.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <BookOpen className="w-4 h-4" />
                    <span>{inquiry.course_interested}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(inquiry.created_at), 'MMM d, yyyy')}</span>
                  </div>
                  {inquiry.assigned_user && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="w-4 h-4" />
                      <span>Assigned to: {inquiry.assigned_user.full_name}</span>
                    </div>
                  )}
                </div>

                {canAssignInquiry && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAssignClick(inquiry);
                    }}
                    className="mt-4 w-full py-2 px-4 bg-primary-50 text-primary-700 rounded-lg font-medium hover:bg-primary-100 transition"
                  >
                    {inquiry.assigned_to ? 'Reassign' : 'Assign to Counselor'}
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {showAddModal && (
        <AddInquiryModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadInquiries();
          }}
        />
      )}

      {showAssignModal && selectedInquiry && (
        <AssignInquiryModal
          inquiry={selectedInquiry}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedInquiry(null);
          }}
          onSuccess={() => {
            setShowAssignModal(false);
            setSelectedInquiry(null);
            loadInquiries();
          }}
        />
      )}

      {showDetailsModal && selectedInquiry && (
        <InquiryDetailsModal
          inquiry={selectedInquiry}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedInquiry(null);
          }}
          onUpdate={() => {
            loadInquiries();
          }}
        />
      )}
    </div>
  );
}
