import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: 'admin' | 'co_leader' | 'employee';
          created_by: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      inquiries: {
        Row: {
          id: string;
          student_name: string;
          contact_number: string;
          email: string | null;
          course_interested: string;
          more_input: string | null;
          status: 'pending' | 'converted' | 'dropped';
          assigned_to: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['inquiries']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['inquiries']['Insert']>;
      };
      follow_ups: {
        Row: {
          id: string;
          inquiry_id: string;
          notes: string;
          follow_up_date: string;
          voice_recording_url: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['follow_ups']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['follow_ups']['Insert']>;
      };
    };
  };
};
