import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import io from 'socket.io-client';
import { auth } from '../firebaseConfig';
import { toast } from 'react-hot-toast';
import { FiUsers, FiMessageSquare, FiCopy, FiSearch, FiEdit2, FiEye, FiPlay, FiFolder, FiChevronRight, FiChevronDown, FiFile, FiPlusCircle, FiTrash2 } from 'react-icons/fi';


function CodeEditor() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState('// Write your code here');
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [userRole, setUserRole] = useState('viewer');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedTab, setSelectedTab] = useState('chat');
  const [isSearching, setIsSearching] = useState(false);
  const [joinTimestamp, setJoinTimestamp] = useState(null);
  const [cursorDecorations, setCursorDecorations] = useState({});
  const [showCursors, setShowCursors] = useState(true);
  const editorRef = useRef(null);
  const chatContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const monacoRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [showOutput, setShowOutput] = useState(false);
  const [filesStructure, setFilesStructure] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [activeFile, setActiveFile] = useState(null);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileParent, setNewFileParent] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParent, setNewFolderParent] = useState('');
  const [localCode, setLocalCode] = useState('');
  const [ignoreNextChange, setIgnoreNextChange] = useState(false);
  const [customTheme, setCustomTheme] = useState(null);
  const [usersTyping, setUsersTyping] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Get current user
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Set join timestamp when user joins
    setJoinTimestamp(new Date());

    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    setShareLink(`${window.location.origin}/editor/${roomId}`);

    // Join room with user data
    newSocket.emit('joinRoom', { 
      roomId,
      user: {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      }
    });

    // Handle remote code updates
    newSocket.on('codeUpdate', (updatedCode) => {
      setCode(updatedCode);
    });

    // Handle room data updates
    newSocket.on('roomData', (roomData) => {
      setRoom(roomData);
      // Set user role
      const currentUser = roomData.users.find(u => u.email === user.email);
      if (currentUser) {
        setUserRole(currentUser.role);
      }
      
      // Set messages - only get messages after join time
      if (roomData.messages && roomData.messages.length > 0 && joinTimestamp) {
        const filteredMessages = roomData.messages.filter(
          msg => new Date(msg.timestamp) >= joinTimestamp
        );
        setChatMessages(filteredMessages);
      }
    });

    // Handle active users updates
    newSocket.on('activeUsers', (users) => {
      setActiveUsers(users);
    });

    // Handle remote cursor updates
    newSocket.on('remoteCursor', (data) => {
      if (data && data.userId !== user?._id && showCursors) {
        updateCursorDecoration(
          data.userId, 
          data.username || "Anonymous", 
          data.position
        );
      }
    });

    // Handle chat messages
    newSocket.on('message', (message) => {
      // Only add messages that arrived after joining
      if (joinTimestamp && new Date(message.timestamp) >= joinTimestamp) {
      setChatMessages(prev => [...prev, message]);
        // Auto scroll to bottom when new message arrives
        if (chatContainerRef.current) {
          setTimeout(() => {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }, 100);
        }
      }
    });

    // Fetch room data
    fetch(`http://localhost:5000/api/rooms/${roomId}`)
      .then(res => {
        if (!res.ok) throw new Error('Room not found');
        return res.json();
      })
      .then(data => {
        setRoom(data);
        setCode(data.code || '// Write your code here');
        
        // Set user role
        const currentUser = data.users.find(u => u.email === user.email);
        if (currentUser) {
          setUserRole(currentUser.role);
        }
      })
      .catch(err => {
        console.error('Error fetching room:', err);
        toast.error('Error loading workspace. Please try again.');
        navigate('/dashboard');
      });

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
      
      // Clear cursor decorations when unmounting
      if (editorRef.current) {
        Object.values(cursorDecorations).forEach(decorationIds => {
          if (decorationIds.length) {
            editorRef.current.deltaDecorations(decorationIds, []);
          }
        });
      }
    };
  }, [roomId, navigate, user]);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatContainerRef.current && selectedTab === 'chat') {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, selectedTab]);

  // Handle cursor visibility changes
  useEffect(() => {
    if (!editorRef.current) return;
    
    // If cursors are turned off, clear all decorations
    if (!showCursors) {
      Object.entries(cursorDecorations).forEach(([userId, decorationIds]) => {
        if (decorationIds && decorationIds.length) {
          editorRef.current.deltaDecorations([decorationIds], []);
        }
      });
      setCursorDecorations({});
    }
  }, [showCursors, cursorDecorations]);

  // Generate unique color based on user ID
  const generateUserColor = (userId) => {
    // Simple hash function to generate a consistent color for each user
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Convert to HSL color with high saturation and lightness
    // to ensure visibility and distinctiveness
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 70%, 60%)`;
  };

  // Update cursor decoration for a specific user
  const updateCursorDecoration = (userId, username, position) => {
    if (!editorRef.current || userId === user?._id || !monacoRef.current) return;
    
    // Remove old decoration if it exists
    if (cursorDecorations[userId]) {
      editorRef.current.deltaDecorations([cursorDecorations[userId]], []);
    }
    
    try {
      const model = editorRef.current.getModel();
      if (!model) return;
      
      // Convert position to Monaco position
      const monacoPosition = {
        lineNumber: position.lineNumber,
        column: position.column
      };
      
      // Create decoration
      const userColor = generateUserColor(userId);
      const decorations = editorRef.current.deltaDecorations(
        [],
        [
          {
            range: new monacoRef.current.Range(
              monacoPosition.lineNumber,
              monacoPosition.column,
              monacoPosition.lineNumber,
              monacoPosition.column
            ),
            options: {
              className: 'remote-cursor',
              hoverMessage: { value: username },
              beforeContentClassName: 'remote-cursor-widget',
              before: {
                content: '|',
                inlineClassName: `remote-cursor-${userId.substring(0, 8)}`,
              }
            }
          }
        ]
      );
      
      // Add custom style for this cursor if not already added
      const styleId = `cursor-style-${userId.substring(0, 8)}`;
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          .remote-cursor-${userId.substring(0, 8)} {
            color: ${userColor} !important;
            font-weight: bold;
            position: relative;
          }
          .remote-cursor-${userId.substring(0, 8)}::after {
            content: "${username}";
            position: absolute;
            top: -20px;
            left: 0;
            font-size: 12px;
            white-space: nowrap;
            background-color: ${userColor};
            color: white;
            padding: 2px 4px;
            border-radius: 2px;
            z-index: 10;
          }
        `;
        document.head.appendChild(style);
      }
      
      // Store the new decoration ID
      setCursorDecorations((prev) => ({
        ...prev,
        [userId]: decorations[0]
      }));
    } catch (error) {
      console.error("Error updating cursor decoration:", error);
    }
  };

  // Search for users
  const searchUsers = async () => {
    if (!searchQuery || searchQuery.length < 3) {
      toast.error('Please enter at least 3 characters');
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`http://localhost:5000/api/users/search?query=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Search failed');
      }
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error(`Error searching users: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  // Add user to room
  const addUserToRoom = async (userEmail, displayName, photoURL, role) => {
    try {
      const response = await fetch(`http://localhost:5000/api/rooms/${roomId}/addUser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email: userEmail, 
          role, 
          displayName, 
          photoURL 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add user');
      }
      
      const data = await response.json();
      setRoom(data);
      toast.success(`User added as ${role}`);
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error(`Error adding user: ${error.message}`);
    }
  };

  // Change user role
  const changeUserRole = (email, newRole) => {
    if (!socket) return;
    
    socket.emit('changeUserRole', { roomId, email, newRole });
    toast.success(`Changed user role to ${newRole}`);
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Set up cursor position tracking
    editor.onDidChangeCursorPosition((e) => {
      if (socket && room) {
        socket.emit('cursorPosition', {
          roomId: room._id,
          userId: user?._id,
          username: user?.username,
          position: e.position
        });
      }
    });

    // Set up content change listener
    editor.onDidChangeModelContent((e) => {
      const code = editor.getValue();
      setLocalCode(code);
      
      if (!ignoreNextChange && socket && room) {
        socket.emit('codeUpdate', {
          roomId: room._id,
          code: code
        });
      }
      
      if (ignoreNextChange) {
        setIgnoreNextChange(false);
      }
    });

    // Apply custom theme if available
    if (customTheme) {
      monaco.editor.defineTheme('customTheme', customTheme);
      monaco.editor.setTheme('customTheme');
    }
  };

  const handleCodeChange = (value) => {
    // Only allow code changes if user is admin or editor
    if (userRole === 'admin' || userRole === 'editor') {
    setCode(value);
      socket?.emit('codeChange', { roomId, code: value, userRole });
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket) {
      const messageData = {
        roomId,
        message: newMessage.trim()
      };
      console.log('Sending message:', messageData);
      socket.emit('chatMessage', messageData);
      setNewMessage('');
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success('Link copied to clipboard!');
  };

  // Get role display text and icon
  const getRoleDisplay = (role) => {
    switch (role) {
      case 'admin':
        return { text: 'Admin', icon: <FiUsers style={{ color: darkPurpleTheme.error }} /> };
      case 'editor':
        return { text: 'Editor', icon: <FiEdit2 style={{ color: darkPurpleTheme.success }} /> };
      case 'viewer':
        return { text: 'Viewer', icon: <FiEye style={{ color: darkPurpleTheme.secondary }} /> };
      default:
        return { text: role, icon: null };
    }
  };

  // Get role color
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return darkPurpleTheme.error;
      case 'editor':
        return darkPurpleTheme.success;
      case 'viewer':
        return darkPurpleTheme.secondary;
      default:
        return darkPurpleTheme.textSecondary;
    }
  };

  // Function to run the code
  const runCode = async () => {
    setIsRunning(true);
    setShowOutput(true);
    setOutput('Running code...');
    
    try {
      const response = await fetch('http://localhost:5000/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code,
          language: room.language
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute code');
      }
      
      const result = await response.json();
      setOutput(result.output);
    } catch (error) {
      console.error('Error executing code:', error);
      setOutput(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Fetch file structure when room changes
  useEffect(() => {
    if (room && room._id) {
      fetchFileStructure();
    }
  }, [room]);

  // Fetch file structure from server
  const fetchFileStructure = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/rooms/${roomId}/files`);
      if (!response.ok) {
        throw new Error('Failed to fetch file structure');
      }
      const data = await response.json();
      setFilesStructure(data);
      
      // Set active file if not set yet and files exist
      if (!activeFile && data.length > 0) {
        const firstFile = findFirstFile(data);
        if (firstFile) {
          setActiveFile(firstFile);
          loadFileContent(firstFile._id);
        }
      }
    } catch (error) {
      console.error('Error fetching file structure:', error);
      toast.error('Error loading workspace files');
    }
  };
  
  // Find the first file in the folder structure
  const findFirstFile = (items) => {
    for (let item of items) {
      if (item.type === 'file') {
        return item;
      } else if (item.type === 'folder' && item.children && item.children.length > 0) {
        const file = findFirstFile(item.children);
        if (file) return file;
      }
    }
    return null;
  };

  // Load file content
  const loadFileContent = async (fileId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/files/${fileId}`);
      if (!response.ok) {
        throw new Error('Failed to load file content');
      }
      const data = await response.json();
      setCode(data.content);
    } catch (error) {
      console.error('Error loading file:', error);
      toast.error('Error loading file');
    }
  };

  // Save file content
  const saveFileContent = async () => {
    if (!activeFile) return;
    
    try {
      await fetch(`http://localhost:5000/api/files/${activeFile._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: code })
      });
      toast.success('File saved');
    } catch (error) {
      console.error('Error saving file:', error);
      toast.error('Error saving file');
    }
  };

  // Toggle folder expansion
  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  // Create new file
  const createNewFile = async (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/rooms/${roomId}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: newFileName,
          type: 'file',
          parent: newFileParent || null,
          content: ''
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create file');
      }
      
      await fetchFileStructure();
      setNewFileName('');
      setIsCreatingFile(false);
      toast.success('File created');
    } catch (error) {
      console.error('Error creating file:', error);
      toast.error('Error creating file');
    }
  };

  // Create new folder
  const createNewFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/rooms/${roomId}/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: newFolderName,
          parent: newFolderParent || null
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create folder');
      }
      
      await fetchFileStructure();
      setNewFolderName('');
      setIsCreatingFolder(false);
      toast.success('Folder created');
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Error creating folder');
    }
  };

  // Delete file or folder
  const deleteFileOrFolder = async (item) => {
    if (!window.confirm(`Are you sure you want to delete ${item.name}?`)) return;
    
    try {
      const endpoint = item.type === 'file' ? 'files' : 'folders';
      const response = await fetch(`http://localhost:5000/api/${endpoint}/${item._id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete ${item.type}`);
      }
      
      if (activeFile && activeFile._id === item._id) {
        setActiveFile(null);
        setCode('');
      }
      
      await fetchFileStructure();
      toast.success(`${item.type} deleted`);
    } catch (error) {
      console.error(`Error deleting ${item.type}:`, error);
      toast.error(`Error deleting ${item.type}`);
    }
  };

  // Render file tree structure recursively
  const renderFileTree = (items, level = 0) => {
    return items.map(item => {
      const isFolder = item.type === 'folder';
      const isExpanded = expandedFolders[item._id];
      const isActive = activeFile && activeFile._id === item._id;
      
      return (
        <div key={item._id} style={{ paddingLeft: `${level * 12}px` }}>
          <div 
            className={`flex items-center p-1 hover:bg-gray-700 rounded ${isActive ? 'bg-gray-700' : ''}`}
          >
            {isFolder ? (
              <button 
                onClick={() => toggleFolder(item._id)} 
                className="p-1 text-gray-400 hover:text-white"
              >
                {isExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
              </button>
            ) : (
              <FiFile size={14} className="ml-1 mr-1 text-gray-400" />
            )}
            
            <div 
              className={`flex-1 text-sm truncate cursor-pointer ml-1 ${isFolder ? 'font-medium' : ''}`}
              onClick={() => {
                if (isFolder) {
                  toggleFolder(item._id);
                } else {
                  setActiveFile(item);
                  loadFileContent(item._id);
                }
              }}
            >
              {item.name}
            </div>
            
            {userRole !== 'viewer' && (
              <button
                onClick={() => deleteFileOrFolder(item)}
                className="p-1 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100"
                title={`Delete ${isFolder ? 'folder' : 'file'}`}
              >
                <FiTrash2 size={14} />
              </button>
            )}
          </div>
          
          {isFolder && isExpanded && item.children && item.children.length > 0 && (
            <div className="ml-2">
              {renderFileTree(item.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  // Toggle cursors visibility
  const toggleCursors = () => {
    const newShowCursors = !showCursors;
    setShowCursors(newShowCursors);
    
    // If turning off cursors, remove all decorations
    if (!newShowCursors) {
      if (editorRef.current) {
        Object.values(cursorDecorations).forEach(decorations => {
          if (decorations.length) {
            editorRef.current.deltaDecorations(decorations, []);
          }
        });
        setCursorDecorations({});
      }
    } else {
      // If turning on cursors, refresh all cursor decorations from the activeUsers data
      if (socket && activeUsers) {
        Object.values(activeUsers).forEach(userData => {
          if (userData && userData.cursorPosition && userData.userId !== user?._id) {
            updateCursorDecoration(
              userData.userId, 
              userData.displayName || "Anonymous", 
              userData.cursorPosition
            );
          }
        });
      }
    }
  };

  useEffect(() => {
    if (socket && room) {
      socket.on('connect', () => {
        console.log('Connected to socket server');
        socket.emit('joinRoom', { roomId: room._id });
      });

      socket.on('codeUpdate', (data) => {
        if (editorRef.current) {
          setIgnoreNextChange(true);
          editorRef.current.setValue(data.code || data);
        }
      });

      socket.on('roomData', (data) => {
        console.log('Received roomData update:', data);
        setRoom(data);
        
        // Update current user's role from the updated room data
        const currentUser = data.users.find(u => u.email === user.email);
        if (currentUser) {
          setUserRole(currentUser.role);
          console.log('Updated user role:', currentUser.role);
        }
        
        // Set messages if they exist
        if (data.messages && data.messages.length > 0 && joinTimestamp) {
          const filteredMessages = data.messages.filter(
            msg => new Date(msg.timestamp) >= joinTimestamp
          );
          setChatMessages(filteredMessages);
        }
      });
      
      socket.on('activeUsers', (data) => {
        setActiveUsers(data);
      });
      
      socket.on('remoteCursor', (data) => {
        if (data && data.userId !== user?._id && showCursors) {
          updateCursorDecoration(
            data.userId, 
            data.username || "Anonymous", 
            data.position
          );
        }
      });

      socket.on('message', (message) => {
        console.log('Received chat message:', message);
        setChatMessages(prev => [...prev, message]);
        // Auto scroll to bottom when new message arrives
        if (chatContainerRef.current) {
          setTimeout(() => {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }, 100);
        }
      });

      // Handle typing indicators
      socket.on('userTyping', ({ userId, username }) => {
        if (userId !== user?._id) {
          setUsersTyping(prev => ({
            ...prev,
            [userId]: username
          }));
        }
      });

      socket.on('userStoppedTyping', ({ userId }) => {
        if (userId !== user?._id) {
          setUsersTyping(prev => {
            const newState = { ...prev };
            delete newState[userId];
            return newState;
          });
        }
      });

      return () => {
        socket.off('connect');
        socket.off('codeUpdate');
        socket.off('roomData');
        socket.off('activeUsers');
        socket.off('remoteCursor');
        socket.off('message');
        socket.off('userTyping');
        socket.off('userStoppedTyping');
      };
    }
  }, [socket, room, showCursors, user, joinTimestamp]);

  // Add useEffect to apply custom theme
  useEffect(() => {
    setCustomTheme({
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: darkPurpleTheme.textSecondary },
        { token: 'keyword', foreground: darkPurpleTheme.accent }
      ],
      colors: {
        'editor.background': darkPurpleTheme.background,
        'editor.foreground': darkPurpleTheme.foreground,
        'editorCursor.foreground': darkPurpleTheme.primary,
        'editor.lineHighlightBackground': darkPurpleTheme.surfaceLight,
        'editorLineNumber.foreground': darkPurpleTheme.textSecondary,
        'editor.selectionBackground': `${darkPurpleTheme.primary}50`,
        'editor.inactiveSelectionBackground': `${darkPurpleTheme.primary}30`,
      }
    });
  }, []);

  // Define a new dark theme with purple accents instead of indigo
  const darkPurpleTheme = {
    background: '#1a1a2e',
    foreground: '#e6e6e6',
    primary: '#7b2cbf',
    secondary: '#9d4edd',
    accent: '#c77dff',
    success: '#38b000',
    warning: '#f48c06',
    error: '#e63946',
    surface: '#16213e',
    surfaceLight: '#1f305e',
    border: '#424242',
    textPrimary: '#ffffff',
    textSecondary: '#b0b0b0',
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (!isTyping && socket && room) {
      setIsTyping(true);
      socket.emit('typing', { roomId, userId: user?._id, username: user?.displayName || user?.email });
    }
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping && socket && room) {
        setIsTyping(false);
        socket.emit('stoppedTyping', { roomId, userId: user?._id });
      }
    }, 2000);
  };

  if (!room) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Update the Tabs section to include Files tab
  const tabsSection = (
    <div className="flex border-b" style={{ borderColor: darkPurpleTheme.border }}>
      <button
        className={`flex-1 py-3 flex items-center justify-center gap-1`}
        style={{ 
          borderBottom: selectedTab === 'files' 
            ? `2px solid ${darkPurpleTheme.accent}` 
            : 'none',
          color: selectedTab === 'files' 
            ? darkPurpleTheme.accent 
            : darkPurpleTheme.textSecondary
        }}
        onClick={() => setSelectedTab('files')}
      >
        <FiFolder /> Files
      </button>
      <button
        className={`flex-1 py-3 flex items-center justify-center gap-1`}
        style={{ 
          borderBottom: selectedTab === 'chat' 
            ? `2px solid ${darkPurpleTheme.accent}` 
            : 'none',
          color: selectedTab === 'chat' 
            ? darkPurpleTheme.accent 
            : darkPurpleTheme.textSecondary
        }}
        onClick={() => setSelectedTab('chat')}
      >
        <FiMessageSquare /> Chat
      </button>
      <button
        className={`flex-1 py-3 flex items-center justify-center gap-1`}
        style={{ 
          borderBottom: selectedTab === 'users' 
            ? `2px solid ${darkPurpleTheme.accent}` 
            : 'none',
          color: selectedTab === 'users' 
            ? darkPurpleTheme.accent 
            : darkPurpleTheme.textSecondary
        }}
        onClick={() => setSelectedTab('users')}
      >
        <FiUsers /> Users
      </button>
    </div>
  );

  // Files Tab content
  const filesTabContent = (
    <div className="flex-1 flex flex-col p-3">
      {/* Files Header */}
      {userRole !== 'viewer' && (
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold">Workspace Files</h3>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsCreatingFile(true);
                setNewFileParent('');
              }}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded flex items-center gap-1"
              title="New File"
            >
              <FiFile size={12} /> File
            </button>
            <button
              onClick={() => {
                setIsCreatingFolder(true);
                setNewFolderParent('');
              }}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded flex items-center gap-1"
              title="New Folder"
            >
              <FiFolder size={12} /> Folder
            </button>
          </div>
        </div>
      )}
      
      {/* New File Form */}
      {isCreatingFile && (
        <form onSubmit={createNewFile} className="mb-3 bg-gray-700 p-2 rounded">
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            className="w-full bg-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-2"
            placeholder="File name"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreatingFile(false)}
              className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-xs bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded"
            >
              Create
            </button>
          </div>
        </form>
      )}
      
      {/* New Folder Form */}
      {isCreatingFolder && (
        <form onSubmit={createNewFolder} className="mb-3 bg-gray-700 p-2 rounded">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="w-full bg-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-2"
            placeholder="Folder name"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreatingFolder(false)}
              className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-xs bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded"
            >
              Create
            </button>
          </div>
        </form>
      )}
      
      {/* File Tree */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filesStructure.length > 0 ? (
          renderFileTree(filesStructure)
        ) : (
          <div className="text-center text-gray-400 py-4">
            No files in this workspace yet
          </div>
        )}
      </div>
      
      {/* Save Button */}
      {activeFile && userRole !== 'viewer' && (
        <button
          onClick={saveFileContent}
          className="mt-3 w-full bg-green-600 hover:bg-green-700 rounded py-2 text-sm"
        >
          Save File
        </button>
      )}
    </div>
  );

  return (
    <div className="flex h-screen text-white" style={{ backgroundColor: darkPurpleTheme.background }}>
      {/* Editor Section */}
      <div className="flex-1 flex flex-col">
        {/* Room Header */}
        <div className="p-3 flex justify-between items-center border-b" 
          style={{ backgroundColor: darkPurpleTheme.surface, borderColor: darkPurpleTheme.border }}>
          <div>
            <h2 className="text-xl font-bold" style={{ color: darkPurpleTheme.textPrimary }}>{room.name}</h2>
            <p className="text-sm" style={{ color: darkPurpleTheme.textSecondary }}>Language: {room.language}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm" style={{ color: darkPurpleTheme.textSecondary }}>
              {getRoleDisplay(userRole).icon}
              <span className="ml-1">{getRoleDisplay(userRole).text}</span>
            </div>
            <button 
              onClick={toggleCursors}
              className="flex items-center gap-1 text-sm px-3 py-1 rounded transition-colors"
              style={{ 
                backgroundColor: showCursors ? darkPurpleTheme.secondary : darkPurpleTheme.surfaceLight,
                color: darkPurpleTheme.textPrimary
              }}
              title={showCursors ? "Hide Collaborator Cursors" : "Show Collaborator Cursors"}
            >
              <FiEye /> {showCursors ? "Cursors On" : "Cursors Off"}
            </button>
            <button 
              onClick={runCode}
              disabled={isRunning || userRole === 'viewer'}
              className="flex items-center gap-1 text-sm px-3 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: darkPurpleTheme.success,
                color: 'white'
              }}
            >
              <FiPlay /> {isRunning ? 'Running...' : 'Run Code'}
            </button>
            <button 
              onClick={copyShareLink}
              className="flex items-center gap-1 text-sm px-3 py-1 rounded transition-colors"
              style={{ 
                backgroundColor: darkPurpleTheme.surfaceLight,
                color: darkPurpleTheme.textPrimary
              }}
            >
              <FiCopy /> Share
            </button>
          </div>
        </div>
        
        {/* Editor */}
        <div className={`flex-1 overflow-hidden ${showOutput ? 'h-2/3' : 'h-full'}`}>
          <Editor
            height="100%"
            defaultLanguage={room.language || "javascript"}
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorDidMount}
            theme="customTheme"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              readOnly: userRole === 'viewer',
              fontFamily: "'Fira Code', 'Consolas', monospace",
              cursorBlinking: 'smooth',
              lineHeight: 1.5,
              renderLineHighlight: 'all'
            }}
          />
        </div>

        {/* Output Console */}
        {showOutput && (
          <div className="h-1/3 border-t overflow-auto p-3" 
              style={{ 
                backgroundColor: darkPurpleTheme.surfaceLight, 
                borderColor: darkPurpleTheme.border 
              }}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold" style={{ color: darkPurpleTheme.textPrimary }}>Output</h3>
              <button
                onClick={() => setShowOutput(false)} 
                className="text-gray-400 hover:text-white"
                style={{ color: darkPurpleTheme.textSecondary }}
              >
                ×
              </button>
            </div>
            <pre className="text-sm font-mono whitespace-pre-wrap p-2 rounded overflow-auto max-h-full"
                style={{ 
                  backgroundColor: darkPurpleTheme.background, 
                  color: darkPurpleTheme.textPrimary 
                }}>
              {output}
            </pre>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="w-80 flex flex-col border-l" 
          style={{ 
            backgroundColor: darkPurpleTheme.surface, 
            borderColor: darkPurpleTheme.border 
          }}>
        {/* Tabs */}
        {tabsSection}

        {/* Files Tab */}
        {selectedTab === 'files' && filesTabContent}

        {/* Chat Tab */}
        {selectedTab === 'chat' && (
          <div className="flex-1 flex flex-col p-3" style={{ backgroundColor: darkPurpleTheme.surface }}>
            <div 
              ref={chatContainerRef} 
              className="flex-1 overflow-y-auto mb-3 space-y-3 custom-scrollbar"
              style={{ 
                scrollbarWidth: 'thin',
                maxHeight: 'calc(100vh - 200px)'
              }}
            >
              {chatMessages.map((msg, index) => {
                const isCurrentUser = msg.username === user.displayName || msg.email === user.email;
                
                return (
                  <div 
                    key={index} 
                    className={`rounded-lg p-3 max-w-[85%] ${
                      isCurrentUser 
                        ? `ml-auto bg-gradient-to-r from-${darkPurpleTheme.primary.substring(1)} to-${darkPurpleTheme.secondary.substring(1)} text-white` 
                        : `bg-${darkPurpleTheme.surfaceLight.substring(1)} text-${darkPurpleTheme.textPrimary.substring(1)}`
                    }`}
                    style={{
                      backgroundColor: isCurrentUser ? darkPurpleTheme.primary : darkPurpleTheme.surfaceLight,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                      marginLeft: isCurrentUser ? 'auto' : '0',
                      marginRight: isCurrentUser ? '0' : 'auto',
                    }}
                  >
                    <div className="flex justify-between text-xs mb-1">
                      <span className={`font-semibold ${isCurrentUser ? 'text-white' : `text-${darkPurpleTheme.accent.substring(1)}`}`}
                        style={{ color: isCurrentUser ? darkPurpleTheme.textPrimary : darkPurpleTheme.accent }}>
                        {msg.username}
                      </span>
                      <span className="text-gray-300 ml-2">
                        {new Date(msg.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
              </div>
                    <p className="text-sm break-words">{msg.message}</p>
          </div>
                );
              })}
        </div>

            {/* Typing indicators */}
            {Object.keys(usersTyping).length > 0 && (
              <div className="text-sm text-gray-400 italic mb-2">
                {Object.keys(usersTyping).length === 1 
                  ? `${usersTyping[Object.keys(usersTyping)[0]]} is typing...` 
                  : `${Object.keys(usersTyping).length} people are typing...`}
                <span className="typing-animation">...</span>
              </div>
            )}
            
            <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                className="flex-1 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: darkPurpleTheme.surfaceLight,
                  color: darkPurpleTheme.textPrimary,
                  borderColor: darkPurpleTheme.border,
                  focusRing: darkPurpleTheme.accent
                }}
              placeholder="Type a message..."
            />
            <button
              type="submit"
                className="px-3 py-2 rounded text-sm text-white"
                style={{ 
                  backgroundColor: darkPurpleTheme.primary,
                  transition: 'background-color 0.2s',
                  hover: { backgroundColor: darkPurpleTheme.secondary }
                }}
            >
              Send
            </button>
          </form>
        </div>
        )}

        {/* Users Tab */}
        {selectedTab === 'users' && (
          <div className="flex-1 flex flex-col p-3" style={{ backgroundColor: darkPurpleTheme.surface }}>
            {/* User Search (Only for admin) */}
            {userRole === 'admin' && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2" style={{ color: darkPurpleTheme.textPrimary }}>Add Users</h3>
                <div className="flex gap-2 mb-2">
            <input
                    ref={searchInputRef}
              type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by email..."
                    className="flex-1 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: darkPurpleTheme.surfaceLight,
                      color: darkPurpleTheme.textPrimary,
                      borderColor: darkPurpleTheme.border,
                      focusRing: darkPurpleTheme.accent
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        searchUsers();
                      }
                    }}
            />
            <button
                    onClick={searchUsers}
                    disabled={isSearching}
                    className="px-3 py-2 rounded text-sm flex items-center"
                    style={{ 
                      backgroundColor: darkPurpleTheme.primary,
                      color: darkPurpleTheme.textPrimary,
                      opacity: isSearching ? 0.7 : 1
                    }}
                  >
                    <FiSearch />
                  </button>
                </div>
                
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mb-3 rounded overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
                    style={{ backgroundColor: darkPurpleTheme.surfaceLight, borderColor: darkPurpleTheme.border }}>
                    {searchResults.map((user) => (
                      <div key={user.email} 
                        className="p-2 border-b last:border-0 flex justify-between items-center"
                        style={{ borderColor: darkPurpleTheme.border }}>
                        <div className="flex items-center gap-2">
                          {user.photoURL && (
                            <img src={user.photoURL} alt={user.displayName} className="w-6 h-6 rounded-full" />
                          )}
                          <div className="text-sm">
                            <div style={{ color: darkPurpleTheme.textPrimary }}>{user.displayName || user.email}</div>
                            {user.displayName && <div style={{ color: darkPurpleTheme.textSecondary }}>{user.email}</div>}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => addUserToRoom(user.email, user.displayName, user.photoURL, 'viewer')}
                            className="text-xs px-2 py-1 rounded"
                            style={{ backgroundColor: darkPurpleTheme.secondary, color: 'white' }}
                          >
                            Viewer
                          </button>
                          <button
                            onClick={() => addUserToRoom(user.email, user.displayName, user.photoURL, 'editor')}
                            className="text-xs px-2 py-1 rounded"
                            style={{ backgroundColor: darkPurpleTheme.success, color: 'white' }}
                          >
                            Editor
            </button>
          </div>
        </div>
                    ))}
                  </div>
                )}
                {isSearching && (
                  <div className="text-center py-2">
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2" 
                      style={{ borderColor: darkPurpleTheme.accent }}></div>
                    <span className="ml-2 text-sm" style={{ color: darkPurpleTheme.textSecondary }}>Searching...</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Room Users */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <h3 className="text-sm font-semibold mb-2" style={{ color: darkPurpleTheme.textPrimary }}>Users in Workspace</h3>
              <div className="space-y-2">
                {room.users.map((roomUser) => {
                  const isActive = activeUsers.some(u => u.email === roomUser.email);
                  const roleInfo = getRoleDisplay(roomUser.role);
                  const isCurrentUser = roomUser.email === user.email;
                  
                  return (
                    <div 
                      key={roomUser.email} 
                      className="flex items-center justify-between p-2 rounded-md"
                      style={{ 
                        backgroundColor: isActive 
                          ? `${darkPurpleTheme.surfaceLight}` 
                          : `${darkPurpleTheme.surfaceLight}80`, 
                        borderLeft: `3px solid ${
                          roomUser.role === 'admin' 
                            ? darkPurpleTheme.error 
                            : roomUser.role === 'editor' 
                              ? darkPurpleTheme.success 
                              : darkPurpleTheme.secondary
                        }`
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: isActive ? darkPurpleTheme.success : darkPurpleTheme.border }}></div>
                        {roomUser.photoURL && (
                          <img src={roomUser.photoURL} alt="" className="w-6 h-6 rounded-full" />
                        )}
                        <div>
                          <div className="text-sm font-medium" style={{ color: darkPurpleTheme.textPrimary }}>
                            {roomUser.displayName || roomUser.email}
                            {isCurrentUser && <span className="ml-2 text-xs font-normal italic" style={{ color: darkPurpleTheme.accent }}>(You)</span>}
                          </div>
                          {roomUser.displayName && <div className="text-xs" style={{ color: darkPurpleTheme.textSecondary }}>{roomUser.email}</div>}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span style={{ color: getRoleColor(roomUser.role) }}>
                          {roleInfo.icon}
                        </span>
                        
                        {/* Role Management (Admin only) */}
                        {userRole === 'admin' && !isCurrentUser && (
                          <select
                            value={roomUser.role}
                            onChange={(e) => changeUserRole(roomUser.email, e.target.value)}
                            className="text-xs rounded py-0.5 px-1"
                            style={{ 
                              backgroundColor: darkPurpleTheme.surfaceLight, 
                              color: darkPurpleTheme.textPrimary,
                              borderColor: darkPurpleTheme.border
                            }}
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Add custom scrollbar styles
const style = document.createElement('style');
style.textContent = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #2d3748;
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #4a5568;
    border-radius: 3px;
    border: 1px solid #2d3748;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #718096;
  }
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #4a5568 #2d3748;
  }
  
  /* Fix for ResizeObserver loop error */
  .monaco-editor .overflow-guard {
    overflow: hidden !important;
  }

  /* Typing animation */
  .typing-animation {
    display: inline-block;
    overflow: hidden;
    animation: typing 1s infinite;
  }
  
  @keyframes typing {
    0% { opacity: 0.3; }
    50% { opacity: 1; }
    100% { opacity: 0.3; }
  }
  
  /* Custom Remote Cursor Styles */
  .remote-cursor-widget {
    position: relative;
    font-weight: bold;
  }
  
  .remote-cursor-widget::after {
    transition: opacity 0.3s ease;
    opacity: 0.8;
  }
  
  .remote-cursor-widget:hover::after {
    opacity: 1;
  }
`;
document.head.appendChild(style);

export default CodeEditor; 