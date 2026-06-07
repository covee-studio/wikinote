import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App.tsx"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { LikedArticlesProvider } from "./contexts/LikedArticlesContext"
import { SourcesProvider } from "./contexts/SourcesContext"
import { ToastProvider } from "./contexts/ToastContext"
import "./index.css"

const queryClient = new QueryClient()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <SourcesProvider>
          <LikedArticlesProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </LikedArticlesProvider>
        </SourcesProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>
)
