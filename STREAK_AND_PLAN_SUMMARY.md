# Sugar-Free Streak & Plan System Summary

## How the Sugar-Free Streak Works

### Overview
The streak system tracks consecutive days where the user logs food and stays under their daily added sugar target. It's independent from the 90-day plan duration.

### Streak Calculation Logic

1. **Daily Requirements for a Valid Streak Day:**
   - User must log at least one food item on that day
   - Total added sugar from all logged items must be ≤ daily target (based on gender/plan)
   - Both conditions must be met for the day to count toward the streak

2. **Grace Period:**
   - Users have a **2-day grace period** before the streak resets
   - If no food is logged today → streak continues (day 1 of grace)
   - If no food is logged yesterday AND today → streak continues (day 2 of grace)
   - If no food is logged for 3+ consecutive days → streak resets to 0

3. **Streak Breaking:**
   - Streak breaks if user logs food but exceeds their daily sugar target
   - Streak breaks if grace period is exceeded (3+ days without logging)
   - When streak breaks, a reset timestamp is stored (`streak_broken_at`)

4. **Streak Timer:**
   - The streak timer shows time elapsed since the streak started
   - If streak is active: timer counts from when the current streak began
   - If streak is broken: timer resets to Day 0 (based on `streak_broken_at` timestamp)
   - Timer is independent of the plan start date

### Key Files:
- `src/services/streakService.ts` - Core streak calculation logic
- `src/context/UserDataContext.tsx` - `refreshStreakFromFoodLogs()` function
- `src/screens/HomeScreen.tsx` - Displays streak timer

### Streak Data Structure:
```typescript
{
  currentStreak: number,      // Consecutive days under target
  longestStreak: number,      // Best streak ever achieved
  startDate: Date,            // When current streak started (resets when broken)
  lastCheckIn: Date | null,   // Last valid streak day
  totalDaysSugarFree: number  // Total days under target (not consecutive)
}
```

---

## How the 90-Day Plan Works

### Overview
The plan is a **fixed 90-day duration** from the onboarding start date, regardless of streak breaks or resets.

### Plan Duration Logic:
- **Start Date**: Set when user completes onboarding (`onboardingData.startDate`)
- **End Date**: Start Date + 90 days
- **Progress**: Calculated as `(days since plan start) / 90 days`
- **Independent of Streak**: Plan progress continues even if streak breaks

### Example:
- User starts plan on **January 12th**
- Plan ends on **April 12th** (90 days later)
- If user breaks streak on January 20th and restarts:
  - Streak timer resets to Day 0
  - Plan progress continues from January 12th (not reset)
  - On January 25th: Streak = 5 days, Plan = 13 days (13/90 = 14%)

### Key Files:
- `src/screens/HomeScreen.tsx` - Plan progress calculation
- `src/components/PlanProgressBar.tsx` - Displays plan progress
- `src/services/onboardingService.ts` - Stores plan start date

### Plan Progress Calculation:
```typescript
const planStartDate = new Date(onboardingData.startDate);
const daysSincePlanStart = Math.floor((Date.now() - planStartDate.getTime()) / (1000 * 60 * 60 * 24));
const planProgress = Math.min(100, (daysSincePlanStart / 90) * 100);
```

---

## Key Differences

| Aspect | Streak | Plan |
|--------|--------|------|
| **Duration** | Variable (resets when broken) | Fixed 90 days |
| **Start Date** | Resets when streak breaks | Fixed at onboarding |
| **Progress** | Based on consecutive days | Based on calendar days |
| **Purpose** | Motivation & daily tracking | Overall journey completion |
| **Resets** | Yes (when broken) | No (always from start date) |

---

## Implementation Notes

### Streak Timer (HomeScreen):
- Uses `streakData.startDate` (can reset when streak breaks)
- Shows: "X days Y hours Z minutes" since streak started
- Updates every second

### Plan Progress (HomeScreen):
- Uses `onboardingData.startDate` (never resets)
- Shows: "X% complete" and phase information
- Calculated as: `(days since plan start) / 90`

### When Streak Breaks:
1. `refreshStreakFromFoodLogs()` detects the break
2. Stores `streak_broken_at` timestamp in AsyncStorage
3. Sets `streakData.startDate` to the reset timestamp (Day 0)
4. Plan progress continues unchanged (still based on `onboardingData.startDate`)

