import express from "express";
import cors from "cors";
import 'dotenv/config';

import connectDB from "./config/db.js";

import fishRouter from "./routes/fishRoute.js";
import userRouter from "./routes/userRoute.js";
import cartRouter from "./routes/cartRoute.js";
import reviewRouter from "./routes/reviewRoute.js";
import orderRouter from "./routes/orderRoute.js";

import { FishItem } from "./models/fishModel.js";

const app = express();

const allowedOrigins = [
    "https://elevonifarms.vercel.app",
    "https://elevonifarms-git-main-elevoni.vercel.app",
    "https://elevoni-admin.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174"
];

app.use(cors({
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
}));

app.use(express.json());

connectDB();

app.get("/sitemap.xml", async(req, res) => {
    try {
        const items = await FishItem.find({}, "_id updatedAt");

        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        xml += `  <url>\n    <loc>https://elevonifarms.vercel.app/</loc>\n    <priority>1.00</priority>\n    <changefreq>daily</changefreq>\n  </url>\n`;

        items.forEach((item) => {
            const lastModDate = item.updatedAt ?
                new Date(item.updatedAt).toISOString().split("T")[0] :
                new Date().toISOString().split("T")[0];

            xml += `  <url>\n`;
            xml += `    <loc>https://elevonifarms.vercel.app/product/${item._id}</loc>\n`;
            xml += `    <lastmod>${lastModDate}</lastmod>\n`;
            xml += `    <changefreq>weekly</changefreq>\n`;
            xml += `    <priority>0.80</priority>\n`;
            xml += `  </url>\n`;
        });

        xml += `</urlset>`;

        res.header("Content-Type", "application/xml");
        return res.status(200).send(xml);
    } catch (error) {
        res.header("Content-Type", "application/xml");
        return res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?><error>Error generating sitemap</error>`);
    }
});

app.use("/images", express.static("uploads"));

app.use("/api/fish", fishRouter);
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/review", reviewRouter);
app.use("/api/order", orderRouter);

app.get("/", (req, res) => {
    res.send("API Working");
});

if (process.env.NODE_ENV !== 'production') {
    const port = 4000;
    app.listen(port, () => {
        console.log(`Server Started on http://localhost:${port}`);
    });
}

export default app;