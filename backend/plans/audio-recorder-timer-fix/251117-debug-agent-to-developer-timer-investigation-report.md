# AudioRecorder Timer Issues - Investigation Report

**Date:** 2025-11-17
**Agent:** Debug Agent
**Target:** Developer
**File:** `/Users/admin/nguyen/code/claudekit-engineer/src/voice-training-app/frontend/src/hooks/useAudioRecorder.ts`

---

## Executive Summary

**ROOT CAUSES IDENTIFIED:**

1. **Timer Lag Issue:** Stale closure in `startRecording` - `stopRecording` function called in interval (line 85) references outdated version
2. **Timer Continues When Paused:** Missing dependency `stopRecording` in `startRecording` useCallback (line 97)

**BUSINESS IMPACT:**
- Poor UX - timer appears broken to users
- Potential data inconsistency - actual recording time vs displayed time mismatch
- Auto-stop feature (line 84-86) may fail silently

**PRIORITY:** HIGH - affects core recording functionality

---

## Technical Analysis

### Issue #1: Timer Increases with Lag

**Evidence (Lines 79-90):**
```typescript
timerRef.current = setInterval(() => {
  setRecordingTime((prev) => {
    const newTime = prev + 1;

    // Auto-stop at max time
    if (newTime >= MAX_RECORDING_TIME) {
      stopRecording();  // ← STALE CLOSURE
    }

    return newTime;
  });
}, 1000);
```

**Root Cause:**
- `startRecording` useCallback has empty dependency array (line 97)
- `stopRecording` function referenced inside interval callback is from initial render
- `stopRecording` depends on `isRecording` state (line 100)
- When `stopRecording` is called from interval, it uses stale `isRecording` value
- Condition `isRecording` check fails → `mediaRecorderRef.current.stop()` never called
- Timer keeps running because interval never cleared

**Evidence Chain:**
1. Line 97: `startRecording` deps = `[]` → function never updates
2. Line 85: `stopRecording()` called → uses closure from initial render
3. Line 100: `if (mediaRecorderRef.current && isRecording)` → `isRecording` is stale
4. Line 101: `mediaRecorderRef.current.stop()` → never executes
5. Lines 68-71: Timer cleanup in `onstop` handler → never triggers
6. Result: Interval continues running, timer keeps incrementing

### Issue #2: Timer Continues When Paused

**Evidence (Lines 105-115, 117-133):**
```typescript
// pauseRecording (lines 105-115)
const pauseRecording = useCallback(() => {
  if (mediaRecorderRef.current && isRecording && !isPaused) {
    mediaRecorderRef.current.pause();
    setIsPaused(true);

    if (timerRef.current) {
      clearInterval(timerRef.current);  // ← Clears interval
      timerRef.current = null;
    }
  }
}, [isRecording, isPaused]);

// resumeRecording (lines 117-133)
const resumeRecording = useCallback(() => {
  if (mediaRecorderRef.current && isRecording && isPaused) {
    mediaRecorderRef.current.resume();
    setIsPaused(false);

    // Restart timer
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => {
        const newTime = prev + 1;
        if (newTime >= MAX_RECORDING_TIME) {
          stopRecording();  // ← SAME STALE CLOSURE
        }
        return newTime;
      });
    }, 1000);
  }
}, [isRecording, isPaused, stopRecording]);  // ← Has stopRecording dep
```

**Root Cause:**
- When pause clicked → `pauseRecording` clears interval (line 111)
- BUT `startRecording` interval may still be running if `startRecording` never re-created
- Two scenarios:
  1. Original interval from `startRecording` never cleared → continues running
  2. `resumeRecording` creates new interval → now TWO intervals running
- Multiple intervals = timer increments faster than 1/sec = "lag"

**Evidence Chain:**
1. User clicks Record → `startRecording` creates interval A
2. User clicks Pause → `pauseRecording` clears `timerRef.current` (interval A ref)
3. BUT interval A may still be running if `timerRef.current` !== interval A
4. OR `startRecording` stale closure means `timerRef` not properly tracked
5. User clicks Resume → `resumeRecording` creates interval B
6. Result: Both A and B running → timer increments 2x/sec

### Dependency Analysis

**Current State:**
```typescript
startRecording: [], // ← MISSING stopRecording
stopRecording: [isRecording],
pauseRecording: [isRecording, isPaused],
resumeRecording: [isRecording, isPaused, stopRecording], // ← HAS stopRecording
```

**Problem:**
- `startRecording` doesn't include `stopRecording` in deps
- React doesn't recreate `startRecording` when `stopRecording` changes
- Interval callback captures old `stopRecording` function
- Auto-stop feature silently fails

---

## Root Cause Summary

