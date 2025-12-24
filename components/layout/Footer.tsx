export default function Footer() {
    return (
      <footer className="mt-12 border-t px-4 py-6 text-sm text-gray-500">
        <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
          <span className="cursor-pointer hover:underline">About</span>
          <span className="cursor-pointer hover:underline">Help</span>
          <span className="cursor-pointer hover:underline">Privacy</span>
          <span className="cursor-pointer hover:underline">Terms</span>
          <span className="cursor-pointer hover:underline">Contact</span>
        </div>
  
        <div className="text-xs">
          © {new Date().getFullYear()} PerfectBench
        </div>
      </footer>
    );
  }  