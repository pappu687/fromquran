import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

interface Role {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    roles?: Role[];
}

interface UserFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user?: User | null;
    onSuccess?: () => void;
}

interface UserFormPayload {
    name: string;
    email: string;
    roles: number[];
    password?: string;
    password_confirmation?: string;
}

export function UserFormDialog({
    open,
    onOpenChange,
    user,
    onSuccess,
}: UserFormDialogProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
    const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const isEditing = !!user;

    useEffect(() => {
        if (open) {
            // Load roles
            loadRoles();

            // Set form values if editing
            if (user) {
                setName(user.name);
                setEmail(user.email);
                setSelectedRoles(user.roles?.map((r) => r.id) || []);
                setPassword('');
                setPasswordConfirmation('');
            } else {
                // Reset form for new user
                setName('');
                setEmail('');
                setPassword('');
                setPasswordConfirmation('');
                setSelectedRoles([]);
            }
            setErrors({});
        }
    }, [open, user]);

    const loadRoles = async () => {
        setIsLoading(true);
        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            const response = await fetch('/api/admin/users/roles', {
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setAvailableRoles(data);
            }
        } catch (error) {
            console.error('Failed to load roles:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrors({});
        setIsSubmitting(true);

        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');

        const payload: UserFormPayload = {
            name,
            email,
            roles: selectedRoles,
        };

        // Only include password for new users or if being updated
        if (!isEditing || password) {
            payload.password = password;
            payload.password_confirmation = passwordConfirmation;
        }

        try {
            const url = isEditing
                ? `/api/admin/users/${user.id}`
                : '/api/admin/users';
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 422 && data.errors) {
                    setErrors(data.errors);
                } else {
                    setErrors({
                        general: data.message || 'An error occurred',
                    });
                }
                setIsSubmitting(false);
                return;
            }

            // Success
            onOpenChange(false);
            onSuccess?.();
        } catch {
            setErrors({ general: 'Network error. Please try again.' });
            setIsSubmitting(false);
        }
    };

    const toggleRole = (roleId: number) => {
        setSelectedRoles((prev) =>
            prev.includes(roleId)
                ? prev.filter((id) => id !== roleId)
                : [...prev, roleId]
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit User' : 'Create New User'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update user information and roles'
                            : 'Add a new user to the platform and assign roles'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {errors.general && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            {errors.general}
                        </div>
                    )}

                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isSubmitting}
                            placeholder="John Doe"
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">{errors.name}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email">
                            Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isSubmitting}
                            placeholder="john@example.com"
                        />
                        {errors.email && (
                            <p className="text-sm text-destructive">{errors.email}</p>
                        )}
                    </div>

                    {/* Password (required for new users, optional for editing) */}
                    <div className="space-y-2">
                        <Label htmlFor="password">
                            Password{' '}
                            {!isEditing && <span className="text-red-500">*</span>}
                            {isEditing && (
                                <span className="text-muted-foreground text-sm">
                                    (leave blank to keep current)
                                </span>
                            )}
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isSubmitting}
                            placeholder="Min. 8 characters"
                        />
                        {errors.password && (
                            <p className="text-sm text-destructive">{errors.password}</p>
                        )}
                    </div>

                    {/* Password Confirmation */}
                    {(password || !isEditing) && (
                        <div className="space-y-2">
                            <Label htmlFor="password_confirmation">
                                Confirm Password{' '}
                                {!isEditing && (
                                    <span className="text-red-500">*</span>
                                )}
                            </Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                value={passwordConfirmation}
                                onChange={(e) =>
                                    setPasswordConfirmation(e.target.value)
                                }
                                disabled={isSubmitting}
                                placeholder="Re-enter password"
                            />
                            {errors.password_confirmation && (
                                <p className="text-sm text-destructive">
                                    {errors.password_confirmation}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Roles */}
                    <div className="space-y-2">
                        <Label>Roles</Label>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {availableRoles.map((role) => (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() => toggleRole(role.id)}
                                        className={cn(
                                            'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                                            selectedRoles.includes(role.id)
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : 'border-border bg-background hover:bg-muted'
                                        )}
                                    >
                                        {role.name}
                                    </button>
                                ))}
                            </div>
                        )}
                        {errors.roles && (
                            <p className="text-sm text-destructive">{errors.roles}</p>
                        )}
                    </div>

                    {/* Selected Roles Display */}
                    {selectedRoles.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {availableRoles
                                .filter((r) => selectedRoles.includes(r.id))
                                .map((role) => (
                                    <Badge key={role.id} variant="secondary">
                                        {role.name}
                                    </Badge>
                                ))}
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : isEditing ? (
                                'Update User'
                            ) : (
                                'Create User'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
