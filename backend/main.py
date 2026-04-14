from io import BytesIO
import base64

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from ultralytics import YOLO

app = FastAPI(title="PVF-10 Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # для локальної розробки
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = "best.pt"  # detection-модель
model = YOLO(MODEL_PATH)


def image_to_base64(image: Image.Image) -> str:
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return encoded


@app.get("/")
def root():
    return {"message": "PVF-10 detection API is running"}


@app.post("/api/predict")
async def predict(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(BytesIO(contents)).convert("RGB")

    results = model(image)
    result = results[0]

    names = result.names
    detections = []

    if result.boxes is not None:
        for box in result.boxes:
            cls_id = int(box.cls[0].item())
            conf = float(box.conf[0].item())
            x1, y1, x2, y2 = box.xyxy[0].tolist()

            detections.append({
                "label": names[cls_id],
                "confidence": conf,
                "bbox": {
                    "x1": round(x1, 2),
                    "y1": round(y1, 2),
                    "x2": round(x2, 2),
                    "y2": round(y2, 2),
                }
            })

    # зображення з намальованими рамками
    plotted = result.plot()  # numpy array, BGR
    plotted_image = Image.fromarray(plotted[..., ::-1])  # BGR -> RGB
    annotated_image_base64 = image_to_base64(plotted_image)

    response = {
        "count": len(detections),
        "detections": detections,
        "annotated_image": annotated_image_base64,
    }

    return response