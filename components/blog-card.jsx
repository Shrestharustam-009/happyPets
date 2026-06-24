import Image from "next/image"
import Link from "next/link"

export default function BlogCard({ post }) {
  // Fix: Ensure published_at is valid for date
  let formattedDate = ""
  if (post.published_at) {
    const dateObj = new Date(post.published_at)
    if (!isNaN(dateObj.getTime())) {
      formattedDate = dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    }
  }

  return (
    <article className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg hover:border-accent transition-all">
      <div className="relative h-48 bg-muted overflow-hidden">
        <Image
          src={post.featuredImage || post.featured_image || "/placeholder.svg?key=blog"}
          alt={post.title}
          fill
          className="object-cover hover:scale-105 transition-transform"
        />
      </div>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold bg-accent/20 text-accent px-3 py-1 rounded-full">{post.category}</span>
          {post.tags &&
            post.tags
              .split(",")
              .slice(0, 1)
              .map((tag) => (
                <span key={tag} className="text-xs text-muted-foreground">
                  #{tag.trim()}
                </span>
              ))}
        </div>
        <h3 className="text-xl font-bold mb-2 line-clamp-2 hover:text-accent transition-colors">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{post.excerpt}</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{formattedDate || ""}</span>
          <span className="text-muted-foreground ml-2">{post.author_name ? `by ${post.author_name}` : ""}</span>
          <Link href={`/blog/${post.slug}`} className="text-accent hover:underline font-medium">
            Read More →
          </Link>
        </div>
      </div>
    </article>
  )
}
