"use client";
import { useMemo, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

interface TwitterConnectButtonProps {
  callbackUrl?: string;
  className?: string;
  children?: React.ReactNode;
  onSuccess?: () => void;
}

export default function TwitterConnectButton({ 
  callbackUrl = "/app",
  className = "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200",
  children,
  onSuccess,
}: TwitterConnectButtonProps) {
  const { data: session, status } = useSession();
  const [busy, setBusy] = useState(false);

  const username = useMemo(() => {
    const u = (session?.user as any)?.username || (session?.user as any)?.twitterId;
    return typeof u === 'string' ? u : null;
  }, [session]);

  const handleConnect = async () => {
    setBusy(true);
    try {
      await signIn('twitter', { callbackUrl });
      if (onSuccess) {
        onSuccess();
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    setBusy(true);
    try {
      await signOut({ callbackUrl: '/' });
    } finally {
      setBusy(false);
    }
  };

  if (status === 'loading') {
    return (
      <button disabled className={`${className} opacity-50 cursor-not-allowed`}>Loading...</button>
    );
  }

  if (username) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">Connected as @{username}</span>
        <button onClick={handleDisconnect} className="text-red-600 hover:text-red-700 text-sm underline" disabled={busy}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button onClick={handleConnect} disabled={busy} className={`${className} ${busy ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {busy ? 'Connecting...' : (children || 'Connect X')}
    </button>
  );
}
