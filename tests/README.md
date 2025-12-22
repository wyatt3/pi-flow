# Test Suite Documentation

## Overview

This test suite provides comprehensive coverage for the Pi-Flow irrigation timer application. All tests are written using Jest with ES modules support.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Test Files

### 1. `zoneService.test.js` ✅
Tests the Zone Service which handles zone management and GPIO control.

**Coverage:**
- Creating new zones
- Updating zone status (active/inactive)
- Deleting zones
- Turning off all zones
- GPIO integration
- WebSocket broadcasting

**Key Test Cases:**
- Valid zone creation
- Zone status updates
- GPIO control verification
- Error handling for zones without GPIO
- Bulk operations

### 2. `scheduleService.test.js` ✅
Tests the Schedule Service which manages irrigation schedules.

**Coverage:**
- Creating schedules
- Updating schedules
- Deleting schedules
- Running schedules
- Schedule overlap detection
- One-time vs recurring schedules
- Skip next occurrence functionality

**Key Test Cases:**
- Schedule creation with validation
- Overlap detection algorithm
- Schedule execution timing
- Zone activation/deactivation
- One-time schedule auto-deletion
- Error handling for invalid zones

### 3. `zoneController.test.js` ✅
Tests the Zone Controller HTTP endpoints.

**Coverage:**
- GET /zones - Retrieve all zones
- POST /zones - Create new zone
- PUT /zones/:id - Update zone status
- DELETE /zones/:id - Delete zone

**Key Test Cases:**
- Valid request handling
- Invalid input validation
- Error responses (400, 404)
- GPIO pin validation
- Success responses (200, 201, 204)

### 4. `scheduleController.test.js` ✅
Tests the Schedule Controller HTTP endpoints.

**Coverage:**
- POST /schedules - Create new schedule
- PUT /schedules/:id - Update schedule
- DELETE /schedules/:id - Delete schedule

**Key Test Cases:**
- Required field validation
- Zone existence verification
- Service error handling
- Schedule update scenarios
- Skip next functionality

### 5. `models.test.js` ✅
Tests the Zone and Schedule data models.

**Coverage:**
- Zone model initialization
- Schedule model initialization
- GPIO configuration
- Database relationship loading
- Default values

**Key Test Cases:**
- Property assignment
- GPIO initialization based on environment
- Schedule loading for zones
- Day loading for schedules
- Edge cases (null values, all days, etc.)

## Test Utilities

### `testUtils.js`
Provides helper functions for creating mock objects:

- `createMockDb()` - Mock database with prepare/get/all/run methods
- `createMockWebsocketService()` - Mock websocket for broadcasting
- `createMockGpio()` - Mock GPIO interface
- `resetAllMocks()` - Helper to reset all mocks between tests

### `setup.js`
Global test configuration:

- Mock environment variables
- Mock GPIO module globally
- Set test timeout (10 seconds)
- Configure Jest for ES modules

## Coverage Goals

The test suite aims for:
- **Line Coverage:** > 80%
- **Branch Coverage:** > 75%
- **Function Coverage:** > 85%
- **Statement Coverage:** > 80%

## Key Testing Patterns

### 1. Mocking Strategy
All external dependencies are mocked:
- Database (better-sqlite3)
- GPIO (onoff)
- WebSocket service
- Moment-timezone

### 2. Test Structure
```javascript
describe('ServiceName', () => {
  beforeEach(() => {
    // Reset mocks and setup
  });

  describe('methodName', () => {
    it('should handle normal case', () => {
      // Arrange
      // Act
      // Assert
    });

    it('should handle edge case', () => {
      // Test edge case
    });

    it('should handle error case', () => {
      // Test error handling
    });
  });
});
```

### 3. Async/Await with ES Modules
Since the project uses ES modules, all imports use dynamic `await import()`:

```javascript
// Mock modules first
jest.unstable_mockModule('../src/config/db.js', () => ({
  default: mockDb,
}));

// Import after mocking
const Service = (await import('../src/services/service.js')).default;
```

## Environment Setup

The tests run with:
- `NODE_ENV`: test
- `PORT`: 3000
- `GPIO_ENABLED`: false (to prevent actual GPIO operations)
- `TIMEZONE`: America/New_York

## Common Issues & Solutions

### Issue: Module Import Errors
**Solution:** Ensure all mocks are set up before importing modules using `jest.unstable_mockModule()`.

### Issue: Timers Not Working
**Solution:** Use `jest.useFakeTimers()` in `beforeEach` and `jest.advanceTimersByTime()` to control time.

### Issue: Database Mocks Not Called
**Solution:** Check that mock setup includes both `prepare()` and the method chain (`get()`, `all()`, `run()`).

### Issue: GPIO Module Errors
**Solution:** Ensure `GPIO_ENABLED` is set to `false` in test environment.

## Adding New Tests

When adding new functionality:

1. Create or update the corresponding test file
2. Mock any new dependencies
3. Follow the existing test structure
4. Test happy path, edge cases, and error scenarios
5. Update this README with new coverage

## Best Practices

1. **Isolation:** Each test should be independent
2. **Clarity:** Test names should describe what they test
3. **Coverage:** Test normal flow, edge cases, and errors
4. **Mocking:** Mock external dependencies, not internal logic
5. **Assertions:** Use specific matchers (`toBe`, `toEqual`, `toHaveBeenCalledWith`)
6. **Cleanup:** Reset mocks in `beforeEach` hooks

## Continuous Integration

These tests are designed to run in CI/CD pipelines. They:
- Don't require actual hardware (GPIO)
- Don't require a real database
- Run quickly (< 30 seconds for full suite)
- Exit with proper status codes

## Future Enhancements

Potential areas for additional testing:
- Integration tests with real database
- API endpoint tests using supertest
- WebSocket communication tests
- Vue component tests (frontend)
- End-to-end tests

## Contributing

When contributing tests:
1. Follow existing patterns and structure
2. Maintain high coverage (>80%)
3. Document complex test scenarios
4. Update this README for significant changes
