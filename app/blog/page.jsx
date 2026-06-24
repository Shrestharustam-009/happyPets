"use client"

import { useState, useEffect } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import BlogCard from "@/components/blog-card"
import { Facebook, Instagram, Youtube } from "lucide-react"

const POSTS_PER_PAGE = 6

export default function BlogPage() {
  const [posts, setPosts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Fetch blog posts from API
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          page: currentPage,
          limit: POSTS_PER_PAGE,
        })

        if (selectedCategory !== "All") {
          params.append("category", selectedCategory)
        }

        if (searchTerm) {
          params.append("search", searchTerm)
        }

        const res = await fetch(`/api/blog?${params}`)
        const data = await res.json()
        const normalizedPosts = (data.posts || []).map((p) => ({
          ...p,
          featuredImage: p.featured_image || p.featuredImage || null,
        }))
        setPosts(normalizedPosts)
        setCategories(data.categories ? ["All", ...data.categories] : ["All"])
        if (data.pagination && typeof data.pagination.total_pages === "number") {
          setTotalPages(data.pagination.total_pages)
        } else {
          setTotalPages(1)
        }
      } catch (error) {
        console.error("[v0] Error fetching blog posts:", error)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(fetchPosts, 500)
    return () => clearTimeout(debounceTimer)
  }, [selectedCategory, searchTerm, currentPage])

  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    setCurrentPage(1)
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  if (loading && posts.length === 0) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Loading blog posts...</p>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-muted/30">
        {/* Hero Section */}
        <section className="bg-primary text-primary-foreground py-12">
          <div className="container-custom">
            <h1 className="text-4xl font-bold mb-4">DrShresthaVET Blog</h1>
            <p className="text-lg text-primary-foreground/90 mb-6">
              Expert tips, health advice, and wellness guides for your beloved pets
            </p>
            <div className="flex items-center gap-4">

              <a
                href="https://www.youtube.com/@drshresthavet"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12">
          <div className="container-custom">
            {/* Search Bar */}
            <div className="mb-8">
              <input
                type="text"
                placeholder="Search blog posts..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {/* Category Filter */}
            <div className="mb-8 flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-6 py-2 rounded-full font-medium transition-all ${
                    selectedCategory === category
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border hover:border-accent"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Blog Grid */}
            {posts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {posts.map((post) => (
                    <BlogCard key={post.id} post={post} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-border rounded-lg hover:border-accent disabled:opacity-50 transition-colors"
                    >
                      Previous
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg font-medium transition-all ${
                          currentPage === page
                            ? "bg-primary text-primary-foreground"
                            : "border border-border hover:border-accent"
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-border rounded-lg hover:border-accent disabled:opacity-50 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No posts found. Try a different search or category.</p>
              </div>
            )}
          </div>
        </section>
        

        
      </main>
      <Footer />
    </>
  )
}
