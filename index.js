const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

app.use(cors());

const PORT = 3000;

app.get('/api/classify', async (req, res) => {
    try {
        const name = req.query.name;

        if (!name) {
            return res.status(400).json({
                status: "error",
                message: "Missing name parameter"
            });
        }

        if (typeof name !== 'string') {
            return res.status(422).json({
                status: "error",
                message: "Name must be a string"
            });
        }

        const response = await axios.get(`https://api.genderize.io?name=${name}`);
        const data = response.data;

        if (data.gender === null || data.count === 0) {
            return res.status(400).json({
                status: "error",
                message: "No prediction available for the provided name"
            });
        }

        const probability = data.probability;
        const sample_size = data.count;

        const is_confident = probability >= 0.7 && sample_size >= 100;

        const processed_at = new Date().toISOString();

        return res.status(200).json({
            status: "success",
            data: {
                name: data.name,
                gender: data.gender,
                probability: probability,
                sample_size: sample_size,
                is_confident: is_confident,
                processed_at: processed_at
            }
        });

    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Server error"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
