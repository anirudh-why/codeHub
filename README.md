# CodeHub

CodeHub is a collaborative, real-time code editing platform that allows developers to write, share, and execute code together. With features like real-time collaboration, syntax highlighting, and version control, CodeHub simplifies the coding experience for team projects.

## Features

- **Real-time Collaboration**: Multiple users can edit code simultaneously with synchronized changes
- **Monaco Editor Integration**: Powerful code editor with syntax highlighting and IntelliSense
- **User Authentication**: Secure login and registration system
- **Project Dashboard**: Organize and manage your coding projects
- **Socket-based Communication**: Real-time updates and collaboration

## Tech Stack

### Frontend
- React 19
- React Router
- Tailwind CSS
- Socket.io Client
- Monaco Editor

### Backend
- Node.js
- Express
- MongoDB (with Mongoose)
- Socket.io
- Authentication system

## Getting Started

### Prerequisites
- Node.js (v14 or later)
- npm or yarn
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/codeHub.git
cd codeHub
```

2. Set up the backend
```bash
cd backend
npm install
# Create a .env file with necessary environment variables (see .env.example if available)
npm run dev
```

3. Set up the frontend
```bash
cd frontend
npm install
npm start
```

4. Access the application at `http://localhost:3000`

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

## Project Structure

```
codeHub/
├── backend/             # Node.js & Express backend
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── server.js        # Main server file
│
├── frontend/            # React frontend
│   ├── public/          # Static files
│   └── src/             # Source files
│       ├── components/  # React components
│       ├── utils/       # Utility functions
│       └── App.js       # Main app component
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License

## Acknowledgments

- [React](https://reactjs.org/)
- [Node.js](https://nodejs.org/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Socket.io](https://socket.io/) 