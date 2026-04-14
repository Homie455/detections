import React, { useRef, useState } from "react";

const API_URL = "http://localhost:8000/api/predict";

export default function App() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [prediction, setPrediction] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setError("Будь ласка, обери файл зображення.");
      return;
    }

    setError("");
    setPrediction(null);
    setFile(selectedFile);
    setImageUrl(URL.createObjectURL(selectedFile));
  };

  const handlePredict = async () => {
    if (!file) {
      setError("Спочатку завантаж зображення.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Не вдалося отримати відповідь від сервера");
      }

      const data = await response.json();
      setPrediction(data);
    } catch (err) {
      setError("Помилка під час аналізу. Перевір, чи запущений бекенд на localhost:8000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Детекція дефектів фотоелектричних модулів</h1>
        <p style={styles.subtitle}>
          Завантаж тепловізійне зображення та отримай розмічене зображення з виявленими дефектами.
        </p>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>1. Завантаження зображення</h2>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          <button style={styles.button} onClick={() => inputRef.current?.click()}>
            Обрати файл
          </button>

          {file && <p style={styles.fileName}>Файл: {file.name}</p>}

          <button
            style={{ ...styles.button, ...styles.predictButton }}
            onClick={handlePredict}
            disabled={loading}
          >
            {loading ? "Аналіз виконується..." : "2. Запустити аналіз"}
          </button>

          {error && <p style={styles.error}>{error}</p>}
        </div>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Початкове зображення</h2>
            <div style={styles.previewBox}>
              {imageUrl ? (
                <img src={imageUrl} alt="preview" style={styles.previewImage} />
              ) : (
                <p style={styles.placeholder}>Тут з’явиться вибране зображення</p>
              )}
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Розмічене зображення</h2>
            <div style={styles.previewBox}>
              {prediction?.annotated_image ? (
                <img
                  src={`data:image/png;base64,${prediction.annotated_image}`}
                  alt="annotated"
                  style={styles.previewImage}
                />
              ) : (
                <p style={styles.placeholder}>
                  Після аналізу тут з’явиться зображення з рамками
                </p>
              )}
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Результати детекції</h2>

          {!prediction ? (
            <p style={styles.placeholder}>Після аналізу тут з’являться результати</p>
          ) : (
            <div>
              <p style={styles.resultLine}>
                <strong>Кількість знайдених дефектів:</strong> {prediction.count}
              </p>

              {!prediction.detections || prediction.detections.length === 0 ? (
                <p style={styles.resultLine}>Дефекти не знайдено.</p>
              ) : (
                <ol style={styles.top5List}>
                  {prediction.detections.map((item, index) => (
                    <li key={index} style={styles.top5Item}>
                      <div>
                        <strong>{item.label}</strong> — {(item.confidence * 100).toFixed(2)}%
                      </div>
                      <div style={styles.bboxText}>
                        x1: {item.bbox.x1}, y1: {item.bbox.y1}, x2: {item.bbox.x2}, y2: {item.bbox.y2}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0f172a",
    color: "#e2e8f0",
    fontFamily: "Arial, sans-serif",
    padding: "30px 20px",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  title: {
    fontSize: "32px",
    marginBottom: "10px",
  },
  subtitle: {
    color: "#94a3b8",
    marginBottom: "24px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },
  card: {
    background: "#111827",
    border: "1px solid #334155",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "20px",
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: "16px",
    fontSize: "22px",
  },
  button: {
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    cursor: "pointer",
    fontSize: "16px",
    marginRight: "12px",
    marginBottom: "12px",
  },
  predictButton: {
    background: "#ea580c",
  },
  fileName: {
    margin: "10px 0 14px 0",
    color: "#cbd5e1",
  },
  previewBox: {
    minHeight: "320px",
    border: "1px dashed #475569",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#020617",
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  placeholder: {
    color: "#94a3b8",
    textAlign: "center",
  },
  error: {
    color: "#fca5a5",
    marginTop: "10px",
  },
  resultLine: {
    marginBottom: "12px",
    fontSize: "16px",
  },
  top5List: {
    paddingLeft: "20px",
    margin: 0,
  },
  top5Item: {
    marginBottom: "14px",
    lineHeight: 1.5,
  },
  bboxText: {
    color: "#94a3b8",
    fontSize: "14px",
    marginTop: "4px",
  },
};