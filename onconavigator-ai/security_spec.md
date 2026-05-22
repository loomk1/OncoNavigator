# Security Specification

## 1. Data Invariants
- **User profile ownership:** A `/users/{userId}` record can only be created, read, or updated if the authenticated user's ID (`request.auth.uid`) matches `{userId}`.
- **Assessment ownership:** A `/assessments/{assessmentId}` record must have a `userId` field matching `request.auth.uid`. A user can only fetch, list, or write their own assessments.
- **Data integrity:** Every created/updated document must conform strictly to the validated schema structure (type, key list, size constraints, etc.).
- **Temporal integrity:** Timestamp attributes should be checked with `request.time`.

---

## 2. The "Dirty Dozen" Payloads

Here are 12 specific JSON payloads designed to try to bypass security controls, and how the rules will block them with `PERMISSION_DENIED`.

### P1: Spoof User Profile ID
An attacker tries to register under someone else's ID:
- **Path:** `/users/victim_user_123`
- **Method:** `CREATE`
- **Payload:**
  ```json
  {
    "id": "victim_user_123",
    "email": "malicious@onconavigator.edu",
    "name": "Attacker",
    "dateCreated": "May 2026"
  }
  ```
- **Result:** `PERMISSION_DENIED` (auth.uid doesn't match ID)

### P2: Inject Excessively Large string in name
Attacker tries a resource exhaustion attack (denial of wallet) with a 2MB name payload.
- **Path:** `/users/{my_id}`
- **Payload:**
  ```json
  {
    "id": "{my_id}",
    "email": "attacker@onconavigator.edu",
    "name": "A...[Repeated 100,000 times]",
    "dateCreated": "May 2026"
  }
  ```
- **Result:** `PERMISSION_DENIED` (name size bounds checked: `name.size() <= 100`)

### P3: Hijack Someone Else's Assessment
Attacker tries to view another user's oncology assessment report.
- **Path:** `/assessments/victim_assessment_abc`
- **Method:** `GET`
- **Result:** `PERMISSION_DENIED` (assessments database ownerId comparison checks against `request.auth.uid`)

### P4: Create Assessment belonging to another user ID
- **Path:** `/assessments/new_assessment_xyz`
- **Method:** `CREATE`
- **Payload:**
  ```json
  {
    "id": "new_assessment_xyz",
    "userId": "victim_user_123",
    "cancerType": "Lung Cancer",
    "riskLevel": "High",
    "analysisText": "Malicious override text",
    "explanation": "test",
    "nextSteps": [],
    "timestamp": "May 22, 2026"
  }
  ```
- **Result:** `PERMISSION_DENIED` (`incoming().userId == request.auth.uid` validation)

### P5: Missing Required Schema Fields
- **Path:** `/assessments/new_assessment_xyz`
- **Method:** `CREATE`
- **Payload:**
  ```json
  {
    "id": "new_assessment_xyz",
    "userId": "{my_id}"
  }
  ```
- **Result:** `PERMISSION_DENIED` (fails `isValidAssessment()` required field checks)

### P6: Alter Immature / Immutable Values on Update
User tries to reassume ownership of another user's report by altering `userId` after creation.
- **Path:** `/assessments/assessment_123`
- **Method:** `UPDATE`
- **Payload:**
  ```json
  {
    "userId": "victim_user_abc"
  }
  ```
- **Result:** `PERMISSION_DENIED` (immutability check: `incoming().userId == existing().userId`)

### P7: Inject Ghost Fields (Shadow Update)
User tries to inject unapproved attributes like `isAdmin` or `role` to escalate permissions.
- **Path:** `/users/{my_id}`
- **Method:** `UPDATE`
- **Payload:**
  ```json
  {
    "name": "Attacker",
    "role": "admin",
    "isAdmin": true
  }
  ```
- **Result:** `PERMISSION_DENIED` (`affectedKeys().hasOnly(['name'])` limits update fields)

### P8: Maliciously Long ID string (ID Poisoning)
Attacker uses a 2KB garbage document ID to create a user.
- **Path:** `/users/very_long_garbage_id_repeat_1000_times...`
- **Method:** `CREATE`
- **Result:** `PERMISSION_DENIED` (`isValidId(userId)` check: length is constrained to <= 128)

### P9: Spoof Email Verified Check
User registers but auth token `email_verified` is false while requesting verified-only writes.
- **Method:** `CREATE`
- **Result:** `PERMISSION_DENIED` (`request.auth.token.email_verified == true` mandate if enforced, or custom verified scopes)

### P10: Arbitrary Unbounded Query Scraping
User tries to issue a blanket list query to get all reports without a specific index/where filter.
- **Path:** `/assessments`
- **Method:** `LIST`
- **Result:** `PERMISSION_DENIED` (`allow list: if resource.data.userId == request.auth.uid` enforces secure client query filtering)

### P11: Write Malicious Types (Value Poisoning)
User tries to change the risk level to non-enum types like booleans or arrays.
- **Path:** `/assessments/{my_assessment_id}`
- **Method:** `UPDATE`
- **Payload:**
  ```json
  {
    "riskLevel": true
  }
  ```
- **Result:** `PERMISSION_DENIED` (fails type and enum checks in `isValidAssessment()`)

### P12: Inject Large List Items
User attempts a recursive denial-of-wallet cost attack by posting a `nextSteps` list with 10,000 components.
- **Path:** `/assessments/new_assessment_xyz`
- **Method:** `CREATE`
- **Payload:**
  ```json
  {
    "nextSteps": ["large-array-elements... x 10000"]
  }
  ```
- **Result:** `PERMISSION_DENIED` (size constraints enforced `<= 10`)

---

## 3. The Test Runner Outline (`firestore.rules.test.ts`)
The `firestore.rules.test.ts` outlines our security tests that ensure everything is closed off correctly.
