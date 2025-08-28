// Test utility to verify the infinite loop fix
export const testInfiniteLoopFix = () => {
  console.log('🔍 Testing Infinite Loop Fix...');
  
  // Monitor page reloads
  let reloadCount = 0;
  const originalReload = window.location.reload;
  
  window.location.reload = () => {
    reloadCount++;
    console.warn(`⚠️ Page reload detected (${reloadCount} times)`);
    if (reloadCount > 3) {
      console.error('❌ Too many reloads detected - infinite loop may still exist');
    }
  };
  
  // Monitor console activity
  let logCount = 0;
  const originalLog = console.log;
  
  console.log = (...args) => {
    logCount++;
    originalLog(...args);
    
    // Check for excessive logging
    if (logCount > 50) {
      console.warn('⚠️ High log count detected - possible infinite loop');
    }
  };
  
  // Reset counters after 10 seconds
  setTimeout(() => {
    console.log = originalLog;
    window.location.reload = originalReload;
    
    console.log('📊 Activity Report:');
    console.log(`  Logs: ${logCount}`);
    console.log(`  Reloads: ${reloadCount}`);
    
    if (reloadCount === 0 && logCount < 100) {
      console.log('✅ No infinite loop detected');
    } else {
      console.warn('⚠️ Potential issues detected');
    }
  }, 10000);
  
  return {
    getStats: () => ({ logCount, reloadCount }),
    reset: () => {
      logCount = 0;
      reloadCount = 0;
    }
  };
};

// Monitor React component re-renders
export const monitorComponentRenders = (componentName: string) => {
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
export const checkMemoryLeaks = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    console.log('💾 Memory Usage:');
    console.log(`  Used: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)} MB`);
    console.log(`  Total: ${Math.round(memory.totalJSHeapSize / 1024 / 1024)} MB`);
    console.log(`  Limit: ${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)} MB`);
    
    const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
    if (usagePercentage > 80) {
      console.warn('⚠️ High memory usage detected');
    }
  }
};
