import "../styles/globals.css";
import { Toaster } from "react-hot-toast";
import Head from "next/head";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Antoniqueee AI</title>
        <meta name="description" content="Your intelligent AI assistant — powered by Gemini" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Component {...pageProps} />

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-default)",
            fontFamily: "var(--font-body)",
            fontSize: "0.85rem",
          },
          success: {
            iconTheme: { primary: "var(--success)", secondary: "var(--bg-card)" },
          },
          error: {
            iconTheme: { primary: "var(--error)", secondary: "var(--bg-card)" },
          },
        }}
      />
    </>
  );
}
