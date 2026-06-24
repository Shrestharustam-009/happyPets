"use client"

import { useEffect, useState } from "react"

export default function AdminTabImages() {
  const [heroImages, setHeroImages] = useState([])
  const [loadingHero, setLoadingHero] = useState(true)
  const [uploadingHero, setUploadingHero] = useState(false)

  const [missionImages, setMissionImages] = useState([])
  const [loadingMission, setLoadingMission] = useState(true)
  const [uploadingMission, setUploadingMission] = useState(false)

  // --- HERO (existing) ---
  const fetchImages = async () => {
    setLoadingHero(true)
    try {
      const res = await fetch("/api/hero-images")
      if (res.ok) {
        const data = await res.json()
        setHeroImages(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching hero images:", error)
    } finally {
      setLoadingHero(false)
    }
  }

  // --- MISSION (new) ---
  const fetchMissionImages = async () => {
    setLoadingMission(true)
    try {
      const res = await fetch("/api/mission-image")
      if (res.ok) {
        const data = await res.json()
        setMissionImages(data)
      }
    } catch (error) {
      setMissionImages([])
    } finally {
      setLoadingMission(false)
    }
  }

  useEffect(() => {
    fetchImages()
    fetchMissionImages()
  }, [])

  const handleHeroUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingHero(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload/hero-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.message || "Failed to upload image")
        return
      }
      await fetchImages()
      e.target.value = ""
    } catch (error) {
      console.error("[v0] Error uploading hero image:", error)
      alert("Failed to upload image")
    } finally {
      setUploadingHero(false)
    }
  }

  const handleMissionUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingMission(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/mission-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.message || "Failed to upload mission image")
        return
      }
      await fetchMissionImages()
      e.target.value = ""
    } catch (error) {
      alert("Failed to upload mission image")
    } finally {
      setUploadingMission(false)
    }
  }

  const handleMissionDelete = async (filename) => {
    if (!confirm("Are you sure you want to delete this mission image?")) return
    try {
      const res = await fetch(`/api/mission-image?filename=${encodeURIComponent(filename)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.message || "Failed to delete mission image")
        return
      }
      await fetchMissionImages()
    } catch (err) {
      alert("Failed to delete mission image")
    }
  }

  const handleHeroDelete = async (filename) => {
    if (!confirm("Are you sure you want to delete this hero image?")) return
    try {
      const res = await fetch(`/api/hero-images?filename=${encodeURIComponent(filename)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.message || "Failed to delete hero image")
        return
      }
      await fetchImages()
    } catch (err) {
      alert("Failed to delete hero image")
    }
  }

  // --- rest of render ---
  return (
    <div className="space-y-10">
      {/* HERO IMAGES Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Hero Images</h2>
            <p className="text-sm text-muted-foreground mt-1">
              These images are used in the homepage hero slider.
            </p>
          </div>
          <label className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm cursor-pointer shadow-sm">
            {uploadingHero ? "Uploading..." : "+ Add Image"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleHeroUpload}
              disabled={uploadingHero}
            />
          </label>
        </div>

        {loadingHero ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : heroImages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-background border border-border rounded-lg p-6">
            No hero images uploaded yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {heroImages.map((img) => (
              <div key={img.filename} className="bg-background border border-border rounded-xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-muted/35 h-40 flex items-center justify-center p-2 border-b border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.filename} className="max-w-full max-h-full object-contain rounded" loading="lazy" />
                </div>
                <div className="p-3 flex items-center justify-between gap-2 bg-background">
                  <span className="text-xs text-muted-foreground truncate flex-1 font-mono">{img.filename}</span>
                  <button
                    onClick={() => handleHeroDelete(img.filename)}
                    className="text-xs text-red-500 hover:text-red-700 font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MISSION IMAGES Section */}
      <div className="border-t border-border pt-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Mission Section Images</h2>
            <p className="text-sm text-muted-foreground mt-1">
              These images are used in the Our Mission slider on the About page.
            </p>
          </div>
          <label className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm cursor-pointer shadow-sm">
            {uploadingMission ? "Uploading..." : "+ Add Image"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleMissionUpload}
              disabled={uploadingMission}
            />
          </label>
        </div>

        {loadingMission ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : missionImages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-background border border-border rounded-lg p-6">
            No mission images uploaded yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {missionImages.map(img => (
              <div key={img.filename} className="bg-background border border-border rounded-xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-muted/35 h-40 flex items-center justify-center p-2 border-b border-border">
                  <img src={img.url} alt={img.filename} className="max-w-full max-h-full object-contain rounded" loading="lazy" />
                </div>
                <div className="p-3 flex items-center justify-between gap-2 bg-background">
                  <span className="text-xs text-muted-foreground truncate flex-1 font-mono">{img.filename}</span>
                  <button
                    onClick={() => handleMissionDelete(img.filename)}
                    className="text-xs text-red-500 hover:text-red-700 font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


