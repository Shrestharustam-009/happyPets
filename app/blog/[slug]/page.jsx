"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Header from "@/components/header"
import Footer from "@/components/footer"
import Link from "next/link"

export default function BlogDetailPage() {
  const { slug } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [post, setPost] = useState(null)
  const [relatedPosts, setRelatedPosts] = useState([])

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setError(null)
    fetch(`/api/blog/${slug}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.message || "Failed to fetch post.")
        }
        return res.json()
      })
      .then((data) => {
        setPost(data.post)
        setRelatedPosts(data.related_posts || [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center bg-stone-50">
          <p className="text-stone-400 text-sm animate-pulse tracking-wide">
            Loading article...
          </p>
        </main>
        <Footer />
      </>
    )
  }

  if (error || !post) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex flex-col items-center justify-center bg-stone-50 px-6 text-center gap-4">
          <h1 className="text-2xl font-medium text-stone-800">
            Post not found
          </h1>
          <p className="text-stone-500 text-sm max-w-sm">
            {error || "We couldn't find that article. It may have been moved or removed."}
          </p>
          <button
            onClick={() => router.push("/blog")}
            className="mt-2 px-6 py-2.5 rounded-full bg-emerald-700 text-white text-sm hover:bg-emerald-800 transition"
          >
            Back to Blog
          </button>
        </main>
        <Footer />
      </>
    )
  }

  const initials = post.author_name
    ? post.author_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "AU"

  const formattedDate = post.published_at && !isNaN(new Date(post.published_at))
    ? new Date(post.published_at).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    })
    : null

  return (
    <>
      <Header />

      <main className="bg-stone-50 min-h-screen pb-20">

        {/* ── Immersive Hero ── */}
        <div className="relative w-full h-[70vh] min-h-[420px] max-h-[600px] overflow-hidden">
          {post.featured_image ? (
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-full object-cover brightness-50"
            />
          ) : (
            <div className="w-full h-full bg-stone-800" />
          )}

          {/* Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

          {/* Hero text */}
          <div className="absolute bottom-0 left-0 right-0 px-6 md:px-10 pb-8 md:pb-10 max-w-5xl mx-auto w-full">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {post.category && (
                <span className="px-3 py-1 rounded-full text-[11px] font-medium tracking-widest uppercase text-white border border-white/25 bg-white/15">
                  {post.category}
                </span>
              )}
              {formattedDate && (
                <span className="text-white/60 text-[13px]">{formattedDate}</span>
              )}
              {post.author_name && (
                <span className="text-white/60 text-[13px]">
                  by <span className="text-white/80 font-medium">{post.author_name}</span>
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-medium text-white leading-snug max-w-2xl">
              {post.title}
            </h1>
          </div>
        </div>

        {/* ── Article Body ── */}
        <div className="max-w-5xl mx-auto px-5 md:px-6">

          {/* Author row */}
          {post.author_name && (
            <div className="flex items-center gap-3 py-5 border-b border-stone-200">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-sm font-medium flex-shrink-0">
                {initials}
              </div>
              <div>
                <p className="text-sm font-medium text-stone-800">{post.author_name}</p>
                {formattedDate && (
                  <p className="text-xs text-stone-400">{formattedDate}</p>
                )}
              </div>
            </div>
          )}

          {/* Excerpt */}
          {post.excerpt && (
            <div className="mt-8 mb-6 pl-5 border-l-[3px] border-emerald-600 bg-emerald-50/60 py-4 pr-5 rounded-r-xl">
              <p className="text-[17px] italic text-stone-600 leading-relaxed">
                {post.excerpt}
              </p>
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-stone max-w-none
              prose-headings:font-medium prose-headings:text-stone-900
              prose-p:text-stone-600 prose-p:leading-relaxed prose-p:text-[16px]
              prose-a:text-emerald-700 hover:prose-a:underline
              prose-blockquote:border-emerald-500 prose-blockquote:bg-emerald-50/50
              prose-blockquote:py-1 prose-blockquote:not-italic
              prose-img:rounded-2xl blog-content [font-family:var(--font-poppins)]"
            dangerouslySetInnerHTML={{ __html: post?.content || "" }}
          />
        </div>

        {/* ── Related Posts ── */}
        {relatedPosts.length > 0 && (
          <section className="max-w-5xl mx-auto px-5 md:px-6 mt-16">
            <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-stone-400 mb-5">
              Continue reading
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedPosts.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/blog/${rel.slug}`}
                  className="group bg-white border border-stone-200 rounded-2xl overflow-hidden hover:border-stone-300 transition-colors"
                >
                  {rel.featured_image && (
                    <img
                      src={rel.featured_image}
                      alt={rel.title}
                      className="h-40 w-full object-cover"
                    />
                  )}
                  <div className="p-4">
                    {rel.category && (
                      <p className="text-[11px] font-medium tracking-[0.07em] uppercase text-emerald-700 mb-1.5">
                        {rel.category}
                      </p>
                    )}
                    <h3 className="text-[15px] font-medium text-stone-800 leading-snug mb-1.5 group-hover:text-emerald-700 transition-colors">
                      {rel.title}
                    </h3>
                    {rel.excerpt && (
                      <p className="text-sm text-stone-500 line-clamp-2 leading-relaxed">
                        {rel.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  )
}