import { db, auth } from "./firebase";
import { collection, query, where, getDocs, setDoc, doc, Timestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

export interface CustomerData {
    email: string;
    phoneNumber: string;
    country: string;
    password: string; // Used for Auth, not stored in Firestore
    uid?: string;
    createdAt: Timestamp;
}

/**
 * Check if an email already exists in the Customers collection
 */
export async function checkEmailExists(email: string): Promise<boolean> {
    const customersRef = collection(db, "Customers");
    const q = query(customersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
}

/**
 * Check if a phone number already exists in the Customers collection
 */
export async function checkPhoneExists(phoneNumber: string): Promise<boolean> {
    const customersRef = collection(db, "Customers");
    const q = query(customersRef, where("phoneNumber", "==", phoneNumber));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
}

/**
 * Register a new customer in Firebase Auth and Customers collection
 */
export async function registerCustomer(data: Omit<CustomerData, "createdAt" | "uid">): Promise<string> {
    // Check if phone already exists (Auth handles email check, but Firestore check prevents duplicates in DB if Auth fails midway)
    const phoneExists = await checkPhoneExists(data.phoneNumber);
    if (phoneExists) {
        throw new Error("This phone number is already registered");
    }

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const user = userCredential.user;

    // Add customer to Firestore using Auth UID as document ID
    await setDoc(doc(db, "Customers", user.uid), {
        email: data.email,
        phoneNumber: data.phoneNumber,
        country: data.country,
        uid: user.uid,
        createdAt: Timestamp.now(),
    });

    return user.uid;
}

/**
 * Login a customer using phone number and password
 */
export async function loginWithPhone(phoneNumber: string, password: string): Promise<string> {
    // 1. Find email by phone number
    const customersRef = collection(db, "Customers");
    const q = query(customersRef, where("phoneNumber", "==", phoneNumber));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        throw new Error("Phone number not found");
    }

    const userData = querySnapshot.docs[0].data();
    const email = userData.email;

    // 2. Sign in with email and password
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user.uid;
}

