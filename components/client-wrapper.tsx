"use client";

import React from "react";
import AuthDebugger from "./auth-debugger";

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AuthDebugger />
      {children}
    </>
  );
}
