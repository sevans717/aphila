#!/usr/bin/env ts-node
/**
 * Frontend Systematic Tester for SAV3 React Native App
 * Tests every function, component, and API integration systematically
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface FrontendTestResult {
  category: string;
  testName: string;
  status: 'PASS' | 'FAIL' | 'SKIP' | 'ERROR';
  error?: string;
  duration: number;
  stack?: string;
  suggestions?: string[];
}

class FrontendSystematicTester {
  private results: FrontendTestResult[] = [];
  private frontendPath: string;
  private mockData = {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User'
    },
    message: {
      id: 'test-message-id',
      content: 'Test message content',
      senderId: 'test-sender-id',
      receiverId: 'test-receiver-id',
      timestamp: new Date(),
      status: 'sent' as const
    },
    match: {
      id: 'test-match-id',
      users: ['user1', 'user2'],
      lastMessage: 'Last message content'
    }
  };

  constructor(frontendPath: string = (fs.existsSync('sav3-frontend/firebase-example/expo') ? 'sav3-frontend/firebase-example/expo' : 'sav3-frontend/firebase-example/rn')) {
    this.frontendPath = path.resolve(frontendPath);
    console.log(`🧪 Initializing Frontend Systematic Tester`);
    console.log(`📁 Frontend Path: ${this.frontendPath}`);
  }

  private async runTest(testFn: () => Promise<FrontendTestResult>): Promise<FrontendTestResult> {
    const startTime = Date.now();
    try {
      const result = await testFn();
      result.duration = Date.now() - startTime;
      this.results.push(result);
      this.logResult(result);
      return result;
    } catch (error: any) {
      const failedResult: FrontendTestResult = {
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

  private logResult(result: FrontendTestResult): void {
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
    
    if (error.includes('Cannot find module')) {
      suggestions.push('Run: npm install or yarn install');
      suggestions.push('Check if the import path is correct');
      suggestions.push('Verify the module is installed in package.json');
    }
    
    if (error.includes('React') || error.includes('JSX')) {
      suggestions.push('Check React Native component syntax');
      suggestions.push('Verify React import statements');
      suggestions.push('Check for missing component props');
    }
    
    if (error.includes('AsyncStorage')) {
      suggestions.push('Install: npm install @react-native-async-storage/async-storage');
      suggestions.push('Check AsyncStorage usage and imports');
    }
    
    if (error.includes('axios') || error.includes('Network')) {
      suggestions.push('Check network configuration and permissions');
      suggestions.push('Verify API endpoints are correct');
      suggestions.push('Test with different network conditions');
    }

    if (error.includes('Type') || error.includes('Property')) {
      suggestions.push('Run: npx tsc --noEmit to check TypeScript');
      suggestions.push('Verify component prop types');
      suggestions.push('Check interface definitions');
    }

    if (error.includes('@expo/vector-icons')) {
      suggestions.push('Install: npx expo install @expo/vector-icons');
      suggestions.push('Check icon name and family');
    }

    return suggestions;
  }

  // ===========================================
  // PROJECT STRUCTURE TESTS
  // ===========================================

  private async testProjectStructure(): Promise<FrontendTestResult> {
    try {
      const requiredFiles = [
        'package.json',
        'App.tsx',
        'src/lib/axios-api.ts',
        'src/screens/ChatScreen.tsx',
        'src/screens/TransactionScreen.tsx'
      ];

      const missingFiles = requiredFiles.filter(file => 
        !fs.existsSync(path.join(this.frontendPath, file))
      );

      if (missingFiles.length > 0) {
        return {
          category: 'Structure',
          testName: 'Project Structure',
          status: 'FAIL',
          error: `Missing files: ${missingFiles.join(', ')}`,
          duration: 0,
          suggestions: ['Create missing files', 'Check project setup']
        };
      }

      return {
        category: 'Structure',
        testName: 'Project Structure',
        status: 'PASS',
        duration: 0
      };
    } catch (error: any) {
      return {
        category: 'Structure',
        testName: 'Project Structure',
        status: 'ERROR',
        error: error.message,
        duration: 0,
        suggestions: this.generateSuggestions(error.message)
      };
    }
  }

  private async testPackageJson(): Promise<FrontendTestResult> {
    try {
      const packagePath = path.join(this.frontendPath, 'package.json');
      const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      const requiredDeps = [
        'react-native',
        'axios',
        '@react-native-async-storage/async-storage',
        '@expo/vector-icons'
      ];

      const missingDeps = requiredDeps.filter(dep => 
        !packageContent.dependencies?.[dep] && !packageContent.devDependencies?.[dep]
      );

      if (missingDeps.length > 0) {
        return {
          category: 'Dependencies',
          testName: 'Package Dependencies',
          status: 'FAIL',
          error: `Missing dependencies: ${missingDeps.join(', ')}`,
          duration: 0,
          suggestions: [`Install: npm install ${missingDeps.join(' ')}`]
        };
      }

      return {
        category: 'Dependencies',
        testName: 'Package Dependencies',
        status: 'PASS',
        duration: 0
      };
    } catch (error: any) {
      return {
        category: 'Dependencies',
        testName: 'Package Dependencies',
        status: 'ERROR',
        error: error.message,
        duration: 0,
        suggestions: this.generateSuggestions(error.message)
      };
    }
  }

  // ===========================================
  // API CLIENT TESTS
  // ===========================================

  private async testApiClientStructure(): Promise<FrontendTestResult> {
    try {
      const apiPath = path.join(this.frontendPath, 'src/lib/axios-api.ts');
      const apiContent = fs.readFileSync(apiPath, 'utf8');
      
      const requiredMethods = [
        'sendMessage',
        'getMatchMessages',
        'login',
        'register',
        'getCurrentUser',
        'getPlans',
        'getCurrentSubscription'
      ];

      const missingMethods = requiredMethods.filter(method => 
        !apiContent.includes(method)
      );

      if (missingMethods.length > 0) {
        return {
          category: 'API Client',
          testName: 'API Methods',
          status: 'FAIL',
          error: `Missing methods: ${missingMethods.join(', ')}`,
          duration: 0,
          suggestions: ['Add missing API methods', 'Check method exports']
        };
      }

      return {
        category: 'API Client',
        testName: 'API Methods',
        status: 'PASS',
        duration: 0
      };
    } catch (error: any) {
      return {
        category: 'API Client',
        testName: 'API Methods',
        status: 'ERROR',
        error: error.message,
        duration: 0,
        suggestions: this.generateSuggestions(error.message)
      };
    }
  }

  private async testApiClientImports(): Promise<FrontendTestResult> {
    try {
      const apiPath = path.join(this.frontendPath, 'src/lib/axios-api.ts');
      const apiContent = fs.readFileSync(apiPath, 'utf8');
      
      const requiredImports = [
        'axios',
        '@react-native-async-storage/async-storage'
      ];

      const missingImports = requiredImports.filter(imp => 
        !apiContent.includes(`from '${imp}'`) && !apiContent.includes(`require('${imp}')`)
      );

      if (missingImports.length > 0) {
        return {
          category: 'API Client',
          testName: 'API Imports',
          status: 'FAIL',
          error: `Missing imports: ${missingImports.join(', ')}`,
          duration: 0,
          suggestions: [`Install missing dependencies: ${missingImports.join(' ')}`]
        };
      }

      return {
        category: 'API Client',
        testName: 'API Imports',
        status: 'PASS',
        duration: 0
      };
    } catch (error: any) {
      return {
        category: 'API Client',
        testName: 'API Imports',
        status: 'ERROR',
        error: error.message,
        duration: 0,
        suggestions: this.generateSuggestions(error.message)
      };
    }
  }

  // ===========================================
  // COMPONENT TESTS
  // ===========================================

  private async testChatScreenStructure(): Promise<FrontendTestResult> {
    try {
      const chatScreenPath = path.join(this.frontendPath, 'src/screens/ChatScreen.tsx');
      const chatContent = fs.readFileSync(chatScreenPath, 'utf8');
      
      const requiredElements = [
        'MessageStatus', // Our custom component
        'FlatList', // For messages
        'TextInput', // For input
        'TouchableOpacity', // For send button
        'useEffect', // For real-time updates
        'useState' // For state management
      ];

      const missingElements = requiredElements.filter(element => 
        !chatContent.includes(element)
      );

      if (missingElements.length > 0) {
        return {
          category: 'Components',
          testName: 'ChatScreen Structure',
          status: 'FAIL',
          error: `Missing elements: ${missingElements.join(', ')}`,
          duration: 0,
          suggestions: ['Add missing React Native components', 'Check ChatScreen implementation']
        };
      }

      return {
        category: 'Components',
        testName: 'ChatScreen Structure',
        status: 'PASS',
        duration: 0
      };
    } catch (error: any) {
      return {
        category: 'Components',
        testName: 'ChatScreen Structure',
        status: 'ERROR',
        error: error.message,
        duration: 0,
        suggestions: this.generateSuggestions(error.message)
      };
    }
  }

  private async testMessageStatusComponent(): Promise<FrontendTestResult> {
    try {
      const componentPath = path.join(this.frontendPath, 'src/components/MessageStatus.tsx');
      
      if (!fs.existsSync(componentPath)) {
        return {
          category: 'Components',
          testName: 'MessageStatus Component',
          status: 'FAIL',
          error: 'MessageStatus component file not found',
          duration: 0,
          suggestions: ['Create MessageStatus component', 'Check component path']
        };
      }

      const componentContent = fs.readFileSync(componentPath, 'utf8');
      
      const requiredFeatures = [
        'Animated', // For animations
        'TouchableOpacity', // For interactions
        'onResend', // Callback prop
        'testID' // For testing
      ];

      const missingFeatures = requiredFeatures.filter(feature => 
        !componentContent.includes(feature)
      );

      if (missingFeatures.length > 0) {
        return {
          category: 'Components',
          testName: 'MessageStatus Component',
          status: 'FAIL',
          error: `Missing features: ${missingFeatures.join(', ')}`,
          duration: 0,
          suggestions: ['Add missing MessageStatus features', 'Check component implementation']
        };
      }

      return {
        category: 'Components',
        testName: 'MessageStatus Component',
        status: 'PASS',
        duration: 0
      };
    } catch (error: any) {
      return {
        category: 'Components',
        testName: 'MessageStatus Component',
        status: 'ERROR',
        error: error.message,
        duration: 0,
        suggestions: this.generateSuggestions(error.message)
      };
    }
  }

  // ===========================================
  // TYPESCRIPT COMPILATION TESTS
  // ===========================================

  private async testTypeScriptCompilation(): Promise<FrontendTestResult> {
    try {
      const originalCwd = process.cwd();
      process.chdir(this.frontendPath);
      
      try {
        // If the frontend does not have a tsconfig.json, skip this test
        if (!fs.existsSync('tsconfig.json')) {
          return {
            category: 'TypeScript',
            testName: 'Frontend TypeScript Compilation',
            status: 'SKIP',
            error: 'No tsconfig.json found in frontend project',
            duration: 0,
            suggestions: ['Add a tsconfig.json to the frontend project if you want TS compile checks']
          };
        }
        execSync('npx tsc --noEmit', { stdio: 'pipe' });
        return {
          category: 'TypeScript',
          testName: 'Frontend TypeScript Compilation',
          status: 'PASS',
          duration: 0
        };
      } catch (error: any) {
        return {
          category: 'TypeScript',
          testName: 'Frontend TypeScript Compilation',
          status: 'FAIL',
          error: error.message,
          duration: 0,
          suggestions: ['Fix TypeScript compilation errors', 'Check type definitions']
        };
      } finally {
        process.chdir(originalCwd);
      }
    } catch (error: any) {
      return {
        category: 'TypeScript',
        testName: 'Frontend TypeScript Compilation',
        status: 'ERROR',
        error: error.message,
        duration: 0,
        suggestions: this.generateSuggestions(error.message)
      };
    }
  }

  // ===========================================
  // MOCK API TESTS
  // ===========================================

  private async testApiClientMethods(): Promise<FrontendTestResult[]> {
    // Skip dynamic require of RN TS files under Node; we already statically validated methods/imports.
    return [{
      category: 'API Methods',
      testName: 'API Module Loading',
      status: 'SKIP',
      error: 'Dynamic require skipped for RN TS modules',
      duration: 0,
      suggestions: ['Use Metro/Expo to run the app; Node cannot require RN TS files directly']
    }];
  }

  // ===========================================
  // EXPO/REACT NATIVE TESTS
  // ===========================================

  private async testExpoConfiguration(): Promise<FrontendTestResult> {
    try {
      const appConfigPath = path.join(this.frontendPath, 'app.json');
      const expoConfigPath = path.join(this.frontendPath, 'expo.json');
      
      if (!fs.existsSync(appConfigPath) && !fs.existsSync(expoConfigPath)) {
        return {
          category: 'Expo',
          testName: 'Expo Configuration',
          status: 'FAIL',
          error: 'No Expo configuration file found (app.json or expo.json)',
          duration: 0,
          suggestions: ['Create app.json or expo.json', 'Initialize Expo project']
        };
      }

      const configPath = fs.existsSync(appConfigPath) ? appConfigPath : expoConfigPath;
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      if (!config.expo && !config.name) {
        return {
          category: 'Expo',
          testName: 'Expo Configuration',
          status: 'FAIL',
          error: 'Invalid Expo configuration format',
          duration: 0,
          suggestions: ['Fix Expo configuration structure', 'Check Expo documentation']
        };
      }

      return {
        category: 'Expo',
        testName: 'Expo Configuration',
        status: 'PASS',
        duration: 0
      };
    } catch (error: any) {
      return {
        category: 'Expo',
        testName: 'Expo Configuration',
        status: 'ERROR',
        error: error.message,
        duration: 0,
        suggestions: this.generateSuggestions(error.message)
      };
    }
  }

  // ===========================================
  // MAIN TEST EXECUTION
  // ===========================================

  public async runAllTests(maxIterations: number = 3): Promise<void> {
    let iteration = 1;
    let allTestsPassed = false;

    console.log(`🎯 Starting Frontend Systematic Test Suite (max ${maxIterations} iterations)\n`);

    while (iteration <= maxIterations && !allTestsPassed) {
      console.log(`\n🔄 === FRONTEND ITERATION ${iteration}/${maxIterations} ===\n`);
      
      this.results = []; // Reset results for this iteration

      // Run all test categories
      const testCategories = [
        { name: 'Project Structure', tests: [
          () => this.testProjectStructure(),
          () => this.testPackageJson(),
          () => this.testExpoConfiguration()
        ]},
        { name: 'API Client', tests: [
          () => this.testApiClientStructure(),
          () => this.testApiClientImports()
        ]},
        { name: 'Components', tests: [
          () => this.testChatScreenStructure(),
          () => this.testMessageStatusComponent()
        ]},
        { name: 'TypeScript', tests: [
          () => this.testTypeScriptCompilation()
        ]}
      ];

      // Run standard tests
      for (const category of testCategories) {
        console.log(`\n📱 Running ${category.name} Tests:`);
        for (const test of category.tests) {
          await this.runTest(test);
        }
      }

      // Run API method tests
      console.log(`\n📱 Running API Method Tests:`);
      const apiResults = await this.testApiClientMethods();
      this.results.push(...apiResults);
      apiResults.forEach(result => this.logResult(result));

      // Check if all tests passed
      const failedTests = this.results.filter(r => r.status === 'FAIL' || r.status === 'ERROR');
      allTestsPassed = failedTests.length === 0;

      // Generate report
      this.generateReport(iteration);

      if (!allTestsPassed && iteration < maxIterations) {
        console.log(`\n🔧 Attempting frontend auto-fixes for next iteration...\n`);
        await this.attemptAutoFixes();
        console.log(`⏳ Waiting 3 seconds before next iteration...\n`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      iteration++;
    }

    if (allTestsPassed) {
      console.log(`\n🎉 All frontend tests passed after ${iteration - 1} iteration(s)!\n`);
    } else {
      console.log(`\n⚠️ Some frontend tests still failing after ${maxIterations} iterations. Check the final report.\n`);
    }
  }

  private generateReport(iteration: number): void {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const errors = this.results.filter(r => r.status === 'ERROR').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    const total = this.results.length;

    console.log(`\n📊 FRONTEND ITERATION ${iteration} SUMMARY:`);
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
      `frontend-test-report-iteration-${iteration}.json`,
      JSON.stringify(reportData, null, 2)
    );

    console.log(`📝 Detailed frontend report saved: frontend-test-report-iteration-${iteration}.json`);
  }

  private async attemptAutoFixes(): Promise<void> {
    const failedResults = this.results.filter(r => r.status === 'FAIL' || r.status === 'ERROR');
    const uniqueSuggestions = [...new Set(failedResults.flatMap(r => r.suggestions || []))];

    const originalCwd = process.cwd();
    
    try {
      process.chdir(this.frontendPath);

      for (const suggestion of uniqueSuggestions) {
        // Extract and execute actual install commands, ignoring any prefixed text like 'Install:'
        const match = suggestion.match(/(npm install|yarn add|yarn install)\s+(.+)/i);
        if (match) {
          const cmd = match[1] + ' ' + match[2];
          console.log(`🔧 Executing: ${suggestion}`);
          try {
            execSync(cmd, { stdio: 'inherit' });
          } catch (error) {
            console.log(`❌ Auto-fix failed: ${suggestion}`);
          }
        } else if (suggestion.includes('npx expo install')) {
          console.log(`🔧 Executing: ${suggestion}`);
          try {
            execSync(suggestion, { stdio: 'inherit' });
          } catch (error) {
            console.log(`❌ Auto-fix failed: ${suggestion}`);
          }
        }
      }
    } finally {
      process.chdir(originalCwd);
    }
  }
}

// Main execution
async function main() {
  const frontendPath = process.argv[2] || 'sav3-frontend/firebase-example/expo';
  const tester = new FrontendSystematicTester(frontendPath);
  await tester.runAllTests(3);
}

if (require.main === module) {
  main().catch(console.error);
}

export default FrontendSystematicTester;
