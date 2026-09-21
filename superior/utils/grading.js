const calculateGrade = (score, gradingRules) => {
  const numericScore = Number(score);

  if (
    Number.isNaN(numericScore) ||
    numericScore < 0 ||
    numericScore > 100
  ) {
    throw new Error(
      "Score must be a number between 0 and 100"
    );
  }

  if (
    !Array.isArray(gradingRules) ||
    gradingRules.length === 0
  ) {
    throw new Error(
      "No grading rules configured for this institution"
    );
  }

  const rule = gradingRules.find(
    (gradingRule) =>
      numericScore >= gradingRule.minScore &&
      numericScore <= gradingRule.maxScore
  );

  if (!rule) {
    throw new Error(
      `No grading rule found for score ${numericScore}`
    );
  }

  return {
    score: numericScore,
    grade: rule.grade,
    gradePoint: rule.gradePoint,
  };
};

module.exports = {
  calculateGrade,
};