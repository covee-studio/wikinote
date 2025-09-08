import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "../../src/App";
import { ErrorBoundary } from "../../src/components/ErrorBoundary";
import { LikedArticlesProvider } from "../../src/contexts/LikedArticlesContext";
import { ToastProvider } from "../../src/contexts/ToastContext";
import "../../src/index.css";

const queryClient = new QueryClient();

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
	</StrictMode>,
);

