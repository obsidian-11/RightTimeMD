export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Animated Circles */}
      <div className="absolute inset-0">
        {/* Large Blue Circle - Top Left */}
        <div
          className="animate-float-slow absolute h-96 w-96 rounded-full bg-blue-500/50 blur-3xl"
          style={{
            top: "10%",
            left: "5%",
            animationDelay: "0s",
            animationDuration: "20s",
          }}
        />

        {/* Medium Green Circle - Top Right */}
        <div
          className="animate-float-medium absolute h-72 w-72 rounded-full bg-green-400/60 blur-2xl"
          style={{
            top: "20%",
            right: "10%",
            animationDelay: "5s",
            animationDuration: "15s",
          }}
        />

        {/* Large Green Circle - Bottom Left */}
        <div
          className="animate-float-slow absolute h-80 w-80 rounded-full bg-green-500/55 blur-3xl"
          style={{
            bottom: "15%",
            left: "10%",
            animationDelay: "10s",
            animationDuration: "25s",
          }}
        />

        {/* Medium Blue Circle - Bottom Right */}
        <div
          className="animate-float-fast absolute h-64 w-64 rounded-full bg-blue-400/65 blur-xl"
          style={{
            bottom: "25%",
            right: "15%",
            animationDelay: "3s",
            animationDuration: "12s",
          }}
        />

        {/* Small Sharp Green Circle - Center Left */}
        <div
          className="animate-float-medium glassmorphism absolute h-32 w-32 rounded-full bg-gradient-to-br from-green-400/80 to-green-600/90 shadow-lg"
          style={{
            top: "50%",
            left: "15%",
            animationDelay: "7s",
            animationDuration: "18s",
          }}
        />

        {/* Small Sharp Blue Circle - Center Right */}
        <div
          className="animate-float-fast glassmorphism absolute h-40 w-40 rounded-full bg-gradient-to-br from-blue-400/80 to-blue-600/90 shadow-xl"
          style={{
            top: "45%",
            right: "20%",
            animationDelay: "2s",
            animationDuration: "14s",
          }}
        />

        {/* Extra Small Floating Circles */}
        <div
          className="animate-float-slow absolute h-24 w-24 rounded-full bg-green-300/70 blur-lg"
          style={{
            top: "70%",
            left: "30%",
            animationDelay: "12s",
            animationDuration: "22s",
          }}
        />

        <div
          className="animate-float-medium absolute h-20 w-20 rounded-full bg-blue-300/65 blur-md"
          style={{
            top: "30%",
            left: "50%",
            animationDelay: "8s",
            animationDuration: "16s",
          }}
        />

        {/* Glassmorphic Sharp Circle */}
        <div
          className="animate-float-slow glassmorphism-sharp absolute h-56 w-56 rounded-full border border-white/40 bg-gradient-to-br from-blue-500/60 to-green-500/70 shadow-2xl backdrop-blur-sm"
          style={{
            top: "60%",
            right: "5%",
            animationDelay: "15s",
            animationDuration: "20s",
          }}
        />

        {/* Additional Visible Circles */}
        <div
          className="animate-float-medium absolute h-48 w-48 rounded-full bg-blue-600/45 blur-2xl"
          style={{
            top: "5%",
            left: "60%",
            animationDelay: "18s",
            animationDuration: "17s",
          }}
        />

        <div
          className="animate-float-fast absolute h-36 w-36 rounded-full bg-green-600/50 blur-lg"
          style={{
            bottom: "5%",
            right: "40%",
            animationDelay: "9s",
            animationDuration: "13s",
          }}
        />

        {/* More Sharp Glassmorphic Circles */}
        <div
          className="animate-float-slow glassmorphism absolute h-28 w-28 rounded-full bg-gradient-to-br from-blue-300/70 to-blue-500/80 shadow-lg"
          style={{
            top: "75%",
            left: "60%",
            animationDelay: "22s",
            animationDuration: "19s",
          }}
        />

        <div
          className="animate-float-fast glassmorphism-sharp absolute h-44 w-44 rounded-full border border-white/30 bg-gradient-to-br from-green-300/60 to-green-500/75 shadow-xl"
          style={{
            top: "25%",
            left: "80%",
            animationDelay: "16s",
            animationDuration: "21s",
          }}
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 via-white/70 to-slate-100/80" />
    </div>
  );
}
