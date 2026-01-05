import { useEffect, useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Mic, Calendar, MessageSquare, User, Phone, Mail, BookOpen, Trash2 } from 'lucide-react';
import { supabase, Database } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

type Inquiry = Database['public']['Tables']['inquiries']['Row'];
type FollowUp = Database['public']['Tables']['follow_ups']['Row'] & {
  creator?: { full_name: string } | null;
};

interface InquiryDetailsModalProps {
  inquiry: Inquiry;
  onClose: () => void;
  onUpdate: () => void;
}

export function InquiryDetailsModal({ inquiry, onClose, onUpdate }: InquiryDetailsModalProps) {
  const { profile } = useAuth();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddFollowUp, setShowAddFollowUp] = useState(false);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const [followUpData, setFollowUpData] = useState({
    notes: '',
    follow_up_date: '',
    voice_file: null as File | null,
  });
  const [updatedStatus, setUpdatedStatus] = useState(inquiry.status);
  const [updatedMoreInput, setUpdatedMoreInput] = useState(inquiry.more_input || '');

  useEffect(() => {
    loadFollowUps();
  }, [inquiry.id]);

  async function loadFollowUps() {
    try {
      const { data, error } = await supabase
        .from('follow_ups')
        .select(`
          *,
          creator:profiles!follow_ups_created_by_fkey(full_name)
        `)
        .eq('inquiry_id', inquiry.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFollowUps(data || []);
    } catch (error) {
      console.error('Error loading follow-ups:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddFollowUp(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      let voiceUrl = null;

      if (followUpData.voice_file) {
        setUploadingVoice(true);
        const fileExt = followUpData.voice_file.name.split('.').pop();
        const fileName = `${inquiry.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('voice-recordings')
          .upload(fileName, followUpData.voice_file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('voice-recordings')
          .getPublicUrl(fileName);

        voiceUrl = publicUrl;
        setUploadingVoice(false);
      }

      const { error } = await supabase.from('follow_ups').insert({
        inquiry_id: inquiry.id,
        notes: followUpData.notes,
        follow_up_date: followUpData.follow_up_date,
        voice_recording_url: voiceUrl,
        created_by: profile?.id,
      });

      if (error) throw error;

      setFollowUpData({ notes: '', follow_up_date: '', voice_file: null });
      setShowAddFollowUp(false);
      loadFollowUps();
      onUpdate();
    } catch (error) {
      console.error('Error adding follow-up:', error);
      alert('Failed to add follow-up. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateInquiry() {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('inquiries')
        .update({
          status: updatedStatus,
          more_input: updatedMoreInput || null,
        })
        .eq('id', inquiry.id);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error updating inquiry:', error);
      alert('Failed to update inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteInquiry() {
    if (!window.confirm('Are you sure you want to delete this inquiry? This action cannot be undone.')) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('inquiries')
        .delete()
        .eq('id', inquiry.id);

      if (error) throw error;
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error deleting inquiry:', error);
      alert('Failed to delete inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const canEdit = profile?.role === 'admin' || profile?.role === 'co_leader' || inquiry.assigned_to === profile?.id;
  const canDelete = profile?.role === 'admin';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-2xl font-heading font-bold text-gray-900">Inquiry Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="bg-gray-50 rounded-xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-600 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Student Name</p>
                <p className="text-lg font-semibold text-gray-900">{inquiry.student_name}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Contact Number</p>
                  <p className="font-semibold text-gray-900">{inquiry.contact_number}</p>
                </div>
              </div>

              {inquiry.email && (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900">{inquiry.email}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-gray-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Course Interested</p>
                  <p className="font-semibold text-gray-900">{inquiry.course_interested}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Created On</p>
                  <p className="font-semibold text-gray-900">
                    {format(new Date(inquiry.created_at), 'PPp')}
                  </p>
                </div>
              </div>
            </div>

            {canEdit && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={updatedStatus}
                    onChange={(e) => setUpdatedStatus(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  >
                    <option value="pending">Pending</option>
                    <option value="converted">Converted</option>
                    <option value="dropped">Dropped</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={updatedMoreInput}
                    onChange={(e) => setUpdatedMoreInput(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none"
                    placeholder="Add any additional notes about this inquiry..."
                  />
                </div>

                <button
                  onClick={handleUpdateInquiry}
                  disabled={loading}
                  className="w-full py-2 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Inquiry'}
                </button>
              </>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-heading font-bold text-gray-900">Follow-ups</h3>
              {canEdit && (
                <button
                  onClick={() => setShowAddFollowUp(!showAddFollowUp)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Follow-up
                </button>
              )}
            </div>

            {showAddFollowUp && canEdit && (
              <form onSubmit={handleAddFollowUp} className="bg-gray-50 rounded-xl p-4 mb-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Follow-up Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={followUpData.follow_up_date}
                    onChange={(e) => setFollowUpData({ ...followUpData, follow_up_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes *
                  </label>
                  <textarea
                    required
                    value={followUpData.notes}
                    onChange={(e) => setFollowUpData({ ...followUpData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none"
                    placeholder="Enter follow-up notes..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voice Recording
                  </label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setFollowUpData({ ...followUpData, voice_file: e.target.files?.[0] || null })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  />
                  {uploadingVoice && <p className="text-sm text-primary-600 mt-2">Uploading voice recording...</p>}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddFollowUp(false);
                      setFollowUpData({ notes: '', follow_up_date: '', voice_file: null });
                    }}
                    className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Follow-up'}
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {followUps.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No follow-ups yet</p>
                </div>
              ) : (
                followUps.map((followUp) => (
                  <div key={followUp.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(followUp.follow_up_date), 'PPp')}</span>
                      </div>
                      {followUp.creator && (
                        <span className="text-sm text-gray-600">by {followUp.creator.full_name}</span>
                      )}
                    </div>
                    <p className="text-gray-900 mb-2">{followUp.notes}</p>
                    {followUp.voice_recording_url && (
                      <div className="flex items-center gap-2 mt-2">
                        <Mic className="w-4 h-4 text-primary-600" />
                        <audio controls className="flex-1">
                          <source src={followUp.voice_recording_url} />
                        </audio>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {canDelete && (
          <div className="border-t border-gray-200 px-6 py-4">
            <button
              onClick={handleDeleteInquiry}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete Inquiry
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
