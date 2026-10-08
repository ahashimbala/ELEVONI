import express from "express";
import 'dotenv/config';
import apiCorsGate from "./middleware/apiCors.js";

import connectDB from "./config/db.js";

import fishRouter from "./routes/fishRoute.js";
import userRouter from "./routes/userRoute.js";
import cartRouter from "./routes/cartRoute.js";
import reviewRouter from "./routes/reviewRoute.js";
import orderRouter from "./routes/orderRoute.js";
import paymentRouter from "./routes/paymentRoute.js";

import FishItem from "./models/fishModel.js";
import { CATALOGUE_QUERY } from "./services/catalogue.js";

const app = express();

app.use(apiCorsGate);

app.use(express.json());

connectDB();

app.get("/sitemap.xml", async(req, res) => {
    try {
        const items = await FishItem.find(CATALOGUE_QUERY, "_id updatedAt");

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
app.use("/api/payment", paymentRouter);

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