let ioRef;

function setSocket(io) {
  ioRef = io;
}

function emitCaseUpdate(caseData) {
  if (!ioRef) {
    return;
  }

  const farmerRoomId = caseData?.farmerId?._id || caseData?.farmerId;
  const doctorRoomId = caseData?.doctorId?._id || caseData?.doctorId;

  if (farmerRoomId) {
    ioRef.to(`farmer:${farmerRoomId}`).emit("case:update", caseData);
  }

  if (doctorRoomId) {
    ioRef.to(`doctor:${doctorRoomId}`).emit("case:update", caseData);
  }

  ioRef.to("admin").emit("case:update", caseData);
}

module.exports = {
  setSocket,
  emitCaseUpdate,
};
