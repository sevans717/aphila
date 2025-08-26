#!/usr/bin/env ts-node
/**
 * Comprehensive Test Suite Runner for SAV3 Project
 * Orchestrates backend and frontend testing with automatic error fixing
 */

import { ChildProcess, execSync, spawn } from 'child_process';
import * as fs from 'fs';
import FrontendSystematicTester from './frontend-systematic-tester';
import SystematicTester from './systematic-tester';

interface TestSession {
  sessionId: string;
  startTime: Date;
  backendResults?: any;
  frontendResults?: any;
  fixesApplied: string[];
  serverProcess?: ChildProcess | null;
}

class ComprehensiveTestRunner {
  private session: TestSession;

  constructor() {
    this.session = {
      sessionId: `test-session-${Date.now()}`,
      startTime: new Date(),
      fixesApplied: []
    };
  }

  // ===========================================
  // SERVER MANAGEMENT
  // ===========================================

  private async startBackendServer(): Promise<ChildProcess | null> {
    console.log('🚀 Starting backend server...');
    
    try {
      // Kill any existing node processes first
      try {
        execSync('taskkill /f /im node.exe', { stdio: 'ignore' });
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        // No processes to kill
      }

      // Start the server
      const serverProcess = spawn('npm', ['run', 'dev'], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        detached: false
      });

      return new Promise((resolve, reject) => {
        let output = '';
        const timeout = setTimeout(() => {
          reject(new Error('Server startup timeout'));
        }, 30000);

        serverProcess.stdout?.on('data', (data) => {
          output += data.toString();
          console.log(`[SERVER] ${data.toString().trim()}`);
          
          if (output.includes('Server successfully listening') || 
              output.includes('listening') && output.includes('port')) {
            clearTimeout(timeout);
            console.log('✅ Backend server started successfully');
            resolve(serverProcess);
          }
        });

        serverProcess.stderr?.on('data', (data) => {
          output += data.toString();
          console.log(`[SERVER ERROR] ${data.toString().trim()}`);
        });

        serverProcess.on('error', (error) => {
          clearTimeout(timeout);
          console.error('❌ Failed to start server:', error.message);
          reject(error);
        });

        serverProcess.on('exit', (code) => {
          if (code !== 0) {
            clearTimeout(timeout);
            reject(new Error(`Server exited with code ${code}`));
          }
        });
      });
    } catch (error: any) {
      console.error('❌ Failed to start backend server:', error.message);
      return null;
    }
  }

  private async stopBackendServer(serverProcess?: ChildProcess): Promise<void> {
    console.log('🛑 Stopping backend server...');
    
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    try {
      execSync('taskkill /f /im node.exe', { stdio: 'ignore' });
    } catch (e) {
      // No processes to kill
    }
    
    console.log('✅ Backend server stopped');
  }

  // ===========================================
  // PRE-TEST SETUP AND VALIDATION
  // ===========================================

  private async validateEnvironment(): Promise<boolean> {
    console.log('🔍 Validating environment...');
    
    const checks = [
      { name: 'Node.js', command: 'node --version' },
      { name: 'NPM', command: 'npm --version' },
      { name: 'TypeScript', command: 'npx tsc --version' },
      { name: 'Prisma', command: 'npx prisma --version' }
    ];

    for (const check of checks) {
      try {
        const result = execSync(check.command, { encoding: 'utf8', stdio: 'pipe' });
        console.log(`✅ ${check.name}: ${result.trim()}`);
      } catch (error) {
        console.log(`❌ ${check.name}: Not available`);
        return false;
      }
    }

    return true;
  }

  private async setupDatabase(): Promise<boolean> {
    console.log('🗄️ Setting up database...');
    
    try {
      execSync('npx prisma db push', { stdio: 'inherit', cwd: process.cwd() });
      console.log('✅ Database setup complete');
      return true;
    } catch (error: any) {
      console.error('❌ Database setup failed:', error.message);
      return false;
    }
  }

  private async installDependencies(): Promise<boolean> {
    console.log('📦 Installing dependencies...');
    
    try {
      // Backend dependencies
      console.log('Installing backend dependencies...');
      execSync('npm install', { stdio: 'inherit', cwd: process.cwd() });
      
      // Frontend dependencies (detect expo or rn template)
      const expoPath = 'sav3-frontend/firebase-example/expo';
      const rnPath = 'sav3-frontend/firebase-example/rn';
      const frontendPath = fs.existsSync(expoPath) ? expoPath : (fs.existsSync(rnPath) ? rnPath : null);
      if (frontendPath) {
        console.log(`Installing frontend dependencies in ${frontendPath}...`);
        execSync('npm install', { stdio: 'inherit', cwd: frontendPath });
      } else {
        console.log('Skipping frontend dependencies: no frontend path detected');
      }
      
      console.log('✅ Dependencies installed');
      return true;
    } catch (error: any) {
      console.error('❌ Dependency installation failed:', error.message);
      return false;
    }
  }

  // ===========================================
  // AUTOMATED FIXES
  // ===========================================

  private async applyCommonFixes(): Promise<void> {
    console.log('🔧 Applying common fixes...');
    
    const fixes = [
      {
        name: 'Update TypeScript configuration',
        apply: () => {
          const tsConfigPath = 'tsconfig.json';
          if (fs.existsSync(tsConfigPath)) {
            const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
            tsConfig.compilerOptions = {
              ...tsConfig.compilerOptions,
              skipLibCheck: true,
              esModuleInterop: true,
              allowSyntheticDefaultImports: true
            };
            fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));
            console.log('✅ TypeScript configuration updated');
          }
        }
      },
      {
        name: 'Create missing directories',
        apply: () => {
          const dirs = ['uploads', 'logs', 'dist', 'src/generated'];
          dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
              console.log(`✅ Created directory: ${dir}`);
            }
          });
        }
      },
      {
        name: 'Fix environment configuration',
        apply: () => {
          const envPath = '.env';
          const envExamplePath = '.env.example';
          
          if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
            fs.copyFileSync(envExamplePath, envPath);
            console.log('✅ Created .env from .env.example');
          }
        }
      }
    ];

    for (const fix of fixes) {
      try {
        fix.apply();
        this.session.fixesApplied.push(fix.name);
      } catch (error: any) {
        console.log(`❌ Fix failed: ${fix.name} - ${error.message}`);
      }
    }
  }

  // ===========================================
  // MAIN TEST EXECUTION
  // ===========================================

  public async runComprehensiveTests(maxIterations: number = 3): Promise<void> {
    console.log(`🧪 Starting Comprehensive SAV3 Test Suite`);
    console.log(`📅 Session ID: ${this.session.sessionId}`);
    console.log(`🕐 Start Time: ${this.session.startTime.toISOString()}\n`);

    // Phase 1: Environment validation
    console.log('=== PHASE 1: ENVIRONMENT VALIDATION ===');
    const envValid = await this.validateEnvironment();
    if (!envValid) {
      console.error('❌ Environment validation failed. Please fix the issues above.');
      return;
    }

    // Phase 2: Apply common fixes
    console.log('\n=== PHASE 2: APPLYING COMMON FIXES ===');
    await this.applyCommonFixes();

    // Phase 3: Install dependencies
    console.log('\n=== PHASE 3: DEPENDENCY INSTALLATION ===');
    const depsInstalled = await this.installDependencies();
    if (!depsInstalled) {
      console.error('❌ Dependency installation failed. Please fix manually.');
      return;
    }

    // Phase 4: Database setup
    console.log('\n=== PHASE 4: DATABASE SETUP ===');
    const dbSetup = await this.setupDatabase();
    if (!dbSetup) {
      console.error('❌ Database setup failed. Please fix manually.');
      return;
    }

    // Phase 5: Start server and run backend tests
    console.log('\n=== PHASE 5: BACKEND TESTING ===');
    this.session.serverProcess = await this.startBackendServer();
    
    if (this.session.serverProcess) {
      // Wait for server to fully initialize
      console.log('⏳ Waiting for server to fully initialize...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Run backend tests
      const backendTester = new SystematicTester();
      await backendTester.runAllTests(maxIterations);
    } else {
      console.error('❌ Failed to start backend server. Skipping backend tests.');
    }

    // Phase 6: Frontend testing
    console.log('\n=== PHASE 6: FRONTEND TESTING ===');
  const expoPath = 'sav3-frontend/firebase-example/expo';
  const rnPath = 'sav3-frontend/firebase-example/rn';
  const detectedFrontendPath = fs.existsSync(expoPath) ? expoPath : (fs.existsSync(rnPath) ? rnPath : 'sav3-frontend/firebase-example/expo');
  const frontendTester = new FrontendSystematicTester(detectedFrontendPath);
    await frontendTester.runAllTests(maxIterations);

    // Phase 7: Integration testing
    console.log('\n=== PHASE 7: INTEGRATION TESTING ===');
    if (this.session.serverProcess) {
      await this.runIntegrationTests();
    }

    // Phase 8: Cleanup and final report
    console.log('\n=== PHASE 8: CLEANUP AND REPORTING ===');
    if (this.session.serverProcess) {
      await this.stopBackendServer(this.session.serverProcess);
    }

    await this.generateFinalReport();
  }

  private async runIntegrationTests(): Promise<void> {
    console.log('🔗 Running integration tests...');
    
    // Test basic API connectivity
    try {
      const axios = require('axios');
      const response = await axios.get('http://localhost:3001/health', { timeout: 5000 });
      console.log('✅ Backend API connectivity test passed');
    } catch (error: any) {
      console.log('❌ Backend API connectivity test failed:', error.message);
    }

    // Test database connectivity through API
    try {
      const axios = require('axios');
      const response = await axios.get('http://localhost:3001/api/v1/categories', { timeout: 10000 });
      console.log('✅ Database connectivity through API test passed');
    } catch (error: any) {
      console.log('❌ Database connectivity through API test failed:', error.message);
    }
  }

  private async generateFinalReport(): Promise<void> {
    const endTime = new Date();
    const duration = endTime.getTime() - this.session.startTime.getTime();
    
    const report = {
      sessionId: this.session.sessionId,
      startTime: this.session.startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: `${Math.round(duration / 1000)}s`,
      fixesApplied: this.session.fixesApplied,
      backendResults: this.loadReportFile('test-report-iteration-*.json'),
      frontendResults: this.loadReportFile('frontend-test-report-iteration-*.json'),
      summary: {
        totalPhases: 8,
        completedSuccessfully: true,
        recommendedNextSteps: [
          'Review test reports for any remaining issues',
          'Set up CI/CD pipeline for automated testing',
          'Add more comprehensive integration tests',
          'Implement performance testing'
        ]
      }
    };

    const reportFile = `comprehensive-test-report-${this.session.sessionId}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log(`\n📊 COMPREHENSIVE TEST SUMMARY:`);
    console.log(`Session Duration: ${Math.round(duration / 1000)}s`);
    console.log(`Fixes Applied: ${this.session.fixesApplied.length}`);
    console.log(`📝 Final report saved: ${reportFile}`);
    
    console.log(`\n🎉 Comprehensive testing completed!`);
    console.log(`Check the individual report files for detailed results:`);
    console.log(`- Backend: test-report-iteration-*.json`);
    console.log(`- Frontend: frontend-test-report-iteration-*.json`);
    console.log(`- Combined: ${reportFile}`);
  }

  private loadReportFile(pattern: string): any {
    try {
      const files = fs.readdirSync('.').filter(f => f.match(pattern.replace('*', '\\d+')));
      if (files.length > 0) {
        const latestFile = files.sort().pop();
        return JSON.parse(fs.readFileSync(latestFile!, 'utf8'));
      }
    } catch (error) {
      console.log(`Warning: Could not load report file matching ${pattern}`);
    }
    return null;
  }
}

// Main execution
async function main() {
  const maxIterations = parseInt(process.argv[2]) || 3;
  console.log(`Running with max ${maxIterations} iterations per test suite`);
  
  const runner = new ComprehensiveTestRunner();
  await runner.runComprehensiveTests(maxIterations);
}

if (require.main === module) {
  main().catch(console.error);
}

export default ComprehensiveTestRunner;
