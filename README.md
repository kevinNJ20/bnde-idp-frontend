# BNDE IDP Frontend - Interface d'Analyse de Documents

## 🏦 Description

Interface web moderne pour la **Banque Nationale pour le Développement Économique (BNDE)** du Sénégal. Cette application Node.js sert de frontend pour le système d'analyse intelligente de documents utilisant MuleSoft IDP.

Ce projet fonctionne en tandem avec le backend MuleSoft disponible ici : [https://github.com/kevinNJ20/idp_poc](https://github.com/kevinNJ20/idp_poc)

## 🚀 Fonctionnalités

- **Upload de documents** : Glisser-déposer ou parcourir (PDF, PNG, JPG, TIFF)
- **Génération de token** : Interface intégrée pour générer automatiquement votre token IDP
- **Analyse en temps réel** : Suivi du traitement avec indicateur de progression
- **Résultats détaillés** : Extraction des informations des passeports
- **Historique** : Conservation des 10 dernières analyses
- **Interface moderne** : Design professionnel et responsive
- **Sécurité** : Token IDP configurable et sauvegardé localement

## 📋 Prérequis

- **Node.js** version 14 ou supérieure
- **npm** (installé avec Node.js)
- **MuleSoft IDP API** en cours d'exécution sur `http://localhost:8083`
  - Backend disponible sur : [https://github.com/kevinNJ20/idp_poc](https://github.com/kevinNJ20/idp_poc)
- **Identifiants MuleSoft** (Client ID et Client Secret) ou **Token d'accès IDP** valide

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │ ── │   Backend       │ ── │  MuleSoft IDP   │ ── │   SFTP Server   │
│  (Node.js/EJS)  │    │  (Mule 4 App)   │    │   (Analysis)    │    │ (File Storage)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
       ↓                                              ↓
┌─────────────────┐                          ┌─────────────────┐
│ MuleSoft OAuth  │                          │ Document Model  │
│   (Token Gen)   │                          │   (Passport)    │
└─────────────────┘                          └─────────────────┘
```

## 🛠️ Installation

### 1. Cloner le backend MuleSoft

```bash
# Cloner et configurer le backend
git clone https://github.com/kevinNJ20/idp_poc.git
cd idp_poc
# Suivre les instructions du README pour démarrer le backend
```

### 2. Cloner ce projet (Frontend)

```bash
# Dans un nouveau terminal
git clone <url-de-ce-repo>
cd bnde-idp-frontend
```

### 3. Installer les dépendances

```bash
npm install
```

### 4. Configurer l'environnement

Modifiez le fichier `.env` selon vos besoins :

```env
# Port du serveur Node.js
PORT=3000

# URL de l'API MuleSoft (backend)
MULE_BASE_URL=http://localhost:8083
```

## ⚙️ Configuration

### Configuration MuleSoft IDP

Vous avez besoin de l'un des éléments suivants :

1. **Token d'accès IDP** : Si vous avez déjà un token
2. **Client ID et Client Secret** : Pour générer automatiquement un token

Pour obtenir vos identifiants MuleSoft :
1. Connectez-vous à [Anypoint Platform](https://anypoint.mulesoft.com)
2. Accédez à votre organisation
3. Créez une application cliente pour obtenir les identifiants

## 🚀 Démarrage

### 1. Démarrer le backend MuleSoft

```bash
cd idp_poc
mvn clean package
# Déployez l'application MuleSoft selon votre environnement
```

### 2. Démarrer le frontend

#### Mode Production

```bash
npm start
```

#### Mode Développement (avec rechargement automatique)

```bash
npm run dev
```

L'application sera accessible sur : **http://localhost:3000**

## 📝 Guide d'Utilisation

### 1. Configuration initiale

#### Option A : Utiliser un token existant
1. Ouvrez votre navigateur et accédez à http://localhost:3000
2. Entrez votre **token IDP** dans le champ prévu
3. Le token sera sauvegardé automatiquement pour les prochaines utilisations

#### Option B : Générer un nouveau token
1. Cliquez sur le bouton **"🪄 Générer un token"**
2. Dans la fenêtre qui s'ouvre, entrez :
   - **Client ID** : Votre identifiant client MuleSoft
   - **Client Secret** : Votre secret client MuleSoft
3. Cliquez sur **"Générer le Token"**
4. Le token sera automatiquement généré et placé dans le champ

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
- Possibilité d'actualiser le statut des documents en validation manuelle

## 🔒 Sécurité

### Génération de token
- Interface sécurisée pour générer des tokens sans exposer les identifiants
- Client Secret masqué par défaut (affichable avec le bouton œil)
- Les identifiants ne sont jamais stockés, seul le token généré est sauvegardé
- Communication HTTPS avec l'API MuleSoft OAuth

### Stockage
- Le token IDP est stocké localement dans le navigateur (localStorage)
- Aucune information sensible n'est stockée côté serveur
- Les documents uploadés sont traités en mémoire et envoyés directement au backend

### Recommandations
- Utilisez HTTPS en production
- Ne partagez jamais votre token ou vos identifiants
- Régénérez régulièrement vos tokens

## 🧪 Test Complet

### 1. Vérifier le backend

```bash
# Tester que le backend MuleSoft est accessible
curl http://localhost:8083/sendFile
# Devrait retourner une erreur 405 (Method Not Allowed) - c'est normal
```

### 2. Démarrer l'interface

```bash
cd bnde-idp-frontend
npm start
```

### 3. Générer un token de test

1. Accédez à http://localhost:3000
2. Cliquez sur "Générer un token"
3. Entrez vos identifiants MuleSoft de test
4. Vérifiez que le token est généré avec succès

### 4. Tester avec un fichier

1. Préparez un fichier de passeport (PNG, JPG, PDF ou TIFF)
2. Uploadez le fichier via l'interface
3. Attendez les résultats

## 🔍 Dépannage

### Erreur de connexion à MuleSoft

- Vérifiez que MuleSoft est bien démarré sur le port 8083
- Vérifiez l'URL dans le fichier `.env`
- Consultez les logs du backend : [https://github.com/kevinNJ20/idp_poc](https://github.com/kevinNJ20/idp_poc)

### Échec de génération de token

- **"Identifiants invalides"** : Vérifiez votre Client ID et Client Secret
- **"Erreur de connexion"** : Vérifiez votre connexion internet
- **"Token expiré"** : Les tokens ont une durée de vie de 3600 secondes (1 heure)

### Token invalide

- Assurez-vous d'utiliser un token IDP valide et non expiré
- Régénérez un nouveau token si nécessaire
- Le token doit avoir les permissions nécessaires pour l'IDP

### Upload échoué

- Vérifiez le format du fichier (PDF, PNG, JPG, TIFF uniquement)
- Vérifiez la taille (maximum 10 MB)
- Vérifiez la console du navigateur (F12) pour plus de détails

### Analyse trop longue

- L'analyse peut prendre jusqu'à 30 secondes
- Si l'erreur "Timeout" apparaît après 5 minutes, réessayez
- Vérifiez le statut dans l'historique et utilisez le bouton "Actualiser"

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
        └── app.js       # Logique côté client (avec génération de token)
```

## 🔗 Liens Utiles

- **Backend MuleSoft** : [https://github.com/kevinNJ20/idp_poc](https://github.com/kevinNJ20/idp_poc)
- **Documentation MuleSoft IDP** : [MuleSoft Documentation](https://docs.mulesoft.com)
- **Anypoint Platform** : [https://anypoint.mulesoft.com](https://anypoint.mulesoft.com)

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
- [ ] Authentification utilisateur
- [ ] Dashboard d'administration
- [ ] API REST documentée avec Swagger

## 💻 Support Technique

Pour toute question ou problème :

1. **Frontend** : Consultez les logs du serveur Node.js et la console du navigateur (F12)
2. **Backend** : Consultez la documentation sur [https://github.com/kevinNJ20/idp_poc](https://github.com/kevinNJ20/idp_poc)
3. **Token/Auth** : Vérifiez vos identifiants sur Anypoint Platform
4. **IDP** : Consultez la documentation MuleSoft IDP

### Logs utiles

```bash
# Logs du frontend
npm start

# Logs du navigateur
F12 > Console

# Tester la connectivité
curl http://localhost:8083
curl https://eu1.anypoint.mulesoft.com/accounts/api/v2/oauth2/token
```

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commitez vos changements (`git commit -am 'Ajoute nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créez une Pull Request

## 📄 Licence

Ce projet est un POC à des fins de démonstration et d'apprentissage.

---

**© 2025 BNDE - Banque Nationale pour le Développement Économique du Sénégal**

**Développé avec ❤️ pour moderniser les services bancaires au Sénégal**