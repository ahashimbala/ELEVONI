import cors from "cors";

const allowedOrigins = [
    "https://elevonifarms.vercel.app",
    "https://elevonifarms-git-main-elevoni.vercel.app",
    "https://elevoni-admin.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174"
];

const corsOptions = {
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "token"]
};

const apiCors = cors(corsOptions);

const apiCorsGate = (req, res, next) => {
    const isGoogleRedirectPost =
        req.method === "POST" &&
        req.path === "/api/user/google" &&
        req.is("application/x-www-form-urlencoded");
    if (isGoogleRedirectPost) return next();
    return apiCors(req, res, next);
};

export default apiCorsGate;
