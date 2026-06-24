"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Header from "@/components/header"
import Footer from "@/components/footer"
import Image from "next/image"
import { useCart } from "@/lib/cart-context"

export default function ProductDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [wishlist, setWishlist] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${id}`)
        if (!response.ok) throw new Error("Product not found")
        const data = await response.json()
        setProduct(data.product)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (error) return <div className="min-h-screen flex items-center justify-center">Error: {error}</div>
  if (!product) return <div className="min-h-screen flex items-center justify-center">Product not found</div>

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.floor(rating) ? "text-yellow-400" : "text-muted-foreground"}>
        ★
      </span>
    ))
  }

  // Use discount_price for display if present, otherwise price
  const actualPrice = product.discount_price ?? product.price
  const originalPrice = product.price

  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0

  const handleAddToCart = () => {
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
      },
      quantity,
    )
    alert(`Added ${quantity} item(s) to cart`)
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-muted/30 py-12">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="relative h-96 bg-white rounded-lg overflow-hidden border border-border">
                <Image
                  src={product.image_url || "/placeholder.svg?height=400&width=400&query=product"}
                  alt={product.name || "Product image"}
                  fill
                  className="object-contain"
                />
                {discount > 0 && (
                  <div className="absolute top-4 right-4 bg-accent text-accent-foreground px-3 py-1 rounded-full font-bold text-sm">
                    -{discount}%
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                {(product.gallery || []).map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-20 h-20 border-2 rounded-lg overflow-hidden transition-colors ${
                      selectedImage === idx ? "border-accent" : "border-border"
                    }`}
                  >
                    <Image src={img || "/placeholder.svg"} alt={product.name || `Thumbnail`} fill className="object-contain" />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <span className="text-sm text-accent font-semibold">{product.category}</span>
                <h1 className="text-3xl md:text-4xl font-bold mt-2">{product.name}</h1>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3">
                <div className="flex">{renderStars(product.rating || 4)}</div>
                <span className="text-sm text-muted-foreground">({product.reviews || 0} reviews)</span>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold text-primary">NPR {actualPrice}</span>
                  {product.discount_price && (
                    <span className="text-xl text-muted-foreground line-through">NPR {originalPrice}</span>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-muted-foreground">{product.description}</p>

              {/* Features */}
              <div>
                <h3 className="font-semibold mb-3">Key Features</h3>
                <ul className="space-y-2">
                  {(product.features || []).map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <span className="text-accent">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Stock Status */}
              <div className="p-4 bg-muted/50 rounded-lg">
                {product.stock > 10 ? (
                  <p className="text-sm text-blue-600 font-medium">In Stock ({product.stock} available)</p>
                ) : product.stock > 0 ? (
                  <p className="text-sm text-orange-600 font-medium">Low Stock ({product.stock} left)</p>
                ) : (
                  <p className="text-sm text-red-600 font-medium">Out of Stock</p>
                )}
              </div>

              {/* Quantity & Actions */}
              <div className="flex gap-4 pt-4">
                <div className="flex items-center border border-border rounded-lg">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2 hover:bg-muted">
                    −
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                    className="w-16 text-center border-l border-r border-border focus:outline-none"
                  />
                  <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-2 hover:bg-muted">
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 py-3 bg-accent text-accent-foreground font-semibold rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50"
                >
                  Add to Cart
                </button>

                <button
                  onClick={() => setWishlist(!wishlist)}
                  className="px-6 py-3 border-2 border-border rounded-lg hover:border-accent transition-colors"
                >
                  {wishlist ? "❤️" : "🤍"}
                </button>
              </div>

            </div>
          </div>

          {/* Specifications */}
          <div className="bg-card rounded-lg border border-border p-8 mb-12">
            <h2 className="text-2xl font-bold mb-6">Product Specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(product.specs || {}).map(([key, value]) => (
                <div key={key} className="border-b border-border pb-4">
                  <span className="text-muted-foreground text-sm">{key}</span>
                  <p className="font-medium mt-1">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Related Products */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Related Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(product.related_products || []).map((product) => (
                <div
                  key={product.id}
                  className="bg-card rounded-lg border border-border overflow-hidden hover:border-accent transition-colors"
                >
                  <div className="relative h-48 bg-muted">
                    <Image
                      src={product.image_url || "/placeholder.svg?height=400&width=400&query=product"}
                      alt={product.name || 'Related product image'}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-2">{product.name}</h3>
                    <p className="text-lg font-bold text-primary">NPR {product.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
