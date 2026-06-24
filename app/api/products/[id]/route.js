import { query } from "@/lib/db"
import { deleteProductImage } from "@/lib/file-upload"
import { verifyAdminToken } from "@/lib/auth-middleware"

// Helper function to normalize image URLs to use API route
function normalizeImageUrl(imageUrl) {
  if (!imageUrl) return null
  // If already using API route, return as is
  if (imageUrl.startsWith("/api/uploads/")) return imageUrl
  // If using old /uploads/ path, convert to API route
  if (imageUrl.startsWith("/uploads/")) {
    return imageUrl.replace("/uploads/", "/api/uploads/")
  }
  // Otherwise return as is (for external URLs or placeholders)
  return imageUrl
}

export async function GET(req, { params }) {
  try {
    const { id } = await params

    const products = await query("SELECT * FROM products WHERE id = ?", [id])

    if (!products.length) {
      return Response.json({ message: "Product not found" }, { status: 404 })
    }

    const reviews = await query(
      `SELECT pr.*, u.full_name FROM product_reviews pr 
       LEFT JOIN users u ON pr.user_id = u.id 
       WHERE pr.product_id = ? 
       ORDER BY pr.created_at DESC`,
      [id],
    )

    const relatedProducts = await query("SELECT * FROM products WHERE category = ? AND id != ? LIMIT 4", [
      products[0].category,
      id,
    ])

    // Normalize image URLs to use API route
    const product = {
      ...products[0],
      image_url: normalizeImageUrl(products[0].image_url),
    }

    const normalizedRelatedProducts = relatedProducts.map((p) => ({
      ...p,
      image_url: normalizeImageUrl(p.image_url),
    }))

    return Response.json({
      product,
      reviews,
      related_products: normalizedRelatedProducts,
    })
  } catch (error) {
    console.error("[v0] Error fetching product:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req, { params }) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    const adminUser = await verifyAdminToken(token)
    if (!adminUser || adminUser.role !== "admin") {
      return Response.json({ message: "Unauthorized - Admin token required" }, { status: 401 })
    }

    const { id } = await params
    const { name, description, price, discount_price, category, stock, image_url, is_visible } = await req.json()

    if (!name || !price || !category) {
      return Response.json({ message: "Missing required fields" }, { status: 400 })
    }

    const finalDiscountPrice = discount_price === "" ? null : discount_price
    const finalImageUrl = image_url === "" ? null : image_url

    await query(
      `UPDATE products SET name = ?, description = ?, price = ?, discount_price = ?, category = ?, stock = ?, image_url = ?, is_visible = ? WHERE id = ?`,
      [name, description, price, finalDiscountPrice, category, stock, finalImageUrl, is_visible ? 1 : 0, id],
    )

    return Response.json({ message: "Product updated successfully" })
  } catch (error) {
    console.error("[v0] Error updating product:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    const adminUser = await verifyAdminToken(token)
    if (!adminUser || adminUser.role !== 'admin') {
      return Response.json({ message: "Forbidden: Only administrators can delete records" }, { status: 403 })
    }

    const { id } = await params

    const products = await query("SELECT image_url FROM products WHERE id = ?", [id])
    if (products.length > 0 && products[0].image_url) {
      deleteProductImage(products[0].image_url)
    }

    // Remove dependent order_items first to satisfy FK constraints
    await query("DELETE FROM order_items WHERE product_id = ?", [id])

    await query("DELETE FROM products WHERE id = ?", [id])
    return Response.json({ message: "Product and related order items deleted successfully" })
  } catch (error) {
    console.error("[v0] Error deleting product:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}
