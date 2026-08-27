/** Marginalia Lab design reminder: maintain the calm light-paper base and keep routing free of visual boilerplate. */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Flashcards from "./pages/Flashcards";

function Router() {
  const FlashcardRoute = () => {
    const [location] = useLocation();
    const deckSlug = location.split("/")[2];
    return <Flashcards deckSlug={deckSlug} />;
  };
  return (
    <Switch>
      <Route path={"/"} component={Home} />
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
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
