import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ToastContainer } from './components/Toast';
import type { ToastMessage } from './components/Toast';
import { Dashboard } from './pages/Dashboard';
import { Vehicles } from './pages/Vehicles';
import { FuelRecords } from './pages/FuelRecords';
import { MileageAnalysis } from './pages/MileageAnalysis';
import { Reports } from './pages/Reports';
import { InvalidReadings } from './pages/InvalidReadings';
import { Settings } from './pages/Settings';
import type { Vehicle, DatabaseStatus } from './types';
import { api } from './services/api';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [invalidCount, setInvalidCount] = useState<number>(0);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isAddFuelModalOpen, setIsAddFuelModalOpen] = useState<boolean>(false);
  const [activeVehicleFilter, setActiveVehicleFilter] = useState<number | null>(null);

  // Toast notifier helper
  const showToast = (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load initial global data
  const loadFleetData = async () => {
    try {
      const [vList, status, invalids] = await Promise.all([
        api.getVehicles(),
        api.getDbStatus(),
        api.getInvalidReadings(),
      ]);
      setVehicles(vList);
      setDbStatus(status);
      setInvalidCount(invalids.count);
    } catch (err: any) {
      console.warn('Initial data load error:', err);
    }
  };

  useEffect(() => {
    loadFleetData();
  }, []);

  const handleNavigateTab = (tab: string, vehicleId?: number) => {
    if (vehicleId) {
      setActiveVehicleFilter(vehicleId);
    } else {
      setActiveVehicleFilter(null);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset database with clean sample demonstration fleet data?')) return;
    try {
      await api.resetDemoData();
      showToast('success', 'Demo Reset', 'Demonstration data loaded with 5 sample vehicles and multi-month records.');
      loadFleetData();
    } catch (err: any) {
      showToast('error', 'Reset Failed', err.message);
    }
  };

  const getPageMeta = () => {
    switch (currentTab) {
      case 'dashboard':
        return { title: 'Fleet Consumption Dashboard', subtitle: 'Overview of mileage, fuel expenses, and interactive metrics' };
      case 'vehicles':
        return { title: 'Vehicle Fleet Register', subtitle: 'Manage registered cars, bikes, trucks, and propulsion engines' };
      case 'fuel-records':
        return { title: 'Fuel Logs & Odometer Entries', subtitle: 'Consecutive odometer tracking, full-tank cycles, and partial refills' };
      case 'mileage-analysis':
        return { title: 'Mileage Analysis Engine', subtitle: 'Full-tank interval calculation verification and data breakdowns' };
      case 'reports':
        return { title: 'Reports & Export Center', subtitle: 'Printable summaries, monthly consumption trends, and CSV downloads' };
      case 'invalid-readings':
        return { title: 'Invalid Readings Audit', subtitle: 'Audit log of odometer rollbacks, duplicates, and corrective guidelines' };
      case 'settings':
        return { title: 'System Settings & MySQL Connection', subtitle: 'Configure MySQL server credentials, test connectivity, and inspect schema' };
      default:
        return { title: 'Fuel Consumption Analysis System', subtitle: 'Vehicle fuel management and analytics' };
    }
  };

  const meta = getPageMeta();

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 font-sans antialiased selection:bg-teal-500 selection:text-white">
      {/* Dark Navy Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={handleNavigateTab}
        invalidCount={invalidCount}
        dbStatus={dbStatus}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <Header
          title={meta.title}
          subtitle={meta.subtitle}
          setMobileOpen={setMobileOpen}
          onOpenAddRecord={() => setIsAddFuelModalOpen(true)}
          onResetDemo={handleResetDemo}
          dbStatus={dbStatus}
          onNavigateSettings={() => handleNavigateTab('settings')}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <Dashboard
              vehicles={vehicles}
              onNavigateTab={handleNavigateTab}
              dbStatus={dbStatus}
            />
          )}

          {currentTab === 'vehicles' && (
            <Vehicles
              vehicles={vehicles}
              onRefresh={loadFleetData}
              onShowToast={showToast}
              onNavigateTab={handleNavigateTab}
            />
          )}

          {currentTab === 'fuel-records' && (
            <FuelRecords
              vehicles={vehicles}
              initialVehicleFilter={activeVehicleFilter}
              onRefreshStats={loadFleetData}
              onShowToast={showToast}
              isAddModalOpen={isAddFuelModalOpen}
              setIsAddModalOpen={setIsAddFuelModalOpen}
            />
          )}

          {currentTab === 'mileage-analysis' && (
            <MileageAnalysis vehicles={vehicles} />
          )}

          {currentTab === 'reports' && (
            <Reports />
          )}

          {currentTab === 'invalid-readings' && (
            <InvalidReadings
              vehicles={vehicles}
              onRefreshStats={loadFleetData}
              onShowToast={showToast}
            />
          )}

          {currentTab === 'settings' && (
            <Settings
              dbStatus={dbStatus}
              onRefreshDbStatus={loadFleetData}
              onShowToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
