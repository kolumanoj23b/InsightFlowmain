from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from app.schemas import IngestRequest, QueryRequest, DeleteRequest
from app.service import ingest_pdf, query_rag, delete_doc
import shutil
import tempfile
import os

router = APIRouter()

@router.post("/v1/ingest")
def ingest(req: IngestRequest):
    try:
        return ingest_pdf(req)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/v1/upload_ingest")
def upload_ingest(
    user_id: str = Form("anonymous"),
    project_id: str = Form("default-rag-project"),
    document_id: str = Form(...),
    file: UploadFile = File(...)
):
    try:
        fd, temp_path = tempfile.mkstemp(suffix=".pdf")
        with os.fdopen(fd, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        req = IngestRequest(
            user_id=user_id,
            project_id=project_id,
            document_id=document_id,
            file_path=temp_path,
            original_name=file.filename
        )
        res = ingest_pdf(req)
        os.remove(temp_path)
        return res
    except Exception as e:
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/v1/query")
def query(req: QueryRequest):
    try:
        return query_rag(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/v1/delete")
def delete(req: DeleteRequest):
    try:
        return delete_doc(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
