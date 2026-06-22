import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { Send, Hash } from 'lucide-react'
import { api } from '@/api/client'
import { useAuthStore } from '@/store/authStore'

interface Channel { id: string; name: string; description: string }
interface Message { id: string; channelId: string; senderId: string; senderName: string; content: string; messageType: string; createdAt: string }

const PAGE_BG = '#131326'
const CARD_BG = '#13152e'
const INPUT_BG = '#1e2248'

function formatTime(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

export function ChatPage() {
  const { user } = useAuthStore()
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const stompRef = useRef<Client | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)

  const { data: channels = [] } = useQuery<Channel[]>({
    queryKey: ['chat-channels'],
    queryFn: () => api.get('/api/chat/channels').then(r => r.data),
  })

  // Load history when channel changes
  const loadHistory = useCallback(async (ch: Channel) => {
    try {
      const res = await api.get(`/api/chat/${ch.id}/history?size=50`)
      setMessages(res.data)
    } catch { setMessages([]) }
  }, [])

  // Auto-select first channel
  useEffect(() => {
    if (channels.length > 0 && !activeChannel) {
      setActiveChannel(channels[0])
    }
  }, [channels, activeChannel])

  // Load history on channel switch
  useEffect(() => {
    if (activeChannel) loadHistory(activeChannel)
  }, [activeChannel, loadHistory])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Connect WebSocket
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        // Subscription is set up when channel is active
      },
      onStompError: (frame) => console.error('STOMP error', frame),
    })
    client.activate()
    stompRef.current = client
    return () => { client.deactivate() }
  }, [])

  // Subscribe to active channel
  useEffect(() => {
    const client = stompRef.current
    if (!client || !activeChannel) return

    const trySubscribe = () => {
      if (!client.connected) return
      subscriptionRef.current?.unsubscribe()
      subscriptionRef.current = client.subscribe(
        `/topic/chat/${activeChannel.id}`,
        (frame) => {
          try {
            const msg: Message = JSON.parse(frame.body)
            setMessages(prev => [...prev, msg])
          } catch { /* ignore parse errors */ }
        }
      )
    }

    if (client.connected) {
      trySubscribe()
    } else {
      const orig = client.onConnect
      client.onConnect = (frame) => {
        orig?.call(client, frame)
        trySubscribe()
      }
    }

    return () => { subscriptionRef.current?.unsubscribe() }
  }, [activeChannel])

  function send() {
    const text = input.trim()
    if (!text || !activeChannel || !stompRef.current?.connected) return
    stompRef.current.publish({
      destination: `/app/chat/${activeChannel.id}`,
      body: JSON.stringify({ content: text }),
    })
    setInput('')
  }

  return (
    <div style={{ height: 'calc(100vh - 56px - 48px)', display: 'flex', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Channels sidebar */}
      <div style={{ width: 240, backgroundColor: CARD_BG, borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 style={{ color: 'white', fontWeight: 700, fontSize: 15, margin: 0 }}>Staff Chat</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '2px 0 0' }}>Team channels</p>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '6px 8px 4px' }}>Channels</p>
          {channels.map(ch => (
            <button key={ch.id} onClick={() => setActiveChannel(ch)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left',
                backgroundColor: activeChannel?.id === ch.id ? 'rgba(124,107,255,0.15)' : 'transparent',
                color: activeChannel?.id === ch.id ? 'var(--accent,#7c6bff)' : 'rgba(255,255,255,0.65)',
              }}
              onMouseEnter={e => { if (activeChannel?.id !== ch.id) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { if (activeChannel?.id !== ch.id) e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <Hash size={13} style={{ flexShrink: 0, opacity: 0.7 }} />
              <span style={{ fontSize: 13, fontWeight: activeChannel?.id === ch.id ? 600 : 400 }}>{ch.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      {activeChannel ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: PAGE_BG }}>
          {/* Channel header */}
          <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10, backgroundColor: CARD_BG }}>
            <Hash size={16} style={{ color: 'var(--accent,#7c6bff)' }} />
            <div>
              <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>{activeChannel.name}</span>
              {activeChannel.description && (
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginLeft: 12 }}>{activeChannel.description}</span>
              )}
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {messages.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(124,107,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Hash size={24} style={{ color: 'var(--accent,#7c6bff)' }} />
                </div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: 0 }}>No messages yet. Say hello!</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.senderId === user?.id
                const showHeader = i === 0 || messages[i - 1].senderId !== msg.senderId
                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', marginTop: showHeader ? 12 : 2 }}>
                    {showHeader && (
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                        <span style={{ color: isMe ? 'var(--accent,#7c6bff)' : '#a78bfa', fontWeight: 700, fontSize: 13 }}>{msg.senderName}</span>
                        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>{formatTime(msg.createdAt)}</span>
                      </div>
                    )}
                    <div style={{
                      maxWidth: '70%', padding: '8px 12px', borderRadius: showHeader ? '4px 16px 16px 16px' : '4px 16px 16px 4px',
                      backgroundColor: isMe ? 'rgba(var(--accent-rgb,124,107,255),0.15)' : 'rgba(255,255,255,0.06)',
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      ...(isMe && showHeader ? { borderRadius: '16px 4px 16px 16px' } : {}),
                      ...(isMe && !showHeader ? { borderRadius: '16px 4px 4px 16px' } : {}),
                    }}>
                      <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, margin: 0, lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.content}</p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', backgroundColor: CARD_BG }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ flex: 1, backgroundColor: INPUT_BG, borderRadius: 14, border: '1px solid rgba(255,255,255,0.10)', padding: '10px 14px' }}>
                <textarea
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                  placeholder={`Message #${activeChannel.name}`}
                  style={{ width: '100%', background: 'none', border: 'none', outline: 'none', color: 'white', fontSize: 14, resize: 'none', lineHeight: 1.5, maxHeight: 100, overflow: 'auto' }}
                />
              </div>
              <button onClick={send} disabled={!input.trim()}
                style={{
                  width: 42, height: 42, borderRadius: 12, border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: input.trim() ? 'linear-gradient(135deg,var(--accent,#7c6bff),var(--accent-dark,#6456e8))' : 'rgba(255,255,255,0.08)',
                  color: input.trim() ? 'white' : 'rgba(255,255,255,0.3)',
                  transition: 'all 0.15s',
                }}>
                <Send size={16} />
              </button>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, margin: '6px 0 0' }}>Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: PAGE_BG }}>
          <p style={{ color: 'rgba(255,255,255,0.3)' }}>Select a channel to start chatting</p>
        </div>
      )}
    </div>
  )
}
