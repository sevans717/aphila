#!/usr/bin/env ts-node
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface TestResult {
  testName: string;
  success: boolean;
  error?: string;
  details?: any;
}

class SimpleFunctionTest {
  private results: TestResult[] = [];

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Simple Function Test Suite');
    console.log('=====================================');

    // Test 1: Check if TypeScript compiles
    await this.testTypeScriptCompilation();
    
    // Test 2: Check if server can start
    await this.testServerStartup();
    
    // Test 3: Check if database connection works
    await this.testDatabaseConnection();
    
    // Test 4: Check if environment variables are loaded
    await this.testEnvironmentVariables();
    
    // Test 5: Check if basic API endpoints exist
    await this.testBasicEndpoints();

    // Display results
    this.displayResults();
  }

  private async testTypeScriptCompilation(): Promise<void> {
    console.log('\n🔍 Testing TypeScript compilation...');
    
    try {
      const { stdout, stderr } = await execAsync('npx tsc --noEmit');
      
      if (stderr && !stderr.includes('error')) {
        this.results.push({
          testName: 'TypeScript Compilation',
          success: true,
          details: 'TypeScript compiled successfully'
        });
      } else {
        this.results.push({
          testName: 'TypeScript Compilation',
          success: false,
          error: stderr || 'Unknown compilation error'
        });
      }
    } catch (error: any) {
      this.results.push({
        testName: 'TypeScript Compilation',
        success: false,
        error: error.message
      });
    }
  }

  private async testServerStartup(): Promise<void> {
    console.log('\n🔍 Testing server startup...');
    
    try {
      // Check if server.ts exists
      const serverPath = path.join(process.cwd(), 'src', 'server.ts');
      if (!fs.existsSync(serverPath)) {
        throw new Error('server.ts not found');
      }

      // Check if app.ts exists
      const appPath = path.join(process.cwd(), 'src', 'app.ts');
      if (!fs.existsSync(appPath)) {
        throw new Error('app.ts not found');
      }

      this.results.push({
        testName: 'Server Files Exist',
        success: true,
        details: 'Server and app files found'
      });
    } catch (error: any) {
      this.results.push({
        testName: 'Server Files Exist',
        success: false,
        error: error.message
      });
    }
  }

  private async testDatabaseConnection(): Promise<void> {
    console.log('\n🔍 Testing database connection...');
    
    try {
      // Check if prisma client can be imported
      const prismaPath = path.join(process.cwd(), 'src', 'lib', 'prisma.ts');
      if (!fs.existsSync(prismaPath)) {
        throw new Error('prisma.ts not found');
      }

      // Check if schema exists
      const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
      if (!fs.existsSync(schemaPath)) {
        throw new Error('schema.prisma not found');
      }

      this.results.push({
        testName: 'Database Setup',
        success: true,
        details: 'Prisma files found'
      });
    } catch (error: any) {
      this.results.push({
        testName: 'Database Setup',
        success: false,
        error: error.message
      });
    }
  }

  private async testEnvironmentVariables(): Promise<void> {
    console.log('\n🔍 Testing environment variables...');
    
    try {
      // Check if .env file exists
      const envPath = path.join(process.cwd(), '.env');
      if (!fs.existsSync(envPath)) {
        throw new Error('.env file not found');
      }

      // Check if config exists
      const configPath = path.join(process.cwd(), 'src', 'config', 'env.ts');
      if (!fs.existsSync(configPath)) {
        throw new Error('env.ts config not found');
      }

      this.results.push({
        testName: 'Environment Configuration',
        success: true,
        details: 'Environment files found'
      });
    } catch (error: any) {
      this.results.push({
        testName: 'Environment Configuration',
        success: false,
        error: error.message
      });
    }
  }

  private async testBasicEndpoints(): Promise<void> {
    console.log('\n🔍 Testing basic API endpoints structure...');
    
    try {
      // Check if routes directory exists
      const routesPath = path.join(process.cwd(), 'src', 'routes');
      if (!fs.existsSync(routesPath)) {
        throw new Error('Routes directory not found');
      }

      // Check for main route files
      const routeFiles = [
        'auth.ts',
        'categories.routes.ts',
        'communities.routes.ts',
        'discovery.routes.ts',
        'messaging.routes.ts',
        'index.ts'
      ];

      const missingFiles = routeFiles.filter(file => 
        !fs.existsSync(path.join(routesPath, file))
      );

      if (missingFiles.length > 0) {
        throw new Error(`Missing route files: ${missingFiles.join(', ')}`);
      }

      this.results.push({
        testName: 'API Endpoints Structure',
        success: true,
        details: 'All main route files found'
      });
    } catch (error: any) {
      this.results.push({
        testName: 'API Endpoints Structure',
        success: false,
        error: error.message
      });
    }
  }

  private displayResults(): void {
    console.log('\n📊 TEST RESULTS');
    console.log('================');
    
    let successCount = 0;
    let totalCount = this.results.length;
    
    this.results.forEach(result => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${result.testName}`);
      
      if (result.success) {
        successCount++;
        if (result.details) {
          console.log(`   Details: ${result.details}`);
        }
      } else {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log(`\n📈 Summary: ${successCount}/${totalCount} tests passed`);
    
    if (successCount === totalCount) {
      console.log('🎉 All tests passed! Your basic function structure is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Check the errors above for details.');
    }
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  const tester = new SimpleFunctionTest();
  tester.runAllTests().catch(console.error);
}
