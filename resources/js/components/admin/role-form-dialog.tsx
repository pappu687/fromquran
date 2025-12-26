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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

interface Permission {
    id: number;
    name: string;
}

interface Role {
    id: number;
    name: string;
    permissions: string[];
}

interface RoleFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    role: Role | null;
    allPermissions: Permission[];
    onSuccess: () => void;
}

export function RoleFormDialog({
    open,
    onOpenChange,
    role,
    allPermissions,
    onSuccess,
}: RoleFormDialogProps) {
    const [name, setName] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ name?: string; permissions?: string }>({});

    useEffect(() => {
        if (role) {
            setName(role.name);
            setSelectedPermissions(role.permissions || []);
        } else {
            setName('');
            setSelectedPermissions([]);
        }
        setErrors({});
    }, [role, open]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            const url = role ? `/admin/roles/${role.id}` : '/admin/roles';
            const method = role ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                credentials: 'include',
                body: JSON.stringify({
                    name,
                    permissions: selectedPermissions,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                if (data.errors) {
                    setErrors(data.errors);
                } else {
                    throw new Error(data.message || 'Failed to save role');
                }
                return;
            }

            onOpenChange(false);
            onSuccess();
        } catch (error) {
            console.error('Failed to save role:', error);
            alert(error instanceof Error ? error.message : 'Failed to save role');
        } finally {
            setIsSubmitting(false);
        }
    };

    const togglePermission = (permissionName: string) => {
        setSelectedPermissions((prev) =>
            prev.includes(permissionName)
                ? prev.filter((p) => p !== permissionName)
                : [...prev, permissionName]
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{role ? 'Edit Role' : 'Create New Role'}</DialogTitle>
                    <DialogDescription>
                        {role
                            ? 'Update the role name and permissions.'
                            : 'Create a new role and assign permissions.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Role Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Editor, Moderator"
                                disabled={isSubmitting}
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">{errors.name}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Permissions</Label>
                            <div className="rounded-lg border p-4 max-h-60 overflow-y-auto">
                                {allPermissions.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No permissions available
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        {allPermissions.map((permission) => (
                                            <div
                                                key={permission.id}
                                                className="flex items-center space-x-2"
                                            >
                                                <Checkbox
                                                    id={`permission-${permission.id}`}
                                                    checked={selectedPermissions.includes(
                                                        permission.name
                                                    )}
                                                    onCheckedChange={() =>
                                                        togglePermission(permission.name)
                                                    }
                                                    disabled={isSubmitting}
                                                />
                                                <label
                                                    htmlFor={`permission-${permission.id}`}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                >
                                                    {permission.name}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {errors.permissions && (
                                <p className="text-sm text-destructive">{errors.permissions}</p>
                            )}
                        </div>
                    </div>
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
                            ) : role ? (
                                'Update Role'
                            ) : (
                                'Create Role'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
