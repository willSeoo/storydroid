import { useEffect, useState } from 'react';

interface RotatingMemeMessageProps {
  messages: string[];
  intervalMs?: number;
  className?: string;
}

export function RotatingMemeMessage({ messages, intervalMs = 1800, className = '' }: RotatingMemeMessageProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [messages, intervalMs]);

  return (
    <p className={`caret transition-opacity duration-300 ${className}`} key={index}>
      {messages[index]}
    </p>
  );
}

export function MemeMessage({ text, className = '' }: { text: string; className?: string }) {
  return <p className={className}>{text}</p>;
}
