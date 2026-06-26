import { MapPin, Navigation, Clock, Phone } from "lucide-react"

export default function LocationMap() {
  const apiKey = process.env.MAPS_API_KEY
  const placeId = "ChIJMSLyGQAZ6zkRLFulZv-aXvg"
  
  const embedUrl = apiKey 
    ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=place_id:${placeId}`
    : `https://maps.google.com/maps?q=Happy%20Pets%20Animal%20Clinic,%20Imadol&t=&z=15&ie=UTF8&iwloc=&output=embed` // Fallback map if no API key

  return (
    <section className="py-16 md:py-24 bg-muted/30 border-t border-border">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-stretch">
          
          {/* Map Info Panel */}
          <div className="flex flex-col justify-between space-y-8 bg-card p-8 rounded-2xl border border-border shadow-sm">
            <div>
              <span className="text-sm font-bold text-primary tracking-wider uppercase bg-primary/10 px-3 py-1 rounded-full">Visit Us</span>
              <h2 className="text-3xl font-extrabold mt-3 text-foreground tracking-tight">Our Clinic</h2>
              <p className="text-muted-foreground mt-3 leading-relaxed">
                Conveniently located in Imadol, Lalitpur, we are easily accessible and ready to welcome you and your pets.
              </p>
            </div>

            <div className="space-y-6">
              {/* Address */}
              <div className="flex gap-4">
                <div className="bg-primary/10 text-primary p-3 rounded-xl h-11 w-11 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Address</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Happy Pets Animal Clinic, Imadol, Lalitpur, Nepal
                  </p>
                </div>
              </div>

              {/* Business Hours */}
              <div className="flex gap-4">
                <div className="bg-primary/10 text-primary p-3 rounded-xl h-11 w-11 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Clinic Hours</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sunday - Friday: 8:00 AM - 8:00 PM
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex gap-4">
                <div className="bg-primary/10 text-primary p-3 rounded-xl h-11 w-11 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Contact</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    <a href="tel:+9779860872125" className="hover:text-primary transition-colors">9860872125</a> / info@happypets.com
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=Happy+Pets+Animal+Clinic+Imadol&query_place_id=${placeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 justify-center w-full px-5 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/95 transition-all shadow-sm text-sm"
              >
                <Navigation className="w-4 h-4 fill-current" /> Get Directions on Maps
              </a>
            </div>
          </div>

          {/* Iframe Embed */}
          <div className="lg:col-span-2 relative h-[400px] lg:h-auto rounded-2xl overflow-hidden border border-border shadow-md">
            <iframe
              title="Happy Pets Animal Clinic Location"
              src={embedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 w-full h-full"
            ></iframe>
          </div>

        </div>
      </div>
    </section>
  )
}
