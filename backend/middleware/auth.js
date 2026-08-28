const jwt = require("jsonwebtoken");
const config = require("../config/config");

module.exports = (req, res, next) => {

    console.log("Authorization:", req.headers.authorization);

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        console.log("❌ No llegó Authorization");
        return res.status(401).json({
            message: "Token no proporcionado."
        });
    }

    const token = authHeader.replace("Bearer ", "");

    console.log("TOKEN:", token);
    console.log("SECRET:", config.jwtSecret);

    try {

        const decoded = jwt.verify(token, config.jwtSecret);

        console.log("✅ JWT válido:", decoded);

        req.user = decoded;

        next();

    } catch (err) {

        console.log("❌ Error JWT:", err.message);

        return res.status(401).json({
            message: "Token inválido."
        });

    }

};