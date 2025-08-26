#!/usr/bin/env ts-node
/**
 * Systematic Test Runner for SAV3 Backend
 * Tests every function systematically, logs errors, and provides auto-fix suggestions
 */

import axios from 'axios';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  category: string;
  testName: string;
  status: 'PASS' | 'FAIL' | 'SKIP' | 'ERROR';
  error?: string;
  duration: number;
  stack?: string;
  suggestions?: string[];
}

interface TestSuite {
  name: string;
  tests: Array<() => Promise<TestResult>>;
}

class SystematicTester {
  private results: TestResult[] = [];
  private baseUrl = 'http://localhost:3001';
  private apiUrl = `${this.baseUrl}/api/v1`;
  private testData = {
    user: {
      email: 'test@example.com',
      password: 'testpass123',
      displayName: 'Test User'
    },
    token: '',
    userId: ''
  };

  constructor() {
    console.log('🧪 Initializing Systematic Tester for SAV3 Backend');
  }

  private async runTest(testFn: () => Promise<TestResult>): Promise<TestResult> {
    const startTime = Date.now();
    try {
      const result = await testFn();
      result.duration = Date.now() - startTime;
      this.results.push(result);
      this.logResult(result);
      return result;
    } catch (error: any) {
      const failedResult: TestResult = {
        category: 'UNKNOWN',
        testName: 'UNKNOWN',
        status: 'ERROR',
        error: error.message,
        stack: error.stack,
        duration: Date.now() - startTime,
        suggestions: this.generateSuggestions(error.message)
      };
      this.results.push(failedResult);
      this.logResult(failedResult);
      return failedResult;
    }
  }

  private logResult(result: TestResult): void {
    const emoji = {
      'PASS': '✅',
      'FAIL': '❌',
      'SKIP': '⏭️',
      'ERROR': '💥'
    }[result.status];
    
    console.log(`${emoji} [${result.category}] ${result.testName} (${result.duration}ms)`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.suggestions && result.suggestions.length > 0) {
      console.log(`   Suggestions:`);
      result.suggestions.forEach(s => console.log(`   - ${s}`));
    }
  }

  private generateSuggestions(error: string): string[] {
    const suggestions: string[] = [];
    
    if (error.includes('ECONNREFUSED')) {
      suggestions.push('Server is not running. Start with: npm run dev');
      suggestions.push('Check if the port is correct in configuration');
      suggestions.push('Verify firewall settings allow localhost connections');
    }
    
    if (error.includes('Cannot find module')) {
      suggestions.push('Run: npm install to install missing dependencies');
      suggestions.push('Check if the import path is correct');
    }
    
    if (error.includes('timeout')) {
      suggestions.push('Increase timeout values in configuration');
      suggestions.push('Check server response time and optimize queries');
    }
    
    if (error.includes('401') || error.includes('Unauthorized')) {
      suggestions.push('Check authentication token validity');
      suggestions.push('Verify JWT secret configuration');
    }
    
    if (error.includes('database') || error.includes('prisma')) {
      suggestions.push('Run: npx prisma db push');
      suggestions.push('Check DATABASE_URL configuration');
      suggestions.push('Verify PostgreSQL server is running');
    }

    if (error.includes('Type') || error.includes('undefined')) {
      suggestions.push('Check TypeScript compilation: npx tsc --noEmit');
      suggestions.push('Verify type definitions are correct');
    }

    if (error.toLowerCase().includes('socket') || error.toLowerCase().includes('websocket')) {
      suggestions.push('Install socket.io client: npm install socket.io-client');
    }

    return suggestions;
  }

  // ===========================================
  // INFRASTRUCTURE TESTS
  // ===========================================

