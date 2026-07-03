import express from "express";
import { FishItem } from "../models/fishModel.js";

const router = express.Router();

router.get("/sitemap.xml", async(req, res) => {
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

export default router;