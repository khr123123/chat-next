import { LoginForm } from "@/components/login-form";
export default function Page() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-white font-sans text-slate-900 antialiased selection:bg-[#FDBA5E]/20 selection:text-[#EFA541] lg:flex-row">
      {/* Left Image Panel */}
      <div className="relative hidden w-full flex-col p-4 lg:flex lg:min-h-screen lg:w-1/2">
        <div className="relative h-full w-full overflow-hidden rounded-[24px] bg-neutral-100 shadow-xl">
          <img
            src="https://assets.watermelon.sh/auth-13.avif"
            alt="Abstract orange and green blurred streaks"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Logo overlay */}
          <div className="absolute top-8 left-8">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 24.5L25 12.5C26 11.5 28 11.5 29 12.5C30 13.5 30 15 29 16L16 28L12 24.5Z" fill="white" />
              <path d="M10 18.5L23 6.5C24 5.5 26 5.5 27 6.5C28 7.5 28 9 27 10L14 22L10 18.5Z" fill="white" />
            </svg>
          </div>
        </div>
      </div>
      {/* Right Form Panel */}
      <LoginForm />
    </div>
  );
}
