import { createContext, useContext } from "react";
import type { LikedArticlesContextType } from "../types/ArticleProps";

export const LikedArticlesContext = createContext<LikedArticlesContextType | undefined>(undefined);

export function useLikedArticles() {
    const context = useContext(LikedArticlesContext);
    if (!context) {
        throw new Error("useLikedArticles must be used within a LikedArticlesProvider");
    }
    return context;
}
