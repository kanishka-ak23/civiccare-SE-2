import path from 'path';
import express from 'express';
import { fileURLToPath } from 'url';
import app from './api/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static frontend files from Vite's dist folder
app.use(express.static(path.join(__dirname, 'dist')));

// Handle all React Router navigation by serving the index.html fallback
app.get('/(.*)', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Full-stack server running on port ${PORT}`);
});
import path from "path";

// Serve frontend build
const __dirname = new URL('.', import.meta.url).pathname;

app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});