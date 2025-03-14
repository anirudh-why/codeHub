import { BackgroundLines } from "../components/ui/background-lines";
import { FaCode, FaUsers, FaPlay, FaComments, FaSync, FaGithub } from "react-icons/fa";

function Home() {
  return (
    <div className="relative w-full min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <BackgroundLines className="flex flex-col items-center justify-center text-center w-full px-4 py-20 z-0">
        <h1 className="text-5xl font-extrabold mb-6 max-w-3xl">
          Collaborate in Real-Time – Code, Debug & Share Instantly!
        </h1>
        <p className="text-lg text-gray-300 mb-6 max-w-2xl">
          Write, edit, and debug code with your team live. No setup required. Just share a link and start coding.
        </p>
        <div className="flex gap-4">
          <button className="bg-cyan-500 text-white py-3 px-6 rounded-lg hover:bg-cyan-600 transition">
            Start Coding Now
          </button>
          <button className="border border-white py-3 px-6 rounded-lg hover:bg-white hover:text-gray-900 transition">
            Try Demo
          </button>
        </div>
      </BackgroundLines>

      {/* Features Section */}
      <section className="py-20 px-10 max-w-6xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-8">Why Choose Us?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-gray-800 p-6 rounded-xl">
              <feature.icon className="text-cyan-500 text-4xl mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-800 text-center px-10">
        <h2 className="text-3xl font-bold mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="p-6 bg-gray-700 rounded-xl">
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-gray-400">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">Get Started for Free!</h2>
        <button className="bg-cyan-500 text-white py-3 px-6 rounded-lg hover:bg-cyan-600 transition">
          Start Coding Now
        </button>
      </section>
    </div>
  );
}

const features = [
  { icon: FaCode, title: "Live Code Collaboration", description: "Work together in real-time, no setup needed." },
  { icon: FaUsers, title: "Built-in Chat & Video Calls", description: "Discuss code with your team instantly." },
  { icon: FaPlay, title: "Instant Code Execution", description: "Run and test your code in multiple languages." },
  { icon: FaSync, title: "Version Control", description: "Track changes easily with GitHub integration." },
  { icon: FaGithub, title: "GitHub Sync", description: "Seamlessly push and pull from your repositories." },
  { icon: FaComments, title: "Annotations & Comments", description: "Leave feedback on specific lines of code." },
];

const steps = [
  { title: "Sign Up & Create a Session", description: "Register and start a new collaboration session in seconds." },
  { title: "Share the Link & Invite Collaborators", description: "Send the session link to teammates or friends." },
  { title: "Start Coding Together in Real-Time", description: "Work on projects, debug, and build amazing things!" },
];

export default Home;
