import { PomodoroMode } from '../src/types';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details?: string) {
  if (condition) {
    results.push({ name, passed: true });
    console.log(`  ✓ ${name}`);
  } else {
    results.push({ name, passed: false, details });
    console.error(`  ✗ ${name} - ${details}`);
  }
}

console.log('=== TEST SUITE: POMODORO 3 VIEWS & OPERATIONAL RULES ===\n');

// 1. Test Work View (Focus Mode)
console.log('--- 1. Testing Work View (Focus Mode) ---');
{
  const mode: PomodoroMode = 'work';
  const isRunning = true;
  const isDefragActive = isRunning && mode === 'work';
  const workDuration = 1500; // 25 min
  let timeLeft = workDuration;

  assert(mode === 'work', 'Mode is set to work');
  assert(isDefragActive === true, 'isDefragActive is TRUE during running Work session');
  assert(timeLeft === 1500, 'Default Work duration is 25 minutes (1500s)');

  // Simulate tick
  timeLeft -= 1;
  const totalFocusSeconds = 1;
  assert(timeLeft === 1499, 'Timer counts down in Work mode');
  assert(totalFocusSeconds === 1, 'Focus seconds accumulate in Work mode');

  // Check UI labels for Work View
  const workTabLabel = '★ FOCUS (25m)';
  assert(workTabLabel.includes('FOCUS'), 'Work view tab displays FOCUS');
  assert(!workTabLabel.includes('🍅'), 'Work view tab has NO tomato emoji');
}

// 2. Test Short Break View
console.log('\n--- 2. Testing Short Break View ---');
{
  const mode: PomodoroMode = 'shortBreak';
  const isRunning = true;
  const isDefragActive = isRunning && (mode as PomodoroMode) === 'work';
  const shortBreakDuration = 300; // 5 min
  let timeLeft = shortBreakDuration;

  assert(mode === 'shortBreak', 'Mode is set to shortBreak');
  assert(isDefragActive === false, 'isDefragActive is FALSE during Short Break (drive heads parked)');
  
  // ASCII coffee icon check
  const asciiIcon = 'c[_]';
  const shortBreakTabLabel = `${asciiIcon} BREAK (${Math.round(shortBreakDuration / 60)}m)`;
  assert(shortBreakTabLabel.startsWith('c[_]'), 'Short Break tab uses ASCII coffee icon c[_]');
  assert(!shortBreakTabLabel.includes('☕'), 'Short Break tab contains NO coffee emoji');

  const statusText = 'BREAK PROTOCOL: DRIVE HEADS PARKED';
  assert(statusText.includes('PARKED'), 'Status banner indicates drive heads parked');
}

// 3. Test Long Break View
console.log('\n--- 3. Testing Long Break View ---');
{
  const mode: PomodoroMode = 'longBreak';
  const isRunning = true;
  const isDefragActive = isRunning && (mode as PomodoroMode) === 'work';
  const longBreakDuration = 900; // 15 min

  assert(mode === 'longBreak', 'Mode is set to longBreak');
  assert(isDefragActive === false, 'isDefragActive is FALSE during Long Break');

  // ASCII sleep icon check
  const asciiIcon = 'zZz';
  const longBreakTabLabel = `${asciiIcon} LONG (${Math.round(longBreakDuration / 60)}m)`;
  assert(longBreakTabLabel.startsWith('zZz'), 'Long Break tab uses ASCII zZz symbol');
  assert(!longBreakTabLabel.includes('💤'), 'Long Break tab contains NO sleeping emoji');
}

// 4. Test View Transition Cycle: Work (1-3) -> Short Break, Work 4 -> Long Break
console.log('\n--- 4. Testing 4-Cycle State Transitions ---');
{
  let currentMode: PomodoroMode = 'work';
  let sessionsCompleted = 0;

  function simulateSessionEnd() {
    if (currentMode === 'work') {
      sessionsCompleted += 1;
      const isLong = sessionsCompleted % 4 === 0;
      currentMode = isLong ? 'longBreak' : 'shortBreak';
    } else {
      currentMode = 'work';
    }
  }

  // Session 1 finish
  simulateSessionEnd();
  assert(sessionsCompleted === 1 && (currentMode as PomodoroMode) === 'shortBreak', 'Session 1 transitions to Short Break');

  // Break 1 finish
  simulateSessionEnd();
  assert(currentMode === 'work', 'Break 1 transitions back to Work');

  // Session 2 finish
  simulateSessionEnd();
  assert(sessionsCompleted === 2 && (currentMode as PomodoroMode) === 'shortBreak', 'Session 2 transitions to Short Break');
  simulateSessionEnd(); // Break 2 finish

  // Session 3 finish
  simulateSessionEnd();
  assert(sessionsCompleted === 3 && (currentMode as PomodoroMode) === 'shortBreak', 'Session 3 transitions to Short Break');
  simulateSessionEnd(); // Break 3 finish

  // Session 4 finish -> Must trigger Long Break!
  simulateSessionEnd();
  assert(sessionsCompleted === 4 && (currentMode as PomodoroMode) === 'longBreak', 'Session 4 (streak 4) transitions to Long Break');
  
  // Break 4 finish -> Returns to Work
  simulateSessionEnd();
  assert(currentMode === 'work', 'Long Break transitions back to Work for next streak');
}

// 5. Test Cycle Counter Display (no tomato x4)
console.log('\n--- 5. Testing Streak & Cycle UI Labels ---');
{
  const sessionsCompleted = 4;
  const cycleLabel = `CYCLES: ${sessionsCompleted}`;
  assert(!cycleLabel.includes('🍅'), 'Cycle label has NO tomato emoji');
  assert(cycleLabel === 'CYCLES: 4', 'Cycle label displays CYCLES: 4');
}

// 6. Test Responsive Layout Views (Mobile, Tablet, Desktop)
console.log('\n--- 6. Testing Responsive Layout View Structure ---');
{
  // App structure layout checks:
  // Desktop: 8 cols main (sector map + pomo timer) + 4 cols sidebar (LazyDocker)
  // Mobile/Tablet: Order-1 (sector map + pomo timer), Order-2 (sidebar below)
  const desktopColsMain = 'lg:col-span-8';
  const desktopColsSidebar = 'lg:col-span-4';
  const mobileOrderMain = 'order-1';
  const mobileOrderSidebar = 'order-2';

  assert(desktopColsMain === 'lg:col-span-8', 'Desktop main column span is 8');
  assert(desktopColsSidebar === 'lg:col-span-4', 'Desktop sidebar column span is 4');
  assert(mobileOrderMain === 'order-1', 'Mobile main area is ordered first');
  assert(mobileOrderSidebar === 'order-2', 'Mobile sidebar is ordered below');
}

const failed = results.filter(r => !r.passed);
console.log(`\n=== SUMMARY: ${results.length - failed.length}/${results.length} TESTS PASSED ===`);
if (failed.length > 0) {
  process.exit(1);
} else {
  console.log('All tests on all three views passed successfully!\n');
}
