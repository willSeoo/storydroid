// import { Logo } from './Logo';
// import logoYujin  from './icon.jpeg';

export function Header() {
  return (
    <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5 sm:px-6">
      <div className="flex items-center gap-2.5">
        <img src='./icon.jpeg' className="w-15"></img>
        <div className="leading-tight">
          <p className="text-sm font-extrabold tracking-tight sm:text-base">Android Video Rehabilitation Center</p>
          <p className="text-[11px] font-medium text-black/40">AVRC · We fix what Instagram refuses to understand.</p>
        </div>
      </div>
    </header>
  );
}
