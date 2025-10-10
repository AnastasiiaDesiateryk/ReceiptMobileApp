# 🧾 User Stories — ReceiptManager iOS App (MVP)

**Project:** Personal Expense Management  
**Author:** Anastasiia Desiateryk  
**Date:** 2025-10-09  


---
### User Story Index  
[US-1 Capture a Receipt](#us-1-capture-a-receipt) · 
[US-2 Upload from Gallery](#us-2-upload-from-gallery) · 
[US-3 AI Extract & Edit](#us-3-ai-extract--edit) · 
[US-4 Save Receipt to Cloud](#us-4-save-receipt-to-cloud) · 
[US-5 Browse by Folder](#us-5-browse-by-folder) · 
[US-6 View & Share](#us-6-view--share) · 
[US-7 Authenticate](#us-7-authenticate) · 
[US-8 Secure Session](#us-8-secure-session) · 
[US-9 Offline Capture](#us-9-offline-capture) · 
[US-10 Delete Receipt](#us-10-delete-receipt)


---

### Related Documents
[Requirements](../docs/1_Requirements_ReceiptManager.md) · 
[Use Case Diagram](../docs/4_UseCaseDiagram.md) · 
[README — Project Overview](../docs/README_ReceiptManager.md)

---

## US-1: Capture a Receipt  
As a **user**, I want to **take a photo of a receipt** so that **I can store and organize my expenses**.  
**Acceptance Criteria:** Camera opens; after taking a photo I see a preview; if I cancel, I return safely to the previous screen.  
<img width="439" height="893" alt="Screenshot 2025-10-10 at 09 58 38" src="https://github.com/user-attachments/assets/88fb973a-0fc9-4aa3-a90a-cbecc2a7e5e2" />
<img width="446" height="890" alt="Screenshot 2025-10-10 at 10 10 28" src="https://github.com/user-attachments/assets/a1ca5a12-7561-4df1-95c3-811aa8dc73c1" />


---

## US-2: Upload from Gallery  
As a **user**, I want to **select an existing receipt image from my gallery** so that **I can add older receipts to my collection**.  
**Acceptance Criteria:** The image picker opens; selected photo appears in preview; cancel returns to previous view.  
<img width="430" height="881" alt="Screenshot 2025-10-10 at 10 00 58" src="https://github.com/user-attachments/assets/6abebf2c-90b1-459d-b190-c61bd3e254f2" />
<img width="453" height="886" alt="Screenshot 2025-10-10 at 10 14 33" src="https://github.com/user-attachments/assets/18fda382-a20f-4f47-92d8-4fbaeb6f4810" />


---

## US-3: AI Extract & Edit  
As a **user**, I want the **app to automatically extract the store name, date, and total** so that **I type less and save time**.  
**Acceptance Criteria:** After capture, fields are prefilled by AI; I can edit and confirm before saving.  
<img width="440" height="834" alt="Screenshot 2025-10-10 at 10 17 04" src="https://github.com/user-attachments/assets/cd69647c-ca9a-46bd-8895-7c5ee04024f4" />
<img width="461" height="891" alt="Screenshot 2025-10-10 at 10 17 48" src="https://github.com/user-attachments/assets/43987b06-0d46-4455-bcd8-e2c9d72761be" />

---

## US-4: Save Receipt to Cloud  
As a **user**, I want to **save my receipt image and extracted details** so that **I can access them later from my account**.  
**Acceptance Criteria:** On save, the receipt is uploaded to storage; confirmation appears; receipt shows up in the list.  

---

## US-5: Browse by Folder  
As a **user**, I want to **separate my receipts into Private and Work folders** so that **I can easily distinguish personal from business expenses**.  
**Acceptance Criteria:** Two tabs (Private/Work); each lists only relevant receipts; switching tabs is instant.  
<img width="451" height="907" alt="Screenshot 2025-10-10 at 09 57 27" src="https://github.com/user-attachments/assets/24142e5d-1a1b-4560-a45b-a110bdcb7a2d" />

---

## US-6: View & Share  
As a **user**, I want to **open a saved receipt in full detail and share it** so that **I can forward it to accounting or export it**.  
**Acceptance Criteria:** Tap opens Receipt Details; shows full image and extracted info; user can share, download, or copy link.  
<img width="446" height="905" alt="Screenshot 2025-10-10 at 10 19 29" src="https://github.com/user-attachments/assets/67bbe800-8b8b-45ff-a05b-9122f54dbcdc" />
<img width="436" height="900" alt="Screenshot 2025-10-10 at 10 20 25" src="https://github.com/user-attachments/assets/66c3cd7e-aa09-4d0c-9ed6-812a67032957" />
<img width="434" height="883" alt="Screenshot 2025-10-10 at 10 21 24" src="https://github.com/user-attachments/assets/1e689c1b-1f7d-4e52-bda4-c67ef5e8fade" />

---

## US-7: Authenticate  
As a **user**, I want to **sign up and log in securely** so that **my data remains private and personal**.  
**Acceptance Criteria:** Email + password flow; successful login opens Home tabs; session persists securely.  
<img width="452" height="906" alt="Screenshot 2025-10-10 at 09 55 02" src="https://github.com/user-attachments/assets/d0079668-8060-4a6e-8287-795b7550056e" />


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


