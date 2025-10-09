# 🧾 User Stories — ReceiptManager iOS App (MVP)

**Project:** Personal Expense Management  
**Author:** Anastasiia Desiateryk  
**Date:** 2025-10-09  

---

## US-1: Capture a Receipt  
As a **user**, I want to **take a photo of a receipt** so that **I can store and organize my expenses**.  
**Acceptance Criteria:** Camera opens; after taking a photo I see a preview; if I cancel, I return safely to the previous screen.  

---

## US-2: Upload from Gallery  
As a **user**, I want to **select an existing receipt image from my gallery** so that **I can add older receipts to my collection**.  
**Acceptance Criteria:** The image picker opens; selected photo appears in preview; cancel returns to previous view.  

---

## US-3: AI Extract & Edit  
As a **user**, I want the **app to automatically extract the store name, date, and total** so that **I type less and save time**.  
**Acceptance Criteria:** After capture, fields are prefilled by AI; I can edit and confirm before saving.  

---

## US-4: Save Receipt to Cloud  
As a **user**, I want to **save my receipt image and extracted details** so that **I can access them later from my account**.  
**Acceptance Criteria:** On save, the receipt is uploaded to storage; confirmation appears; receipt shows up in the list.  

---

## US-5: Browse by Folder  
As a **user**, I want to **separate my receipts into Private and Work folders** so that **I can easily distinguish personal from business expenses**.  
**Acceptance Criteria:** Two tabs (Private/Work); each lists only relevant receipts; switching tabs is instant.  

---

## US-6: View & Share  
As a **user**, I want to **open a saved receipt in full detail and share it** so that **I can forward it to accounting or export it**.  
**Acceptance Criteria:** Tap opens Receipt Details; shows full image and extracted info; user can share, download, or copy link.  

---

## US-7: Authenticate  
As a **user**, I want to **sign up and log in securely** so that **my data remains private and personal**.  
**Acceptance Criteria:** Email + password flow; successful login opens Home tabs; session persists securely.  

---

## US-8: Secure Session  
As a **user**, I want my **session to be stored safely** so that **no one can access my data if the device is lost or compromised**.  
**Acceptance Criteria:** Session stored in Keychain; logout clears session completely.  

---

## US-9: Offline Capture  
As a **user**, I want to **capture receipts even without an internet connection** so that **I don’t lose data when traveling or offline**.  
**Acceptance Criteria:** Photo saved locally as a draft; app syncs automatically when network becomes available.  

---

## US-10: Delete Receipt  
As a **user**, I want to **delete an unwanted or duplicate receipt** so that **I can keep my collection clean and relevant**.  
**Acceptance Criteria:** Delete button on Receipt Details; confirmation prompt shown; receipt removed from storage and list.  

---

✅ These ten user stories define the **MVP scope for ReceiptManager** — covering the complete user journey from authentication, photo capture, and AI extraction to offline saving, browsing, and sharing receipts.
