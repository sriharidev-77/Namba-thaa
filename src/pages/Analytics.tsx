import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, Users, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

interface MonthlyData {
  month: string;
  inquiries: number;
  converted: number;
  dropped: number;
  pending: number;
}

interface StatusData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

export function Analytics() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [conversionRate, setConversionRate] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      const { data: inquiries, error } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const last6Months = eachMonthOfInterval({
        start: subMonths(new Date(), 5),
        end: new Date(),
      });

      const monthlyStats = last6Months.map((monthDate) => {
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const monthInquiries = inquiries?.filter((i) => {
          const createdAt = new Date(i.created_at);
          return createdAt >= monthStart && createdAt <= monthEnd;
        });

        return {
          month: format(monthDate, 'MMM yyyy'),
          inquiries: monthInquiries?.length || 0,
          converted: monthInquiries?.filter((i) => i.status === 'converted').length || 0,
          dropped: monthInquiries?.filter((i) => i.status === 'dropped').length || 0,
          pending: monthInquiries?.filter((i) => i.status === 'pending').length || 0,
        };
      });

      setMonthlyData(monthlyStats);

      const totalInquiries = inquiries?.length || 0;
      const converted = inquiries?.filter((i) => i.status === 'converted').length || 0;
      const dropped = inquiries?.filter((i) => i.status === 'dropped').length || 0;
      const pending = inquiries?.filter((i) => i.status === 'pending').length || 0;

      setStatusData([
        { name: 'Converted', value: converted, color: '#10b981' },
        { name: 'Pending', value: pending, color: '#f59e0b' },
        { name: 'Dropped', value: dropped, color: '#ef4444' },
      ]);

      const rate = totalInquiries > 0 ? (converted / totalInquiries) * 100 : 0;
      setConversionRate(rate);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-gray-900">Analytics & Reports</h1>
        <p className="text-gray-600 mt-2">Comprehensive insights into your inquiry performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <Users className="w-10 h-10 opacity-80" />
            <span className="text-3xl font-bold">
              {monthlyData.reduce((sum, m) => sum + m.inquiries, 0)}
            </span>
          </div>
          <p className="text-blue-100">Total Inquiries (6 Months)</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-10 h-10 opacity-80" />
            <span className="text-3xl font-bold">
              {monthlyData.reduce((sum, m) => sum + m.converted, 0)}
            </span>
          </div>
          <p className="text-green-100">Successful Conversions</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-10 h-10 opacity-80" />
            <span className="text-3xl font-bold">{conversionRate.toFixed(1)}%</span>
          </div>
          <p className="text-yellow-100">Conversion Rate</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <XCircle className="w-10 h-10 opacity-80" />
            <span className="text-3xl font-bold">
              {monthlyData.reduce((sum, m) => sum + m.dropped, 0)}
            </span>
          </div>
          <p className="text-red-100">Dropped Cases</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
        >
          <h2 className="text-xl font-heading font-bold text-gray-900 mb-6">
            6-Month Inquiry Trends
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="inquiries"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 5 }}
                name="Total Inquiries"
              />
              <Line
                type="monotone"
                dataKey="converted"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 5 }}
                name="Converted"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
        >
          <h2 className="text-xl font-heading font-bold text-gray-900 mb-6">
            Status Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-md p-6 border border-gray-100 lg:col-span-2"
        >
          <h2 className="text-xl font-heading font-bold text-gray-900 mb-6">
            Monthly Performance Breakdown
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="inquiries" fill="#3b82f6" name="Total Inquiries" />
              <Bar dataKey="converted" fill="#10b981" name="Converted" />
              <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
              <Bar dataKey="dropped" fill="#ef4444" name="Dropped" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
