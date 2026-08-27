/** Marginalia Lab design reminder: maintain the calm light-paper base and keep routing free of visual boilerplate. */
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

const Home = lazy(() => import("./pages/Home"));
const Flashcards = lazy(() => import("./pages/Flashcards"));
const FlashDocs = lazy(() => import("./pages/FlashDocs"));
const SystemDesignReader = lazy(() => import("./pages/SystemDesignReader"));
const NotFound = lazy(() => import("./pages/NotFound"));

function Router() {
  const FlashcardRoute = () => {
    const [location] = useLocation();
    const deckSlug = location.split("/")[2];
    return <Suspense fallback={<LoadingSkeleton label="Opening study room" />}><Flashcards deckSlug={deckSlug} /></Suspense>;
  };
  const SystemDesignRoute = () => {
    const [location] = useLocation();
    const parts = location.split("/").filter(Boolean);
    return <Suspense fallback={<LoadingSkeleton kind="reader" label="Preparing Flash Docs" />}><SystemDesignReader slug={parts[2]} view={parts[3]} /></Suspense>;
  };
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/docs" component={FlashDocs} />
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
          <Suspense fallback={<LoadingSkeleton label="Opening Explain Bytes" />}><Router /></Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
