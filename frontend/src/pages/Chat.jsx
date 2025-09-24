// src/pages/Chat.jsx - Optimized Chat Component with Groq API Integration
import { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import { useToast } from '../components/Toast'

const Chat = () => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(`session_${Date.now()}_${Math.random().toString(36).substring(7)}`)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const { showToast } = useToast()

  useEffect(() => {
    setMessages([{
      id: 1,
      type: 'ai',
      content: `Hello! I'm your AI learning assistant powered by advanced language models.

I can help you with:

🧠 **Programming & Development**
• Code debugging and optimization
• Best practices and architecture
• Technology recommendations

📚 **Academic Subjects**
• Math, Science, Computer Science
• Concept explanations and tutorials
• Study strategies and techniques

🔍 **Research & Learning**
• Information gathering and analysis
• Problem-solving approaches
• General knowledge questions

What would you like to learn about today?`,
      timestamp: new Date()
    }])
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    
    const messageText = input.trim()
    if (!messageText || loading) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setIsTyping(true)

    try {
      console.log('Sending message to Groq API:', { message: messageText, sessionId })
      
      const response = await api.post('/chat/message', {
        message: messageText,
        sessionId: sessionId,
        context: "You are a helpful learning assistant. Please provide clear, well-structured, and educational responses. Use bullet points, examples, and step-by-step explanations when appropriate. Format your responses to be easy to read and understand."
      })

      console.log('Received response from Groq API:', response.data)

      // Process and format the AI response for better readability
      let aiContent = response.data.response || response.data.message || 'I received your message but had trouble generating a response.'
      
      // Enhance the response formatting
      aiContent = formatAIResponse(aiContent)

      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiContent,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiResponse])
      
    } catch (error) {
      console.error('Chat API error:', error)
      setIsTyping(false)
      
      let errorMessage = "I apologize, but I'm having trouble processing your message right now."
      
      if (error.response?.status === 429) {
        errorMessage = "I'm receiving too many requests. Please wait a moment before sending another message."
      } else if (error.response?.status === 500) {
        errorMessage = "I'm experiencing some technical difficulties. Please try rephrasing your question."
      } else if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
        errorMessage = "It looks like you're offline. Please check your internet connection."
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      
      showToast('Message failed to send', 'error')
      
      const errorResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: errorMessage,
        timestamp: new Date(),
        isError: true
      }

      setMessages(prev => [...prev, errorResponse])
    } finally {
      setLoading(false)
      setIsTyping(false)
      inputRef.current?.focus()
    }
  }

  const clearChat = () => {
    setMessages([{
      id: 1,
      type: 'ai',
      content: "Chat cleared! I'm ready to help you with a fresh start. What would you like to learn about?",
      timestamp: new Date()
    }])
    inputRef.current?.focus()
    showToast('Chat history cleared', 'info')
  }

  const formatAIResponse = (content) => {
    // Clean up the response and make it more structured
    let formatted = content

    // Add proper spacing around sections
    formatted = formatted.replace(/\n\n/g, '\n\n')
    
    // Format numbered lists better
    formatted = formatted.replace(/(\d+\.\s)/g, '\n$1')
    
    // Format bullet points consistently
    formatted = formatted.replace(/^[\*\-\•]\s/gm, '• ')
    
    // Add spacing before headers (lines that start with capital letter and end with colon)
    formatted = formatted.replace(/^([A-Z][^:\n]*:)$/gm, '\n**$1**\n')
    
    // Format code blocks better
    formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `\n\`\`\`${lang || ''}\n${code.trim()}\n\`\`\`\n`
    })
    
    // Clean up extra whitespace
    formatted = formatted.replace(/\n{3,}/g, '\n\n').trim()
    
    return formatted
  }

  const formatMessageContent = (content) => {
    // Enhanced markdown-like formatting for better readability
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600; color: #fff; display: inline-block; margin: 0.25rem 0;">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em style="font-style: italic; color: #e5e7eb;">$1</em>')
      .replace(/`(.*?)`/g, '<code style="background: #374151; color: #fbbf24; padding: 3px 8px; border-radius: 6px; font-family: \'JetBrains Mono\', \'Fira Code\', monospace; font-size: 0.9em; font-weight: 500;">$1</code>')
      
      // Format code blocks
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre style="background: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 1rem; margin: 1rem 0; overflow-x: auto;"><code style="color: #f3f4f6; font-family: \'JetBrains Mono\', \'Fira Code\', monospace; font-size: 0.9em; line-height: 1.5;">$2</code></pre>')
      
      // Format headers
      .replace(/^#{1,6}\s+(.+)$/gm, '<h4 style="font-weight: 600; color: #fff; margin: 1.5rem 0 0.75rem 0; font-size: 1.1em; padding-bottom: 0.5rem; border-bottom: 1px solid #374151;">$1</h4>')
      
      // Format bullet points with better styling
      .replace(/^•\s+(.+)$/gm, '<div style="display: flex; align-items: flex-start; margin: 0.5rem 0; padding-left: 0.5rem;"><span style="color: #4f46e5; margin-right: 0.75rem; margin-top: 0.1rem; font-weight: bold;">•</span><span style="flex: 1; line-height: 1.6;">$1</span></div>')
      
      // Format numbered lists
      .replace(/^(\d+)\.\s+(.+)$/gm, '<div style="display: flex; align-items: flex-start; margin: 0.5rem 0; padding-left: 0.5rem;"><span style="color: #4f46e5; margin-right: 0.75rem; margin-top: 0.1rem; font-weight: bold; min-width: 1.5rem;">$1.</span><span style="flex: 1; line-height: 1.6;">$2</span></div>')
      
      // Format paragraphs with proper spacing
      .replace(/\n\n/g, '</p><p style="margin: 1rem 0; line-height: 1.6;">')
      .replace(/^/, '<p style="margin: 1rem 0; line-height: 1.6;">')
      .replace(/$/, '</p>')
      
      // Clean up empty paragraphs
      .replace(/<p[^>]*><\/p>/g, '')
  }

  const suggestedQuestions = [
    "Explain React hooks with examples",
    "Help me understand async/await in JavaScript", 
    "What are the best practices for API design?",
    "How do I optimize database queries?",
    "Explain machine learning concepts"
  ]

  return (
    <div className="fade-in">
      <div className="chat-container">
        {/* Enhanced Header */}
        <div className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              position: 'relative',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem'
            }}>
              🤖
              <div style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#10b981',
                border: '2px solid #1a1a1a'
              }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
                AI Learning Assistant
              </h2>
              <p style={{ 
                margin: 0, 
                fontSize: '0.8rem', 
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10b981',
                  animation: 'pulse 2s infinite'
                }} />
                Online • Powered by Groq API
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ 
              fontSize: '0.8rem', 
              color: '#ccc',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>{messages.length - 1} messages</span>
            </div>
            <button
              onClick={clearChat}
              disabled={loading}
              className="btn btn-secondary"
              style={{ 
                padding: '0.5rem 1rem',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              🗑️ Clear
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="chat-messages">
          {messages.map(message => (
            <div key={message.id} className={`message ${message.type}`}>
              <div className="message-avatar" style={{
                background: message.type === 'ai' 
                  ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
                  : '#6b7280'
              }}>
                {message.type === 'ai' ? '🤖' : '👤'}
              </div>
              
              <div className="message-content" style={{
                ...(message.isError && {
                  borderColor: '#ef4444',
                  background: 'rgba(239, 68, 68, 0.1)'
                })
              }}>
                <div style={{ 
                  lineHeight: '1.6',
                  ...(message.type === 'ai' && {
                    dangerouslySetInnerHTML: { __html: formatMessageContent(message.content) }
                  })
                }}>
                  {message.type === 'user' ? message.content : null}
                  {message.type === 'ai' && (
                    <div dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }} />
                  )}
                </div>
                <div className="message-time" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '0.5rem'
                }}>
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                  {message.type === 'user' && !message.isError && (
                    <span style={{ 
                      fontSize: '0.7rem',
                      color: 'rgba(255,255,255,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      ✓ Sent
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="message ai">
              <div className="message-avatar" style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
              }}>
                🤖
              </div>
              <div className="message-content">
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#4f46e5',
                          animation: `bounce 1.4s infinite`,
                          animationDelay: `${i * 0.2}s`
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ color: '#ccc', fontSize: '0.9rem' }}>
                    AI is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Suggested Questions (only show when no conversation) */}
          {messages.length === 1 && (
            <div style={{ 
              margin: '2rem 0',
              padding: '1.5rem',
              background: '#222',
              borderRadius: '12px',
              border: '1px solid #333'
            }}>
              <h3 style={{ 
                fontSize: '1rem',
                fontWeight: '600',
                color: '#fff',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                💡 Try asking about:
              </h3>
              <div style={{ 
                display: 'grid',
                gap: '0.75rem'
              }}>
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(question)}
                    disabled={loading}
                    style={{
                      textAlign: 'left',
                      padding: '0.75rem 1rem',
                      background: '#2a2a2a',
                      border: '1px solid #404040',
                      borderRadius: '8px',
                      color: '#e5e7eb',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = '#4f46e5'
                      e.target.style.background = '#333'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = '#404040'
                      e.target.style.background = '#2a2a2a'
                    }}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="chat-input">
          <form onSubmit={sendMessage} className="chat-form">
            <div style={{ flex: 1, position: 'relative' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me about programming, learning strategies, or any topic you'd like to explore..."
                className="chat-textarea"
                disabled={loading}
                rows="1"
                style={{
                  minHeight: '44px',
                  maxHeight: '120px',
                  resize: 'none',
                  paddingRight: '3rem'
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage(e)
                  }
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                }}
              />
              {input.length > 0 && (
                <div style={{
                  position: 'absolute',
                  right: '0.75rem',
                  bottom: '0.75rem',
                  fontSize: '0.7rem',
                  color: '#888'
                }}>
                  {input.length}/2000
                </div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="btn btn-primary"
              style={{
                alignSelf: 'flex-end',
                padding: '0.75rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minWidth: '100px'
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Sending...
                </>
              ) : (
                <>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send
                </>
              )}
            </button>
          </form>
          
          {/* Footer Info */}
          <div style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.75rem',
            fontSize: '0.75rem',
            color: '#888'
          }}>
            <div>
              Press Enter to send • Shift+Enter for new line • Powered by Groq
            </div>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#10b981',
                animation: 'pulse 2s infinite'
              }} />
              Connected
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Chat;