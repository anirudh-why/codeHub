import React, { useRef, useEffect } from 'react';

function ChatPanel({ 
  messages, 
  newMessage, 
  setNewMessage, 
  sendMessage 
}) {
  const chatContainerRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col p-3">
      <div 
        ref={chatContainerRef} 
        className="flex-1 overflow-y-auto mb-3 space-y-3 custom-scrollbar"
        style={{ 
          scrollbarWidth: 'thin',
          maxHeight: 'calc(100vh - 200px)'
        }}
      >
        {messages.map((msg, index) => (
          <div key={index} className="bg-gray-700 rounded p-2">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span className="font-semibold">{msg.username}</span>
              <span>
                {new Date(msg.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
            <p className="text-sm break-words">{msg.message}</p>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 bg-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Type a message..."
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded text-sm"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatPanel; 