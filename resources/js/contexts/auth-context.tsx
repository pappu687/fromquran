import { User } from '@/types';
import { router } from '@inertiajs/react';
import React, { createContext, ReactNode, useContext } from 'react';

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
    const isAuthenticated = !!user;

    const hasRole = (role: string): boolean => {
        if (!user || !user.roles) return false;
        return user.roles.includes(role);
    };

    const logout = () => {
        router.post('/logout');
    };

    const value: AuthContextType = {
        user,
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
