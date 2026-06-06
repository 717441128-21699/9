import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout, IndexRedirect } from '@/components/layout/AppLayout';
import { Dashboard } from '@/pages/Dashboard';
import { TaskCenter } from '@/pages/TaskCenter';
import { DataUpload } from '@/pages/DataUpload';
import { Monitoring } from '@/pages/Monitoring';
import { Approval } from '@/pages/Approval';
import { Analysis } from '@/pages/Analysis';
import { Recommend } from '@/pages/Recommend';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<IndexRedirect />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks" element={<TaskCenter />} />
          <Route path="/upload" element={<DataUpload />} />
          <Route path="/monitoring" element={<Monitoring />} />
          <Route path="/approval" element={<Approval />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/recommend" element={<Recommend />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
