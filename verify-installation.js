#!/usr/bin/env node

/**
 * Swim Academy Pro - Installation Verification Script
 * 
 * This script verifies all deployment files are present and correct
 * Run: node verify-installation.js
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  const color = exists ? 'green' : 'red';
  log(`${status} ${description}`, color);
  return exists;
}

function checkFileContent(filePath, searchString) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes(searchString);
  } catch {
    return false;
  }
}

console.log('\n');
log('════════════════════════════════════════════════════', 'blue');
log('   Swim Academy Pro - Installation Verification', 'blue');
log('════════════════════════════════════════════════════\n', 'blue');

let allGood = true;

// Check Docker files
log('Docker & Deployment Files:', 'yellow');
const dockerFiles = [
  ['Dockerfile', 'Dockerfile - Production image'],
  ['docker-compose.yml', 'docker-compose.yml - Production stack'],
  ['docker-compose.dev.yml', 'docker-compose.dev.yml - Development stack'],
  ['.dockerignore', '.dockerignore - Build optimization'],
];

dockerFiles.forEach(([file, desc]) => {
  if (!checkFile(file, desc)) allGood = false;
});

// Check config files
log('\nConfiguration Files:', 'yellow');
const configFiles = [
  ['.env.example', '.env.example - Backend template'],
  ['web/.env.example', 'web/.env.example - Frontend template'],
];

configFiles.forEach(([file, desc]) => {
  if (!checkFile(file, desc)) allGood = false;
});

// Check deployment scripts
log('\nDeployment Scripts:', 'yellow');
const scriptFiles = [
  ['deploy.bat', 'deploy.bat - Windows deployment helper'],
  ['deploy.sh', 'deploy.sh - Mac/Linux deployment helper'],
];

scriptFiles.forEach(([file, desc]) => {
  if (!checkFile(file, desc)) allGood = false;
});

// Check documentation
log('\nDocumentation Files:', 'yellow');
const docFiles = [
  ['QUICK_START.md', 'QUICK_START.md - 2-minute guide'],
  ['DEPLOYMENT_GUIDE.md', 'DEPLOYMENT_GUIDE.md - Detailed guide'],
  ['DEPLOYMENT_COMPLETE.md', 'DEPLOYMENT_COMPLETE.md - Reference'],
  ['README_DEPLOYMENT.md', 'README_DEPLOYMENT.md - Main guide'],
];

docFiles.forEach(([file, desc]) => {
  if (!checkFile(file, desc)) allGood = false;
});

// Check backend files
log('\nBackend Files:', 'yellow');
if (!checkFile('server.js', 'server.js - Main backend file')) allGood = false;
if (!checkFile('package.json', 'package.json - Dependencies')) allGood = false;
if (!checkFile('config/', 'config/ - Configuration directory')) allGood = false;
if (!checkFile('routes/', 'routes/ - API routes directory')) allGood = false;

// Check frontend files
log('\nFrontend Files:', 'yellow');
if (!checkFile('web/', 'web/ - React frontend directory')) allGood = false;
if (!checkFile('web/package.json', 'web/package.json - Frontend dependencies')) allGood = false;
if (!checkFile('web/vite.config.js', 'web/vite.config.js - Vite config')) allGood = false;
if (!checkFile('web/src/', 'web/src/ - Source code')) allGood = false;

// Verify important content
log('\nContent Verification:', 'yellow');

if (checkFileContent('Dockerfile', 'FROM node:18-alpine')) {
  log('✅ Dockerfile contains Node.js 18 image', 'green');
} else {
  log('❌ Dockerfile structure may be incorrect', 'red');
  allGood = false;
}

if (checkFileContent('docker-compose.yml', 'mongodb:')) {
  log('✅ docker-compose.yml includes MongoDB', 'green');
} else {
  log('❌ docker-compose.yml may be missing MongoDB', 'red');
  allGood = false;
}

if (checkFileContent('docker-compose.yml', 'redis:')) {
  log('✅ docker-compose.yml includes Redis', 'green');
} else {
  log('❌ docker-compose.yml may be missing Redis', 'red');
  allGood = false;
}

if (checkFileContent('server.js', 'express.static(publicPath)')) {
  log('✅ server.js configured to serve frontend', 'green');
} else {
  log('⚠️  server.js may not be serving static files', 'yellow');
}

if (checkFileContent('.env.example', 'MONGODB_URI')) {
  log('✅ .env.example includes all configuration variables', 'green');
} else {
  log('❌ .env.example may be incomplete', 'red');
  allGood = false;
}

// Summary
console.log('\n');
log('════════════════════════════════════════════════════', 'blue');

if (allGood) {
  log('✅ ALL FILES VERIFIED - Ready to Deploy!', 'green');
  log('\nNext Steps:', 'blue');
  log('1. Read QUICK_START.md', 'reset');
  log('2. Copy .env.example to .env', 'reset');
  log('3. Run: docker-compose up -d', 'reset');
  log('4. Access: http://localhost:5000', 'reset');
} else {
  log('❌ SOME FILES MISSING - Please check errors above', 'red');
  log('\nPlease ensure all files are present in your project root.', 'reset');
}

log('════════════════════════════════════════════════════\n', 'blue');

process.exit(allGood ? 0 : 1);
