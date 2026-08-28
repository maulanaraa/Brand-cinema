import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, Sparkles } from 'lucide-react'
import { sendChatMessage, type ChatMessage } from '@/services/chatService'

/**
 * ChatWidget — tombol chat mengambang (pojok kanan bawah) yang membuka panel
 * percakapan. Terhubung ke POST /api/chat (chatbot RAG).
 * Dipasang di Layout.tsx agar muncul di seluruh halaman publik/pengguna.
 */

const QUICK_PROMPTS = [
  'Film apa saja yang sedang tayang?',
  'Bagaimana cara memesan tiket?',
  'Bagaimana kebijakan refund?',
  'Metode pembayaran apa saja?',
]

const GREETING =
  'Halo! Saya asisten Brand Cinemas. Ada yang bisa saya bantu seputar film, jadwal, atau pemesanan tiket?'

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: GREETING },
  ])

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150)
  }, [open])

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return

      const userMsg: ChatMessage = { role: 'user', content: trimmed }
      const history = messages.filter((_, i) => i > 0)

      setMessages((prev) => [...prev, userMsg])
      setInput('')
      setLoading(true)

      try {
        const reply = await sendChatMessage(trimmed, history)
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              'Maaf, terjadi kendala saat menghubungi asisten. Silakan coba lagi sebentar lagi.',
          },
        ])
      } finally {
        setLoading(false)
      }
    },
    [loading, messages],
  )

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    send(input)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Tutup obrolan' : 'Buka obrolan bantuan'}
        className="fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full
                   bg-[#D5A527] text-dark-950 shadow-lg shadow-[#D5A527]/30
                   transition-transform duration-200 hover:scale-105 active:scale-95
                   focus:outline-none focus-visible:ring-4 focus-visible:ring-[#D5A527]/40"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {open && (
        <div
          className="fixed bottom-24 right-5 z-[60] flex w-[calc(100vw-2.5rem)] max-w-[380px]
                     flex-col overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] shadow-2xl
                     animate-slide-up dark:border-white/10 dark:bg-dark-900
                     sm:w-[380px]"
          style={{ height: 'min(70vh, 560px)' }}
          role="dialog"
          aria-label="Asisten Brand Cinemas"
        >
          <div className="flex items-center gap-3 bg-dark-950 px-4 py-3 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D5A527] text-dark-950">
              <Sparkles size={18} />
            </div>
            <div className="leading-tight">
              <p className="font-display text-sm font-semibold">Asisten Brand Cinemas</p>
              <p className="flex items-center gap-1.5 text-xs text-white/60">
                <span className="h-1.5 w-1.5 rounded-full bg-[#D5A527]" />
                Online
              </p>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto bg-[var(--surface-muted)] px-3 py-4 dark:bg-dark-950/40"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'rounded-br-sm bg-[#D5A527] text-dark-950'
                      : 'rounded-bl-sm bg-[var(--surface-raised)] text-[var(--text-primary)] shadow-sm dark:bg-dark-800 dark:text-slate-100'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-[var(--surface-raised)] px-4 py-3 shadow-sm dark:bg-dark-800">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-dark-400 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-dark-400 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-dark-400" />
                </div>
              </div>
            )}

            {messages.length === 1 && !loading && (
              <div className="space-y-2 pt-1">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    className="block w-full rounded-xl border border-[#D5A527]/30 bg-[var(--surface-raised)] px-3 py-2 text-left
                               text-sm text-[var(--text-primary)] transition-colors hover:border-[#D5A527] hover:bg-[var(--surface-card)]
                               dark:bg-dark-800 dark:text-slate-200 dark:hover:bg-dark-800/60"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={onSubmit}
            className="flex items-center gap-2 border-t border-[var(--border-soft)] bg-[var(--surface-card)] px-3 py-2.5 dark:border-white/10 dark:bg-dark-900"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tulis pertanyaan…"
              maxLength={1000}
              className="flex-1 bg-transparent px-2 py-1.5 text-sm text-[var(--text-primary)] outline-none
                         placeholder:text-[var(--text-secondary)] dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Kirim pesan"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D5A527] text-dark-950
                         transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
