export default function Footer() {
  return (
    <footer className="bg-sky-50 dark:bg-slate-950 w-full py-12 px-8 tonal-shift from surface-container-low no-shadow mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto gap-8">
        <div className="flex flex-col items-center md:items-start gap-2">
          <span className="text-lg font-black text-blue-900 dark:text-white font-headline">EviLearn</span>
          <p className="font-body text-xs font-medium text-slate-500 dark:text-slate-400">© 2026 EviLearn Crystal Clarity. Built for tactile education.</p>
        </div>
        <div className="flex items-center gap-8 font-body text-xs font-medium">
          <a className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors opacity-80 hover:opacity-100" href="#">Privacy</a>
          <a className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors opacity-80 hover:opacity-100" href="#">Terms</a>
          <a className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors opacity-80 hover:opacity-100" href="#">Support</a>
          <a className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors opacity-80 hover:opacity-100" href="#">Twitter</a>
        </div>
      </div>
    </footer>
  );
}
