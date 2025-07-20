// Configuration
const POLLING_INTERVAL = 10000; // 10 secondes (respect de la limite MuleSoft IDP)
const MAX_POLLING_ATTEMPTS = 30; // Maximum 5 minutes d'attente

// État de l'application
let selectedFile = null;
let executionHistory = JSON.parse(localStorage.getItem('bnde_history') || '[]');
let currentExecutionId = null;
let currentToken = null;
let currentFileName = null;

// Éléments DOM
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const filePreview = document.getElementById('filePreview');
const uploadBtn = document.getElementById('uploadBtn');
const resultsSection = document.getElementById('resultsSection');
const resultsContent = document.getElementById('resultsContent');
const historyContent = document.getElementById('historyContent');
const loadingModal = document.getElementById('loadingModal');
const loadingMessage = document.getElementById('loadingMessage');
const idpTokenInput = document.getElementById('idpToken');

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    displayHistory();
    
    // Charger le token depuis le localStorage s'il existe
    const savedToken = localStorage.getItem('bnde_idp_token');
    if (savedToken) {
        idpTokenInput.value = savedToken;
    }
});

// Gestionnaires d'événements
function initializeEventListeners() {
    // File input
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Token input
    idpTokenInput.addEventListener('change', (e) => {
        localStorage.setItem('bnde_idp_token', e.target.value);
    });
}

// Gestion des fichiers
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        validateAndSetFile(file);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    
    const file = e.dataTransfer.files[0];
    if (file) {
        validateAndSetFile(file);
    }
}

function validateAndSetFile(file) {
    // Vérifier le type de fichier
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
        showError('Type de fichier non supporté. Formats acceptés: PNG, JPG, TIFF, PDF');
        return;
    }
    
    // Vérifier la taille (10 MB max)
    if (file.size > 10 * 1024 * 1024) {
        showError('Le fichier est trop volumineux. Taille maximale: 10 MB');
        return;
    }
    
    selectedFile = file;
    displayFilePreview(file);
}

function displayFilePreview(file) {
    const fileName = document.querySelector('.file-name');
    const fileSize = document.querySelector('.file-size');
    
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    
    filePreview.style.display = 'block';
    uploadBtn.style.display = 'block';
}

function removeFile() {
    selectedFile = null;
    fileInput.value = '';
    filePreview.style.display = 'none';
    uploadBtn.style.display = 'none';
}

// Upload du document
async function uploadDocument() {
    if (!selectedFile) {
        showError('Veuillez sélectionner un fichier');
        return;
    }
    
    const token = idpTokenInput.value.trim();
    if (!token) {
        showError('Veuillez entrer votre token IDP');
        idpTokenInput.focus();
        return;
    }
    
    showLoadingModal('Upload du document en cours...');
    
    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('token', token);
    
    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Erreur lors de l\'upload');
        }
        
        // Récupérer l'executionId et le fileName depuis la réponse
        const executionId = data.data.executionID;
        const fileName = data.data.fileName;
        
        // Sauvegarder le fileName pour les appels futurs
        currentFileName = fileName;
        
        // Démarrer le polling pour vérifier le statut
        startPolling(executionId, token, fileName);
        
    } catch (error) {
        hideLoadingModal();
        showError(error.message);
    }
}

