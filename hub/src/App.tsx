import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import PhaseDetailPage from "./pages/PhaseDetailPage";
import PhasesPage from "./pages/PhasesPage";
import TasksPage from "./pages/TasksPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="phases" element={<PhasesPage />} />
        <Route path="phases/:phaseId" element={<PhaseDetailPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
