import { query } from "@/lib/db"

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "6")
    const offset = (page - 1) * limit

    let sql = "SELECT * FROM blog_posts WHERE is_published = 1"
    const params = []

    if (category) {
      sql += " AND category = ?"
      params.push(category)
    }

    if (search) {
      sql += " AND (title LIKE ? OR excerpt LIKE ?)"
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm)
    }

    // Some MySQL/MariaDB setups don't accept placeholders for LIMIT/OFFSET in prepared statements.
    // Use validated numeric values inlined into the query instead of ? placeholders for these.
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 6
    const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0
    sql += ` ORDER BY published_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`

    const posts = await query(sql, params)

    // Get total count
    let countSql = "SELECT COUNT(*) as total FROM blog_posts WHERE is_published = 1"
    const countParams = []
    if (category) {
      countSql += " AND category = ?"
      countParams.push(category)
    }
    if (search) {
      countSql += " AND (title LIKE ? OR excerpt LIKE ?)"
      const searchTerm = `%${search}%`
      countParams.push(searchTerm, searchTerm)
    }

    const [{ total }] = await query(countSql, countParams)

    // Get categories
    const categories = await query("SELECT DISTINCT category FROM blog_posts WHERE is_published = 1")

    return Response.json({
      posts,
      categories: categories.map((c) => c.category),
      pagination: {
        current_page: page,
        total_items: total,
        total_pages: Math.ceil(total / limit),
        items_per_page: limit,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching blog posts:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return Response.json({ message: "Unauthorized - Admin token required" }, { status: 401 })
    }

    const { title, excerpt, content, category, tags, featuredImage, authorName } = await req.json()

    if (!title || !content || !category || !authorName) {
      return Response.json({ message: "Missing required fields" }, { status: 400 })
    }

    const slug = title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "")

    const result = await query(
      `INSERT INTO blog_posts (title, slug, excerpt, content, category, tags, featured_image, is_published, published_at, author_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), ?)`,
      [title, slug, excerpt, content, category, tags, featuredImage || null, authorName],
    )

    return Response.json({
      message: "Blog post created successfully",
      post_id: result.insertId,
    })
  } catch (error) {
    console.error("[v0] Error creating blog post:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}
