import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { format } from "date-fns";
import styles from "./ChatBubble.module.css";

// Code block with copy button
function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false);
  const language = className?.replace("language-", "") || "code";

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.codeBlock}>
      <div className={styles.codeHeader}>
        <span className={styles.codeLanguage}>{language}</span>
        <button className={styles.copyBtn} onClick={handleCopy}>
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <pre className={styles.codeContent}>
        <code>{children}</code>
      </pre>
    </div>
  );
}

// Typing indicator
export function TypingIndicator() {
  return (
    <div className={`${styles.bubble} ${styles.ai}`}>
      <div className={styles.aiIcon}>✦</div>
      <div className={styles.bubbleContent}>
        <div className={styles.typingDots}>
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

// Streaming bubble
export function StreamingBubble({ content }) {
  return (
    <div className={`${styles.bubble} ${styles.ai} ${styles.streaming}`}>
      <div className={styles.aiIcon}>✦</div>
      <div className={styles.bubbleContent}>
        <div className={`markdown-body ${styles.markdownBody}`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                if (inline) {
                  return <code className={styles.inlineCode} {...props}>{children}</code>;
                }
                return <CodeBlock className={className}>{children}</CodeBlock>;
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
        <span className={styles.cursor} />
      </div>
    </div>
  );
}

// Main ChatBubble component
export default function ChatBubble({ message, isLast }) {
  const isUser = message.sender === "user";
  const isAI = message.sender === "assistant";
  const [showTime, setShowTime] = useState(false);

  const timeStr = message.timestamp
    ? format(new Date(message.timestamp), "HH:mm")
    : "";

  return (
    <div
      className={`${styles.bubble} ${isUser ? styles.user : styles.ai} ${isLast ? styles.last : ""}`}
      onClick={() => setShowTime(!showTime)}
    >
      {isAI && <div className={styles.aiIcon}>✦</div>}

      <div className={styles.bubbleWrapper}>
        <div className={styles.bubbleContent}>
          {isUser ? (
            <p className={styles.userText}>{message.content}</p>
          ) : (
            <div className={`markdown-body ${styles.markdownBody}`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    if (inline) {
                      return <code className={styles.inlineCode} {...props}>{children}</code>;
                    }
                    return <CodeBlock className={className}>{children}</CodeBlock>;
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {showTime && timeStr && (
          <span className={`${styles.timestamp} ${isUser ? styles.timestampRight : styles.timestampLeft}`}>
            {timeStr}
          </span>
        )}
      </div>

      {isUser && (
        <div className={styles.userIcon}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        </div>
      )}
    </div>
  );
}
