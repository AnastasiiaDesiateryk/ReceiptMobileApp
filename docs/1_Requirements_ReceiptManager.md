# 📘 Requirements Document — ReceiptManager iOS App (MVP)

**Project:** Personal Expense Management  
**Author:** Anastasiia Desiateryk  
**Date:** 2025-10-09  

---

### Related Documents
[User Stories](../docs/2_User_Stories_ReceiptManager.md) · 
[Use Case Diagram](../docs/3_UseCaseDiagram.md) · 
[Project Overview](../README_ReceiptManager.md)


---

## 1. Functional Requirements

The application must provide the following features:

### Authentication
- User signs in with **email + password** (authentication service TBD).  
- Session securely persisted.  
- Each user accesses only their own receipts; no shared access in MVP.

### Capture / Upload
- User can **take a photo** or **select from photo library** using native **UIImagePickerController**.  
- Supported formats: **JPEG, PNG** (max file size 10 MB).  
- Local image preview displayed immediately after capture.

### AI Scan (OpenAI Integration)
- The app sends the captured image to the **Local OCR** to extract text from the receipt.  
- The API returns structured data `{merchant, date, total}`.  
- User can review, correct, and confirm extracted data before saving.  
- If the device is offline, the receipt is stored locally and processed later when the connection is restored.

### Save
- Receipt image stored in storage (technology TBD).  
- Metadata *(merchant, date, total, folder, user_id)* saved in a secure local or cloud database.

### Browse
- Two tabs: **Private** and **Work**.  
- Each tab displays receipts as **cards** showing thumbnail, merchant, date, and total.  
- Receipts sorted by newest first.

### View & Share
- Tapping a card opens a **full-screen image view** with all receipt details.  
- User can **share** the receipt as **PDF**.

### Lists
- Each receipt belongs to one folder: **Private** or **Work**.  
- Folder selection shown as tabs in bottom navigation.

---

## 2. Non-Functional Requirements

### User Experience
- **iOS-native design** following **Apple Human Interface Guidelines (HIG)**.  
- Large titles, smooth tab navigation, rounded cards, adaptive layout for iPhone SE → iPhone 17 Pro Max.

### Performance
- The app must load **≤ 200 receipts** in under **2 seconds**.

### Security & Privacy
- Sensitive data stored only in **encrypted local storage** or local.  
- All network communication must use **HTTPS / TLS 1.2+**.  
- AI processing via OpenAI follows **GDPR-compatible temporary data handling** (no retention).  
- **No third-party tracking or analytics** in MVP.

---

## 3. Constraints

**Time** – MVP delivery within 20 weeks.  
**Budget** – Internal resources only; no paid SDKs beyond OpenAI API usage.  
**Technology** –  
- Frontend: **React Native**  
- Backend: TBD (lightweight backend first or secure cloud storage)  
- AI Processing: **OpenAI API (HTTPS request)**  
**Testing** – Manual QA on iPhone Simulator and physical devices *(iPhone Xs / 12 / 13 / 15)*.

---

## 4. Open Questions

- Which backend solution is simplest and safest for MVP: **CloudKit**, **Firebase**, or **custom server**?  
- Which AI do we use?  
- Are there **App Store privacy disclosure** requirements for external AI APIs?  
  → If yes, include an in-app notice:  
  *“This image is processed temporarily by AI to extract text; no personal data stored.”*  
- Should the app later include **expense summaries or monthly statistics**?  

---

 *This document defines the MVP scope and establishes clear boundaries for functionality, performance, and compliance before App Store submission.*

