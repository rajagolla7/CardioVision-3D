import React, { useState } from 'react';
import { 
  Heart, 
  Activity, 
  Layers, 
  BrainCircuit, 
  FileText, 
  Bot, 
  UploadCloud, 
  ShieldCheck, 
  Menu, 
  X, 
  PlayCircle,
  Sparkles,
  Sliders,
  Sun,
  Moon
} from 'lucide-react';
import { RiskCategory, ThemeMode } from '../types/cardiac';

export type NavigationTab = 
  | 'overview'
  | 'assessment'
  | 'explorer'
  | 'intelligence'
  | 'simulator'
  | 'datalab'
  | 'assistant'
  | 'reports'
  | 'about';

interface NavigationProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onLaunchDemo: () => void;
  currentRiskCategory?: RiskCategory;
  isSyntheticDemo?: boolean;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  onLaunchDemo,
  currentRiskCategory,
  isSyntheticDemo,
  theme = 'dark',
  onToggleTheme
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: Array<{ id: NavigationTab; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: 'Overview', icon: <Activity className="w-4 h-4" /> },
    { id: 'assessment', label: 'Patient Assessment', icon: <FileText className="w-4 h-4" /> },
    { id: 'explorer', label: '3D Heart Explorer', icon: <Layers className="w-4 h-4" /> },
    { id: 'intelligence', label: 'Risk Intelligence', icon: <BrainCircuit className="w-4 h-4" /> },
    { id: 'simulator', label: 'What-If Simulator', icon: <Sliders className="w-4 h-4" /> },
    { id: 'datalab', label: 'Health Data Lab', icon: <UploadCloud className="w-4 h-4" /> },
    { id: 'assistant', label: 'AI Health Assistant', icon: <Bot className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
    { id: 'about', label: 'About & Safety', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  const getRiskBadge = () => {
    if (!currentRiskCategory) return null;
    const colors: Record<RiskCategory, { bg: string; text: string; border: string; label: string }> = {
      low: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30', label: 'Low Estimated Risk' },
      moderate: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Moderate Risk' },
      elevated: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', label: 'Elevated Risk' },
    };
    const c = colors[currentRiskCategory];
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        {c.label}
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-[#070e1b]/90 backdrop-blur-xl border-b border-sky-950/80 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div 
            onClick={() => onSelectTab('overview')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-cyan-500 to-rose-500 p-0.5 shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#081122] rounded-[10px] flex items-center justify-center">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500/30 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-sky-100 to-sky-400 bg-clip-text text-transparent">
                  CardioVision 3D
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/40">
                  AI Track A
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-wide">Multimodal Cardiovascular Risk Platform</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-0.5">
            {navItems.map((item) => {
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    active
                      ? 'bg-sky-500/15 text-sky-300 border border-sky-400/30 shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Elements */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Theme Toggle Button */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                title={theme === 'bright' ? 'Switch to Dark Mode' : 'Switch to Bright Mode'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200 cursor-pointer"
              >
                {theme === 'bright' ? (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Dark</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Bright</span>
                  </>
                )}
              </button>
            )}

            {/* Current Risk Badge */}
            {getRiskBadge()}

            {/* Synthetic Data Tag */}
            {isSyntheticDemo && (
              <span className="hidden 2xl:inline-flex text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800/80 text-amber-300/90 border border-amber-500/30">
                Synthetic Mode
              </span>
            )}

            {/* Launch Demo Assessment CTA */}
            <button
              onClick={onLaunchDemo}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-slate-950 text-xs font-extrabold shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span>Launch Demo Assessment</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200"
                title="Toggle Bright/Dark Theme"
              >
                {theme === 'bright' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
              </button>
            )}
            <button
              onClick={onLaunchDemo}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-500 text-slate-950 text-xs font-bold"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Demo</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#070e1b] border-b border-sky-950 px-4 pt-2 pb-6 space-y-2">
          <div className="grid grid-cols-2 gap-2 pt-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all ${
                  currentTab === item.id
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            {getRiskBadge()}
            <button
              onClick={() => {
                onLaunchDemo();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 text-slate-950 text-xs font-bold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Launch Demo
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
