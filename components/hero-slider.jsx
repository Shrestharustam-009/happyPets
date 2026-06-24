"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"

const defaultHeroSlides = [
  {
    id: 1,
    image: "/hero-image.jpeg",
    title: "Welcome to Happypets",
    description: "Trusted veterinary care for dogs and cats in Imadol, Lalitpur. We provide vaccination, dental care, dermatology, surgery, and diagnostics with gentle handling and over 5 years of experience.",
    primaryAction: { label: "Book Appointment", href: "/appointments" },
    secondaryAction: { label: "Browse Shop", href: "/shop" },
  },
  {
    id: 2,
    image: "/happy-pets-clinic-friendly-animals.jpg",
    title: "Expert Veterinary Care",
    description: "Comprehensive medical services provided by certified veterinarians with years of experience. Your pet's health is our top priority.",
    primaryAction: { label: "Our Services", href: "/#services" },
    secondaryAction: { label: "Meet Our Team", href: "/about" },
  },
  {
    id: 3,
    image: "/female-veterinarian-professional.jpg",
    title: "Compassionate Pet Care",
    description: "We treat every pet like family, ensuring comfort and the best possible outcomes. From routine checkups to emergencies, we're here when you need us.",
    primaryAction: { label: "Book Now", href: "/appointments" },
    secondaryAction: { label: "Learn More", href: "/about" },
  },
]

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [heroSlides, setHeroSlides] = useState(defaultHeroSlides)

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch("/api/hero-images")
        if (!res.ok) return
        const data = await res.json()
        if (Array.isArray(data) && data.length) {
          // Map uploaded images onto our slide content, cycling if needed
          setHeroSlides((prev) =>
            prev.map((slide, idx) => ({
              ...slide,
              image: data[idx % data.length].url,
            })),
          )
        }
      } catch (error) {
        console.error("[v0] Error loading hero images for slider:", error)
      }
    }

    fetchImages()
  }, [])

  const goToSlide = useCallback((index) => {
    if (index === currentSlide || isTransitioning) return
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentSlide(index)
      setIsTransitioning(false)
    }, 150)
  }, [currentSlide, isTransitioning])

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % heroSlides.length)
  }, [currentSlide, goToSlide])

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + heroSlides.length) % heroSlides.length)
  }, [currentSlide, goToSlide])

  // Auto-play functionality (optional - can be disabled)
  useEffect(() => {
    const interval = setInterval(() => {
      // Auto-play is disabled for manual control, but you can enable it by uncommenting:
      // nextSlide()
    }, 5000)
    return () => clearInterval(interval)
  }, [nextSlide])

  return (
    <section className="relative bg-blue-900 text-primary-foreground overflow-hidden">
      {/* Slider Container */}
      <div className="relative h-[600px] md:h-[700px] lg:h-[800px]">
        {/* Slides */}
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={cn(
              "absolute inset-0 transition-all duration-700 ease-in-out",
              index === currentSlide
                ? "opacity-100 scale-100 z-10"
                : "opacity-0 scale-105 z-0 pointer-events-none"
            )}
          >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0">
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                priority={index === 0}
                className={cn(
                  "object-contain transition-transform duration-[2000ms] ease-out",
                  index === currentSlide ? "scale-100" : "scale-110"
                )}
                style={{ transitionDuration: '2000ms' }}
                sizes="100vw"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-900/70 to-blue-900/50" />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-transparent to-transparent" />
              {/* Additional subtle overlay for depth */}
              <div className="absolute inset-0 bg-black/10" />
            </div>

            {/* Content */}
            <div className="relative z-20 h-full flex items-center">
              <div className="container-custom w-full">
                <div className="max-w-2xl">
                  <div
                    className={cn(
                      "space-y-6 transform transition-all duration-1000 delay-200",
                      index === currentSlide
                        ? "translate-y-0 opacity-100"
                        : "translate-y-8 opacity-0"
                    )}
                  >
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight text-balance-custom animate-fade-in-up">
                      {slide.title}
                    </h1>
                    <p className="text-lg md:text-xl text-primary-foreground/90 text-balance-custom max-w-xl animate-fade-in-up animation-delay-200">
                      {slide.description}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-fade-in-up animation-delay-400">
                      <Link
                        href={slide.primaryAction.href}
                        className="inline-flex items-center justify-center px-8 py-3 bg-accent text-accent-foreground font-semibold rounded-lg hover:bg-accent/90 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        {slide.primaryAction.label}
                      </Link>
                      <Link
                        href={slide.secondaryAction.href}
                        className="inline-flex items-center justify-center px-8 py-3 border-2 border-primary-foreground text-primary-foreground font-semibold rounded-lg hover:bg-primary-foreground hover:text-primary transition-all transform hover:scale-105"
                      >
                        {slide.secondaryAction.label}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows */}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 z-30 size-12 rounded-full bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/25 text-white transition-all hover:scale-110 shadow-lg hover:shadow-xl",
            isTransitioning && "pointer-events-none opacity-50"
          )}
          onClick={prevSlide}
          aria-label="Previous slide"
        >
          <ChevronLeft className="size-6" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "absolute right-4 top-1/2 -translate-y-1/2 z-30 size-12 rounded-full bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/25 text-white transition-all hover:scale-110 shadow-lg hover:shadow-xl",
            isTransitioning && "pointer-events-none opacity-50"
          )}
          onClick={nextSlide}
          aria-label="Next slide"
        >
          <ChevronRight className="size-6" />
        </Button>

        {/* Dots Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2 items-center">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "transition-all duration-300 rounded-full hover:scale-110",
                index === currentSlide
                  ? "w-10 h-3 bg-white shadow-lg"
                  : "w-3 h-3 bg-white/50 hover:bg-white/75"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

