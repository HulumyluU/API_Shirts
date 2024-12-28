const express = require("express");
const app = express();
const PORT = 8080;

app.use(express.json());


const tshirts = [
    {
        id: 1,
        name: "Classic Cotton Crew",
        brand: "StyleSpot Basics",
        description: "Premium cotton crew neck t-shirt with a relaxed fit",
        price: 29.99,
        sizes: ["S", "M", "L", "XL"],
        color: "White",
        material: "100% Organic Cotton",
        inStock: true,
        category: "Basic"
    },
    {
        id: 2,
        name: "Urban Street Graphic",
        brand: "UrbanEdge",
        description: "Street-style graphic tee with custom artwork",
        price: 34.99,
        sizes: ["M", "L", "XL"],
        color: "Black",
        material: "95% Cotton, 5% Elastane",
        inStock: true,
        category: "Graphic"
    }
 //...
];

// GET all t-shirts
app.get("/api/tshirts", (req, res) => {
    res.status(200).json(tshirts);
});

// GET single t-shirt by ID
app.get("/api/tshirts/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const tshirt = tshirts.find(t => t.id === id);
    
    if (!tshirt) {
        return res.status(404).json({ error: "T-shirt not found" });
    }
    
    res.status(200).json(tshirt);
});

// POST new t-shirt
app.post("/api/tshirts", (req, res) => {
    const {
        name,
        brand,
        description,
        price,
        sizes,
        color,
        material,
        category
    } = req.body;

    // Validation
    if (!name || !brand || !description || !price) {
        return res.status(400).json({ error: "Missing required fields" });
    }

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
        category
    };

    tshirts.push(newTshirt);
    res.status(201).json(newTshirt);
});

// PUT (update) t-shirt
app.put("/api/tshirts/:id", (req, res) => {
    const id = parseInt(req.params.id);
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
    res.status(200).json(updatedTshirt);
});

// DELETE t-shirt
app.delete("/api/tshirts/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const tshirtIndex = tshirts.findIndex(t => t.id === id);
    
    if (tshirtIndex === -1) {
        return res.status(404).json({ error: "T-shirt not found" });
    }

    tshirts.splice(tshirtIndex, 1);
    res.status(204).send();
});

// Filter t-shirts by category
app.get("/api/tshirts/category/:category", (req, res) => {
    const category = req.params.category;
    const filteredTshirts = tshirts.filter(t => 
        t.category.toLowerCase() === category.toLowerCase()
    );
    
    res.status(200).json(filteredTshirts);
});

// Search t-shirts
app.get("/api/tshirts/search", (req, res) => {
    const { q } = req.query;
    
    if (!q) {
        return res.status(400).json({ error: "Search query required" });
    }

    const searchResults = tshirts.filter(t => 
        t.name.toLowerCase().includes(q.toLowerCase()) ||
        t.description.toLowerCase().includes(q.toLowerCase())
    );
    
    res.status(200).json(searchResults);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});