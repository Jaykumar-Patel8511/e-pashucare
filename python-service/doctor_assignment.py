from flask import Flask, request, jsonify
from flask_cors import CORS
from math import radians, sin, cos, sqrt, atan2

app = Flask(__name__)
CORS(app)

# Replace with DB calls in production.
DOCTORS = [
    {"doctorId": "doc_1", "name": "Dr. Patel", "availabilityStatus": "Available", "location": {"lat": 22.3072, "long": 73.1812}},
    {"doctorId": "doc_2", "name": "Dr. Joshi", "availabilityStatus": "On Case", "location": {"lat": 23.0225, "long": 72.5714}},
    {"doctorId": "doc_3", "name": "Dr. Shah", "availabilityStatus": "Offline", "location": {"lat": 21.1702, "long": 72.8311}},
]


def haversine_distance_km(lat1, lon1, lat2, lon2):
    radius = 6371
    d_lat = radians(lat2 - lat1)
    d_lon = radians(lon2 - lon1)

    a = sin(d_lat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return radius * c


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.get("/doctors")
def list_doctors():
    return jsonify(DOCTORS)


@app.post("/assign-doctor")
def assign_doctor():
    payload = request.get_json(silent=True) or {}
    farmer_location = payload.get("farmerLocation", {})

    if "lat" not in farmer_location or "long" not in farmer_location:
        return jsonify({"message": "Invalid farmer location"}), 400

    active_doctors = [doctor for doctor in DOCTORS if doctor.get("availabilityStatus") in {"Available", "On Case"}]
    if not active_doctors:
        return jsonify({"doctorId": None, "message": "No active doctor"}), 200

    nearest = min(
        active_doctors,
        key=lambda doctor: haversine_distance_km(
            farmer_location["lat"],
            farmer_location["long"],
            doctor["location"]["lat"],
            doctor["location"]["long"],
        ),
    )

    return jsonify({"doctorId": nearest["doctorId"]})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
