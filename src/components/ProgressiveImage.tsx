import { useEffect, useRef, useState } from "react"
import { generateBlurPlaceholder, getLowResThumbnail } from "../utils/images"

interface ProgressiveImageProps {
  src: string
  alt: string
  className?: string
  sizes?: string
  width?: number
  height?: number
  fetchPriority?: "high" | "low" | "auto"
}

export function ProgressiveImage({
  src,
  alt,
  className = "",
  sizes,
  width,
  height,
  fetchPriority = "auto",
}: ProgressiveImageProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // 构建 srcset（让浏览器根据容器宽度自动选择分辨率）
  const buildSrcSet = (originalUrl: string): string => {
    const widths = [320, 480, 640, 960, 1280]
    return widths.map((w) => `${getLowResThumbnail(originalUrl, w)} ${w}w`).join(", ")
  }

  useEffect(() => {
    if (!imgRef.current) return
    const el = imgRef.current
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
            break
          }
        }
      },
      { rootMargin: "400px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const placeholder = generateBlurPlaceholder()
  const lowRes = getLowResThumbnail(src, 80)
  const finalSrcSet = buildSrcSet(src)

  return (
    <img
      ref={imgRef}
      src={isVisible ? lowRes : placeholder}
      srcSet={isVisible ? finalSrcSet : undefined}
      sizes={sizes}
      alt={alt}
      className={`progressive-image ${className} transition-opacity duration-400 ease-out`}
      style={{ opacity: isLoaded ? 1 : 0, width: "100%", height: "100%" }}
      onLoad={() => setIsLoaded(true)}
      loading={isVisible ? "lazy" : "eager"}
      decoding="async"
      // @ts-expect-error fetchpriority is a valid HTMLImageElement attribute in modern browsers
      fetchpriority={fetchPriority}
      width={width}
      height={height}
    />
  )
}
