import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useAuth } from "./hooks/useAuth";
import Home from "@/pages/home";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";
import Pricing from "@/pages/pricing";
import Subscribe from "@/pages/subscribe";
import SubscriptionSuccess from "@/pages/subscription-success";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminTenants from "@/pages/AdminTenants";
import Analytics from "@/pages/analytics";
import Backup from "@/pages/backup";
import TenantManagement from "@/pages/tenant-management";
import TenantLogin from "@/pages/tenant-login";
import TenantRegistration from "@/pages/tenant-registration";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300">Se încarcă...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/tenants" component={AdminTenants} />
        <Route path="/tenant-login" component={TenantLogin} />
        <Route path="/register-tenant" component={TenantRegistration} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/subscribe/:planId" component={Subscribe} />
        <Route path="/subscription-success" component={SubscriptionSuccess} />
        <Route path="/login" component={LoginPage} />
        <Route path="/" component={Home} />
        <Route path="*" component={Home} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/tenants" component={AdminTenants} />
      <Route path="/tenants" component={TenantManagement} />
      <Route path="/tenant-login" component={TenantLogin} />
      <Route path="/tenant/:tenantId/dashboard" component={Home} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/backup" component={Backup} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/subscribe/:planId" component={Subscribe} />
      <Route path="/subscription-success" component={SubscriptionSuccess} />
      <Route path="/login" component={LoginPage} />
      <Route path="*" component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
