import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

type TurnstileProps = {
    fieldName?: string;
};

export function TurnstileWidget({
    fieldName = 'turnstile_token',
}: TurnstileProps) {
    const page = usePage<{
        turnstile?: { enabled: boolean; siteKey?: string };
    }>();
    const turnstile = page.props.turnstile;
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!turnstile?.enabled || !turnstile.siteKey) {
            return;
        }

        (window as any).onTurnstileSuccess = (token: string) => {
            if (inputRef.current) {
                inputRef.current.value = token;
            }
        };

        return () => {
            if ((window as any).onTurnstileSuccess) {
                (window as any).onTurnstileSuccess = undefined;
            }
        };
    }, [turnstile?.enabled, turnstile?.siteKey]);

    if (!turnstile?.enabled || !turnstile.siteKey) {
        return null;
    }

    return (
        <>
            <input type="hidden" name={fieldName} ref={inputRef} />
            <div
                className="cf-turnstile"
                data-sitekey={turnstile.siteKey}
                data-callback="onTurnstileSuccess"
            />
        </>
    );
}
