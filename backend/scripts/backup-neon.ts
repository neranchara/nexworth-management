import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PG_DUMP_PATH = '"C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe"'; // Use quotes for paths with spaces
const BACKUP_DIR = path.join(__dirname, '..', '..', 'backups');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const OUTPUT_FILE = path.join(BACKUP_DIR, `neon_prod_backup_${TIMESTAMP}.sql`);

// Neon Production URL - Now loaded from Environment Variable for safety
const DB_URL = process.env.PROD_DATABASE_URL;

if (!DB_URL) {
    console.error('ERROR: PROD_DATABASE_URL environment variable is not set!');
    process.exit(1);
}

async function backup() {
    console.log('----------------------------------------------------');
    console.log('🚀 Starting Backup of Neon Production Database (TS)');
    console.log(`📅 Time: ${new Date().toLocaleString()}`);
    console.log(`📂 Output: ${OUTPUT_FILE}`);
    console.log('----------------------------------------------------');

    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        console.log(`Created backup directory: ${BACKUP_DIR}`);
    }

    try {
        console.log('Running pg_dump...');
        
        // Command components
        // --clean: Drop database objects before creating them
        // --if-exists: Use IF EXISTS when dropping objects
        // --no-owner: Skip commands to set ownership of objects
        // --no-privileges: Skip commands to set access privileges
        const command = `${PG_DUMP_PATH} --dbname="${DB_URL}" --file="${OUTPUT_FILE}" --clean --if-exists --no-owner --no-privileges`;

        execSync(command, { stdio: 'inherit' });

        const stats = fs.statSync(OUTPUT_FILE);
        console.log('\n✅ Backup completed successfully!');
        console.log(`📊 File size: ${(stats.size / 1024).toFixed(2)} KB`);
    } catch (error: any) {
        console.error('\n❌ Backup failed!');
        console.error(error.message);
        
        console.log('\nTip: Ensure pg_dump.exe is installed and the path in this script is correct.');
        console.log('Common path: C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe');
    }
}

backup();