// Polling pour vérifier le statut
async function startPolling(executionId, token, fileName) {
    let attempts = 0;
    
    // Sauvegarder pour pouvoir actualiser plus tard
    currentExecutionId = executionId;
    currentToken = token;
    currentFileName = fileName;
    
    const poll = async () => {
        attempts++;
        
        updateLoadingMessage(`Analyse en cours... (${attempts * 10}s)`);
        
        try {
            // Inclure le fileName dans l'URL
            const url = `/api/execution/${executionId}?token=${token}&fileName=${encodeURIComponent(fileName)}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Erreur lors de la vérification');
            }
            
            // Vérifier si c'est une réponse "in review" (validation manuelle requise)
            if (data.data && (data.data.status === "in review, wait a few minutes" || data.data.isManualValidationRequired)) {
                // C'est un MANUAL_VALIDATION_REQUIRED
                hideLoadingModal();
                displayManualValidationRequired(executionId);
                removeFile();
                return;
            }
            
            // Vérifier si le traitement est terminé avec succès
            if ((data.data && data.data.status === 'SUCCEEDED') || data.data.Result) {
                hideLoadingModal();
                displayResults(data.data);
                saveToHistory(data.data);
                removeFile();
                return;
            }
            
            // Continuer le polling si pas terminé
            if (attempts < MAX_POLLING_ATTEMPTS) {
                setTimeout(poll, POLLING_INTERVAL);
            } else {
                throw new Error('Timeout: L\'analyse prend trop de temps');
            }
            
        } catch (error) {
            hideLoadingModal();
            showError(error.message);
        }
    };
    
    // Attendre 10 secondes avant le premier appel
    setTimeout(poll, POLLING_INTERVAL);
}

// Affichage pour validation manuelle requise
function displayManualValidationRequired(executionId) {
    let html = '<div class="results-container">';
    
    // Statut
    html += `
        <div class="result-item">
            <span class="result-label">Statut</span>
            <span class="status-badge status-processing">Validation manuelle requise</span>
        </div>
    `;
    
    // ID d'exécution
    html += `
        <div class="result-item">
            <span class="result-label">ID de traitement</span>
            <span class="result-value">${executionId}</span>
        </div>
    `;
    
    // Message d'information
    html += `
        <div class="result-item" style="background-color: #fff3cd; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
            <div style="color: #856404;">
                <i class="fas fa-exclamation-triangle" style="margin-right: 0.5rem;"></i>
                <strong>Validation manuelle nécessaire</strong>
                <p style="margin-top: 0.5rem; margin-bottom: 0;">
                    Le document nécessite une vérification manuelle par un agent. 
                    Veuillez contacter le service concerné pour finaliser le traitement.
                </p>
                <p style="margin-top: 0.5rem; margin-bottom: 0; font-size: 0.875rem;">
                    Référence du dossier : <strong>${executionId}</strong>
                </p>
            </div>
        </div>
    `;
    
    // Bouton Actualiser
    html += `
        <div style="text-align: center; margin-top: 2rem;">
            <button class="btn btn-primary" onclick="refreshExecutionStatus('${executionId}')">
                <i class="fas fa-sync-alt"></i> Actualiser le statut
            </button>
            <p style="margin-top: 0.5rem; font-size: 0.875rem; color: #6c757d;">
                Cliquez pour vérifier si la validation manuelle a été effectuée
            </p>
        </div>
    `;
    
    html += '</div>';
    
    resultsContent.innerHTML = html;
    resultsSection.style.display = 'block';
    
    // Sauvegarder dans l'historique
    const historyItem = {
        id: executionId,
        documentName: selectedFile ? selectedFile.name : 'Document',
        timestamp: new Date().toISOString(),
        status: 'MANUAL_VALIDATION_REQUIRED',
        result: 'Validation manuelle requise',
        fileName: currentFileName, // Sauvegarder le fileName MuleSoft
        analysisData: null // Pas encore de données d'analyse
    };
    saveToHistory(historyItem);
    
    // Faire défiler jusqu'aux résultats
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Fonction pour actualiser le statut d'une exécution
async function refreshExecutionStatus(executionId) {
    // Utiliser l'executionId passé en paramètre ou celui sauvegardé
    const execId = executionId || currentExecutionId;
    const token = currentToken || idpTokenInput.value.trim();
    const fileName = currentFileName;
    
    if (!token) {
        showError('Token IDP requis pour actualiser le statut');
        return;
    }
    
    if (!fileName) {
        showError('Nom du fichier manquant. Veuillez réuploader le document.');
        return;
    }
    
    // Afficher un indicateur de chargement sur le bouton
    const button = event.target;
    const originalContent = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Vérification en cours...';
    button.disabled = true;
    
    try {
        // Inclure le fileName dans l'URL
        const url = `/api/execution/${execId}?token=${token}&fileName=${encodeURIComponent(fileName)}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Erreur lors de la vérification');
        }
        
        // Vérifier le nouveau statut
        if (data.data && data.data.status === 'SUCCEEDED') {
            // Le document a été validé, afficher les résultats
            displayResults(data.data);
            // Mettre à jour l'historique avec les nouvelles données
            updateHistoryItem(execId, data.data);
            // Faire défiler jusqu'aux résultats
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        } else if (data.data && data.data.Result && data.data.datas) {
            // Cas où on a directement le résultat avec les données
            displayResults(data.data);
            updateHistoryItem(execId, data.data);
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        } else if (data.data && (data.data.status === "in review, wait a few minutes" || data.data.isManualValidationRequired)) {
            // Toujours en validation manuelle
            showInfo('Le document est toujours en attente de validation manuelle');
            // Restaurer le bouton
            button.innerHTML = originalContent;
            button.disabled = false;
        } else {
            // Autre statut
            showInfo(`Statut actuel : ${data.data.status || 'En cours'}`);
            button.innerHTML = originalContent;
            button.disabled = false;
        }
        
    } catch (error) {
        showError(error.message);
        // Restaurer le bouton
        button.innerHTML = originalContent;
        button.disabled = false;
    }
}

