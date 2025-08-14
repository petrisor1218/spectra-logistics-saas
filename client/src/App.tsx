import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { ThemeProvider } from "./components/ThemeProvider";

// Pages
import Home from "./pages/home";
import Login from "./pages/login";
import TenantLogin from "./pages/tenant-login";
import TenantRegistration from "./pages/tenant-registration";
import AdminDashboard from "./pages/admin-dashboard";
import NotFound from "./pages/not-found";

// Tenant pages (accesibile doar prin subdomain)
import Dashboard from "./pages/dashboard";
import Companies from "./pages/companies";
import Drivers from "./pages/drivers";
import Payments from "./pages/payments";
import TransportOrders from "./pages/transport-orders";
import Analytics from "./pages/analytics";
import Settings from "./pages/settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  // Detectează dacă suntem pe un subdomain (tenant)
  const hostname = window.location.hostname;
  const isSubdomain = hostname.split('.').length > 2 || hostname !== 'localhost';
  const isAdminDomain = hostname.startsWith('admin.') || hostname === 'localhost';

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <div className="min-h-screen bg-background">
          <Switch>
            {/* Public routes (accessible from main domain) */}
            <Route path="/" component={Home} />
            <Route path="/login" component={Login} />
            <Route path="/register" component={TenantRegistration} />
            
            {/* Admin routes (accessible from admin subdomain or localhost) */}
            {isAdminDomain && (
              <>
                <Route path="/admin" component={AdminDashboard} />
                <Route path="/admin/dashboard" component={AdminDashboard} />
              </>
            )}
            
            {/* Tenant routes (accessible from tenant subdomains) */}
            {isSubdomain && !isAdminDomain && (
              <>
                <Route path="/" component={Dashboard} />
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/companies" component={Companies} />
                <Route path="/drivers" component={Drivers} />
                <Route path="/payments" component={Payments} />
                <Route path="/transport-orders" component={TransportOrders} />
                <Route path="/analytics" component={Analytics} />
                <Route path="/settings" component={Settings} />
              </>
            )}
            
            {/* Fallback */}
            <Route component={NotFound} />
          </Switch>
        </div>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
