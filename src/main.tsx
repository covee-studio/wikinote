import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App.js"
import { ErrorBoundary } from "./components/ErrorBoundary.js"
import { LikedArticlesProvider } from "./contexts/LikedArticlesContext.js"
import { ToastProvider } from "./contexts/ToastContext.js"
import "./index.css"

const queryClient = new QueryClient()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <LikedArticlesProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </LikedArticlesProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>
)
