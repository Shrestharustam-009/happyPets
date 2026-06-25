"use client"
import { fetchWithAuth } from "@/lib/api"

import { useState, useCallback, useEffect } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"


export default function HeroImageSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [heroImages, setHeroImages] = useState([])

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetchWithAuth("/api/hero-images")
        if (res.ok) {
          const data = await res.json()
          setHeroImages(
            Array.isArray(data) && data.length
              ? data.map((img, index) => ({
                  id: index,
                  image: img.url,
                  alt: img.filename,
                }))
              : [
                  // Fallback to static images if none uploaded
                  {
                    id: 1,
                    image: "/hero-image.jpeg",
                    alt: "Happy Pets Clinic",
                  },
                  {
                    id: 2,
                    image: "/happy-pets-clinic-friendly-animals.jpg",
                    alt: "Friendly animals at clinic",
                  },
                  {
                    id: 3,
                    image: "/female-veterinarian-professional.jpg",
                    alt: "Professional veterinarian",
                  },
                ],
          )
        }
      } catch (error) {
        console.error("[v0] Error loading hero images:", error)
      }
    }

    fetchImages()
  }, [])

  useEffect(() => {
    if (!heroImages.length) return;
    const interval = setInterval(() => {
      setCurrentSlide((current) => (current + 1) % heroImages.length);
    }, 3500); // 3.5s per slide
    return () => clearInterval(interval);
  }, [heroImages.length]);

  const goToSlide = useCallback((index) => {
    if (index === currentSlide || isTransitioning) return
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentSlide(index)
      setIsTransitioning(false)
    }, 150)
  }, [currentSlide, isTransitioning])

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % heroImages.length)
  }, [currentSlide, goToSlide])

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + heroImages.length) % heroImages.length)
  }, [currentSlide, goToSlide])

  if (!heroImages.length) {
    return null
  }

  return (
    <div className="relative h-80 md:h-96 lg:h-[500px] w-full group animate-fade-in-up">
      {/* Slides Container */}
      <div className="relative h-full w-full overflow-hidden rounded-2xl md:rounded-3xl shadow-2xl ring-2 ring-white/20 hover:ring-white/30 transition-all duration-300 hover:shadow-3xl transform hover:-translate-y-1">
        {heroImages.map((slide, index) => (
          <div
            key={slide.id}
            className={cn(
              "absolute inset-0 transition-all duration-700 ease-in-out",
              index === currentSlide
                ? "opacity-100 scale-100 z-10"
                : "opacity-0 scale-105 z-0 pointer-events-none"
            )}
          >
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  // Only first image is priority; the rest use default lazy loading
                  priority={index === 0}
                  className={cn(
                    "object-contain transition-transform duration-2000 ease-out",
                    index === currentSlide ? "scale-100" : "scale-110"
                  )}
                  style={{ transitionDuration: "2000ms" }}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
            {/* Subtle overlay for depth and visual polish */}
            <div className="absolute inset-0 bg-linear-to-t from-black/10 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-linear-to-br from-transparent via-transparent to-black/5" />
          </div>
        ))}

        {/* Navigation Arrows - Show on hover (desktop) or always visible (mobile) */}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2 z-30 size-10 rounded-full bg-white/90 backdrop-blur-sm border-white/30 hover:bg-white text-gray-800 transition-all hover:scale-110 shadow-lg md:opacity-0 md:group-hover:opacity-100",
            isTransitioning && "pointer-events-none opacity-50"
          )}
          onClick={prevSlide}
          aria-label="Previous slide"
        >
          <ChevronLeft className="size-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 z-30 size-10 rounded-full bg-white/90 backdrop-blur-sm border-white/30 hover:bg-white text-gray-800 transition-all hover:scale-110 shadow-lg md:opacity-0 md:group-hover:opacity-100",
            isTransitioning && "pointer-events-none opacity-50"
          )}
          onClick={nextSlide}
          aria-label="Next slide"
        >
          <ChevronRight className="size-5" />
        </Button>

        {/* Dots Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2 items-center">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "transition-all duration-300 rounded-full hover:scale-125",
                index === currentSlide
                  ? "w-8 h-2.5 bg-white shadow-md"
                  : "w-2.5 h-2.5 bg-white/60 hover:bg-white/80"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