// Fonction pour mettre à jour un élément de l'historique
function updateHistoryItem(executionId, data) {
    const index = executionHistory.findIndex(item => item.id === executionId);
    if (index !== -1) {
        executionHistory[index].status = data.status || 'SUCCEEDED';
        executionHistory[index].result = data.Result || 'Analyse terminée';
        localStorage.setItem('bnde_history', JSON.stringify(executionHistory));
        displayHistory();
    }
}

// Fonction pour afficher une notification d'information
function showInfo(message) {
    const notification = document.createElement('div');
    notification.className = 'info-notification';
    notification.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Supprimer après 5 secondes
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Affichage des résultats
function displayResults(data) {
    const isPassport = data.datas && data.datas.check_infos;
    const status = data.status || (data.datas && data.datas.status);
    
    let html = '<div class="results-container">';
    
    // Statut général
    if (status === 'MANUAL_VALIDATION_REQUIRED') {
        html += `
            <div class="result-item">
                <span class="result-label">Statut</span>
                <span class="status-badge status-processing">Validation manuelle requise</span>
            </div>
        `;
        
        html += `
            <div class="result-item" style="background-color: #fff3cd; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
                <div style="color: #856404;">
                    <i class="fas fa-exclamation-triangle" style="margin-right: 0.5rem;"></i>
                    <strong>Validation manuelle nécessaire</strong>
                    <p style="margin-top: 0.5rem; margin-bottom: 0;">
                        Le document nécessite une vérification manuelle par un agent. 
                        Veuillez contacter le service concerné pour finaliser le traitement.
                    </p>
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="result-item">
                <span class="result-label">Statut</span>
                <span class="status-badge status-valid">Analyse terminée</span>
            </div>
        `;
    }
    
    // Document analysé
    html += `
        <div class="result-item">
            <span class="result-label">Document</span>
            <span class="result-value">${data.documentName || data.datas.documentName}</span>
        </div>
    `;
    
    // Résultat de l'analyse
    if (data.Result) {
        html += `
            <div class="result-item">
                <span class="result-label">Résultat</span>
                <span class="result-value">${data.Result}</span>
            </div>
        `;
    }
    
    // Détails du passeport (seulement si le statut est SUCCEEDED)
    if (isPassport && status !== 'MANUAL_VALIDATION_REQUIRED') {
        const info = data.datas.check_infos;
        
        html += '<h4 style="margin: 1.5rem 0 1rem 0; color: var(--primary-color);">Informations extraites</h4>';
        
        if (info.numero_passeport) {
            html += `
                <div class="result-item">
                    <span class="result-label">Numéro de passeport</span>
                    <span class="result-value">${info.numero_passeport}</span>
                </div>
            `;
        }
        
        if (info.nom) {
            html += `
                <div class="result-item">
                    <span class="result-label">Nom</span>
                    <span class="result-value">${info.nom}</span>
                </div>
            `;
        }
        
        if (info.prenom) {
            html += `
                <div class="result-item">
                    <span class="result-label">Prénom</span>
                    <span class="result-value">${info.prenom}</span>
                </div>
            `;
        }
        
        if (info.date) {
            html += `
                <div class="result-item">
                    <span class="result-label">Date</span>
                    <span class="result-value">${formatDate(info.date)}</span>
                </div>
            `;
        }
    }
    
    html += '</div>';
    
    resultsContent.innerHTML = html;
    resultsSection.style.display = 'block';
    
    // Faire défiler jusqu'aux résultats
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Historique
function saveToHistory(data) {
    // Si data est déjà un objet d'historique (depuis displayManualValidationRequired)
    if (data.timestamp && data.documentName) {
        executionHistory.unshift(data);
    } else {
        // Sinon, créer l'objet d'historique à partir des données de l'API
        const historyItem = {
            id: data.id || data.executionId,
            documentName: data.documentName || data.datas.documentName || (selectedFile ? selectedFile.name : 'Document'),
            timestamp: new Date().toISOString(),
            status: data.status || (data.datas && data.datas.status) || 'SUCCEEDED',
            result: data.Result,
            fileName: currentFileName // Sauvegarder le fileName MuleSoft
        };
        executionHistory.unshift(historyItem);
    }
    
    // Garder seulement les 10 derniers
    if (executionHistory.length > 10) {
        executionHistory = executionHistory.slice(0, 10);
    }
    
    localStorage.setItem('bnde_history', JSON.stringify(executionHistory));
    displayHistory();
}

function displayHistory() {
    if (executionHistory.length === 0) {
        historyContent.innerHTML = '<p class="empty-state">Aucune analyse effectuée pour le moment</p>';
        return;
    }
    
    let html = '';
    executionHistory.forEach((item, index) => {
        let statusBadgeClass = 'status-valid';
        let statusText = item.status;
        let actionButton = '';
        
        if (item.status === 'MANUAL_VALIDATION_REQUIRED') {
            statusBadgeClass = 'status-processing';
            statusText = 'Validation requise';
            // Ajouter un bouton d'actualisation si on a le fileName
            if (item.fileName) {
                actionButton = `
                    <button class="btn-refresh-history" onclick="refreshFromHistory('${item.id}', '${item.fileName}')" title="Actualiser le statut">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                `;
            }
        } else if (item.status === 'SUCCEEDED' && item.analysisData) {
            // Ajouter un bouton pour voir les détails
            actionButton = `
                <button class="btn-view-history" onclick="viewDetailsFromHistory(${index})" title="Voir les détails">
                    <i class="fas fa-eye"></i>
                </button>
            `;
        }
        
        html += `
            <div class="history-item">
                <div>
                    <strong>${item.documentName}</strong>
                    <br>
                    <small>${formatDateTime(item.timestamp)}</small>
                </div>
                <div class="history-actions">
                    <span class="status-badge ${statusBadgeClass}">${statusText}</span>
                    ${actionButton}
                </div>
            </div>
        `;
    });
    
    historyContent.innerHTML = html;
}

// Fonction pour visualiser les détails depuis l'historique
function viewDetailsFromHistory(index) {
    const item = executionHistory[index];
    if (!item || !item.analysisData) {
        showError('Aucune donnée disponible pour cet élément');
        return;
    }
    
    // S'assurer que la section des résultats est visible
    resultsSection.style.display = 'block';
    
    // Afficher les résultats
    displayResults(item.analysisData);
    
    // Ajouter une indication que c'est depuis l'historique
    showInfo(`Affichage des résultats de : ${item.documentName}`);
    
    // Faire défiler jusqu'aux résultats
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Fonction pour actualiser depuis l'historique
function refreshFromHistory(executionId, fileName) {
    // Restaurer les variables globales
    currentExecutionId = executionId;
    currentFileName = fileName;
    currentToken = idpTokenInput.value.trim();
    
    if (!currentToken) {
        showError('Veuillez entrer votre token IDP pour actualiser');
        idpTokenInput.focus();
        return;
    }
    
    // Utiliser la fonction existante
    refreshExecutionStatus(executionId);
}

// Utilitaires
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showError(message) {
    // Créer une notification d'erreur
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Supprimer après 5 secondes
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function showLoadingModal(message) {
    loadingMessage.textContent = message;
    loadingModal.style.display = 'flex';
}

function hideLoadingModal() {
    loadingModal.style.display = 'none';
}

function updateLoadingMessage(message) {
    loadingMessage.textContent = message;
}

// Style pour les notifications d'erreur
const style = document.createElement('style');
style.textContent = `
    .error-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--danger-color);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        animation: slideIn 0.3s ease-out;
        z-index: 3000;
    }
    
    .info-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--primary-color);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        animation: slideIn 0.3s ease-out;
        z-index: 3000;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);