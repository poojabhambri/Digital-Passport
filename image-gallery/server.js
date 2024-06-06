const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());

// Serve the parent directory (Digital-Passport) as static
app.use(express.static(path.join(__dirname, '../')));

// Serve the vangallery.html at the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../vangallery.html'));
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.array('photos', 10), (req, res) => {
    res.json({ files: req.files.map(file => file.filename) });
});

app.get('/images', (req, res) => {
    fs.readdir('public/uploads', (err, files) => {
        if (err) {
            res.status(500).send('Error reading directory');
        } else {
            res.json(files);
        }
    });
});

app.delete('/delete/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, 'public/uploads', filename);
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error deleting file');
        } else {
            res.status(200).send('File deleted');
        }
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
