# Python Doctor Assignment Service

## Run

```bash
pip install -r requirements.txt
python doctor_assignment.py
```

Service runs at `http://localhost:8000`.

## API

### POST /assign-doctor
Request body:

```json
{
  "farmerLocation": { "lat": 22.3, "long": 73.1 },
  "problemType": "emergency"
}
```

Response:

```json
{ "doctorId": "doc_1" }
```
