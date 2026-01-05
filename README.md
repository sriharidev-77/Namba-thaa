# CMS Student Admission Inquiry Platform

A modern, role-based CMS website for professional teaching academies to manage student admission inquiries efficiently.

## Features

### Authentication & Authorization
- Secure login system with role-based access control
- Three user roles: Admin, Co-Leader, and Employee
- Protected routes based on user permissions

### Role-Based Access

#### Admin (Super Admin)
- Full system access
- Create, assign, and remove employees and co-leaders
- Assign/reassign student inquiries
- Delete student inquiries
- View comprehensive dashboards, charts, and reports
- Manage all users and system settings

#### Co-Leader
- Assign/reassign student inquiries
- View dashboards and analytics
- Cannot create or remove co-leaders
- Cannot delete student inquiries

#### Employee
- View only assigned student inquiries
- Add/update inquiry details
- Add follow-up time and notes
- Upload voice recordings
- Cannot assign inquiries
- Cannot view analytics

### Student Inquiry Management
- Add student details (Name, Contact, Course, Email)
- Additional notes field for extra information
- Assign inquiries to employees or admins
- Track follow-up schedules
- Upload and manage voice recordings
- Status tracking: Pending, Converted, Dropped

### Dashboard & Analytics
- KPI cards showing:
  - Total Inquiries
  - Successful Conversions
  - Pending Follow-ups
  - Dropped Cases
- Monthly inquiry trends (Line Chart)
- Conversion performance analysis (Bar Chart)
- Status distribution (Pie Chart)
- Role-specific dashboard views

### User Management
- Employee Management (Admin only)
  - Add new employees
  - Activate/deactivate accounts
  - Remove employees
- Co-Leader Management (Admin only)
  - Add new co-leaders
  - Demote to employee role
  - Remove co-leaders

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: TailwindCSS v4
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Routing**: React Router v7
- **Icons**: Lucide React
- **Date Utilities**: date-fns

## Project Structure

```
src/
├── components/
│   ├── AddInquiryModal.tsx
│   ├── AddUserModal.tsx
│   ├── AssignInquiryModal.tsx
│   ├── InquiryDetailsModal.tsx
│   ├── Layout.tsx
│   └── ProtectedRoute.tsx
├── contexts/
│   └── AuthContext.tsx
├── lib/
│   └── supabase.ts
├── pages/
│   ├── Analytics.tsx
│   ├── CoLeaders.tsx
│   ├── Dashboard.tsx
│   ├── Employees.tsx
│   ├── Inquiries.tsx
│   └── Login.tsx
├── App.tsx
├── main.tsx
└── index.css
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### 1. Clone the Repository
```bash
git clone <repository-url>
cd cms-admission-platform
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Update the `.env` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup

The database schema includes:
- **profiles**: User profiles with role information
- **inquiries**: Student admission inquiries
- **follow_ups**: Follow-up records with notes and voice recordings

All tables have Row Level Security (RLS) enabled with appropriate policies.

### 5. Create First Admin User

After setting up Supabase:
1. Sign up through Supabase Dashboard Auth section
2. Insert a profile record in the profiles table:
```sql
INSERT INTO profiles (id, email, full_name, role, is_active)
VALUES (
  'your-user-id-from-auth-users',
  'admin@example.com',
  'Admin Name',
  'admin',
  true
);
```

### 6. Run Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 7. Build for Production
```bash
npm run build
```

## Usage Guide

### Login
1. Navigate to the login page
2. Enter your email and password
3. You'll be redirected to the dashboard based on your role

### Adding Student Inquiries (Admin/Co-Leader)
1. Go to "Student Inquiries" page
2. Click "Add New Inquiry"
3. Fill in student details
4. Submit the form

### Assigning Inquiries (Admin/Co-Leader)
1. Click on an inquiry card
2. Click "Assign to Counselor"
3. Select an employee or admin
4. Confirm assignment

### Adding Follow-ups (All Roles)
1. Click on an assigned inquiry
2. Click "Add Follow-up"
3. Set follow-up date/time
4. Add notes
5. Optionally upload voice recording
6. Submit

### Managing Users (Admin Only)
1. Navigate to "Employees" or "Co-Leaders"
2. Click "Add New Employee/Co-Leader"
3. Fill in user details
4. Manage status or remove users as needed

### Viewing Analytics (Admin/Co-Leader)
1. Navigate to "Analytics"
2. View KPI cards for quick insights
3. Analyze monthly trends and conversion rates
4. Review status distribution

## Security Features

- Row Level Security (RLS) on all tables
- Role-based access control (RBAC)
- Secure authentication with Supabase Auth
- Protected API endpoints
- Secure file upload to Supabase Storage
- Input validation on all forms

## Design Philosophy

- Modern, clean UI with gradient accents
- Responsive design (mobile and desktop)
- Smooth animations and transitions
- Intuitive navigation
- Clear visual hierarchy
- Accessibility considerations

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is private and proprietary.

## Support

For issues or questions, please contact the development team.