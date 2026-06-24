"use client"

import { useState, useEffect, useMemo } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import ProductCard from "@/components/product-card"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

const PRODUCTS_PER_PAGE = 12

export default function ShopPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState(["All"])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("featured")
  const [priceRange, setPriceRange] = useState([0, 100000])
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [paginationInfo, setPaginationInfo] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  })

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          sort: sortBy === "featured" ? "id" : sortBy,
          page: currentPage,
          limit: PRODUCTS_PER_PAGE,
        })

        if (selectedCategory !== "All") {
          params.append("category", selectedCategory)
        }

        const res = await fetch(`/api/products?${params}`)
        const data = await res.json()
        setProducts(data.products || [])

        // Extract unique categories (union across pages)
        if (Array.isArray(data.products)) {
          setCategories((prev) => {
            const nextCategories = new Set(prev.filter((c) => c !== "All"))
            data.products.forEach((p) => p?.category && nextCategories.add(p.category))
            return ["All", ...nextCategories]
          })
        }

        const totalPages = data?.pagination?.total_pages ?? 1
        const totalItems = data?.pagination?.total_items ?? data?.products?.length ?? 0
        setPaginationInfo({
          currentPage: data?.pagination?.current_page ?? currentPage,
          totalPages: Math.max(1, totalPages),
          totalItems,
        })
      } catch (error) {
        console.error("[v0] Error fetching products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [sortBy, currentPage, selectedCategory])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1]
      return matchesSearch && matchesPrice
    })
  }, [products, searchTerm, priceRange])

  const totalProducts = paginationInfo.totalItems || filteredProducts.length

  const pageNumbers = useMemo(() => {
    const total = paginationInfo.totalPages
    const current = paginationInfo.currentPage

    if (total <= 7) {
      return Array.from({ length: total }, (_, idx) => idx + 1)
    }

    const pages = [1]

    if (current > 3) {
      pages.push("ellipsis-start")
    }

    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    for (let page = start; page <= end; page += 1) {
      pages.push(page)
    }

    if (current < total - 2) {
      pages.push("ellipsis-end")
    }

    pages.push(total)
    return pages
  }, [paginationInfo])

  const handlePageChange = (page) => {
    const total = paginationInfo.totalPages
    if (page < 1 || page > total) return
    setCurrentPage(page)
  }

  if (loading && products.length === 0) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Loading products...</p>
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
        <section className="bg-primary text-primary-foreground py-8">
          <div className="container-custom">
            <h1 className="text-4xl font-bold mb-2">Pet Shop</h1>
            <p className="text-lg text-primary-foreground/90 mb-2">Quality pet supplies for your beloved companions</p>
            <p className="text-sm text-primary-foreground/80">Delivery via Pathao or InDrive</p>
          </div>
        </section>

        {/* Shop Section */}
        <section className="py-12">
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar Filters */}
              <div className={`lg:block ${showFilters ? "block" : "hidden"} space-y-6`}>
                <button
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden w-full py-2 text-center font-medium hover:bg-muted rounded-lg"
                >
                  Hide Filters
                </button>

                {/* Search */}
                <div>
                  <h3 className="font-semibold mb-3">Search</h3>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                  />
                </div>

                {/* Categories */}
                <div>
                  <h3 className="font-semibold mb-3">Category</h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => {
                          setSelectedCategory(category)
                          setCurrentPage(1)
                        }}
                        className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedCategory === category
                            ? "bg-accent text-accent-foreground font-medium"
                            : "hover:bg-muted"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h3 className="font-semibold mb-3">Price Range</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Min: NPR {priceRange[0]}</label>
                      <input
                        type="range"
                        min="0"
                        max="100000"
                        value={priceRange[0]}
                        step="100"
                        onChange={(e) => setPriceRange([Number.parseInt(e.target.value), priceRange[1]])}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Max: NPR {priceRange[1]}</label>
                      <input
                        type="range"
                        min="0"
                        max="100000"
                        value={priceRange[1]}
                        step="100"
                        onChange={(e) => setPriceRange([priceRange[0], Number.parseInt(e.target.value)])}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              <div className="lg:col-span-3">
                {/* Top Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredProducts.length} of {totalProducts} products
                  </p>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => setShowFilters(true)}
                      className="lg:hidden px-4 py-2 border border-border rounded-lg hover:border-accent text-sm"
                    >
                      Filters
                    </button>
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="flex-1 sm:flex-none px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                    >
                      <option value="featured">Featured</option>
                      <option value="newest">Newest</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                    </select>
                  </div>
                </div>

                {/* Products Grid */}
                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">No products found matching your criteria.</p>
                  </div>
                )}

                {paginationInfo.totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              handlePageChange(currentPage - 1)
                            }}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>

                        {pageNumbers.map((pageKey, index) =>
                          typeof pageKey === "string" ? (
                            <PaginationItem key={`${pageKey}-${index}`}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          ) : (
                            <PaginationItem key={pageKey}>
                              <PaginationLink
                                href="#"
                                size="default"
                                isActive={pageKey === currentPage}
                                onClick={(e) => {
                                  e.preventDefault()
                                  handlePageChange(pageKey)
                                }}
                              >
                                {pageKey}
                              </PaginationLink>
                            </PaginationItem>
                          ),
                        )}

                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              handlePageChange(currentPage + 1)
                            }}
                            className={currentPage === paginationInfo.totalPages ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
