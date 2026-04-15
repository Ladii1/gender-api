const express = require('express');
const axios = require('axios');
const cors = require('cors');

const db = require('./db');
const { uuidv7 } = require('uuidv7');

const app = express();

app.use(cors());
app.use(express.json());

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

app.post('/api/profiles', async (req, res) => {
    try {
        const name = req.body.name;

        if (!name) {
            return res.status(400).json({
                status: "error",
                message: "Missing name"
            });
        }

        if (typeof name !== 'string') {
            return res.status(422).json({
                status: "error",
                message: "Invalid type"
            });
        }

        db.get("SELECT * FROM profiles WHERE name = ?", [name], async (err, row) => {
            if (row) {
                return res.json({
                    status: "success",
                    message: "Profile already exists",
                    data: row
                });
            }

            try {
                const [genderRes, ageRes, nationRes] = await Promise.all([
                    axios.get(`https://api.genderize.io?name=${name}`),
                    axios.get(`https://api.agify.io?name=${name}`),
                    axios.get(`https://api.nationalize.io?name=${name}`)
                ]);

                const g = genderRes.data;
                const a = ageRes.data;
                const n = nationRes.data;

                if (g.gender === null || g.count === 0) {
                    return res.status(502).json({
                        status: "error",
                        message: "Genderize returned an invalid response"
                    });
                }

                if (a.age === null) {
                    return res.status(502).json({
                        status: "error",
                        message: "Agify returned an invalid response"
                    });
                }

                if (!n.country || n.country.length === 0) {
                    return res.status(502).json({
                        status: "error",
                        message: "Nationalize returned an invalid response"
                    });
                }

                let age_group = "";
                if (a.age <= 12) age_group = "child";
                else if (a.age <= 19) age_group = "teenager";
                else if (a.age <= 59) age_group = "adult";
                else age_group = "senior";

                const topCountry = n.country.reduce((max, curr) =>
                    curr.probability > max.probability ? curr : max
                );

                const id = uuidv7();
                const created_at = new Date().toISOString();

                const profile = {
                    id,
                    name,
                    gender: g.gender,
                    gender_probability: g.probability,
                    sample_size: g.count,
                    age: a.age,
                    age_group,
                    country_id: topCountry.country_id,
                    country_probability: topCountry.probability,
                    created_at
                };

                db.run(`
                    INSERT INTO profiles VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, Object.values(profile));

                return res.status(201).json({
                    status: "success",
                    data: profile
                });

            } catch (error) {
                return res.status(500).json({
                    status: "error",
                    message: "Server error"
                });
            }
        });

    } catch (err) {
        return res.status(500).json({
            status: "error",
            message: "Server error"
        });
    }
});

app.get('/api/profiles/:id', (req, res) => {
    db.get("SELECT * FROM profiles WHERE id = ?", [req.params.id], (err, row) => {
        if (!row) {
            return res.status(404).json({
                status: "error",
                message: "Profile not found"
            });
        }

        res.json({
            status: "success",
            data: row
        });
    });
});

app.get('/api/profiles', (req, res) => {
    let query = "SELECT * FROM profiles WHERE 1=1";
    const params = [];

    if (req.query.gender) {
        query += " AND LOWER(gender) = ?";
        params.push(req.query.gender.toLowerCase());
    }

    if (req.query.country_id) {
        query += " AND LOWER(country_id) = ?";
        params.push(req.query.country_id.toLowerCase());
    }

    if (req.query.age_group) {
        query += " AND LOWER(age_group) = ?";
        params.push(req.query.age_group.toLowerCase());
    }

    db.all(query, params, (err, rows) => {
        res.json({
            status: "success",
            count: rows.length,
            data: rows.map(r => ({
                id: r.id,
                name: r.name,
                gender: r.gender,
                age: r.age,
                age_group: r.age_group,
                country_id: r.country_id
            }))
        });
    });
});

app.delete('/api/profiles/:id', (req, res) => {
    db.run("DELETE FROM profiles WHERE id = ?", [req.params.id], function () {
        if (this.changes === 0) {
            return res.status(404).json({
                status: "error",
                message: "Profile not found"
            });
        }

        res.status(204).send();
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
