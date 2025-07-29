"use client";

import { useState, useCallback, useRef, useEffect } from 'react';

export default function useSimulatedTyper(textToType: string) {
    const [typedText, setTypedText] = useState('');
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const startTyping = useCallback(() => {
        setTypedText('');

        let i = 0;
        const typeCharacter = () => {
            if (i < textToType.length) {
                setTypedText(prev => prev + textToType.charAt(i));
                i++;
                const delay = Math.random() * 20 + 10; // Faster typing
                typingTimeoutRef.current = setTimeout(typeCharacter, delay);
            } else {
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }
            }
        };

        typeCharacter();

    }, [textToType]);
    
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    return { typedText, startTyping };
}
