"use client"

import { useEffect, useState } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import HeroImageSlider from "@/components/hero-image-slider"
import Link from "next/link"
import Image from "next/image"

export default function Home() {
  const [teamMembers, setTeamMembers] = useState([])
  const [teamLoading, setTeamLoading] = useState(true)
  const [teamError, setTeamError] = useState("")
  const [selectedMember, setSelectedMember] = useState(null)

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await fetch("/api/team")
        if (!res.ok) throw new Error("Unable to load team members")
        const data = await res.json()
        setTeamMembers(data.members || [])
      } catch (error) {
        setTeamError(error.message)
      } finally {
        setTeamLoading(false)
      }
    }

    fetchTeam()
  }, [])

  const closeModal = () => setSelectedMember(null)

  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative bg-blue-900 text-primary-foreground py-20 md:py-32 h-auto">
          <div className="container-custom">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 animate-fade-in-up">
                <h1 className="text-4xl md:text-6xl font-bold leading-tight text-balance-custom">
                  Welcome to Happypets
                </h1>
                <p className="text-lg md:text-xl text-primary-foreground/90 text-balance-custom">
                  Trusted veterinary care for dogs and cats in Imadol, Lalitpur. We provide vaccination, dental care, dermatology, surgery, and diagnostics with gentle handling and over 5 years of experience.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/appointments"
                    className="inline-flex items-center justify-center px-8 py-3 bg-accent text-accent-foreground font-semibold rounded-lg hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Book Appointment
                  </Link>
                  <Link
                    href="/shop"
                    className="inline-flex items-center justify-center px-8 py-3 border-2 border-primary-foreground text-primary-foreground font-semibold rounded-lg hover:bg-primary-foreground hover:text-primary transition-all transform hover:scale-105"
                  >
                    Browse Shop
                  </Link>
                  <Link
                    href="/blog"
                    className="inline-flex items-center justify-center px-8 py-3 border-2 border-primary-foreground text-primary-foreground font-semibold rounded-lg hover:bg-primary-foreground hover:text-primary transition-all transform hover:scale-105"
                  >
                    View Blogs
                  </Link>
                </div>
              </div>
              <div className="animate-fade-in-up animation-delay-200">
                <HeroImageSlider />
              </div>
            </div>
          </div>
        </section>

        {/* Intro Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance-custom">Why Choose Happypets?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                We're dedicated to providing the highest quality veterinary care and pet supplies with a friendly,
                compassionate approach.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
  <div className="p-6 bg-card rounded-lg border border-border hover:border-accent transition-colors">
    <div className="text-4xl mb-4">🏥</div>
    <h3 className="text-xl font-semibold mb-3">Expert Vet Care</h3>
    <p className="text-muted-foreground">
      Experienced doctor and trained team.
    </p>
  </div>

  <div className="p-6 bg-card rounded-lg border border-border hover:border-accent transition-colors">
    <div className="text-4xl mb-4">🐾</div>
    <h3 className="text-xl font-semibold mb-3">Pet-Centered Approach</h3>
    <p className="text-muted-foreground">
      Gentle, stress-free handling.
    </p>
  </div>

  <div className="p-6 bg-card rounded-lg border border-border hover:border-accent transition-colors">
    <div className="text-4xl mb-4">🔬</div>
    <h3 className="text-xl font-semibold mb-3">Advanced Diagnostics</h3>
    <p className="text-muted-foreground">
      X-ray, lab tests & skin workups.
    </p>
  </div>

  <div className="p-6 bg-card rounded-lg border border-border hover:border-accent transition-colors">
    <div className="text-4xl mb-4">⚕️</div>
    <h3 className="text-xl font-semibold mb-3">Complete Services</h3>
    <p className="text-muted-foreground">
      Consultation to surgery under one roof.
    </p>
  </div>

  <div className="p-6 bg-card rounded-lg border border-border hover:border-accent transition-colors">
    <div className="text-4xl mb-4">🧼</div>
    <h3 className="text-xl font-semibold mb-3">Clean & Safe Clinic</h3>
    <p className="text-muted-foreground">
      Hygienic and pet-friendly environment.
    </p>
  </div>

  <div className="p-6 bg-card rounded-lg border border-border hover:border-accent transition-colors">
    <div className="text-4xl mb-4">📍</div>
    <h3 className="text-xl font-semibold mb-3">Trusted in Imadol</h3>
    <p className="text-muted-foreground">
      Reliable care for your pets.
    </p>
  </div>
</div>

          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-primary text-primary-foreground">
          <div className="container-custom text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance-custom">Ready to Care for Your Pet?</h2>
            <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Book an appointment today or explore our premium pet supplies and wellness products.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/appointments"
                className="inline-flex items-center justify-center px-8 py-3 bg-accent text-accent-foreground font-semibold rounded-lg hover:bg-opacity-90 transition-all"
              >
                Book Now
              </Link>
              <Link
                href="/blog"
                className="inline-flex items-center justify-center px-8 py-3 border-2 border-primary-foreground text-primary-foreground font-semibold rounded-lg hover:bg-primary-foreground hover:text-primary transition-all"
              >
                Read Our Blog
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* Team Member Modal */}
      {selectedMember && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-card border-b border-border p-4 flex justify-between items-center">
              <h3 className="text-2xl font-bold">Team Member Profile</h3>
              <button
                onClick={closeModal}
                className="text-muted-foreground hover:text-foreground text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3">
                  <div className="overflow-hidden rounded-lg bg-muted aspect-square relative">
                    <Image
                      src={selectedMember.image_url || "/placeholder.svg"}
                      alt={selectedMember.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="w-full md:w-2/3">
                  <h4 className="text-2xl font-bold mb-2">{selectedMember.name}</h4>
                  <p className="text-accent font-semibold mb-4">{selectedMember.role}</p>
                  {selectedMember.bio && (
                    <div>
                      <h5 className="font-semibold mb-2">About</h5>
                      <p className="text-muted-foreground whitespace-pre-line">{selectedMember.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}