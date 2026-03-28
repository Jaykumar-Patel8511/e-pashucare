function isDayTime(date = new Date()) {
  const hour = date.getHours();
  return hour >= 6 && hour < 18;
}

function calculateVisitFee({ isSabhasadMember, problemType, requestedAt = new Date() }) {
  const normalizedProblemType = problemType === "emergency" ? "emergency" : "normal";

  if (!isSabhasadMember) {
    return 500;
  }

  const day = isDayTime(requestedAt);

  if (day) {
    return normalizedProblemType === "emergency" ? 350 : 250;
  }

  return normalizedProblemType === "emergency" ? 400 : 300;
}

module.exports = {
  isDayTime,
  calculateVisitFee,
};
