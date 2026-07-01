import Header from "@/components/header"
import Footer from "@/components/footer"
import HeroImageSlider from "@/components/hero-image-slider"
import GoogleReviews from "@/components/google-reviews"
import LocationMap from "@/components/location-map"
import Link from "next/link"

export default function Home() {
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
                  Since 2020, Happy Pets Animal Clinic has provided trusted veterinary care for dogs and cats in Imadol, Lalitpur. We offer vaccinations, surgery, orthopedic care, dental care, skin treatment, diagnostics and emergency care.
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

        {/* Dynamic Google Reviews Section */}
        <GoogleReviews />

        {/* Google Maps Location Embed Section */}
        <LocationMap />

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
    </>
  )
}