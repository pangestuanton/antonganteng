import { useState, useRef, useCallback } from "react";
import styles from "./ChatInput.module.css";

export default function ChatInput({
  onSend,
  onStop,
  isLoading,
  isStreaming,
  disabled = false,
  placeholder = "Ask Antoniqueee AI anything...",
}) {
  const [input, setInput] = useState("");
  const textareaRef = useRef(null);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || isStreaming || disabled) return;
    onSend(trimmed);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, isLoading, isStreaming, disabled, onSend]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  const isBusy = isLoading || isStreaming;

  return (
    <div className={styles.container}>
      <div className={`${styles.inputWrapper} ${isBusy ? styles.busy : ""}`}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          aria-label="Chat message input"
        />

        <div className={styles.actions}>
          <span className={styles.hint}>
            {input.length > 0 ? `${input.length} chars` : "Shift+Enter for newline"}
          </span>

          {isBusy ? (
            <button
              className={styles.stopBtn}
              onClick={onStop}
              title="Stop generating"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              Stop
            </button>
          ) : (
            <button
              className={`${styles.sendBtn} ${input.trim() ? styles.sendBtnActive : ""}`}
              onClick={handleSubmit}
              disabled={!input.trim() || disabled}
              title="Send message (Enter)"
              aria-label="Send message"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <p className={styles.disclaimer}>
        Antoniqueee AI may make mistakes. Verify important information.
      </p>
    </div>
  );
}
