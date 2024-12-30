const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const app = express();

// Environment variables with fallbacks
const PORT = process.env.PORT || 8080;
const IMAGES_BASE_URL = process.env.IMAGES_BASE_URL || `http://localhost:${PORT}`;

// Middleware to parse JSON requests and handle CORS
app.use(express.json());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

// Serve static files from 'images' directory
app.use('/images', express.static(path.join(__dirname, 'images')));

// Basic root endpoint
app.get("/", (req, res) => {
    res.json({ 
        message: "Welcome to StyleSpot API", 
        version: "1.0.0",
        endpoints: [
            "/api/tshirts",
            "/api/tshirts/:id",
            "/api/tshirts/category/:category",
            "/api/tshirts/search"
        ]
    });
});

// Helper function to generate image URLs
const generateImageUrl = (imagePath) => {
    // Remove leading slash if present
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${IMAGES_BASE_URL}/${cleanPath}`;
};

// Helper function to read t-shirt data
const getTshirtsData = () => {
    try {
        const dataPath = path.join(__dirname, "tshirts.json");
        const rawData = fs.readFileSync(dataPath, 'utf8');
        return JSON.parse(rawData);
    } catch (error) {
        console.error("Error reading tshirts data:", error);
        return [];
    }
};

// Helper function to write t-shirt data
const writeTshirtsData = (data) => {
    try {
        const dataPath = path.join(__dirname, "tshirts.json");
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error("Error writing tshirts data:", error);
        return false;
    }
};

// GET all t-shirts
app.get("/api/tshirts", (req, res) => {
    try {
        const tshirts = getTshirtsData();
        const updatedTshirts = tshirts.map(tshirt => ({
            ...tshirt,
            imgUrl: generateImageUrl(tshirt.imgUrl)
        }));
        res.status(200).json(updatedTshirts);
    } catch (error) {
        res.status(500).json({ error: "Error fetching t-shirts data" });
    }
});

// GET single t-shirt by ID
app.get("/api/tshirts/:id", (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const tshirts = getTshirtsData();
        const tshirt = tshirts.find(t => t.id === id);

        if (!tshirt) {
            return res.status(404).json({ error: "T-shirt not found" });
        }

        const updatedTshirt = {
            ...tshirt,
            imgUrl: generateImageUrl(tshirt.imgUrl)
        };

        res.status(200).json(updatedTshirt);
    } catch (error) {
        res.status(500).json({ error: "Error fetching t-shirt data" });
    }
});

// POST new t-shirt
app.post("/api/tshirts", (req, res) => {
    try {
        const { name, brand, description, price, sizes, color, material, category, imgUrl } = req.body;

        // Validation
        if (!name || !brand || !description || !price) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const tshirts = getTshirtsData();
        const newId = Math.max(...tshirts.map(t => t.id)) + 1;

        const newTshirt = {
            id: newId,
            name,
            brand,
            description,
            price,
            sizes: sizes || ["M", "L"],
            color,
            material,
            inStock: true,
            category,
            imgUrl: imgUrl || "/images/default.jpg"
        };

        tshirts.push(newTshirt);

        if (!writeTshirtsData(tshirts)) {
            return res.status(500).json({ error: "Error saving t-shirt data" });
        }

        res.status(201).json(newTshirt);
    } catch (error) {
        res.status(500).json({ error: "Error creating new t-shirt" });
    }
});

// PUT (update) t-shirt
app.put("/api/tshirts/:id", (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const tshirts = getTshirtsData();
        const tshirtIndex = tshirts.findIndex(t => t.id === id);

        if (tshirtIndex === -1) {
            return res.status(404).json({ error: "T-shirt not found" });
        }

        const updatedTshirt = {
            ...tshirts[tshirtIndex],
            ...req.body,
            id // Preserve the original ID
        };

        tshirts[tshirtIndex] = updatedTshirt;

        if (!writeTshirtsData(tshirts)) {
            return res.status(500).json({ error: "Error updating t-shirt data" });
        }

        res.status(200).json(updatedTshirt);
    } catch (error) {
        res.status(500).json({ error: "Error updating t-shirt" });
    }
});

// DELETE t-shirt
app.delete("/api/tshirts/:id", (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const tshirts = getTshirtsData();
        const tshirtIndex = tshirts.findIndex(t => t.id === id);

        if (tshirtIndex === -1) {
            return res.status(404).json({ error: "T-shirt not found" });
        }

        tshirts.splice(tshirtIndex, 1);

        if (!writeTshirtsData(tshirts)) {
            return res.status(500).json({ error: "Error deleting t-shirt data" });
        }

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: "Error deleting t-shirt" });
    }
});

// Filter t-shirts by category
app.get("/api/tshirts/category/:category", (req, res) => {
    try {
        const category = req.params.category;
        const tshirts = getTshirtsData();
        const filteredTshirts = tshirts.filter(t =>
            t.category.toLowerCase() === category.toLowerCase()
        );

        const updatedFilteredTshirts = filteredTshirts.map(tshirt => ({
            ...tshirt,
            imgUrl: generateImageUrl(tshirt.imgUrl)
        }));

        res.status(200).json(updatedFilteredTshirts);
    } catch (error) {
        res.status(500).json({ error: "Error filtering t-shirts" });
    }
});

// Search t-shirts
app.get("/api/tshirts/search", (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({ error: "Search query required" });
        }

        const tshirts = getTshirtsData();
        const searchResults = tshirts.filter(t =>
            t.name.toLowerCase().includes(q.toLowerCase()) ||
            t.description.toLowerCase().includes(q.toLowerCase())
        );

        const updatedSearchResults = searchResults.map(tshirt => ({
            ...tshirt,
            imgUrl: generateImageUrl(tshirt.imgUrl)
        }));

        res.status(200).json(updatedSearchResults);
    } catch (error) {
        res.status(500).json({ error: "Error searching t-shirts" });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something broke!" });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Images base URL: ${IMAGES_BASE_URL}`);
});