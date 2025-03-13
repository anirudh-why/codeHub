import './App.css';
import './index.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import CreateRoom from './components/CreateRoom';
import Room from './components/Room';
import Home from './components/Home';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <main className="mt-16">
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
