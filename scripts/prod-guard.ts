/**
 * Production Safety Gate
 * Prevents accidental production operations.
 * Must type "CONFIRM" to proceed.
 */
import * as readline from 'readline';

const action = process.argv[2] || 'run';

const WARNING = `
╔══════════════════════════════════════════════════════════╗
║  ⚠️  WARNING: PRODUCTION ENVIRONMENT                    ║
║                                                          ║
║  You are about to ${action.padEnd(40)}     ║
║  This connects to the LIVE Neon database.                ║
║  DO NOT run tests or seed data here.                     ║
║                                                          ║
║  Type "CONFIRM" to proceed, or press Enter to cancel.    ║
╚══════════════════════════════════════════════════════════╝
`;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log(WARNING);

rl.question('> ', (answer) => {
  rl.close();
  if (answer.trim() === 'CONFIRM') {
    console.log('✅ Confirmed. Proceeding with production...\n');
    process.exit(0); // Exit 0 = allow next command to run
  } else {
    console.log('❌ Cancelled. No changes made.');
    process.exit(1); // Exit 1 = block next command
  }
});
