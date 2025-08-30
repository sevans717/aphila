# SAV3 Systematic Testing Framework

This comprehensive testing framework systematically tests every function in the SAV3 backend and frontend, automatically detects errors, and attempts to fix them through multiple iterations.

## 🧪 Available Test Commands

### Comprehensive Testing (Recommended)
```bash
# Run full test suite (backend + frontend + integration) with auto-fixes
npm run test:comprehensive

# Quick single-iteration test
npm run test:quick
```

### Individual Test Suites
```bash
# Backend only tests
npm run test:systematic

# Frontend only tests  
npm run test:frontend

# Auto-fix and comprehensive testing
npm run fix:auto
```

## 🔧 What Gets Tested

### Backend Tests
- **Infrastructure**: Server health, database connection, TypeScript compilation
- **Authentication**: User registration, login, token validation
- **Messaging**: Send messages, get conversations, unread counts
- **Subscriptions**: Plans, current subscription, usage
- **Discovery**: Categories, communities
- **WebSocket**: Real-time connection testing
- **Services**: All service layer functions

### Frontend Tests
- **Project Structure**: Required files, configuration
- **Dependencies**: Package.json validation, missing packages
- **API Client**: Method exports, imports, structure
- **Components**: ChatScreen, MessageStatus component
- **TypeScript**: Frontend compilation
- **Expo Configuration**: App configuration validation

### Integration Tests
- **API Connectivity**: Backend-frontend communication
- **Database Integration**: End-to-end data flow
- **WebSocket Integration**: Real-time features

## 🔄 Auto-Fix Capabilities

The testing system automatically attempts to fix common issues:

- Install missing dependencies
- Create missing directories and files
- Fix TypeScript configuration
- Update database schema
- Fix import/export issues
- Configure environment variables

## 📊 Test Reports

After each run, detailed reports are generated:

- `test-report-iteration-N.json` - Backend test results
- `frontend-test-report-iteration-N.json` - Frontend test results  
- `comprehensive-test-report-SESSION-ID.json` - Combined final report

## 🎯 Test Categories and Status

Each test shows:
- ✅ **PASS** - Test completed successfully
- ❌ **FAIL** - Test failed with specific error
- 💥 **ERROR** - Unexpected error occurred
- ⏭️ **SKIP** - Test skipped (dependencies not met)

## 🚀 Usage Examples

### Basic Usage
```bash
# Run comprehensive tests with up to 3 fix iterations
npm run test:comprehensive
```

### Advanced Usage
```bash
# Run with custom iteration count
ts-node comprehensive-test-runner.ts 5

# Run only backend tests
npm run test:systematic

# Run only frontend tests (specify path if needed)
ts-node frontend-systematic-tester.ts sav3-frontend/firebase-example/expo
```

## 🔍 Debugging Failed Tests

When tests fail, check:

1. **Error Messages**: Detailed error descriptions in console
2. **Suggestions**: Auto-generated fix suggestions
3. **Test Reports**: JSON files with full stack traces
4. **Server Logs**: Backend server output during tests

## 📋 Prerequisites

Before running tests, ensure:

- Node.js and npm installed
- PostgreSQL running (for database tests)
- All environment variables configured (.env file)
- Dependencies installed (`npm install`)

## 🎛️ Configuration

### Backend Configuration
- Server runs on port 3001 (configurable in .env)
- Database connection via DATABASE_URL
- JWT secrets for authentication tests

### Frontend Configuration  
- Default path: `sav3-frontend/firebase-example/expo`
- Requires React Native dependencies
- Tests axios-api integration

## 🔧 Adding New Tests

To add new tests to the systematic tester:

1. **Backend Tests**: Add to `SystematicTester` class in `systematic-tester.ts`
2. **Frontend Tests**: Add to `FrontendSystematicTester` class in `frontend-systematic-tester.ts`
3. **Integration Tests**: Add to `ComprehensiveTestRunner` class

Example test structure:
```typescript
private async testNewFeature(): Promise<TestResult> {
  try {
    // Test implementation
    return {
      category: 'Feature',
      testName: 'New Feature Test',
      status: 'PASS',
      duration: 0
    };
  } catch (error: any) {
    return {
      category: 'Feature', 
      testName: 'New Feature Test',
      status: 'FAIL',
      error: error.message,
      duration: 0,
      suggestions: ['Fix suggestion 1', 'Fix suggestion 2']
    };
  }
}
```

## 🎉 Success Criteria

Tests are considered successful when:
- All infrastructure components are working
- Authentication flow is functional
- API endpoints respond correctly
- Frontend components load without errors
- Integration between backend and frontend works
- WebSocket connections are established
- TypeScript compiles without errors

The testing framework will iterate up to 3 times by default, applying fixes between iterations until all tests pass or the maximum iterations are reached.
