import Link from "next/link";
import { FiBookOpen, FiZap, FiArrowRight } from "react-icons/fi";

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center bg-white overflow-hidden">
      <main className="relative z-10 text-center max-w-4xl px-4">
        {/* Decorative background accent */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50 animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-50 animate-pulse" />

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-bold mb-8 animate-bounce">
          <FiZap />
          <span>Next Generation AI Recommendations</span>
        </div>

        <h1 className="text-7xl md:text-8xl font-black text-gray-900 tracking-tighter mb-8 leading-[0.9]">
          Read what <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">matters next.</span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
          LibroMind uses advanced AI to curate the perfect reading list for any topic. Stop searching, start discovering.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/books"
            className="group flex items-center gap-3 bg-gray-900 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-black hover:shadow-2xl hover:shadow-blue-500/20 transition-all active:scale-95"
          >
            Go to My Library
            <FiArrowRight className="group-hover:translate-x-2 transition-transform" />
          </Link>
          <Link
            href="/books/new"
            className="flex items-center gap-3 bg-white text-gray-900 border-2 border-gray-100 px-10 py-5 rounded-2xl font-bold text-lg hover:border-blue-200 hover:bg-gray-50 transition-all active:scale-95"
          >
            <FiBookOpen />
            Ask AI Now
          </Link>
        </div>
      </main>

      {/* Floating stats or features */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mt-24 max-w-5xl px-4 border-t border-gray-50 pt-16">
        <div className="text-center">
          <h3 className="text-3xl font-black text-gray-900">5/5</h3>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Batch Recommendations</p>
        </div>
        <div className="text-center border-x border-gray-50 px-8">
          <h3 className="text-3xl font-black text-gray-900">Sec</h3>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">AI Generation Speed</p>
        </div>
        <div className="text-center col-span-2 md:col-span-1 border-t md:border-t-0 pt-8 md:pt-0 border-gray-50">
          <h3 className="text-3xl font-black text-gray-900">100%</h3>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Curated For You</p>
        </div>
      </div>
    </div>
  );
}
