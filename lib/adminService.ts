import { db, auth } from "./firebase";
import { collection, doc, getDoc, setDoc, Timestamp } from "firebase/firestore";

export interface AdminData {
    email: string;
    phoneNumber: string;
    uid: string;
    createdAt: Timestamp;
}

/**
 * Check if a user UID exists in the Admins collection
 */
export async function isAdmin(uid: string): Promise<boolean> {
    const adminRef = doc(db, "Admins", uid);
    const adminSnap = await getDoc(adminRef);
    return adminSnap.exists();
}

/**
 * Utility to ensure the specific admin user exists in Firestore
 * This should be called after a successful login with the admin credentials
 */
export async function ensureAdminRecord(uid: string, email: string, phoneNumber: string) {
    const adminRef = doc(db, "Admins", uid);
    const adminSnap = await getDoc(adminRef);

    if (!adminSnap.exists()) {
        await setDoc(adminRef, {
            email,
            phoneNumber,
            uid,
            createdAt: Timestamp.now(),
        });
        console.log("Admin record created in Firestore");
    }
}
