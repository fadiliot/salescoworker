from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.integrations.zoho_books import ZohoBooksClient

router = APIRouter(prefix="/api/books", tags=["Zoho Books"])


@router.get("/invoices")
async def get_invoices(customer_name: Optional[str] = None, db: Session = Depends(get_db)):
    """Get all invoices from Zoho Books"""
    client = ZohoBooksClient(db)
    if not client.is_connected():
        return {"invoices": [], "message": "Zoho Books not connected — authenticate via Settings"}
    invoices = await client.get_invoices(customer_name=customer_name)
    return {"invoices": invoices, "total": len(invoices)}


@router.get("/invoices/{invoice_id}")
async def get_invoice_detail(invoice_id: str, db: Session = Depends(get_db)):
    """Get full detail of a single invoice"""
    client = ZohoBooksClient(db)
    if not client.is_connected():
        raise HTTPException(status_code=503, detail="Zoho Books not connected")
    invoice = await client.get_invoice_detail(invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"invoice": invoice}


@router.post("/invoices/{invoice_id}/send-reminder")
async def send_payment_reminder(invoice_id: str, db: Session = Depends(get_db)):
    """Send a payment reminder email for an overdue invoice"""
    client = ZohoBooksClient(db)
    if not client.is_connected():
        raise HTTPException(status_code=503, detail="Zoho Books not connected")
    result = await client.send_payment_reminder(invoice_id)
    return {"success": True, "result": result}


@router.get("/customers")
async def get_customers(db: Session = Depends(get_db)):
    """Get all customers from Zoho Books"""
    client = ZohoBooksClient(db)
    if not client.is_connected():
        return {"customers": [], "message": "Zoho Books not connected — authenticate via Settings"}
    customers = await client.get_customers()
    return {"customers": customers, "total": len(customers)}


@router.get("/customers/{customer_id}/invoices")
async def get_customer_invoices(customer_id: str, db: Session = Depends(get_db)):
    """Get all invoices for a specific customer"""
    client = ZohoBooksClient(db)
    if not client.is_connected():
        raise HTTPException(status_code=503, detail="Zoho Books not connected")
    invoices = await client.get_invoices()
    customer_invoices = [inv for inv in invoices if inv.get("customer_id") == customer_id]
    return {"invoices": customer_invoices}


@router.get("/summary")
async def get_books_summary(db: Session = Depends(get_db)):
    """Get financial summary: total outstanding, paid, overdue"""
    client = ZohoBooksClient(db)
    if not client.is_connected():
        return {"connected": False, "message": "Zoho Books not connected"}
    invoices = await client.get_invoices()
    total_revenue = sum(inv.get("total", 0) for inv in invoices)
    outstanding = sum(inv.get("balance", 0) for inv in invoices)
    paid = sum(inv.get("total", 0) for inv in invoices if inv.get("status") == "paid")
    overdue = [inv for inv in invoices if inv.get("status") == "overdue"]
    return {
        "connected": True,
        "total_revenue": total_revenue,
        "outstanding": outstanding,
        "paid": paid,
        "overdue_count": len(overdue),
        "invoice_count": len(invoices),
    }
