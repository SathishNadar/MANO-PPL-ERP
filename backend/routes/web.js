import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router()

// console.log(path.join(__dirname + "../../../frontend/dahboard/homepage.html"))


// Serve HTML via custom routes
router.get("/home", (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/dahboard/homepage.html"));
  });

// router.use(express.static('frontend'));
router.use(express.static(path.join(__dirname, "../../frontend"))); 
  
export default router;
