from pydantic import BaseModel
from typing import List, Optional

class Citation(BaseModel):
    file_name: str
    page_number: Optional[int] = None
    location_type: Optional[str] = None  # "Page" or "Row"
    location: Optional[int] = None  # Page number or Row number
    content: str

class QueryRequest(BaseModel):
    query: str
    session_id: str

class QueryResponse(BaseModel):
    answer: str
    citations: List[Citation]
    agent_type: str  # e.g., "document_qa" or "data_analysis"
