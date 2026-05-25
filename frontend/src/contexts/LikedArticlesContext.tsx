import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { WikiArticle } from "../types/ArticleProps";
import { Heart } from "lucide-react";
import { StorageAdapter } from "../utils/environment";
import { LikedArticlesContext } from "./likedArticles";
import '../assets/heartAnimation.css';

export function LikedArticlesProvider({ children }: { children: ReactNode }) {
    const [likedArticles, setLikedArticles] = useState<WikiArticle[]>([]);
    const [showHeart, setShowHeart] = useState(false);

    // Initialize liked articles from storage on mount
    useEffect(() => {
        StorageAdapter.get<WikiArticle[]>("likedArticles").then((saved) => {
            if (Array.isArray(saved)) {
                setLikedArticles(saved as WikiArticle[]);
            }
        });
    }, []);

    // Persist liked articles whenever it changes
    useEffect(() => {
        StorageAdapter.set("likedArticles", likedArticles);
    }, [likedArticles]);

    const toggleLike = (article: WikiArticle) => {
        setLikedArticles((prev) => {
            const alreadyLiked = prev.some((a) => a.pageid === article.pageid);
            if (alreadyLiked) {
                return prev.filter((a) => a.pageid !== article.pageid);
            } else {
                setShowHeart(true);
                setTimeout(() => setShowHeart(false), 800);
                return [...prev, article];
            }
        });
    };

    const isLiked = (pageid: number) => {
        return likedArticles.some((article) => article.pageid === pageid);
    };

    return (
        <LikedArticlesContext.Provider value={{ likedArticles, toggleLike, isLiked }}>
            {children}
            {showHeart && (
                <div className="heart-animation">
                    <Heart size={200} strokeWidth={0} className="fill-white"/>
                </div>
            )}
        </LikedArticlesContext.Provider>
    );
}


