import { createContext, useContext, useState, type ReactNode } from "react";
import { apiRequest } from "../api/client";

type TokenResponse = { accessToken: string; tokenType: string };
type AuthContextValue = {
	accessToken: string | null;
	email: string | null;
	login: (email: string, password: string) => Promise<void>;
	register: (email: string, password: string) => Promise<void>;
	logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [accessToken, setAccessToken] = useState(() => sessionStorage.getItem("accessToken"));
	const [email, setEmail] = useState(() => sessionStorage.getItem("accountEmail"));

	async function login(userEmail: string, password: string) {
		const result = await apiRequest<TokenResponse>("/api/auth/login", {
			method: "POST",
			body: JSON.stringify({ email: userEmail, password }),
		});
		sessionStorage.setItem("accessToken", result.accessToken);
		sessionStorage.setItem("accountEmail", userEmail);
		setAccessToken(result.accessToken);
		setEmail(userEmail);
	}

	async function register(userEmail: string, password: string) {
		await apiRequest<void>("/api/auth/register", {
			method: "POST",
			body: JSON.stringify({ email: userEmail, password }),
		});
		await login(userEmail, password);
	}

	function logout() {
		sessionStorage.removeItem("accessToken");
		sessionStorage.removeItem("accountEmail");
		setAccessToken(null);
		setEmail(null);
	}

	return (
		<AuthContext.Provider value={{ accessToken, email, login, register, logout }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) throw new Error("useAuth must be used inside AuthProvider");
	return context;
}
