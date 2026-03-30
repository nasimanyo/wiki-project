"use client";

// ============================================================
// app/editor/page.tsx          → 新規作成
// ============================================================

import { useState, useCallback, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

// ---- 型 ----
type Edition = "Java" | "Bedrock" | "両対応";

type FormState = {
  title: string;
  content: string;
  category: string;
  edition: Edition;
  tags: string[];
  tagInput: string;
  changeNote: string;
  isPublished: boolean;
};

const CATEGORIES = ["エンティティ", "ワールド", "アイテム", "ゲームルール", "座標・テレポート", "スコアボード", "その他"];
const EDITIONS: Edition[] = ["Java", "Bedrock", "両対応"];

const INITIAL_CONTENT = `## 概要

ここにコマンドの概要を書いてください。

## 基本構文

\`\`\`
/コマンド <引数>
\`\`\`

## 使い方

### 例1

\`\`\`
/コマンド 引数1 引数2
\`\`\`

説明を書いてください。

## 注意点

- 注意点1
- 注意点2`;

export default function EditorPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState<FormState>({
    title: "",
    content: INITIAL_CONTENT,
    category: CATEGORIES[0],
    edition: EDITIONS[0],
    tags: [],
    tagInput: "",
    changeNote: "",
    isPublished: false,
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/');
        return;
      }
      setUser(user);
    }
    getUser();
  }, [router]);

  const handleSave = useCallback(async () => {
    if (!user) return;

    const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const { data, error } = await supabase
      .from('articles')
      .insert({
        slug,
        title: form.title,
        content: form.content,
        category: form.category,
        tags: form.tags,
        edition: form.edition,
        author_id: user.id,
        is_published: form.isPublished,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving article:', error);
      alert('保存に失敗しました');
      return;
    }

    alert('記事を保存しました');
    router.push(`/articles/${slug}`);
  }, [form, user, router]);

  const addTag = useCallback(() => {
    if (form.tagInput.trim() && !form.tags.includes(form.tagInput.trim())) {
      setForm(prev => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: "",
      }));
    }
  }, [form.tagInput, form.tags]);

  const removeTag = useCallback((tagToRemove: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  }, []);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f9fc", fontFamily: "'Noto Sans JP', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        ::placeholder { color: #c4cad4; }
        input:focus, textarea:focus { outline: none; }
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
            <button
              onClick={() => router.push('/')}
              style={{
                background: "transparent", border: "1.5px solid #e8edf2",
                color: "#6b7280", borderRadius: "8px", padding: "7px 16px",
                fontSize: "13px", cursor: "pointer", fontFamily: "'Noto Sans JP', sans-serif",
              }}
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              style={{
                background: "#3b6ecc", border: "none", color: "#fff",
                borderRadius: "8px", padding: "7px 18px", fontSize: "13px",
                cursor: "pointer", fontWeight: 700, fontFamily: "'Noto Sans JP', sans-serif",
              }}
            >
              保存
            </button>
          </nav>
        </div>
      </header>

      {/* エディタ */}
      <div style={{ maxWidth: "1060px", margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "32px" }}>

          {/* メインエディタ */}
          <div>
            <div style={{ marginBottom: "24px" }}>
              <input
                type="text"
                placeholder="記事タイトル"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                style={{
                  width: "100%", background: "#fff",
                  border: "1.5px solid #e8edf2", borderRadius: "8px",
                  padding: "16px 18px", fontSize: "18px", fontWeight: 700,
                  color: "#111827", fontFamily: "'Noto Sans JP', sans-serif",
                  marginBottom: "16px",
                }}
              />

              <textarea
                placeholder="Markdownで記事を書いてください"
                value={form.content}
                onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                style={{
                  width: "100%", height: "600px", background: "#fff",
                  border: "1.5px solid #e8edf2", borderRadius: "8px",
                  padding: "16px 18px", fontSize: "14px", lineHeight: 1.6,
                  color: "#111827", fontFamily: "'JetBrains Mono', monospace",
                  resize: "vertical",
                }}
              />
            </div>
          </div>

          {/* サイドバー */}
          <div>
            <div style={{ background: "#fff", border: "1.5px solid #e8edf2", borderRadius: "12px", padding: "24px" }}>

              {/* カテゴリ */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{
                  display: "block", fontSize: "14px", fontWeight: 700,
                  color: "#111827", marginBottom: "8px",
                }}>カテゴリ</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                  style={{
                    width: "100%", background: "#f7f9fc",
                    border: "1.5px solid #e8edf2", borderRadius: "6px",
                    padding: "8px 12px", fontSize: "13px",
                    color: "#111827", fontFamily: "'Noto Sans JP', sans-serif",
                  }}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* エディション */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{
                  display: "block", fontSize: "14px", fontWeight: 700,
                  color: "#111827", marginBottom: "8px",
                }}>エディション</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {EDITIONS.map(edition => (
                    <button
                      key={edition}
                      onClick={() => setForm(prev => ({ ...prev, edition }))}
                      style={{
                        flex: 1, background: form.edition === edition ? "#3b6ecc" : "#f7f9fc",
                        border: `1.5px solid ${form.edition === edition ? "#3b6ecc" : "#e8edf2"}`,
                        color: form.edition === edition ? "#fff" : "#6b7280",
                        borderRadius: "6px", padding: "8px", fontSize: "12px",
                        cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {edition}
                    </button>
                  ))}
                </div>
              </div>

              {/* タグ */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{
                  display: "block", fontSize: "14px", fontWeight: 700,
                  color: "#111827", marginBottom: "8px",
                }}>タグ</label>
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <input
                    type="text"
                    placeholder="タグを追加"
                    value={form.tagInput}
                    onChange={(e) => setForm(prev => ({ ...prev, tagInput: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    style={{
                      flex: 1, background: "#f7f9fc",
                      border: "1.5px solid #e8edf2", borderRadius: "6px",
                      padding: "8px 12px", fontSize: "13px",
                      color: "#111827", fontFamily: "'JetBrains Mono', monospace",
                    }}
                  />
                  <button
                    onClick={addTag}
                    style={{
                      background: "#3b6ecc", border: "none", color: "#fff",
                      borderRadius: "6px", padding: "8px 12px", fontSize: "13px",
                      cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    追加
                  </button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {form.tags.map(tag => (
                    <span
                      key={tag}
                      onClick={() => removeTag(tag)}
                      style={{
                        background: "#e8f0fa", color: "#3b6ecc",
                        borderRadius: "4px", padding: "4px 8px", fontSize: "11px",
                        cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      #{tag} ×
                    </span>
                  ))}
                </div>
              </div>

              {/* 公開設定 */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  fontSize: "14px", fontWeight: 700, color: "#111827",
                  cursor: "pointer",
                }}>
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => setForm(prev => ({ ...prev, isPublished: e.target.checked }))}
                    style={{ width: "16px", height: "16px" }}
                  />
                  公開する
                </label>
              </div>

              {/* 変更ノート */}
              <div>
                <label style={{
                  display: "block", fontSize: "14px", fontWeight: 700,
                  color: "#111827", marginBottom: "8px",
                }}>変更ノート</label>
                <textarea
                  placeholder="変更内容の簡単な説明"
                  value={form.changeNote}
                  onChange={(e) => setForm(prev => ({ ...prev, changeNote: e.target.value }))}
                  style={{
                    width: "100%", height: "80px", background: "#f7f9fc",
                    border: "1.5px solid #e8edf2", borderRadius: "6px",
                    padding: "8px 12px", fontSize: "13px",
                    color: "#111827", fontFamily: "'Noto Sans JP', sans-serif",
                    resize: "vertical",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}