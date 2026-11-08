/** Marginalia Lab design reminder: maintain the calm light-paper base and keep routing free of visual boilerplate. */
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

const Home = lazy(() => import("./pages/Home"));
const Flashcards = lazy(() => import("./pages/Flashcards"));
const FlashDocs = lazy(() => import("./pages/FlashDocs"));
const SystemDesignReader = lazy(() => import("./pages/SystemDesignReader"));
const EngineeringTerms = lazy(() => import("./pages/EngineeringTerms"));
const CollaborativeDocuments = lazy(() => import("./pages/CollaborativeDocuments"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));

function Router() {
  const FlashcardRoute = () => {
    const [location] = useLocation();
    const deckSlug = location.split("/")[2];
    return (
      <ProtectedRoute>
        <Suspense fallback={<LoadingSkeleton label="Opening study room" />}>
          <Flashcards deckSlug={deckSlug} />
        </Suspense>
      </ProtectedRoute>
    );
  };

  const SystemDesignRoute = () => {
    const [location] = useLocation();
    const parts = location.split("/").filter(Boolean);
    return (
      <ProtectedRoute>
        <Suspense fallback={<LoadingSkeleton kind="reader" label="Preparing Flash Docs" />}>
          <SystemDesignReader slug={parts[2]} view={parts[3]} />
        </Suspense>
      </ProtectedRoute>
    );
  };

  const ProtectedFlashDocs = () => (
    <ProtectedRoute>
      <Suspense fallback={<LoadingSkeleton label="Opening Explain Bytes library" />}>
        <FlashDocs />
      </Suspense>
    </ProtectedRoute>
  );

  const CollaborativeRoute = () => {
    const [location] = useLocation();
    const documentId = location.split("?")[0].split("/").filter(Boolean)[1];
    return (
      <ProtectedRoute>
        <Suspense fallback={<LoadingSkeleton label="Opening the collaborative study room" />}>
          <CollaborativeDocuments documentId={documentId} />
        </Suspense>
      </ProtectedRoute>
    );
  };

  return (
    <Switch>
      {/* Public routes */}
      <Route path={"/"} component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Login} />
      <Route path="/terms" component={EngineeringTerms} />
      <Route path="/engineering-terms" component={EngineeringTerms} />

      {/* Protected routes */}
      <Route path="/docs" component={ProtectedFlashDocs} />
      <Route path="/collaborate" component={CollaborativeRoute} />
      <Route path="/collaborate/:documentId" component={CollaborativeRoute} />
      <Route path="/docs/system-design" component={SystemDesignRoute} />
      <Route path="/docs/system-design/:slug" component={SystemDesignRoute} />
      <Route path="/docs/system-design/:slug/:view" component={SystemDesignRoute} />
      <Route path="/flashcards" component={FlashcardRoute} />
      <Route path="/flashcards/:deck" component={FlashcardRoute} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Suspense fallback={<LoadingSkeleton label="Opening Explain Bytes" />}>
            <Router />
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
