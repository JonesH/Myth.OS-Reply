"use client";
import { signIn } from "next-auth/react";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p>Connect your X (Twitter) account to continue.</p>
        <button
          onClick={() => signIn('twitter', { callbackUrl: '/app' })}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Sign in with X (Twitter)
        </button>
      </div>
    </div>
  );
}

