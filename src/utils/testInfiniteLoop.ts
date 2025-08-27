// Test utility to check if the infinite loop issue is fixed
export const testInfiniteLoopFix = () => {
  console.log('🔍 Testing Infinite Loop Fix...');
  
  // Check if there are any console errors or warnings
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;
  
  let errorCount = 0;
  let warnCount = 0;
  let logCount = 0;
  
  // Override console methods to count calls
  console.error = (...args) => {
    errorCount++;
    originalConsoleError(...args);
  };
  
  console.warn = (...args) => {
    warnCount++;
    originalConsoleWarn(...args);
  };
  
  console.log = (...args) => {
    logCount++;
    originalConsoleLog(...args);
  };
  
  // Reset counters after 5 seconds
  setTimeout(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
    
    console.log('📊 Console Activity Report:');
    console.log(`  Errors: ${errorCount}`);
    console.log(`  Warnings: ${warnCount}`);
    console.log(`  Logs: ${logCount}`);
    
    if (logCount > 100) {
      console.warn('⚠️ High log count detected - possible infinite loop');
    } else {
      console.log('✅ No infinite loop detected');
    }
  }, 5000);
  
  return {
    startMonitoring: () => {
      console.log('🔍 Starting infinite loop monitoring...');
      console.log('📝 Navigate to the profile page and watch for excessive console activity');
    }
  };
};

// Monitor React re-renders
export const monitorReRenders = (componentName: string) => {
  let renderCount = 0;
  
  return () => {
    renderCount++;
    console.log(`🔄 ${componentName} rendered ${renderCount} times`);
    
    if (renderCount > 10) {
      console.warn(`⚠️ ${componentName} has rendered ${renderCount} times - possible infinite re-render`);
    }
  };
};

// Check for memory leaks
export const checkMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    console.log('💾 Memory Usage:');
    console.log(`  Used: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)} MB`);
    console.log(`  Total: ${Math.round(memory.totalJSHeapSize / 1024 / 1024)} MB`);
    console.log(`  Limit: ${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)} MB`);
  }
};
