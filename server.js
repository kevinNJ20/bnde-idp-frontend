const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const MULE_BASE_URL = process.env.MULE_BASE_URL || 'http://localhost:8083';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
    abortOnLimit: true,
    responseOnLimit: "Le fichier est trop volumineux. Taille maximale: 10 MB"
}));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

// Route pour générer un token IDP
app.post('/api/generate-token', async (req, res) => {
    try {
        const { client_id, client_secret } = req.body;

        if (!client_id || !client_secret) {
            return res.status(400).json({ 
                success: false, 
                message: 'Client ID et Client Secret sont requis' 
            });
        }

        // Appel à l'API MuleSoft pour générer le token
        const response = await axios.post(
            'https://eu1.anypoint.mulesoft.com/accounts/api/v2/oauth2/token',
            {
                grant_type: 'client_credentials',
                client_id: client_id,
                client_secret: client_secret
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json({
            success: true,
            data: response.data
        });

    } catch (error) {
        console.error('Erreur génération token:', error);
        
        // Gestion des erreurs spécifiques
        if (error.response) {
            if (error.response.status === 401) {
                res.status(401).json({ 
                    success: false, 
                    message: 'Identifiants invalides. Vérifiez votre Client ID et Client Secret.' 
                });
            } else {
                res.status(error.response.status).json({ 
                    success: false, 
                    message: error.response.data?.error_description || 'Erreur lors de la génération du token' 
                });
            }
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Erreur de connexion au service de génération de token' 
            });
        }
    }
});

// Route pour uploader un document
app.post('/api/upload', async (req, res) => {
    try {
        if (!req.files || !req.files.document) {
            return res.status(400).json({ 
                success: false, 
                message: 'Aucun fichier n\'a été téléchargé' 
            });
        }

        const file = req.files.document;
        const token = req.body.token;

        if (!token) {
            return res.status(400).json({ 
                success: false, 
                message: 'Token IDP requis' 
            });
        }

        // Vérifier le type de fichier
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff', 'application/pdf'];
        if (!allowedTypes.includes(file.mimetype)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Type de fichier non supporté. Formats acceptés: PNG, JPG, TIFF, PDF' 
            });
        }

        // Créer le FormData pour l'envoi à MuleSoft
        const FormData = require('form-data');
        const formData = new FormData();
        formData.append('file', file.data, file.name);

        // Envoyer à MuleSoft
        const response = await axios.post(
            `${MULE_BASE_URL}/sendFile?token=${token}`,
            formData,
            {
                headers: {
                    ...formData.getHeaders()
                }
            }
        );

        res.json({
            success: true,
            data: response.data
        });

    } catch (error) {
        console.error('Erreur upload:', error);
        res.status(500).json({ 
            success: false, 
            message: error.response?.data?.message || 'Erreur lors de l\'upload du document' 
        });
    }
});

// Route pour vérifier le statut d'une exécution
app.get('/api/execution/:id', async (req, res) => {
    try {
        const executionId = req.params.id;
        const token = req.query.token;
        const fileName = req.query.fileName;

        if (!token) {
            return res.status(400).json({ 
                success: false, 
                message: 'Token IDP requis' 
            });
        }

        // Construire l'URL avec tous les paramètres
        let url = `${MULE_BASE_URL}/execution/${executionId}?token=${token}`;
        if (fileName) {
            url += `&fileName=${encodeURIComponent(fileName)}`;
        }

        const response = await axios.get(url);

        // Normaliser la réponse pour le frontend
        const responseData = response.data;
        
        // Si MuleSoft retourne "in review, wait a few minutes", le transformer
        if (responseData && responseData.status === "in review, wait a few minutes") {
            responseData.isManualValidationRequired = true;
        }

        res.json({
            success: true,
            data: responseData
        });

    } catch (error) {
        console.error('Erreur vérification:', error);
        res.status(500).json({ 
            success: false, 
            message: error.response?.data?.message || 'Erreur lors de la vérification du statut' 
        });
    }
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════════════════╗
    ║                                                       ║
    ║   🏦 BNDE IDP Frontend - Serveur démarré             ║
    ║                                                       ║
    ║   URL: http://localhost:${PORT}                           ║
    ║   API MuleSoft: ${MULE_BASE_URL}           ║
    ║                                                       ║
    ╚═══════════════════════════════════════════════════════╝
    `);
});