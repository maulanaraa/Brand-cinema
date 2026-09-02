import { useEffect, useState, type ReactElement } from 'react';

export default function SplashScreen(): ReactElement | null {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isLogoVisible, setIsLogoVisible] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [isContentFadedOut, setIsContentFadedOut] = useState<boolean>(false);
  const [isWindowOpen, setIsWindowOpen] = useState<boolean>(false);

  useEffect(() => {
    // Lock scroll during splash screen
    document.body.style.overflow = 'hidden';

    // 1.5-second delay before logo enters
    const logoTimer = setTimeout(() => {
      setIsLogoVisible(true);
    }, 1500);

    // Progress counter animation: 0% -> 100% in 6.0 seconds (60ms * 100)
    const intervalTime = 60;
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, intervalTime);

    // Phase 2: Fade out all content once counter reaches 100% (at 6.3s)
    const contentFadeTimer = setTimeout(() => {
      setIsContentFadedOut(true);
    }, 6300);

    // Phase 3: Split window opening transition (at 6.7s)
    const windowOpenTimer = setTimeout(() => {
      setIsWindowOpen(true);
    }, 6700);

    // Phase 4: Unmount from DOM after window fully opens (at 8.0s)
    const finishTimer = setTimeout(() => {
      setIsVisible(false);
      document.body.style.overflow = '';
    }, 8000);

    return () => {
      clearTimeout(logoTimer);
      clearInterval(progressInterval);
      clearTimeout(contentFadeTimer);
      clearTimeout(windowOpenTimer);
      clearTimeout(finishTimer);
      document.body.style.overflow = '';
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
      {/* Left Window Panel */}
      <div
        className={`absolute inset-y-0 left-0 w-1/2 bg-[#09090b] transition-transform duration-1200 ease-[cubic-bezier(0.77,0,0.175,1)] ${
          isWindowOpen ? '-translate-x-full' : 'translate-x-0'
        }`}
        style={{ transitionDuration: '1200ms' }}
      />

      {/* Right Window Panel */}
      <div
        className={`absolute inset-y-0 right-0 w-1/2 bg-[#09090b] transition-transform duration-1200 ease-[cubic-bezier(0.77,0,0.175,1)] ${
          isWindowOpen ? 'translate-x-full' : 'translate-x-0'
        }`}
        style={{ transitionDuration: '1200ms' }}
      />

      {/* Ambient decorative glow */}
      <div
        className={`pointer-events-none absolute inset-0 z-10 transition-opacity duration-700 ${
          isContentFadedOut ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#D5A527]/12 blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-amber-600/10 blur-[90px]" />
      </div>

      {/* Center Content (Logo & Progress Bar) */}
      <div
        className={`absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6 transition-opacity duration-600 ease-out ${
          isContentFadedOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        {/* Brand Logo: Pure opacity 0 -> 100% transition + slide up */}
        <div
          className={`flex flex-col items-center text-center transition-all duration-1000 ease-out transform ${
            isLogoVisible
              ? 'opacity-100 translate-y-0 mb-6'
              : 'opacity-0 translate-y-8 mb-0'
          }`}
        >
          <div className="flex items-center gap-1">
            <h1 className="font-display font-bold text-2xl tracking-tight text-white sm:text-3xl md:text-3xl">
              Cinema<span className="text-gradient-gold">ID</span>
            </h1>
          </div>
        </div>

        {/* Progress Bar: Centered initially, smoothly moves down when logo appears */}
        <div
          className={`w-44 overflow-hidden rounded-full bg-white/10 p-0.5 backdrop-blur-sm sm:w-56 transition-all duration-1000 ease-out transform ${
            isLogoVisible ? 'translate-y-0' : '-translate-y-4'
          }`}
        >
          <div
            className="h-1 rounded-full bg-gradient-to-r from-[#D5A527] via-amber-400 to-[#D5A527] shadow-[0_0_12px_#D5A527] transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Large Counter Number in Bottom-Right Corner */}
      <div
        className={`absolute bottom-6 right-6 sm:bottom-10 sm:right-12 z-20 flex items-baseline gap-1 select-none transition-opacity duration-600 ease-out ${
          isContentFadedOut ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}
      >
        <span className="font-display font-black text-6xl sm:text-8xl md:text-9xl tracking-tighter text-white/90 drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
          {progress}
        </span>
        <span className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-[#D5A527]">
          %
        </span>
      </div>
    </div>
  );
}
