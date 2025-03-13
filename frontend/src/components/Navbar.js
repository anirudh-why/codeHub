import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="bg-gray-800 p-4 fixed top-0 left-0 w-full z-10">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="text-white text-2xl font-bold">My Appp</h1>
        <div>
          <Link to="/" className="text-gray-300 hover:text-white mx-2">Home</Link>
          <Link to="/signin" className="text-gray-300 hover:text-white mx-2">Sign In</Link>
          <Link to="/signup" className="text-gray-300 hover:text-white mx-2">Sign Up</Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 