"use client";

import { useState, useCallback, useRef, useEffect } from 'react';

export default function useSimulatedTyper(textToType: string) {
    const [typedText, setTypedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const startTyping = useCallback(() => {
        if (isTyping) return;

        setIsTyping(true);
        setTypedText('');

        let i = 0;
        const typeCharacter = () => {
            if (i < textToType.length) {
                setTypedText(prev => prev + textToType.charAt(i));
                i++;
                const delay = Math.random() * 100 + 50; // Random delay between 50ms and 150ms
                typingTimeoutRef.current = setTimeout(typeCharacter, delay);
            } else {
                setIsTyping(false);
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }
            }
        };

        typeCharacter();

    }, [textToType, isTyping]);
    
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    return { typedText, isTyping, startTyping };
}
