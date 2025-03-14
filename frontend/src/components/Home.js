import { BackgroundLines } from "../components/ui/background-lines";

function Home() {
  return (
    <BackgroundLines className="flex items-center justify-center w-full flex-col px-4 z-0">
      <h2 className="text-4xl font-bold mb-6 text-white">
        Collaborate in Real-Time – Code, Debug & Share Instantly!
      </h2>
      <button className="bg-cyan-500 text-white py-2 px-6 rounded-lg hover:bg-cyan-600 transition">
        Start Coding Now
      </button>
    </BackgroundLines>
  );
}

export default Home;
