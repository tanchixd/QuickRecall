# Security Specification & Threat Model - QuickRecall

## 1. Data Invariants
1. **User Identity & PII Isolation**:
   - `/users/{userId}` documents are strictly restricted to `request.auth.uid == userId`.
   - Blanket reads or unauthenticated access are completely prohibited.
   - `id` must strictly match `request.auth.uid`.
   - `email` must match `request.auth.token.email` and `request.auth.token.email_verified == true`.
   - Profile lifetime counters (`totalQuestionsGenerated`, `totalReviewed`, `totalMastered`) must be non-negative numbers.

2. **Revision Sets Isolation (Master Gate & Relational Ownership)**:
   - Stored in subcollection `/users/{userId}/revision_sets/{setId}`.
   - Access requires `request.auth.uid == userId`.
   - Incoming payload `ownerId` must strictly match `userId` and `request.auth.uid`.
   - Document ID `setId` must pass `isValidId` (`<= 128` chars, alphanumeric and hyphens/underscores only).
   - Immutable fields: `id`, `ownerId`, `createdAt` cannot be modified during updates.
   - Volumetric boundaries: `topic` <= 200 characters; `questions` list size between 1 and 50; question strings bounded to prevent Denial of Wallet attacks.

3. **Temporal Integrity**:
   - `createdAt` must strictly equal `request.time` on creation.
   - `updatedAt` must strictly equal `request.time` on update.

---

## 2. The "Dirty Dozen" Threat Payloads (Must be rejected with PERMISSION_DENIED)

1. **Payload 1 (Identity Spoofing on User Profile)**:
   Authenticated as user `uid_alice`, attempting to write `{ id: "uid_bob", email: "bob@example.com" }` to `/users/uid_bob`.
   *Target Result:* PERMISSION_DENIED.

2. **Payload 2 (Ghost Field Privilege Escalation)**:
   Authenticated as user `uid_alice`, attempting to write `{ id: "uid_alice", email: "alice@example.com", role: "admin", isAdmin: true }` to `/users/uid_alice`.
   *Target Result:* PERMISSION_DENIED (Strict schema keys validation).

3. **Payload 3 (Unverified Email Write)**:
   User with `email_verified == false` attempting to create `/users/{userId}`.
   *Target Result:* PERMISSION_DENIED.

4. **Payload 4 (Unauthenticated Read to Profile)**:
   Unauthenticated user attempting to `get` `/users/uid_alice`.
   *Target Result:* PERMISSION_DENIED.

5. **Payload 5 (Cross-User Profile Snoop - PII Leak)**:
   Authenticated as `uid_bob`, attempting to `get` `/users/uid_alice`.
   *Target Result:* PERMISSION_DENIED.

6. **Payload 6 (Orphaned / Forged Revision Set Ownership)**:
   Authenticated as `uid_alice`, attempting to create a revision set under `/users/uid_alice/revision_sets/set_1` with `ownerId: "uid_bob"`.
   *Target Result:* PERMISSION_DENIED (Mismatched ownerId).

7. **Payload 7 (Cross-User Revision Set Tampering)**:
   Authenticated as `uid_bob`, attempting to write or update `/users/uid_alice/revision_sets/set_1`.
   *Target Result:* PERMISSION_DENIED.

8. **Payload 8 (Immutable Field Tampering)**:
   Authenticated as `uid_alice`, attempting to update `/users/uid_alice/revision_sets/set_1` with a changed `createdAt` or modified `ownerId`.
   *Target Result:* PERMISSION_DENIED.

9. **Payload 9 (Denial of Wallet - Oversized String Bomb)**:
   Attempting to create a revision set with a 1.5MB junk string in `topic`.
   *Target Result:* PERMISSION_DENIED (`topic.size() <= 200` violated).

10. **Payload 10 (Path Traversal / Malformed Document ID)**:
    Attempting to create `/users/uid_alice/revision_sets/set..%2Fhack` or an ID with 2000 characters.
    *Target Result:* PERMISSION_DENIED (`isValidId(setId)` violated).

11. **Payload 11 (Query Scraping / Unauthorized List)**:
    Authenticated as `uid_bob`, attempting to execute `getDocs(collection(db, "users/uid_alice/revision_sets"))`.
    *Target Result:* PERMISSION_DENIED.

12. **Payload 12 (Client-Forged Timestamp Attack)**:
    Attempting to set `createdAt: timestamp_in_the_past` instead of `request.time`.
    *Target Result:* PERMISSION_DENIED (`incoming().createdAt == request.time` violated).
