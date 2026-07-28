"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthActions } from "@convex-dev/auth/react"
import { toast } from "sonner"
import { motion, type Variants } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons"

type OAuthProvider = "apple" | "google" | "github"

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...props}>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
)

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const { signIn } = useAuthActions()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [oauthProvider, setOauthProvider] = useState<OAuthProvider | null>(null)

  const busy = submitting || oauthProvider !== null

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (busy) return

    if (!email.trim()) {
      toast.error("请输入邮箱")
      return
    }
    if (password !== confirmPassword) {
      toast.error("两次输入的密码不一致")
      return
    }
    if (password.length < 8) {
      toast.error("密码至少需要 8 位")
      return
    }

    setSubmitting(true)
    try {
      await signIn("password", {
        email: email.trim(),
        password,
        flow: "signUp",
      })
      toast.success("账号创建成功")
      router.replace("/")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "注册失败")
    } finally {
      setSubmitting(false)
    }
  }

  const handleOAuth = async (provider: OAuthProvider) => {
    if (busy) return
    setOauthProvider(provider)
    try {
      await signIn(provider)
    } catch (err) {
      console.error(err)
      toast.error("第三方登录失败，请稍后重试")
    } finally {
      setOauthProvider(null)
    }
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  }

  const inputClassName =
    "w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-[#FDBA5E] focus:outline-none focus:ring-1 focus:ring-[#FDBA5E] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"

  return (
    <div
      className={`flex w-full flex-col items-center justify-center p-6 sm:p-12 lg:w-1/2 ${className ?? ""}`}
      {...props}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[400px]"
      >
        {/* Title */}
        <motion.div variants={itemVariants} className="mb-10">
          <h1 className="mb-4 text-[48px] font-semibold leading-[1.05] tracking-tight text-[#1C222B]">
            Create account
          </h1>
          <p className="text-[15px] text-slate-500 text-balance">
            Enter your email below to create your account.
          </p>
        </motion.div>

        <form onSubmit={handleSignup} className="flex flex-col gap-5">
          {/* Email */}
          <motion.div variants={itemVariants} className="flex flex-col gap-2">
            <label htmlFor="email" className="text-[14px] font-medium text-slate-800">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              required
              className={inputClassName}
              placeholder="you@example.com"
            />
          </motion.div>

          {/* Password */}
          <motion.div variants={itemVariants} className="flex flex-col gap-2">
            <label htmlFor="password" className="text-[14px] font-medium text-slate-800">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                required
                className={`${inputClassName} pr-10 font-mono`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                disabled={busy}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <HugeiconsIcon
                  icon={showPassword ? ViewIcon : ViewOffIcon}
                  className="size-5"
                />
              </button>
            </div>
            <p className="text-[13px] text-slate-500">Must be at least 8 characters long.</p>
          </motion.div>

          {/* Confirm Password */}
          <motion.div variants={itemVariants} className="flex flex-col gap-2">
            <label
              htmlFor="confirm-password"
              className="text-[14px] font-medium text-slate-800"
            >
              Confirm password
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={busy}
                required
                className={`${inputClassName} pr-10 font-mono`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                disabled={busy}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                <HugeiconsIcon
                  icon={showConfirmPassword ? ViewIcon : ViewOffIcon}
                  className="size-5"
                />
              </button>
            </div>
          </motion.div>

          {/* Create Account Button */}
          <motion.div variants={itemVariants} className="mt-2">
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-[#FDBA5E] py-3 text-[14px] font-medium text-slate-900 transition-transform active:scale-[0.98] hover:bg-[#EFA541] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {submitting ? "Creating…" : "Create account"}
            </button>
          </motion.div>
        </form>

        {/* Google Button */}
        <motion.div variants={itemVariants} className="mt-4">
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2.5 rounded-md border border-slate-200 bg-white py-3 text-[14px] font-medium text-slate-700 transition-transform active:scale-[0.98] hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {oauthProvider === "google" ? (
              <span className="size-[18px] animate-pulse rounded-full bg-slate-300" />
            ) : (
              <GoogleIcon className="size-[18px]" />
            )}
            {oauthProvider === "google" ? "Connecting…" : "Sign up with Google"}
          </button>
        </motion.div>

        {/* Footer */}
        <motion.div
          variants={itemVariants}
          className="mt-10 text-center text-[14px] text-slate-500"
        >
          Already have an account?{" "}
          <a
            href="/login"
            className="font-semibold text-slate-800 underline decoration-slate-800 underline-offset-4 transition-colors hover:text-black hover:decoration-black"
          >
            Sign in
          </a>
        </motion.div>
      </motion.div>
    </div>
  )
}