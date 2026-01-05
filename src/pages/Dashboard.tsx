import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

interface KPIData {
  total: number;
  converted: number;
  dropped: number;
  pending: number;
}

interface MonthlyData {
  month: string;
  inquiries: number;
  converted: number;
}

export function Dashboard() {
  const { profile } = useAuth();
  const [kpiData, setKpiData] = useState<KPIData>({
    total: 0,
    converted: 0,
    dropped: 0,
    pending: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [profile]);

  async function loadDashboardData() {
    try {
      let query = supabase.from('inquiries').select('*', { count: 'exact' });

      if (profile?.role === 'employee') {
        query = query.eq('assigned_to', profile.id);
      }

      const { data: inquiries, error } = await query;

      if (error) throw error;

      const total = inquiries?.length || 0;
      const converted = inquiries?.filter((i) => i.status === 'converted').length || 0;
      const dropped = inquiries?.filter((i) => i.status === 'dropped').length || 0;
      const pending = inquiries?.filter((i) => i.status === 'pending').length || 0;

      setKpiData({ total, converted, dropped, pending });

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
        };
      });

      setMonthlyData(monthlyStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  const kpiCards = [
    {
      title: 'Total Inquiries',
      value: kpiData.total,
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Successful Conversions',
      value: kpiData.converted,
      icon: CheckCircle,
      gradient: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Pending Follow-ups',
      value: kpiData.pending,
      icon: Clock,
      gradient: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
    {
      title: 'Dropped Cases',
      value: kpiData.dropped,
      icon: XCircle,
      gradient: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
    },
  ];

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
        <h1 className="text-3xl font-heading font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {profile?.full_name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.2, type: 'spring' }}
                  className="text-3xl font-bold text-gray-900 mt-2"
                >
                  {card.value}
                </motion.p>
              </div>
              <div className={`p-3 rounded-xl ${card.bgColor}`}>
                <card.icon className={`w-8 h-8 ${card.textColor}`} />
              </div>
            </div>
            <div className={`mt-4 h-1 rounded-full bg-gradient-to-r ${card.gradient}`}></div>
          </motion.div>
        ))}
      </div>

      {(profile?.role === 'admin' || profile?.role === 'co_leader') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
          >
            <h2 className="text-xl font-heading font-bold text-gray-900 mb-6">
              Monthly Inquiry Trends
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
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  dot={{ fill: '#0ea5e9', r: 5 }}
                  activeDot={{ r: 8 }}
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
              Conversion Performance
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="inquiries" fill="#0ea5e9" name="Total Inquiries" />
                <Bar dataKey="converted" fill="#10b981" name="Converted" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {profile?.role === 'employee' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-lg p-8 text-white"
        >
          <div className="flex items-center gap-4">
            <TrendingUp className="w-12 h-12" />
            <div>
              <h2 className="text-2xl font-heading font-bold">Your Performance</h2>
              <p className="text-primary-100 mt-1">
                You have {kpiData.pending} pending follow-ups and {kpiData.converted} successful
                conversions
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
