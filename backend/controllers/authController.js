const db = require("../database/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

/*
|--------------------------------------------------------------------------
| Obtener información de la clínica
|--------------------------------------------------------------------------
*/

exports.getClinic = (req, res) => {

    const clinic = db
        .prepare("SELECT * FROM settings LIMIT 1")
        .get();

    res.json(clinic || {});
};

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

exports.login = (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Correo y contraseña son obligatorios."
        });
    }

    const user = db
        .prepare("SELECT * FROM users WHERE email = ?")
        .get(email);

    if (!user) {
        return res.status(401).json({
            message: "Credenciales incorrectas."
        });
    }

    const valid = bcrypt.compareSync(password, user.password);

    if (!valid) {
        return res.status(401).json({
            message: "Credenciales incorrectas."
        });
    }

    const token = jwt.sign(
        {
            id: user.id,
            role: user.role
        },
        config.jwtSecret,
        {
            expiresIn: "7d"
        }
    );

    res.json({
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });

};

/*
|--------------------------------------------------------------------------
| Gestión de Usuarios
|--------------------------------------------------------------------------
*/

exports.getUsers = (req, res) => {
    try {
        const users = db
            .prepare("SELECT id, name, email, role, created_at FROM users ORDER BY id ASC")
            .all();
        res.json(users);
    } catch (err) {
        console.error("Error al obtener usuarios:", err);
        res.status(500).json({ message: "Error al obtener usuarios." });
    }
};

exports.createUser = (req, res) => {
    try {
        const { name, email, password, role = "veterinario" } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Nombre, email y contraseña son obligatorios." });
        }

        const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
        if (existing) {
            return res.status(400).json({ message: "El correo electrónico ya está registrado." });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        const stmt = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
        const result = stmt.run(name, email, hashedPassword, role);

        res.status(201).json({
            id: result.lastInsertRowid,
            name,
            email,
            role,
            message: "Usuario creado exitosamente con contraseña encriptada."
        });
    } catch (err) {
        console.error("Error al crear usuario:", err);
        res.status(500).json({ message: "Error al crear usuario." });
    }
};

exports.updateUser = (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role, password } = req.body;

        const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        // Si cambia de email, validar duplicados
        if (email && email !== user.email) {
            const existing = db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(email, id);
            if (existing) {
                return res.status(400).json({ message: "El correo electrónico ya está en uso por otro usuario." });
            }
        }

        let updatedPassword = user.password;
        if (password && password.trim().length > 0) {
            updatedPassword = bcrypt.hashSync(password, 10);
        }

        db.prepare(
            "UPDATE users SET name = ?, email = ?, role = ?, password = ? WHERE id = ?"
        ).run(
            name || user.name,
            email || user.email,
            role || user.role,
            updatedPassword,
            id
        );

        res.json({
            id: Number(id),
            name: name || user.name,
            email: email || user.email,
            role: role || user.role,
            message: "Usuario actualizado correctamente."
        });
    } catch (err) {
        console.error("Error al actualizar usuario:", err);
        res.status(500).json({ message: "Error al actualizar usuario." });
    }
};

exports.deleteUser = (req, res) => {
    try {
        const { id } = req.params;

        const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        // Si es admin, verificar que no sea el único admin
        if (user.role === "admin") {
            const adminCount = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'admin'").get().c;
            if (adminCount <= 1) {
                return res.status(400).json({ message: "No se puede eliminar el único administrador del sistema." });
            }
        }

        db.prepare("DELETE FROM users WHERE id = ?").run(id);
        res.json({ message: "Usuario eliminado correctamente." });
    } catch (err) {
        console.error("Error al eliminar usuario:", err);
        res.status(500).json({ message: "Error al eliminar usuario." });
    }
};

/*
|--------------------------------------------------------------------------
| Perfil del Usuario Actual y Cambio de Contraseña
|--------------------------------------------------------------------------
*/

exports.getProfile = (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "No autorizado." });
        }

        const user = db.prepare("SELECT id, name, email, role, created_at FROM users WHERE id = ?").get(userId);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        res.json(user);
    } catch (err) {
        console.error("Error al obtener perfil:", err);
        res.status(500).json({ message: "Error al obtener perfil." });
    }
};

exports.updateProfile = (req, res) => {
    try {
        const userId = req.user?.id;
        const { name, email, currentPassword, newPassword } = req.body;

        if (!userId) {
            return res.status(401).json({ message: "No autorizado." });
        }

        const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        // Si se cambia el email, verificar que no esté ocupado
        if (email && email.trim() !== user.email) {
            const existing = db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(email.trim(), userId);
            if (existing) {
                return res.status(400).json({ message: "El correo electrónico ya está registrado por otro usuario." });
            }
        }

        let updatedPassword = user.password;

        // Si se solicita cambio de contraseña
        if (newPassword && newPassword.trim().length > 0) {
            if (currentPassword) {
                const validCurrent = bcrypt.compareSync(currentPassword, user.password);
                if (!validCurrent) {
                    return res.status(400).json({ message: "La contraseña actual es incorrecta." });
                }
            }
            if (newPassword.trim().length < 4) {
                return res.status(400).json({ message: "La nueva contraseña debe tener al menos 4 caracteres." });
            }
            updatedPassword = bcrypt.hashSync(newPassword.trim(), 10);
        }

        const updatedName = (name && name.trim()) || user.name;
        const updatedEmail = (email && email.trim()) || user.email;

        db.prepare(
            "UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?"
        ).run(updatedName, updatedEmail, updatedPassword, userId);

        const updatedUser = {
            id: user.id,
            name: updatedName,
            email: updatedEmail,
            role: user.role
        };

        res.json({
            success: true,
            user: updatedUser,
            message: "Perfil y credenciales actualizados exitosamente."
        });
    } catch (err) {
        console.error("Error al actualizar perfil:", err);
        res.status(500).json({ message: "Error al actualizar perfil de usuario." });
    }
};
