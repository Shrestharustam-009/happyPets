"use client"
import { fetchWithAuth } from "@/lib/api"

import { useEffect, useState } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import Image from "next/image"
import MissionImageSlider from "@/components/mission-image-slider"
import { title } from "process"


export default function AboutPage() {
  const [teamMembers, setTeamMembers] = useState([])
  const [teamError, setTeamError] = useState("")
  const [teamLoading, setTeamLoading] = useState(true)
  const [missionImage, setMissionImage] = useState(null)
  const [missionLoading, setMissionLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState(null)

  const services = [
    {
      title: "Consultation & Telemedicine Consultation",
      description: "Full health checkups, diagnosis, and expert medical guidance for your pets.",
    },
    {
      title: "Dermatology & Allergy Care",
      description: "Treatment for skin issues, itching, allergies, and chronic dermatological conditions.",
    },
    {
      title: "Vaccination & Preventive Care",
      description: "Routine vaccinations and preventive treatments to keep your pets safe from diseases.",
    },
    {
      title: "Grooming & Hygiene",
      description: "Professional grooming, bathing, nail trimming, and hygiene care.",
    },
    {
      title: "Digital X-ray & Lab Diagnostics",
      description: "Advanced imaging and lab testing for accurate diagnosis and quick results.",
    },
    {
      title: "Surgery & Dental Care",
      description: "General surgery, dental cleaning, extractions, and oral health care.",
    },
    {
      title: "Telemedicine Consultation",
      description: "Online veterinary consultations for quick advice and follow-up sessions.",
    },
    {
      title: "Nutrition & Behaviour Counseling",
      description: "Personalized diet planning and behavior guidance for your pets’ well-being.",
    },
    {
      title: "Home Visit Services",
      description: "Convenient at-home checkups, vaccination, and minor treatments.",
    },
    {
      title: "Medical Treatment",
      description: "We treat a wide range of diseases with full hospitalization, oxygen support and bloor transfusion services(Availability may vary)",

    },
    {
      title:"Health Certificate",
      description:"We provide vet signed health certificate for travel"
    }

  ]

  // fetch team
  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await fetchWithAuth("/api/team")
        if (!res.ok) throw new Error("Unable to load team data")
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

  // fetch mission image
  useEffect(() => {
    const fetchMission = async () => {
      setMissionLoading(true);
      try {
        const res = await fetchWithAuth("/api/mission-image")
        if (res.ok) {
          const data = await res.json()
          setMissionImage(data.image)
        }
      } catch (error) {
        setMissionImage(null)
      } finally {
        setMissionLoading(false);
      }
    }
    fetchMission()
  }, [])

  const closeModal = () => setSelectedMember(null)

  return (
    <>
      <Header />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-accent/10 py-16">
          <div className="container-custom">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">HAPPY PETS ANIMAL CLINIC</h1>
              <p className="text-lg text-muted-foreground">
              DEDICATED TO PROVIDING EXCEPTIONAL VETERINARY CARE AND WELLNESS SERVICE TO YOUR BELOVED PETS SINCE 2020
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16">
          <div className="container-custom">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
                <p className="text-muted-foreground mb-4">
                  At Happypets Animal Clinic, our mission is to provide comprehensive, compassionate, and cutting-edge
                  veterinary care to pets and their families in our community. We believe that every pet deserves the
                  highest standard of medical attention and care.
                </p>
                <p className="text-muted-foreground mb-4">
                  We are committed to educating pet owners about preventative care, nutrition, and wellness to ensure
                  their pets live long, healthy, and happy lives.
                </p>
                <div className="space-y-3 mt-6">
                  {services.map((service) => (
                    <div key={service.title} className="flex items-start gap-3">
                      <span className="text-accent text-xl leading-none">✓</span>
                      <div>
                        <h3 className="font-semibold text-base md:text-lg">{service.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative h-96 rounded-lg overflow-hidden">
                <MissionImageSlider />
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 bg-muted/30">
          <div className="container-custom">
            <h2 className="text-3xl font-bold mb-12 text-center">Our Team</h2>
            {teamError && (
              <p className="text-center text-sm text-red-500 mb-6">Could not load team profiles: {teamError}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {teamLoading &&
                Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="bg-card rounded-lg border border-border overflow-hidden hover:border-accent transition-colors"
                  >
                    <div className="relative h-48 bg-muted animate-pulse" />
                    <div className="p-4 text-center space-y-2">
                      <div className="h-5 w-32 mx-auto bg-muted animate-pulse rounded" />
                      <div className="h-4 w-24 mx-auto bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                ))}

              {!teamLoading && !teamMembers.length && !teamError && (
                <p className="col-span-full text-center text-muted-foreground">
                  Team members will appear here once added in the system.
                </p>
              )}

              {!teamLoading &&
                teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="bg-card rounded-lg border border-border overflow-hidden hover:border-accent transition-colors"
                  >
                    <div className="relative h-48 bg-muted">
                      <Image
                        src={member.image_url || "/placeholder.svg?height=250&width=250"}
                        alt={member.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="p-4 text-center">
                      <h3 className="font-bold text-lg mb-1">{member.name}</h3>
                      <p className="text-sm text-accent mb-2">{member.role}</p>
                      {member.bio && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{member.bio}</p>}
                      <button
                        onClick={() => setSelectedMember(member)}
                        className="text-accent hover:text-accent/80 text-sm font-medium transition-colors"
                      >
                        See More →
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* Values Section */}
        {/* <section className="py-16">
          <div className="container-custom max-w-4xl">
            <h2 className="text-3xl font-bold mb-6 text-center">Our Values</h2>
            <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto mb-8">
              These principles guide every decision we make at Happypets Animal Clinic.
            </p>
            <div className="space-y-4">
              {[
                {
                  title: "Compassion",
                  description:
                    "We treat every pet with love and respect, understanding the bond between pets and their families.",
                },
                {
                  title: "Excellence",
                  description:
                    "We continuously improve our services and stay updated with the latest medical advancements.",
                },
                {
                  title: "Transparency",
                  description:
                    "We communicate clearly with our clients about treatment options, costs, and pet health conditions.",
                },
                {
                  title: "Community",
                  description: "We actively participate in local pet wellness initiatives and education programs.",
                },
                {
                  title: "Integrity",
                  description:
                    "We maintain the highest ethical standards in all our veterinary practices and business operations.",
                },
                {
                  title: "Innovation",
                  description:
                    "We invest in modern technology and techniques to provide the best possible care for pets.",
                },
              ].map((value, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className="text-accent text-xl leading-none">✓</span>
                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-1">{value.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section> */}


        
        {/* CTA Section */}
        <section className="py-16 bg-accent text-accent-foreground">
          <div className="container-custom text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Join the Happypets Family?</h2>
            <p className="mb-8 text-lg opacity-90">Schedule an appointment with us today</p>
            <a
              href="/appointments"
              className="inline-block px-8 py-3 bg-accent-foreground text-accent font-bold rounded-lg hover:opacity-90 transition-opacity"
            >
              Book an Appointment
            </a>
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