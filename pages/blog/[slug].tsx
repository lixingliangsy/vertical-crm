import React from 'react'
import Head from 'next/head'
import Layout from '../../components/Layout'
import { getGeoPost, geoPosts } from '../../data/geoPosts'

export async function getStaticPaths() {
  return {
    paths: geoPosts.map((p) => ({ params: { slug: p.slug } })),
    fallback: false,
  }
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  const post = getGeoPost(params.slug)
  if (!post) return { notFound: true }
  return { props: { post } }
}

export default function GeoPostPage({ post }: { post: any }) {
  return (
    <Layout>
      <Head>
        <title>{`${post.title} — TradeCRM`}</title>
        <meta name="description" content={post.description} />
        <link rel="canonical" href={`https://vertical-crm.lxsaihub.com/blog/${post.slug}`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(post.blogPosting) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(post.faqPage) }}
        />
      </Head>
      <article className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-xs font-bold tracking-widest uppercase text-indigo-600 mb-3">Blog · GEO</div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-6 text-slate-900">{post.title}</h1>
        <div className="article-body" dangerouslySetInnerHTML={{ __html: post.html }} />
        {post.faq && post.faq.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-4 text-slate-900">FAQ</h2>
            <div className="space-y-4">
              {post.faq.map((f: any, i: number) => (
                <div key={i} className="border-b border-slate-200 pb-4">
                  <div className="font-semibold text-slate-900">{f.question}</div>
                  <p className="text-slate-700 mt-1 leading-relaxed">{f.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}
        {post.disclaimer && (
          <div
            className="mt-10 rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm text-slate-500 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.disclaimer }}
          />
        )}
        {post.cta && (
          <div
            className="mt-8 rounded-lg bg-indigo-50 border border-indigo-200 p-5 text-indigo-900 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.cta }}
          />
        )}
        <p className="mt-10 text-sm">
          <a href="/blog" className="text-indigo-600 hover:underline">← Back to all posts</a>
        </p>
      </article>
      <style dangerouslySetInnerHTML={{ __html: `
        .article-body h2 { font-size: 1.5rem; font-weight: 700; margin: 2rem 0 0.75rem; color: #0f172a; }
        .article-body h3 { font-size: 1.2rem; font-weight: 600; margin: 1.5rem 0 0.5rem; color: #0f172a; }
        .article-body p { margin: 0.85rem 0; line-height: 1.75; color: #334155; }
        .article-body ul, .article-body ol { margin: 0.85rem 0; padding-left: 1.5rem; color: #334155; line-height: 1.7; }
        .article-body li { margin: 0.3rem 0; }
        .article-body a { color: #4f46e5; text-decoration: underline; }
        .article-body table { border-collapse: collapse; margin: 1.25rem 0; width: 100%; font-size: 0.95rem; }
        .article-body th, .article-body td { border: 1px solid #e2e8f0; padding: 0.5rem 0.75rem; text-align: left; }
        .article-body th { background: #f8fafc; font-weight: 600; }
        .article-body blockquote { border-left: 4px solid #c7d2fe; padding-left: 1rem; color: #475569; margin: 1.25rem 0; font-style: italic; }
        .article-body code { background: #f1f5f9; padding: 0.1rem 0.3rem; border-radius: 0.25rem; font-size: 0.875em; }
        .article-body pre { background: #0f172a; color: #e2e8f0; padding: 1rem; border-radius: 0.5rem; overflow: auto; margin: 1rem 0; }
      ` }} />
    </Layout>
  )
}