  private async testServerHealth(): Promise<TestResult> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
      return {
        category: 'Infrastructure',
        testName: 'Server Health Check',
        status: response.status === 200 ? 'PASS' : 'FAIL',
        error: response.status !== 200 ? `Expected 200, got ${response.status}` : undefined,
        duration: 0
      };
    } catch (error: any) {
      return {
        category: 'Infrastructure',
        testName: 'Server Health Check',
        status: 'FAIL',
        error: error.message,
        duration: 0,
        suggestions: this.generateSuggestions(error.message)
      };
    }
  }

  private async testDatabaseConnection(): Promise<TestResult> {
    try {
      // Test database via Prisma
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.$connect();
      await prisma.$disconnect();
      
      return {
        category: 'Infrastructure',
        testName: 'Database Connection',
        status: 'PASS',
        duration: 0
      };
    } catch (error: any) {
      return {
        category: 'Infrastructure',
        testName: 'Database Connection',
        status: 'FAIL',
        error: error.message,
        duration: 0,
        suggestions: this.generateSuggestions(error.message)
      };
    }
  }

  private async testTypeScriptCompilation(): Promise<TestResult> {
    try {
      execSync('npx tsc --noEmit', { cwd: process.cwd(), stdio: 'pipe' });
      return {
        category: 'Infrastructure',
        testName: 'TypeScript Compilation',
        status: 'PASS',
        duration: 0
      };
    } catch (error: any) {
      return {
        category: 'Infrastructure',
        testName: 'TypeScript Compilation',
        status: 'FAIL',
        error: error.message,
        duration: 0,
        suggestions: ['Fix TypeScript compilation errors', 'Check type definitions']
      };
    }
  }

  // ===========================================
  // AUTHENTICATION TESTS
  // ===========================================

  private async testUserRegistration(): Promise<TestResult> {
    try {
      const response = await axios.post(`${this.apiUrl}/auth/register`, this.testData.user, { timeout: 10000 });
      const data: any = (response as any).data;
      if (data?.token && data?.user) {
        this.testData.token = data.token;
        this.testData.userId = data.user.id;
        
        return {
          category: 'Authentication',
          testName: 'User Registration',
          status: 'PASS',
          duration: 0
        };
      } else {
        return {
          category: 'Authentication',
          testName: 'User Registration',
          status: 'FAIL',
          error: 'Registration did not return token or user',
          duration: 0
        };
      }
    } catch (error: any) {
      // If user already exists, try login instead
      if (error.response?.status === 400 || error.message.includes('already exists')) {
        return await this.testUserLogin();
      }
      
      return {
        category: 'Authentication',
        testName: 'User Registration',
        status: 'FAIL',
        error: error.message,
        duration: 0,
        suggestions: this.generateSuggestions(error.message)
      };
    }
  }

  private async testUserLogin(): Promise<TestResult> {
    try {
      const response = await axios.post(`${this.apiUrl}/auth/login`, {
        email: this.testData.user.email,
        password: this.testData.user.password
      }, { timeout: 10000 });
      const data: any = (response as any).data;
      if (data?.token) {
        this.testData.token = data.token;
        this.testData.userId = data?.user?.id || this.testData.userId;
        
        return {
          category: 'Authentication',
          testName: 'User Login',
          status: 'PASS',
          duration: 0
        };
      } else {
        return {
          category: 'Authentication',
          testName: 'User Login',
          status: 'FAIL',
          error: 'Login did not return token',
          duration: 0
        };
      }
    } catch (error: any) {
      return {
        category: 'Authentication',
        testName: 'User Login',
        status: 'FAIL',
        error: error.message,
        duration: 0,
        suggestions: this.generateSuggestions(error.message)
      };
    }
  }

  private async testGetCurrentUser(): Promise<TestResult> {
    try {
      if (!this.testData.token) {
        return {
          category: 'Authentication',
          testName: 'Get Current User',
          status: 'SKIP',
          error: 'No auth token available',
          duration: 0
        };
      }

      const response = await axios.get(`${this.apiUrl}/me`, {
        headers: { Authorization: `Bearer ${this.testData.token}` },
        timeout: 10000
      });
      
      return {
        category: 'Authentication',
        testName: 'Get Current User',
        status: response.data ? 'PASS' : 'FAIL',
        error: !response.data ? 'No user data returned' : undefined,
        duration: 0
      };
    } catch (error: any) {
      return {
        category: 'Authentication',
        testName: 'Get Current User',
        status: 'FAIL',
        error: error.message,
        duration: 0,
        suggestions: this.generateSuggestions(error.message)
      };
    }
  }

  // ===========================================
  // MESSAGING TESTS
  // ===========================================

  private async testSendMessage(): Promise<TestResult> {
    try {
      if (!this.testData.token) {
        return {
          category: 'Messaging',
          testName: 'Send Message',
          status: 'SKIP',
          error: 'No auth token available',
          duration: 0
        };
      }

      // Create a test message
      const response = await axios.post(`${this.apiUrl}/messaging/send`, {
        receiverId: this.testData.userId, // Self message for testing
        content: 'Test message from systematic tester',
        messageType: 'text'
      }, {
        headers: { Authorization: `Bearer ${this.testData.token}` },
        timeout: 10000
      });
      
      return {
        category: 'Messaging',
        testName: 'Send Message',
        status: response.data ? 'PASS' : 'FAIL',
        error: !response.data ? 'No response data' : undefined,
        duration: 0
      };
    } catch (error: any) {
      return {
        category: 'Messaging',
        testName: 'Send Message',
        status: 'FAIL',
        error: error.message,
        duration: 0,
        suggestions: this.generateSuggestions(error.message)
      };
    }
  }

  private async testGetUnreadCount(): Promise<TestResult> {
    try {
      if (!this.testData.token) {
        return {
          category: 'Messaging',
          testName: 'Get Unread Count',
          status: 'SKIP',
          error: 'No auth token available',
          duration: 0
        };
      }

      const response = await axios.get(`${this.apiUrl}/messaging/unread-count`, {
        headers: { Authorization: `Bearer ${this.testData.token}` },
        timeout: 10000
      });
      const data: any = (response as any).data;
      const count = data?.count ?? data?.data?.unreadCount;
      return {
        category: 'Messaging',
        testName: 'Get Unread Count',
        status: typeof count === 'number' ? 'PASS' : 'FAIL',
        error: typeof count !== 'number' ? 'Invalid count format' : undefined,
        duration: 0
      };
    } catch (error: any) {
      return {
        category: 'Messaging',
        testName: 'Get Unread Count',
        status: 'FAIL',
        error: error.message,
        duration: 0,
        suggestions: this.generateSuggestions(error.message)
      };
    }
  }

  // ===========================================
  // SUBSCRIPTION TESTS  
  // ===========================================

  private async testGetPlans(): Promise<TestResult> {
    try {
      const response = await axios.get(`${this.apiUrl}/subscription/plans`, { timeout: 10000 });
  const payload: any = (response as any).data;
  const plansArray = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : null;
      return {
        category: 'Subscription',
        testName: 'Get Plans',
        status: Array.isArray(plansArray) ? 'PASS' : 'FAIL',
        error: !Array.isArray(plansArray) ? 'Plans should be an array (either response body or data.data)' : undefined,
        duration: 0
      };
    } catch (error: any) {
      return {
        category: 'Subscription',
        testName: 'Get Plans',
        status: 'FAIL',
        error: error.message,
        duration: 0,
        suggestions: this.generateSuggestions(error.message)
      };
    }
  }

  private async testGetCurrentSubscription(): Promise<TestResult> {
    try {
      if (!this.testData.token) {
        return {
          category: 'Subscription',
          testName: 'Get Current Subscription',
          status: 'SKIP',
          error: 'No auth token available',
          duration: 0
        };
      }

      const response = await axios.get(`${this.apiUrl}/subscription/current`, {
        headers: { Authorization: `Bearer ${this.testData.token}` },
        timeout: 10000
      });
      
      return {
        category: 'Subscription',
        testName: 'Get Current Subscription',
        status: 'PASS', // Any response is valid (null for no subscription, object for subscription)
        duration: 0
      };
    } catch (error: any) {
      return {
        category: 'Subscription',
        testName: 'Get Current Subscription',
        status: 'FAIL',
        error: error.message,
        duration: 0,
        suggestions: this.generateSuggestions(error.message)
      };
    }
  }

  // ===========================================
  // DISCOVERY TESTS
  // ===========================================

  private async testGetCommunities(): Promise<TestResult> {
    try {
      // Prefer the communities route; fall back if needed
  let response: any;
      try {
        response = await axios.get(`${this.apiUrl}/communities`, { timeout: 10000 });
      } catch (e) {
        response = await axios.get(`${this.apiUrl}/discovery/communities`, { timeout: 10000 });
      }
  const data: any = (response as any).data;
      return {
        category: 'Discovery',
        testName: 'Get Communities',
        status: Array.isArray(data) || Array.isArray(data?.data) ? 'PASS' : 'FAIL',
        error: !(Array.isArray(data) || Array.isArray(data?.data)) ? 'Communities should be an array' : undefined,
        duration: 0
      };
    } catch (error: any) {
      return {
        category: 'Discovery',
        testName: 'Get Communities',
        status: 'FAIL',
        error: error.message,
        duration: 0,
        suggestions: this.generateSuggestions(error.message)
      };
    }
  }

  private async testGetCategories(): Promise<TestResult> {
    try {
      const response = await axios.get(`${this.apiUrl}/categories`, { timeout: 10000 });
      
      return {
        category: 'Discovery',
        testName: 'Get Categories',
        status: Array.isArray(response.data) ? 'PASS' : 'FAIL',
        error: !Array.isArray(response.data) ? 'Categories should be an array' : undefined,
        duration: 0
      };
    } catch (error: any) {
      return {
        category: 'Discovery',
        testName: 'Get Categories',
        status: 'FAIL',
        error: error.message,
        duration: 0,
        suggestions: this.generateSuggestions(error.message)
      };
    }
  }

  // ===========================================
  // SERVICE LAYER TESTS
  // ===========================================

  private async testServiceFunctions(): Promise<TestResult[]> {
    const serviceTests: TestResult[] = [];
    const servicesDir = path.join(process.cwd(), 'src', 'services');
    
    if (!fs.existsSync(servicesDir)) {
      return [{
        category: 'Services',
        testName: 'Service Directory Check',
        status: 'FAIL',
        error: 'Services directory not found',
        duration: 0,
        suggestions: ['Create src/services directory', 'Check project structure']
      }];
    }

    const serviceFiles = fs.readdirSync(servicesDir).filter(file => file.endsWith('.ts'));
    
    for (const serviceFile of serviceFiles) {
      try {
        const serviceName = serviceFile.replace('.service.ts', '');
        const servicePath = path.join(servicesDir, serviceFile);
        const serviceContent = fs.readFileSync(servicePath, 'utf8');
        
        // Extract function names from the service file
        const functionMatches = serviceContent.match(/export\s+(async\s+)?function\s+(\w+)|(\w+)\s*:\s*(async\s+)?function|class\s+\w+\s*{[^}]*(\w+)\s*\(/g);
        
        if (functionMatches) {
          serviceTests.push({
            category: 'Services',
            testName: `${serviceName} Service Structure`,
            status: 'PASS',
            duration: 0
          });
        } else {
          serviceTests.push({
            category: 'Services',
            testName: `${serviceName} Service Structure`,
            status: 'FAIL',
            error: 'No exportable functions found',
            duration: 0,
            suggestions: ['Add exportable functions to service', 'Check service structure']
          });
        }
      } catch (error: any) {
        serviceTests.push({
          category: 'Services',
          testName: `Service ${serviceFile}`,
          status: 'ERROR',
          error: error.message,
          duration: 0,
          suggestions: this.generateSuggestions(error.message)
        });
      }
    }

    return serviceTests;
  }

  // ===========================================
  // WEBSOCKET TESTS
  // ===========================================

  private async testWebSocketConnection(): Promise<TestResult> {
    try {
      if (!this.testData.token) {
        return {
          category: 'WebSocket',
          testName: 'WebSocket Connection',
          status: 'SKIP',
          error: 'No auth token available for authenticated WebSocket',
          duration: 0,
          suggestions: ['Ensure login succeeds before WebSocket test']
        };
      }

      // Prefer Socket.IO client (server expects it and requires auth)
      let ioClient: any;
      try {
        ioClient = require('socket.io-client');
      } catch (e) {
        return {
          category: 'WebSocket',
          testName: 'WebSocket Connection',
          status: 'FAIL',
          error: 'socket.io-client not installed',
          duration: 0,
          suggestions: ['Install socket.io client: npm install socket.io-client']
        };
      }

      return new Promise((resolve) => {
        const socket = ioClient('http://localhost:3001', {
          transports: ['websocket'],
          timeout: 5000,
          auth: { token: this.testData.token },
        });

        const timeout = setTimeout(() => {
          socket.disconnect();
          resolve({
            category: 'WebSocket',
            testName: 'WebSocket Connection',
            status: 'FAIL',
            error: 'Connection timeout',
            duration: 0,
            suggestions: ['Verify WebSocket server is running', 'Check JWT auth for Socket.IO']
          });
        }, 8000);

        socket.on('connect', () => {
          clearTimeout(timeout);
          socket.disconnect();
          resolve({
            category: 'WebSocket',
            testName: 'WebSocket Connection',
            status: 'PASS',
            duration: 0
          });
        });

        socket.on('connect_error', (err: any) => {
          clearTimeout(timeout);
          resolve({
            category: 'WebSocket',
            testName: 'WebSocket Connection',
            status: 'FAIL',
            error: err?.message || 'connect_error',
            duration: 0,
            suggestions: this.generateSuggestions(err?.message || 'socket connection error')
          });
        });
      });
    } catch (error: any) {
      return {
        category: 'WebSocket',
        testName: 'WebSocket Connection',
        status: 'ERROR',
        error: error.message,
        duration: 0,
        suggestions: ['Install socket.io client: npm install socket.io-client', 'Check WebSocket dependencies']
      };
    }
  }

  // ===========================================
  // MAIN TEST EXECUTION
  // ===========================================

  private getTestSuites(): TestSuite[] {
    return [
      {
        name: 'Infrastructure',
        tests: [
          () => this.testServerHealth(),
          () => this.testDatabaseConnection(),
          () => this.testTypeScriptCompilation()
        ]
      },
      {
        name: 'Authentication',
        tests: [
          () => this.testUserRegistration(),
          () => this.testGetCurrentUser()
        ]
      },
      {
        name: 'Messaging',
        tests: [
          () => this.testSendMessage(),
          () => this.testGetUnreadCount()
        ]
      },
      {
        name: 'Subscription',
        tests: [
          () => this.testGetPlans(),
          () => this.testGetCurrentSubscription()
        ]
      },
      {
        name: 'Discovery',
        tests: [
          () => this.testGetCommunities(),
          () => this.testGetCategories()
        ]
      },
      {
        name: 'WebSocket',
        tests: [
          () => this.testWebSocketConnection()
        ]
      }
    ];
  }

  public async runAllTests(maxIterations: number = 3): Promise<void> {
    let iteration = 1;
    let allTestsPassed = false;

    console.log(`🎯 Starting Systematic Test Suite (max ${maxIterations} iterations)\n`);

    while (iteration <= maxIterations && !allTestsPassed) {
      console.log(`\n🔄 === ITERATION ${iteration}/${maxIterations} ===\n`);
      
      this.results = []; // Reset results for this iteration
      const testSuites = this.getTestSuites();

      // Run all test suites
      for (const suite of testSuites) {
        console.log(`\n📦 Running ${suite.name} Tests:`);
        
        for (const test of suite.tests) {
          await this.runTest(test);
        }
      }

      // Run service tests
      console.log(`\n📦 Running Service Tests:`);
      const serviceResults = await this.testServiceFunctions();
      this.results.push(...serviceResults);
      serviceResults.forEach(result => this.logResult(result));

      // Check if all tests passed
      const failedTests = this.results.filter(r => r.status === 'FAIL' || r.status === 'ERROR');
      allTestsPassed = failedTests.length === 0;

      // Generate report
      this.generateReport(iteration);

      if (!allTestsPassed && iteration < maxIterations) {
        console.log(`\n🔧 Attempting auto-fixes for next iteration...\n`);
        await this.attemptAutoFixes();
        console.log(`⏳ Waiting 5 seconds before next iteration...\n`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      iteration++;
    }

    if (allTestsPassed) {
      console.log(`\n🎉 All tests passed after ${iteration - 1} iteration(s)!\n`);
    } else {
      console.log(`\n⚠️ Some tests still failing after ${maxIterations} iterations. Check the final report.\n`);
    }
  }

  private generateReport(iteration: number): void {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const errors = this.results.filter(r => r.status === 'ERROR').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    const total = this.results.length;

    console.log(`\n📊 ITERATION ${iteration} SUMMARY:`);
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`💥 Errors: ${errors}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    console.log(`Success Rate: ${((passed / (total - skipped)) * 100).toFixed(1)}%`);

    // Save detailed report to file
    const reportData = {
      iteration,
      timestamp: new Date().toISOString(),
      summary: { total, passed, failed, errors, skipped },
      results: this.results
    };

    fs.writeFileSync(
      `test-report-iteration-${iteration}.json`,
      JSON.stringify(reportData, null, 2)
    );

    console.log(`📝 Detailed report saved: test-report-iteration-${iteration}.json`);
  }

  private async attemptAutoFixes(): Promise<void> {
    const failedResults = this.results.filter(r => r.status === 'FAIL' || r.status === 'ERROR');
    const uniqueSuggestions = [...new Set(failedResults.flatMap(r => r.suggestions || []))];

    for (const suggestion of uniqueSuggestions) {
      if (suggestion.includes('npm install')) {
        console.log(`🔧 Executing: ${suggestion}`);
        try {
          execSync(suggestion, { stdio: 'inherit', cwd: process.cwd() });
        } catch (error) {
          console.log(`❌ Auto-fix failed: ${suggestion}`);
        }
      } else if (suggestion.includes('npx prisma db push')) {
        console.log(`🔧 Executing: ${suggestion}`);
        try {
          execSync('npx prisma db push', { stdio: 'inherit', cwd: process.cwd() });
        } catch (error) {
          console.log(`❌ Auto-fix failed: ${suggestion}`);
        }
      }
      // Add more auto-fix patterns as needed
    }
  }
}

// Main execution
async function main() {
  const tester = new SystematicTester();
  await tester.runAllTests(3);
}

if (require.main === module) {
  main().catch(console.error);
}

export default SystematicTester;
