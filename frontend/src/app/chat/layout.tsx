"use client";

import { ApolloProvider } from "@apollo/client";
import { apolloClient } from "@/lib/apollo";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
}
