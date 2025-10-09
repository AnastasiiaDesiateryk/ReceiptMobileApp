# 📱 ReceiptManager iOS App (MVP)

**Project:** Personal Expense Management  
**Author:** Anastasiia Desiateryk  
**Date:** 2025-10-09

---

## 1. What Problem Does This Solve?

People often lose paper receipts or waste time manually typing expenses into spreadsheets.  
**ReceiptManager** solves this by letting users capture, extract, and store receipts in seconds.  
The app uses AI to identify key fields — *merchant*, *date*, and *total* — so users can quickly review and save them into secure folders (*Private* or *Work*).  
All receipts are safely stored and can be easily shared or exported later.

---

## 2. Who Are the Users?

- **Individual user (default):** captures and organizes receipts into *Private* and *Work* folders.  
- **Power user / Freelancer:** exports or shares specific receipts for reimbursement or accounting.  
- **(Future) Accountant:** receives shared receipts or monthly exports (planned for post-MVP phase).

---

## 3. Main Workflows

### 1) Capture → Extract → Save
User takes a photo or uploads from gallery → AI extracts text (merchant, date, total) → user edits → saves receipt securely.

### 2) Browse → Filter → Open
User views all saved receipts → filters between *Private* and *Work* → opens detailed view → shares or downloads if needed.

### 3) Auth → Session → Access
User signs up or logs in → session securely stored in **Keychain** → access to home tabs and all stored receipts.

---

## Summary

ReceiptKeeper provides a simple and secure way to manage expenses from your iPhone — combining **AI-powered extraction**, **cloud storage**, and **privacy-first design** in a lightweight, native SwiftUI app.
