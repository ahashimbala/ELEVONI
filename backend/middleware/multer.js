import multer from "multer";
import os from "os";

const storage = multer.diskStorage({
    destination: process.env.NODE_ENV === 'production' ? os.tmpdir() : "uploads",
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});

const upload = multer({ storage });

export default upload;