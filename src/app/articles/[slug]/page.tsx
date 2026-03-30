"use client";

// ============================================================
// app/articles/[slug]/page.tsx  として配置
// ============================================================

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useParams } from "next/navigation";

// ---- 型 ----
type User = { id: string; username: string; avatarUrl?: string; isAdmin?: boolean };
type Comment = { id: string; user: User; content: string; createdAt: string };
type Reaction = { emoji: string; count: number; reacted: boolean };
type History = { id: string; editor: User; changeNote?: string; createdAt: string };
type Article = {
  id: string;
  slug: string;
  title: string;
  content: string;        // Markdown文字列
  category: string;
  tags: string[];
  edition: "Java" | "Bedrock" | "両対応";
  author: User;
  likesCount: number;
  liked: boolean;
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
  reactions: Reaction[];
  histories: History[];
};

export default function ArticlePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          id,
          slug,
          title,
          content,
          category,
          tags,
          edition,
          likes_count,
          created_at,
          updated_at,
          users!inner(username, avatar_url)
        `)
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) {
        console.error('Error fetching article:', error);
        setLoading(false);
        return;
      }

      // Transform data
      const transformedArticle: Article = {
        id: data.id,
        slug: data.slug,
        title: data.title,
        content: data.content,
        category: data.category,
        tags: data.tags,
        edition: data.edition,
        author: {
          id: data.users.id,
          username: data.users.username,
          avatarUrl: data.users.avatar_url,
        },
        likesCount: data.likes_count,
        liked: false, // TODO: check if user liked
        createdAt: new Date(data.created_at).toLocaleString('ja-JP'),
        updatedAt: new Date(data.updated_at).toLocaleString('ja-JP'),
        comments: [], // TODO: fetch comments
        reactions: [], // TODO: fetch reactions
        histories: [], // TODO: fetch histories
      };

      setArticle(transformedArticle);
      setLoading(false);
    };

    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!article) {
    return <div>記事が見つかりません</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f9fc", fontFamily: "'Noto Sans JP', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      {/* ヘッダー */}
      <header style={{
        background: "#fff", borderBottom: "1px solid #e8edf2",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{
          maxWidth: "1060px", margin: "0 auto", padding: "0 24px",
          height: "58px", display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "32px", height: "32px", background: "#3b6ecc",
              borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "17px",
            }}>⛏</div>
            <div>
              <div style={{
                fontSize: "14px", fontWeight: 700, color: "#111827",
                fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.02em",
              }}>mc-cmd.wiki</div>
              <div style={{ fontSize: "10px", color: "#3b6ecc", fontFamily: "'Noto Sans JP', sans-serif", marginTop: "-1px" }}>
                マイクラコマンド相談所
              </div>
            </div>
          </div>

          <nav style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <button style={{
              background: "transparent", border: "1.5px solid #e8edf2",
              color: "#6b7280", borderRadius: "8px", padding: "7px 16px",
              fontSize: "13px", cursor: "pointer", fontFamily: "'Noto Sans JP', sans-serif",
            }}>
              ホームに戻る
            </button>
          </nav>
        </div>
      </header>

      {/* 記事コンテンツ */}
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 24px" }}>
        <article>
          <header style={{ marginBottom: "32px" }}>
            <h1 style={{
              fontSize: "32px", fontWeight: 800, color: "#111827",
              lineHeight: 1.2, marginBottom: "16px",
            }}>
              {article.title}
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "8px",
                  background: "#e8f0fa", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "14px", color: "#3b6ecc", fontWeight: 700,
                }}>
                  {article.author.avatarUrl ? (
                    <img src={article.author.avatarUrl} alt={article.author.username} style={{ width: "100%", height: "100%", borderRadius: "8px" }} />
                  ) : (
                    article.author.username[0]
                  )}
                </div>
                <span style={{ fontSize: "14px", color: "#6b7280" }}>
                  {article.author.username}
                </span>
              </div>
              <span style={{ fontSize: "14px", color: "#c4cad4" }}>
                {article.updatedAt}
              </span>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <span style={{
                background: "#f3f4f6", color: "#9ca3af", borderRadius: "4px",
                fontSize: "12px", padding: "4px 8px", fontFamily: "'JetBrains Mono', monospace",
              }}>
                {article.category}
              </span>
              {article.tags.map(tag => (
                <span key={tag} style={{
                  background: "#e8f0fa", color: "#3b6ecc", borderRadius: "4px",
                  fontSize: "12px", padding: "4px 8px", fontFamily: "'JetBrains Mono', monospace",
                }}>
                  #{tag}
                </span>
              ))}
            </div>
          </header>

          <div style={{
            background: "#fff", border: "1.5px solid #e8edf2",
            borderRadius: "12px", padding: "32px", lineHeight: 1.7,
          }}>
            {/* Markdownコンテンツをレンダリング */}
            <div dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br>') }} />
          </div>
        </article>
      </div>
    </div>
  );
}