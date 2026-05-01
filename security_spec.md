# Security Specification - CrewTrack

## Data Invariants
1.  **Identity Integrity**: Every `activity_log` must have a `userId` that exactly matches the authenticated user.
2.  **Relational Consistency**: An employee record must have a valid `lastName` and `department`.
3.  **Temporal Integrity**: `createdAt` and `updatedAt` must be server-backed timestamps.
4.  **Access Control**: Only authenticated users can read or write data.

## The "Dirty Dozen" Payloads

1.  **Spoofed Author (Identity Spoofing)**: Create an `activity_log` with a `userId` that belongs to someone else.
    *   Payload: `{ "actionType": "DELETE", "entityId": "...", "entityType": "Employee", "description": "Malicious delete", "userId": "ANOTHER_USER_ID", "userName": "Attacker", "timestamp": "request.time" }`
2.  **Shadow Field (Integrity Breach)**: Update an employee with an unauthorized field.
    *   Payload: `{ "firstName": "John", "isAdmin": true }`
3.  **Invalid Enum (Value Poisoning)**: Create an employee with a status not in the allowed list.
    *   Payload: `{ "status": "super-active" }`
4.  **Missing Required Fields (Incomplete Data)**: Create an employee without a `firstName`.
    *   Payload: `{ "lastName": "Doe", "email": "john@example.com" }`
5.  **Malicious ID (Resource Poisoning)**: Try to create a document with a 2MB string as ID.
    *   Payload: `setDoc(doc(db, "employees", "VERY_LONG_ID_..."), { ... })`
6.  **Immutable Field Warp (Update Gap)**: Update the `createdAt` field of an employee.
    *   Payload: `{ "createdAt": "2020-01-01T00:00:00Z" }`
7.  **Client Timestamp Swap (Temporal Spoofing)**: Use a client-side timestamp instead of `serverTimestamp()`.
    *   Payload: `{ "updatedAt": "2025-12-31T23:59:59Z" }`
8.  **Bulk Deletion Attack (Orphaned Writes)**: Attempt to delete multiple employees without logging. (Handled by rules requiring log write or atomicity).
9.  **PII Leak (Unauthorized Bulk Read)**: Querying for all employee emails without authentication.
10. **State Shortcutting (Terminal State Bypass)**: Reactivating a 'terminated' employee without proper authorization.
11. **Cost Attack (Denial of Wallet)**: Sending a field with a 1MB string for `description`.
12. **Id Poisoning (Path Variable Guard)**: Accessing a document using a non-alphanumeric ID.

## Test Runner
The following tests verify that these payloads return `PERMISSION_DENIED`.
(Refer to `firestore.rules.test.ts` for implementation details).
