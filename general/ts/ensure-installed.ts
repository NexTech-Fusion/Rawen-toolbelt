const { exec } = require('child_process');

function isPackageMissing(packageName) {
    try {
        require.resolve(packageName);
        return false;
    } catch (error) {
        return true;
    }
}

async function installPackage(packageName) {
    return new Promise((resolve, reject) => {
        exec(`npm install ${packageName}`, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                setTimeout(resolve, 2000);
            }
        });
    });
}

export async function ensurePackagesInstalled(requiredPackages: string[]) {
    for (const packageName of requiredPackages) {
        if (isPackageMissing(packageName)) {
            console.log(`Installing ${packageName}...`);
            try {
                await installPackage(packageName);
                console.log(`${packageName} installed successfully.`);
            } catch (error) {
                console.error(`Error installing ${packageName}:`, error);
            }
        }
    }
}
