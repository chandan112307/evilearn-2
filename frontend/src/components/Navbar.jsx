export default function Navbar({ onNavigate, activePage }) {
  return (
    <nav className="bg-sky-50/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-full mt-4 max-w-fit mx-auto px-6 py-2 sticky top-4 z-50 shadow-[0_20px_40px_-15px_rgba(0,95,155,0.1)] flex items-center justify-center gap-8 glass-nav">
      <div className="text-xl font-bold tracking-tighter text-blue-900 dark:text-blue-100 font-headline cursor-pointer" onClick={() => onNavigate('landing')}>
        EviLearn
      </div>
      <div className="hidden md:flex items-center gap-6">
        <button 
          className={`font-headline text-sm font-bold tracking-tight transition-all duration-300 px-3 py-1 rounded-full ${activePage === 'landing' ? 'bg-primary text-on-primary' : 'text-blue-700/60 hover:bg-white/50 hover:text-blue-900'}`}
          onClick={() => onNavigate('landing')}
        >
          Home
        </button>
        <button 
          className={`font-headline text-sm font-bold tracking-tight transition-all duration-300 px-3 py-1 rounded-full ${activePage === 'workspace' ? 'bg-primary text-on-primary' : 'text-blue-700/60 hover:bg-white/50 hover:text-blue-900'}`}
          onClick={() => onNavigate('workspace')}
        >
          Workspace
        </button>
        <button 
          className={`font-headline text-sm font-bold tracking-tight transition-all duration-300 px-3 py-1 rounded-full ${activePage === 'history' ? 'bg-primary text-on-primary' : 'text-blue-700/60 hover:bg-white/50 hover:text-blue-900'}`}
          onClick={() => onNavigate('history')}
        >
          Dashboard
        </button>
      </div>
      <button 
        className="bg-primary text-on-primary px-5 py-2 rounded-full font-bold text-sm hover:scale-105 transition-all duration-300 shadow-lg"
        onClick={() => onNavigate('workspace')}
      >
        Get Started
      </button>
    </nav>
  );
}
