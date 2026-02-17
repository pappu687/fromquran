import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { LoginForm } from '@/components/login-form';

interface LoginModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
                <DialogHeader className="sr-only">
                    <DialogTitle>Login</DialogTitle>
                    <DialogDescription>
                        Please login to continue.
                    </DialogDescription>
                </DialogHeader>
                <LoginForm className="border-0 shadow-none" />
            </DialogContent>
        </Dialog>
    );
}
