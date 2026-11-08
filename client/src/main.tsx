import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/wideReaderOverrides.css";
import { Auth0Provider } from "@auth0/auth0-react";
import "./styles/simulationThemeOverrides.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
    <QueryClientProvider client={queryClient}>
      <Auth0Provider
        domain="dev-d8ih378jwkgpumjx.us.auth0.com"
        clientId="IkTZkBbn93a4e7J95FwKXhF3pp6i49h7"
        authorizationParams={{
          redirect_uri: typeof window !== "undefined" ? window.location.origin : undefined,
        }}
      >
        <App />
      </Auth0Provider>
    </QueryClientProvider>
)
