

// ## 4. Enhanced AI Chat Component with Context Awareness
// ```javascript
// Enhanced Chat Component with Context Awareness
const Chat = () => {
    const [messages, setMessages] = useState([
        { 
            type: 'ai', 
            content: "Hello! I'm your AI learning assistant powered by GROQ. I can help you with programming, technology, academic subjects, and guide your learning journey. What would you like to explore today?",
            timestamp: new Date().toISOString()
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [chatMode, setChatMode] = useState('general'); // 'general', 'tutor', 'code', 'pdf'
    const [context, setContext] = useState({});
    const [sessionId] = useState(`session_${Date.now()}`);
    const [uploadedPDF, setUploadedPDF] = useState(null);
    const [pdfUploading, setPdfUploading] = useState(false);

    const chatModes = [
        { value: 'general', label: 'General Chat', icon: 'comments', description: 'Ask anything about learning and technology' },
        { value: 'tutor', label: 'Learning Tutor', icon: 'graduation-cap', description: 'Structured learning assistance' },
        { value: 'code', label: 'Code Helper', icon: 'code', description: 'Programming help and debugging' },
        { value: 'pdf', label: 'PDF Chat', icon: 'file-pdf', description: 'Chat with your uploaded documents' }
    ];

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { 
            type: 'user', 
            content: input,
            timestamp: new Date().toISOString(),
            mode: chatMode
        };

        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setLoading(true);

        try {
            // Build context based on chat mode and recent messages
            const chatContext = {
                mode: chatMode,
                sessionId,
                previousMessages: messages.slice(-5), // Last 5 messages for context
                userPreferences: {
                    learningLevel: 'intermediate', // Could be from user profile
                    interests: ['programming', 'technology']
                },
                currentTopic: extractTopic(messages),
                ...context
            };

            if (chatMode === 'pdf' && uploadedPDF) {
                const response = await api.chatWithPDF(uploadedPDF.id, currentInput);
                setMessages(prev => [...prev, { 
                    type: 'ai', 
                    content: response.response,
                    timestamp: new Date().toISOString(),
                    mode: chatMode,
                    source: 'pdf',
                    pdfPage: response.pageNumber
                }]);
            } else {
                const response = await api.sendChatMessage(currentInput, chatContext);
                setMessages(prev => [...prev, { 
                    type: 'ai', 
                    content: response.response,
                    timestamp: new Date().toISOString(),
                    mode: chatMode,
                    provider: response.provider
                }]);
            }
        } catch (error) {
            console.log('Using enhanced fallback response due to:', error.message);
            
            // Enhanced fallback responses based on mode
            const fallbackResponse = generateContextualFallback(currentInput, chatMode, messages);
            setMessages(prev => [...prev, { 
                type: 'ai', 
                content: fallbackResponse,
                timestamp: new Date().toISOString(),
                mode: chatMode,
                provider: 'fallback'
            }]);
        } finally {
            setLoading(false);
        }
    };

    const extractTopic = (msgs) => {
        // Simple topic extraction from recent messages
        const recentContent = msgs.slice(-3).map(m => m.content).join(' ').toLowerCase();
        const topics = ['javascript', 'python', 'react', 'css', 'html', 'nodejs', 'database', 'ai', 'machine learning'];
        return topics.find(topic => recentContent.includes(topic)) || 'general';
    };

    const generateContextualFallback = (input, mode, msgs) => {
        const lowerInput = input.toLowerCase();
        
        const responses = {
            general: [
                "That's a fascinating question about technology! While I'm experiencing some technical issues with my AI systems, I'd love to help you explore this topic further.",
                "I can see you're interested in learning more about that subject. Even though my AI services are temporarily unavailable, I can guide you toward some excellent learning resources.",
                "Your question touches on some important concepts! While I'm currently having connectivity issues, let me share what I know about this topic."
            ],
            tutor: [
                "As your learning tutor, I want to break this down systematically for you. While my advanced AI features are temporarily unavailable, let's approach this step-by-step.",
                "That's an excellent learning question! Even though I'm experiencing some technical difficulties, I can help structure your learning approach to this topic.",
                "From a teaching perspective, this is a great area to explore. Let me guide you through the fundamentals, even while my AI systems are being restored."
            ],
            code: [
                "Looking at your code question, this involves some key programming concepts. While my AI analysis tools are temporarily down, I can share some general programming principles that apply here.",
                "That's a solid coding question! Even though I can't access my advanced debugging features right now, let me suggest some approaches to solve this type of problem.",
                "From a development standpoint, this is an interesting challenge. While my code analysis is offline, I can point you toward debugging strategies and best practices."
            ],
            pdf: [
                "I'd love to help analyze your document, but I'm currently experiencing issues with my PDF processing capabilities. You might try asking specific questions about the content.",
                "While my document analysis features are temporarily unavailable, I can still help you with general questions about the subject matter.",
                "My PDF chat functionality is currently offline, but I'm happy to assist with related questions about the topic or field your document covers."
            ]
        };

        // Context-aware response selection
        const modeResponses = responses[mode] || responses.general;
        let selectedResponse = modeResponses[Math.floor(Math.random() * modeResponses.length)];

        // Add topic-specific context if detected
        const currentTopic = extractTopic([...msgs, { content: input }]);
        if (currentTopic !== 'general') {
            selectedResponse += ` Since we're discussing ${currentTopic}, I can share that this is a fundamental technology with many practical applications.`;
        }

        return selectedResponse;
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handlePDFUpload = async (event) => {
        const file = event.target.files[0];
        if (!file || file.type !== 'application/pdf') {
            alert('Please select a valid PDF file');
            return;
        }

        setPdfUploading(true);
        try {
            const response = await api.uploadPDF(file);
            setUploadedPDF({
                id: response.id,
                name: file.name,
                size: file.size
            });
            setChatMode('pdf');
            setMessages(prev => [...prev, {
                type: 'ai',
                content: `Great! I've uploaded "${file.name}". Now you can ask me questions about the content of this PDF document. What would you like to know?`,
                timestamp: new Date().toISOString(),
                mode: 'pdf'
            }]);
        } catch (error) {
            alert('Error uploading PDF. Please try again.');
        } finally {
            setPdfUploading(false);
        }
    };

    const clearChat = () => {
        setMessages([{
            type: 'ai', 
            content: `Chat cleared! I'm ready to help you with ${chatModes.find(m => m.value === chatMode)?.description.toLowerCase()}. What can I assist you with?`,
            timestamp: new Date().toISOString()
        }]);
        setContext({});
    };

    const exportChat = () => {
        const chatData = {
            sessionId,
            mode: chatMode,
            messages,
            exportedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `learnify-chat-${sessionId}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="chat">
            <div className="chat-header">
                <div className="header-content">
                    <h1>AI Learning Assistant</h1>
                    <p>Powered by GROQ AI - Ask questions, get tutoring, upload PDFs, and more</p>
                </div>
                
                {/* Chat Mode Selector */}
                <div className="chat-modes">
                    {chatModes.map(mode => (
                        <button
                            key={mode.value}
                            className={`mode-btn ${chatMode === mode.value ? 'active' : ''}`}
                            onClick={() => setChatMode(mode.value)}
                            title={mode.description}
                        >
                            <i className={`fas fa-${mode.icon}`}></i>
                            <span>{mode.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="chat-container">
                {/* Chat Actions Bar */}
                <div className="chat-actions">
                    {chatMode === 'pdf' && (
                        <div className="pdf-upload">
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handlePDFUpload}
                                id="pdf-upload"
                                style={{display: 'none'}}
                            />
                            <label htmlFor="pdf-upload" className="upload-btn">
                                <i className="fas fa-upload"></i>
                                {pdfUploading ? 'Uploading...' : 'Upload PDF'}
                            </label>
                            {uploadedPDF && (
                                <div className="uploaded-pdf">
                                    <i className="fas fa-file-pdf"></i>
                                    <span>{uploadedPDF.name}</span>
                                </div>
                            )}
                        </div>
                    )}
                    
                    <div className="action-buttons">
                        <button className="action-btn" onClick={clearChat} title="Clear chat">
                            <i className="fas fa-trash"></i>
                        </button>
                        <button className="action-btn" onClick={exportChat} title="Export chat">
                            <i className="fas fa-download"></i>
                        </button>
                    </div>
                </div>

                <div className="messages">
                    {messages.map((message, idx) => (
                        <div key={idx} className={`message ${message.type}`}>
                            <div className="message-avatar">
                                <i className={`fas fa-${
                                    message.type === 'user' 
                                        ? 'user' 
                                        : message.mode === 'pdf' 
                                            ? 'file-pdf' 
                                            : message.mode === 'code' 
                                                ? 'code' 
                                                : message.mode === 'tutor'
                                                    ? 'graduation-cap'
                                                    : 'robot'
                                }`}></i>
                            </div>
                            <div className="message-content">
                                <div className="message-text">
                                    {message.content}
                                </div>
                                <div className="message-meta">
                                    <span className="timestamp">
                                        {new Date(message.timestamp).toLocaleTimeString()}
                                    </span>
                                    {message.mode && (
                                        <span className="mode-tag">{message.mode}</span>
                                    )}
                                    {message.provider && (
                                        <span className="provider-tag">{message.provider}</span>
                                    )}
                                    {message.pdfPage && (
                                        <span className="page-ref">Page {message.pdfPage}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {loading && (
                        <div className="message ai">
                            <div className="message-avatar">
                                <i className="fas fa-robot"></i>
                            </div>
                            <div className="message-content">
                                <div className="typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                                <div className="loading-text">
                                    {chatMode === 'pdf' ? 'Analyzing document...' :
                                     chatMode === 'code' ? 'Processing code...' :
                                     chatMode === 'tutor' ? 'Preparing lesson...' :
                                     'Thinking...'}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="chat-input">
                    <div className="input-container">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={
                                chatMode === 'general' ? 'Ask me anything about learning...' :
                                chatMode === 'tutor' ? 'What topic would you like to learn?' :
                                chatMode === 'code' ? 'Describe your coding problem...' :
                                chatMode === 'pdf' ? 'Ask questions about your uploaded PDF...' :
                                'Ask me anything...'
                            }
                            rows="3"
                            disabled={loading}
                        />
                        <button 
                            className="send-btn"
                            onClick={sendMessage}
                            disabled={loading || !input.trim() || (chatMode === 'pdf' && !uploadedPDF)}
                        >
                            <i className="fas fa-paper-plane"></i>
                        </button>
                    </div>
                    
                    {chatMode === 'pdf' && !uploadedPDF && (
                        <div className="input-hint">
                            <i className="fas fa-info-circle"></i>
                            Upload a PDF document first to start chatting with it
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};