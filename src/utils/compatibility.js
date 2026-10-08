/**
 * Compatibility Matching Utility
 * Calculates 0-100 compatibility score, match level, and short explanation string.
 */

export const calculateCompatibility = (currentUser = {}, candidateUser = {}) => {
  let score = 0;
  const matchReasons = [];

  // 1. Budget Comparison (Max 15 pts)
  const currentBudgetVal = currentUser.budgetValue || extractNumber(currentUser.monthlyBudget) || 10000;
  const candidateBudgetVal = candidateUser.budgetValue || extractNumber(candidateUser.monthlyBudget) || 10000;
  const budgetDiffRatio = Math.abs(currentBudgetVal - candidateBudgetVal) / Math.max(currentBudgetVal, candidateBudgetVal, 1);

  if (budgetDiffRatio <= 0.15) {
    score += 15;
    matchReasons.push('similar budget');
  } else if (budgetDiffRatio <= 0.35) {
    score += 10;
  } else if (budgetDiffRatio <= 0.5) {
    score += 5;
  }

  // 2. Preferred Location / City (Max 15 pts)
  const currentCity = (currentUser.city || '').toLowerCase();
  const candidateCity = (candidateUser.city || '').toLowerCase();
  const currentLoc = (currentUser.preferredLocation || '').toLowerCase();
  const candidateLoc = (candidateUser.preferredLocation || '').toLowerCase();

  if (currentCity && candidateCity && (currentCity.includes(candidateCity) || candidateCity.includes(currentCity))) {
    score += 10;
    if (currentLoc && candidateLoc && (currentLoc.includes(candidateLoc) || candidateLoc.includes(currentLoc))) {
      score += 5;
      matchReasons.push('matching location');
    }
  } else {
    score += 5;
  }

  // 3. Move-in Date (Max 10 pts)
  if (currentUser.moveInDate && candidateUser.moveInDate && currentUser.moveInDate === candidateUser.moveInDate) {
    score += 10;
    matchReasons.push('same move-in timeline');
  } else {
    score += 5;
  }

  // 4. Room Preference (Private / Shared) (Max 10 pts)
  if (currentUser.roomType && candidateUser.roomType && currentUser.roomType === candidateUser.roomType) {
    score += 10;
    matchReasons.push('preferred room type');
  } else {
    score += 4;
  }

  // 5. Food Preference (Vegetarian / Non-Veg / Both) (Max 10 pts)
  if (currentUser.food && candidateUser.food) {
    if (currentUser.food === candidateUser.food) {
      score += 10;
      matchReasons.push('food preference');
    } else if (currentUser.food === 'Both' || candidateUser.food === 'Both') {
      score += 7;
    } else {
      score += 2;
    }
  } else {
    score += 7;
  }

  // 6. Smoking (Max 8 pts)
  if (currentUser.smoking && candidateUser.smoking) {
    if (currentUser.smoking === candidateUser.smoking) {
      score += 8;
      if (currentUser.smoking === 'No') matchReasons.push('non-smoking habit');
    } else {
      score += 0;
    }
  } else {
    score += 5;
  }

  // 7. Drinking (Max 7 pts)
  if (currentUser.drinking && candidateUser.drinking) {
    if (currentUser.drinking === candidateUser.drinking) {
      score += 7;
    } else {
      score += 3;
    }
  } else {
    score += 5;
  }

  // 8. Pets (Max 5 pts)
  if (currentUser.pets && candidateUser.pets) {
    if (currentUser.pets === candidateUser.pets) {
      score += 5;
    } else {
      score += 2;
    }
  } else {
    score += 3;
  }

  // 9. Cleanliness (Max 8 pts)
  if (currentUser.cleanliness && candidateUser.cleanliness) {
    if (currentUser.cleanliness === candidateUser.cleanliness) {
      score += 8;
      matchReasons.push('cleanliness habits');
    } else {
      score += 4;
    }
  } else {
    score += 5;
  }

  // 10. Sleep Schedule (Early / Normal / Late) (Max 5 pts)
  if (currentUser.sleepSchedule && candidateUser.sleepSchedule) {
    if (currentUser.sleepSchedule === candidateUser.sleepSchedule) {
      score += 5;
      matchReasons.push('sleep schedule');
    } else {
      score += 2;
    }
  } else {
    score += 3;
  }

  // 11. Study Environment (Quiet / Flexible / Social) (Max 4 pts)
  if (currentUser.studyEnvironment && candidateUser.studyEnvironment) {
    if (currentUser.studyEnvironment === candidateUser.studyEnvironment) {
      score += 4;
      matchReasons.push('study environment');
    } else {
      score += 2;
    }
  } else {
    score += 2;
  }

  // 12. Guests Preference (Max 3 pts)
  if (currentUser.guests && candidateUser.guests) {
    if (currentUser.guests === candidateUser.guests) {
      score += 3;
    } else {
      score += 1;
    }
  } else {
    score += 2;
  }

  // Cap total score between 35 and 99 for realistic demo feel
  const finalScore = Math.min(Math.max(score, 45), 98);

  // Match Level determination (Requirement 8)
  let level = 'Low Match';
  let levelColor = '#64748B';

  if (finalScore >= 80) {
    level = 'Excellent Match';
    levelColor = '#10B981'; // Emerald
  } else if (finalScore >= 60) {
    level = 'Good Match';
    levelColor = '#4F46E5'; // Indigo
  } else if (finalScore >= 40) {
    level = 'Moderate Match';
    levelColor = '#F59E0B'; // Amber
  }

  // Generate short explanation string (Requirement 9)
  const topReasons = matchReasons.slice(0, 3);
  let explanation = 'Similar living habits & campus preferences.';
  if (topReasons.length > 0) {
    explanation = `Similar ${topReasons.join(', ')}.`;
  }

  return {
    score: finalScore,
    level,
    levelColor,
    explanation,
  };
};

const extractNumber = (str) => {
  if (!str) return null;
  const matches = str.match(/\d+[\d,]*/);
  if (!matches) return null;
  return parseInt(matches[0].replace(/,/g, ''), 10);
};
