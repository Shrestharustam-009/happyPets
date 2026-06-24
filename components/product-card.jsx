"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { useCart } from "@/lib/cart-context"

export default function ProductCard({ product }) {
  const [wishlist, setWishlist] = useState(false)
  const { addToCart } = useCart()

  const handleWishlist = (e) => {
    e.preventDefault()
    setWishlist(!wishlist)
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.floor(rating) ? "text-yellow-400" : "text-gray-600"}>
        ★
      </span>
    ))
  }

  const discount = product.discount_price ? Math.round(((product.price - product.discount_price) / product.price) * 100) : 0
  const hasDiscount = discount > 0

  return (
    <Link href={`/shop/${product.id}`} className="group block">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
        {/* Image */}
        <div className="relative h-64 bg-zinc-950 overflow-hidden">
          <Image
            src={product.image_url || "/placeholder.svg?key=product"}
            alt={product.name}
            fill
            className="object-contain group-hover:scale-110 transition-transform duration-500"
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Status Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {discount > 0 && (
              <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                -{discount}% OFF
              </div>
            )}
            {product.stock <= 5 && product.stock > 0 && (
              <div className="bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
                Only {product.stock} left
              </div>
            )}
          </div>

          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
              <span className="text-white font-bold text-lg tracking-wide">OUT OF STOCK</span>
            </div>
          )}

          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 p-2.5 bg-black/50 backdrop-blur-md rounded-full shadow-lg hover:bg-black/70 hover:scale-110 transition-all duration-200 border border-white/10"
          >
            <span className="text-xl">{wishlist ? "❤️" : "🤍"}</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider">
              {product.category}
            </span>
            {/* Rating */}
            <div className="flex items-center gap-1">
              <div className="flex text-sm">{renderStars(product.rating)}</div>
              <span className="text-xs text-gray-500">({product.reviews})</span>
            </div>
          </div>

          <h3 className="text-base font-bold mt-1 mb-3 line-clamp-2 text-white group-hover:text-blue-400 transition-colors duration-200 leading-tight">
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-4">
            {hasDiscount ? (
              <>
                <span className="text-2xl font-extrabold text-blue-400">
                  NPR {product.discount_price}
                </span>
                <span className="text-base text-gray-500 line-through decoration-2 decoration-red-500">
                  NPR {product.price}
                </span>
              </>
            ) : (
              <span className="text-2xl font-extrabold text-blue-400">
                NPR {product.price}
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={(e) => {
              e.preventDefault()
              addToCart(product, 1)
              alert("Added to cart")
            }}
            disabled={product.stock === 0}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm font-bold tracking-wide shadow-lg shadow-blue-500/20 disabled:shadow-none"
          >
            {product.stock === 0 ? "OUT OF STOCK" : "ADD TO CART"}
          </button>
        </div>
      </div>
    </Link>
  )
}