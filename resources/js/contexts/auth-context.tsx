import { User } from '@/types';
import { router } from '@inertiajs/react';
import { type Page } from '@inertiajs/core';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    hasRole: (role: string) => boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
    user: User | null;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
    children,
    user,
}) => {
    const [currentUser, setCurrentUser] = useState<User | null>(user);

    useEffect(() => {
        setCurrentUser(user);
    }, [user]);

    useEffect(() => {
        return router.on('navigate', (event) => {
            const page = event.detail.page as Page;
            const nextUser = (page.props as { auth?: { user?: User | null } })
                .auth?.user;
            setCurrentUser(nextUser ?? null);
        });
    }, []);

    const isAuthenticated = !!currentUser;

    const hasRole = (role: string): boolean => {
        if (!currentUser || !currentUser.roles) return false;
        return currentUser.roles.includes(role);
    };

    const logout = () => {
        router.post('/logout');
    };

    const value: AuthContextType = {
        user: currentUser,
        isAuthenticated,
        hasRole,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
