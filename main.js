const {app, BrowserWindow, ipcMain } = require('electron')
const path = require('path');
const fs = require("fs");


let mainWindow;
let urlInstance = "/.TyroServ/";
let urlInstanceLauncher = urlInstance + "Launcher/";

function createWindow () {
    mainWindow = new BrowserWindow({
        frame: false,
        title: "TyroServ Loader - 0.1.0",
        width: 419,
        height: 572,
        resizable: false,
        icon: path.join(__dirname, "/asset/logo.png"),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        }
    })

    mainWindow.loadFile('module/index.html')
    mainWindow.setMenuBarVisibility(false);

}

// CREATION DE L'ONGLET PRINCIPAL
app.whenReady().then(() => {
    createWindow()

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0){
            createWindow()
        }
    })

})

ipcMain.on("start", (event, data) =>{


    let TyroServInstance = path.join(app.getPath("appData"), urlInstance);


    // VERIFIER SI LA S2 EST INSTALLER
    let oldTyroServFile = path.join(app.getPath("appData"), urlInstance + "minecraft.jar");
    let oldTempDirTyroServ = path.join(app.getPath("appData"), ".TyroServ-S2/");
    let oldNewDirTyroServ = path.join(app.getPath("appData"), urlInstance + "TyroServ-S2/");
    if (fs.existsSync(oldTyroServFile)) {
        const moveFolderRecursive = function (source, destination) {
            if (fs.existsSync(source)) {
                fs.mkdirSync(destination, { recursive: true }); // Créer le répertoire de destination s'il n'existe pas
                fs.readdirSync(source).forEach((file, index) => {
                    const currentPath = path.join(source, file);
                    const newPath = path.join(destination, file);
                    if (fs.lstatSync(currentPath).isDirectory()) {
                        // Récursivement, déplacer les sous-dossiers
                        moveFolderRecursive(currentPath, newPath);
                    } else {
                        // Déplacer le fichier
                        fs.renameSync(currentPath, newPath);
                    }
                });
                // Supprimer le répertoire une fois vide
                fs.rmdirSync(source);
                console.log(`Le contenu du repertoire ${source} a ete déplace vers ${destination}.`);
            } else {
                console.log(`Le repertoire ${source} n'existe pas.`);
            }
        };

        const deleteFolderRecursive = function (directory) {
            if (fs.existsSync(directory)) {
                fs.readdirSync(directory).forEach((file, index) => {
                    const currentPath = path.join(directory, file);
                    if (fs.lstatSync(currentPath).isDirectory()) {
                        // Récursivement, supprimer les sous-dossiers
                        deleteFolderRecursive(currentPath);
                    } else {
                        // Supprimer le fichier
                        fs.unlinkSync(currentPath);
                    }
                });
                // Supprimer le répertoire une fois vide
                fs.rmdirSync(directory);
                console.log(`Le repertoire ${directory} a ete supprime.`);
            } else {
                console.log(`Le repertoire ${directory} n'existe pas.`);
            }
        };


        moveFolderRecursive(TyroServInstance, oldTempDirTyroServ)
        deleteFolderRecursive(TyroServInstance);
        moveFolderRecursive(oldTempDirTyroServ, oldNewDirTyroServ)

    }

    // Si il existe déjà un tyroserv
    if (!fs.existsSync(TyroServInstance)) {
        console.log("a creer");
    }




});