### Primary Issue: Stale Closure
- `startRecording` useCallback missing `stopRecording` dependency
- Interval callback references outdated `stopRecording` function
- Stale `isRecording` state in `stopRecording` → condition fails
- Timer never stops, keeps incrementing

### Secondary Issue: Interval Management
- Potential for multiple intervals running simultaneously
- `timerRef` may not track correct interval instance
- Pause/resume creates new interval without ensuring old one cleared
- Results in timer lag (multiple increments per second)

---

## Actionable Recommendations

### IMMEDIATE FIX (Lines 97, 133)

**1. Fix `startRecording` dependencies:**
```typescript
// Line 97 - CHANGE FROM:
}, []);

// TO:
}, [stopRecording]);
```

**2. Verify interval cleanup in pause:**
```typescript
// Lines 110-113 - ADD defensive check
if (timerRef.current) {
  clearInterval(timerRef.current);
  timerRef.current = null;
}
```

**3. Add cleanup in startRecording:**
```typescript
// Line 78 - BEFORE creating new interval, add:
if (timerRef.current) {
  clearInterval(timerRef.current);
}
timerRef.current = setInterval(() => {
  // ... existing code
}, 1000);
```

### LONG-TERM IMPROVEMENTS

1. **Add useEffect cleanup:**
```typescript
useEffect(() => {
  return () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };
}, []);
```

2. **Consider using useRef for stopRecording:**
- Store latest `stopRecording` in ref
- Avoid stale closures entirely
- No dependency needed

3. **Add interval state tracking:**
```typescript
const [intervalActive, setIntervalActive] = useState(false);
```

4. **Add defensive logging:**
```typescript
console.log('[Timer] Starting interval, current ref:', timerRef.current);
console.log('[Timer] Clearing interval, current ref:', timerRef.current);
```

---

## Test Plan

### Test Case 1: Timer Lag
1. Start recording
2. Wait 5 seconds
3. Observe timer increments at 1-second intervals (not faster)
4. **Expected:** Timer shows 00:05

### Test Case 2: Pause/Resume
1. Start recording
2. Wait 3 seconds → timer shows 00:03
3. Pause recording
4. Wait 5 seconds
5. **Expected:** Timer stays at 00:03
6. Resume recording
7. Wait 2 seconds
8. **Expected:** Timer shows 00:05 (not 00:10 or 00:07)

### Test Case 3: Auto-Stop
1. Modify MAX_RECORDING_TIME to 10 seconds (for testing)
2. Start recording
3. Wait 11 seconds
4. **Expected:** Recording auto-stops at 00:10

### Test Case 4: Multiple Pause/Resume Cycles
1. Record 2 sec → Pause → Wait 2 sec → Resume → Record 2 sec → Pause
2. **Expected:** Timer shows 00:04 (not higher)

---

## Supporting Evidence

### Interval Lifecycle
```
startRecording() → creates interval A → timerRef.current = A
pauseRecording() → clearInterval(timerRef.current) → timerRef.current = null
resumeRecording() → creates interval B → timerRef.current = B

PROBLEM: If timerRef tracking broken, interval A may still run
```

### Closure Capture
```javascript
// Render 1: isRecording = false
const stopRecording = () => { if (false && ...) } // ← captured

// Render 2: isRecording = true
// startRecording still uses stopRecording from Render 1
```

### State Flow
```
isRecording: false → true → true (paused) → true (resumed)
isPaused: false → false → true → false
timerRef: null → intervalA → null → intervalB
```

---

## Risk Assessment

**CURRENT RISKS:**
- **High:** Users cannot rely on timer display
- **Medium:** Auto-stop feature may fail (safety feature)
- **Low:** Multiple intervals may cause performance issues

**MITIGATION:**
- Apply dependency fix immediately
- Add defensive interval cleanup
- Test all recording workflows
- Add error logging for debugging

---

## Implementation Notes

**Files to Modify:**
- `/Users/admin/nguyen/code/claudekit-engineer/src/voice-training-app/frontend/src/hooks/useAudioRecorder.ts`

**Lines to Change:**
- Line 97: Add `stopRecording` to dependencies
- Line 78: Add defensive `clearInterval` before creating new interval
- Optional: Add useEffect cleanup hook

**Testing Required:**
- Manual testing of all timer scenarios
- Verify no React warnings about missing dependencies
- Check browser console for interval leaks (multiple setInterval without clear)

---

## Unresolved Questions

1. Should we add visual feedback when auto-stop triggers?
2. Should we persist timer state across component remounts?
3. Do we need to handle browser tab visibility (pause when tab hidden)?
4. Should we add telemetry to track timer accuracy in production?

---

**END OF REPORT**
