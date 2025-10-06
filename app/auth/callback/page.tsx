"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallback() {
    const router = useRouter();

    useEffect(() => {
        const hash = window.location.hash; // z.B. #token=eyJhbGciOi...
        if (hash.startsWith('#token=')) {
            const token = decodeURIComponent(hash.substring(7));
            // Minimales Hardening: whitespace trimmen
            const clean = token.trim();
            if (clean.split('.').length === 3) {
                localStorage.setItem('auth_token', clean);
            }
            // Hash entfernen (kein Referrer-Leak)
            history.replaceState(null, '', window.location.pathname);
        }
        router.replace('/');
    }, [router]);

    return <p>Authentifiziere...</p>;
}
