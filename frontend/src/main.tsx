import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { StrictMode } from "react"
import { MotionConfig } from "motion/react"
import { createRoot } from "react-dom/client"
import { inject } from "@vercel/analytics"
import App from "./App.tsx"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { LikedArticlesProvider } from "./contexts/LikedArticlesContext"
import { SourcesProvider } from "./contexts/SourcesContext"
import { ToastProvider } from "./contexts/ToastContext"
import "./index.css"

if (!__IS_EXTENSION__) {
  inject({ mode: "auto" })
}

const queryClient = new QueryClient()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <SourcesProvider>
          <LikedArticlesProvider>
            <ToastProvider>
              <MotionConfig reducedMotion="user"><App /></MotionConfig>
            </ToastProvider>
          </LikedArticlesProvider>
        </SourcesProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>
)
