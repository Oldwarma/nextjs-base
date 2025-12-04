'use client';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

// Fallback for no framer-motion, using standard React
const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';

const DecryptedText = ({ text, className = '', speed = 50, maxIterations = 10, revealDirection = 'start' }) => {
  const [displayText, setDisplayText] = useState(text);
  const [isScrambling, setIsScrambling] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    let iteration = 0;
    
    const scramble = () => {
      setIsScrambling(true);
      clearInterval(intervalRef.current);
      
      intervalRef.current = setInterval(() => {
        setDisplayText(prev => 
          text
            .split('')
            .map((letter, index) => {
              if (index < iteration) {
                return text[index];
              }
              return characters[Math.floor(Math.random() * characters.length)];
            })
            .join('')
        );

        if (iteration >= text.length) {
          clearInterval(intervalRef.current);
          setIsScrambling(false);
        }
        
        iteration += 1 / 3;
      }, speed);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          scramble();
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    // Create a temporary element to observe since we return text directly usually
    // Actually, we need a ref on the container
    // For simplicity in this specific component without wrapping div too much:
    // We will trigger on mount for now, or rely on parent visual trigger.
    // Let's just trigger on mount with a slight delay for effect.
    const timer = setTimeout(scramble, 100);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timer);
    };
  }, [text, speed, maxIterations]);

  return <span className={className}>{displayText}</span>;
};

export default DecryptedText;

