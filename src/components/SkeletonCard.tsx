import { useEffect, useState } from "react"

export function SkeletonCard() {
  return (
    <div className="wiki-card">
      {/* Image skeleton */}
      <div className="wiki-card-image bg-gradient-to-br from-gray-50 to-gray-100 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
      </div>

      {/* Content skeleton */}
      <div className="wiki-card-content">
        {/* Title skeleton */}
        <div className="space-y-2 mb-4">
          <div className="h-5 bg-gray-50 rounded animate-pulse"></div>
          <div className="h-5 bg-gray-50 rounded w-3/4 animate-pulse"></div>
        </div>

        {/* Description skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-50 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-50 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-50 rounded w-2/3 animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  // Render a list of skeleton cards using parent's grid layout
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </>
  )
}

// Skeletons shown while loading more
export function LoadingSkeletonCards() {
  const [skeletonCount, setSkeletonCount] = useState(4)

  useEffect(() => {
    const updateSkeletonCount = () => {
      const width = window.innerWidth
      if (width >= 1200) {
        setSkeletonCount(4) // Large screens: 4
      } else if (width >= 768) {
        setSkeletonCount(3) // Medium screens: 3
      } else {
        setSkeletonCount(2) // Small screens: 2
      }
    }

    updateSkeletonCount()
    window.addEventListener("resize", updateSkeletonCount)
    return () => window.removeEventListener("resize", updateSkeletonCount)
  }, [])

  return (
    <>
      {Array.from({ length: skeletonCount }).map((_, index) => (
        <SkeletonCard key={`loading-${index}`} />
      ))}
    </>
  )
}
