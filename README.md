# BNDE IDP Frontend - Interface d'Analyse de Documents

## 🏦 Description

Interface web moderne pour la **Banque Nationale pour le Développement Économique (BNDE)** du Sénégal. Cette application Node.js sert de frontend pour le système d'analyse intelligente de documents utilisant MuleSoft IDP.

## 🚀 Fonctionnalités

- **Upload de documents** : Glisser-déposer ou parcourir (PDF, PNG, JPG, TIFF)
- **Analyse en temps réel** : Suivi du traitement avec indicateur de progression
- **Résultats détaillés** : Extraction des informations des passeports
- **Historique** : Conservation des 10 dernières analyses
- **Interface moderne** : Design professionnel et responsive
- **Sécurité** : Token IDP configurable et sauvegardé localement

## 📋 Prérequis

- **Node.js** version 14 ou supérieure
- **npm** (installé avec Node.js)
- **MuleSoft IDP API** en cours d'exécution sur `http://localhost:8083`
- **Token d'accès IDP** valide

## 🛠️ Installation

### 1. Créer le dossier du projet

```bash
mkdir bnde-idp-frontend
cd bnde-idp-frontend
```

### 2. Créer la structure des dossiers

```bash
mkdir -p views public/css public/js
```

### 3. Copier les fichiers

Copiez tous les fichiers fournis dans leur emplacement respectif :

```
bnde-idp-frontend/
├── package.json
├── server.js
├── .env
├── README.md
├── views/
│   └── index.ejs
└── public/
    ├── css/
    │   └── style.css
    └── js/
        └── app.js
```

### 4. Installer les dépendances

```bash
npm install
```

## ⚙️ Configuration

### 1. Configuration de l'environnement

Modifiez le fichier `.env` selon vos besoins :

```env
# Port du serveur Node.js
PORT=3000

# URL de l'API MuleSoft
MULE_BASE_URL=http://localhost:8083
```

### 2. Vérifier que MuleSoft est en cours d'exécution

Assurez-vous que votre application MuleSoft est lancée et accessible sur `http://localhost:8083`.

## 🚀 Démarrage

### Mode Production

```bash
npm start
```

### Mode Développement (avec rechargement automatique)

```bash
npm run dev
```

L'application sera accessible sur : **http://localhost:3000**

## 📝 Guide d'Utilisation

### 1. Configuration initiale

1. Ouvrez votre navigateur et accédez à http://localhost:3000
2. Entrez votre **token IDP** dans le champ prévu
3. Le token sera sauvegardé automatiquement pour les prochaines utilisations

### 2. Analyser un document

1. **Glissez-déposez** un fichier dans la zone d'upload
   - OU cliquez sur "Parcourir les fichiers"
2. Formats acceptés : PDF, PNG, JPG, TIFF
3. Taille maximale : 10 MB
4. Cliquez sur **"Analyser le Document"**

### 3. Suivi du traitement

- Une fenêtre de progression s'affiche
- L'analyse prend généralement 10-30 secondes
- Le système vérifie automatiquement le statut toutes les 10 secondes

### 4. Consultation des résultats

Les résultats affichent :
- Le statut de l'analyse (Terminée ou Validation manuelle requise)
- Le nom du document
- Les informations extraites (numéro de passeport, nom, prénom, date)

**Statuts possibles :**
- **SUCCEEDED** : L'analyse est complète et les données ont été extraites avec succès
- **MANUAL_VALIDATION_REQUIRED** : Le document nécessite une validation manuelle par un agent

### 5. Historique

- Les 10 dernières analyses sont conservées
- L'historique est sauvegardé localement dans le navigateur
- Les statuts sont clairement indiqués (Analyse terminée, Validation requise)

## 🧪 Test Complet

### 1. Démarrer MuleSoft

```bash
cd /chemin/vers/idp_poc
mvn clean package
# Déployez l'application MuleSoft
```

### 2. Démarrer l'interface Node.js

```bash
cd /chemin/vers/bnde-idp-frontend
npm start
```

### 3. Tester avec un fichier

1. Préparez un fichier de passeport (PNG, JPG, PDF ou TIFF)
2. Obtenez un token IDP valide
3. Uploadez le fichier via l'interface
4. Attendez les résultats

## 🔍 Dépannage

### Erreur de connexion à MuleSoft

- Vérifiez que MuleSoft est bien démarré sur le port 8083
- Vérifiez l'URL dans le fichier `.env`

### Token invalide

- Assurez-vous d'utiliser un token IDP valide et non expiré
- Le token doit avoir les permissions nécessaires

### Upload échoué

- Vérifiez le format du fichier (PDF, PNG, JPG, TIFF uniquement)
- Vérifiez la taille (maximum 10 MB)
- Vérifiez la console du navigateur pour plus de détails

### Analyse trop longue

- L'analyse peut prendre jusqu'à 30 secondes
- Si l'erreur "Timeout" apparaît, réessayez

## 📂 Structure du Projet

```
bnde-idp-frontend/
├── package.json          # Dépendances Node.js
├── server.js            # Serveur Express principal
├── .env                 # Configuration d'environnement
├── README.md            # Documentation
├── views/
│   └── index.ejs        # Template HTML principal
└── public/
    ├── css/
    │   └── style.css    # Styles de l'interface
    └── js/
        └── app.js       # Logique côté client
```

## 🔒 Sécurité

- Le token IDP n'est jamais stocké côté serveur
- Le token est sauvegardé dans le localStorage du navigateur
- HTTPS recommandé en production
- Validations côté client et serveur

## 🎨 Personnalisation

### Modifier les couleurs

Éditez les variables CSS dans `public/css/style.css` :

```css
:root {
    --primary-color: #0056b3;    /* Bleu BNDE */
    --secondary-color: #28a745;   /* Vert */
    --accent-color: #ffc107;      /* Jaune */
}
```

### Modifier le logo

Remplacez l'icône dans `views/index.ejs` :

```html
<div class="logo">
    <i class="fas fa-landmark"></i>
</div>
```

## 📈 Améliorations Futures

- [ ] Support multi-langues (Français/Wolof/Anglais)
- [ ] Export des résultats en PDF
- [ ] Statistiques d'utilisation
- [ ] Mode batch pour plusieurs fichiers
- [ ] Intégration avec d'autres types de documents

## 💻 Support Technique

Pour toute question ou problème :

1. Consultez les logs du serveur Node.js
2. Vérifiez la console du navigateur (F12)
3. Consultez les logs MuleSoft
4. Vérifiez la configuration réseau

---

**© 2025 BNDE - Banque Nationale pour le Développement Économique du Sénégal**