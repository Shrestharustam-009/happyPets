"use client"

import { useState, useEffect } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import Image from "next/image"

export default function MyPetsPage() {
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    type: "dog",
    breed: "",
    age: "",
    color: "",
    description: "",
  })

  useEffect(() => {
    const fetchUserPets = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}")
        if (!user.id) {
          setLoading(false)
          return
        }
        const response = await fetch(`/api/users/${user.id}/pets`)
        if (response.ok) {
          const data = await response.json()
          setPets(Array.isArray(data) ? data : (data.pets || []))
        }
      } catch (error) {
        console.error("Error fetching pets:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchUserPets()
  }, [])

  const handleAddPet = async (e) => {
    e.preventDefault()
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      if (!user.id) {
        alert("Please log in first")
        return
      }

      const response = await fetch(`/api/users/${user.id}/pets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const newPet = await response.json()
        setPets([...pets, newPet])
        setFormData({ name: "", type: "dog", breed: "", age: "", color: "", description: "" })
        setShowAddForm(false)
        alert("Pet added successfully!")
      }
    } catch (error) {
      alert("Error adding pet: " + error.message)
    }
  }

  const handleDeletePet = async (petId) => {
    if (confirm("Are you sure you want to delete this pet?")) {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}")
        await fetch(`/api/users/${user.id}/pets/${petId}`, { method: "DELETE" })
        setPets(pets.filter((p) => p.id !== petId))
      } catch (error) {
        alert("Error deleting pet")
      }
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <>
      <Header />
      <main className="min-h-screen bg-muted/30 py-12">
        <div className="container-custom">
          {/* Header */}
          <div className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-4xl font-bold mb-2">My Pets</h1>
              <p className="text-muted-foreground">Manage and track your beloved pets</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-6 py-3 bg-accent text-accent-foreground font-semibold rounded-lg hover:bg-opacity-90 transition-all"
            >
              {showAddForm ? "Cancel" : "+ Add Pet"}
            </button>
          </div>

          {/* Add Pet Form */}
          {showAddForm && (
            <div className="bg-card rounded-lg border border-border p-8 mb-12">
              <h2 className="text-2xl font-bold mb-6">Add New Pet</h2>
              <form onSubmit={handleAddPet} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Pet Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                    <option value="bird">Bird</option>
                    <option value="rabbit">Rabbit</option>
                    <option value="hamster">Hamster</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Breed</label>
                  <input
                    type="text"
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Age (years)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Color/Markings</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Medical Notes</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <button
                  type="submit"
                  className="md:col-span-2 px-6 py-3 bg-accent text-accent-foreground font-semibold rounded-lg hover:bg-opacity-90 transition-all"
                >
                  Add Pet
                </button>
              </form>
            </div>
          )}

          {/* Pets Grid */}
          {pets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground mb-6">No pets added yet</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-3 bg-accent text-accent-foreground font-semibold rounded-lg hover:bg-opacity-90 transition-all"
              >
                Add Your First Pet
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pets.map((pet) => (
                <div
                  key={pet.id}
                  className="bg-card rounded-lg border border-border overflow-hidden hover:border-accent transition-colors"
                >
                  <div className="relative h-48 bg-muted">
                    <Image
                      src={`/.jpg?height=250&width=250&query=${pet.type}`}
                      alt={pet.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-bold mb-2">{pet.name}</h3>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm">
                        <span className="font-semibold">Type:</span> {pet.type}
                      </p>
                      {pet.breed && (
                        <p className="text-sm">
                          <span className="font-semibold">Breed:</span> {pet.breed}
                        </p>
                      )}
                      {pet.age && (
                        <p className="text-sm">
                          <span className="font-semibold">Age:</span> {pet.age} years
                        </p>
                      )}
                      {pet.color && (
                        <p className="text-sm">
                          <span className="font-semibold">Color:</span> {pet.color}
                        </p>
                      )}
                      {pet.description && (
                        <p className="text-sm">
                          <span className="font-semibold">Notes:</span> {pet.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 px-4 py-2 bg-accent text-accent-foreground font-semibold rounded-lg hover:bg-opacity-90 transition-all">
                        View Details
                      </button>
                      <button
                        onClick={() => handleDeletePet(pet.id)}
                        className="px-4 py-2 border-2 border-red-500 text-red-500 font-semibold rounded-lg hover:bg-red-50 transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
