import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp,
  Timestamp,
  onSnapshot,
  where,
  limit,
  writeBatch,
  setDoc
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { Employee, EmployeeInput, OperationType, FirestoreErrorInfo, ActivityLog, UserProfile, UserRole } from './types';

import firebaseConfig from '../firebase-applet-config.json';

if (!firebaseConfig || firebaseConfig.apiKey === 'MISSING' || !firebaseConfig.apiKey) {
  console.error("CRITICAL: Firebase API Key is missing or invalid in firebase-applet-config.json");
} else {
  console.log("Firebase initialized for project:", firebaseConfig.projectId);
  // Log just the start to verify it's not the placeholder, but don't leak the whole key in logs if possible
  console.log("API Key loaded (start):", firebaseConfig.apiKey.substring(0, 5) + "...");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || '(default)');
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Analytics if supported
isSupported().then(yes => {
  if (yes) getAnalytics(app);
});

// Test Firestore connection on boot
const testConnection = async () => {
  try {
    const { doc, getDocFromServer } = await import('firebase/firestore');
    await getDocFromServer(doc(db, 'system', 'connection_test'));
  } catch (error: any) {
    if (error.message?.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or network.");
    }
  }
};
testConnection();

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const firebaseService = {
  // Auth
  async loginWithGoogle() {
    try {
      return await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login Error: ", error);
      throw error;
    }
  },

  async signUpWithEmail(email: string, pass: string, name: string, role: UserRole = 'viewer') {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(userCredential.user, { displayName: name });
      
      // Create user profile in Firestore
      await this.createUserProfile(userCredential.user.uid, {
        email,
        displayName: name,
        role
      });
      
      return userCredential;
    } catch (error) {
      console.error("Sign Up Error: ", error);
      throw error;
    }
  },

  async loginWithEmail(email: string, pass: string) {
    try {
      return await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Login Error: ", error);
      throw error;
    }
  },

  async logout() {
    return await signOut(auth);
  },

  // User Profiles
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', uid);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { uid: snapshot.id, ...snapshot.data() } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  },

  async createUserProfile(uid: string, profile: Omit<UserProfile, 'uid' | 'createdAt'>) {
    try {
      const docRef = doc(db, 'users', uid);
      await setDoc(docRef, {
        ...profile,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error creating user profile:", error);
    }
  },

  // Activity Logs
  async getActivityLogs(limitCount = 10): Promise<ActivityLog[]> {
    try {
      const q = query(
        collection(db, 'activity_logs'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      return [];
    }
  },

  // Storage
  async uploadPhoto(file: Blob | File, userId: string): Promise<string> {
    const fileName = `${Date.now()}_${userId}.jpg`;
    const storageRef = ref(storage, `employee_photos/${fileName}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  },

  // Employees CRUD
  async getEmployees(): Promise<Employee[]> {
    const path = 'employees';
    try {
      const q = query(collection(db, path), orderBy('lastName', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Employee[];
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  subscribeEmployees(callback: (employees: Employee[]) => void, onError?: (error: any) => void) {
    const path = 'employees';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    return onSnapshot(q, 
      (snapshot) => {
        const employees = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Employee[];
        callback(employees);
      },
      (error) => {
        if (onError) {
          onError(error);
        } else {
          handleFirestoreError(error, OperationType.LIST, path);
        }
      }
    );
  },

  async getEmployee(id: string): Promise<Employee | null> {
    const path = `employees/${id}`;
    try {
      const docRef = doc(db, 'employees', id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as Employee;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async createEmployee(employee: EmployeeInput): Promise<string> {
    const path = 'employees';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...employee,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await this.logActivity({
        actionType: 'CREATE',
        entityId: docRef.id,
        entityType: 'Employee',
        description: `Onboarded new employee: ${employee.firstName} ${employee.lastName}`
      });

      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return '';
    }
  },

  async updateEmployee(id: string, employee: Partial<EmployeeInput>): Promise<void> {
    const path = `employees/${id}`;
    try {
      const docRef = doc(db, 'employees', id);
      await updateDoc(docRef, {
        ...employee,
        updatedAt: serverTimestamp()
      });

      await this.logActivity({
        actionType: 'UPDATE',
        entityId: id,
        entityType: 'Employee',
        description: `Modified record for ${employee.firstName || 'Personnel'} ${employee.lastName || ''}`
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteEmployee(id: string): Promise<void> {
    const path = `employees/${id}`;
    try {
      const docRef = doc(db, 'employees', id);
      await deleteDoc(docRef);
      
      await this.logActivity({
        actionType: 'DELETE',
        entityId: id,
        entityType: 'Employee',
        description: `Permanently removed employee record: ${id}`
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Bulk Operations
  async bulkUpdateStatus(ids: string[], status: Employee['status']) {
    const batch = writeBatch(db);
    
    for (const id of ids) {
      const docRef = doc(db, 'employees', id);
      batch.update(docRef, { 
        status, 
        updatedAt: serverTimestamp() 
      });
    }

    await batch.commit();

    await this.logActivity({
      actionType: 'UPDATE',
      entityId: ids.join(','),
      entityType: 'Employee',
      description: `Bulk updated status to ${status} for ${ids.length} employees.`
    });
  },

  async bulkDelete(ids: string[]) {
    const batch = writeBatch(db);
    
    for (const id of ids) {
      const docRef = doc(db, 'employees', id);
      batch.delete(docRef);
    }

    await batch.commit();

    await this.logActivity({
      actionType: 'DELETE',
      entityId: ids.join(','),
      entityType: 'Employee',
      description: `Bulk terminated ${ids.length} employee records.`
    });
  },

  // Activity Logging
  async logActivity(log: Omit<ActivityLog, 'id' | 'timestamp' | 'userId' | 'userName'>) {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await addDoc(collection(db, 'activity_logs'), {
        ...log,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Administrator',
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  },

  subscribeActivityLogs(entityId: string | null, callback: (logs: ActivityLog[]) => void) {
    const path = 'activity_logs';
    let q;
    
    if (entityId) {
      q = query(
        collection(db, path), 
        where('entityId', '==', entityId),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
    } else {
      q = query(
        collection(db, path), 
        orderBy('timestamp', 'desc'),
        limit(20)
      );
    }

    return onSnapshot(q, 
      (snapshot) => {
        const logs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ActivityLog[];
        callback(logs);
      },
      (error) => {
        console.error("Activity Logs Subscription Error:", error);
      }
    );
  }
};
