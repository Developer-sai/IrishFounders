"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/actions/auth";
import { Button, buttonVariants } from "@/components/ui/button";

/**
 * Sign-in / apply buttons that depend on the visitor's session.
 * Kept as a client island so the surrounding header (and the pages that use it) stay static.
 * getSession() only reads the local cookie, it does not hit the network.
 */
export function AuthNav() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (signedIn) {
    return (
      <>
        <Link href="/feed" className={buttonVariants({ variant: "outline", size: "sm" })}>Open app</Link>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">Sign out</Button>
        </form>
      </>
    );
  }
  return (
    <>
      <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>Sign in</Link>
      <Link href="/signup" className={buttonVariants({ variant: "accent", size: "sm" })}>Apply</Link>
    </>
  );
}
