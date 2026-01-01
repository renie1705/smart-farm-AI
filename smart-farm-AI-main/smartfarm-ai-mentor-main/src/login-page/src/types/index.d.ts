interface User {
    id: string;
    username: string;
    email: string;
}

interface AuthResponse {
    user: User;
    token: string;
}

declare module 'useAuth' {
    export function useAuth(): {
        login: (username: string, password: string) => Promise<AuthResponse>;
        logout: () => void;
        user: User | null;
    };
}