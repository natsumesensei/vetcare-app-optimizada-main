import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export function AuthProvider({ children }) {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // 🔄 Al cargar la app, restaurar la sesión si ya había un token guardado
    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (token && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser && parsedUser.id) {
                    setUser(parsedUser);
                } else {
                    throw new Error("Sesión almacenada inválida");
                }
            } catch {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
            }
        }

        setLoading(false);
    }, []);

    function login(userData, token) {

        setUser(userData);
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));

    }

    function updateUserData(newUserData) {
        setUser((prev) => {
            const updated = { ...prev, ...newUserData };
            localStorage.setItem("user", JSON.stringify(updated));
            return updated;
        });
    }

    function logout() {

        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // 🔥 IMPORTANTE: evita reload y flash
        navigate("/login", { replace: true });

    }

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUserData, loading }}>
            {children}
        </AuthContext.Provider>
    );

}

export function useAuth() {
    return useContext(AuthContext);
}