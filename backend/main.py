from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="Gamuda AI Project Intelligence Assistant")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import UploadFile, File
import shutil
from pathlib import Path

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

from app.models.schemas import QueryRequest, QueryResponse
from app.services.rag_service import (
    ingest_document,
    query_rag,
    delete_document_from_rag,
)
from app.services.analytics_service import generate_insights, generate_cleaned_data_report


@app.post("/api/ingest")
async def upload_file(file: UploadFile = File(...)):
    file_path = UPLOAD_DIR / file.filename
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Trigger RAG Ingestion for supported formats
    if file.filename.lower().endswith((".pdf", ".csv", ".xlsx", ".xls")):
        await ingest_document(str(file_path))
        return {"filename": file.filename, "status": "processed", "path": str(file_path)}
    else:
        return {"filename": file.filename, "status": "unsupported", "message": "Supported formats: PDF, CSV, XLSX, XLS", "path": str(file_path)}


@app.delete("/api/delete/{filename}")
async def delete_file(filename: str):
    file_path = UPLOAD_DIR / filename

    # 1. Delete physical file
    if file_path.exists():
        os.remove(file_path)

    # 2. Delete from MongoDB Atlas
    await delete_document_from_rag(filename)

    return {"filename": filename, "status": "deleted"}


@app.post("/api/query", response_model=QueryResponse)
async def query_assistant(request: QueryRequest):
    # Use RAG to get the answer
    return await query_rag(request.query)


@app.post("/api/analyze/{filename}")
async def analyze_file(filename: str):
    """Analyze a file (PDF, CSV, Excel) and generate insights."""
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        return {"status": "error", "message": f"File not found: {filename}"}
    
    # Allow analysis of data files and PDFs
    if not filename.lower().endswith((".csv", ".xlsx", ".xls", ".pdf")):
        return {"status": "error", "message": "Only PDF, CSV and Excel files can be analyzed"}
    
    return await generate_insights(str(file_path), filename)


@app.get("/api/download/{filename}")
async def download_file(filename: str):
    """Download a file from the uploads directory."""
    from fastapi.responses import FileResponse
    
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        return {"status": "error", "message": f"File not found: {filename}"}
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/octet-stream"
    )


@app.post("/api/clean/{filename}")
async def clean_and_analyze_data(filename: str):
    """Clean messy data and generate financial summary report."""
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        return {"status": "error", "message": f"File not found: {filename}"}
    
    # Only allow cleaning of data files (not PDFs)
    if not filename.lower().endswith((".csv", ".xlsx", ".xls")):
        return {"status": "error", "message": "Only CSV and Excel files can be cleaned"}
    
    return await generate_cleaned_data_report(str(file_path), filename)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
