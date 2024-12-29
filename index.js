const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 8080;

// Middleware to parse JSON requests and handle CORS
app.use(express.json());
app.use(cors());

// Serve the 'images' folder statically
app.use('/images', express.static('images'));

// Helper function to generate full image URLs
const generateImageUrl = (req, imagePath) => `${req.protocol}://${req.get('host')}${imagePath}`;

// Read t-shirt data from JSON file
const getTshirtsData = () => {
    const dataPath = path.join(__dirname, "tshirts.json");
    const rawData = fs.readFileSync(dataPath);
    return JSON.parse(rawData);
};

// GET all t-shirts
app.get("/api/tshirts", (req, res) => {
    const tshirts = getTshirtsData();
    const updatedTshirts = tshirts.map(tshirt => ({
        ...tshirt,
        imgUrl: generateImageUrl(req, tshirt.imgUrl)
    }));
    res.status(200).json(updatedTshirts);
});

// GET single t-shirt by ID
app.get("/api/tshirts/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const tshirts = getTshirtsData();
    const tshirt = tshirts.find(t => t.id === id);

    if (!tshirt) {
        return res.status(404).json({ error: "T-shirt not found" });
    }

    // Add full image URL dynamically
    tshirt.imgUrl = generateImageUrl(req, tshirt.imgUrl);

    res.status(200).json(tshirt);
});

// POST new t-shirt
app.post("/api/tshirts", (req, res) => {
    const { name, brand, description, price, sizes, color, material, category, imgUrl } = req.body;

    // Validation
    if (!name || !brand || !description || !price) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const tshirts = getTshirtsData();

    const newTshirt = {
        id: tshirts.length + 1,
        name,
        brand,
        description,
        price,
        sizes: sizes || ["M", "L"],
        color,
        material,
        inStock: true,
        category,
        imgUrl: imgUrl || "/images/default.jpg" // Default image path
    };

    tshirts.push(newTshirt);

    // Save updated data back to JSON file
    fs.writeFileSync(path.join(__dirname, "tshirts.json"), JSON.stringify(tshirts, null, 2));

    res.status(201).json(newTshirt);
});

// PUT (update) t-shirt
app.put("/api/tshirts/:id", (req, res) => {
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

    // Save updated data back to JSON file
    fs.writeFileSync(path.join(__dirname, "tshirts.json"), JSON.stringify(tshirts, null, 2));

    res.status(200).json(updatedTshirt);
});

// DELETE t-shirt
app.delete("/api/tshirts/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const tshirts = getTshirtsData();
    const tshirtIndex = tshirts.findIndex(t => t.id === id);

    if (tshirtIndex === -1) {
        return res.status(404).json({ error: "T-shirt not found" });
    }

    tshirts.splice(tshirtIndex, 1);

    // Save updated data back to JSON file
    fs.writeFileSync(path.join(__dirname, "tshirts.json"), JSON.stringify(tshirts, null, 2));

    res.status(204).send();
});

// Filter t-shirts by category
app.get("/api/tshirts/category/:category", (req, res) => {
    const category = req.params.category;
    const tshirts = getTshirtsData();
    const filteredTshirts = tshirts.filter(t =>
        t.category.toLowerCase() === category.toLowerCase()
    );

    const updatedFilteredTshirts = filteredTshirts.map(tshirt => ({
        ...tshirt,
        imgUrl: generateImageUrl(req, tshirt.imgUrl)
    }));

    res.status(200).json(updatedFilteredTshirts);
});

// Search t-shirts
app.get("/api/tshirts/search", (req, res) => {
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
        imgUrl: generateImageUrl(req, tshirt.imgUrl)
    }));

    res.status(200).json(updatedSearchResults);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
