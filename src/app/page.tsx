"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

type Tag = { label: string; color: string };
type Article = {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: Tag[];
  author: string;
  authorAvatar: string;
  updatedAt: string;
  views: number;
  edition: "Java" | "Bedrock" | "両対応";
};

const CATEGORIES = ["すべて", "エンティティ", "ワールド", "アイテム", "ゲームルール", "座標・テレポート", "スコアボード"];

const EDITION_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  Java:   { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  Bedrock:{ bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  両対応: { bg: "#faf5ff", text: "#7c3aed", border: "#e9d5ff" },
};

function EditionBadge({ edition }: { edition: Article["edition"] }) {
  const s = EDITION_STYLE[edition];
  return (
    <span style={{
      background: s.bg, color: s.text, border: `1px solid ${s.border}`,
      borderRadius: "5px", fontSize: "11px", fontWeight: 600,
      padding: "2px 9px", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap",
    }}>
      {edition}
    </span>
  );
}

function ArticleCard({ article }: { article: Article }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => window.location.href = `/articles/${article.id}`}
      style={{
        background: "#fff",
        border: `1.5px solid ${hovered ? "#5b9bd5" : "#e8edf2"}`,
        borderRadius: "12px",
        padding: "22px 24px",
        cursor: "pointer",
        transition: "all 0.16s ease",
        boxShadow: hovered ? "0 4px 20px rgba(59,130,246,0.10)" : "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "8px" }}>
        <h2 style={{
          margin: 0, fontSize: "15px", fontWeight: 700, color: "#111827",
          fontFamily: "'Noto Sans JP', sans-serif", lineHeight: 1.45,
        }}>
          {article.title}
        </h2>
        <EditionBadge edition={article.edition} />
      </div>

      <p style={{
        margin: "0 0 14px", fontSize: "13px", color: "#6b7280",
        lineHeight: 1.65, fontFamily: "'Noto Sans JP', sans-serif",
      }}>
        {article.description}
      </p>

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
        {article.tags.map((tag) => (
          <span key={tag.label} style={{
            background: tag.color + "12", color: tag.color,
            border: `1px solid ${tag.color}30`, borderRadius: "4px",
            fontSize: "11px", fontWeight: 600, padding: "2px 8px",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            #{tag.label}
          </span>
        ))}
        <span style={{
          background: "#f3f4f6", color: "#9ca3af", borderRadius: "4px",
          fontSize: "11px", padding: "2px 8px", fontFamily: "'JetBrains Mono', monospace",
        }}>
          {article.category}
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <div style={{
            width: "22px", height: "22px", borderRadius: "6px",
            background: "#e8f0fa", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "11px", color: "#3b6ecc", fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {article.authorAvatar}
          </div>
          <span style={{ fontSize: "12px", color: "#9ca3af", fontFamily: "'Noto Sans JP', sans-serif" }}>
            {article.author}
          </span>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <span style={{ fontSize: "11px", color: "#c4cad4", fontFamily: "'JetBrains Mono', monospace" }}>
            👁 {article.views.toLocaleString()}
          </span>
          <span style={{ fontSize: "11px", color: "#c4cad4", fontFamily: "'JetBrains Mono', monospace" }}>
            {article.updatedAt}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function TopPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("すべて");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) console.error(error)
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error(error)
  }

  useEffect(() => {
    const fetchArticles = async () => {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          content,
          category,
          tags,
          edition,
          author_id,
          created_at,
          updated_at,
          users!inner(username, avatar_url)
        `)
        .eq('is_published', true)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching articles:', error);
        setLoading(false);
        return;
      }

      // Transform data to match Article type
      const transformedArticles: Article[] = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.content.substring(0, 100) + '...', // Simple description from content
        category: item.category,
        tags: item.tags.map((tag: string) => ({ label: tag, color: '#16a34a' })), // Default color
        author: item.users.username,
        authorAvatar: item.users.avatar_url ? item.users.avatar_url[0] : item.users.username[0],
        updatedAt: new Date(item.updated_at).toLocaleDateString('ja-JP'),
        views: 0, // Not in schema, set to 0
        edition: item.edition as "Java" | "Bedrock" | "両対応",
      }));

      setArticles(transformedArticles);
      setLoading(false);
    };

    fetchArticles();
  }, []);

  const filtered = articles.filter((a) => {
    const matchCat = activeCategory === "すべて" || a.category === activeCategory;
    const matchSearch =
      search === "" ||
      a.title.includes(search) ||
      a.description.includes(search) ||
      a.tags.some((t) => t.label.includes(search));
    return matchCat && matchSearch;
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f9fc", fontFamily: "'Noto Sans JP', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        ::placeholder { color: #c4cad4; }
        input:focus { outline: none; }
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
            {user ? (
              <>
                <span style={{ fontSize: "13px", color: "#6b7280" }}>
                  {user.user_metadata?.full_name || user.user_metadata?.name}
                </span>
                <button style={{
                  background: "transparent", border: "1.5px solid #e8edf2",
                  color: "#6b7280", borderRadius: "8px", padding: "7px 16px",
                  fontSize: "13px", cursor: "pointer", fontFamily: "'Noto Sans JP', sans-serif",
                }} onClick={handleLogout}>
                  ログアウト
                </button>
                <button style={{
                  background: "#3b6ecc", border: "none", color: "#fff",
                  borderRadius: "8px", padding: "7px 18px", fontSize: "13px",
                  cursor: "pointer", fontWeight: 700, fontFamily: "'Noto Sans JP', sans-serif",
                }} onClick={() => window.location.href = '/editor'}>
                  + 記事を書く
                </button>
              </>
            ) : (
              <>
                <button style={{
                  background: "transparent", border: "1.5px solid #e8edf2",
                  color: "#6b7280", borderRadius: "8px", padding: "7px 16px",
                  fontSize: "13px", cursor: "pointer", fontFamily: "'Noto Sans JP', sans-serif",
                  display: "flex", alignItems: "center", gap: "6px",
                }} onClick={handleLogin}>
                  <span style={{ fontSize: "14px" }}>💬</span> Discord でログイン
                </button>
                <button style={{
                  background: "#3b6ecc", border: "none", color: "#fff",
                  borderRadius: "8px", padding: "7px 18px", fontSize: "13px",
                  cursor: "pointer", fontWeight: 700, fontFamily: "'Noto Sans JP', sans-serif",
                }} onClick={handleLogin}>
                  + 記事を書く
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ヒーロー */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #e8edf2",
        padding: "56px 24px 48px", textAlign: "center",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          background: "#eff6ff", border: "1px solid #bfdbfe",
          borderRadius: "20px", padding: "4px 14px",
          fontSize: "12px", color: "#1d4ed8",
          fontFamily: "'JetBrains Mono', monospace", marginBottom: "22px",
        }}>
          <span style={{ opacity: 0.5 }}>/</span>help mc-cmd.wiki
        </div>

        <h1 style={{
          margin: "0 0 14px",
          fontSize: "clamp(26px, 5vw, 40px)",
          fontWeight: 800, color: "#111827",
          letterSpacing: "-0.03em", lineHeight: 1.2,
        }}>
          マイクラコマンドまとめ<span style={{ color: "#3b6ecc" }}> Wiki</span>
        </h1>

        <p style={{
          margin: "0 auto 36px", maxWidth: "420px",
          fontSize: "14px", color: "#9ca3af", lineHeight: 1.75,
        }}>
          Discordコミュニティ「マイクラコマンド相談所」による、
          みんなで作るコマンドリファレンス
        </p>

        <div style={{ maxWidth: "500px", margin: "0 auto", position: "relative" }}>
          <span style={{
            position: "absolute", left: "16px", top: "50%",
            transform: "translateY(-50%)", color: "#c4cad4",
            fontSize: "15px", pointerEvents: "none",
          }}>🔍</span>
          <input
            type="text"
            placeholder="/summon, execute, gamerule ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", background: "#f7f9fc",
              border: "1.5px solid #e8edf2", borderRadius: "10px",
              padding: "13px 18px 13px 44px", fontSize: "14px",
              color: "#111827", fontFamily: "'JetBrains Mono', monospace",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#3b6ecc";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,110,204,0.12)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#e8edf2";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        <div style={{ marginTop: "32px", display: "flex", justifyContent: "center", gap: "40px" }}>
          {[{ label: "記事数", value: articles.length.toString() }, { label: "カテゴリ", value: "6" }, { label: "投稿者", value: "4" }].map(({ label, value }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#3b6ecc", fontFamily: "'JetBrains Mono', monospace" }}>
                {value}
              </div>
              <div style={{ fontSize: "11px", color: "#c4cad4", marginTop: "2px" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* コンテンツ */}
      <div style={{ maxWidth: "1060px", margin: "0 auto", padding: "32px 24px 80px" }}>
        <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "28px" }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                background: activeCategory === cat ? "#3b6ecc" : "#fff",
                border: `1.5px solid ${activeCategory === cat ? "#3b6ecc" : "#e8edf2"}`,
                color: activeCategory === cat ? "#fff" : "#6b7280",
                borderRadius: "7px", padding: "6px 15px", fontSize: "13px",
                cursor: "pointer", fontFamily: "'Noto Sans JP', sans-serif",
                fontWeight: activeCategory === cat ? 700 : 400, transition: "all 0.14s",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
          <span style={{ fontSize: "13px", color: "#c4cad4", fontFamily: "'JetBrains Mono', monospace" }}>
            {filtered.length} articles
          </span>
          <div style={{ flex: 1, height: "1px", background: "#e8edf2" }} />
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#c4cad4" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔎</div>
            <div style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: "14px" }}>
              「{search}」に一致する記事は見つかりませんでした
            </div>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "14px",
          }}>
            {filtered.map((a) => <ArticleCard key={a.id} article={a} />)}
          </div>
        )}
      </div>

      <footer style={{
        background: "#fff", borderTop: "1px solid #e8edf2",
        padding: "24px", textAlign: "center",
      }}>
        <div style={{ fontSize: "12px", color: "#d1d5db", fontFamily: "'JetBrains Mono', monospace" }}>
          mc-cmd.wiki — マイクラコマンド相談所
        </div>
      </footer>
    </div>
  );
}
