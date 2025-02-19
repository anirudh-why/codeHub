import './App.css';
import './index.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import CreateRoom from './components/CreateRoom';
import Room from './components/Room';

function Home() {
  return (
    <div className="max-w-7xl mx-auto p-8">
      <h2 className="text-3xl font-bold mb-4">Welcome to My App</h2>
      <p className="text-lg text-gray-700">
        Explore our features and enjoy the experience!
      </p>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <main className="mt-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/dashboard" element={<CreateRoom />} />
            <Route path="/room/:roomId" element={<Room />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
