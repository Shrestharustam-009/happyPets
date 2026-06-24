import { query } from "@/lib/db"
import { verifyAdminToken } from "@/lib/auth-middleware"

export async function GET(req, { params }) {
  try {
    const { slug } = await params

    const posts = await query(
      `SELECT * FROM blog_posts WHERE slug = ? AND is_published = 1`,
      [slug],
    )
    if (!posts.length) {
      return Response.json({ message: "Post not found" }, { status: 404 })
    }

    const post = posts[0]
    // Increment views
    await query("UPDATE blog_posts SET views = views + 1 WHERE id = ?", [post.id])

    // Get related posts
    const relatedPosts = await query(
      `SELECT * FROM blog_posts 
       WHERE category = ? AND id != ? AND is_published = 1 
       LIMIT 3`,
      [post.category, post.id],
    )

    return Response.json({
      post: { ...post, views: post.views + 1 },
      related_posts: relatedPosts,
    })
  } catch (error) {
    console.error("[v0] Error fetching blog post:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req, { params }) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    const adminUser = await verifyAdminToken(token)
    if (!adminUser || adminUser.role !== 'admin') {
      return Response.json({ message: "Forbidden: Only administrators can modify records" }, { status: 403 });
    }
    const { slug } = await params;
    if (!slug) {
      return Response.json({ message: "Invalid blog post slug" }, { status: 400 });
    }
    // Fetch id from slug
    const posts = await query("SELECT id FROM blog_posts WHERE slug = ?", [slug]);
    if (!posts.length) {
      return Response.json({ message: "Blog post not found" }, { status: 404 });
    }
    const id = posts[0].id;
    const { title, excerpt, content, category, tags, featuredImage, authorName } = await req.json();
    if (!title || !content || !category || !authorName) {
      return Response.json({ message: "Missing required fields" }, { status: 400 });
    }
    const newSlug = title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");
    await query(
      `UPDATE blog_posts SET title = ?, slug = ?, excerpt = ?, content = ?, category = ?, tags = ?, featured_image = ?, author_name = ? WHERE id = ?`,
      [title, newSlug, excerpt, content, category, tags, featuredImage || null, authorName, id],
    );
    return Response.json({ message: "Blog post updated successfully" });
  } catch (error) {
    console.error("[v0] Error updating blog post:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    const adminUser = await verifyAdminToken(token)
    if (!adminUser || adminUser.role !== 'admin') {
      return Response.json({ message: "Forbidden: Only administrators can delete records" }, { status: 403 })
    }
    const { slug } = await params;
    if (!slug) {
      return Response.json({ message: "Invalid blog post slug" }, { status: 400 });
    }
    // Fetch id from slug
    const posts = await query("SELECT id FROM blog_posts WHERE slug = ?", [slug]);
    if (!posts.length) {
      return Response.json({ message: "Blog post not found" }, { status: 404 });
    }
    const id = posts[0].id;
    await query("DELETE FROM blog_posts WHERE id = ?", [id]);
    return Response.json({ message: "Blog post deleted successfully" });
  } catch (error) {
    console.error("[v0] Error deleting blog post:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
